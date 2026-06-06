// src/app/admin/billing/[id]/print/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Printer } from "lucide-react";
import api from "@/lib/axios";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function PrintInvoicePage() {
  const router = useRouter();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get<{ invoice: any }>(`/billing/${id}`);
      setInvoice(data.invoice);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to load invoice for printing");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  // Trigger print dialog once loaded
  useEffect(() => {
    if (invoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [invoice]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-slate-400" />
        <p className="text-sm font-medium">Preparing print document…</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-12 text-center bg-white text-slate-800 max-w-md mx-auto space-y-4">
        <AlertTriangle size={40} className="mx-auto text-rose-500" />
        <h2 className="text-lg font-bold">Error</h2>
        <p className="text-sm text-slate-500">{error || "Invoice not found"}</p>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50"
        >
          Close Window
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 max-w-4xl mx-auto font-sans leading-relaxed print:p-0">
      
      {/* Inline style block for clean A4 printing without browser headers/footers */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}</style>

      {/* Manual print helper for screens */}
      <div className="no-print mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <div className="text-xs text-slate-600">
          📄 This is a clean print-preview page. The print dialog should open automatically.
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
        >
          <Printer size={13} /> Trigger Print Dialog
        </button>
      </div>

      {/* Hotel Branding Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Smart Hotel De Luxe</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">100 Luxury Avenue, Suite Suite, Islamabad, Pakistan</p>
          <p className="text-xs text-slate-500 font-medium">Phone: +92 51 111-222-333 | Email: support@smarthotel.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-extrabold text-slate-400 tracking-wider uppercase">Invoice</h2>
          <p className="text-xs font-semibold text-slate-700 mt-1.5 font-mono">#{invoice.invoice_number}</p>
          <p className="text-[10px] text-slate-500 mt-1">Date: {fmtDateTime(invoice.generated_at)}</p>
        </div>
      </div>

      {/* Metadata section (Guest vs Booking) */}
      <div className="grid grid-cols-2 gap-8 my-8 text-xs">
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">Billed To (Guest)</h3>
          <p className="text-sm font-bold text-slate-900">{invoice.guest?.name}</p>
          <p className="text-slate-500">Email: {invoice.guest?.email}</p>
          {invoice.guest?.phoneNumber && <p className="text-slate-500">Phone: {invoice.guest.phoneNumber}</p>}
          <p className="text-[10px] text-slate-400 font-mono mt-1">Guest ID: {invoice.guest_id}</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">Stay Information</h3>
          <p className="text-slate-900 font-semibold">Booking ID: <span className="font-mono">#{invoice.booking_id}</span></p>
          <p className="text-slate-600">Room: <span className="font-bold">Room {invoice.booking?.room?.room_number}</span> ({invoice.booking?.room?.room_type})</p>
          <p className="text-slate-600">Dates: {fmtDate(invoice.booking?.check_in_date)} to {fmtDate(invoice.booking?.check_out_date)}</p>
          <p className="text-slate-600 font-bold">Total Stay: {invoice.booking?.total_nights} Nights</p>
        </div>
      </div>

      {/* Detailed Table list of charges */}
      <div className="mt-8">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 border-b border-slate-200 pb-1.5">Itemized Billing Charges</h3>
        
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 text-slate-600 uppercase font-bold text-[10px]">
              <th className="py-2.5">Description</th>
              <th className="py-2.5 text-center">Qty / Rate</th>
              <th className="py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            
            {/* Room Charges */}
            <tr className="font-medium text-slate-900">
              <td className="py-3">
                <span className="font-bold">Room Charges</span>
                <span className="block text-[10px] text-slate-400 font-normal">Accommodation stay in Room {invoice.booking?.room?.room_number}</span>
              </td>
              <td className="py-3 text-center text-slate-600">
                {invoice.booking?.total_nights} Nights × ${invoice.booking?.room?.price_per_night?.toFixed(2)}
              </td>
              <td className="py-3 text-right font-bold">${invoice.room_charges.toFixed(2)}</td>
            </tr>

            {/* Laundry Charges */}
            {invoice.booking?.laundryRecords?.map((lr: any) => (
              <tr key={lr.text_id} className="text-slate-800">
                <td className="py-3">
                  <span>Laundry Service: <span className="font-semibold">{lr.item_name}</span></span>
                  <span className="block text-[10px] text-slate-400">{lr.status}</span>
                </td>
                <td className="py-3 text-center text-slate-600">Qty: {lr.quantity}</td>
                <td className="py-3 text-right font-bold">${lr.charge_amount.toFixed(2)}</td>
              </tr>
            ))}

            {/* Housekeeping task Charges */}
            {invoice.booking?.housekeepingTasks?.map((ht: any) => (
              <tr key={ht.task_id} className="text-slate-800">
                <td className="py-3">
                  <span>Extra Service: <span className="font-semibold">{ht.request_description || ht.task_type}</span></span>
                  <span className="block text-[10px] text-slate-400">Priority: {ht.priority}</span>
                </td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-right font-bold">${ht.charge_amount.toFixed(2)}</td>
              </tr>
            ))}

            {/* Food Dining Charges */}
            {invoice.booking?.foodOrders?.map((fo: any) => (
              <tr key={fo.order_id} className="text-slate-800">
                <td className="py-3">
                  <span>Dining Order: <span className="font-semibold">#{fo.order_id}</span> ({fo.order_type === "RoomService" ? "Room Service" : "Restaurant"})</span>
                  <span className="block text-[10px] text-slate-400">
                    {fo.order_items?.map((oi: any) => `${oi.menu_items?.name} (x${oi.quantity})`).join(", ")}
                  </span>
                </td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-right font-bold">${fo.total_amount.toFixed(2)}</td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* Summary calculations section aligned to the right */}
      <div className="mt-8 border-t border-slate-200 pt-4 flex justify-end">
        <div className="w-80 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium text-slate-900">${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Sales Tax ({invoice.tax_percent}%):</span>
            <span className="font-medium text-slate-900">+${invoice.tax_amount.toFixed(2)}</span>
          </div>
          {invoice.discount_percent > 0 && (
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>Discount ({invoice.discount_percent}%):</span>
              <span>-${invoice.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-950 pt-2 text-sm font-bold text-slate-950">
            <span>Grand Total:</span>
            <span>${invoice.total_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-bold">
            <span>Amount Paid:</span>
            <span>${invoice.amount_paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-950">
            <span>Balance Due:</span>
            <span>${invoice.balance_due.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment transactions history log */}
      {invoice.payments?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2.5 border-b border-slate-200 pb-1">Payment History</h3>
          <div className="space-y-1.5 text-xs">
            {invoice.payments.map((p: any) => (
              <div key={p.payment_id} className="flex justify-between text-slate-600 py-1 border-b border-dashed border-slate-100">
                <span>{fmtDateTime(p.recorded_at)} — Paid via {p.payment_method} {p.notes ? `(${p.notes})` : ""}</span>
                <span className="font-bold text-slate-900">${p.amount_paid.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer thank you and signature */}
      <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
        <p className="font-medium text-slate-600">Thank you for staying at Smart Hotel De Luxe!</p>
        <p className="mt-1">For any queries regarding this invoice, please email accounts@smarthotel.com</p>
        
        <div className="flex justify-between mt-16 text-slate-700 font-medium">
          <div className="w-48 text-center">
            <div className="border-b border-slate-300 h-8"></div>
            <p className="mt-2 text-[10px]">Guest Signature</p>
          </div>
          <div className="w-48 text-center">
            <div className="border-b border-slate-300 h-8"></div>
            <p className="mt-2 text-[10px]">Authorized Signature</p>
          </div>
        </div>
      </div>

    </div>
  );
}
