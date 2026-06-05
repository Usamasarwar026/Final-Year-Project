// src/lib/housekeepingAutomation.ts
// Call this from booking checkout API

import { prisma } from "@/database/db";

/**
 * Call this whenever a booking is marked CheckedOut.
 * Automatically:
 *  1. Creates a Cleaning task for the room
 *  2. Marks the room as Dirty
 *  3. Sets priority to VIP if room_type is Presidential/Suite
 */
export async function onBookingCheckout(bookingId: number): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where:   { booking_id: bookingId },
      include: { room: true },
    });

    if (!booking) return;

    const isVip = ["Presidential", "Suite"].includes(booking.room.room_type);

    // Create cleaning task
    await prisma.housekeepingTask.create({
      data: {
        room_id:             booking.room_id,
        booking_id:          bookingId,
        task_type:           "Cleaning",
        priority:            isVip ? "VIP" : "High",
        status:              "Pending",
        request_description: `Post-checkout cleaning — ${booking.room.room_number}`,
        is_billable:         false,
      },
    });

    // Mark room dirty + keep status as Available (not blocking new bookings)
    await prisma.room.update({
      where: { room_id: booking.room_id },
      data:  { cleaning_status: "Dirty" },
    });

    console.log(`[Housekeeping] Auto-task created for room ${booking.room.room_number} after checkout`);
  } catch (err) {
    console.error("[onBookingCheckout]", err);
  }
}

/**
 * Call this when assigning a staff to a service request task.
 * Updates the corresponding ServiceRequest status to Assigned.
 */
export async function onTaskAssigned(taskId: number): Promise<void> {
  try {
    const task = await prisma.housekeepingTask.findUnique({ where: { task_id: taskId } });
    if (!task || !task.booking_id) return;

    if (task.task_type === "ServiceRequest") {
      await prisma.serviceRequest.updateMany({
        where: { booking_id: task.booking_id, status: "Pending" },
        data:  { status: "Assigned" },
      });
    }
  } catch (err) {
    console.error("[onTaskAssigned]", err);
  }
}