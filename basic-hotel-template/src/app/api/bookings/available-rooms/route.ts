// src/app/api/bookings/available-rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkIn  = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: "checkIn and checkOut are required" }, { status: 422 });
    }

    const ciDate = new Date(checkIn);
    const coDate = new Date(checkOut);
    if (ciDate >= coDate) {
      return NextResponse.json({ error: "checkOut must be after checkIn" }, { status: 422 });
    }

    // Find room IDs that have conflicting bookings
    const conflicting = await prisma.booking.findMany({
      where: {
        status:        { in: ["Pending", "Confirmed", "CheckedIn"] },
        check_in_date: { lt: coDate },
        check_out_date:{ gt: ciDate },
      },
      select: { room_id: true },
    });

    const bookedIds = [...new Set(conflicting.map((b) => b.room_id))];

    const rooms = await prisma.room.findMany({
      where: {
        is_active: true,
        status:    { not: "Maintenance" },
        ...(bookedIds.length > 0 ? { room_id: { notIn: bookedIds } } : {}),
      },
      orderBy: [{ floor: "asc" }, { room_number: "asc" }],
    });

    const serialized = rooms.map((r) => ({
      ...r,
      price_per_night: Number(r.price_per_night),
      amenities: parseJson(r.amenities),
      photos:    parseJson(r.photos),
    }));

    return NextResponse.json({ rooms: serialized });
  } catch (err) {
    console.error("[GET /api/bookings/available-rooms]", err);
    return NextResponse.json({ error: "Failed to fetch available rooms" }, { status: 500 });
  }
}

function parseJson(val: unknown): unknown[] {
  if (val === null || val === undefined) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}