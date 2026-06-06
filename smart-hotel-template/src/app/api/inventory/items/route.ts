// src/app/api/inventory/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getAllItems, createItem } from "@/services/inventoryService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const items = await getAllItems({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      isActive: isActive !== null ? isActive === "true" : true,
      search: search ?? undefined,
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/inventory/items]", err);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, category_id, unit } = body;
    if (!name || !category_id || !unit) {
      return NextResponse.json({ error: "name, category_id, unit are required" }, { status: 422 });
    }

    const item = await createItem(body);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "SKU already in use" }, { status: 409 });
    }
    console.error("[POST /api/inventory/items]", err);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
