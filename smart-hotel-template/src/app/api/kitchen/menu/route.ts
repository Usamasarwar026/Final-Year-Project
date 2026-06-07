// app/api/kitchen/menu/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");
    const available = searchParams.get("available");
    const active = searchParams.get("active");
    const featured = searchParams.get("featured");
    const search = searchParams.get("q")?.toLowerCase();
    
    const items = await prisma.foodItem.findMany({
      where: {
        ...(categoryId ? { category_id: parseInt(categoryId) } : {}),
        ...(available === "true" ? { availability_status: true } : {}),
        ...(available === "false" ? { availability_status: false } : {}),
        ...(active === "true" ? { active: true } : {}),
        ...(active === "false" ? { active: false } : {}),
        ...(featured === "true" ? { featured: true } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { ingredients_text: { contains: search, mode: "insensitive" } },
          ]
        } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [{ category_id: "asc" }, { name: "asc" }],
    });
    
    return NextResponse.json({
      items: items.map((i) => ({
        ...i,
        price: Number(i.price),
      })),
    });
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
    const {
      name,
      category_id,
      description,
      image,
      price,
      preparation_time_minutes = 15,
      ingredients_text,
      availability_status = true,
      featured = false,
      active = true,
    } = body;
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 422 });
    }
    if (!category_id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 422 });
    }
    if (!price || Number(price) <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 422 });
    }
    
    const item = await prisma.foodItem.create({
      data: {
        name: name.trim(),
        category_id: parseInt(category_id),
        description: description?.trim() || null,
        image: image?.trim() || null,
        price: Number(price),
        preparation_time_minutes: parseInt(preparation_time_minutes) || 15,
        ingredients_text: ingredients_text?.trim() || null,
        availability_status: Boolean(availability_status),
        featured: Boolean(featured),
        active: Boolean(active),
      },
      include: {
        category: true,
      },
    });

    try {
      const { createNotification } = await import("@/services/notificationService");
      await createNotification({
        title: "Menu Item Created",
        message: `A new menu item "${item.name}" has been added to the kitchen.`,
        type: "kitchen",
        priority: "Low",
        module: "kitchen",
        reference_id: String(item.id),
        role_target: "ADMIN",
        sender_user_id: session.user.id,
      });
    } catch (notifErr) {
      console.error("[POST /api/kitchen/menu] Notification trigger failed:", notifErr);
    }

    return NextResponse.json({ item: { ...item, price: Number(item.price) } }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/kitchen/menu]", err);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}