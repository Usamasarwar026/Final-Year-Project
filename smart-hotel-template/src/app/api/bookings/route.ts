// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// ─── GET /api/bookings ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit  = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") ?? "10")));
    const search = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status") ?? "All";
    const skip   = (page - 1) * limit;

    const isAdminOrStaff =
      (session.user as any).role === "ADMIN" ||
      (session.user as any).role === "STAFF";

    // Build where — use a plain object, not `const` so we can add props
    const where: Record<string, any> = isAdminOrStaff
      ? {}
      : { user_id: session.user.id };

    if (status && status !== "All") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { user: { name:  { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { room: { room_number: { contains: search, mode: "insensitive" } } },
      ];
      const numId = parseInt(search);
      if (!isNaN(numId)) {
        where.OR.push({ booking_id: numId });
      }
    }

    // Single $transaction — count + paginated rows in parallel
    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, phoneNumber: true },
          },
          room: true,
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const parsed = bookings.map(serializeBooking);

    return NextResponse.json({
      bookings: parsed,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

// ─── POST /api/bookings ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { room_id, check_in_date, check_out_date, special_requests, user_id, source } = body;

    if (!room_id || !check_in_date || !check_out_date) {
      return NextResponse.json(
        { error: "room_id, check_in_date, check_out_date are required" },
        { status: 422 },
      );
    }

    const ciDate = new Date(check_in_date);
    const coDate = new Date(check_out_date);
    if (ciDate >= coDate) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 422 },
      );
    }

    const bookingUserId =
      (session.user as any).role === "ADMIN" && user_id
        ? user_id
        : session.user.id;

    const room = await prisma.room.findUnique({ where: { room_id: Number(room_id) } });
    if (!room || !room.is_active)
      return NextResponse.json({ error: "Room not found or inactive" }, { status: 404 });
    if (room.status === "Maintenance")
      return NextResponse.json({ error: "Room is under maintenance" }, { status: 409 });

    const conflict = await prisma.booking.findFirst({
      where: {
        room_id: Number(room_id),
        status:  { in: ["Pending", "Confirmed", "CheckedIn"] },
        check_in_date:  { lt: coDate },
        check_out_date: { gt: ciDate },
      },
    });
    if (conflict)
      return NextResponse.json({ error: "Room not available for selected dates" }, { status: 409 });

    const nights = Math.round((coDate.getTime() - ciDate.getTime()) / 86_400_000);
    const total  = Number(room.price_per_night) * nights;

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          user_id:          bookingUserId,
          room_id:          Number(room_id),
          check_in_date:    ciDate,
          check_out_date:   coDate,
          status:           (session.user as any).role === "ADMIN" ? "Confirmed" : "Pending",
          total_nights:     nights,
          total_amount:     total,
          special_requests: special_requests || null,
          source:           source ?? ((session.user as any).role === "ADMIN" ? "ADMIN" : "CUSTOMER"),
        },
        include: {
          user: { select: { id: true, name: true, email: true, phoneNumber: true } },
          room: true,
        },
      });
      await tx.room.update({
        where: { room_id: Number(room_id) },
        data:  { status: "Reserved" },
      });
      return b;
    });

    try {
      const { createNotification } = await import("@/services/notificationService");
      if ((session.user as any).role === "ADMIN") {
        await createNotification({
          title: "Booking Confirmed",
          message: `Your booking for Room ${booking.room?.room_number} from ${ciDate.toLocaleDateString()} to ${coDate.toLocaleDateString()} has been confirmed.`,
          type: "booking", priority: "Medium", module: "booking",
          reference_id: String(booking.booking_id),
          recipient_user_id: bookingUserId,
          sender_user_id: session.user.id,
        });
        await createNotification({
          title: "Booking Created",
          message: `Booking for Room ${booking.room?.room_number} has been created and confirmed by Admin.`,
          type: "booking", priority: "Low", module: "booking",
          reference_id: String(booking.booking_id),
          role_target: "ADMIN",
          sender_user_id: session.user.id,
        });
      } else {
        await createNotification({
          title: "Booking Request Submitted",
          message: `Your booking request for Room ${booking.room?.room_number} has been submitted.`,
          type: "booking", priority: "Medium", module: "booking",
          reference_id: String(booking.booking_id),
          recipient_user_id: bookingUserId,
          sender_user_id: session.user.id,
        });
        await createNotification({
          title: "New Booking Request",
          message: `${booking.user?.name || "A guest"} has requested Room ${booking.room?.room_number}.`,
          type: "booking", priority: "High", module: "booking",
          reference_id: String(booking.booking_id),
          role_target: "ADMIN",
          sender_user_id: session.user.id,
        });
        await createNotification({
          title: "New Booking Request",
          message: `${booking.user?.name || "A guest"} has requested Room ${booking.room?.room_number}.`,
          type: "booking", priority: "High", module: "booking",
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

// ─── Serialize helper ──────────────────────────────────────────────────────
function serializeBooking(b: any) {
  return {
    ...b,
    total_amount: Number(b.total_amount),
    check_in_date:  b.check_in_date  instanceof Date ? b.check_in_date.toISOString().split("T")[0]  : b.check_in_date,
    check_out_date: b.check_out_date instanceof Date ? b.check_out_date.toISOString().split("T")[0] : b.check_out_date,
    created_at: b.created_at instanceof Date ? b.created_at.toISOString() : b.created_at,
    updated_at: b.updated_at instanceof Date ? b.updated_at.toISOString() : b.updated_at,
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