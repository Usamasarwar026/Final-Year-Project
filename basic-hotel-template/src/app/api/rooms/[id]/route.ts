// app/api/rooms/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getRoomById, updateRoom, deleteRoom } from "@/services/roomService"; // Fix the import path
import { Prisma } from "@/generated/prisma/client";

function adminOnly(session: any) {
  const role = session?.user?.role;   
  if (role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return null;
}

// GET /api/rooms/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const guard = adminOnly(session);
  if (guard) return guard;

  const id = Number((await params).id);
  if (isNaN(id))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const room = await getRoomById(id);
  if (!room)
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json({ room });
}

// PUT /api/rooms/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const guard = adminOnly(session);
  if (guard) return guard;

  const id = Number((await params).id);
  if (isNaN(id))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const body = await req.json();

    // Build only the fields that were actually sent
    const payload: Record<string, any> = {};

    // Only include room_number if it was explicitly sent
    // (frontend omits it when unchanged to avoid unique constraint error)
    if (body.room_number !== undefined) payload.room_number = body.room_number;
    if (body.floor !== undefined) payload.floor = Number(body.floor);
    if (body.room_type !== undefined) payload.room_type = body.room_type;
    if (body.status !== undefined) payload.status = body.status;
    if (body.price_per_night !== undefined)
      payload.price_per_night = Number(body.price_per_night);
    if (body.capacity !== undefined) payload.capacity = Number(body.capacity);
    if (body.bed_type !== undefined) payload.bed_type = body.bed_type;
    if (body.size_sqft !== undefined)
      payload.size_sqft = body.size_sqft ? Number(body.size_sqft) : null;
    if (body.description !== undefined) payload.description = body.description;
    if (body.is_active !== undefined)
      payload.is_active = Boolean(body.is_active);
    if (Array.isArray(body.amenities)) payload.amenities = body.amenities;
    if (Array.isArray(body.photos)) payload.photos = body.photos;

    const updated = await updateRoom(id, payload);
    if (!updated)
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    return NextResponse.json({ room: updated });
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    )
      return NextResponse.json(
        { error: "Room number already exists" },
        { status: 409 },
      );
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/rooms/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const guard = adminOnly(session);
  if (guard) return guard;

  const id = Number((await params).id);

  if (isNaN(id))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await deleteRoom(id);

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    console.error("DELETE ROOM ERROR =", err);

    if (err.message === "Room not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    if (
      err.message ===
      "This room cannot be deleted because bookings already exist for it."
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}