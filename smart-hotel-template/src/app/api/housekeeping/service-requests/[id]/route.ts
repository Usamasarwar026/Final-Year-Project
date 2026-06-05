// src/app/api/housekeeping/service-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

type Params = { params: Promise<{ id: string }> };

// ─── PATCH /api/housekeeping/service-requests/[id] ────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();
    if (!status)
      return NextResponse.json({ error: "status required" }, { status: 422 });

    const { id } = await params;
    const updated = await prisma.serviceRequest.update({
      where: { request_id: parseInt(id) },
      data: { status },
      include: {
        room: { select: { room_number: true, floor: true } },
        booking: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ request: updated });
  } catch (err) {
    console.error("[PATCH /api/housekeeping/service-requests/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/housekeeping/service-requests/[id] ──────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.serviceRequest.update({
      where: { request_id: parseInt(id) },
      data: { status: "Cancelled" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to cancel request" },
      { status: 500 },
    );
  }
}
