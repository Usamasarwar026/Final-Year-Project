// src/app/api/housekeeping/laundry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";

const LAUNDRY_INCLUDE = {
  room:    { select: { room_number: true, floor: true } },
  booking: { include: { user: { select: { name: true } } } },
} as const;

// ─── GET /api/housekeeping/laundry ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const roomId = searchParams.get("roomId");

    const records = await prisma.laundryRecord.findMany({
      where: {
        ...(status ? { status }                          : {}),
        ...(roomId ? { room_id: parseInt(roomId) }       : {}),
      },
      include: LAUNDRY_INCLUDE,
      orderBy: { sent_at: "desc" },
    });

    const serialized = records.map((r) => ({
      ...r,
      charge_amount: r.charge_amount ? Number(r.charge_amount) : null,
    }));

    return NextResponse.json({ records: serialized });
  } catch (err) {
    console.error("[GET /api/housekeeping/laundry]", err);
    return NextResponse.json({ error: "Failed to fetch laundry records" }, { status: 500 });
  }
}

// ─── POST /api/housekeeping/laundry ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { room_id, booking_id, item_name, quantity, charge_amount } = await req.json();

    if (!room_id)   return NextResponse.json({ error: "room_id required" },   { status: 422 });
    if (!item_name) return NextResponse.json({ error: "item_name required" },  { status: 422 });
    if (!quantity)  return NextResponse.json({ error: "quantity required" },   { status: 422 });

    const record = await prisma.laundryRecord.create({
      data: {
        room_id:      parseInt(room_id),
        booking_id:   booking_id ? parseInt(booking_id) : null,
        item_name:    item_name.trim(),
        quantity:     parseInt(quantity),
        charge_amount: charge_amount ? Number(charge_amount) : null,
        status:       "Pending",
        sent_at:      new Date(),
      },
      include: LAUNDRY_INCLUDE,
    });

    return NextResponse.json(
      { record: { ...record, charge_amount: record.charge_amount ? Number(record.charge_amount) : null } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/housekeeping/laundry]", err);
    return NextResponse.json({ error: "Failed to create laundry record" }, { status: 500 });
  }
}