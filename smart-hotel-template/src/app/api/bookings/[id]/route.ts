// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";
// ─── BILLING & HOUSEKEEPING IMPORTS ──────────────────────────────────────
import { generateInvoice } from "@/services/billingService";
import { onBookingCheckout } from "@/services/bookingService";

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

      // ─── BILLING INTEGRATION ──────────────────────────────────────────────
      // Automatically generate invoice on checkout
      try {
        await generateInvoice(bookingId);
      } catch (err) {
        console.error("[Billing Auto-Trigger] Failed to generate invoice:", err);
      }

      // ─── HOUSEKEEPING INTEGRATION ─────────────────────────────────────────
      // Automatically trigger housekeeping tasks
      try {
        await onBookingCheckout(bookingId);
      } catch (err) {
        console.error("[Housekeeping Auto-Trigger] Failed to trigger:", err);
      }
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

    // Trigger Notifications for booking status change
    if (status !== undefined && status !== booking.status) {
      try {
        const { createNotification } = await import("@/services/notificationService");
        
        let title = "Booking Status Updated";
        let message = `Booking ID ${bookingId} has been updated to "${status}".`;
        
        if (status === "Confirmed") {
          title = "Booking Confirmed";
          message = `Your booking for Room ${updated.room?.room_number || "N/A"} has been confirmed.`;
        } else if (status === "CheckedIn") {
          title = "Checked In Successfully";
          message = `You have successfully checked in to Room ${updated.room?.room_number || "N/A"}.`;
        } else if (status === "CheckedOut") {
          title = "Checked Out Successfully";
          message = `You have successfully checked out of Room ${updated.room?.room_number || "N/A"}.`;
        } else if (status === "Cancelled") {
          title = "Booking Cancelled";
          message = `Booking ID ${bookingId} has been cancelled.`;
        }

        // Notify guest/customer
        if (updated.user_id) {
          await createNotification({
            title,
            message,
            type: "booking",
            priority: status === "Cancelled" ? "High" : "Medium",
            module: "booking",
            reference_id: String(bookingId),
            recipient_user_id: updated.user_id,
            sender_user_id: session.user.id,
          });
        }

        // Notify admin
        await createNotification({
          title: `Booking ${status}`,
          message: `Booking ID ${bookingId} for guest ${updated.user?.name || "Guest"} has been updated to "${status}" by ${session.user.name || "User"}.`,
          type: "booking",
          priority: status === "Cancelled" ? "High" : "Medium",
          module: "booking",
          reference_id: String(bookingId),
          role_target: "ADMIN",
          sender_user_id: session.user.id,
        });

      } catch (notifErr) {
        console.error("[PATCH /api/bookings/[id]] Notification trigger failed:", notifErr);
      }
    }

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

    // Trigger notification for ADMIN
    try {
      const { createNotification } = await import("@/services/notificationService");
      await createNotification({
        title: "Booking Deleted",
        message: `Booking ID ${bookingId} has been deleted by Admin (${session.user.name || "User"}).`,
        type: "booking",
        priority: "High",
        module: "booking",
        reference_id: String(bookingId),
        role_target: "ADMIN",
        sender_user_id: session.user.id,
      });
    } catch (notifErr) {
      console.error("[DELETE /api/bookings/[id]] Notification trigger failed:", notifErr);
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
