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
  if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rs. ${(n / 1_000).toFixed(1)}K`;
  return `Rs. ${n.toFixed(0)}`;
}

export default function KpiCards() {
  const { kpi, loading } = useReportKpi();

  const cards = [
    {
      label: "Revenue Today",
      value: loading ? "—" : fmt(kpi?.revenue_today ?? 0),
      icon: DollarSign,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Revenue This Month",
      value: loading ? "—" : fmt(kpi?.revenue_this_month ?? 0),
      icon: TrendingUp,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      label: "Occupancy Rate",
      value: loading ? "—" : `${kpi?.occupancy_percent ?? 0}%`,
      icon: BedDouble,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      sub: "of total active rooms",
    },
    {
      label: "Active Bookings",
      value: loading ? "—" : kpi?.active_bookings ?? 0,
      icon: CalendarCheck,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      sub: "Confirmed + Checked-In",
    },
    {
      label: "Pending Payments",
      value: loading ? "—" : kpi?.pending_payments ?? 0,
      icon: CreditCard,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      sub: "Unpaid or Partial",
      subColor: "text-rose-400",
    },
    {
      label: "Low Stock Items",
      value: loading ? "—" : kpi?.low_stock_items ?? 0,
      icon: Package,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      sub: "Below threshold",
      subColor: kpi && kpi.low_stock_items > 0 ? "text-orange-500" : "text-gray-500",
    },
    {
      label: "Staff Present Today",
      value: loading ? "—" : kpi?.staff_attendance_today ?? 0,
      icon: Users,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      label: "New Guests Today",
      value: loading ? "—" : kpi?.new_guests_today ?? 0,
      icon: UserPlus,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} loading={loading} />
      ))}
    </div>
  );
}
