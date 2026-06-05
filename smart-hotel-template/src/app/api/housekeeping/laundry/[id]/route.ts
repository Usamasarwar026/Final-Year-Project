// src/app/api/housekeeping/laundry/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

type Params = { params: Promise<{ id: string }> };

// ─── PATCH /api/housekeeping/laundry/[id] ─────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, charge_amount, returned_at } = await req.json();

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (charge_amount !== undefined)
      data.charge_amount = charge_amount ? Number(charge_amount) : null;
    if (status === "Returned") {
      data.returned_at = returned_at ? new Date(returned_at) : new Date();
    }
    if (status === "Sent" && !data.returned_at) {
      data.sent_at = new Date();
    }

    const { id } = await params;
    const record = await prisma.laundryRecord.update({
      where: { laundry_id: parseInt(id) },
      data,
      include: {
        room: { select: { room_number: true } },
        booking: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      record: {
        ...record,
        charge_amount: record.charge_amount
          ? Number(record.charge_amount)
          : null,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/housekeeping/laundry/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update laundry record" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/housekeeping/laundry/[id] ────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;

    await prisma.laundryRecord.delete({ where: { laundry_id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 },
    );
  }
}
