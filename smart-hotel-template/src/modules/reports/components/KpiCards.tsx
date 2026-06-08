"use client";
// src/modules/reports/components/KpiCards.tsx
import {
  DollarSign,
  TrendingUp,
  BedDouble,
  CalendarCheck,
  CreditCard,
  Package,
  Users,
  UserPlus,
} from "lucide-react";
import StatCard from "./StatCard";
import { useReportKpi } from "@/hooks/useReportModule";

function fmt(n: number) {
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `PKR ${(n / 1_000).toFixed(1)}K`;
  return `PKR ${n.toFixed(0)}`;
}

export default function KpiCards() {
  const { kpi, loading } = useReportKpi();

  const cards = [
    {
      label: "Revenue Today",
      value: loading ? "—" : fmt(kpi?.revenue_today ?? 0),
      icon: DollarSign,
      iconBg: "bg-emerald-600",
      iconColor: "text-white",
      cardBg: "border-emerald-100 bg-emerald-50",
    },
    {
      label: "Revenue This Month",
      value: loading ? "—" : fmt(kpi?.revenue_this_month ?? 0),
      icon: TrendingUp,
      iconBg: "bg-sky-600",
      iconColor: "text-white",
      cardBg: "border-sky-100 bg-sky-50",
    },
    {
      label: "Occupancy Rate",
      value: loading ? "—" : `${kpi?.occupancy_percent ?? 0}%`,
      icon: BedDouble,
      iconBg: "bg-violet-600",
      iconColor: "text-white",
      sub: "of total active rooms",
      cardBg: "border-violet-100 bg-violet-50",
    },
    {
      label: "Active Bookings",
      value: loading ? "—" : kpi?.active_bookings ?? 0,
      icon: CalendarCheck,
      iconBg: "bg-amber-600",
      iconColor: "text-white",
      sub: "Confirmed + Checked-In",
      cardBg: "border-amber-100 bg-amber-50",
    },
    {
      label: "Pending Payments",
      value: loading ? "—" : kpi?.pending_payments ?? 0,
      icon: CreditCard,
      iconBg: "bg-rose-600",
      iconColor: "text-white",
      sub: "Unpaid or Partial",
      subColor: "text-rose-400",
      cardBg: "border-rose-100 bg-rose-50",
    },
    {
      label: "Low Stock Items",
      value: loading ? "—" : kpi?.low_stock_items ?? 0,
      icon: Package,
      iconBg: "bg-orange-600",
      iconColor: "text-white",
      sub: "Below threshold",
      subColor: kpi && kpi.low_stock_items > 0 ? "text-orange-500" : "text-gray-500",
      cardBg: "border-orange-100 bg-orange-50",
    },
    {
      label: "Staff Present Today",
      value: loading ? "—" : kpi?.staff_attendance_today ?? 0,
      icon: Users,
      iconBg: "bg-teal-600",
      iconColor: "text-white",
      cardBg: "border-teal-100 bg-teal-50",
    },
    {
      label: "New Guests Today",
      value: loading ? "—" : kpi?.new_guests_today ?? 0,
      icon: UserPlus,
      iconBg: "bg-indigo-600",
      iconColor: "text-white",
      cardBg: "border-indigo-100 bg-indigo-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <StatCard key={card.label} {...card} loading={loading} index={idx} />
      ))}
    </div>
  );
}
