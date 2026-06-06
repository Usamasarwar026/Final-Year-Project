// src/services/reportService.ts
// Reports module — server-side aggregation service (READ ONLY from existing tables)

import { prisma } from "@/database/db";
import type {
  RevenueReport,
  OccupancyReport,
  StaffReport,
  InventoryReport,
  BookingReport,
  GuestReport,
  ReportKpi,
} from "@/types/reports";

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildDateRange(from: string, to: string) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function safeNum(val: unknown): number {
  return Number(val ?? 0);
}

// ── KPI Dashboard ─────────────────────────────────────────────────────────────

export async function getKpiData(): Promise<ReportKpi> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Revenue today — sum of amount_paid on invoices generated today
  const invoicesToday = await prisma.billingInvoice.findMany({
    where: { generated_at: { gte: todayStart, lte: todayEnd } },
    select: { amount_paid: true },
  });
  const revenue_today = invoicesToday.reduce(
    (s, i) => s + safeNum(i.amount_paid),
    0
  );

  // Revenue this month
  const invoicesMonth = await prisma.billingInvoice.findMany({
    where: { generated_at: { gte: monthStart } },
    select: { amount_paid: true },
  });
  const revenue_this_month = invoicesMonth.reduce(
    (s, i) => s + safeNum(i.amount_paid),
    0
  );

  // Occupancy % — rooms currently occupied / total active rooms
  const [occupiedCount, totalRooms] = await Promise.all([
    prisma.room.count({ where: { status: "Occupied", is_active: true } }),
    prisma.room.count({ where: { is_active: true } }),
  ]);
  const occupancy_percent =
    totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  // Active bookings
  const active_bookings = await prisma.booking.count({
    where: { status: { in: ["Confirmed", "CheckedIn"] } },
  });

  // Pending payments (invoices not fully paid)
  const pending_payments = await prisma.billingInvoice.count({
    where: { payment_status: { in: ["Unpaid", "Partial"] } },
  });

  // Low stock items
  const low_stock_items = await prisma.inventoryItem.count({
    where: {
      is_active: true,
      quantity: { lte: prisma.inventoryItem.fields.low_stock_threshold as any },
    },
  });
  // Fallback: raw count using raw items compare
  const allItems = await prisma.inventoryItem.findMany({
    where: { is_active: true },
    select: { quantity: true, low_stock_threshold: true },
  });
  const lowStockCount = allItems.filter(
    (i) => i.quantity <= i.low_stock_threshold
  ).length;

  // Staff attendance today
  const staff_attendance_today = await prisma.attendanceLog.count({
    where: { date: { gte: todayStart, lte: todayEnd }, status: "Present" },
  });

  // New guests today (customers created today)
  const new_guests_today = await prisma.user.count({
    where: { role: "CUSTOMER", createdAt: { gte: todayStart, lte: todayEnd } },
  });

  return {
    revenue_today,
    revenue_this_month,
    occupancy_percent,
    active_bookings,
    pending_payments,
    low_stock_items: lowStockCount,
    staff_attendance_today,
    new_guests_today,
  };
}

// ── Revenue Report ─────────────────────────────────────────────────────────────

