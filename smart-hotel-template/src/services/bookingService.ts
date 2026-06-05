// src/services/bookingService.ts
import { prisma } from "@/database/db";
import type { Booking, CreateBookingPayload, UpdateBookingPayload } from "@/types/bookings";
import { Prisma } from "@/generated/prisma/client";

// ── Serializer ────────────────────────────────────────────────
function toBooking(row: any): Booking {
  return {
    booking_id:        Number(row.booking_id),
    user_id:           row.user_id,
    room_id:           Number(row.room_id),
    check_in_date:     row.check_in_date instanceof Date
                         ? row.check_in_date.toISOString().split("T")[0]
                         : row.check_in_date,
    check_out_date:    row.check_out_date instanceof Date
                         ? row.check_out_date.toISOString().split("T")[0]
                         : row.check_out_date,
    actual_check_in:   row.actual_check_in?.toISOString?.() ?? null,
    actual_check_out:  row.actual_check_out?.toISOString?.() ?? null,
    status:            row.status,
    total_nights:      row.total_nights,
    total_amount:      Number(row.total_amount),
    special_requests:  row.special_requests ?? null,
    confirmation_sent: row.confirmation_sent,
    created_at:        row.created_at?.toISOString?.() ?? row.created_at,
    updated_at:        row.updated_at?.toISOString?.() ?? row.updated_at,
    user: row.user ? {
      id:          row.user.id,
      name:        row.user.name,
      email:       row.user.email,
      phoneNumber: row.user.phoneNumber ?? null,
    } : undefined,
    room: row.room ? {
      room_id:         Number(row.room.room_id),
      room_number:     row.room.room_number,
      room_type:       row.room.room_type,
      floor:           row.room.floor,
      bed_type:        row.room.bed_type,
      price_per_night: Number(row.room.price_per_night),
      photos:          Array.isArray(row.room.photos) ? row.room.photos : [],
      capacity:        row.room.capacity,
    } : undefined,
  };
}

const INCLUDE = {
  user: { select: { id: true, name: true, email: true, phoneNumber: true } },
  room: { select: {
    room_id: true, room_number: true, room_type: true,
    floor: true, bed_type: true, price_per_night: true,
    photos: true, capacity: true,
  }},
} as const;

// ── Helpers ───────────────────────────────────────────────────
function calcNights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

// Check if room is available for date range (excluding a booking_id for updates)
export async function isRoomAvailable(
  room_id: number,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: number
): Promise<boolean> {
  const conflict = await prisma.booking.findFirst({
    where: {
      room_id,
      booking_id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status:     { in: ["Pending", "Confirmed", "CheckedIn"] as any[] },
      AND: [
        { check_in_date:  { lt: new Date(checkOut) } },
        { check_out_date: { gt: new Date(checkIn)  } },
      ],
    },
  });
  return !conflict;
}

// ── CRUD ──────────────────────────────────────────────────────
export async function getAllBookings(): Promise<Booking[]> {
  const rows = await prisma.booking.findMany({
    include: INCLUDE,
    orderBy: { created_at: "desc" },
  });
  return rows.map(toBooking);
}

export async function getBookingsByUser(userId: string): Promise<Booking[]> {
  const rows = await prisma.booking.findMany({
    where:   { user_id: userId },
    include: INCLUDE,
    orderBy: { created_at: "desc" },
  });
  return rows.map(toBooking);
}

export async function getBookingById(id: number): Promise<Booking | null> {
  const row = await prisma.booking.findUnique({
    where: { booking_id: id },
    include: INCLUDE,
  });
  return row ? toBooking(row) : null;
}

export async function createBooking(
  userId: string,
  data: CreateBookingPayload
): Promise<{ booking?: Booking; error?: string }> {
  // Availability check
  const available = await isRoomAvailable(data.room_id, data.check_in_date, data.check_out_date);
  if (!available) return { error: "Room is not available for selected dates" };

  // Get room price
  const room = await prisma.room.findUnique({ where: { room_id: data.room_id } });
  if (!room) return { error: "Room not found" };
  if (!room.is_active) return { error: "Room is not available for booking" };

  const nights = calcNights(data.check_in_date, data.check_out_date);
  const amount = Number(room.price_per_night) * nights;

  const row = await prisma.booking.create({
    data: {
      user_id:          userId,
      room_id:          data.room_id,
      check_in_date:    new Date(data.check_in_date),
      check_out_date:   new Date(data.check_out_date),
      status:           "Pending" as any,
      total_nights:     nights,
      total_amount:     new Prisma.Decimal(amount),
      special_requests: data.special_requests ?? null,
    },
    include: INCLUDE,
  });


  return { booking: toBooking(row) };
}

export async function updateBookingStatus(
  id: number,
  data: UpdateBookingPayload
): Promise<Booking | null> {
  const updateData: any = {};

  if (data.status) {
    updateData.status = data.status;

    // Handle room status side-effects
    const booking = await prisma.booking.findUnique({ where: { booking_id: id } });
    if (booking) {
      if (data.status === "CheckedIn") {
        updateData.actual_check_in = new Date();
        await prisma.room.update({
          where: { room_id: booking.room_id },
          data:  { status: "Occupied" as any },
        });
      }
      if (data.status === "CheckedOut") {
        updateData.actual_check_out = new Date();
        await prisma.room.update({
          where: { room_id: booking.room_id },
          data:  { status: "Available" as any },
        });
      }
      if (data.status === "Cancelled") {
        await prisma.room.update({
          where: { room_id: booking.room_id },
          data:  { status: "Available" as any },
        });
      }
    }
  }
  if (data.special_requests !== undefined) updateData.special_requests = data.special_requests;

  const row = await prisma.booking.update({
    where:   { booking_id: id },
    data:    updateData,
    include: INCLUDE,
  });
  return toBooking(row);
}

export async function deleteBooking(id: number): Promise<boolean> {
  try {
    const booking = await prisma.booking.findUnique({ where: { booking_id: id } });
    if (!booking) return false;
    await prisma.booking.delete({ where: { booking_id: id } });
    // Free the room if it was reserved/occupied
    if (["Pending","Confirmed","CheckedIn"].includes(booking.status as string)) {
      await prisma.room.update({
        where: { room_id: booking.room_id },
        data:  { status: "Available" as any },
      });
    }
    return true;
  } catch { return false; }
}

// Get available rooms for date range (for customer booking)
export async function getAvailableRooms(checkIn: string, checkOut: string) {
  // Find room_ids that are booked for these dates
  const conflicting = await prisma.booking.findMany({
    where: {
      status: { in: ["Pending","Confirmed","CheckedIn"] as any[] },
      AND: [
        { check_in_date:  { lt: new Date(checkOut) } },
        { check_out_date: { gt: new Date(checkIn)  } },
      ],
    },
    select: { room_id: true },
  });
  const bookedIds = conflicting.map((b) => b.room_id);

  return prisma.room.findMany({
  where: {
    is_active: true,
    status: {
      not: "Maintenance",
    },
    room_id: {
      notIn: bookedIds,
    },
  },
    orderBy: [{ floor: "asc" }, { room_number: "asc" }],
  });
}