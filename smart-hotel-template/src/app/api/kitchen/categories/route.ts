import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const categories = await prisma.foodCategory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[GET /api/kitchen/categories]", err);
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
    const { name, description } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 422 });
    }
    const category = await prisma.foodCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/kitchen/categories]", err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Category name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}