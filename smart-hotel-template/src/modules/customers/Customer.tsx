// src/modules/customer/CustomerDashboard.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  CalendarCheck,
  CreditCard,
  BedDouble,
  ChefHat,
  Bell,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowRight,
  Shirt,
  Star,
  MapPin,
  Moon,
  Receipt,
  Utensils,
} from "lucide-react";

{{#if booking}}
// Booking module imports
{{/if}}

{{#if kitchen}}
// Kitchen module imports
{{/if}}

{{#if billing}}
// Billing module imports
{{/if}}

{{#if housekeeping}}
// Housekeeping module imports
{{/if}}

// ── Types ─────────────────────────────────────────────────────────────────────
{{#if booking}}
interface ActiveBooking {
  booking_id: number;
  room_number: string;
  room_type: string;
  floor: number;
  cleaning_status: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  status: string;
}

interface RecentBooking {
  booking_id: number;
  room_number: string;
  room_type: string;
  check_in: string;
  check_out: string;
  status: string;
  total_nights: number;
}
{{/if}}

{{#if billing}}
interface RecentInvoice {
  invoice_id: number;
  invoice_number: string;
  room_number: string;
  room_type: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_status: string;
  generated_at: string;
}
{{/if}}

{{#if kitchen}}
interface RecentOrder {
  id: number;
  order_type: string;
  status: string;
  total_amount: number;
  customer_name: string;
  created_at: string;
  items: string[];
}
{{/if}}

interface DashboardData {
  {{#if booking}}
  activeBooking: ActiveBooking | null;
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    recent: RecentBooking[];
  };
  {{/if}}
  {{#if billing}}
  billing: {
    totalInvoices: number;
    totalSpent: number;
    totalPaid: number;
    balanceDue: number;
    recentInvoices: RecentInvoice[];
  };
  {{/if}}
  {{#if kitchen}}
  foodOrders: { recent: RecentOrder[] };
  {{/if}}
  alerts: {
    unreadNotifications: number;
    {{#if housekeeping}}
    pendingLaundry: number;
    {{/if}}
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const fmtCurrency = (n: number) =>
  `PKR ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(n)}`;

{{#if booking}}
function daysUntilCheckout(checkoutDate: string): number {
  const now = new Date();
  const checkout = new Date(checkoutDate);
  return Math.ceil((checkout.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function BookingStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { cls: string; label: string; icon: any }> = {
    Pending: { cls: "bg-amber-100 text-amber-800 border-amber-200", label: "Pending", icon: Clock },
    Confirmed: { cls: "bg-blue-100 text-blue-800 border-blue-200", label: "Confirmed", icon: CheckCircle2 },
    CheckedIn: { cls: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Checked In", icon: CheckCircle2 },
    "Checked-In": { cls: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Checked In", icon: CheckCircle2 },
    CheckedOut: { cls: "bg-gray-100 text-gray-700 border-gray-200", label: "Checked Out", icon: CheckCircle2 },
    "Checked-Out": { cls: "bg-gray-100 text-gray-700 border-gray-200", label: "Checked Out", icon: CheckCircle2 },
    Cancelled: { cls: "bg-rose-100 text-rose-800 border-rose-200", label: "Cancelled", icon: XCircle },
  };
  const c = configs[status] ?? configs["Pending"];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.cls}`}>
      <Icon size={10} />
      {c.label}
    </span>
  );
}
{{/if}}

{{#if billing}}
function PaymentStatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    Paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Partial: "bg-amber-100 text-amber-800 border-amber-200",
    Unpaid: "bg-rose-100 text-rose-800 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${configs[status] ?? configs["Unpaid"]}`}>
      {status}
    </span>
  );
}
{{/if}}

{{#if kitchen}}
function OrderStatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Accepted: "bg-blue-100 text-blue-800",
    Preparing: "bg-orange-100 text-orange-800",
    Ready: "bg-sky-100 text-sky-800",
    Delivered: "bg-emerald-100 text-emerald-800",
    Cancelled: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${configs[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
{{/if}}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = session?.user;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customers/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <div className="h-40 bg-gradient-to-r from-gray-100 to-gray-50 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto mt-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Failed to Load Dashboard</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  {{#if booking}}
  const activeBooking = data?.activeBooking;
  const bookings = data?.bookings;
  const daysLeft = activeBooking ? daysUntilCheckout(activeBooking.check_out_date) : 0;
  {{/if}}

  {{#if billing}}
  const billing = data?.billing;
  {{/if}}

  {{#if kitchen}}
  const foodOrders = data?.foodOrders;
  {{/if}}

  const alerts = data?.alerts;

  // Build stat cards based on available modules
  const statCards = [];

  {{#if booking}}
  statCards.push({
    label: "Total Bookings",
    value: bookings?.total || 0,
    icon: CalendarCheck,
    bg: "bg-indigo-50 border-indigo-100",
    iconColor: "text-indigo-600",
    href: "/customer/booking",
  });
  {{/if}}

  {{#if billing}}
  statCards.push({
    label: "Total Invoices",
    value: billing?.totalInvoices || 0,
    icon: Receipt,
    bg: "bg-teal-50 border-teal-100",
    iconColor: "text-teal-600",
    href: "/customer/billing",
  });
  
  statCards.push({
    label: "Balance Due",
    value: fmtCurrency(billing?.balanceDue || 0),
    icon: CreditCard,
    bg: (billing?.balanceDue || 0) > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100",
    iconColor: (billing?.balanceDue || 0) > 0 ? "text-rose-600" : "text-emerald-600",
    href: "/customer/billing",
  });
  {{/if}}

  statCards.push({
    label: "Notifications",
    value: alerts?.unreadNotifications || 0,
    icon: Bell,
    bg: (alerts?.unreadNotifications || 0) > 0 ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100",
    iconColor: (alerts?.unreadNotifications || 0) > 0 ? "text-amber-600" : "text-gray-500",
    href: "/customer/notifications",
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Welcome Hero Banner ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 -translate-x-12 translate-y-12 pointer-events-none" />
        <div className="absolute top-6 right-6 w-32 h-32 rounded-full bg-gold/10 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">
              {greeting()}, welcome back 👋
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {user?.name ?? "Valued Guest"}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(alerts?.unreadNotifications || 0) > 0 && (
              <Link href="/customer/notifications" className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-sm font-semibold border border-white/20 transition-all">
                <Bell size={15} />
                {alerts?.unreadNotifications} unread
              </Link>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl border border-white/20 transition-all"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </motion.div>

      {{#if booking}}
      {/* ── Active Stay Card ───────────────────────────────────────────────── */}
      {activeBooking ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 sm:p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row gap-5 sm:items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl border border-emerald-200 flex-shrink-0">
                <BedDouble className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Currently Staying</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <h2 className="text-xl font-bold text-emerald-900">
                  Room {activeBooking.room_number}
                  <span className="ml-2 text-sm font-medium text-emerald-700">— {activeBooking.room_type}</span>
                </h2>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-emerald-700 font-medium">
                  <span className="flex items-center gap-1"><MapPin size={11} /> Floor {activeBooking.floor}</span>
                  <span className="flex items-center gap-1"><CalendarCheck size={11} /> Check-in: {fmt(activeBooking.check_in_date)}</span>
                  <span className="flex items-center gap-1"><CalendarCheck size={11} /> Check-out: {fmt(activeBooking.check_out_date)}</span>
                  <span className="flex items-center gap-1"><Moon size={11} /> {activeBooking.total_nights} night{activeBooking.total_nights !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <div className="text-center sm:text-right">
                <p className="text-3xl font-black text-emerald-900">{Math.max(0, daysLeft)}</p>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                  {daysLeft <= 0 ? "Checkout Today" : "Days Left"}
                </p>
              </div>
              {{#if housekeeping}}
              {(alerts?.pendingLaundry || 0) > 0 && (
                <Link href="/customer/housekeeping" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-300 transition">
                  <Shirt size={12} /> {alerts?.pendingLaundry} Laundry
                </Link>
              )}
              {{/if}}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 flex items-center gap-4"
        >
          <div className="p-3 bg-muted rounded-xl"><BedDouble className="w-5 h-5 text-muted-foreground/60" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">No Active Stay</p>
            <p className="text-xs text-muted-foreground">You don't have an active check-in right now.</p>
          </div>
          <Link href="/customer/booking" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition">
            Book a Room <ArrowRight size={11} />
          </Link>
        </motion.div>
      )}
      {{/if}}

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + idx * 0.05 }}
            >
              <Link
                href={card.href}
                className={`block bg-background rounded-2xl border ${card.bg} p-4 sm:p-5 hover:shadow-lg transition-all duration-300 group`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-white/80 flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-tight">
                      {card.label}
                    </span>
                    <span className="text-xl font-black text-foreground mt-0.5 block tracking-tight">
                      {card.value}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* ── Main Content Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Left — Bookings & Food Orders -->
        <div className="lg:col-span-2 space-y-6">

          {{#if booking}}
          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <CalendarCheck className="w-4 h-4 text-muted-foreground" /> My Bookings
              </h3>
              <Link href="/customer/booking" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {!bookings?.recent || bookings.recent.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No bookings yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      {["Room", "Type", "Check-In", "Check-Out", "Nights", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {bookings.recent.map((b) => (
                      <tr key={b.booking_id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-xs text-foreground">#{b.room_number}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{b.room_type}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmt(b.check_in)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmt(b.check_out)}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground">{b.total_nights}</td>
                        <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
          {{/if}}

          {{#if kitchen}}
          {/* Recent Food Orders */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <Utensils className="w-4 h-4 text-muted-foreground" /> Recent Food Orders
              </h3>
              <Link href="/customer/kitchen" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                Order Food <ArrowRight size={11} />
              </Link>
            </div>
            {!foodOrders?.recent || foodOrders.recent.length === 0 ? (
              <div className="py-12 text-center">
                <ChefHat className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No food orders yet.</p>
                <Link href="/customer/kitchen" className="text-xs text-primary font-semibold mt-1 inline-block hover:underline">
                  Browse Menu →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {foodOrders.recent.map((order) => (
                  <div key={order.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-muted/20 transition">
                    <div className="p-2 bg-orange-50 rounded-xl border border-orange-100 flex-shrink-0">
                      <ChefHat className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        Order #{order.id} — {order.order_type}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {order.items.join(", ") || "—"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-foreground">{fmtCurrency(order.total_amount)}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
          {{/if}}

        </div>

        <div className="space-y-6">

          {{#if billing}}
          {/* Billing Summary */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-background rounded-2xl border border-border shadow-sm p-5 space-y-4"
          >
            <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-muted-foreground" /> Billing Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground text-xs">Total Spent</span>
                <span className="font-bold text-foreground">{fmtCurrency(billing?.totalSpent || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground text-xs">Amount Paid</span>
                <span className="font-bold text-emerald-600">{fmtCurrency(billing?.totalPaid || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground text-xs">Balance Due</span>
                <span className={`font-bold ${(billing?.balanceDue || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {fmtCurrency(billing?.balanceDue || 0)}
                </span>
              </div>
            </div>

            {(billing?.balanceDue || 0) > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-rose-700">
                  You have an outstanding balance of {fmtCurrency(billing?.balanceDue || 0)}. Please contact the front desk.
                </p>
              </div>
            )}

            {(billing?.balanceDue || 0) === 0 && (billing?.totalInvoices || 0) > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-[11px] font-medium text-emerald-700">All invoices are paid. Thank you!</p>
              </div>
            )}

            <Link href="/customer/billing" className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition border border-primary/20">
              View All Invoices <ArrowRight size={11} />
            </Link>
          </motion.div>

          {/* Recent Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <Receipt className="w-4 h-4 text-muted-foreground" /> Recent Invoices
              </h3>
            </div>

            {!billing?.recentInvoices || billing.recentInvoices.length === 0 ? (
              <div className="py-10 text-center">
                <CreditCard className="w-7 h-7 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">No invoices yet.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Invoices are generated at checkout.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {billing.recentInvoices.map((inv) => (
                  <Link
                    key={inv.invoice_id}
                    href={`/customer/billing/${inv.invoice_id}`}
                    className="block px-5 py-3.5 hover:bg-muted/20 transition group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-foreground font-mono">
                          {inv.invoice_number}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Room {inv.room_number} · {fmt(inv.generated_at)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-foreground">{fmtCurrency(inv.total_amount)}</p>
                        <div className="mt-0.5">
                          <PaymentStatusBadge status={inv.payment_status} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
          {{/if}}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-background rounded-2xl border border-border shadow-sm p-5 space-y-3"
          >
            <h3 className="font-bold text-foreground text-sm">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {{#if booking}}
              <Link href="/customer/booking" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition group">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                  <BedDouble className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground text-center leading-tight">Book Room</span>
              </Link>
              {{/if}}

              {{#if kitchen}}
              <Link href="/customer/kitchen" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition group">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform">
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground text-center leading-tight">Order Food</span>
              </Link>
              {{/if}}

              {{#if housekeeping}}
              <Link href="/customer/housekeeping" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition group">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
                  <Loader2 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground text-center leading-tight">Housekeeping</span>
              </Link>
              {{/if}}

              {{#if billing}}
              <Link href="/customer/billing" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition group">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground text-center leading-tight">My Invoices</span>
              </Link>
              {{/if}}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}