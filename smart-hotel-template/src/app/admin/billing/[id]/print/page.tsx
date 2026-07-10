// src/app/admin/billing/[id]/print/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertTriangle, Printer } from "lucide-react";
import api from "@/lib/axios";
import { HOTEL_INFO } from "@/constant/constant";

const fmtDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fmtDateTime = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function PrintInvoicePage() {
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

  useEffect(() => {
    if (invoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [invoice]);

  // Calculate scale so the folio always fits on a single A4 page,
  // regardless of how many charge/payment rows it has.
  const printScale = useMemo(() => {
    if (!invoice) return 1;
    const count =
      1 + // room charge row
      (invoice.booking?.laundryRecords?.length || 0) +
      (invoice.booking?.housekeepingTasks?.length || 0) +
      (invoice.booking?.foodOrders?.length || 0) +
      (invoice.payments?.length || 0);
    if (count > 16) return 0.7;
    if (count > 12) return 0.8;
    if (count > 8) return 0.9;
    return 1;
  }, [invoice]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-slate-800" />
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Formatting Folio Record…
        </p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-12 text-center bg-white text-slate-800 max-w-md mx-auto my-12 border border-slate-300 space-y-4">
        <AlertTriangle size={36} className="mx-auto text-slate-700" />
        <h2 className="text-lg font-bold text-slate-900">
          Error Rendering Invoice
        </h2>
        <p className="text-sm text-slate-500">
          {error || "Invoice details could not be found."}
        </p>
        <button
          onClick={() => window.close()}
          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold"
        >
          Close Print Window
        </button>
      </div>
    );
  }

  return (
    <div
      className="invoice-root min-h-screen bg-white text-slate-900 p-6 max-w-3xl mx-auto font-sans"
      style={{ ["--print-scale" as any]: printScale }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .invoice-root, .invoice-root * {
            visibility: visible;
          }

          .invoice-root {
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            transform-origin: top left;
            transform: scale(var(--print-scale, 1));
          }

          .no-print {
            display: none !important;
          }

          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          table, tr, .invoice-block, .invoice-signatures {
            page-break-inside: avoid;
          }

          .invoice-header {
            page-break-after: avoid;
          }

          @page {
            size: A4;
            margin: 1.2cm;
          }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="no-print mb-6 p-4 bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
          Print dialog will open automatically.
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold"
        >
          <Printer size={13} /> Print / Save PDF
        </button>
      </div>

      {/* ── Header ── */}
      <div className="invoice-header flex justify-between items-start border-b-2 border-slate-900 pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-wide text-slate-900 uppercase">
            {HOTEL_INFO.name}
          </h1>
          <p className="text-[10px] text-slate-500 tracking-wide uppercase mt-0.5">
            {HOTEL_INFO.tagline}
          </p>
        </div>
        <div className="text-right text-[10px] text-slate-600 leading-relaxed">
          <p>{HOTEL_INFO.address}</p>
          <p>Phone: {HOTEL_INFO.phone}</p>
          <p>Email: {HOTEL_INFO.email}</p>
          <p>Tax Reg: {HOTEL_INFO.taxNo}</p>
        </div>
      </div>

      {/* ── Invoice meta strip ── */}
      <div className="flex justify-between items-start mt-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">
            Folio Invoice Record
          </h2>
        </div>
        <div className="text-right text-[10px] text-slate-600 leading-relaxed">
          <p>
            Folio No:{" "}
            <span className="font-mono font-bold text-slate-900">
              {invoice.invoice_number}
            </span>
          </p>
          <p>Date Generated: {fmtDateTime(invoice.generated_at)}</p>
        </div>
      </div>

      {/* ── Guest vs Stay Info ── */}
      <div className="invoice-block grid grid-cols-2 gap-4 my-4 text-[10px]">
        <div className="border border-slate-200 p-3 space-y-1">
          <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[9px] border-b border-slate-200 pb-1 mb-1">
            Guest Account Details
          </h3>
          <p className="text-xs font-bold text-slate-900">{invoice.guest?.name}</p>
          <p className="text-slate-600">Email: {invoice.guest?.email}</p>
          {invoice.guest?.phoneNumber && (
            <p className="text-slate-600">Phone: {invoice.guest.phoneNumber}</p>
          )}
          <p className="text-[9px] text-slate-400 font-mono pt-0.5">
            Guest Ref: {invoice.guest_id}
          </p>
        </div>

        <div className="border border-slate-200 p-3 space-y-1">
          <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[9px] border-b border-slate-200 pb-1 mb-1">
            Stay Reservation Details
          </h3>
          <p className="text-slate-600">
            Booking ID: <strong className="font-mono text-slate-900">#{invoice.booking_id}</strong>
          </p>
          <p className="text-slate-600">
            Room Assigned:{" "}
            <strong className="text-slate-900">
              Room {invoice.booking?.room?.room_number}
            </strong>{" "}
            ({invoice.booking?.room?.room_type})
          </p>
          <p className="text-slate-600">
            Check-In: <strong className="text-slate-900">{fmtDate(invoice.booking?.check_in_date)}</strong>
          </p>
          <p className="text-slate-600">
            Check-Out: <strong className="text-slate-900">{fmtDate(invoice.booking?.check_out_date)}</strong>
          </p>
          <p className="border-t border-slate-200 pt-1 mt-0.5 text-slate-900 font-bold flex justify-between">
            <span>Duration of Stay:</span>
            <span>{invoice.booking?.total_nights} Nights</span>
          </p>
        </div>
      </div>

      {/* ── Itemized Charges ── */}
      <div className="mt-4">
        <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-900 pb-1.5 mb-0">
          Itemized Folio Transactions
        </h3>
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-slate-500 uppercase font-bold text-[8px] tracking-wider">
              <th className="py-1.5">Item Description</th>
              <th className="py-1.5">Category</th>
              <th className="py-1.5 text-center">Qty / Rate</th>
              <th className="py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Room Accommodation Charges */}
            <tr className="text-slate-900">
              <td className="py-1.5">
                <span className="font-semibold block">Room Charges</span>
                <span className="text-[9px] text-slate-500 block">
                  Accommodation stay in Room {invoice.booking?.room?.room_number}
                </span>
              </td>
              <td className="py-1.5">
                <span className="text-[8px] font-bold text-slate-700 border border-slate-300 px-1 py-0.5 uppercase">
                  Room
                </span>
              </td>
              <td className="py-1.5 text-center text-slate-600">
                {invoice.booking?.total_nights} Nights × PKR{" "}
                {Number(invoice.booking?.room?.price_per_night || 0).toFixed(2)}
              </td>
              <td className="py-1.5 text-right font-bold">
                PKR {invoice.room_charges.toFixed(2)}
              </td>
            </tr>

            {/* Laundry Charges */}
            {invoice.booking?.laundryRecords?.map((lr: any) => (
              <tr key={lr.text_id} className="text-slate-900">
                <td className="py-1.5">
                  <span className="font-semibold block">Laundry: {lr.item_name}</span>
                  <span className="text-[9px] text-slate-500 block">
                    Status: {lr.status}
                  </span>
                </td>
                <td className="py-1.5">
                  <span className="text-[8px] font-bold text-slate-700 border border-slate-300 px-1 py-0.5 uppercase">
                    Laundry
                  </span>
                </td>
                <td className="py-1.5 text-center text-slate-600">Qty: {lr.quantity}</td>
                <td className="py-1.5 text-right font-bold">
                  PKR {lr.charge_amount.toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Housekeeping Charges */}
            {invoice.booking?.housekeepingTasks?.map((ht: any) => (
              <tr key={ht.task_id} className="text-slate-900">
                <td className="py-1.5">
                  <span className="font-semibold block">
                    {ht.request_description || ht.task_type}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    Extra room housekeeping request
                  </span>
                </td>
                <td className="py-1.5">
                  <span className="text-[8px] font-bold text-slate-700 border border-slate-300 px-1 py-0.5 uppercase">
                    Service
                  </span>
                </td>
                <td className="py-1.5 text-center text-slate-600">—</td>
                <td className="py-1.5 text-right font-bold">
                  PKR {ht.charge_amount.toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Food / Dining Charges */}
            {invoice.booking?.foodOrders?.map((fo: any) => (
              <tr key={fo.order_id} className="text-slate-900">
                <td className="py-1.5">
                  <span className="font-semibold block">Dining Order #{fo.order_id}</span>
                  <span className="text-[9px] text-slate-500 block">
                    {fo.order_items
                      ?.map((oi: any) => `${oi.menu_items?.name} (x${oi.quantity})`)
                      .join(", ")}
                  </span>
                </td>
                <td className="py-1.5">
                  <span className="text-[8px] font-bold text-slate-700 border border-slate-300 px-1 py-0.5 uppercase">
                    Dining
                  </span>
                </td>
                <td className="py-1.5 text-center text-slate-600">
                  {fo.order_type === "RoomService" ? "Room Service" : "Restaurant"}
                </td>
                <td className="py-1.5 text-right font-bold">
                  PKR {fo.total_amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totals ── */}
      <div className="mt-4 flex justify-end">
        <div className="w-72 text-[11px] text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span>Room Charges Subtotal</span>
            <span className="font-bold text-slate-900">
              PKR {invoice.room_charges.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Additional Services Subtotal</span>
            <span className="font-bold text-slate-900">
              PKR {invoice.service_charges.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Dining / Orders Subtotal</span>
            <span className="font-bold text-slate-900">
              PKR {invoice.food_charges.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
            <span>Gross Subtotal</span>
            <span>PKR {invoice.subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Tax ({invoice.tax_percent}%)</span>
            <span className="font-bold text-slate-900">
              +PKR {invoice.tax_amount.toFixed(2)}
            </span>
          </div>

          {invoice.discount_percent > 0 && (
            <div className="flex justify-between border-b border-slate-200 pb-1 font-bold text-slate-700">
              <span>Discount ({invoice.discount_percent}%)</span>
              <span>-PKR {invoice.discount_amount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-xs font-bold text-slate-950">
            <span>Grand Total</span>
            <span>PKR {invoice.total_amount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-700">
            <span>Amount Paid</span>
            <span className="font-semibold text-slate-900">
              PKR {invoice.amount_paid.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between border-t border-slate-300 pt-1 text-xs font-bold text-slate-950">
            <span>Balance Due</span>
            <span>PKR {invoice.balance_due.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ── Payment Activity Log ── */}
      {invoice.payments?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-900 pb-1.5 mb-1.5">
            Payment Activity Log
          </h3>
          <div className="space-y-1 text-[10px]">
            {invoice.payments.map((p: any) => (
              <div
                key={p.payment_id}
                className="flex justify-between text-slate-600 py-1 border-b border-dashed border-slate-200 items-center"
              >
                <span className="text-slate-700">
                  {fmtDateTime(p.recorded_at)} — Payment recorded via{" "}
                  <span className="uppercase text-slate-900 font-bold">
                    {p.payment_method}
                  </span>
                  {p.notes ? ` [Note: "${p.notes}"]` : ""}
                </span>
                <span className="font-bold text-slate-900">
                  PKR {p.amount_paid.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[9px] text-slate-500">
        <p className="font-semibold text-slate-700">
          Thank you for staying at {HOTEL_INFO.name}
        </p>
        <p className="mt-0.5">For queries: {HOTEL_INFO.email}</p>

        <div className="invoice-signatures flex justify-between mt-8 text-slate-700 font-medium">
          <div className="w-48 text-center">
            <div className="border-b border-slate-400 h-8"></div>
            <p className="mt-1.5 text-[8px] uppercase tracking-wider text-slate-500">
              Guest Signature
            </p>
          </div>
          <div className="w-48 text-center">
            <div className="border-b border-slate-400 h-8"></div>
            <p className="mt-1.5 text-[8px] uppercase tracking-wider text-slate-500">
              Authorized Signature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}