// src/app/api/kitchen/tasks/[id]/route.ts
// Works with BOTH schema versions:
//   - Old schema (no started_at/completed_at): timestamps skipped
//   - New schema (with timestamps): full tracking

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";

// Check if KitchenTask model has timestamp fields
// We detect this at runtime to stay backward-compatible
async function hasTimestampFields(): Promise<boolean> {
  try {
    // Try a safe describe — if the field doesn't exist Prisma will throw on actual use
    // We read the Prisma DMMF to check field list
    const dmmf = (prisma as any)._baseDmmf;
    const model = dmmf?.modelMap?.KitchenTask;
    if (!model) return false;
    return model.fields.some((f: any) => f.name === "started_at");
  } catch {
    return false;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = parseInt(paramId);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 422 });
    }

    // Find the task
    const task = await prisma.kitchenTask.findUnique({
      where:   { id: taskId },
      include: { order: true, assignedStaff: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Staff can only update their own assigned tasks
    if (session.user.role === "STAFF") {
      const staffProfile = await prisma.staff.findUnique({
        where: { user_id: session.user.id },
      });
      if (!staffProfile || task.assigned_to !== staffProfile.staff_id) {
        return NextResponse.json({ error: "Not your task" }, { status: 403 });
      }
    }

    // ── Determine order status transition ────────────────────────
    let nextOrderStatus: string | null = null;
    const orderTimestamps: Record<string, Date> = {};

    switch (status) {
      case "Accepted":
        nextOrderStatus = "Accepted";
        orderTimestamps.accepted_at = new Date();
        break;
      case "InProgress":
        // Delivery started → OutForDelivery on the order
        nextOrderStatus = "OutForDelivery";
        break;
      case "Completed":
        nextOrderStatus = "Delivered";
        orderTimestamps.delivered_at = new Date();
        break;
    }

    // ── Build kitchenTask update data (only valid schema fields) ─
    const kitchenTaskData: Record<string, unknown> = { status };

    // Add timestamps only if schema supports them
    const supportsTimestamps = await hasTimestampFields();
    if (supportsTimestamps) {
      if (status === "Accepted")   kitchenTaskData.started_at   = new Date();
      if (status === "Completed")  kitchenTaskData.completed_at = new Date();
    }

    // ── Transaction ──────────────────────────────────────────────
    const updatedTask = await prisma.$transaction(async (tx) => {
      // 1. Update kitchen task
      const resTask = await tx.kitchenTask.update({
        where: { id: taskId },
        data:  kitchenTaskData,
      });

      if (nextOrderStatus) {
        // 2. Update food order
        await tx.foodOrder.update({
          where: { id: task.order_id },
          data:  {
            status: nextOrderStatus as any,
            ...orderTimestamps,
          },
        });

        // 3. Timeline entry
        await tx.foodOrderTimeline.create({
          data: {
            order_id: task.order_id,
            status:   nextOrderStatus as any,
            notes:    `Delivery task ${status.toLowerCase()} by ${session.user.name ?? "Staff"}`,
          },
        });
      }

      return resTask;
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("[PATCH /api/kitchen/tasks/[id]]", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = parseInt(paramId);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const task = await prisma.kitchenTask.findUnique({
      where:   { id: taskId },
      include: {
        order: {
          include: {
            items: {
              include: {
                foodItem: { include: { category: true } },
              },
            },
            timelines: { orderBy: { created_at: "asc" } },
          },
        },
        assignedStaff: {
          include: { user: { select: { name: true, email: true, profileImage: true } } },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("[GET /api/kitchen/tasks/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}