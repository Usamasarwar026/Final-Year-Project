// src/app/api/kitchen/delivery-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's deliveries
    const todayDeliveries = await prisma.foodOrder.count({
      where: {
        status: "Delivered",
        delivered_at: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Today's delivery revenue
    const todayRevenue = await prisma.foodOrder.aggregate({
      where: {
        status: "Delivered",
        delivered_at: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        total_amount: true,
      },
    });

    // Active deliveries (Assigned or OutForDelivery)
    const activeDeliveries = await prisma.foodOrder.count({
      where: {
        status: { in: ["Assigned", "OutForDelivery"] },
      },
    });

    // Average delivery time (from order placed to delivered)
    const deliveredOrders = await prisma.foodOrder.findMany({
      where: {
        status: "Delivered",
        delivered_at: { not: null },
      },
      select: {
        placed_at: true,
        delivered_at: true,
      },
    });

    let avgDeliveryTime = 0;
    if (deliveredOrders.length > 0) {
      const totalMinutes = deliveredOrders.reduce((sum, order) => {
        const placed = new Date(order.placed_at!);
        const delivered = new Date(order.delivered_at!);
        const minutes = (delivered.getTime() - placed.getTime()) / 60000;
        return sum + minutes;
      }, 0);
      avgDeliveryTime = Math.round(totalMinutes / deliveredOrders.length);
    }

    return NextResponse.json({
      stats: {
        todayDeliveries,
        todayRevenue: Number(todayRevenue._sum.total_amount || 0),
        activeDeliveries,
        avgDeliveryTime,
      },
    });
  } catch (error) {
    console.error("[GET /api/kitchen/delivery-stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery stats" },
      { status: 500 }
    );
  }
}