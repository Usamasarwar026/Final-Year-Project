// src/services/roomService.ts
import { prisma } from "@/database/db";
import type { Room } from "@/constant/constant";
import { Prisma } from "@/generated/prisma/client";

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

// Get room by ID
export async function getRoomById(id: number): Promise<Room | null> {
  const row = await prisma.room.findUnique({
    where: { room_id: id },
  });
  return row ? toRoom(row) : null;
}

// Get all rooms
export async function getAllRooms(): Promise<Room[]> {
  const rows = await prisma.room.findMany({
    orderBy: [{ floor: "asc" }, { room_number: "asc" }],
  });
  return rows.map(toRoom);
}

// Get rooms with pagination
export async function getRoomsPaginated(
  skip = 0,
  take = 10,
  where: any = {},
  orderBy: any = { room_number: "asc" },
): Promise<{ rooms: Room[]; total: number }> {
  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip,
      take,
      orderBy,
    }),
    prisma.room.count({ where }),
  ]);

  return {
    rooms: rooms.map(toRoom),
    total,
  };
}

// Get room stats
export async function getRoomStats() {
  const [total, available, occupied, maintenance] = await Promise.all([
    prisma.room.count(),
    prisma.room.count({ where: { status: "Available" } }),
    prisma.room.count({ where: { status: "Occupied" } }),
    prisma.room.count({ where: { status: "Maintenance" } }),
  ]);

  return { total, available, occupied, maintenance };
}

// Create room
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

  return toRoom(row);
}

// Update room
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

  if (!Object.keys(payload).length) {
    const room = await prisma.room.findUnique({ where: { room_id: id } });
    return room ? toRoom(room) : null;
  }

  const row = await prisma.room.update({
    where: { room_id: id },
    data: payload,
  });

  return toRoom(row);
}

// Delete room
export async function deleteRoom(id: number): Promise<boolean> {
  const room = await prisma.room.findUnique({ where: { room_id: id } });
  if (!room) return false;

  const bookingCount = await prisma.booking.count({
    where: { room_id: id },
  });

  if (bookingCount > 0) {
    throw new Error(
      "This room cannot be deleted because bookings already exist for it.",
    );
  }

  await prisma.room.delete({ where: { room_id: id } });
  return true;
}
