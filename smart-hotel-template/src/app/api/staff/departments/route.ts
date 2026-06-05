// src/app/api/staff/departments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// ─── GET /api/staff/departments ────────────────────────────────────────────────
export async function GET() {
  try {
    const depts = await prisma.departmentConfig.findMany({
      where:   { is_active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ departments: depts });
  } catch (err) {
    console.error("[GET /api/staff/departments]", err);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

// ─── POST /api/staff/departments — create ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 422 });
    }

    const existing = await prisma.departmentConfig.findUnique({ where: { name: name.trim() } });
    if (existing) {
      // If soft-deleted, reactivate
      if (!existing.is_active) {
        const dept = await prisma.departmentConfig.update({
          where: { name: name.trim() },
          data:  { is_active: true },
        });
        return NextResponse.json({ department: dept });
      }
      return NextResponse.json({ error: "Department already exists" }, { status: 409 });
    }

    const dept = await prisma.departmentConfig.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ department: dept }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/staff/departments]", err);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

// ─── PATCH /api/staff/departments — update (send id in body) ──────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, icon, color, bg, is_active } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 422 });

    const data: Record<string, unknown> = {};
    if (name      !== undefined) data.name      = name.trim();
    if (icon      !== undefined) data.icon      = icon;
    if (color     !== undefined) data.color     = color;
    if (bg        !== undefined) data.bg        = bg;
    if (is_active !== undefined) data.is_active = is_active;

    const dept = await prisma.departmentConfig.update({ where: { id }, data });
    return NextResponse.json({ department: dept });
  } catch (err) {
    console.error("[PATCH /api/staff/departments]", err);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

// ─── DELETE /api/staff/departments — soft delete (send ?id=N) ─────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(new URL(req.url).searchParams.get("id") ?? "");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 422 });

    // Check if any active staff use this dept
    const count = await prisma.staff.count({ where: { department_id: id, is_active: true } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${count} active staff assigned to this department` },
        { status: 409 }
      );
    }

    await prisma.departmentConfig.update({ where: { id }, data: { is_active: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}