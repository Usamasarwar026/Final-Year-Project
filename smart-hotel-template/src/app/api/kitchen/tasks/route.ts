import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const staffProfile = await prisma.staff.findUnique({
      where: { user_id: session.user.id },
    });
    if (!staffProfile) {
      return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const tasks = await prisma.kitchenTask.findMany({
      where: {
        assigned_to: staffProfile.staff_id,
        ...(status ? { status: status as any } : {}),
      },
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
            timelines: true,
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