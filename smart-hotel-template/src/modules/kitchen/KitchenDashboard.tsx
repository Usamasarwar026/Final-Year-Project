// src/modules/kitchen/admin/KitchenDashboard.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChefHat, ShoppingBag, Clock, Flame, CheckCircle2,
  TrendingUp, DollarSign, Utensils, RefreshCw, ArrowRight,
  Bike, AlertCircle, Star, BarChart3,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";
import { useKitchenStats, useKitchenOrders } from "@/hooks/useKitchen";
import { ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG } from "@/types/kitchen";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtPKR = (n: number) =>
  `PKR ${n.toLocaleString("en-PK", { minimumFractionDigits: 0 })}`;

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, sub, href,
}: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; sub?: string; href?: string;
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "bg-background border border-border rounded-2xl p-4 flex items-center gap-3.5",
        href && "hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
      )}
    >
      <div className={clsx("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
      {href && <ArrowRight size={14} className="text-muted-foreground shrink-0" />}
    </motion.div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Live Order Ticker ────────────────────────────────────────────────────────
function LiveOrderTicker({ orders }: { orders: any[] }) {
  const active = orders.filter((o) =>
    !["Delivered", "Cancelled"].includes(o.status)
  ).slice(0, 8);

  if (active.length === 0) {
    return (
      <div className="py-12 text-center">
        <ChefHat size={28} className="mx-auto text-muted-foreground/20 mb-2" />
        <p className="text-sm text-muted-foreground">No active orders right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {active.map((order, i) => {
        const sc = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG];
        const tc = ORDER_TYPE_CONFIG[order.order_type as keyof typeof ORDER_TYPE_CONFIG];
        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors"
          >
            <span className="text-base shrink-0">{tc?.icon ?? "🍽️"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">
                Order #{order.id}
                <span className="font-normal text-muted-foreground ml-2">
                  {order.order_type === "RoomService"
                    ? `Room ${order.room_number}`
                    : `Table ${order.table_number}`}
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                {order.items?.length ?? 0} items · {fmtTime(order.placed_at)}
              </p>
            </div>
            <span
              className={clsx(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap",
                sc?.bg, sc?.color, sc?.border
              )}
            >
              <span className={clsx("inline-block w-1.5 h-1.5 rounded-full mr-1", sc?.dot)} />
              {sc?.label}
            </span>
            <p className="text-xs font-bold text-foreground shrink-0">
              {fmtPKR(Number(order.total_amount))}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function KitchenDashboard() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useKitchenStats();
  const { data: orders = [], isLoading: ordersLoading }                 = useKitchenOrders();

  const CHART_COLORS = ["#0f172a", "#0ea5e9", "#d4af37", "#22c55e", "#f59e0b", "#8b5cf6"];

  const statCards = [
    { label: "Total Orders",    value: stats?.totalOrders     ?? 0, icon: ShoppingBag,  color: "bg-primary",    href: "/admin/kitchen/orders"    },
    { label: "Pending",         value: stats?.pendingOrders   ?? 0, icon: Clock,        color: "bg-amber-500",  href: "/admin/kitchen/orders?status=Pending"   },
    { label: "Preparing",       value: stats?.preparingOrders ?? 0, icon: Flame,        color: "bg-orange-500", href: "/admin/kitchen/orders?status=Preparing" },
    { label: "Ready to Serve",  value: stats?.readyOrders     ?? 0, icon: CheckCircle2, color: "bg-teal-600",   href: "/admin/kitchen/orders?status=Ready"     },
    { label: "Delivered Today", value: stats?.deliveredOrders ?? 0, icon: Bike,         color: "bg-green-600",  href: "/admin/kitchen/orders?status=Delivered" },
    { label: "Total Revenue",   value: fmtPKR(stats?.revenue ?? 0), icon: DollarSign, color: "bg-purple-600"  },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">👨‍🍳</span> Kitchen Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live overview of kitchen operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live • Auto-refresh 10s
          </span>
          <button
            onClick={() => refetchStats()}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
          >
            <RefreshCw size={15} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders by Day */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-background border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Orders — Last 7 Days</h3>
              <p className="text-[10px] text-muted-foreground">Daily order volume trend</p>
            </div>
            <BarChart3 size={16} className="text-muted-foreground" />
          </div>
          {statsLoading ? (
            <div className="h-48 bg-muted/30 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats?.ordersByDay ?? []} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0f172a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [v, "Orders"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="count" stroke="#0f172a" strokeWidth={2} fill="url(#ordersGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Category Performance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-background border border-border rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">Top Categories</h3>
          <p className="text-[10px] text-muted-foreground mb-4">By revenue (PKR)</p>
          {statsLoading ? (
            <div className="h-48 bg-muted/30 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.categoryPerformance ?? []} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  formatter={(v: number) => [`PKR ${v.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 11 }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {(stats?.categoryPerformance ?? []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Orders */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-background border border-border rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-foreground">Live Active Orders</h3>
            </div>
            <Link
              href="/admin/kitchen/orders"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="p-4">
            <LiveOrderTicker orders={orders} />
          </div>
        </motion.div>

        {/* Top Foods */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-background border border-border rounded-2xl overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Star size={14} className="text-gold" fill="currentColor" />
            <h3 className="text-sm font-semibold text-foreground">Most Ordered</h3>
          </div>
          <div className="p-4 space-y-2">
            {statsLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-9 bg-muted/40 rounded-xl animate-pulse" />
              ))
            ) : (stats?.mostOrderedFoods ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No data yet</p>
            ) : (
              (stats?.mostOrderedFoods ?? []).map((food, i) => {
                const max = stats!.mostOrderedFoods[0]?.count ?? 1;
                const pct = Math.round((food.count / max) * 100);
                return (
                  <div key={food.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground truncate max-w-[140px]">
                        {i + 1}. {food.name}
                      </span>
                      <span className="font-bold text-foreground shrink-0">{food.count}×</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4 + i * 0.06, duration: 0.5 }}
                        className="h-full rounded-full bg-gold"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "Manage Orders",    href: "/admin/kitchen/orders",     icon: Utensils,    color: "bg-primary/10 text-primary hover:bg-primary/15"   },
          { label: "Menu Management",  href: "/admin/kitchen/menu",       icon: ChefHat,     color: "bg-gold/10 text-gold hover:bg-gold/15"            },
          { label: "Assign Delivery",  href: "/admin/kitchen/deliveries", icon: Bike,        color: "bg-green-100 text-green-700 hover:bg-green-200"   },
          { label: "Kitchen Reports",  href: "/admin/kitchen/reports",    icon: BarChart3,   color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={href} href={href}
            className={clsx(
              "flex items-center gap-2.5 p-4 rounded-2xl border border-border transition-all text-sm font-semibold",
              color
            )}
          >
            <Icon size={18} className="shrink-0" />
            {label}
          </Link>
        ))}
      </motion.div>
    </div>
  );
}