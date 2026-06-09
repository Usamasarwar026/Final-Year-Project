// lib/rooms/roomService.ts
import { prisma } from "@/database/db";
import type { Room } from "@/constant/constant";
import { Prisma } from "@/generated/prisma/client";

// BigInt → Number + dates → string for JSON safety
function toRoom(row: any): Room {
  return {
    room_id: Number(row.room_id),
    room_number: row.room_number,
    floor: row.floor,
    room_type: row.room_type,
    status: row.status,
    price_per_night: Number(row.price_per_night),
    capacity: row.capacity,
    bed_type: row.bed_type,
    size_sqft: row.size_sqft ?? null,
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    photos: Array.isArray(row.photos) ? row.photos : [],
    description: row.description ?? "",
    is_active: Boolean(row.is_active),
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
    updated_at: row.updated_at?.toISOString?.() ?? row.updated_at,
  };
}

export async function getAllRooms(): Promise<Room[]> {
  const rows = await prisma.room.findMany({
    orderBy: [{ floor: "asc" }, { room_number: "asc" }],
  });
  return rows.map(toRoom);
}

export async function getRoomById(id: number): Promise<Room | null> {
  const row = await prisma.room.findUnique({ where: { room_id: id } });
  return row ? toRoom(row) : null;
}

export async function createRoom(
  data: Omit<Room, "room_id" | "created_at" | "updated_at">,
): Promise<Room> {
  const row = await prisma.room.create({
    data: {
      room_number: data.room_number,
      floor: data.floor,
      room_type: data.room_type as any,
      status: data.status as any,
      price_per_night: new Prisma.Decimal(data.price_per_night),
      capacity: data.capacity,
      bed_type: data.bed_type as any,
      size_sqft: data.size_sqft ?? null,
      amenities: (data.amenities ?? []) as Prisma.InputJsonValue,
      photos: (data.photos ?? []) as Prisma.InputJsonValue,
      description: data.description ?? "",
      is_active: data.is_active,
    },
  });

  // Trigger Notification for Admin & Staff
  try {
    const { createNotification } =
      await import("../services/notificationService");
    await createNotification({
      title: "New Room Added",
      message: `Room ${data.room_number} (${data.room_type}) has been added to floor ${data.floor}.`,
      type: "room",
      priority: "Low",
      module: "room",
      reference_id: String(row.room_id),
      role_target: "ADMIN",
    });
  } catch (notifErr) {
    console.error("[createRoom] Notification trigger failed:", notifErr);
  }

  return toRoom(row);
}

export async function updateRoom(
  id: number,
  data: Partial<Omit<Room, "room_id" | "created_at" | "updated_at">>,
): Promise<Room | null> {
  const payload: Prisma.RoomUpdateInput = {};

  if (data.room_number !== undefined) payload.room_number = data.room_number;
  if (data.floor !== undefined) payload.floor = data.floor;
  if (data.room_type !== undefined) payload.room_type = data.room_type as any;
  if (data.status !== undefined) payload.status = data.status as any;
  if (data.price_per_night !== undefined)
    payload.price_per_night = new Prisma.Decimal(data.price_per_night);
  if (data.capacity !== undefined) payload.capacity = data.capacity;
  if (data.bed_type !== undefined) payload.bed_type = data.bed_type as any;
  if (data.size_sqft !== undefined) payload.size_sqft = data.size_sqft;
  if (data.description !== undefined) payload.description = data.description;
  if (data.is_active !== undefined) payload.is_active = data.is_active;
  if (data.amenities !== undefined)
    payload.amenities = data.amenities as Prisma.InputJsonValue;
  if (data.photos !== undefined)
    payload.photos = data.photos as Prisma.InputJsonValue;

  if (!Object.keys(payload).length) return getRoomById(id);

  const row = await prisma.room.update({
    where: { room_id: id },
    data: payload,
  });

  // Trigger Notification for Room Status Change
  if (data.status !== undefined) {
    try {
      const { createNotification } =
        await import("../services/notificationService");
      const isMaintenance = data.status === "Maintenance";

      await createNotification({
        title: `Room ${row.room_number} is ${data.status}`,
        message: `Room ${row.room_number} status has been updated to "${data.status}".`,
        type: isMaintenance ? "maintenance" : "room",
        priority: isMaintenance ? "High" : "Low",
        module: "room",
        reference_id: String(id),
        role_target: "ADMIN",
      });

      await createNotification({
        title: `Room ${row.room_number} is ${data.status}`,
        message: `Room ${row.room_number} status has been updated to "${data.status}".`,
        type: isMaintenance ? "maintenance" : "room",
        priority: isMaintenance ? "High" : "Low",
        module: "room",
        reference_id: String(id),
        role_target: "STAFF",
      });
    } catch (notifErr) {
      console.error("[updateRoom] Notification trigger failed:", notifErr);
    }
  }

  return toRoom(row);
}

export async function deleteRoom(id: number): Promise<boolean> {
  try {
    const room = await prisma.room.findUnique({ where: { room_id: id } });
    console.log("rooms id is here", room);
    if (!room) return false;

    const bookingCount = await prisma.booking.count({
      where: {
        room_id: id,
      },
    });

    if (bookingCount > 0) {
      throw new Error(
        "This room cannot be deleted because bookings already exist for it.",
      );
    }

    await prisma.room.delete({ where: { room_id: id } });

    // Trigger Notification for Admin
    try {
      const { createNotification } =
        await import("../services/notificationService");
      await createNotification({
        title: "Room Deleted",
        message: `Room ${room.room_number} has been deleted.`,
        type: "room",
        priority: "High",
        module: "room",
        reference_id: String(id),
        role_target: "ADMIN",
      });
    } catch (notifErr) {
      console.error("[deleteRoom] Notification trigger failed:", notifErr);
    }

    return true;
  } catch (error) {
    throw error;
  }
}
