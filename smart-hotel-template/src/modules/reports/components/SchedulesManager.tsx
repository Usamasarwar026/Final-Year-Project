"use client";
// src/modules/reports/components/SchedulesManager.tsx
import { useState } from "react";
import { Plus, Trash2, Calendar, Check, X, RefreshCw } from "lucide-react";
import { useReportSchedules } from "@/hooks/useReportModule";
import type { ReportType, ScheduleFrequency } from "@/types/reports";

export default function SchedulesManager() {
  const {
    schedules,
    loading,
    error,
    refresh,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useReportSchedules();

  const [newReportType, setNewReportType] = useState<ReportType>("Revenue");
  const [newFrequency, setNewFrequency] = useState<ScheduleFrequency>("Weekly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const res = await createSchedule({
      report_type: newReportType,
      frequency: newFrequency,
      parameters: {},
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setFormError(res.error ?? "Failed to create schedule");
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    await updateSchedule(id, { is_active: !currentActive });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      await deleteSchedule(id);
    }
  };

  const reportTypes: ReportType[] = [
    "Revenue",
    "Occupancy",
    "Staff",
    "Inventory",
    "Booking",
    "Guest",
  ];

  const frequencies: ScheduleFrequency[] = ["Daily", "Weekly", "Monthly"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Report Schedules</h2>
          <p className="text-sm text-gray-500">Automate and generate periodic reports automatically</p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {(error || formError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error || formError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-fit">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            Schedule New Report
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Report Type
              </label>
              <select
                value={newReportType}
                onChange={(e) => setNewReportType(e.target.value as ReportType)}
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-white text-gray-700 outline-none focus:border-blue-500 transition-colors"
              >
                {reportTypes.map((t) => (
                  <option key={t} value={t}>
                    {t} Report
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Frequency
              </label>
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value as ScheduleFrequency)}
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-white text-gray-700 outline-none focus:border-blue-500 transition-colors"
              >
                {frequencies.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              Create Schedule
            </button>
          </form>
        </div>

        {/* Schedules List */}
        <div className="lg:col-span-2 space-y-3">
          {loading && schedules.length === 0 ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm animate-pulse flex justify-between items-center"
              >
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-gray-100 rounded" />
                  <div className="h-4 w-48 bg-gray-100 rounded" />
                </div>
                <div className="h-8 w-20 bg-gray-100 rounded" />
              </div>
            ))
          ) : schedules.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm text-center text-gray-400">
              No scheduled reports found. Create one using the form on the left.
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-gray-200 transition-all"
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-sm">
                      {schedule.report_type} Report
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {schedule.frequency}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Next run: {schedule.next_run_at ? new Date(schedule.next_run_at).toLocaleString() : "Never"}
                    </span>
                    {schedule.last_run_at && (
                      <span>
                        Last run: {new Date(schedule.last_run_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => handleToggleActive(schedule.id, schedule.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                      schedule.is_active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {schedule.is_active ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Active
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" /> Paused
                      </>
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
