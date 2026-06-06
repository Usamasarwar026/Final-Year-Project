// Update src/app/api/kitchen/tasks/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

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

    // Find the task
    const task = await prisma.kitchenTask.findUnique({
      where: { id: taskId },
      include: { order: true, assignedStaff: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check authorization
    if (session.user.role === "STAFF") {
      const staffProfile = await prisma.staff.findUnique({
        where: { user_id: session.user.id },
      });
      
      if (!staffProfile || task.assigned_to !== staffProfile.staff_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let nextOrderStatus: string | null = null;
    const updateData: any = { status };

    // Update timestamps based on status
    if (status === "Accepted") {
      nextOrderStatus = "Accepted";
      updateData.started_at = new Date();
    } else if (status === "InProgress") {
      nextOrderStatus = "OutForDelivery";
    } else if (status === "Completed") {
      nextOrderStatus = "Delivered";
      updateData.completed_at = new Date();
    }

    // Update in transaction
    const updatedTask = await prisma.$transaction(async (tx) => {
      // Update task
      const resTask = await tx.kitchenTask.update({
        where: { id: taskId },
        data: updateData,
      });

      // Update order status if needed
      if (nextOrderStatus) {
        const orderUpdateData: any = { status: nextOrderStatus };
        
        if (nextOrderStatus === "Accepted") {
          orderUpdateData.accepted_at = new Date();
        } else if (nextOrderStatus === "OutForDelivery") {
          orderUpdateData.out_for_delivery_at = new Date();
        } else if (nextOrderStatus === "Delivered") {
          orderUpdateData.delivered_at = new Date();
        }

        await tx.foodOrder.update({
          where: { id: task.order_id },
          data: orderUpdateData,
        });

        // Add timeline entry
        await tx.foodOrderTimeline.create({
          data: {
            order_id: task.order_id,
            status: nextOrderStatus as any,
            notes: `Delivery status updated to ${status} by ${session.user.name || "Staff"}`,
          },
        });
      }

      return resTask;
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("[PATCH /api/kitchen/tasks/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}