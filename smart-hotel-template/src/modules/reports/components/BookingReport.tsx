"use client";
// src/modules/reports/components/BookingReport.tsx
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import ChartCard from "./ChartCard";
import ExportButton from "./ExportButton";
import { useBookingReport } from "@/hooks/useReportModule";

interface Props {
  from: string;
  to: string;
}

export default function BookingReport({ from, to }: Props) {
  const { report, loading, error } = useBookingReport(from, to);

  const summaryCards = [
    { label: "Total Bookings", value: report?.total_bookings ?? 0, color: "text-slate-800" },
    { label: "Confirmed", value: report?.confirmed ?? 0, color: "text-emerald-600" },
    { label: "Pending", value: report?.pending ?? 0, color: "text-amber-600" },
    { label: "Cancelled", value: report?.cancelled ?? 0, color: "text-rose-600" },
    { label: "Checked In", value: report?.checked_in ?? 0, color: "text-sky-600" },
    { label: "Checked Out", value: report?.checked_out ?? 0, color: "text-indigo-600" },
  ];

  const exportCols = [
    { header: "Date", key: "date" },
    { header: "Total Bookings", key: "total" },
    { header: "Confirmed", key: "confirmed" },
    { header: "Cancelled", key: "cancelled" },
    { header: "Checked In", key: "checked_in" },
    { header: "Checked Out", key: "checked_out" },
  ];

  // Colors for status distribution
  const STATUS_COLORS: Record<string, string> = {
    CONFIRMED: "#10b981",
    PENDING: "#f59e0b",
    CANCELLED: "#f43f5e",
    CHECKED_IN: "#0ea5e9",
    CHECKED_OUT: "#6366f1",
  };

  const statusData = report?.status_distribution ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Booking Analytics</h2>
          <p className="text-sm text-gray-500">Booking conversions, trends, and status breakdown</p>
        </div>
        <ExportButton
          disabled={!report || loading}
          config={{
            title: "Booking Analytics Report",
            subtitle: "Booking conversions, trends, and status breakdown",
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {loading ? (
              <div className="h-6 w-16 bg-gray-100 rounded animate-pulse mt-1" />
            ) : (
              <p className={`text-lg font-bold mt-1 ${c.color}`}>{c.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Conversion Rate Hero banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg text-white">Booking Conversion Rate</h3>
          <p className="text-blue-100 text-sm mt-0.5">Ratio of successful bookings (Checked-In/Out or Confirmed) to all inquiries</p>
        </div>
        <div className="text-right">
          {loading ? (
            <div className="h-10 w-28 bg-white/20 rounded animate-pulse" />
          ) : (
            <span className="text-3xl font-black bg-white/10 px-4 py-2 rounded-lg border border-white/20">
              {(report?.conversion_rate ?? 0).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ChartCard
            title="Booking Influx Trend"
            loading={loading}
            empty={!loading && (report?.trend.length ?? 0) === 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={report?.trend ?? []}>
                <defs>
                  <linearGradient id="bookings-total" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="total" stroke="#6366f1" fill="url(#bookings-total)" name="Total Influx" strokeWidth={2} />
                <Area type="monotone" dataKey="confirmed" stroke="#10b981" fill="none" name="Confirmed" strokeWidth={1.5} />
                <Area type="monotone" dataKey="cancelled" stroke="#f43f5e" fill="none" name="Cancelled" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div>
          <ChartCard
            title="Bookings by Current Status"
            loading={loading}
            empty={!loading && statusData.length === 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} tickLine={false} width={80} />
                <Tooltip />
                <Bar dataKey="value" name="Bookings" radius={[0, 3, 3, 0]}>
                  {statusData.map((entry, index) => {
                    const color = STATUS_COLORS[entry.name] || "#64748b";
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
