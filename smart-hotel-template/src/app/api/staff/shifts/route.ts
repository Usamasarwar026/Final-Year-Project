// src/app/api/staff/shifts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// ─── GET /api/staff/shifts ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const shifts = await prisma.shiftConfig.findMany({
      where:   { is_active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ shifts });
  } catch (err) {
    console.error("[GET /api/staff/shifts]", err);
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

// ─── POST /api/staff/shifts ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      start_time,
      end_time,
      color = "text-gray-700",
      bg    = "bg-gray-50 border-gray-200",
    } = await req.json();

    if (!name?.trim())   return NextResponse.json({ error: "Name is required" },       { status: 422 });
    if (!start_time)     return NextResponse.json({ error: "Start time is required" }, { status: 422 });
    if (!end_time)       return NextResponse.json({ error: "End time is required" },   { status: 422 });

    const existing = await prisma.shiftConfig.findUnique({ where: { name: name.trim() } });
    if (existing) {
      if (!existing.is_active) {
        const shift = await prisma.shiftConfig.update({
          where: { name: name.trim() },
          data:  { is_active: true, start_time, end_time, color, bg },
        });
        return NextResponse.json({ shift });
      }
      return NextResponse.json({ error: "Shift already exists" }, { status: 409 });
    }

    const shift = await prisma.shiftConfig.create({
      data: { name: name.trim(), start_time, end_time, color, bg },
    });

    return NextResponse.json({ shift }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/staff/shifts]", err);
    return NextResponse.json({ error: "Failed to create shift" }, { status: 500 });
  }
}

// ─── PATCH /api/staff/shifts ───────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, start_time, end_time, color, bg, is_active } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 422 });

    const data: Record<string, unknown> = {};
    if (name       !== undefined) data.name       = name.trim();
    if (start_time !== undefined) data.start_time = start_time;
    if (end_time   !== undefined) data.end_time   = end_time;
    if (color      !== undefined) data.color      = color;
    if (bg         !== undefined) data.bg         = bg;
    if (is_active  !== undefined) data.is_active  = is_active;

    const shift = await prisma.shiftConfig.update({ where: { id }, data });
    return NextResponse.json({ shift });
  } catch (err) {
    console.error("[PATCH /api/staff/shifts]", err);
    return NextResponse.json({ error: "Failed to update shift" }, { status: 500 });
  }
}

// ─── DELETE /api/staff/shifts — soft delete ────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(new URL(req.url).searchParams.get("id") ?? "");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 422 });

    const count = await prisma.staff.count({ where: { shift_id: id, is_active: true } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${count} active staff assigned to this shift` },
        { status: 409 }
      );
    }

    await prisma.shiftConfig.update({ where: { id }, data: { is_active: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 });
  }
}