export async function getRevenueReport(
  from: string,
  to: string
): Promise<RevenueReport> {
  const { start, end } = buildDateRange(from, to);

  const invoices = await prisma.billingInvoice.findMany({
    where: { generated_at: { gte: start, lte: end } },
    select: {
      room_charges: true,
      food_charges: true,
      service_charges: true,
      subtotal: true,
      tax_amount: true,
      discount_amount: true,
      total_amount: true,
      amount_paid: true,
      balance_due: true,
      generated_at: true,
    },
    orderBy: { generated_at: "asc" },
  });

  const room_revenue = invoices.reduce(
    (s, i) => s + safeNum(i.room_charges),
    0
  );
  const food_revenue = invoices.reduce(
    (s, i) => s + safeNum(i.food_charges),
    0
  );
  const service_revenue = invoices.reduce(
    (s, i) => s + safeNum(i.service_charges),
    0
  );
  const subtotal = invoices.reduce((s, i) => s + safeNum(i.subtotal), 0);
  const tax_amount = invoices.reduce((s, i) => s + safeNum(i.tax_amount), 0);
  const discount_amount = invoices.reduce(
    (s, i) => s + safeNum(i.discount_amount),
    0
  );
  const net_revenue = invoices.reduce(
    (s, i) => s + safeNum(i.total_amount),
    0
  );
  const amount_paid = invoices.reduce(
    (s, i) => s + safeNum(i.amount_paid),
    0
  );
  const pending_amount = invoices.reduce(
    (s, i) => s + safeNum(i.balance_due),
    0
  );

  // Group by date for trend
  const trendMap = new Map<
    string,
    {
      room_revenue: number;
      food_revenue: number;
      service_revenue: number;
      total_revenue: number;
    }
  >();
  for (const inv of invoices) {
    const dateKey = inv.generated_at.toISOString().split("T")[0];
    const existing = trendMap.get(dateKey) ?? {
      room_revenue: 0,
      food_revenue: 0,
      service_revenue: 0,
      total_revenue: 0,
    };
    trendMap.set(dateKey, {
      room_revenue: existing.room_revenue + safeNum(inv.room_charges),
      food_revenue: existing.food_revenue + safeNum(inv.food_charges),
      service_revenue:
        existing.service_revenue + safeNum(inv.service_charges),
      total_revenue: existing.total_revenue + safeNum(inv.total_amount),
    });
  }
  const trend = Array.from(trendMap.entries()).map(([date, vals]) => ({
    date,
    ...vals,
  }));

  return {
    room_revenue,
    food_revenue,
    service_revenue,
    subtotal,
    tax_amount,
    discount_amount,
    net_revenue,
    amount_paid,
    pending_amount,
    trend,
  };
}

// ── Occupancy Report ──────────────────────────────────────────────────────────

export async function getOccupancyReport(
  from: string,
  to: string
): Promise<OccupancyReport> {
  const { start, end } = buildDateRange(from, to);

  const [total_rooms, occupied, available, reserved, maintenance] =
    await Promise.all([
      prisma.room.count({ where: { is_active: true } }),
      prisma.room.count({ where: { is_active: true, status: "Occupied" } }),
      prisma.room.count({ where: { is_active: true, status: "Available" } }),
      prisma.room.count({ where: { is_active: true, status: "Reserved" } }),
      prisma.room.count({ where: { is_active: true, status: "Maintenance" } }),
    ]);

  const occupancy_percent =
    total_rooms > 0 ? Math.round((occupied / total_rooms) * 100) : 0;

  // Trend: bookings per day in range
  const bookings = await prisma.booking.findMany({
    where: {
      check_in_date: { gte: start },
      check_out_date: { lte: end },
      status: { in: ["Confirmed", "CheckedIn", "CheckedOut"] },
    },
    select: { check_in_date: true, check_out_date: true },
    orderBy: { check_in_date: "asc" },
  });

  // Simple: group checked-in bookings by date
  const trendMap = new Map<
    string,
    { occupied: number; available: number }
  >();
  for (const b of bookings) {
    const dateKey = b.check_in_date.toISOString().split("T")[0];
    const ex = trendMap.get(dateKey) ?? { occupied: 0, available: 0 };
    trendMap.set(dateKey, { occupied: ex.occupied + 1, available: 0 });
  }
  const trend = Array.from(trendMap.entries()).map(([date, vals]) => ({
    date,
    occupied: vals.occupied,
    available: total_rooms - vals.occupied,
    occupancy_percent:
      total_rooms > 0
        ? Math.round((vals.occupied / total_rooms) * 100)
        : 0,
  }));

  return {
    total_rooms,
    occupied,
    available,
    reserved,
    maintenance,
    occupancy_percent,
    trend,
  };
}

// ── Staff Performance Report ──────────────────────────────────────────────────

