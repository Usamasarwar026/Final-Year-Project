"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertTriangle, Printer } from "lucide-react";
import { HOTEL_INFO } from "@/constant/constant";

const fmtDateTime = (d: string) => {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function KitchenInvoicePage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(!HOTEL_INFO.logoUrl);

  useEffect(() => {
    fetch(`/api/kitchen/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setOrder(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load order");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (order && logoLoaded) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [order, logoLoaded]);

  if (loading)
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-slate-800" />
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Formatting Invoice...
        </p>
      </div>
    );

  if (error || !order)
    return (
      <div className="p-12 text-center bg-white max-w-md mx-auto my-12 border border-slate-300 space-y-4">
        <AlertTriangle size={36} className="mx-auto text-slate-700" />
        <h2 className="text-lg font-bold text-slate-900">
          Error Rendering Invoice
        </h2>
        <p className="text-sm text-slate-500">
          {error || "Order not found."}
        </p>
        <button
          onClick={() => window.close()}
          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold"
        >
          Close Window
        </button>
      </div>
    );

  const deliveryStaff = order.tasks?.[0]?.assignedStaff;
  const invoiceNo = `KO-${String(order.id).padStart(6, "0")}-${new Date().getFullYear()}`;

  return (
    <div className="invoice-root min-h-screen bg-white text-slate-900 p-10 max-w-3xl mx-auto font-sans">
      <style>{`
  @media print {
    /* Hide EVERYTHING by default */
    body * {
      visibility: hidden;
    }

    /* Show ONLY the invoice and its children */
    .invoice-root, .invoice-root * {
      visibility: visible;
    }

    /* Pull invoice to top-left of the printed page */
    .invoice-root {
      position: absolute !important;
      left: 0;
      top: 0;
      width: 100% !important;
      max-width: 100% !important;
      min-height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
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
      margin: 1.6cm;
    }
  }
`}</style>

      {/* Screen-only toolbar */}
      <div className="no-print mb-8 p-4 bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
        <div className="text-xs text-slate-600 font-medium">
          Print dialog will open automatically.
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold"
          >
            <Printer size={13} /> Print / Save PDF
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="invoice-header flex justify-between items-start border-b-2 border-slate-900 pb-5">
        <div>
          
          <h1 className="text-xl font-bold tracking-wide text-slate-900 uppercase">
            {HOTEL_INFO.name}
          </h1>
          <p className="text-[11px] text-slate-500 tracking-wide uppercase mt-0.5">
            {HOTEL_INFO.tagline}
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-600 leading-relaxed">
          <p>{HOTEL_INFO.address}</p>
          <p>Phone: {HOTEL_INFO.phone}</p>
          <p>Tax Reg: {HOTEL_INFO.taxNo}</p>
        </div>
      </div>

      {/* ── Invoice meta strip ── */}
      <div className="flex justify-between items-start mt-5 pb-5 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">
            Kitchen Order Invoice
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            Status: <span className="font-semibold text-slate-900">Delivered</span>
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-600 leading-relaxed">
          <p>
            Invoice No:{" "}
            <span className="font-mono font-bold text-slate-900">{invoiceNo}</span>
          </p>
          <p>Date: {fmtDateTime(new Date().toISOString())}</p>
        </div>
      </div>

      {/* ── Customer + Order Details ── */}
      <div className="invoice-block grid grid-cols-2 gap-6 my-6 text-[11px]">
        <div className="border border-slate-200 p-4 space-y-1.5">
          <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] border-b border-slate-200 pb-1.5 mb-1.5">
            Customer Details
          </h3>
          <p className="text-sm font-bold text-slate-900">
            {order.customer_name || "Guest"}
          </p>
          <p className="text-slate-600">
            Order Type:{" "}
            {order.order_type === "RoomService" ? "Room Service" : "Restaurant"}
          </p>
          {order.order_type === "RoomService" ? (
            <p className="text-slate-600">
              Room No: <strong className="text-slate-900">{order.room_number || "-"}</strong>
            </p>
          ) : (
            <p className="text-slate-600">
              Table No: <strong className="text-slate-900">{order.table_number || "-"}</strong>
            </p>
          )}
        </div>

        <div className="border border-slate-200 p-4 space-y-1.5">
          <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] border-b border-slate-200 pb-1.5 mb-1.5">
            Order Details
          </h3>
          <p className="text-slate-600">
            Order ID: <strong className="font-mono text-slate-900">#{order.id}</strong>
          </p>
          <p className="text-slate-600">
            Ordered At: <strong className="text-slate-900">{fmtDateTime(order.placed_at)}</strong>
          </p>
          {deliveryStaff && (
            <p className="text-slate-600">
              Delivered By: <strong className="text-slate-900">{deliveryStaff.user?.name || "-"}</strong>
            </p>
          )}
        </div>
      </div>

      {/* ── Items ── */}
      <div className="mt-6">
        <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-0">
          Itemized Order
        </h3>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
              <th className="py-2.5">Item</th>
              <th className="py-2.5 text-center">Qty</th>
              <th className="py-2.5 text-right">Rate</th>
              <th className="py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items?.map((item: any) => {
              const rate = Number(
                item.unit_price ?? Number(item.subtotal) / item.quantity,
              );
              return (
                <tr key={item.id} className="text-slate-900">
                  <td className="py-3">
                    <span className="font-semibold block">
                      {item.foodItem?.name ?? `Item #${item.food_item_id}`}
                    </span>
                    {item.special_note && (
                      <span className="text-[10px] text-slate-500 italic block mt-0.5">
                        Note: {item.special_note}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-center text-slate-600">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right text-slate-600">
                    PKR {rate.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-bold">
                    PKR {Number(item.subtotal).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Totals ── */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 text-xs">
          <div className="flex justify-between border-t-2 border-slate-900 pt-2.5 text-sm font-bold text-slate-950">
            <span>Total Amount</span>
            <span>PKR {Number(order.total_amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between mt-1.5 pt-1.5 border-t border-slate-200 text-slate-600">
            <span>Payment Status</span>
            <span className="font-semibold text-slate-900">Delivered</span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-16 pt-6 border-t border-slate-300 text-center text-[10px] text-slate-500">
        <p className="font-semibold text-slate-700">
          Thank you for dining at {HOTEL_INFO.name}
        </p>
        <p className="mt-0.5">For queries: {HOTEL_INFO.email}</p>

        <div className="invoice-signatures flex justify-between mt-16 text-slate-700 font-medium">
          <div className="w-52 text-center">
            <div className="border-b border-slate-400 h-10"></div>
            <p className="mt-2 text-[9px] uppercase tracking-wider text-slate-500">
              Guest Signature
            </p>
          </div>
          <div className="w-52 text-center">
            <div className="border-b border-slate-400 h-10"></div>
            <p className="mt-2 text-[9px] uppercase tracking-wider text-slate-500">
              Authorized Signature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}