import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    const body = await req.json();
    const {
      name,
      category_id,
      description,
      image,
      price,
      preparation_time_minutes,
      ingredients_text,
      availability_status,
      featured,
      active,
    } = body;
    const item = await prisma.foodItem.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(category_id !== undefined ? { category_id: parseInt(category_id) } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(image !== undefined ? { image: image?.trim() || null } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(preparation_time_minutes !== undefined ? { preparation_time_minutes: parseInt(preparation_time_minutes) } : {}),
        ...(ingredients_text !== undefined ? { ingredients_text: ingredients_text?.trim() || null } : {}),
        ...(availability_status !== undefined ? { availability_status: Boolean(availability_status) } : {}),
        ...(featured !== undefined ? { featured: Boolean(featured) } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
      include: {
        category: true,
      },
    });
    return NextResponse.json({ item: { ...item, price: Number(item.price) } });
  } catch (err) {
    console.error("[PATCH /api/kitchen/menu/[id]]", err);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    await prisma.foodItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/kitchen/menu/[id]]", err);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}