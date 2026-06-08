// src/app/admin/billing/[id]/print/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Printer, ShieldCheck } from "lucide-react";
import api from "@/lib/axios";

const fmtDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

const fmtDateTime = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

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
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-indigo-600" />
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Formatting Folio Record…</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-12 text-center bg-white text-slate-800 max-w-md mx-auto my-12 border border-slate-200 rounded-3xl shadow-xl space-y-4">
        <AlertTriangle size={40} className="mx-auto text-rose-500" />
        <h2 className="text-lg font-bold text-slate-900">Error Rendering Invoice</h2>
        <p className="text-sm text-slate-500">{error || "Invoice details could not be found."}</p>
        <button
          onClick={() => window.close()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          Close Print Window
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 max-w-4xl mx-auto font-sans leading-relaxed print:p-0">
      
      {/* CSS adjustments for clean A4 printing without browser headers/footers */}
      <style jsx global>{`
        @media print {
          /* Hide parent layout navigation elements */
          aside, 
          header, 
          nav, 
          button[aria-label="Open navigation"],
          .no-print {
            display: none !important;
          }
          
          /* Reset body and wrapper sizes for natural A4 pagination */
          html, body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Reset DashboardShell and layout container styles to block display */
          div.flex.h-screen.bg-background.overflow-hidden,
          div.flex-1.flex.flex-col.min-w-0.overflow-hidden,
          main.flex-1.overflow-y-auto {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: transparent !important;
          }

          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}</style>

      {/* Manual print helper banner (only visible on screen) */}
      <div className="no-print mb-8 p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-indigo-800 font-medium text-center sm:text-left">
          📄 <strong>Print Folio Preview:</strong> This page is formatted for standard A4 printing. The print dialog will open automatically.
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Printer size={13} /> Trigger System Print
        </button>
      </div>

      {/* ─── Folio Letterhead Branding ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">SMART HOTEL DE LUXE</h1>
          <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Luxury Accommodation & Hospitality Services</p>
          <p className="text-xs text-slate-600 font-medium pt-1.5">
            Faisalabad, Pakistan<br />
            Phone: 03260668582 | Email: awaisramzanfts@gmail.com<br />
            Tax Reg Number: NTN-9876543-2
          </p>
        </div>

        {/* Barcode & Invoice Meta */}
        <div className="flex flex-col items-start md:items-end text-left md:text-right space-y-2 shrink-0">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-3">
            {/* SVG Barcode Representation */}
            <div className="space-y-0.5">
              <svg width="120" height="30" viewBox="0 0 120 30" className="opacity-80">
                <rect width="120" height="30" fill="none" />
                <rect x="5" y="2" width="2" height="26" fill="black" />
                <rect x="9" y="2" width="3" height="26" fill="black" />
                <rect x="14" y="2" width="1" height="26" fill="black" />
                <rect x="17" y="2" width="2" height="26" fill="black" />
                <rect x="21" y="2" width="4" height="26" fill="black" />
                <rect x="27" y="2" width="1" height="26" fill="black" />
                <rect x="30" y="2" width="3" height="26" fill="black" />
                <rect x="35" y="2" width="2" height="26" fill="black" />
                <rect x="39" y="2" width="1" height="26" fill="black" />
                <rect x="42" y="2" width="4" height="26" fill="black" />
                <rect x="48" y="2" width="2" height="26" fill="black" />
                <rect x="52" y="2" width="1" height="26" fill="black" />
                <rect x="55" y="2" width="3" height="26" fill="black" />
                <rect x="60" y="2" width="2" height="26" fill="black" />
                <rect x="64" y="2" width="4" height="26" fill="black" />
                <rect x="70" y="2" width="1" height="26" fill="black" />
                <rect x="73" y="2" width="3" height="26" fill="black" />
                <rect x="78" y="2" width="2" height="26" fill="black" />
                <rect x="82" y="2" width="1" height="26" fill="black" />
                <rect x="85" y="2" width="4" height="26" fill="black" />
                <rect x="91" y="2" width="2" height="26" fill="black" />
                <rect x="95" y="2" width="1" height="26" fill="black" />
                <rect x="98" y="2" width="3" height="26" fill="black" />
                <rect x="103" y="2" width="2" height="26" fill="black" />
                <rect x="107" y="2" width="4" height="26" fill="black" />
                <rect x="113" y="2" width="2" height="26" fill="black" />
              </svg>
              <span className="block text-[8px] font-mono tracking-widest text-slate-400 text-center uppercase">
                {invoice.invoice_number}
              </span>
            </div>
          </div>
          <div className="space-y-0.5 text-xs text-slate-500 font-medium">
            <h2 className="text-sm font-black text-slate-900 tracking-wider uppercase">Folio Invoice Record</h2>
            <div>Folio No: <span className="font-mono font-bold text-slate-900">{invoice.invoice_number}</span></div>
            <div>Date Generated: <span className="text-slate-700">{fmtDateTime(invoice.generated_at)}</span></div>
          </div>
        </div>
      </div>

      {/* ─── Guest vs Stay Information Grid ─── */}
      <div className="grid grid-cols-2 gap-8 my-8 text-xs">
        
        {/* Guest Metadata */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
          <h3 className="font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Guest Account Details</h3>
          <p className="text-sm font-bold text-slate-900">{invoice.guest?.name}</p>
          <div className="space-y-0.5 text-slate-600 font-medium">
            <p>Email: {invoice.guest?.email}</p>
            {invoice.guest?.phoneNumber && <p>Phone: {invoice.guest.phoneNumber}</p>}
            <p className="text-[10px] text-slate-400 font-mono pt-1">Guest Ref: {invoice.guest_id}</p>
          </div>
        </div>

        {/* Stay Reservation Metadata */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
          <h3 className="font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Stay Reservation Details</h3>
          <div className="space-y-1 text-slate-700 font-medium">
            <p>Booking ID: <strong className="text-slate-900 font-mono">#{invoice.booking_id}</strong></p>
            <p>Room Assigned: <strong>Room {invoice.booking?.room?.room_number}</strong> ({invoice.booking?.room?.room_type})</p>
            <p>Check-In: <strong>{fmtDate(invoice.booking?.check_in_date)}</strong></p>
            <p>Check-Out: <strong>{fmtDate(invoice.booking?.check_out_date)}</strong></p>
            <p className="border-t border-slate-200/80 pt-1.5 mt-1 text-slate-900 font-extrabold flex justify-between">
              <span>Duration of Stay:</span>
              <span>{invoice.booking?.total_nights} Nights</span>
            </p>
          </div>
        </div>

      </div>

      {/* ─── Itemized Folio Charges Table ─── */}
      <div className="mt-8 space-y-2">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-350 pb-2">Itemized Folio Transactions</h3>
        
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 text-slate-500 uppercase font-extrabold text-[9px] tracking-wider">
              <th className="py-2.5">Item Description</th>
              <th className="py-2.5">Category</th>
              <th className="py-2.5 text-center">Qty / Rate</th>
              <th className="py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            
            {/* Base Room Accommodation Charges */}
            <tr className="text-slate-900">
              <td className="py-3.5 pl-1">
                <span className="font-bold block">Room Charges</span>
                <span className="text-[10px] text-slate-400 block font-normal">Accommodation stay in Room {invoice.booking?.room?.room_number}</span>
              </td>
              <td className="py-3.5">
                <span className="text-[9px] font-bold text-indigo-700 border border-indigo-150 bg-indigo-50/20 px-2 py-0.5 rounded">ROOM</span>
              </td>
              <td className="py-3.5 text-center text-slate-500">
                {invoice.booking?.total_nights} Nights × PKR {Number(invoice.booking?.room?.price_per_night || 0).toFixed(2)}/night
              </td>
              <td className="py-3.5 text-right font-bold">PKR {invoice.room_charges.toFixed(2)}</td>
            </tr>

            {/* Laundry Charges */}
            {invoice.booking?.laundryRecords?.map((lr: any) => (
              <tr key={lr.text_id} className="text-slate-800">
                <td className="py-3.5 pl-1">
                  <span className="font-bold block">Laundry: {lr.item_name}</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Status: {lr.status}</span>
                </td>
                <td className="py-3.5">
                  <span className="text-[9px] font-bold text-teal-700 border border-teal-150 bg-teal-50/20 px-2 py-0.5 rounded">LAUNDRY</span>
                </td>
                <td className="py-3.5 text-center text-slate-500">Qty: {lr.quantity}</td>
                <td className="py-3.5 text-right font-bold">PKR ${lr.charge_amount.toFixed(2)}</td>
              </tr>
            ))}

            {/* Housekeeping task Charges */}
            {invoice.booking?.housekeepingTasks?.map((ht: any) => (
              <tr key={ht.task_id} className="text-slate-800">
                <td className="py-3.5 pl-1">
                  <span className="font-bold block">{ht.request_description || ht.task_type}</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Extra Room Housekeeping request task</span>
                </td>
                <td className="py-3.5">
                  <span className="text-[9px] font-bold text-amber-700 border border-amber-150 bg-amber-50/20 px-2 py-0.5 rounded">SERVICE</span>
                </td>
                <td className="py-3.5 text-center text-slate-500">—</td>
                <td className="py-3.5 text-right font-bold">PKR ${ht.charge_amount.toFixed(2)}</td>
              </tr>
            ))}

            {/* Food and Kitchen Orders Charges */}
            {invoice.booking?.foodOrders?.map((fo: any) => (
              <tr key={fo.order_id} className="text-slate-850">
                <td className="py-3.5 pl-1">
                  <span className="font-bold block">Dining Order #{fo.order_id}</span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    {fo.order_items?.map((oi: any) => `${oi.menu_items?.name} (x${oi.quantity})`).join(", ")}
                  </span>
                </td>
                <td className="py-3.5">
                  <span className="text-[9px] font-bold text-rose-700 border border-rose-150 bg-rose-50/20 px-2 py-0.5 rounded">DINING</span>
                </td>
                <td className="py-3.5 text-center text-slate-500">
                  {fo.order_type === "RoomService" ? "Room Service" : "Restaurant"}
                </td>
                <td className="py-3.5 text-right font-bold">PKR ${fo.total_amount.toFixed(2)}</td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* ─── Financial Calculations Right Sidebar Box ─── */}
      <div className="mt-8 border-t border-slate-200 pt-4 flex justify-end">
        <div className="w-80 space-y-2 text-xs text-slate-600 font-medium">
          
          <div className="flex justify-between">
            <span>Room Charges Subtotal:</span>
            <span className="font-bold text-slate-900">PKR ${invoice.room_charges.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Additional Services Subtotal:</span>
            <span className="font-bold text-slate-900">PKR {invoice.service_charges.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Dining/Orders Subtotal:</span>
            <span className="font-bold text-slate-900">PKR ${invoice.food_charges.toFixed(2)}</span>
          </div>

          <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
            <span>Gross Subtotal:</span>
            <span>PKR ${invoice.subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Tax ({invoice.tax_percent}%):</span>
            <span className="font-bold text-slate-900">+PKR {invoice.tax_amount.toFixed(2)}</span>
          </div>

          {invoice.discount_percent > 0 && (
            <div className="flex justify-between text-rose-600 font-bold border-b border-slate-100 pb-1">
              <span>Discount ({invoice.discount_percent}%):</span>
              <span>-PKR ${invoice.discount_amount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-black text-slate-950">
            <span>Grand Total:</span>
            <span>${invoice.total_amount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-emerald-800 font-extrabold bg-slate-50 px-2 py-1 rounded">
            <span>Amount Paid:</span>
            <span>PKR ${invoice.amount_paid.toFixed(2)}</span>
          </div>

          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-950 bg-slate-100/60 px-2 py-1.5 rounded">
            <span>Balance Due:</span>
            <span>PKR ${invoice.balance_due.toFixed(2)}</span>
          </div>

        </div>
      </div>

      {/* ─── Receipt Transaction Activity History ─── */}
      {invoice.payments?.length > 0 && (
        <div className="mt-8 space-y-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1.5">Payment Activity Receipts Log</h3>
          <div className="space-y-2 text-xs">
            {invoice.payments.map((p: any) => (
              <div key={p.payment_id} className="flex justify-between text-slate-600 py-2 border-b border-dashed border-slate-150 items-center">
                <span className="font-semibold text-slate-700">
                  ✔ {fmtDateTime(p.recorded_at)} — Payment recorded via <span className="uppercase text-slate-900 font-bold">{p.payment_method}</span> {p.notes ? `[Note: "${p.notes}"]` : ""}
                </span>
                <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">PKR {p.amount_paid.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Print Footer (Watermarks, Signatures, Compliance QR) ─── */}
      <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 font-medium">
        <div className="flex justify-center items-center gap-2 text-slate-500 font-semibold mb-2">
          <ShieldCheck size={14} className="text-indigo-600" /> Secure digital invoice signature and compliance record.
        </div>
        <p className="text-slate-500 font-bold">Thank you for staying at Smart Hotel De Luxe!</p>
        <p className="mt-0.5 text-[10px]">For queries regarding accounts or this invoice, please email accounts@smarthotel.com</p>
        
        {/* Signatures */}
        <div className="flex justify-between mt-16 text-slate-700 font-semibold">
          <div className="w-52 text-center">
            <div className="border-b border-slate-300 h-10"></div>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">Guest Signature</p>
          </div>
          <div className="w-52 text-center">
            <div className="border-b border-slate-300 h-10"></div>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">Authorized Signature</p>
          </div>
        </div>
      </div>

    </div>
  );
}
