// src/app/api/kitchen/menu/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category  = searchParams.get("category");
    const available = searchParams.get("available");
    const vipOnly   = searchParams.get("vip") === "true";
    const search    = searchParams.get("q")?.toLowerCase();

    const items = await prisma.menuItem.findMany({
      where: {
        ...(category           ? { category }                         : {}),
        ...(available === "true"  ? { is_available: true }            : {}),
        ...(available === "false" ? { is_available: false }           : {}),
        ...(vipOnly               ? { is_vip_special: true }          : {}),
        ...(search ? { OR: [
          { name:        { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ]} : {}),
      },
      orderBy: [{ is_available: "desc" }, { category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ items: items.map((i) => ({ ...i, price: Number(i.price) })) });
  } catch (err) {
    console.error("[GET /api/kitchen/menu]", err);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, category, price, prep_time_minutes = 15,
            is_vegetarian = false, is_vip_special = false, is_halal = true,
            calories, image_url } = body;

    if (!name?.trim())       return NextResponse.json({ error: "Name is required" }, { status: 422 });
    if (!category)           return NextResponse.json({ error: "Category is required" }, { status: 422 });
    if (!price || price <= 0) return NextResponse.json({ error: "Valid price required" }, { status: 422 });

    const item = await prisma.menuItem.create({
      data: {
        name: name.trim(), description: description?.trim() || null, category,
        price: Number(price), prep_time_minutes: parseInt(prep_time_minutes) || 15,
        is_available: true, is_vegetarian: Boolean(is_vegetarian),
        is_vip_special: Boolean(is_vip_special), is_halal: Boolean(is_halal),
        calories: calories ? parseInt(calories) : null,
        image_url: image_url?.trim() || null,
      },
    });

    return NextResponse.json({ item: { ...item, price: Number(item.price) } }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/kitchen/menu]", err);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}