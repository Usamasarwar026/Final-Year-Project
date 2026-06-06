import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const status      = searchParams.get("status");
    const orderType   = searchParams.get("order_type");
    const search      = searchParams.get("q");
    const whereClause: any = {};
    // 1. Role-based filtering
    if (session.user.role === "CUSTOMER") {
      whereClause.user_id = session.user.id;
    } else if (session.user.role === "STAFF") {
      // Staff has permission checks
      const hasKitchen = session.user.permissions?.includes("KITCHEN_ACCESS") || session.user.permissions?.includes("KITCHEN_ORDER_PROCESS");
      const hasDelivery = session.user.permissions?.includes("DELIVERY_ACCESS");
      if (!hasKitchen && !hasDelivery) {
        return NextResponse.json({ error: "Access denied. Insufficient permissions." }, { status: 403 });
      }
      // If they only have delivery, they can only see Ready/Assigned/OutForDelivery/Delivered orders
      if (hasDelivery && !hasKitchen) {
        whereClause.status = { in: ["Ready", "Assigned", "OutForDelivery", "Delivered"] };
      }
      
    }
    // 2. Query filters
    if (status) {
      whereClause.status = status;
    }
    if (orderType) {
      whereClause.order_type = orderType;
    }
    if (search) {
      const searchNum = parseInt(search);
      whereClause.OR = [
        ...(!isNaN(searchNum) ? [{ id: searchNum }] : []),
        { customer_name: { contains: search, mode: "insensitive" } },
        { room_number:   { contains: search, mode: "insensitive" } },
        { table_number:  { contains: search, mode: "insensitive" } },
      ];
    }
    const orders = await prisma.foodOrder.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            foodItem: {
              include: {
                category: true,
              },
            },
          },
        },
        timelines: {
          orderBy: { created_at: "asc" },
        },
        tasks: {
          include: {
            assignedStaff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { placed_at: "desc" },
    });
    return NextResponse.json({
      orders: orders.map((o) => ({
        ...o,
        total_amount: Number(o.total_amount),
        items: o.items.map((i) => ({
          ...i,
          price: Number(i.price),
          subtotal: Number(i.subtotal),
        })),
      })),
    });
  } catch (err) {
    console.error("[GET /api/kitchen/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const {
      order_type,
      table_number,
      room_number: input_room_number,
      customer_name: input_customer_name,
      special_instructions,
      items,
    } = body;
    if (!order_type) return NextResponse.json({ error: "Order type is required" }, { status: 422 });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 422 });
    }
    let booking_id: number | null = null;
    let room_number: string | null = null;
    let table_number_val: string | null = null;
    let user_id: string | null = null;
    let customer_name: string = "Guest";
    // 1. Resolve delivery context
    if (session.user.role === "CUSTOMER") {
      user_id = session.user.id;
      customer_name = session.user.name || "Guest";
      if (order_type === "RoomService") {
        // Auto detect active CheckedIn booking for customer
        const activeBooking = await prisma.booking.findFirst({
          where: {
            user_id: session.user.id,
            status: "CheckedIn",
          },
          include: {
            room: true,
          },
        });
        if (!activeBooking) {
          return NextResponse.json({ error: "No active room booking (Checked-In) found for room service ordering." }, { status: 400 });
        }
        booking_id = activeBooking.booking_id;
        room_number = activeBooking.room.room_number;
      } else {
        // Restaurant/Table order
        if (!table_number) return NextResponse.json({ error: "Table number is required for restaurant orders" }, { status: 400 });
        table_number_val = table_number;
      }
    } else {
      // ADMIN / STAFF manual order entry
      customer_name = input_customer_name || "Guest";
      
      if (order_type === "RoomService") {
        if (!input_room_number) return NextResponse.json({ error: "Room number is required for Room Service orders" }, { status: 400 });
        room_number = input_room_number;
        // Try to associate with active booking in that room
        const activeBooking = await prisma.booking.findFirst({
          where: {
            room: { room_number: input_room_number },
            status: "CheckedIn",
          },
        });
        if (activeBooking) {
          booking_id = activeBooking.booking_id;
          user_id = activeBooking.user_id;
        }
      } else {
        if (!table_number) return NextResponse.json({ error: "Table number is required for restaurant orders" }, { status: 400 });
        table_number_val = table_number;
        room_number = input_room_number || null;
        if (input_room_number) {
          const activeBooking = await prisma.booking.findFirst({
            where: {
              room: { room_number: input_room_number },
              status: "CheckedIn",
            },
          });
          if (activeBooking) {
            booking_id = activeBooking.booking_id;
            user_id = activeBooking.user_id;
          }
        }
      }
    }
    // 2. Perform database transaction to create order
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];
      for (const item of items) {
        const food = await tx.foodItem.findUnique({
          where: { id: item.food_item_id },
        });
        if (!food) {
          throw new Error(`Food item ID ${item.food_item_id} not found`);
        }
        if (!food.active || !food.availability_status) {
          throw new Error(`Food item "${food.name}" is currently unavailable`);
        }
        const price = Number(food.price);
        const subtotal = price * item.quantity;
        totalAmount += subtotal;
        orderItemsData.push({
          food_item_id: item.food_item_id,
          quantity: item.quantity,
          price,
          subtotal,
          special_note: item.special_note || null,
        });
      }
      const newOrder = await tx.foodOrder.create({
        data: {
          booking_id,
          user_id,
          customer_name,
          order_type,
          table_number: table_number_val,
          room_number,
          total_amount: totalAmount,
          special_instructions: special_instructions || null,
          status: "Pending",
          items: {
            create: orderItemsData,
          },
          timelines: {
            create: {
              status: "Pending",
              notes: "Order placed successfully",
            },
          },
        },
        include: {
          items: {
            include: {
              foodItem: {
                include: {
                  category: true,
                },
              },
            },
          },
          timelines: true,
        },
      });
      return newOrder;
    });
    return NextResponse.json({
      order: {
        ...order,
        total_amount: Number(order.total_amount),
        items: order.items.map((i) => ({
          ...i,
          price: Number(i.price),
          subtotal: Number(i.subtotal),
        })),
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/kitchen/orders]", err);
    return NextResponse.json({ error: err.message || "Failed to place order" }, { status: 500 });
  }
}


