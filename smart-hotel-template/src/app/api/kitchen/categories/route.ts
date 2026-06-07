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

    try {
      const { createNotification } = await import("@/services/notificationService");
      await createNotification({
        title: "Kitchen Category Created",
        message: `A new kitchen category "${category.name}" has been created.`,
        type: "kitchen",
        priority: "Low",
        module: "kitchen",
        reference_id: String(category.id),
        role_target: "ADMIN",
        sender_user_id: session.user.id,
      });
    } catch (notifErr) {
      console.error("[POST /api/kitchen/categories] Notification trigger failed:", notifErr);
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/kitchen/categories]", err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Category name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
