// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

type Params = { params: Promise<{ id: string }> };

// ─── PATCH /api/bookings/[id] ──────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const bookingId = parseInt(id);
    const body = await req.json();
    const { status } = body;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: { room: true },
    });
    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Customers can only cancel their own
    if (session.user.role === "CUSTOMER") {
      if (booking.user_id !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (status !== "Cancelled") {
        return NextResponse.json(
          { error: "Customers can only cancel bookings" },
          { status: 403 },
        );
      }
      if (!["Pending", "Confirmed"].includes(booking.status)) {
        return NextResponse.json(
          { error: "Cannot cancel at this stage" },
          { status: 400 },
        );
      }
    }

    const updates: Record<string, unknown> = { status };

    // Side effects per status
    if (status === "CheckedIn") {
      updates.actual_check_in = new Date();
      await prisma.room.update({
        where: { room_id: booking.room_id },
        data: { status: "Occupied" },
      });
    }
    if (status === "CheckedOut") {
      updates.actual_check_out = new Date();
      // Room goes to Available after housekeeping; set to Available here for simplicity
      await prisma.room.update({
        where: { room_id: booking.room_id },
        data: { status: "Available" },
      });
    }
    if (status === "Cancelled") {
      if (!["Occupied", "CheckedIn"].includes(booking.room.status)) {
        await prisma.room.update({
          where: { room_id: booking.room_id },
          data: { status: "Available" },
        });
      }
    }
    if (status === "Confirmed") {
      await prisma.room.update({
        where: { room_id: booking.room_id },
        data: { status: "Reserved" },
      });
    }

    const updated = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: updates,
      include: {
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        room: true,
      },
    });

    return NextResponse.json({
      booking: {
        ...updated,
        total_amount: Number(updated.total_amount),
        room: updated.room
          ? {
              ...updated.room,
              price_per_night: Number(updated.room.price_per_night),
              amenities: toArray(updated.room.amenities),
              photos: toArray(updated.room.photos),
            }
          : null,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/bookings/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/bookings/[id] ─────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const bookingId = parseInt(id);
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
    });
    if (!booking)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (booking.status === "CheckedIn") {
      return NextResponse.json(
        { error: "Cannot delete an active check-in" },
        { status: 400 },
      );
    }

    await prisma.booking.delete({ where: { booking_id: bookingId } });

    // Free room if needed
    if (["Pending", "Confirmed"].includes(booking.status)) {
      await prisma.room.update({
        where: { room_id: booking.room_id },
        data: { status: "Available" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 },
    );
  }
}

function toArray(val: unknown): unknown[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val as string);
  } catch {
    return [];
  }
}
