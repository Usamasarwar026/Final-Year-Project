"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
{{#if rooms,booking}}
  Bed,
{{/if}}
{{#if rooms}}
  Hotel,
  CheckCircle2,
  Wrench,
{{/if}}
{{#if booking,staff}}
  Users,
{{/if}}
{{#if booking}}
  Calendar,
{{/if}}
{{#if billing}}
  DollarSign,
  TrendingUp,
  FileText,
{{/if}}
  AlertTriangle,
{{#if booking}}
  ClipboardList,
{{/if}}
  RefreshCw,
  Clock,
{{#if inventory+tier_advanced}}
  Package,
{{/if}}
} from "lucide-react";
{{#if rooms,billing}}
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
{{/if}}

// ─── Types ────────────────────────────────────────────────────
interface DashboardData {
  summary: {
{{#if rooms}}
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
{{/if}}
{{#if booking}}
    totalBookings: number;
    activeGuests: number;
{{/if}}
{{#if billing}}
    totalRevenue: number;
    outstandingPayments: number;
{{/if}}
  };
  todayActivity: {
{{#if booking}}
    todayCheckIns: number;
    todayCheckOuts: number;
{{/if}}
{{#if housekeeping}}
    pendingHousekeepingTasks: number;
    pendingLaundryTasks: number;
{{/if}}
{{#if kitchen+tier_advanced}}
    pendingFoodOrders: number;
{{/if}}
  };
{{#if billing}}
  billing: {
    totalInvoices: number;
    paidInvoices: number;
    partialInvoices: number;
    unpaidInvoices: number;
    outstandingBalance: number;
  };
{{/if}}
{{#if inventory+tier_advanced}}
  inventory: {
    lowStockItems: number;
    outOfStockItems: number;
    totalInventoryItems: number;
  };
{{/if}}
{{#if booking}}
  recentBookings: Array<{
    booking_id: number;
    guestName: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    status: string;
  }>;
{{/if}}
{{#if staff}}
  staff: {
    totalStaff: number;
    activeStaff: number;
    onDutyStaff: number;
  };
{{/if}}
  charts: {
{{#if rooms}}
    occupancyChart: Array<{ name: string; value: number }>;
{{/if}}
{{#if billing}}
    revenueTrend: Array<{
      date: string;
      room_revenue: number;
{{#if kitchen+tier_advanced}}
      food_revenue: number;
{{/if}}
      service_revenue: number;
      total_revenue: number;
    }>;
{{/if}}
  };
}

{{#if rooms,billing}}
const COLORS = ["#10b981", "#3b82f6", "#f43f5e", "#f59e0b"];
{{/if}}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
{{#if billing}}
  const [revenueDays, setRevenueDays] = useState<7 | 30>(7);
{{/if}}

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

{{#if billing}}
  const formatCurrency = (val: number) => {
    return `PKR ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(val)}`;
  };
{{/if}}

{{#if booking}}
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "confirmed")
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">Confirmed</span>;
    if (s === "checkedin" || s === "checked-in")
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800 border border-green-100">Checked In</span>;
    if (s === "checkedout" || s === "checked-out")
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-800 border border-gray-100">Checked Out</span>;
    if (s === "cancelled")
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-100">Cancelled</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-100">Pending</span>;
  };
{{/if}}

  if (loading && !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-20 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Failed to Load Dashboard</h2>
        <p className="text-gray-500 text-sm">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const summary = data!.summary;
  const todayActivity = data!.todayActivity;
{{#if billing}}
  const billing = data!.billing;
{{/if}}
{{#if inventory+tier_advanced}}
  const inventory = data!.inventory;
{{/if}}
{{#if booking}}
  const recentBookings = data!.recentBookings;
{{/if}}
{{#if staff}}
  const staff = data!.staff;
{{/if}}
  const charts = data!.charts;

{{#if billing}}
  const filteredRevenueTrend = charts.revenueTrend.slice(-revenueDays);
{{/if}}

  // KPI cards — modules ke hisaab se build hote hain
  const kpis = [
{{#if rooms}}
    { label: "Total Rooms", value: summary.totalRooms, icon: Hotel, bg: "bg-indigo-50 border-indigo-100", iconColor: "text-indigo-600" },
    { label: "Available Rooms", value: summary.availableRooms, icon: CheckCircle2, bg: "bg-emerald-50 border-emerald-100", iconColor: "text-emerald-600" },
    { label: "Occupied Rooms", value: summary.occupiedRooms, icon: Bed, bg: "bg-rose-50 border-rose-100", iconColor: "text-rose-600" },
    { label: "Maintenance", value: summary.maintenanceRooms, icon: Wrench, bg: "bg-amber-50 border-amber-100", iconColor: "text-amber-600" },
{{/if}}
{{#if booking}}
    { label: "Total Bookings", value: summary.totalBookings, icon: Calendar, bg: "bg-blue-50 border-blue-100", iconColor: "text-blue-600" },
    { label: "Active Guests", value: summary.activeGuests, icon: Users, bg: "bg-purple-50 border-purple-100", iconColor: "text-purple-600" },
{{/if}}
{{#if billing}}
    { label: "Total Revenue", value: formatCurrency(summary.totalRevenue), icon: DollarSign, bg: "bg-teal-50 border-teal-100", iconColor: "text-teal-600" },
    { label: "Outstanding", value: formatCurrency(summary.outstandingPayments), icon: AlertTriangle, bg: "bg-orange-50 border-orange-100", iconColor: "text-orange-600" },
{{/if}}
  ];

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time operational overview and financial health.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg flex items-center gap-1.5 border border-gray-200">
            <Clock className="w-3.5 h-3.5" />
            As of: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl border border-gray-200 bg-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards — runtime check: agar kpis empty hai to grid hi mat dikhao.
          Yeh normal React conditional hai (kpis.length ek runtime value hai). */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-2xl border ${kpi.bg} p-5 flex items-start gap-4 hover:shadow-lg transition-all duration-300 group`}
              >
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">{kpi.label}</span>
                  <span className="text-2xl font-bold text-gray-900 mt-1 block tracking-tight">{kpi.value}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">

{{#if booking}}
          {/* Today's Activity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gray-600" />
              Today's Activity
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100/50 flex flex-col justify-between">
                <span className="text-xs font-semibold text-sky-700">Check-Ins</span>
                <span className="text-2xl font-bold text-sky-900 mt-2">{todayActivity.todayCheckIns}</span>
              </div>
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100/50 flex flex-col justify-between">
                <span className="text-xs font-semibold text-purple-700">Check-Outs</span>
                <span className="text-2xl font-bold text-purple-900 mt-2">{todayActivity.todayCheckOuts}</span>
              </div>
{{#if housekeeping}}
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50 flex flex-col justify-between">
                <span className="text-xs font-semibold text-amber-700">Housekeeping</span>
                <span className="text-2xl font-bold text-amber-900 mt-2">{todayActivity.pendingHousekeepingTasks} Tasks</span>
              </div>
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100/50 flex flex-col justify-between">
                <span className="text-xs font-semibold text-rose-700">Laundry</span>
                <span className="text-2xl font-bold text-rose-900 mt-2">{todayActivity.pendingLaundryTasks} Items</span>
              </div>
{{/if}}
{{#if kitchen+tier_advanced}}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 flex flex-col justify-between">
                <span className="text-xs font-semibold text-emerald-700">Food Orders</span>
                <span className="text-2xl font-bold text-emerald-900 mt-2">{todayActivity.pendingFoodOrders} Orders</span>
              </div>
{{/if}}
            </div>
          </div>
{{/if}}

{{#if billing}}
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  Revenue Trend
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Track daily paid invoice revenue</p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setRevenueDays(7)}
                  className={`px-3 py-1.5 rounded-md transition-all ${revenueDays === 7 ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setRevenueDays(30)}
                  className={`px-3 py-1.5 rounded-md transition-all ${revenueDays === 30 ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  30 Days
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredRevenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `PKR ${v}`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value), "Paid Revenue"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  />
                  <Area type="monotone" dataKey="total_revenue" stroke="#0ea5e9" fillOpacity={1} fill="url(#revenueColor)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
{{/if}}

{{#if booking}}
          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bed className="w-5 h-5 text-gray-600" />
                Recent Reservations
              </h3>
            </div>
            {recentBookings.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No recent bookings found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Guest Name</th>
                      <th className="px-6 py-4">Room</th>
                      <th className="px-6 py-4">Check-In</th>
                      <th className="px-6 py-4">Check-Out</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {recentBookings.map((booking) => (
                      <tr key={booking.booking_id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{booking.guestName}</td>
                        <td className="px-6 py-4 text-gray-600 font-mono">Room {booking.roomNumber}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(booking.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(booking.checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
{{/if}}

        </div>

        {/* Right Column */}
        <div className="space-y-8">

{{#if rooms}}
          {/* Room Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Hotel className="w-5 h-5 text-gray-600" />
              Room Distribution
            </h3>
            <div className="h-[200px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.occupancyChart} innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                    {charts.occupancyChart.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Rooms"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-gray-900">{summary.totalRooms}</span>
                <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mt-0.5">Total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {charts.occupancyChart.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div>
                    <span className="text-xs text-gray-500 block">{entry.name}</span>
                    <span className="text-sm font-bold text-gray-800">{entry.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
{{/if}}

{{#if billing}}
          {/* Billing Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Billing Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Paid Invoices</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">{billing.paidInvoices}</span>
                  <span className="text-xs text-green-600 font-semibold px-2 py-0.5 bg-green-50 rounded-md">Paid</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Partial Invoices</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">{billing.partialInvoices}</span>
                  <span className="text-xs text-blue-600 font-semibold px-2 py-0.5 bg-blue-50 rounded-md">Partial</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Unpaid Invoices</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">{billing.unpaidInvoices}</span>
                  <span className="text-xs text-red-600 font-semibold px-2 py-0.5 bg-red-50 rounded-md">Unpaid</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Outstanding Balance</span>
                <span className="text-xl font-black text-gray-900 mt-1">{formatCurrency(billing.outstandingBalance)}</span>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 border border-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
{{/if}}

{{#if inventory+tier_advanced}}
          {/* Inventory Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" />
              Inventory Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50/50 border border-red-100/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-red-700">Out of Stock</span>
                </div>
                <span className="text-sm font-bold text-red-900">{inventory.outOfStockItems} items</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-amber-700">Low Stock</span>
                </div>
                <span className="text-sm font-bold text-amber-900">{inventory.lowStockItems} items</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">Total Items</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{inventory.totalInventoryItems}</span>
              </div>
            </div>
          </div>
{{/if}}

{{#if staff}}
          {/* Staff Tracker */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              Staff Tracker
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="text-2xl font-black text-gray-900">{staff.totalStaff}</span>
                <span className="text-[10px] font-bold text-gray-400 block uppercase mt-1">Total</span>
              </div>
              <div className="text-center p-3 bg-sky-50 border border-sky-100 rounded-xl">
                <span className="text-2xl font-black text-sky-900">{staff.activeStaff}</span>
                <span className="text-[10px] font-bold text-sky-400 block uppercase mt-1">Active</span>
              </div>
              <div className="text-center p-3 bg-green-50 border border-green-100 rounded-xl">
                <span className="text-2xl font-black text-green-900">{staff.onDutyStaff}</span>
                <span className="text-[10px] font-bold text-green-400 block uppercase mt-1">On Duty</span>
              </div>
            </div>
          </div>
{{/if}}

        </div>
      </div>
    </div>
  );
}