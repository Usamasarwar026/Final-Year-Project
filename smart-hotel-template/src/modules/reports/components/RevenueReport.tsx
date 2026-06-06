"use client";
// src/modules/reports/components/RevenueReport.tsx
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import ChartCard from "./ChartCard";
import ExportButton from "./ExportButton";
import { useRevenueReport } from "@/hooks/useReportModule";

const fmt = (n: number) =>
  `Rs. ${n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toFixed(0)}`;

interface Props {
  from: string;
  to: string;
}

export default function RevenueReport({ from, to }: Props) {
  const { report, loading, error } = useRevenueReport(from, to);

  const summaryCards = [
    { label: "Room Revenue", value: fmt(report?.room_revenue ?? 0), color: "text-sky-600" },
    { label: "Food Revenue", value: fmt(report?.food_revenue ?? 0), color: "text-emerald-600" },
    { label: "Service Revenue", value: fmt(report?.service_revenue ?? 0), color: "text-violet-600" },
    { label: "Total Tax", value: fmt(report?.tax_amount ?? 0), color: "text-amber-600" },
    { label: "Discounts", value: fmt(report?.discount_amount ?? 0), color: "text-rose-600" },
    { label: "Net Revenue", value: fmt(report?.net_revenue ?? 0), color: "text-slate-800" },
    { label: "Amount Paid", value: fmt(report?.amount_paid ?? 0), color: "text-green-600" },
    { label: "Pending", value: fmt(report?.pending_amount ?? 0), color: "text-red-600" },
  ];

  const exportCols = [
    { header: "Date", key: "date" },
    { header: "Room Revenue", key: "room_revenue" },
    { header: "Food Revenue", key: "food_revenue" },
    { header: "Service Revenue", key: "service_revenue" },
    { header: "Total Revenue", key: "total_revenue" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Revenue Report</h2>
          <p className="text-sm text-gray-500">Financial performance overview</p>
        </div>
        <ExportButton
          disabled={!report || loading}
          config={{
            title: "Revenue Report",
            subtitle: "Financial performance overview",
            columns: exportCols,
            rows: report?.trend ?? [],
            from,
            to,
          }}
        />
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Revenue Trend"
          loading={loading}
          empty={!loading && (report?.trend.length ?? 0) === 0}
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={report?.trend ?? []}>
              <defs>
                <linearGradient id="rev-total" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(val: any) => fmt(val)} />
              <Area type="monotone" dataKey="total_revenue" stroke="#0ea5e9" fill="url(#rev-total)" name="Total" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Revenue Breakdown"
          loading={loading}
          empty={!loading && (report?.trend.length ?? 0) === 0}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={report?.trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(val: any) => fmt(val)} />
              <Legend />
              <Bar dataKey="room_revenue" name="Room" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
              <Bar dataKey="food_revenue" name="Food" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="service_revenue" name="Service" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
