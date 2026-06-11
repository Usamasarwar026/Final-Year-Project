// app/api/rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { createRoom, getRoomsPaginated } from "@/services/roomService"; // Fix import path
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/db";

function adminOnly(session: any) {
  const role = session?.user?.role;
  if (role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guard = adminOnly(session);
    if (guard) return guard;
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'room_number';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    let where: any = {};
    
    if (search && search !== 'All') {
      where.OR = [
        { room_number: { contains: search, mode: 'insensitive' as const } },
        { room_type: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    
    if (type && type !== 'All' && type !== 'undefined') {
      where.room_type = type;
    }
    
    if (status && status !== 'All' && status !== 'undefined') {
      where.status = status;
    }
    
    // Get paginated rooms
    const { rooms, total } = await getRoomsPaginated(skip, limit, where, { [sortBy]: sortOrder });
    
    return NextResponse.json({
      rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err: any) {
    console.error('GET rooms error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guard = adminOnly(session);
    if (guard) return guard;
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.room_number?.trim()) {
      return NextResponse.json(
        { error: "Room number is required" },
        { status: 400 }
      );
    }
    
    if (!body.price_per_night || isNaN(Number(body.price_per_night))) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      );
    }

    // Check if room number already exists
    const existingRoom = await prisma.room.findUnique({
      where: { room_number: body.room_number.trim() }
    });
    
    if (existingRoom) {
      return NextResponse.json(
        { error: "Room number already exists" },
        { status: 409 }
      );
    }

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
    console.error('POST room error:', err);
    
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Room number already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}