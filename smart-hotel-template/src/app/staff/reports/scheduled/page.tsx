"use client";
import SchedulesManager from "@/modules/reports/components/SchedulesManager";

export default function ScheduledReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Scheduled Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Automate and schedule report generation and delivery</p>
      </div>
      <SchedulesManager />
    </div>
  );
}