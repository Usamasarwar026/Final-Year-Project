// src/app/api/kitchen/tasks/route.ts - Update GET to filter by staff_id

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const staffId = searchParams.get("staff_id");

    const whereClause: any = {};

    // If staff_id is provided, filter by that staff
    if (staffId) {
      whereClause.assigned_to = parseInt(staffId);
    } else if (session.user.role === "STAFF") {
      // If staff role and no staff_id param, get their own tasks
      const staffProfile = await prisma.staff.findUnique({
        where: { user_id: session.user.id },
      });
      if (staffProfile) {
        whereClause.assigned_to = staffProfile.staff_id;
      }
    }

    if (status) {
      whereClause.status = status;
    }

    const tasks = await prisma.kitchenTask.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            items: {
              include: {
                foodItem: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            timelines: {
              orderBy: { created_at: "asc" },
            },
          },
        },
        assignedStaff: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      tasks: tasks.map((t) => ({
        ...t,
        order: t.order ? {
          ...t.order,
          total_amount: Number(t.order.total_amount),
          items: t.order.items.map((i) => ({
            ...i,
            price: Number(i.price),
            subtotal: Number(i.subtotal),
          })),
        } : null,
      })),
    });
  } catch (err) {
    console.error("[GET /api/kitchen/tasks]", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = parseInt(params.id);
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
        return NextResponse.json({ error: "Unauthorized - This task is not assigned to you" }, { status: 401 });
      }
    }

    let nextOrderStatus: string | null = null;
    const updateData: any = { status };

    // Update timestamps based on status
    if (status === "InProgress") {
      nextOrderStatus = "OutForDelivery";
      updateData.started_at = new Date();
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
        
        if (nextOrderStatus === "OutForDelivery") {
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
            notes: `Delivery status updated to ${status === "InProgress" ? "Out for Delivery" : "Delivered"} by ${session.user.name || "Staff"}`,
            created_by: session.user.id,
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