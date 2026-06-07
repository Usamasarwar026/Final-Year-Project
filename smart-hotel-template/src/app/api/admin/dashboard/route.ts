// src/app/api/admin/dashboard/route.ts
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

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Summary KPIs Queries
    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      totalBookings,
      activeGuests,
    ] = await Promise.all([
      prisma.room.count({ where: { is_active: true } }),
      prisma.room.count({ where: { is_active: true, status: "Available" } }),
      prisma.room.count({ where: { is_active: true, status: "Occupied" } }),
      prisma.room.count({ where: { is_active: true, status: "Maintenance" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "CheckedIn" } }),
    ]);

    const invoiceStats = await prisma.billingInvoice.aggregate({
      _sum: {
        amount_paid: true,
        balance_due: true,
      },
    });

    const totalRevenue = Number(invoiceStats._sum.amount_paid || 0);
    const outstandingPayments = Number(invoiceStats._sum.balance_due || 0);

    // 2. Today's Activity Section Queries
    const [
      todayCheckIns,
      todayCheckOuts,
      pendingHousekeepingTasks,
      pendingLaundryTasks,
      pendingFoodOrders,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          check_in_date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.booking.count({
        where: {
          check_out_date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.housekeepingTask.count({
        where: {
          status: { in: ["Pending", "InProgress"] },
        },
      }),
      prisma.laundryRecord.count({
        where: {
          status: { in: ["Pending", "Sent"] },
        },
      }),
      prisma.foodOrder.count({
        where: {
          status: { in: ["Pending", "Accepted", "Preparing", "Ready", "Assigned", "OutForDelivery"] },
        },
      }),
    ]);

    // 3. Billing Overview Queries
    const [
      totalInvoices,
      paidInvoices,
      partialInvoices,
      unpaidInvoices,
    ] = await Promise.all([
      prisma.billingInvoice.count(),
      prisma.billingInvoice.count({ where: { payment_status: "Paid" } }),
      prisma.billingInvoice.count({ where: { payment_status: "Partial" } }),
      prisma.billingInvoice.count({ where: { payment_status: "Unpaid" } }),
    ]);

    // 4. Inventory Overview Queries
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { is_active: true },
      select: { quantity: true, low_stock_threshold: true },
    });

    const lowStockItems = inventoryItems.filter(
      (item) => item.quantity > 0 && item.quantity <= item.low_stock_threshold
    ).length;
    const outOfStockItems = inventoryItems.filter((item) => item.quantity <= 0).length;
    const totalInventoryItems = inventoryItems.length;

    // 5. Recent Bookings Queries
    const recentBookingsRaw = await prisma.booking.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      include: {
        user: { select: { name: true } },
        room: { select: { room_number: true } },
      },
    });

    const recentBookings = recentBookingsRaw.map((b) => ({
      booking_id: b.booking_id,
      guestName: b.user?.name || "Unknown Guest",
      roomNumber: b.room?.room_number || "N/A",
      checkIn: b.check_in_date.toISOString().split("T")[0],
      checkOut: b.check_out_date.toISOString().split("T")[0],
      status: b.status,
    }));

    // 6. Staff Overview Queries
    const [totalStaff, activeStaff, onDutyStaff] = await Promise.all([
      prisma.staff.count(),
      prisma.staff.count({ where: { is_active: true } }),
      prisma.staff.count({ where: { is_on_duty: true, is_active: true } }),
    ]);

    // 7. Charts & Trends Queries
    const roomBreakdown = await prisma.room.groupBy({
      by: ["status"],
      where: { is_active: true },
      _count: { status: true },
    });

    const roomStatuses = ["Available", "Reserved", "Occupied", "Maintenance"];
    const occupancyChart = roomStatuses.map((status) => {
      const match = roomBreakdown.find((b) => b.status === status);
      return {
        name: status,
        value: match?._count?.status || 0,
      };
    });

    // 30 Days Revenue Trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const invoicesLast30Days = await prisma.billingInvoice.findMany({
      where: {
        generated_at: { gte: thirtyDaysAgo },
      },
      select: {
        generated_at: true,
        room_charges: true,
        food_charges: true,
        service_charges: true,
        total_amount: true,
        amount_paid: true,
      },
    });

    const trendMap = new Map<
      string,
      { room_revenue: number; food_revenue: number; service_revenue: number; total_revenue: number }
    >();

    for (const inv of invoicesLast30Days) {
      const dateKey = inv.generated_at.toISOString().split("T")[0];
      const current = trendMap.get(dateKey) || {
        room_revenue: 0,
        food_revenue: 0,
        service_revenue: 0,
        total_revenue: 0,
      };
      trendMap.set(dateKey, {
        room_revenue: current.room_revenue + Number(inv.room_charges || 0),
        food_revenue: current.food_revenue + Number(inv.food_charges || 0),
        service_revenue: current.service_revenue + Number(inv.service_charges || 0),
        total_revenue: current.total_revenue + Number(inv.amount_paid || 0),
      });
    }

    const revenueTrend30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const values = trendMap.get(dateStr) || {
        room_revenue: 0,
        food_revenue: 0,
        service_revenue: 0,
        total_revenue: 0,
      };
      revenueTrend30Days.push({
        date: dateStr,
        ...values,
      });
    }

    return NextResponse.json({
      summary: {
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        totalBookings,
        activeGuests,
        totalRevenue,
        outstandingPayments,
      },
      todayActivity: {
        todayCheckIns,
        todayCheckOuts,
        pendingHousekeepingTasks,
        pendingLaundryTasks,
        pendingFoodOrders,
      },
      billing: {
        totalInvoices,
        paidInvoices,
        partialInvoices,
        unpaidInvoices,
        outstandingBalance: outstandingPayments,
      },
      inventory: {
        lowStockItems,
        outOfStockItems,
        totalInventoryItems,
      },
      recentBookings,
      staff: {
        totalStaff,
        activeStaff,
        onDutyStaff,
      },
      charts: {
        occupancyChart,
        revenueTrend: revenueTrend30Days,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/dashboard]", err);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
