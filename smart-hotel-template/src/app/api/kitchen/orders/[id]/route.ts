import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

     // Allow both ADMIN and STAFF
    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const orderId = parseInt((await params).id);
    if (isNaN(orderId)) return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });

    const order = await prisma.foodOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { foodItem: true },
        },
        tasks: {
          include: {
            assignedStaff: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({
      ...order,
      total_amount: Number(order.total_amount),
      items: order.items.map((i: any) => ({
        ...i,
        price: Number(i.price),
        subtotal: Number(i.subtotal),
      })),
    });
  } catch (err) {
    console.error("[GET /api/kitchen/orders/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
import { FoodOrderStatus }          from "@/types/kitchen";
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orderId = parseInt((await params).id);
    if (isNaN(orderId)) return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    const body = await req.json();
    const { status, assigned_to, notes } = body;
    const order = await prisma.foodOrder.findUnique({
      where: { id: orderId },
      include: { tasks: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const isCustomer = session.user.role === "CUSTOMER";
    const isAdmin = session.user.role === "ADMIN";
    const isStaff = session.user.role === "STAFF";
    if (isCustomer) {
      if (order.user_id !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (status !== "Cancelled") {
        return NextResponse.json({ error: "Customers can only cancel orders" }, { status: 400 });
      }
      if (order.status !== "Pending") {
        return NextResponse.json({ error: "Order cannot be cancelled after acceptance" }, { status: 400 });
      }
    }
    let updatedStatus = (status || order.status) as FoodOrderStatus;
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "Accepted") {
        updateData.accepted_at = new Date();
      } else if (status === "Preparing") {
        updateData.preparing_at = new Date();
      } else if (status === "Ready") {
        updateData.ready_at = new Date();
      } else if (status === "Delivered") {
        updateData.delivered_at = new Date();
      }
    }
    // Handle delivery assignment (if assigned_to is provided)
    let assignedStaffId: number | null = null;
    if (assigned_to !== undefined && assigned_to !== null) {
      const staffId = parseInt(assigned_to);
      if (!isNaN(staffId)) {
        assignedStaffId = staffId;
        updatedStatus = "Assigned";
        updateData.status = "Assigned";
      }
    }
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. If assigned_to is provided, create KitchenTask
      if (assignedStaffId !== null) {
        // Check if task already exists
        const existingTask = await tx.kitchenTask.findFirst({
          where: { order_id: orderId },
        });
        if (existingTask) {
          await tx.kitchenTask.update({
            where: { id: existingTask.id },
            data: { assigned_to: assignedStaffId, status: "Assigned" },
          });
        } else {
          await tx.kitchenTask.create({
            data: {
              order_id: orderId,
              assigned_to: assignedStaffId,
              status: "Assigned",
            },
          });
        }
      }
      // 2. Update Order status
      const resOrder = await tx.foodOrder.update({
        where: { id: orderId },
        data: updateData,
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
      });
      // 3. Add Timeline Entry
      if (status || assigned_to) {
        let timelineNotes = notes || `Order status updated to ${updatedStatus}`;
        if (assigned_to) {
          const staffMember = await tx.staff.findUnique({
            where: { staff_id: assignedStaffId! },
            include: { user: true },
          });
          timelineNotes = `Assigned to delivery staff: ${staffMember?.user?.name || "Staff"}`;
        }
        await tx.foodOrderTimeline.create({
          data: {
            order_id: orderId,
            status: updatedStatus,
            notes: timelineNotes,
          },
        });
      }
      return resOrder;
    });

    // Trigger Notifications on Order Status Update or Delivery Assignment
    try {
      const { createNotification } = await import("@/services/notificationService");
      
      // 1. Notify customer of status change
      if (updatedOrder.user_id && status) {
        await createNotification({
          title: `Food Order ${status}`,
          message: `Your food order #${orderId} status has been updated to "${status}".`,
          type: "kitchen",
          priority: status === "Delivered" ? "Medium" : "Low",
          module: "kitchen",
          reference_id: String(orderId),
          recipient_user_id: updatedOrder.user_id,
        });
      }

      // 2. Notify assigned staff of new delivery task
      if (assigned_to !== undefined && assigned_to !== null) {
        const staffId = parseInt(assigned_to);
        const staffMember = await prisma.staff.findUnique({
          where: { staff_id: staffId },
          include: { user: true },
        });

        if (staffMember?.user?.id) {
          await createNotification({
            title: "New Delivery Assigned",
            message: `You have been assigned to deliver kitchen order #${orderId} to Room/Table ${updatedOrder.room_number || updatedOrder.table_number || "N/A"}.`,
            type: "kitchen",
            priority: "Medium",
            module: "kitchen",
            reference_id: String(orderId),
            recipient_user_id: staffMember.user.id,
          });
        }
      }
    } catch (notifErr) {
      console.error("[PATCH /api/kitchen/orders/[id]] Notification trigger failed:", notifErr);
    }

    return NextResponse.json({
      order: {
        ...updatedOrder,
        total_amount: Number(updatedOrder.total_amount),
        items: updatedOrder.items.map((i) => ({
          ...i,
          price: Number(i.price),
          subtotal: Number(i.subtotal),
        })),
      },
    });
  } catch (err) {
    console.error("[PATCH /api/kitchen/orders/[id]]", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

