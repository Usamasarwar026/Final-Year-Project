// src/app/api/billing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getInvoiceById } from "@/services/billingService";

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

    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Security check: Only Admin or the Guest who owns the booking can view it
    const isAdmin = session.user.role === "ADMIN";
    const isOwner = session.user.id === invoice.guest_id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Serialize decimal fields to numbers
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
      booking: invoice.booking
        ? {
            ...invoice.booking,
            total_amount: Number(invoice.booking.total_amount),
            room: invoice.booking.room
              ? {
                  ...invoice.booking.room,
                  price_per_night: Number(invoice.booking.room.price_per_night),
                }
              : null,
            foodOrders: (invoice.booking.foodOrders as any).map((fo: any) => ({
              ...fo,
              total_amount: Number(fo.total_amount),
              order_items: fo.order_items.map((oi: any) => ({
                ...oi,
                unit_price: Number(oi.unit_price),
                subtotal: Number(oi.subtotal),
              })),
            })),
            laundryRecords: invoice.booking.laundryRecords.map((lr) => ({
              ...lr,
              charge_amount: Number(lr.charge_amount || 0),
            })),
            housekeepingTasks: invoice.booking.housekeepingTasks.map((ht) => ({
              ...ht,
              charge_amount: Number(ht.charge_amount || 0),
            })),
          }
        : null,
      payments: invoice.payments.map((p) => ({
        ...p,
        amount_paid: Number(p.amount_paid),
      })),
    };

    return NextResponse.json({ invoice: serialized });
  } catch (err: any) {
    console.error("[GET /api/billing/[id]]", err);
    return NextResponse.json({ error: err.message || "Failed to load invoice details" }, { status: 500 });
  }
}
