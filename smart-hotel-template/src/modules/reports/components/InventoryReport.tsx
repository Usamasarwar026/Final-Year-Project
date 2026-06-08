"use client";
// src/modules/reports/components/InventoryReport.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import ChartCard from "./ChartCard";
import ExportButton from "./ExportButton";
import { useInventoryReport } from "@/hooks/useReportModule";

const fmt = (n: number) =>
  `PKR ${n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toFixed(0)}`;

interface Props {
  from: string;
  to: string;
}

export default function InventoryReport({ from, to }: Props) {
  const { report, loading, error } = useInventoryReport(from, to);

  const summaryCards = [
    { label: "Total Items", value: report?.total_items ?? 0, color: "text-slate-800" },
    { label: "Low Stock Items", value: report?.low_stock_count ?? 0, color: report?.low_stock_count && report.low_stock_count > 0 ? "text-rose-600 font-semibold animate-pulse" : "text-emerald-600" },
    { label: "Total Purchase Value", value: fmt(report?.total_purchase_cost ?? 0), color: "text-indigo-600" },
    { label: "Consumption Value", value: fmt(report?.total_consumption_cost ?? 0), color: "text-violet-600" },
  ];

  const exportCols = [
    { header: "Category", key: "category" },
    { header: "Unique Items Count", key: "items_count" },
    { header: "Total Quantity Consumed", key: "total_consumed" },
    { header: "Total Consumption Cost", key: "total_cost" },
  ];

  const lowStockCols = [
    { header: "Item Name", key: "name" },
    { header: "Category", key: "category" },
    { header: "Current Stock", key: "quantity" },
    { header: "Reorder Threshold", key: "threshold" },
    { header: "Unit", key: "unit" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Inventory Report</h2>
          <p className="text-sm text-gray-500">Stock levels and consumption logs</p>
        </div>
        <div className="flex gap-2">
          {report?.category_usage && (
            <ExportButton
              disabled={loading}
              config={{
                title: "Inventory Category Usage Report",
                subtitle: "Category usage analysis",
                columns: exportCols,
                rows: report.category_usage,
                from,
                to,
              }}
            />
          )}
          {report?.low_stock_items && (
            <ExportButton
              disabled={loading}
              config={{
                title: "Low Stock Alert Report",
                subtitle: "Items currently below reorder threshold",
                columns: lowStockCols,
                rows: report.low_stock_items,
                from,
                to,
              }}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {loading ? (
              <div className="h-6 w-20 bg-gray-100 rounded animate-pulse mt-1" />
            ) : (
              <p className={`text-lg font-bold mt-1 ${c.color}`}>{c.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Category Usage Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ChartCard
            title="Consumption Cost by Category"
            loading={loading}
            empty={!loading && (report?.category_usage.length ?? 0) === 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={report?.category_usage ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(val: any) => fmt(val)} />
                <Legend />
                <Bar dataKey="total_cost" name="Consumption Cost" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Low Stock Panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[322px]">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">Low Stock Alerts</h3>
            <span className="bg-rose-50 text-rose-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {report?.low_stock_items.length ?? 0} Alert(s)
            </span>
          </div>
          <div className="p-2 overflow-y-auto flex-1 divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 animate-pulse flex justify-between items-center">
                  <div>
                    <div className="h-4 w-24 bg-gray-100 rounded mb-1" />
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                  </div>
                  <div className="h-5 w-10 bg-gray-100 rounded" />
                </div>
              ))
            ) : !report?.low_stock_items || report.low_stock_items.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                All stock levels are optimal.
              </div>
            ) : (
              report.low_stock_items.map((item) => (
                <div key={item.id} className="p-2.5 flex justify-between items-center hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 truncate">{item.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-rose-600">
                      {item.quantity} {item.unit}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Min: {item.threshold}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
