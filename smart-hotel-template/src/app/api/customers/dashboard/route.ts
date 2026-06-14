// src/app/api/customers/dashboard/route.ts
// GET — Returns personalized dashboard data for the authenticated customer

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const responseData: Record<string, any> = {};

    {{#if booking}}
    // ──────────────────────────────────────────────────────────
    // BOOKING MODULE: Active booking and booking stats
    // ──────────────────────────────────────────────────────────
    
    // 1. Active booking (checked in)
    const activeBooking = await prisma.booking.findFirst({
      where: { user_id: userId, status: "CheckedIn" },
      include: {
        room: {
          select: {
            room_id: true,
            room_number: true,
            floor: true,
            room_type: true,
            cleaning_status: true,
          },
        },
      },
      orderBy: { check_in_date: "desc" },
    });

    // 2. Recent bookings (last 5)
    const recentBookings = await prisma.booking.findMany({
      where: { user_id: userId },
      include: {
        room: { select: { room_number: true, room_type: true } },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    // 3. Booking stats
    const [totalBookings, confirmedBookings, cancelledBookings] = await Promise.all([
      prisma.booking.count({ where: { user_id: userId } }),
      prisma.booking.count({
        where: { user_id: userId, status: { in: ["CheckedIn", "CheckedOut"] } },
      }),
      prisma.booking.count({ where: { user_id: userId, status: "Cancelled" } }),
    ]);

    responseData.activeBooking = activeBooking
      ? {
          booking_id: activeBooking.booking_id,
          room_number: activeBooking.room?.room_number,
          room_type: activeBooking.room?.room_type,
          floor: activeBooking.room?.floor,
          cleaning_status: activeBooking.room?.cleaning_status,
          check_in_date: activeBooking.check_in_date,
          check_out_date: activeBooking.check_out_date,
          total_nights: activeBooking.total_nights,
          status: activeBooking.status,
        }
      : null;

    responseData.bookings = {
      total: totalBookings,
      confirmed: confirmedBookings,
      cancelled: cancelledBookings,
      recent: recentBookings.map((b) => ({
        booking_id: b.booking_id,
        room_number: b.room?.room_number ?? "—",
        room_type: b.room?.room_type ?? "—",
        check_in: b.check_in_date,
        check_out: b.check_out_date,
        status: b.status,
        total_nights: b.total_nights,
      })),
    };
    {{/if}}

    {{#if billing}}
    // ──────────────────────────────────────────────────────────
    // BILLING MODULE: Invoices and billing stats
    // ──────────────────────────────────────────────────────────
    
    const invoices = await prisma.billingInvoice.findMany({
      where: { guest_id: userId },
      include: {
        booking: { include: { room: { select: { room_number: true, room_type: true } } } },
      },
      orderBy: { generated_at: "desc" },
      take: 5,
    });

    const totalInvoices = await prisma.billingInvoice.count({
      where: { guest_id: userId },
    });

    const billingAgg = await prisma.billingInvoice.aggregate({
      where: { guest_id: userId },
      _sum: { total_amount: true, amount_paid: true, balance_due: true },
    });

    responseData.billing = {
      totalInvoices,
      totalSpent: Number(billingAgg._sum.total_amount ?? 0),
      totalPaid: Number(billingAgg._sum.amount_paid ?? 0),
      balanceDue: Number(billingAgg._sum.balance_due ?? 0),
      recentInvoices: invoices.map((inv) => ({
        invoice_id: inv.invoice_id,
        invoice_number: inv.invoice_number,
        room_number: inv.booking?.room?.room_number ?? "—",
        room_type: inv.booking?.room?.room_type ?? "—",
        total_amount: Number(inv.total_amount),
        amount_paid: Number(inv.amount_paid),
        balance_due: Number(inv.balance_due),
        payment_status: inv.payment_status,
        generated_at: inv.generated_at,
      })),
    };
    {{/if}}

    {{#if kitchen}}
    // ──────────────────────────────────────────────────────────
    // KITCHEN MODULE: Food orders
    // ──────────────────────────────────────────────────────────
    
    const recentOrders = await prisma.foodOrder.findMany({
      where: { user_id: userId },
      include: {
        items: {
          include: {
            foodItem: { select: { name: true } },
          },
          take: 2,
        },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    responseData.foodOrders = {
      recent: recentOrders.map((o) => ({
        id: o.id,
        order_type: o.order_type,
        status: o.status,
        total_amount: Number(o.total_amount),
        customer_name: o.customer_name,
        created_at: o.created_at,
        items: o.items.map((i) => i.foodItem?.name ?? "Item"),
      })),
    };
    {{/if}}

    {{#if housekeeping}}
    // ──────────────────────────────────────────────────────────
    // HOUSEKEEPING MODULE: Laundry status
    // ──────────────────────────────────────────────────────────
    
    const activeBookingForLaundry = responseData.activeBooking;
    const pendingLaundry = activeBookingForLaundry
      ? await prisma.laundryRecord.count({
          where: { booking_id: activeBookingForLaundry.booking_id, status: "Pending" },
        })
      : 0;
    
    responseData.alerts = {
      ...responseData.alerts,
      pendingLaundry,
    };
    {{/if}}

    {{#if true}}
    // ──────────────────────────────────────────────────────────
    // NOTIFICATIONS (always included)
    // ──────────────────────────────────────────────────────────
    
    const unreadNotifications = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "notifications" WHERE "recipient_user_id" = $1 AND "is_read" = false`,
      userId
    );

    responseData.alerts = {
      ...responseData.alerts,
      unreadNotifications: Number(unreadNotifications[0]?.count ?? 0),
    };
    {{/if}}

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("[GET /api/customers/dashboard]", err);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}