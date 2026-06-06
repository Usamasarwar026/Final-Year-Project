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