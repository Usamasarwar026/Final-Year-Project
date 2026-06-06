"use client";
// src/modules/reports/components/StaffReport.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import ChartCard from "./ChartCard";
import ExportButton from "./ExportButton";
import { useStaffReport } from "@/hooks/useReportModule";

interface Props {
  from: string;
  to: string;
}

export default function StaffReport({ from, to }: Props) {
  const { report, loading, error } = useStaffReport(from, to);

  const staffData = report?.staff ?? [];

  // Sort staff by task completion rate descending
  const sortedStaff = [...staffData].sort((a, b) => b.completion_rate - a.completion_rate);

  // Prepare chart data: Top 5 staff by completion rate
  const chartData = sortedStaff.slice(0, 8).map(s => ({
    name: s.name.split(" ")[0], // Use first name for chart label
    "Completion Rate (%)": s.completion_rate,
    "Attendance Rate (%)": s.attendance_rate,
  }));

  const exportCols = [
    { header: "Staff Name", key: "name" },
    { header: "Department", key: "department" },
    { header: "Assigned Tasks", key: "assigned_tasks" },
    { header: "Completed Tasks", key: "completed_tasks" },
    { header: "Completion Rate (%)", key: "completion_rate" },
    { header: "Present Days", key: "present_days" },
    { header: "Working Days", key: "working_days" },
    { header: "Attendance Rate (%)", key: "attendance_rate" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Staff Performance</h2>
          <p className="text-sm text-gray-500">Task completion and attendance tracking</p>
        </div>
        <ExportButton
          disabled={staffData.length === 0 || loading}
          config={{
            title: "Staff Performance Report",
            subtitle: "Task completion and attendance tracking",
            columns: exportCols,
            rows: staffData,
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

      {/* Chart */}
      <div className="grid grid-cols-1 gap-5">
        <ChartCard
          title="Staff Performance Overview (Top 8 Performers)"
          loading={loading}
          empty={!loading && staffData.length === 0}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(val: any) => [`${val.toFixed(0)}%`]} />
              <Legend />
              <Bar dataKey="Completion Rate (%)" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Attendance Rate (%)" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-5">Staff Member</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5 text-center">Assigned Tasks</th>
                <th className="py-3 px-5 text-center">Completed Tasks</th>
                <th className="py-3 px-5 text-right">Completion Rate</th>
                <th className="py-3 px-5 text-center">Attendance</th>
                <th className="py-3 px-5 text-right">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                    <td className="py-4 px-5"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                    <td className="py-4 px-5 text-center"><div className="h-4 w-8 bg-gray-100 mx-auto rounded" /></td>
                    <td className="py-4 px-5 text-center"><div className="h-4 w-8 bg-gray-100 mx-auto rounded" /></td>
                    <td className="py-4 px-5 text-right"><div className="h-4 w-12 bg-gray-100 ml-auto rounded" /></td>
                    <td className="py-4 px-5 text-center"><div className="h-4 w-12 bg-gray-100 mx-auto rounded" /></td>
                    <td className="py-4 px-5 text-right"><div className="h-4 w-12 bg-gray-100 ml-auto rounded" /></td>
                  </tr>
                ))
              ) : staffData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No staff performance data found.
                  </td>
                </tr>
              ) : (
                staffData.map((s) => (
                  <tr key={s.staff_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-gray-900">{s.name}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {s.department || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">{s.assigned_tasks}</td>
                    <td className="py-3.5 px-5 text-center text-emerald-600 font-medium">{s.completed_tasks}</td>
                    <td className="py-3.5 px-5 text-right font-semibold">
                      <span className={s.completion_rate >= 80 ? "text-emerald-600" : s.completion_rate >= 50 ? "text-amber-600" : "text-rose-600"}>
                        {s.completion_rate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center text-gray-500">
                      {s.present_days}/{s.working_days} days
                    </td>
                    <td className="py-3.5 px-5 text-right font-semibold text-indigo-600">
                      {s.attendance_rate.toFixed(0)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
