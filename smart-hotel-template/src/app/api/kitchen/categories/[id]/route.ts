import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const categoryId = parseInt(id);
    if (isNaN(categoryId))
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 },
      );
    const body = await req.json();
    console.log("Received update for category", categoryId, body);
    const { name, description, active } = body;
    const category = await prisma.foodCategory.update({
      where: { id: categoryId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined
          ? { description: description?.trim() || null }
          : {}),
        ...(active !== undefined ? { active } : {}),
      },
    });

    try {
      const { createNotification } = await import("@/services/notificationService");
      await createNotification({
        title: "Kitchen Category Updated",
        message: `Kitchen category "${category.name}" has been updated.`,
        type: "kitchen",
        priority: "Low",
        module: "kitchen",
        reference_id: String(category.id),
        role_target: "ADMIN",
        sender_user_id: session.user.id,
      });
    } catch (notifErr) {
      console.error("[PATCH /api/kitchen/categories/[id]] Notification trigger failed:", notifErr);
    }

    return NextResponse.json({ category });
  } catch (err) {
    console.error("[PATCH /api/kitchen/categories/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const categoryId = parseInt(id);
    if (isNaN(categoryId))
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 },
      );
    // Check if category is used
    const count = await prisma.foodItem.count({
      where: { category_id: categoryId },
    });
    if (count > 0) {
      return NextResponse.json(
        { error: "Cannot delete category as it contains food items" },
        { status: 400 },
      );
    }
    const category = await prisma.foodCategory.findUnique({ where: { id: categoryId } });
    if (category) {
      await prisma.foodCategory.delete({ where: { id: categoryId } });
      try {
        const { createNotification } = await import("@/services/notificationService");
        await createNotification({
          title: "Kitchen Category Deleted",
          message: `Kitchen category "${category.name}" has been deleted.`,
          type: "kitchen",
          priority: "Medium",
          module: "kitchen",
          reference_id: String(categoryId),
          role_target: "ADMIN",
          sender_user_id: session.user.id,
        });
      } catch (notifErr) {
        console.error("[DELETE /api/kitchen/categories/[id]] Notification trigger failed:", notifErr);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/kitchen/categories/[id]]", err);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
