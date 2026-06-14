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

    // ── Result containers ─────────────────────────────────────
    // Statement-based assembly: har module apne fields yahan
    // ASSIGN karta hai. Object literal ke andar conditional
    // commas se bachne ka yeh sabse safe tareeqa hai.
    const summary: Record<string, number> = {};
    const todayActivity: Record<string, number> = {};
    const charts: Record<string, unknown> = {};

{{#if rooms}}
    // ──────────────────────────────────────────────────────────
    // ROOMS MODULE
    // ──────────────────────────────────────────────────────────
    const [totalRooms, availableRooms, occupiedRooms, maintenanceRooms] = await Promise.all([
      prisma.room.count({ where: { is_active: true } }),
      prisma.room.count({ where: { is_active: true, status: "Available" } }),
      prisma.room.count({ where: { is_active: true, status: "Occupied" } }),
      prisma.room.count({ where: { is_active: true, status: "Maintenance" } }),
    ]);

    summary.totalRooms = totalRooms;
    summary.availableRooms = availableRooms;
    summary.occupiedRooms = occupiedRooms;
    summary.maintenanceRooms = maintenanceRooms;

    const roomBreakdown = await prisma.room.groupBy({
      by: ["status"],
      where: { is_active: true },
      _count: { status: true },
    });

    const roomStatuses = ["Available", "Reserved", "Occupied", "Maintenance"];
    charts.occupancyChart = roomStatuses.map((status) => {
      const match = roomBreakdown.find((b) => b.status === status);
      return { name: status, value: match?._count?.status || 0 };
    });
{{/if}}

{{#if booking}}
    // ──────────────────────────────────────────────────────────
    // BOOKING MODULE
    // ──────────────────────────────────────────────────────────
    const [totalBookings, activeGuests, todayCheckIns, todayCheckOuts] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "CheckedIn" } }),
      prisma.booking.count({ where: { check_in_date: { gte: todayStart, lte: todayEnd } } }),
      prisma.booking.count({ where: { check_out_date: { gte: todayStart, lte: todayEnd } } }),
    ]);

    summary.totalBookings = totalBookings;
    summary.activeGuests = activeGuests;
    todayActivity.todayCheckIns = todayCheckIns;
    todayActivity.todayCheckOuts = todayCheckOuts;

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
{{/if}}

{{#if housekeeping}}
    // ──────────────────────────────────────────────────────────
    // HOUSEKEEPING MODULE
    // ──────────────────────────────────────────────────────────
    const [pendingHousekeepingTasks, pendingLaundryTasks] = await Promise.all([
      prisma.housekeepingTask.count({ where: { status: { in: ["Pending", "InProgress"] } } }),
      prisma.laundryRecord.count({ where: { status: { in: ["Pending", "Sent"] } } }),
    ]);

    todayActivity.pendingHousekeepingTasks = pendingHousekeepingTasks;
    todayActivity.pendingLaundryTasks = pendingLaundryTasks;
{{/if}}

{{#if kitchen+tier_advanced}}
    // ──────────────────────────────────────────────────────────
    // KITCHEN MODULE
    // ──────────────────────────────────────────────────────────
    const pendingFoodOrders = await prisma.foodOrder.count({
      where: { status: { in: ["Pending", "Accepted", "Preparing", "Ready", "Assigned", "OutForDelivery"] } },
    });

    todayActivity.pendingFoodOrders = pendingFoodOrders;
{{/if}}

{{#if billing}}
    // ──────────────────────────────────────────────────────────
    // BILLING MODULE
    // ──────────────────────────────────────────────────────────
    const invoiceStats = await prisma.billingInvoice.aggregate({
      _sum: { amount_paid: true, balance_due: true },
    });

    const totalRevenue = Number(invoiceStats._sum.amount_paid || 0);
    const outstandingPayments = Number(invoiceStats._sum.balance_due || 0);

    summary.totalRevenue = totalRevenue;
    summary.outstandingPayments = outstandingPayments;

    const [totalInvoices, paidInvoices, partialInvoices, unpaidInvoices] = await Promise.all([
      prisma.billingInvoice.count(),
      prisma.billingInvoice.count({ where: { payment_status: "Paid" } }),
      prisma.billingInvoice.count({ where: { payment_status: "Partial" } }),
      prisma.billingInvoice.count({ where: { payment_status: "Unpaid" } }),
    ]);

    const billing = {
      totalInvoices,
      paidInvoices,
      partialInvoices,
      unpaidInvoices,
      outstandingBalance: outstandingPayments,
    };

    // 30-day revenue trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const invoicesLast30Days = await prisma.billingInvoice.findMany({
      where: { generated_at: { gte: thirtyDaysAgo } },
      select: {
        generated_at: true,
        room_charges: true,
{{#if kitchen+tier_advanced}}
        food_charges: true,
{{/if}}
        service_charges: true,
        amount_paid: true,
      },
    });

    const trendMap = new Map<string, Record<string, number>>();

    for (const inv of invoicesLast30Days) {
      const dateKey = inv.generated_at.toISOString().split("T")[0];
      const current: Record<string, number> = trendMap.get(dateKey) || {
        room_revenue: 0,
{{#if kitchen+tier_advanced}}
        food_revenue: 0,
{{/if}}
        service_revenue: 0,
        total_revenue: 0,
      };

      current.room_revenue += Number(inv.room_charges || 0);
{{#if kitchen+tier_advanced}}
      current.food_revenue += Number(inv.food_charges || 0);
{{/if}}
      current.service_revenue += Number(inv.service_charges || 0);
      current.total_revenue += Number(inv.amount_paid || 0);

      trendMap.set(dateKey, current);
    }

    const revenueTrend: Array<Record<string, unknown>> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const values = trendMap.get(dateStr) || {
        room_revenue: 0,
{{#if kitchen+tier_advanced}}
        food_revenue: 0,
{{/if}}
        service_revenue: 0,
        total_revenue: 0,
      };
      revenueTrend.push({ date: dateStr, ...values });
    }

    charts.revenueTrend = revenueTrend;
{{/if}}

{{#if inventory+tier_advanced}}
    // ──────────────────────────────────────────────────────────
    // INVENTORY MODULE
    // ──────────────────────────────────────────────────────────
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { is_active: true },
      select: { quantity: true, low_stock_threshold: true },
    });

    const inventory = {
      lowStockItems: inventoryItems.filter((i) => i.quantity > 0 && i.quantity <= i.low_stock_threshold).length,
      outOfStockItems: inventoryItems.filter((i) => i.quantity <= 0).length,
      totalInventoryItems: inventoryItems.length,
    };
{{/if}}

{{#if staff}}
    // ──────────────────────────────────────────────────────────
    // STAFF MODULE
    // ──────────────────────────────────────────────────────────
    const [totalStaff, activeStaff, onDutyStaff] = await Promise.all([
      prisma.staff.count(),
      prisma.staff.count({ where: { is_active: true } }),
      prisma.staff.count({ where: { is_on_duty: true, is_active: true } }),
    ]);

    const staff = { totalStaff, activeStaff, onDutyStaff };
{{/if}}

    return NextResponse.json({
      summary,
      todayActivity,
{{#if billing}}
      billing,
{{/if}}
{{#if inventory+tier_advanced}}
      inventory,
{{/if}}
{{#if booking}}
      recentBookings,
{{/if}}
{{#if staff}}
      staff,
{{/if}}
      charts,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/dashboard]", err);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}