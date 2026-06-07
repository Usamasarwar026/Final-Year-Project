// src/app/api/billing/reset/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/database/db";

export async function GET() {
  try {
    // Find the invoice by its number
    const invoice = await prisma.billingInvoice.findUnique({
      where: { invoice_number: "INV-20260606-RD8T" }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice INV-20260606-RD8T not found in DB" }, { status: 404 });
    }

    // Delete existing manual payment records for this invoice
    await prisma.invoicePayment.deleteMany({
      where: { invoice_id: invoice.invoice_id }
    });

    // Reset the invoice back to Unpaid status and reset balance_due
    const updated = await prisma.billingInvoice.update({
      where: { invoice_id: invoice.invoice_id },
      data: {
        amount_paid: 0,
        balance_due: invoice.total_amount,
        payment_status: "Unpaid"
      }
    });

    return NextResponse.json({
      message: "Invoice reset successfully. Refresh your billing page now!",
      invoice: {
        id: updated.invoice_id,
        number: updated.invoice_number,
        payment_status: updated.payment_status,
        balance_due: Number(updated.balance_due)
      }
    });
  } catch (err: any) {
    console.error("[GET /api/billing/reset]", err);
    return NextResponse.json({ error: err.message || "Failed to reset invoice" }, { status: 500 });
  }
}
