"use client";
import KpiCards from "@/modules/reports/components/KpiCards";

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">KPI Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time operations tracking and performance overview</p>
      </div>
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Operations Snapshot</h2>
        <KpiCards />
      </div>
    </div>
  );
}