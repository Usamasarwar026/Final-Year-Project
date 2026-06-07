"use client";
// src/modules/reports/components/OccupancyReport.tsx
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import ChartCard from "./ChartCard";
import ExportButton from "./ExportButton";
import { useOccupancyReport } from "@/hooks/useReportModule";

interface Props {
  from: string;
  to: string;
}

export default function OccupancyReport({ from, to }: Props) {
  const { report, loading, error } = useOccupancyReport(from, to);

  const summaryCards = [
    { label: "Total Rooms", value: report?.total_rooms ?? 0, color: "text-slate-800" },
    { label: "Occupied Rooms", value: report?.occupied ?? 0, color: "text-rose-600" },
    { label: "Available Rooms", value: report?.available ?? 0, color: "text-emerald-600" },
    { label: "Reserved Rooms", value: report?.reserved ?? 0, color: "text-sky-600" },
    { label: "Under Maintenance", value: report?.maintenance ?? 0, color: "text-amber-600" },
    { label: "Occupancy Rate", value: `${(report?.occupancy_percent ?? 0).toFixed(1)}%`, color: "text-violet-600 font-bold" },
  ];

  const exportCols = [
    { header: "Date", key: "date" },
    { header: "Occupied Rooms", key: "occupied" },
    { header: "Available Rooms", key: "available" },
    { header: "Occupancy Rate (%)", key: "occupancy_percent" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Occupancy Report</h2>
          <p className="text-sm text-gray-500">Room utilization & occupancy trends</p>
        </div>
        <ExportButton
          disabled={!report || loading}
          config={{
            title: "Occupancy Report",
            subtitle: "Room utilization & occupancy trends",
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Occupancy Rate Trend (%)"
          loading={loading}
          empty={!loading && (report?.trend.length ?? 0) === 0}
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={report?.trend ?? []}>
              <defs>
                <linearGradient id="occ-percent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(val: any) => [`${val.toFixed(1)}%`, "Occupancy"]} />
              <Area type="monotone" dataKey="occupancy_percent" stroke="#8b5cf6" fill="url(#occ-percent)" name="Occupancy %" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Room Occupancy vs Availability"
          loading={loading}
          empty={!loading && (report?.trend.length ?? 0) === 0}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={report?.trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="occupied" name="Occupied" fill="#f43f5e" stackId="rooms" radius={[0, 0, 0, 0]} />
              <Bar dataKey="available" name="Available" fill="#10b981" stackId="rooms" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
