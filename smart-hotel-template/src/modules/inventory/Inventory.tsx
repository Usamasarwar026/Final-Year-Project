"use client";

import { Package, AlertTriangle, TrendingDown, ShoppingCart, Clock, BarChart3 } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import StatCard from "@/modules/reports/components/StatCard";
import { motion } from "framer-motion";

export default function Inventory() {
  const { stats, loading } = useInventory();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 mt-1">Track stock, purchase orders, and wastage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: "Total Items", value: loading ? "..." : stats?.totalItems ?? 0, icon: Package, iconBg: "bg-slate-600", iconColor: "text-white", cardBg: "border-slate-100 bg-slate-50" },
          { label: "Low Stock Alerts", value: loading ? "..." : stats?.lowStockCount ?? 0, icon: AlertTriangle, iconBg: "bg-rose-600", iconColor: "text-white", cardBg: "border-rose-100 bg-rose-50" },
          { label: "Expiring Soon (7 days)", value: loading ? "..." : stats?.expiringCount ?? 0, icon: Clock, iconBg: "bg-amber-600", iconColor: "text-white", cardBg: "border-amber-100 bg-amber-50" },
          { label: "Pending POs", value: loading ? "..." : stats?.pendingPOs ?? 0, icon: ShoppingCart, iconBg: "bg-indigo-600", iconColor: "text-white", cardBg: "border-indigo-100 bg-indigo-50" },
          { label: "Monthly Wastage Cost", value: loading ? "..." : `PKR ${stats?.monthlyWastageCost ?? 0}`, icon: TrendingDown, iconBg: "bg-orange-600", iconColor: "text-white", cardBg: "border-orange-100 bg-orange-50" },
          { label: "COGS (This Month)", value: loading ? "..." : `PKR ${stats?.monthlyCOGS ?? 0}`, icon: BarChart3, iconBg: "bg-emerald-600", iconColor: "text-white", cardBg: "border-emerald-100 bg-emerald-50" },
        ].map((card, idx) => (
          <StatCard key={card.label} {...card} loading={loading} index={idx} />
        ))}
      </div>
    </div>
  );
}