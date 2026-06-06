"use client";
// src/modules/reports/AdminReports.tsx
import { useState } from "react";
import KpiCards from "./components/KpiCards";
import DateRangeFilter, { buildPresetDates } from "./components/DateRangeFilter";
import RevenueReport from "./components/RevenueReport";
import OccupancyReport from "./components/OccupancyReport";
import StaffReport from "./components/StaffReport";
import InventoryReport from "./components/InventoryReport";
import BookingReport from "./components/BookingReport";
import GuestReport from "./components/GuestReport";
import SchedulesManager from "./components/SchedulesManager";
import { type PresetRange } from "@/types/reports";
import {
  LayoutDashboard,
  DollarSign,
  BedDouble,
  Users,
  Package,
  CalendarCheck,
  UserPlus,
  Clock,
} from "lucide-react";

type ActiveTab =
  | "kpi"
  | "revenue"
  | "occupancy"
  | "staff"
  | "inventory"
  | "booking"
  | "guest"
  | "schedules";

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("kpi");
  
  // Date filter states (default: This Month)
  const defaultDates = buildPresetDates("month");
  const [from, setFrom] = useState(defaultDates.from);
  const [to, setTo] = useState(defaultDates.to);
  const [preset, setPreset] = useState<PresetRange>("month");

  const tabs = [
    { id: "kpi", label: "KPI Dashboard", icon: LayoutDashboard },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "occupancy", label: "Occupancy", icon: BedDouble },
    { id: "staff", label: "Staff Performance", icon: Users },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "booking", label: "Bookings", icon: CalendarCheck },
    { id: "guest", label: "Guests", icon: UserPlus },
    { id: "schedules", label: "Scheduled Reports", icon: Clock },
  ] as const;

  // Tabs where date filters are applicable
  const showDateFilter =
    activeTab !== "kpi" && activeTab !== "schedules";

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Hotel Analytics &amp; Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time operations tracking, financial performance, and automated scheduling
          </p>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap -mb-px gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all ${
                  isActive
                    ? "border-sky-500 text-sky-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-sky-500" : "text-gray-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Date Filter Panel if applicable */}
      {showDateFilter && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <span className="text-sm font-semibold text-gray-700">Filter By Date Range</span>
          <DateRangeFilter
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
            preset={preset}
            onPresetChange={setPreset}
          />
        </div>
      )}

      {/* Main Tab Panels Content */}
      <div className="mt-4">
        {activeTab === "kpi" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Operations Snapshot</h2>
            <KpiCards />
          </div>
        )}

        {activeTab === "revenue" && (
          <RevenueReport from={from} to={to} />
        )}

        {activeTab === "occupancy" && (
          <OccupancyReport from={from} to={to} />
        )}

        {activeTab === "staff" && (
          <StaffReport from={from} to={to} />
        )}

        {activeTab === "inventory" && (
          <InventoryReport from={from} to={to} />
        )}

        {activeTab === "booking" && (
          <BookingReport from={from} to={to} />
        )}

        {activeTab === "guest" && (
          <GuestReport from={from} to={to} />
        )}

        {activeTab === "schedules" && (
          <SchedulesManager />
        )}
      </div>
    </div>
  );
}
