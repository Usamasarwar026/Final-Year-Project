"use client";

import { Package, AlertTriangle, TrendingDown, ShoppingCart, Clock, BarChart3 } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";

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
        <StatCard title="Total Items" value={loading ? "..." : stats?.totalItems ?? 0} icon={<Package className="w-6 h-6 text-blue-600" />} bg="bg-blue-50" />
        <StatCard title="Low Stock Alerts" value={loading ? "..." : stats?.lowStockCount ?? 0} icon={<AlertTriangle className="w-6 h-6 text-red-600" />} bg="bg-red-50" />
        <StatCard title="Expiring Soon (7 days)" value={loading ? "..." : stats?.expiringCount ?? 0} icon={<Clock className="w-6 h-6 text-yellow-600" />} bg="bg-yellow-50" />
        <StatCard title="Pending POs" value={loading ? "..." : stats?.pendingPOs ?? 0} icon={<ShoppingCart className="w-6 h-6 text-purple-600" />} bg="bg-purple-50" />
        <StatCard title="Monthly Wastage Cost" value={loading ? "..." : `Rs. ${stats?.monthlyWastageCost ?? 0}`} icon={<TrendingDown className="w-6 h-6 text-orange-600" />} bg="bg-orange-50" />
        <StatCard title="COGS (This Month)" value={loading ? "..." : `Rs. ${stats?.monthlyCOGS ?? 0}`} icon={<BarChart3 className="w-6 h-6 text-green-600" />} bg="bg-green-50" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Stock Items", href: "/admin/inventory/items" },
          { label: "Purchase Orders", href: "/admin/inventory/purchase-orders" },
          { label: "Wastage", href: "/admin/inventory/wastage" },
          { label: "Reports", href: "/admin/inventory/reports" },
        ].map((link) => (
          <a key={link.href} href={link.href} className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition text-center text-sm font-medium text-gray-700">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bg }: { title: string; value: string | number; icon: React.ReactNode; bg: string; }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`${bg} p-3 rounded-lg`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}