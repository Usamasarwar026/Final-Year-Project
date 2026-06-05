// app/api/rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getAllRooms, createRoom } from "@/services/roomService";
import { Prisma } from "@/generated/prisma/client";

function adminOnly(session: any) {
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "STAFF")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const guard = adminOnly(session);
  if (guard) return guard;
  try {
    const rooms = await getAllRooms();
    return NextResponse.json({ rooms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const guard = adminOnly(session);
  if (guard) return guard;
  try {
    const body = await req.json();
    if (!body.room_number?.trim())
      return NextResponse.json(
        { error: "Room number is required" },
        { status: 400 },
      );
    if (!body.price_per_night || isNaN(Number(body.price_per_night)))
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 },
      );

    const room = await createRoom({
      room_number: body.room_number.trim(),
      floor: Number(body.floor) || 1,
      room_type: body.room_type ?? "Single",
      status: body.status ?? "Available",
      price_per_night: Number(body.price_per_night),
      capacity: Number(body.capacity) || 2,
      bed_type: body.bed_type ?? "Double",
      size_sqft: body.size_sqft ? Number(body.size_sqft) : null,
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      photos: Array.isArray(body.photos) ? body.photos : [],
      description: body.description ?? "",
      is_active: body.is_active !== false,
    });
    return NextResponse.json({ room }, { status: 201 });
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
