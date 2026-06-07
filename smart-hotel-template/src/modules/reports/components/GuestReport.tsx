"use client";
// src/modules/reports/components/GuestReport.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import ChartCard from "./ChartCard";
import ExportButton from "./ExportButton";
import { useGuestReport } from "@/hooks/useReportModule";

interface Props {
  from: string;
  to: string;
}

export default function GuestReport({ from, to }: Props) {
  const { report, loading, error } = useGuestReport(from, to);

  const summaryCards = [
    { label: "Total Guests", value: report?.total_guests ?? 0, color: "text-slate-800" },
    { label: "New Guests", value: report?.new_guests ?? 0, color: "text-emerald-600" },
    { label: "Returning Guests", value: report?.returning_guests ?? 0, color: "text-indigo-600" },
    { label: "VIP Guests", value: report?.vip_guests ?? 0, color: "text-amber-600" },
    { label: "Avg Stay Duration", value: `${(report?.avg_stay_duration ?? 0).toFixed(1)} Days`, color: "text-sky-600 font-bold" },
  ];

  const exportCols = [
    { header: "Segment / Metric", key: "name" },
    { header: "Guest Count", key: "value" },
  ];

  // Map segments or format them for export
  const exportRows = report?.segments.map(s => ({
    name: s.name,
    value: s.value
  })) ?? [];

  // Add overall numbers as rows in export too
  if (report) {
    exportRows.unshift(
      { name: "Total Unique Guests", value: report.total_guests },
      { name: "New Guests in Period", value: report.new_guests },
      { name: "Returning Guests in Period", value: report.returning_guests },
      { name: "VIP Guests", value: report.vip_guests }
    );
  }

  // Segment colors
  const SEGMENT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e"];

  // Calculate return rate percentage
  const returnRate = report?.total_guests
    ? (report.returning_guests / report.total_guests) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Guest Analytics</h2>
          <p className="text-sm text-gray-500">Demographics, VIP counts, and retention rate</p>
        </div>
        <ExportButton
          disabled={!report || loading}
          config={{
            title: "Guest Analytics Report",
            subtitle: "Guest demographics, segments and summary metrics",
            columns: exportCols,
            rows: exportRows,
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Retention card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-[300px]">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Guest Retention Rate</h3>
            <p className="text-xs text-gray-400 mt-1">Percentage of total guests who have booked multiple times</p>
          </div>
          <div className="my-auto text-center flex flex-col items-center">
            {loading ? (
              <div className="h-16 w-16 bg-gray-100 rounded-full animate-pulse" />
            ) : (
              <>
                <div className="text-4xl font-extrabold text-emerald-600">{returnRate.toFixed(1)}%</div>
                <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${returnRate}%` }} />
                </div>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500 flex justify-between border-t border-gray-50 pt-3">
            <span>New: {report?.new_guests ?? 0}</span>
            <span>Returning: {report?.returning_guests ?? 0}</span>
          </div>
        </div>

        {/* Segments bar chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Guest segments (Rooms booked by guest types)"
            loading={loading}
            empty={!loading && (report?.segments.length ?? 0) === 0}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={report?.segments ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" name="Guests" radius={[3, 3, 0, 0]}>
                  {(report?.segments ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
