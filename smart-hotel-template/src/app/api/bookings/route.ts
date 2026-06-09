// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// ─── GET /api/bookings ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const isAdminOrStaff = session.user.role === "ADMIN" || session.user.role === "STAFF";
  const where = isAdminOrStaff ? {} : { user_id: session.user.id };



    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phoneNumber: true } },
        room: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Parse JSON fields
    const parsed = bookings.map(serializeBooking);
    return NextResponse.json({ bookings: parsed });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

// ─── POST /api/bookings ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      room_id,
      check_in_date,
      check_out_date,
      special_requests,
      user_id,   // admin passes this
      source,
    } = body;

    // Validate required
    if (!room_id || !check_in_date || !check_out_date) {
      return NextResponse.json({ error: "room_id, check_in_date, check_out_date are required" }, { status: 422 });
    }

    const ciDate  = new Date(check_in_date);
    const coDate  = new Date(check_out_date);
    if (ciDate >= coDate) {
      return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 422 });
    }

    // Determine customer
    const bookingUserId = session.user.role === "ADMIN" && user_id ? user_id : session.user.id;

    // Check room exists
    const room = await prisma.room.findUnique({ where: { room_id: Number(room_id) } });
    if (!room || !room.is_active) {
      return NextResponse.json({ error: "Room not found or inactive" }, { status: 404 });
    }
    if (room.status === "Maintenance") {
      return NextResponse.json({ error: "Room is under maintenance" }, { status: 409 });
    }

    // Conflict check
    const conflict = await prisma.booking.findFirst({
      where: {
        room_id:       Number(room_id),
        status:        { in: ["Pending", "Confirmed", "CheckedIn"] },
        check_in_date: { lt: coDate },
        check_out_date:{ gt: ciDate },
      },
    });
    if (conflict) {
      return NextResponse.json({ error: "Room not available for selected dates" }, { status: 409 });
    }

    // Calculate nights + total
    const nights = Math.round((coDate.getTime() - ciDate.getTime()) / 86_400_000);
    const total  = Number(room.price_per_night) * nights;

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          user_id:          bookingUserId,
          room_id:          Number(room_id),
          check_in_date:    ciDate,
          check_out_date:   coDate,
          status:           session.user.role === "ADMIN" ? "Confirmed" : "Pending",
          total_nights:     nights,
          total_amount:     total,
          special_requests: special_requests || null,
          source:           source ?? (session.user.role === "ADMIN" ? "ADMIN" : "CUSTOMER"),
        },
        include: {
          user: { select: { id: true, name: true, email: true, phoneNumber: true } },
          room: true,
        },
      });

      // Update room status
      await tx.room.update({
        where: { room_id: Number(room_id) },
        data:  { status: "Reserved" },
      });

      return b;
    });

    // Create background notifications
    try {
      const { createNotification } = await import("@/services/notificationService");
      
      if (session.user.role === "ADMIN") {
        // Notify the customer that the admin created/confirmed a booking for them
        await createNotification({
          title: "Booking Confirmed",
          message: `Your booking for Room ${booking.room?.room_number} from ${ciDate.toLocaleDateString()} to ${coDate.toLocaleDateString()} has been confirmed.`,
          type: "booking",
          priority: "Medium",
          module: "booking",
          reference_id: String(booking.booking_id),
          recipient_user_id: bookingUserId,
          sender_user_id: session.user.id,
        });
        
        // Notify the admin role as well (Dashboard visibility)
        await createNotification({
          title: "Booking Created",
          message: `Booking for Room ${booking.room?.room_number} has been created and confirmed by Admin.`,
          type: "booking",
          priority: "Low",
          module: "booking",
          reference_id: String(booking.booking_id),
          role_target: "ADMIN",
          sender_user_id: session.user.id,
        });
      } else {
        // Customer created booking -> Notify Customer, ADMIN and STAFF
        await createNotification({
          title: "Booking Request Submitted",
          message: `Your booking request for Room ${booking.room?.room_number} from ${ciDate.toLocaleDateString()} to ${coDate.toLocaleDateString()} has been submitted successfully.`,
          type: "booking",
          priority: "Medium",
          module: "booking",
          reference_id: String(booking.booking_id),
          recipient_user_id: bookingUserId,
          sender_user_id: session.user.id,
        });
        await createNotification({
          title: "New Booking Request",
          message: `${booking.user?.name || "A guest"} has requested Room ${booking.room?.room_number} from ${ciDate.toLocaleDateString()} to ${coDate.toLocaleDateString()}.`,
          type: "booking",
          priority: "High",
          module: "booking",
          reference_id: String(booking.booking_id),
          role_target: "ADMIN",
          sender_user_id: session.user.id,
        });
        await createNotification({
          title: "New Booking Request",
          message: `${booking.user?.name || "A guest"} has requested Room ${booking.room?.room_number} from ${ciDate.toLocaleDateString()} to ${coDate.toLocaleDateString()}.`,
          type: "booking",
          priority: "High",
          module: "booking",
          reference_id: String(booking.booking_id),
          role_target: "STAFF",
          sender_user_id: session.user.id,
        });
      }
    } catch (notifErr) {
      console.error("[POST /api/bookings] Notification trigger failed:", notifErr);
    }

    return NextResponse.json({ booking: serializeBooking(booking) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

// ─── GET /api/bookings/available-rooms ────────────────────────────────────
// This lives in a separate route file: /api/bookings/available-rooms/route.ts
// (shown below in available-rooms/route.ts)

// ─── Serialize helper ──────────────────────────────────────────────────────
function serializeBooking(b: any) {
  return {
    ...b,
    total_amount: Number(b.total_amount),
    room: b.room
      ? {
          ...b.room,
          price_per_night: Number(b.room.price_per_night),
          amenities: parseJson(b.room.amenities),
          photos:    parseJson(b.room.photos),
        }
      : null,
  };
}

function parseJson(val: unknown): unknown {
  if (val === null || val === undefined) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return val;
}