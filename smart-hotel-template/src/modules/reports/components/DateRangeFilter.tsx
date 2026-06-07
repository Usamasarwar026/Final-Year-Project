"use client";
// src/modules/reports/components/DateRangeFilter.tsx
import { type PresetRange } from "@/types/reports";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  preset: PresetRange;
  onPresetChange: (preset: PresetRange) => void;
}

const PRESETS: { label: string; value: PresetRange }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
  { label: "Custom", value: "custom" },
];

export function buildPresetDates(preset: PresetRange): {
  from: string;
  to: string;
} {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const today = fmt(now);

  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week": {
      const mon = new Date(now);
      mon.setDate(now.getDate() - now.getDay() + 1);
      return { from: fmt(mon), to: today };
    }
    case "month":
      return {
        from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: today,
      };
    case "year":
      return {
        from: fmt(new Date(now.getFullYear(), 0, 1)),
        to: today,
      };
    default:
      return { from: today, to: today };
  }
}

export default function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  preset,
  onPresetChange,
}: DateRangeFilterProps) {
  const handlePreset = (p: PresetRange) => {
    onPresetChange(p);
    if (p !== "custom") {
      const { from: f, to: t } = buildPresetDates(p);
      onFromChange(f);
      onToChange(t);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Preset buttons */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            id={`report-preset-${p.value}`}
            onClick={() => handlePreset(p.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              preset === p.value
                ? "bg-white text-sky-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-0.5">From</label>
            <input
              id="report-date-from"
              type="date"
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
          <span className="text-gray-400 mt-4">→</span>
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-0.5">To</label>
            <input
              id="report-date-to"
              type="date"
              value={to}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => onToChange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
        </div>
      )}

      {/* Active range display */}
      {preset !== "custom" && (
        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
          {from} → {to}
        </span>
      )}
    </div>
  );
}
