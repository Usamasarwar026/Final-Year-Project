// src/modules/billing/InvoiceDetails.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Printer, DollarSign, Download, Calendar,
  BedDouble, Utensils, Activity, CreditCard, CheckCircle2,
  AlertTriangle, Clock, Loader2, User, Mail, Phone, X, ShieldAlert,
  Receipt, Percent, Coins
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import api from "@/lib/axios";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

export default function InvoiceDetails() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const router = useRouter();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Record payment state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payNotes, setPayNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const loadInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ invoice: any }>(`/billing/${id}`);
      setInvoice(data.invoice);
      setPayAmount(data.invoice.balance_due.toFixed(2));
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payAmount);

    if (isNaN(amount) || amount <= 0) {
      return toast.error("Please enter a valid amount");
    }
    if (amount > invoice.balance_due) {
      return toast.error(`Payment cannot exceed balance due ($${invoice.balance_due.toFixed(2)})`);
    }

    setSubmittingPayment(true);
    try {
      await api.post(`/billing/${id}/payments`, {
        amount,
        payment_method: payMethod,
        notes: payNotes,
      });
      toast.success("Payment recorded successfully!");
      setShowPayModal(false);
      setPayNotes("");
      loadInvoice();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-zinc-950/20">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-950/40 border-t-indigo-600 animate-spin"></div>
          <Receipt size={18} className="absolute text-indigo-600 animate-pulse" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tracking-wider uppercase">Loading Secure Folio…</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Error Loading Invoice</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{error || "Invoice details could not be found."}</p>
        </div>
        <button
          onClick={() => router.push("/admin/billing")}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-2xl text-xs font-bold transition-all shadow-md hover:shadow-lg"
        >
          Back to Billing Dashboard
        </button>
      </div>
    );
  }

  const isPaid = invoice.payment_status === "Paid";
  const isPartial = invoice.payment_status === "Partial";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950/20 p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      
      {/* ─── Breadcrumb & Navigation Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/billing")}
            className="group p-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all shadow-sm hover:scale-105"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-lg">
                FOLIO SYSTEM
              </span>
              <span className={clsx(
                "px-3 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider",
                isPaid ? "bg-emerald-50/80 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" :
                isPartial ? "bg-amber-50/80 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400" :
                "bg-rose-50/80 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
              )}>
                {invoice.payment_status}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-50 mt-1 flex items-center gap-2">
              Invoice <span className="font-mono text-indigo-600 dark:text-indigo-400 text-lg font-bold">{invoice.invoice_number}</span>
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/billing/${invoice.invoice_id}/print`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all text-slate-700 dark:text-zinc-300 shadow-sm"
          >
            <Printer size={14} className="text-slate-400" /> Print
          </Link>
          <Link
            href={`/admin/billing/${invoice.invoice_id}/print`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all text-slate-700 dark:text-zinc-300 shadow-sm"
          >
            <Download size={14} className="text-slate-400" /> Download PDF
          </Link>
          {isAdmin && invoice.balance_due > 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md hover:shadow-lg hover:shadow-indigo-600/10 active:scale-95 transition-all relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <DollarSign size={14} /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* ─── Modern Banner Notification ─── */}
      <div className={clsx(
        "p-4 md:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm backdrop-blur-md",
        isPaid ? "bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-300" :
        "bg-amber-50/40 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/20 text-amber-800 dark:text-amber-300"
      )}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={clsx(
            "p-2 rounded-2xl shrink-0 flex items-center justify-center",
            isPaid ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
            "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          )}>
            {isPaid ? <CheckCircle2 size={20} /> : <Clock size={20} />}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {isPaid ? "Invoice Settled Successfully" : "Pending Balance Payment"}
            </h4>
            <p className="text-xs opacity-80 mt-0.5">
              {isPaid ? "This folio is fully closed. No outstanding balances remain." : `A pending balance of $${invoice.balance_due.toFixed(2)} is remaining for checkout.`}
            </p>
          </div>
        </div>
        {isAdmin && !isPaid && (
          <button
            onClick={() => setShowPayModal(true)}
            className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start sm:self-auto shrink-0"
          >
            Pay Balance
          </button>
        )}
      </div>

      {/* ─── Grid Information Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Guest Details Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/75 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/50 pb-3">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-indigo-500" /> Guest Information
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded-md">
              ID: {invoice.guest_id.slice(0, 8)}…
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-700 dark:text-zinc-300 font-black text-lg border border-slate-200/50 dark:border-zinc-800">
              {invoice.guest?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">{invoice.guest?.name}</h4>
              <div className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5"><Mail size={12} /> {invoice.guest?.email}</span>
                {invoice.guest?.phoneNumber && (
                  <span className="flex items-center gap-1.5"><Phone size={12} /> {invoice.guest.phoneNumber}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stay & Room Details Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/75 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/50 pb-3">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500" /> Stay & Accommodation
            </h3>
            <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
              Booking #{invoice.booking_id}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold block">Check-In</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200">{fmtDate(invoice.booking?.check_in_date)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold block">Check-Out</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200">{fmtDate(invoice.booking?.check_out_date)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold block">Nights</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200">{invoice.booking?.total_nights} Nights</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-2xl p-3 flex items-center justify-between gap-3 border border-slate-100 dark:border-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {invoice.booking?.room?.room_number || "—"}
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold block">Assigned Room</span>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{invoice.booking?.room?.room_type || "Standard"} Room</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold block">Daily Rate</span>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">${Number(invoice.booking?.room?.price_per_night || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Detailed Invoice Items Table ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Unified Folio Charge Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/75 dark:border-zinc-800/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800/50 bg-slate-50/40 dark:bg-zinc-800/20 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Itemized Folio Transactions</h3>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Auto-collected Charges</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-bold uppercase text-[9px] tracking-wider bg-slate-50/30 dark:bg-zinc-850">
                    <th className="p-4 pl-6">Transaction / Charge Item</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Rate/Qty</th>
                    <th className="p-4 text-right pr-6">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  
                  {/* Room Accommodation Charge Row */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4 pl-6 space-y-0.5">
                      <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                        <BedDouble size={13} className="text-indigo-500" /> Room Charges
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                        Base accommodation stay in Room {invoice.booking?.room?.room_number}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                        ROOM
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-500 dark:text-zinc-400">
                      {invoice.booking?.total_nights} Nights × ${Number(invoice.booking?.room?.price_per_night || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800 dark:text-zinc-200 pr-6">
                      ${invoice.room_charges.toFixed(2)}
                    </td>
                  </tr>

                  {/* Housekeeping Charges */}
                  {invoice.booking?.housekeepingTasks?.map((ht: any) => (
                    <tr key={ht.task_id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 pl-6 space-y-0.5">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                          <Activity size={13} className="text-amber-500" /> {ht.request_description || ht.task_type}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                          Housekeeping & Request task (Priority: {ht.priority})
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                          SERVICE
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-500 dark:text-zinc-400">—</td>
                      <td className="p-4 text-right font-bold text-slate-800 dark:text-zinc-200 pr-6">
                        ${ht.charge_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {/* Laundry Charges */}
                  {invoice.booking?.laundryRecords?.map((lr: any) => (
                    <tr key={lr.text_id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 pl-6 space-y-0.5">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                          <Coins size={13} className="text-teal-500" /> Laundry: {lr.item_name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                          Status: {lr.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30">
                          LAUNDRY
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-500 dark:text-zinc-400">
                        Qty: {lr.quantity}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800 dark:text-zinc-200 pr-6">
                        ${lr.charge_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {/* Food and Dining Charges */}
                  {invoice.booking?.foodOrders?.map((fo: any) => (
                    <tr key={fo.order_id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 pl-6 space-y-1">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                          <Utensils size={13} className="text-rose-500" /> Dining Order #{fo.order_id}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                          Type: {fo.order_type === "RoomService" ? "Door Room Service" : "Restaurant Dining"}
                        </span>
                        {fo.order_items?.length > 0 && (
                          <div className="pl-5 space-y-0.5 border-l border-slate-200 dark:border-zinc-800 mt-1.5">
                            {fo.order_items.map((oi: any) => (
                              <span key={oi.id} className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">
                                • {oi.menu_items?.name} (x{oi.quantity}) — ${Number(oi.subtotal).toFixed(2)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                          FOOD & DINING
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-500 dark:text-zinc-400">—</td>
                      <td className="p-4 text-right font-bold text-slate-800 dark:text-zinc-200 pr-6">
                        ${fo.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {/* Empty State fallback */}
                  {(!invoice.booking?.housekeepingTasks?.length && !invoice.booking?.laundryRecords?.length && !invoice.booking?.foodOrders?.length) && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                        No additional laundry, dining, or housekeeping services recorded for this reservation.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Financial Summary & Payments ─── */}
        <div className="space-y-6">
          
          {/* Financial Breakdown Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/75 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800/50 pb-3">
              Folio Settlement
            </h3>

            <div className="space-y-3 text-xs">
              
              <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                <span>Room Charges:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">${invoice.room_charges.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                <span>Additional Services:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">${invoice.service_charges.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                <span>Dining & Orders:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">${invoice.food_charges.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800/50 pt-3 flex justify-between font-bold text-slate-800 dark:text-zinc-200">
                <span>Gross Subtotal:</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500 dark:text-zinc-400 items-center">
                <span className="flex items-center gap-1"><Receipt size={12} className="text-slate-400" /> Sales Tax ({invoice.tax_percent}%):</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">+${invoice.tax_amount.toFixed(2)}</span>
              </div>

              {invoice.discount_percent > 0 && (
                <div className="flex justify-between text-rose-500 font-semibold items-center">
                  <span className="flex items-center gap-1"><Percent size={12} /> Discount ({invoice.discount_percent}%):</span>
                  <span>-${invoice.discount_amount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-slate-200 dark:border-zinc-800 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900 dark:text-zinc-100">Grand Total:</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">${invoice.total_amount.toFixed(2)}</span>
              </div>

              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-3 flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                <span>Amount Paid:</span>
                <span>${invoice.amount_paid.toFixed(2)}</span>
              </div>

              <div className={clsx(
                "rounded-2xl p-3.5 flex justify-between items-center text-sm font-black border",
                invoice.balance_due > 0 
                  ? "bg-amber-50/50 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/20 text-amber-700 dark:text-amber-400" 
                  : "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400"
              )}>
                <span>Balance Due:</span>
                <span>${invoice.balance_due.toFixed(2)}</span>
              </div>

            </div>

            <div className="text-[10px] text-slate-400 dark:text-zinc-500 text-center border-t border-slate-100 dark:border-zinc-800/50 pt-3 mt-2 flex items-center justify-center gap-1">
              <Clock size={10} /> Generated: {fmtDateTime(invoice.generated_at)}
            </div>
          </div>

          {/* Payment Transactions Timeline Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/75 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800/50 pb-3">
              Payment Activity Logs
            </h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {invoice.payments?.length > 0 ? (
                <div className="relative border-l border-slate-100 dark:border-zinc-800 pl-4 space-y-5 py-1">
                  {invoice.payments.map((p: any) => (
                    <div key={p.payment_id} className="relative space-y-1">
                      {/* Bullet node indicator */}
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-950/50"></span>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          +${p.amount_paid.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-slate-200/50 dark:border-zinc-800 uppercase">
                          {p.payment_method}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {fmtDateTime(p.recorded_at)}
                      </p>
                      
                      {p.notes && (
                        <p className="text-[10px] text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-850 p-2 rounded-xl border border-slate-100 dark:border-zinc-850/40 italic mt-1 font-medium">
                          Note: "{p.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 italic flex flex-col gap-2 items-center">
                  <Clock size={20} className="text-slate-300 dark:text-zinc-700 animate-pulse" />
                  <span>No payment entries recorded yet.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ─── Record Payment Modal (Styled Glassmorphic Dialog) ─── */}
      {showPayModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/50 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <CreditCard size={18} />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-zinc-100">Record Folio Settlement</h3>
              </div>
              <button 
                onClick={() => setShowPayModal(false)} 
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRecordPayment} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Payment Amount ($) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 dark:text-zinc-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-background text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600/50 dark:focus:ring-indigo-400/10 dark:focus:border-indigo-400/50 transition-all text-slate-900 dark:text-zinc-100"
                    placeholder="0.00"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">
                  Remaining dues: <strong className="text-slate-600 dark:text-zinc-400">${invoice.balance_due.toFixed(2)}</strong>
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-background text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600/50 dark:focus:ring-indigo-400/10 dark:focus:border-indigo-400/50 transition-all text-slate-900 dark:text-zinc-100"
                >
                  <option value="Cash">💵 Cash (Offline Counter)</option>
                  <option value="Card">💳 Credit/Debit Card (Manual Log)</option>
                  <option value="BankTransfer">🏦 Bank Transfer (Manual Log)</option>
                  <option value="JazzCash">📱 JazzCash (Manual Record)</option>
                  <option value="EasyPaisa">📱 EasyPaisa (Manual Record)</option>
                </select>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1.5 block leading-normal">
                  Note: This form registers offline receipts manually. No online payment gateways will be charged.
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Billing Notes / Memo</label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Cleared at Reception check-out desk..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-background text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600/50 dark:focus:ring-indigo-400/10 dark:focus:border-indigo-400/50 resize-none transition-all text-slate-900 dark:text-zinc-100"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-xs font-bold transition-all text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md disabled:opacity-60 transition-all"
                >
                  {submittingPayment ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <DollarSign size={14} />
                  )}
                  Record Payment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
