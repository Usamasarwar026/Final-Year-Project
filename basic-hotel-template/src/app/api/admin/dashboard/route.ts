// src/app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // ========== 1. ROOMS SUMMARY ==========
    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      reservedRooms,
    ] = await Promise.all([
      prisma.room.count({ where: { is_active: true } }),
      prisma.room.count({ where: { is_active: true, status: "Available" } }),
      prisma.room.count({ where: { is_active: true, status: "Occupied" } }),
      prisma.room.count({ where: { is_active: true, status: "Maintenance" } }),
      prisma.room.count({ where: { is_active: true, status: "Reserved" } }),
    ]);

    // ========== 2. BOOKINGS SUMMARY ==========
    const [
      totalBookings,
      activeGuests,
      pendingBookings,
      confirmedBookings,
      checkedInBookings,
      checkedOutBookings,
      cancelledBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "CheckedIn" } }),
      prisma.booking.count({ where: { status: "Pending" } }),
      prisma.booking.count({ where: { status: "Confirmed" } }),
      prisma.booking.count({ where: { status: "CheckedIn" } }),
      prisma.booking.count({ where: { status: "CheckedOut" } }),
      prisma.booking.count({ where: { status: "Cancelled" } }),
    ]);

    // ========== 3. REVENUE CALCULATION ==========
    const allActiveBookings = await prisma.booking.findMany({
      where: { status: { notIn: ["Cancelled"] } },
      select: { total_amount: true },
    });
    const totalRevenue = allActiveBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

    const pendingPayments = await prisma.booking.findMany({
      where: { status: { in: ["Pending", "Confirmed", "CheckedIn"] } },
      select: { total_amount: true },
    });
    const outstandingPayments = pendingPayments.reduce((sum, b) => sum + Number(b.total_amount), 0);

    // ========== 4. TODAY'S ACTIVITY ==========
    const [todayCheckIns, todayCheckOuts] = await Promise.all([
      prisma.booking.count({
        where: {
          check_in_date: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.booking.count({
        where: {
          check_out_date: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);

    // Dirty rooms need housekeeping
    const dirtyRooms = await prisma.room.count({
      where: { cleaning_status: "Dirty" },
    });

    // ========== 5. CUSTOMER STATS ==========
    const [totalCustomers, activeCustomers] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { is_active: true } }),
    ]);

    // ========== 6. RECENT BOOKINGS (with customer & room details) ==========
    const recentBookingsRaw = await prisma.booking.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      include: {
        customer: { select: { name: true, phone_number: true } },
        room: { select: { room_number: true, room_type: true } },
      },
    });

    const recentBookings = recentBookingsRaw.map((b) => ({
      booking_id: b.booking_id,
      guestName: b.customer?.name || "Unknown",
      roomNumber: b.room?.room_number || "N/A",
      roomType: b.room?.room_type || "N/A",
      checkIn: b.check_in_date.toISOString().split("T")[0],
      checkOut: b.check_out_date.toISOString().split("T")[0],
      totalNights: b.total_nights,
      totalAmount: Number(b.total_amount),
      status: b.status,
      source: b.source,
    }));

    // ========== 7. ROOM OCCUPANCY CHART ==========
    const roomStatusBreakdown = await prisma.room.groupBy({
      by: ["status"],
      where: { is_active: true },
      _count: { status: true },
    });

    const occupancyChart = [
      { name: "Available", value: 0, color: "#10b981" },
      { name: "Reserved", value: 0, color: "#3b82f6" },
      { name: "Occupied", value: 0, color: "#f43f5e" },
      { name: "Maintenance", value: 0, color: "#f59e0b" },
    ];

    for (const item of roomStatusBreakdown) {
      const found = occupancyChart.find(c => c.name === item.status);
      if (found) found.value = item._count.status;
    }

    // ========== 8. REVENUE TREND (Last 30 days) ==========
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const bookingsLast30Days = await prisma.booking.findMany({
      where: {
        created_at: { gte: thirtyDaysAgo },
        status: { not: "Cancelled" },
      },
      select: {
        created_at: true,
        total_amount: true,
      },
    });

    const revenueMap = new Map();
    for (const booking of bookingsLast30Days) {
      const dateKey = booking.created_at.toISOString().split("T")[0];
      const current = revenueMap.get(dateKey) || 0;
      revenueMap.set(dateKey, current + Number(booking.total_amount));
    }

    const revenueTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      revenueTrend.push({
        date: dateStr,
        revenue: revenueMap.get(dateStr) || 0,
      });
    }

    // ========== 9. ROOM TYPE DISTRIBUTION ==========
    const roomTypeBreakdown = await prisma.room.groupBy({
      by: ["room_type"],
      where: { is_active: true },
      _count: { room_type: true },
    });

    const roomTypeChart = roomTypeBreakdown.map((item) => ({
      name: item.room_type,
      value: item._count.room_type,
    }));

    // ========== 10. RECENT NOTIFICATIONS ==========
    const recentNotifications = await prisma.notification.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      where: { role_target: "ADMIN" },
      select: {
        notification_id: true,
        title: true,
        message: true,
        type: true,
        priority: true,
        is_read: true,
        created_at: true,
      },
    });

    const unreadNotifications = await prisma.notification.count({
      where: { role_target: "ADMIN", is_read: false },
    });

    // ========== RESPONSE ==========
    return NextResponse.json({
      // Room Stats
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms,
        reserved: reservedRooms,
        occupancyRate: totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0,
      },
      
      // Booking Stats
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        checkedIn: checkedInBookings,
        checkedOut: checkedOutBookings,
        cancelled: cancelledBookings,
        activeGuests: activeGuests,
      },
      
      // Financial Stats
      financial: {
        totalRevenue: totalRevenue,
        outstandingPayments: outstandingPayments,
      },
      
      // Today's Activity
      todayActivity: {
        checkIns: todayCheckIns,
        checkOuts: todayCheckOuts,
        dirtyRooms: dirtyRooms,
      },
      
      // Customer Stats
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: totalCustomers - activeCustomers,
      },
      
      // Recent Data
      recentBookings: recentBookings,
      recentNotifications: recentNotifications,
      unreadNotifications: unreadNotifications,
      
      // Charts Data
      charts: {
        occupancyChart: occupancyChart,
        roomTypeChart: roomTypeChart,
        revenueTrend: revenueTrend,
      },
    });
    
  } catch (err: any) {
    console.error("[GET /api/admin/dashboard] Error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data", details: err.message },
      { status: 500 }
    );
  }
}
