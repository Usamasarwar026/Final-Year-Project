// src/modules/billing/InvoiceDetails.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Printer, DollarSign, Download, Calendar,
  BedDouble, ShoppingBag, Utensils, Activity, CreditCard,
  CheckCircle2, AlertTriangle, Clock, Loader2, Info, User, Mail, Phone
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import api from "@/lib/axios";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function InvoiceDetails() {
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Loading invoice details…</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle size={40} className="mx-auto text-rose-500" />
        <h2 className="text-lg font-bold text-foreground">Error Loading Invoice</h2>
        <p className="text-sm text-muted-foreground">{error || "Invoice not found"}</p>
        <button
          onClick={() => router.push("/admin/billing")}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold"
        >
          Back to Billing
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/billing")}
            className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">Invoice Details</h1>
              <span className={clsx(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                invoice.payment_status === "Paid" ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" :
                invoice.payment_status === "Partial" ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400" :
                "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
              )}>
                {invoice.payment_status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Invoice No: <span className="font-mono font-semibold text-foreground">{invoice.invoice_number}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/admin/billing/${invoice.invoice_id}/print`}
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2.5 border border-border rounded-xl text-xs font-semibold hover:bg-muted transition-colors text-foreground"
          >
            <Printer size={13} /> Print
          </Link>
          <Link
            href={`/admin/billing/${invoice.invoice_id}/print`}
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2.5 border border-border rounded-xl text-xs font-semibold hover:bg-muted transition-colors text-foreground"
          >
            <Download size={13} /> Download PDF
          </Link>
          {invoice.balance_due > 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <DollarSign size={13} /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Invoice Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Summary Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Guest and Stay Info Card */}
          <div className="bg-background border border-border rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
            {/* Guest details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-2">
                <User size={13} className="text-accent" /> Guest Information
              </h3>
              <div className="space-y-2 text-xs">
                <p className="font-bold text-foreground text-sm">{invoice.guest?.name}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate">{invoice.guest?.email}</span>
                </div>
                {invoice.guest?.phoneNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={12} className="shrink-0" />
                    <span>{invoice.guest.phoneNumber}</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Guest ID: {invoice.guest_id}</p>
              </div>
            </div>

            {/* Stay details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-2">
                <Calendar size={13} className="text-accent" /> Stay Information
              </h3>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Check-In</span>
                    <span className="font-semibold text-foreground">{fmtDate(invoice.booking?.check_in_date)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Check-Out</span>
                    <span className="font-semibold text-foreground">{fmtDate(invoice.booking?.check_out_date)}</span>
                  </div>
                </div>
                <div className="border-t border-border/40 pt-2 flex justify-between">
                  <span className="text-muted-foreground">Total Nights:</span>
                  <span className="font-bold text-foreground">{invoice.booking?.total_nights} Nights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID:</span>
                  <span className="font-mono font-semibold text-foreground">#{invoice.booking_id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Room Details Card */}
          <div className="bg-background border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-2">
              <BedDouble size={13} className="text-accent" /> Room Information
            </h3>
            {invoice.booking?.room ? (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent/70 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {invoice.booking.room.room_number}
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Room Type</span>
                    <span className="font-bold text-foreground">{invoice.booking.room.room_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Bed Type</span>
                    <span className="font-semibold text-foreground">{invoice.booking.room.bed_type} Bed</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Rate per Night</span>
                    <span className="font-bold text-accent">${invoice.booking.room.price_per_night.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Room details unavailable.</p>
            )}
          </div>

          {/* Consolidated Charges Breakdown */}
          <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/30">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Detailed Charges Breakdown</h3>
            </div>
            
            <div className="divide-y divide-border/60">
              
              {/* Room Charges Section */}
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <BedDouble size={13} className="text-muted-foreground" /> Room Charges
                  </h4>
                  <span className="text-xs font-bold text-foreground">${invoice.room_charges.toFixed(2)}</span>
                </div>
                <div className="pl-5 text-xs text-muted-foreground flex justify-between">
                  <span>Stay: {invoice.booking?.total_nights} Nights × ${invoice.booking?.room?.price_per_night?.toFixed(2)}/night</span>
                  <span>${invoice.room_charges.toFixed(2)}</span>
                </div>
              </div>

              {/* Service Charges Section */}
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Activity size={13} className="text-muted-foreground" /> Additional Service Charges
                  </h4>
                  <span className="text-xs font-bold text-foreground">${invoice.service_charges.toFixed(2)}</span>
                </div>
                
                <div className="pl-5 space-y-2">
                  {/* Laundry breakdown */}
                  {invoice.booking?.laundryRecords?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Laundry Services</span>
                      {invoice.booking.laundryRecords.map((lr: any) => (
                        <div key={lr.text_id} className="text-xs text-muted-foreground flex justify-between">
                          <span>{lr.item_name} (Qty: {lr.quantity} · {lr.status})</span>
                          <span>${lr.charge_amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Housekeeping breakdown */}
                  {invoice.booking?.housekeepingTasks?.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-border/30">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Housekeeping & Extra Services</span>
                      {invoice.booking.housekeepingTasks.map((ht: any) => (
                        <div key={ht.task_id} className="text-xs text-muted-foreground flex justify-between">
                          <span>{ht.request_description || ht.task_type} (Priority: {ht.priority})</span>
                          <span>${ht.charge_amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!invoice.booking?.laundryRecords?.length && !invoice.booking?.housekeepingTasks?.length) && (
                    <span className="text-xs text-muted-foreground italic">No laundry or housekeeping service charges associated.</span>
                  )}
                </div>
              </div>

              {/* Food Charges Section */}
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Utensils size={13} className="text-muted-foreground" /> Food & Restaurant Charges
                  </h4>
                  <span className="text-xs font-bold text-foreground">${invoice.food_charges.toFixed(2)}</span>
                </div>

                <div className="pl-5 space-y-2">
                  {invoice.booking?.foodOrders?.length > 0 ? (
                    invoice.booking.foodOrders.map((fo: any) => (
                      <div key={fo.order_id} className="space-y-1">
                        <div className="text-xs font-medium text-foreground flex justify-between">
                          <span>Order #{fo.order_id} ({fo.order_type === "RoomService" ? "🚪 Room Service" : "🍽️ Restaurant"})</span>
                          <span>${fo.total_amount.toFixed(2)}</span>
                        </div>
                        {fo.order_items?.map((oi: any) => (
                          <div key={oi.id} className="text-[11px] text-muted-foreground pl-3 flex justify-between">
                            <span>{oi.menu_items?.name} × {oi.quantity}</span>
                            <span>${oi.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No food or kitchen charges associated.</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Financial Summary & Payments History */}
        <div className="space-y-6">
          
          {/* Financial Summary Box */}
          <div className="bg-background border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60 pb-2">
              Financial Summary
            </h3>
            
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Room Charges Subtotal:</span>
                <span className="font-medium text-foreground">${invoice.room_charges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Additional Services Subtotal:</span>
                <span className="font-medium text-foreground">${invoice.service_charges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Food & Dining Subtotal:</span>
                <span className="font-medium text-foreground">${invoice.food_charges.toFixed(2)}</span>
              </div>

              <div className="border-t border-border/40 pt-2.5 flex justify-between font-semibold">
                <span className="text-foreground">Calculated Subtotal:</span>
                <span className="text-foreground">${invoice.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Sales Tax ({invoice.tax_percent}%):</span>
                <span className="font-medium text-foreground">+${invoice.tax_amount.toFixed(2)}</span>
              </div>

              {invoice.discount_percent > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Discount ({invoice.discount_percent}%):</span>
                  <span>-${invoice.discount_amount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-border pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">Grand Total:</span>
                <span className="text-lg font-bold text-foreground">${invoice.total_amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between border-t border-border/40 pt-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Total Amount Paid:</span>
                <span>${invoice.amount_paid.toFixed(2)}</span>
              </div>

              <div className="flex justify-between border-t border-border pt-2.5 font-bold text-sm">
                <span className="text-foreground">Remaining Balance:</span>
                <span className={clsx(
                  invoice.balance_due > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  ${invoice.balance_due.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground text-center border-t border-border/40 pt-2 mt-2">
              Generated At: {fmtDateTime(invoice.generated_at)}
            </div>
          </div>

          {/* Payment History Box */}
          <div className="bg-background border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60 pb-2">
              Payment Transaction History
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {invoice.payments?.length > 0 ? (
                invoice.payments.map((p: any) => (
                  <div key={p.payment_id} className="p-3 bg-muted/40 border border-border/50 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">+${p.amount_paid.toFixed(2)}</span>
                      <span className="text-[10px] font-semibold bg-primary/10 px-1.5 py-0.5 rounded text-foreground">
                        {p.payment_method}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{fmtDateTime(p.recorded_at)}</p>
                    {p.notes && <p className="text-[10px] text-foreground bg-background p-1.5 rounded border border-border/40 italic">Note: {p.notes}</p>}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground italic flex flex-col gap-2 items-center">
                  <Clock size={16} className="text-muted-foreground/30" />
                  <span>No payments recorded yet.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-background border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-foreground">Record Invoice Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold outline-none focus:border-accent/50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-accent/50 transition-colors"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="BankTransfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Received by Reception Desk..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:border-accent/50 resize-none transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {submittingPayment ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
