// src/app/api/reports/billing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
     const isAdmin = session?.user?.role === "ADMIN";
    const isStaffWithBillingPermission = 
      session?.user?.role === "STAFF" && 
      (session?.user as any)?.permissions?.includes("billing");
    
    if (!session || (!isAdmin && !isStaffWithBillingPermission)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await prisma.billingInvoice.findMany();

    const paidCount = invoices.filter((inv) => inv.payment_status === "Paid").length;
    const unpaidCount = invoices.filter((inv) => inv.payment_status === "Unpaid").length;
    const partialCount = invoices.filter((inv) => inv.payment_status === "Partial").length;

    // Total Revenue is the sum of all payments collected so far
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0);
    const totalBalanceDue = invoices.reduce((sum, inv) => sum + Number(inv.balance_due), 0);

    // Sum of charges as tracked in the system
    const roomRevenue = invoices.reduce((sum, inv) => sum + Number(inv.room_charges), 0);
    const serviceRevenue = invoices.reduce((sum, inv) => sum + Number(inv.service_charges), 0);
    const foodRevenue = invoices.reduce((sum, inv) => sum + Number(inv.food_charges), 0);

    return NextResponse.json({
      total_revenue: totalRevenue,
      total_balance_due: totalBalanceDue,
      paid_invoices_count: paidCount,
      unpaid_invoices_count: unpaidCount,
      partial_payments_count: partialCount,
      room_revenue: roomRevenue,
      service_revenue: serviceRevenue,
      food_revenue: foodRevenue,
    });
  } catch (err: any) {
    console.error("[GET /api/reports/billing]", err);
    return NextResponse.json({ error: err.message || "Failed to load report data" }, { status: 500 });
  }
}
