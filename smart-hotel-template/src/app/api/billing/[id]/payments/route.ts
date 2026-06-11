// src/app/api/billing/[id]/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { recordPayment, getInvoiceById } from "@/services/billingService";
import { prisma } from "@/database/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    // Security check: Only Admin or Owner Guest can view
    const invoice = await prisma.billingInvoice.findUnique({
      where: { invoice_id: invoiceId },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const isStaff = session.user.role === "STAFF";
    const isOwner = session.user.id === invoice.guest_id;

    if (!isAdmin && !isStaff && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await prisma.invoicePayment.findMany({
      where: { invoice_id: invoiceId },
      orderBy: { recorded_at: "desc" },
    });

    const serialized = payments.map((p) => ({
      ...p,
      amount_paid: Number(p.amount_paid),
    }));

    return NextResponse.json({ payments: serialized });
  } catch (err: any) {
    console.error("[GET /api/billing/[id]/payments]", err);
    return NextResponse.json({ error: err.message || "Failed to load payment history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    // Record payment is admin feature
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    const body = await req.json();
    const { amount, payment_method, notes } = body;

    if (amount === undefined || !payment_method) {
      return NextResponse.json({ error: "amount and payment_method are required" }, { status: 422 });
    }

    const payAmt = Number(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      return NextResponse.json({ error: "Payment amount must be greater than zero" }, { status: 422 });
    }

    const { payment, invoice } = await recordPayment(invoiceId, payAmt, payment_method, notes);

    const serializedInvoice = {
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

    const serializedPayment = {
      ...payment,
      amount_paid: Number(payment.amount_paid),
    };

    return NextResponse.json(
      {
        message: "Payment recorded successfully",
        payment: serializedPayment,
        invoice: serializedInvoice,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/billing/[id]/payments]", err);
    return NextResponse.json({ error: err.message || "Failed to record payment" }, { status: 500 });
  }
}
