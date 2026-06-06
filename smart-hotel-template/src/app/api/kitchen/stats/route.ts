import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // 1. Gather status counts
    const totalOrders = await prisma.foodOrder.count();
    const pendingOrders = await prisma.foodOrder.count({ where: { status: "Pending" } });
    const preparingOrders = await prisma.foodOrder.count({ where: { status: "Preparing" } });
    const readyOrders = await prisma.foodOrder.count({ where: { status: "Ready" } });
    const deliveredOrders = await prisma.foodOrder.count({ where: { status: "Delivered" } });
    // 2. Revenue from Delivered orders
    const revenueSum = await prisma.foodOrder.aggregate({
      where: {
        status: "Delivered",
      },
      _sum: {
        total_amount: true,
      },
    });
    const revenue = Number(revenueSum._sum.total_amount || 0);
    // 3. Orders by Day (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrders = await prisma.foodOrder.findMany({
      where: {
        placed_at: { gte: sevenDaysAgo },
      },
      select: {
        placed_at: true,
      },
    });
    const dayMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      dayMap[key] = 0;
    }
    recentOrders.forEach((o) => {
      const key = new Date(o.placed_at).toLocaleDateString("en-US", { weekday: "short" });
      if (dayMap[key] !== undefined) {
        dayMap[key]++;
      }
    });
    const ordersByDay = Object.entries(dayMap).map(([date, count]) => ({
      date,
      count,
    }));
    // 4. Most Ordered Foods
    const orderItems = await prisma.foodOrderItem.findMany({
      include: {
        foodItem: true,
      },
    });
    const foodMap: Record<string, number> = {};
    orderItems.forEach((item) => {
      if (item.foodItem) {
        const name = item.foodItem.name;
        foodMap[name] = (foodMap[name] || 0) + item.quantity;
      }
    });
    const mostOrderedFoods = Object.entries(foodMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    // 5. Category Performance
    const categories = await prisma.foodCategory.findMany({
      include: {
        foodItems: {
          include: {
            orderItems: true,
          },
        },
      },
    });
    const categoryPerformance = categories.map((cat) => {
      let count = 0;
      let rev = 0;
      cat.foodItems.forEach((item) => {
        item.orderItems.forEach((oi) => {
          count += oi.quantity;
          rev += Number(oi.subtotal);
        });
      });
      return {
        name: cat.name,
        count,
        revenue: rev,
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    return NextResponse.json({
      stats: {
        totalOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        deliveredOrders,
        revenue,
        ordersByDay,
        mostOrderedFoods,
        categoryPerformance,
      },
    });
  } catch (err) {
    console.error("[GET /api/kitchen/stats]", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}