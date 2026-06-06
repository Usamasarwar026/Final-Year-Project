import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";
import { KitchenTaskStatus, FoodOrderStatus } from "@/types/kitchen";
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    const staffProfile = await prisma.staff.findUnique({
      where: { user_id: session.user.id },
    });
    if (!staffProfile) {
      return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });
    }
    const task = await prisma.kitchenTask.findUnique({
      where: { id: taskId },
      include: { order: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.assigned_to !== staffProfile.staff_id) {
      return NextResponse.json({ error: "Unauthorized. Task is assigned to another staff member." }, { status: 401 });
    }
    const body = await req.json();
    const { status } = body; // Assigned, Accepted, InProgress, Completed
    let nextOrderStatus: FoodOrderStatus | null = null;
    let nextTaskStatus = status as KitchenTaskStatus;
    if (nextTaskStatus === "Accepted") {
      // Task accepted, order is now officially Accepted/Assigned
    } else if (nextTaskStatus === "InProgress") {
      // Staff has picked up, order is now OutForDelivery
      nextOrderStatus = "OutForDelivery";
    } else if (nextTaskStatus === "Completed") {
      // Staff has completed delivery, order is now Delivered
      nextOrderStatus = "Delivered";
    }
    const updatedTask = await prisma.$transaction(async (tx) => {
      // 1. Update Task
      const resTask = await tx.kitchenTask.update({
        where: { id: taskId },
        data: { status: nextTaskStatus },
      });
      // 2. Update Order
      if (nextOrderStatus) {
        const orderUpdateData: any = { status: nextOrderStatus };
        if (nextOrderStatus === "Delivered") {
          orderUpdateData.delivered_at = new Date();
        }
        await tx.foodOrder.update({
          where: { id: task.order_id },
          data: orderUpdateData,
        });
        // 3. Add Order Timeline entry
        await tx.foodOrderTimeline.create({
          data: {
            order_id: task.order_id,
            status: nextOrderStatus,
            notes: `Delivery status set to ${nextTaskStatus} by ${session.user.name || "Staff"}`,
          },
        });
      }
      return resTask;
    });
    return NextResponse.json({ task: updatedTask });
  } catch (err) {
    console.error("[PATCH /api/kitchen/tasks/[id]]", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}