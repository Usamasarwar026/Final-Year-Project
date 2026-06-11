// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Hotel,
  Bed,
  CheckCircle2,
  Users,
  DollarSign,
  Wrench,
  Calendar,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Clock,
  Bell,
  Eye,
  ArrowRight,
} from "lucide-react";
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
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface DashboardData {
  rooms: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    reserved: number;
    occupancyRate: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    checkedIn: number;
    checkedOut: number;
    cancelled: number;
    activeGuests: number;
  };
  financial: {
    totalRevenue: number;
    outstandingPayments: number;
  };
  todayActivity: {
    checkIns: number;
    checkOuts: number;
    dirtyRooms: number;
  };
  customers: {
    total: number;
    active: number;
    inactive: number;
  };
  recentBookings: Array<{
    booking_id: number;
    guestName: string;
    roomNumber: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    totalNights: number;
    totalAmount: number;
    status: string;
    source: string;
  }>;
  recentNotifications: Array<{
    notification_id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    is_read: boolean;
    created_at: string;
  }>;
  unreadNotifications: number;
  charts: {
    occupancyChart: Array<{ name: string; value: number; color: string }>;
    roomTypeChart: Array<{ name: string; value: number }>;
    revenueTrend: Array<{ date: string; revenue: number }>;
  };
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-800 border-amber-100",
  Confirmed: "bg-blue-50 text-blue-800 border-blue-100",
  CheckedIn: "bg-green-50 text-green-800 border-green-100",
  CheckedOut: "bg-gray-50 text-gray-800 border-gray-100",
  Cancelled: "bg-red-50 text-red-800 border-red-100",
};

const CHART_COLORS = ["#10b981", "#3b82f6", "#f43f5e", "#f59e0b", "#8b5cf6"];

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (val: number) => {
    return `PKR ${val.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status] || STATUS_COLORS.Pending;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500">{error}</p>
        <button onClick={fetchDashboard} className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const kpiCards = [
    { label: "Total Rooms", value: data.rooms.total, icon: Hotel, color: "indigo" },
    { label: "Available Rooms", value: data.rooms.available, icon: CheckCircle2, color: "emerald" },
    { label: "Occupied Rooms", value: data.rooms.occupied, icon: Bed, color: "rose" },
    { label: "Occupancy Rate", value: `${data.rooms.occupancyRate}%`, icon: TrendingUp, color: "purple" },
    { label: "Total Bookings", value: data.bookings.total, icon: Calendar, color: "blue" },
    { label: "Active Guests", value: data.bookings.activeGuests, icon: Users, color: "teal" },
    { label: "Total Revenue", value: formatCurrency(data.financial.totalRevenue), icon: DollarSign, color: "emerald" },
    { label: "Outstanding", value: formatCurrency(data.financial.outstandingPayments), icon: AlertTriangle, color: "orange" },
  ];

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Hotel operations overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString()}
          </span>
          <button onClick={fetchDashboard} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          const colorClasses: Record<string, string> = {
            indigo: "bg-indigo-50 text-indigo-600",
            emerald: "bg-emerald-50 text-emerald-600",
            rose: "bg-rose-50 text-rose-600",
            purple: "bg-purple-50 text-purple-600",
            blue: "bg-blue-50 text-blue-600",
            teal: "bg-teal-50 text-teal-600",
            orange: "bg-orange-50 text-orange-600",
          };
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[kpi.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `PKR ${v/1000}k`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Room Status Distribution</h3>
          <div className="h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.occupancyChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.charts.occupancyChart.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Type Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Room Types</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.roomTypeChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Today's Activity</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{data.todayActivity.checkIns}</p>
              <p className="text-xs text-gray-600 mt-1">Check-ins</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">{data.todayActivity.checkOuts}</p>
              <p className="text-xs text-gray-600 mt-1">Check-outs</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">{data.todayActivity.dirtyRooms}</p>
              <p className="text-xs text-gray-600 mt-1">Dirty Rooms</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Customers</span>
              <span className="font-semibold">{data.customers.total}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Active Customers</span>
              <span className="font-semibold text-emerald-600">{data.customers.active}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Pending Bookings</span>
              <span className="font-semibold text-amber-600">{data.bookings.pending}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
          <button className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-6 py-3">Guest</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {data.recentBookings.slice(0, 8).map((booking) => (
                <tr key={booking.booking_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 font-medium">{booking.guestName}</td>
                  <td className="px-6 py-3">#{booking.roomNumber}</td>
                  <td className="px-6 py-3 text-gray-600">{booking.checkIn}</td>
                  <td className="px-6 py-3 text-gray-600">{booking.checkOut}</td>
                  <td className="px-6 py-3 font-medium">{formatCurrency(booking.totalAmount)}</td>
                  <td className="px-6 py-3">{getStatusBadge(booking.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notifications */}
      {data.recentNotifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">
              Recent Notifications
              {data.unreadNotifications > 0 && (
                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {data.unreadNotifications} unread
                </span>
              )}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentNotifications.map((notif) => (
              <div key={notif.notification_id} className="px-6 py-3 hover:bg-gray-50">
                <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}