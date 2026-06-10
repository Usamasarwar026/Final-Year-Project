"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertTriangle, Printer, ShieldCheck } from "lucide-react";

const fmtDateTime = (d: string) => {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function KitchenInvoicePage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/kitchen/orders/${id}`)
      .then((r) => r.json())
      .then((data) => { if (data.error) { setError(data.error); } else { setOrder(data); } setLoading(false); })
      .catch(() => { setError("Failed to load order"); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (order) { const t = setTimeout(() => window.print(), 1000); return () => clearTimeout(t); }
  }, [order]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
      <Loader2 size={36} className="animate-spin text-indigo-600" />
      <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Formatting Invoice...</p>
    </div>
  );

  if (error || !order) return (
    <div className="p-12 text-center bg-white max-w-md mx-auto my-12 border border-slate-200 rounded-3xl shadow-xl space-y-4">
      <AlertTriangle size={40} className="mx-auto text-rose-500" />
      <h2 className="text-lg font-bold text-slate-900">Error Rendering Invoice</h2>
      <p className="text-sm text-slate-500">{error || "Order not found."}</p>
      <button onClick={() => window.close()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">Close Window</button>
    </div>
  );

  const deliveryStaff = order.tasks?.[0]?.assignedStaff;
  const invoiceNo = `KO-${String(order.id).padStart(6, "0")}-${new Date().getFullYear()}`;

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 max-w-4xl mx-auto font-sans">
      <style>{`
        @media print {
          aside, header, nav, .no-print { display: none !important; }
          html, body { background: white !important; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A4; margin: 1.5cm; }
        }
      `}</style>

      <div className="no-print mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-4">
        <div className="text-xs text-indigo-800 font-medium">Print dialog will open automatically.</div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
            <Printer size={13} /> Print / Save PDF
          </button>
          <button onClick={() => window.close()} className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">Close</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">SMART HOTEL DE LUXE</h1>
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Kitchen and Food Services</p>
          <p className="text-xs text-slate-600 font-medium pt-1.5">Faisalabad, Pakistan<br />Phone: 03260668582<br />Tax Reg: NTN-9876543-2</p>
        </div>
        <div className="flex flex-col items-end space-y-2 shrink-0">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <svg width="120" height="30" viewBox="0 0 120 30">
              <rect x="5" y="2" width="2" height="26" fill="black" /><rect x="9" y="2" width="3" height="26" fill="black" /><rect x="14" y="2" width="1" height="26" fill="black" /><rect x="17" y="2" width="2" height="26" fill="black" /><rect x="21" y="2" width="4" height="26" fill="black" /><rect x="27" y="2" width="1" height="26" fill="black" /><rect x="30" y="2" width="3" height="26" fill="black" /><rect x="35" y="2" width="2" height="26" fill="black" /><rect x="42" y="2" width="4" height="26" fill="black" /><rect x="48" y="2" width="2" height="26" fill="black" /><rect x="55" y="2" width="3" height="26" fill="black" /><rect x="60" y="2" width="2" height="26" fill="black" /><rect x="64" y="2" width="4" height="26" fill="black" /><rect x="73" y="2" width="3" height="26" fill="black" /><rect x="78" y="2" width="2" height="26" fill="black" /><rect x="85" y="2" width="4" height="26" fill="black" /><rect x="91" y="2" width="2" height="26" fill="black" /><rect x="98" y="2" width="3" height="26" fill="black" /><rect x="103" y="2" width="2" height="26" fill="black" /><rect x="107" y="2" width="4" height="26" fill="black" /><rect x="113" y="2" width="2" height="26" fill="black" />
            </svg>
            <span className="block text-[8px] font-mono tracking-widest text-slate-400 text-center mt-1">{invoiceNo}</span>
          </div>
          <div className="space-y-0.5 text-xs text-slate-500 text-right">
            <h2 className="text-sm font-black text-slate-900 uppercase">Kitchen Order Invoice</h2>
            <div>Invoice No: <span className="font-mono font-bold text-slate-900">{invoiceNo}</span></div>
            <div>Date: <span className="text-slate-700">{fmtDateTime(new Date().toISOString())}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 my-8 text-xs">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
          <h3 className="font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Customer Details</h3>
          <p className="text-sm font-bold text-slate-900">{order.customer_name || "Guest"}</p>
          <div className="space-y-0.5 text-slate-600">
            <p>Order Type: {order.order_type === "RoomService" ? "Room Service" : "Restaurant"}</p>
            {order.order_type === "RoomService" ? <p>Room No: <strong>{order.room_number || "-"}</strong></p> : <p>Table No: <strong>{order.table_number || "-"}</strong></p>}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
          <h3 className="font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Order Details</h3>
          <div className="space-y-1 text-slate-700">
            <p>Order ID: <strong className="font-mono">#{order.id}</strong></p>
            <p>Ordered At: <strong>{fmtDateTime(order.placed_at)}</strong></p>
            <p>Status: <strong className="text-emerald-700">Delivered</strong></p>
            {deliveryStaff && <p>Delivered By: <strong>{deliveryStaff.user?.name || "-"}</strong></p>}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-300 pb-2 mb-2">Itemized Order</h3>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 text-slate-500 uppercase font-extrabold text-[9px] tracking-wider">
              <th className="py-2.5">Item</th>
              <th className="py-2.5 text-center">Qty / Rate</th>
              <th className="py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items?.map((item: any) => (
              <tr key={item.id} className="text-slate-900">
                <td className="py-3.5">
                  <span className="font-bold block">{item.foodItem?.name ?? `Item #${item.food_item_id}`}</span>
                  {item.special_note && <span className="text-[10px] text-amber-600 block">Note: {item.special_note}</span>}
                </td>
                <td className="py-3.5 text-center text-slate-500">{item.quantity} x PKR {Number(item.unit_price ?? (Number(item.subtotal) / item.quantity)).toLocaleString()}</td>
                <td className="py-3.5 text-right font-bold">PKR {Number(item.subtotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-4 flex justify-end">
        <div className="w-72 space-y-2 text-xs">
          <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-black text-slate-950">
            <span>Total Amount:</span>
            <span>PKR {Number(order.total_amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-emerald-800 font-extrabold bg-slate-50 px-2 py-1 rounded">
            <span>Payment Status:</span><span>Delivered</span>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
        <div className="flex justify-center items-center gap-2 text-slate-500 font-semibold mb-2">
          <ShieldCheck size={14} className="text-indigo-600" /> Secure digital invoice record.
        </div>
        <p className="text-slate-500 font-bold">Thank you for dining at Smart Hotel De Luxe!</p>
        <p className="mt-0.5 text-[10px]">For queries: accounts@smarthotel.com</p>
        <div className="flex justify-between mt-16 text-slate-700 font-semibold">
          <div className="w-52 text-center"><div className="border-b border-slate-300 h-10"></div><p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">Guest Signature</p></div>
          <div className="w-52 text-center"><div className="border-b border-slate-300 h-10"></div><p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">Authorized Signature</p></div>
        </div>
      </div>
    </div>
  );
}