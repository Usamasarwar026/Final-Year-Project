import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET() {
  try {
    const units = await prisma.inventoryUnit.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ units });
  } catch (err) {
    console.error("[GET /api/inventory/units]", err);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

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

    const existing = await prisma.inventoryUnit.findUnique({ where: { name: name.trim() } });
    if (existing) {
      if (!existing.is_active) {
        const unit = await prisma.inventoryUnit.update({
          where: { name: name.trim() },
          data: { is_active: true },
        });
        return NextResponse.json({ unit });
      }
      return NextResponse.json({ error: "Unit already exists" }, { status: 409 });
    }

    const unit = await prisma.inventoryUnit.create({
      data: { name: name.trim() },
    });
    return NextResponse.json({ unit }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/inventory/units]", err);
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(new URL(req.url).searchParams.get("id") ?? "");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 422 });

    await prisma.inventoryUnit.update({ where: { id }, data: { is_active: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete unit" }, { status: 500 });
  }
}