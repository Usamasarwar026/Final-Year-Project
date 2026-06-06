// src/app/api/billing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getInvoices, generateInvoice } from "@/services/billingService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const payment_status = searchParams.get("payment_status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const isAdmin = session.user.role === "ADMIN";
    const isStaff = session.user.role === "STAFF";

    let invoices;
    if (isAdmin) {
      invoices = await getInvoices({ search, payment_status, startDate, endDate });
    } else if (isStaff && session.user.permissions?.includes("billing")) {
      invoices = await getInvoices({ search, payment_status, startDate, endDate });
    } else {
      // Guest users can only see their own invoices
      invoices = await getInvoices({ payment_status, startDate, endDate, guest_id: session.user.id });
    }

    // Serialize Decimal values to numbers for JS client compatibility
    const serialized = invoices.map((invoice) => ({
      ...invoice,
      room_charges: Number(invoice.room_charges),
      service_charges: Number(invoice.service_charges),
      food_charges: Number(invoice.food_charges),
      subtotal: Number(invoice.subtotal),
      tax_percent: Number(invoice.tax_percent),
      tax_amount: Number(invoice.tax_amount),
      discount_percent: Number(invoice.discount_percent),
      discount_amount: Number(invoice.discount_amount),
      total_amount: Number(invoice.total_amount),
      amount_paid: Number(invoice.amount_paid),
      balance_due: Number(invoice.balance_due),
    }));

    return NextResponse.json({ invoices: serialized });
  } catch (err: any) {
    console.error("[GET /api/billing]", err);
    return NextResponse.json({ error: err.message || "Failed to load invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { booking_id, tax_percent, discount_percent } = body;

    if (!booking_id) {
      return NextResponse.json({ error: "booking_id is required" }, { status: 422 });
    }

    const taxVal = tax_percent !== undefined ? Number(tax_percent) : undefined;
    const discVal = discount_percent !== undefined ? Number(discount_percent) : undefined;

    if (taxVal !== undefined && taxVal < 0) {
      return NextResponse.json({ error: "Tax percent cannot be negative" }, { status: 422 });
    }
    if (discVal !== undefined && discVal < 0) {
      return NextResponse.json({ error: "Discount percent cannot be negative" }, { status: 422 });
    }

    const invoice = await generateInvoice(Number(booking_id), {
      tax_percent: taxVal,
      discount_percent: discVal,
    });

    const serialized = {
      ...invoice,
      room_charges: Number(invoice.room_charges),
      service_charges: Number(invoice.service_charges),
      food_charges: Number(invoice.food_charges),
      subtotal: Number(invoice.subtotal),
      tax_percent: Number(invoice.tax_percent),
      tax_amount: Number(invoice.tax_amount),
      discount_percent: Number(invoice.discount_percent),
      discount_amount: Number(invoice.discount_amount),
      total_amount: Number(invoice.total_amount),
      amount_paid: Number(invoice.amount_paid),
      balance_due: Number(invoice.balance_due),
    };

    return NextResponse.json({ invoice: serialized }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/billing]", err);
    return NextResponse.json({ error: err.message || "Failed to create invoice" }, { status: 500 });
  }
}
