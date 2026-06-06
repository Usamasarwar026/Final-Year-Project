// src/app/api/inventory/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getAllCategories, createCategory } from "@/services/inventoryService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const categories = await getAllCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[GET /api/inventory/categories]", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, icon } = body;
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 422 });

    const category = await createCategory({ name, description, icon });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }
    console.error("[POST /api/inventory/categories]", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