export async function getStaffReport(
  from: string,
  to: string
): Promise<StaffReport> {
  const { start, end } = buildDateRange(from, to);

  const staffList = await prisma.staff.findMany({
    where: { is_active: true },
    include: {
      user: { select: { name: true } },
      department: { select: { name: true } },
      assignedTasks: {
        where: { created_at: { gte: start, lte: end } },
        select: { status: true },
      },
      attendance: {
        where: { date: { gte: start, lte: end } },
        select: { status: true },
      },
    },
  });

  const staff = staffList.map((s) => {
    const assigned_tasks = s.assignedTasks.length;
    const completed_tasks = s.assignedTasks.filter(
      (t) => t.status === "Done"
    ).length;
    const pending_tasks = s.assignedTasks.filter(
      (t) => t.status === "Pending" || t.status === "InProgress"
    ).length;
    const completion_rate =
      assigned_tasks > 0
        ? Math.round((completed_tasks / assigned_tasks) * 100)
        : 0;

    const present_days = s.attendance.filter(
      (a) => a.status === "Present" || a.status === "HalfDay"
    ).length;
    const working_days = s.attendance.length;
    const attendance_rate =
      working_days > 0
        ? Math.round((present_days / working_days) * 100)
        : 0;

    return {
      staff_id: s.staff_id,
      name: s.user.name,
      department: s.department?.name ?? null,
      assigned_tasks,
      completed_tasks,
      pending_tasks,
      completion_rate,
      present_days,
      working_days,
      attendance_rate,
    };
  });

  return { staff };
}

// ── Inventory Report ──────────────────────────────────────────────────────────

