// src/modules/billing/Billing.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  X,
  Eye,
  Printer,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Loader2,
  Plus,
  Info,
  ChevronDown,
  Check,
  Download,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useSession } from "next-auth/react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function PaymentStatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { bg: string; text: string; dot: string; label: string }
  > = {
    Paid: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
      label: "Paid",
    },
    Partial: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
      label: "Partial",
    },
    Unpaid: {
      bg: "bg-rose-100 dark:bg-rose-900/30",
      text: "text-rose-700 dark:text-rose-400",
      dot: "bg-rose-500",
      label: "Unpaid",
    },
  };
  const c = configs[status] || configs["Unpaid"];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
        c.bg,
        c.text,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  icon: Icon,
  prefix = "",
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ElementType;
  prefix?: string;
}) {
  return (
    <div className="bg-background border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
      <div
        className={clsx(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
          color,
        )}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">
          {prefix}
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 font-medium">
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Record Payment Modal ──────────────────────────────────────────────────────
interface PaymentModalProps {
  invoice: any;
  onClose: () => void;
  onSuccess: () => void;
}

function RecordPaymentModal({
  invoice,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState<string>(invoice.balance_due.toFixed(2));
  const [method, setMethod] = useState<string>("Cash");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = Number(amount);

    if (isNaN(payAmt) || payAmt <= 0) {
      return toast.error("Please enter a valid payment amount");
    }
    if (payAmt > invoice.balance_due) {
      return toast.error(
        `Payment amount cannot exceed balance due (PKR ${invoice.balance_due.toFixed(2)})`,
      );
    }

    setLoading(true);
    try {
      await api.post(`/billing/${invoice.invoice_id}/payments`, {
        amount: payAmt,
        payment_method: method,
        notes,
      });
      toast.success("Payment recorded successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-background border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Record Payment
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Invoice {invoice.invoice_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="bg-muted/55 rounded-xl p-3.5 space-y-1.5 text-xs border border-border">
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Guest:</span>
            <span className="font-semibold text-foreground">
              {invoice.guest?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">
              Total Invoice Amount:
            </span>
            <span className="font-semibold text-foreground">
              PKR {invoice.total_amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">
              Amount Already Paid:
            </span>
            <span className="font-semibold text-emerald-600">
              PKR ${invoice.amount_paid.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5 font-bold text-sm">
            <span className="text-foreground">Remaining Balance:</span>
            <span className="text-accent">
              ${invoice.balance_due.toFixed(2)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Payment Amount (PKR) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold outline-none focus:border-accent/50 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Payment Method *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-accent/50 transition-colors"
            >
              <option value="Cash">💵 Cash (Offline Counter)</option>
              <option value="Card">💳 Credit/Debit Card (Manual Log)</option>
              <option value="BankTransfer">
                🏦 Bank Transfer (Manual Log)
              </option>
              <option value="JazzCash">📱 JazzCash (Manual Record)</option>
              <option value="EasyPaisa">📱 EasyPaisa (Manual Record)</option>
            </select>
            <span className="text-[10px] text-muted-foreground mt-1.5 block leading-normal">
              Note: This form registers offline receipts manually. No online
              payment gateways will be charged.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Card ending in 4522..."
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:border-accent/50 resize-none transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <DollarSign size={14} />
              )}
              Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Generate Invoice Modal ───────────────────────────────────────────────────
interface GenerateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function GenerateInvoiceModal({ onClose, onSuccess }: GenerateModalProps) {
  const [bookingId, setBookingId] = useState("");
  const [taxPercent, setTaxPercent] = useState("10");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load bookings that don't have invoices yet
  useEffect(() => {
    const loadUninvoiced = async () => {
      setLoadingBookings(true);
      try {
        // Fetch all bookings
        const { data } = await api.get<{ bookings: any[] }>("/bookings");
        // Also fetch all invoices to filter
        const invRes = await api.get<{ invoices: any[] }>("/billing");
        const invoicedBookingIds = new Set(
          invRes.data.invoices.map((i) => i.booking_id),
        );

        // Filter bookings that do not have an invoice, and status is CheckedIn, CheckedOut, or Confirmed
        const available = data.bookings.filter(
          (b) =>
            !invoicedBookingIds.has(b.booking_id) &&
            ["Confirmed", "CheckedIn", "CheckedOut"].includes(b.status),
        );
        setBookings(available);
      } catch (err) {
        console.error("Failed to load uninvoiced bookings", err);
      } finally {
        setLoadingBookings(false);
      }
    };
    loadUninvoiced();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      return toast.error("Please select a booking");
    }

    setSubmitting(true);
    try {
      await api.post("/billing", {
        booking_id: Number(bookingId),
        tax_percent: Number(taxPercent),
        discount_percent: Number(discountPercent),
      });
      toast.success("Invoice generated successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to generate invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-background border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Generate Invoice
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manually create invoice for a booking
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Select Active Booking *
            </label>
            {loadingBookings ? (
              <div className="py-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={13} className="animate-spin" /> Loading available
                stays...
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs border border-amber-100 flex items-start gap-2">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  No active stays require invoice generation (all bookings
                  either already have an invoice or are not confirmed).
                </span>
              </div>
            ) : (
              <select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-accent/50 transition-colors"
                required
              >
                <option value="">Select Booking stay...</option>
                {bookings.map((b) => (
                  <option key={b.booking_id} value={b.booking_id}>
                    #{b.booking_id} - {b.user?.name} (Room {b.room?.room_number}{" "}
                    · {b.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Tax (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || bookings.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Billing Page ────────────────────────────────────────────────────────
export default function Billing() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals state
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<any | null>(
    null,
  );
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const { data: session } = useSession();
  const basePath = session?.user?.role === "STAFF" ? "/staff" : "/admin";

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ invoices: any[] }>("/billing", {
        params: {
          search: search || undefined,
          payment_status: statusFilter !== "All" ? statusFilter : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      setInvoices(data.invoices);
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setStartDate("");
    setEndDate("");
  };

  // Compute stats aggregates based on the current search/filter invoices
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let outstanding = 0;
    let paidCount = 0;
    let unpaidOrPartialCount = 0;

    invoices.forEach((inv) => {
      totalRevenue += inv.amount_paid;
      outstanding += inv.balance_due;
      if (inv.payment_status === "Paid") {
        paidCount++;
      } else {
        unpaidOrPartialCount++;
      }
    });

    return {
      revenue: totalRevenue.toFixed(0),
      outstanding: outstanding.toFixed(0),
      paidCount,
      unpaidOrPartialCount,
    };
  }, [invoices]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Billing & Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and track guest invoices, record payments, and manage hotel
            balances.
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={15} /> Generate Invoice
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue Collected"
          value={stats.revenue}
          icon={TrendingUp}
          color="bg-emerald-500"
          prefix="PKR "
        />
        <StatCard
          label="Outstanding Balances"
          value={stats.outstanding}
          icon={AlertTriangle}
          color="bg-amber-500"
          prefix="PKR "
        />
        <StatCard
          label="Fully Paid Invoices"
          value={stats.paidCount}
          icon={CheckCircle2}
          color="bg-blue-500"
        />
        <StatCard
          label="Pending / Unpaid Bills"
          value={stats.unpaidOrPartialCount}
          icon={CreditCard}
          color="bg-slate-700"
        />
      </div>

      {/* Search and Filters Layout */}
      <div className="bg-background border border-border rounded-2xl p-4.5 space-y-3 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Search & Filters
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Invoice #, guest name..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/40 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-accent/40 transition-colors"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 md:col-span-2">
            <div className="flex-1 relative">
              <Calendar
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground outline-none focus:border-accent/40"
              />
            </div>
            <span className="text-xs text-muted-foreground">to</span>
            <div className="flex-1 relative">
              <Calendar
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground outline-none focus:border-accent/40"
              />
            </div>
            {(search || statusFilter !== "All" || startDate || endDate) && (
              <button
                onClick={handleClearFilters}
                className="p-2 text-xs font-semibold text-rose-500 hover:text-rose-600 shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Listing Table */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2
              size={24}
              className="animate-spin text-muted-foreground/40"
            />
            <p className="text-sm text-muted-foreground">Loading invoices…</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-rose-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {[
                    "Invoice #",
                    "Guest",
                    "Room",
                    "Invoice Date",
                    "Subtotal",
                    "Tax/Discount",
                    "Grand Total",
                    "Balance Due",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <CreditCard
                        size={32}
                        className="mx-auto mb-2.5 text-muted-foreground/20"
                      />
                      <p className="text-sm text-muted-foreground font-medium">
                        No invoices found
                      </p>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.invoice_id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-4 font-mono font-semibold text-xs text-foreground">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent/70 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {inv.guest?.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-xs truncate max-w-[120px]">
                              {inv.guest?.name || "—"}
                            </p>
                            <p className="text-muted-foreground text-[10px] truncate max-w-[120px]">
                              ID: {inv.guest_id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-foreground text-xs">
                            Room {inv.booking?.room?.room_number || "—"}
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            {inv.booking?.room?.room_type || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(inv.generated_at)}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-foreground">
                        PKR {inv.subtotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        <span>+{inv.tax_percent}% Tax</span>
                        {inv.discount_percent > 0 && (
                          <span className="block text-rose-500">
                            -{inv.discount_percent}% Disc
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-foreground">
                        PKR {inv.total_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={clsx(
                            "text-xs font-semibold",
                            inv.balance_due > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          PKR {inv.balance_due.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <PaymentStatusBadge status={inv.payment_status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`${basePath}/billing/${inv.invoice_id}`}
                            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-zinc-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/20 transition-all"
                            title="View Invoice Details"
                          >
                            <Eye size={16} />
                          </Link>
                          {inv.balance_due > 0 && (
                            <button
                              onClick={() => setActivePaymentInvoice(inv)}
                              className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 transition-all"
                              title="Record Payment"
                            >
                              <DollarSign size={16} />
                            </button>
                          )}
                          <Link
                            href={`${basePath}/billing/${inv.invoice_id}/print`}
                            target="_blank"
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            title="Print Invoice"
                          >
                            <Printer size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals rendering */}
      {activePaymentInvoice && (
        <RecordPaymentModal
          invoice={activePaymentInvoice}
          onClose={() => setActivePaymentInvoice(null)}
          onSuccess={fetchInvoices}
        />
      )}

      {showGenerateModal && (
        <GenerateInvoiceModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={fetchInvoices}
        />
      )}
    </div>
  );
}
