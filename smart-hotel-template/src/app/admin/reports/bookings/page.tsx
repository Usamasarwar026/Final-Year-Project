"use client";
import { useState } from "react";
import BookingReport from "@/modules/reports/components/BookingReport";
import DateRangeFilter, { buildPresetDates } from "@/modules/reports/components/DateRangeFilter";
import { type PresetRange } from "@/types/reports";

export default function BookingsReportPage() {
  const defaultDates = buildPresetDates("month");
  const [from, setFrom] = useState(defaultDates.from);
  const [to, setTo] = useState(defaultDates.to);
  const [preset, setPreset] = useState<PresetRange>("month");

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings Report</h1>
        <p className="text-sm text-gray-500 mt-1">Booking trends, cancellations and revenue analytics</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <span className="text-sm font-semibold text-gray-700">Filter By Date Range</span>
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} preset={preset} onPresetChange={setPreset} />
      </div>
      <BookingReport from={from} to={to} />
    </div>
  );
}