export async function getInventoryReport(
  from: string,
  to: string
): Promise<InventoryReport> {
  const { start, end } = buildDateRange(from, to);

  const [allItems, usageLogs, purchaseOrders] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        quantity: true,
        low_stock_threshold: true,
        unit: true,
        unit_cost: true,
        category: { select: { name: true } },
        category_id: true,
      },
    }),
    prisma.inventoryUsageLog.findMany({
      where: { used_at: { gte: start, lte: end } },
      include: {
        item: {
          select: {
            name: true,
            unit_cost: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
    prisma.purchaseOrder.findMany({
      where: {
        received_at: { gte: start, lte: end },
        status: { in: ["Received", "PartiallyReceived"] },
      },
      select: { total_cost: true },
    }),
  ]);

  const total_items = allItems.length;
  const low_stock_items_list = allItems
    .filter((i) => i.quantity <= i.low_stock_threshold)
    .map((i) => ({
      id: i.id,
      name: i.name,
      category: (i as any).category?.name ?? "",
      quantity: i.quantity,
      threshold: i.low_stock_threshold,
      unit: i.unit,
    }));

  const total_purchase_cost = purchaseOrders.reduce(
    (s, o) => s + safeNum(o.total_cost),
    0
  );
  const total_consumption_cost = usageLogs.reduce(
    (s, l) => s + l.quantity_used * safeNum((l.item as any).unit_cost),
    0
  );

  // Group usage by category
  const catMap = new Map<
    string,
    { items_count: number; total_consumed: number; total_cost: number }
  >();
  for (const log of usageLogs) {
    const cat = (log.item as any).category?.name ?? "Uncategorized";
    const ex = catMap.get(cat) ?? {
      items_count: 0,
      total_consumed: 0,
      total_cost: 0,
    };
    catMap.set(cat, {
      items_count: ex.items_count + 1,
      total_consumed: ex.total_consumed + log.quantity_used,
      total_cost:
        ex.total_cost +
        log.quantity_used * safeNum((log.item as any).unit_cost),
    });
  }
  const category_usage = Array.from(catMap.entries()).map(([cat, vals]) => ({
    category: cat,
    ...vals,
  }));

  return {
    total_items,
    low_stock_count: low_stock_items_list.length,
    total_purchase_cost,
    total_consumption_cost,
    category_usage,
    low_stock_items: low_stock_items_list,
  };
}

// ── Booking Report ────────────────────────────────────────────────────────────

export async function getBookingReport(
  from: string,
  to: string
): Promise<BookingReport> {
  const { start, end } = buildDateRange(from, to);

  const bookings = await prisma.booking.findMany({
    where: { created_at: { gte: start, lte: end } },
    select: { status: true, created_at: true },
    orderBy: { created_at: "asc" },
  });

  const total_bookings = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "Confirmed").length;
  const pending = bookings.filter((b) => b.status === "Pending").length;
  const cancelled = bookings.filter((b) => b.status === "Cancelled").length;
  const checked_in = bookings.filter((b) => b.status === "CheckedIn").length;
  const checked_out = bookings.filter((b) => b.status === "CheckedOut").length;

  const non_pending = total_bookings - pending;
  const conversion_rate =
    total_bookings > 0
      ? Math.round((confirmed / total_bookings) * 100)
      : 0;

  // Trend by date
  const trendMap = new Map<
    string,
    {
      total: number;
      confirmed: number;
      cancelled: number;
      checked_in: number;
      checked_out: number;
    }
  >();
  for (const b of bookings) {
    const dateKey = b.created_at.toISOString().split("T")[0];
    const ex = trendMap.get(dateKey) ?? {
      total: 0,
      confirmed: 0,
      cancelled: 0,
      checked_in: 0,
      checked_out: 0,
    };
    trendMap.set(dateKey, {
      total: ex.total + 1,
      confirmed: ex.confirmed + (b.status === "Confirmed" ? 1 : 0),
      cancelled: ex.cancelled + (b.status === "Cancelled" ? 1 : 0),
      checked_in: ex.checked_in + (b.status === "CheckedIn" ? 1 : 0),
      checked_out: ex.checked_out + (b.status === "CheckedOut" ? 1 : 0),
    });
  }
  const trend = Array.from(trendMap.entries()).map(([date, vals]) => ({
    date,
    ...vals,
  }));

  const status_distribution = [
    { name: "Confirmed", value: confirmed },
    { name: "Pending", value: pending },
    { name: "Cancelled", value: cancelled },
    { name: "Checked In", value: checked_in },
    { name: "Checked Out", value: checked_out },
  ].filter((s) => s.value > 0);

  return {
    total_bookings,
    confirmed,
    pending,
    cancelled,
    checked_in,
    checked_out,
    conversion_rate,
    trend,
    status_distribution,
  };
}

// ── Guest Report ──────────────────────────────────────────────────────────────

export async function getGuestReport(
  from: string,
  to: string
): Promise<GuestReport> {
  const { start, end } = buildDateRange(from, to);

  const guests = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      createdAt: true,
      bookings: {
        select: {
          booking_id: true,
          total_nights: true,
          status: true,
          check_in_date: true,
          check_out_date: true,
        },
      },
    },
  });

  const total_guests = guests.length;
  const new_guests = guests.filter(
    (g) => new Date(g.createdAt) >= start && new Date(g.createdAt) <= end
  ).length;

  const returning_guests = guests.filter((g) => g.bookings.length > 1).length;
  // VIP: guests with 3+ completed bookings
  const vip_guests = guests.filter(
    (g) =>
      g.bookings.filter((b) => b.status === "CheckedOut").length >= 3
  ).length;

  // Avg stay duration — from completed bookings in range
  const completedBookings = guests.flatMap((g) =>
    g.bookings.filter(
      (b) =>
        b.status === "CheckedOut" &&
        new Date(b.check_in_date) >= start &&
        new Date(b.check_out_date) <= end
    )
  );
  const avg_stay_duration =
    completedBookings.length > 0
      ? Math.round(
          completedBookings.reduce((s, b) => s + b.total_nights, 0) /
            completedBookings.length
        )
      : 0;

  const segments = [
    { name: "New Guests", value: new_guests },
    { name: "Returning", value: returning_guests },
    { name: "VIP", value: vip_guests },
    {
      name: "One-time",
      value: Math.max(
        0,
        total_guests - new_guests - returning_guests - vip_guests
      ),
    },
  ].filter((s) => s.value > 0);

  return {
    total_guests,
    new_guests,
    returning_guests,
    vip_guests,
    avg_stay_duration,
    segments,
  };
}
