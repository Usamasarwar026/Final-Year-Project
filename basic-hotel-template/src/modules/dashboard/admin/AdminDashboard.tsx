// src/app/admin/dashboard/page.tsx
"use client";

import { motion } from "framer-motion";
import {
  Hotel,
  Bed,
  CheckCircle2,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Clock,
  Bell,
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
} from "recharts";
import { useDashboard } from "@/hooks/useDashboard";
import { useMemo } from "react";

// ── Status badge colours ──────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Pending:    "bg-amber-50 text-amber-800 border-amber-100",
  Confirmed:  "bg-blue-50 text-blue-800 border-blue-100",
  CheckedIn:  "bg-green-50 text-green-800 border-green-100",
  CheckedOut: "bg-gray-50 text-gray-800 border-gray-100",
  Cancelled:  "bg-red-50 text-red-800 border-red-100",
};

const KPI_ICON_COLORS: Record<string, string> = {
  indigo:  "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose:    "bg-rose-50 text-rose-600",
  purple:  "bg-purple-50 text-purple-600",
  blue:    "bg-blue-50 text-blue-600",
  teal:    "bg-teal-50 text-teal-600",
  orange:  "bg-orange-50 text-orange-600",
};

// ── Helpers ───────────────────────────────────────────────────
const fmt = (val: number) => `PKR ${val.toLocaleString()}`;

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? STATUS_COLORS.Pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status}
    </span>
  );
}

// ── Skeleton primitives 
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className ?? ""}`} />;
}

// ── KPI card — always visible, skeleton while loading 
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
  idx,
}: {
  label: string;
  value?: string | number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
  idx: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl shrink-0 ml-3 ${KPI_ICON_COLORS[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Chart skeleton ────────────────────────────────────────────
function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2 px-2" style={{ height }}>
      {[60, 80, 45, 90, 70, 55, 85, 40, 75, 65].map((h, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${h}%` } as any} />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data, isLoading, isFetching, error, dataUpdatedAt, refresh } = useDashboard();
    const today = useMemo(
    () => new Intl.DateTimeFormat("en-GB").format(new Date()),
    [],
  );

  // KPI cards defined separately so they always render (with skeleton when loading)
  const kpiCards = [
    { label: "Total Rooms",      value: data?.rooms.total,                              icon: Hotel,        color: "indigo"  },
    { label: "Available Rooms",  value: data?.rooms.available,                          icon: CheckCircle2, color: "emerald" },
    { label: "Occupied Rooms",   value: data?.rooms.occupied,                           icon: Bed,          color: "rose"    },
    { label: "Occupancy Rate",   value: data ? `${data.rooms.occupancyRate}%` : undefined, icon: TrendingUp,   color: "purple"  },
    { label: "Total Bookings",   value: data?.bookings.total,                           icon: Calendar,     color: "blue"    },
    { label: "Active Guests",    value: data?.bookings.activeGuests,                    icon: Users,        color: "teal"    },
    { label: "Total Revenue",    value: data ? fmt(data.financial.totalRevenue) : undefined, icon: DollarSign,   color: "emerald" },
    { label: "Outstanding",      value: data ? fmt(data.financial.outstandingPayments) : undefined, icon: AlertTriangle, color: "orange" },
  ];

  // Hard error — only shown when there's NO cached data at all
  if (error && !data) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Hotel operations overview</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Last updated timestamp */}
          {dataUpdatedAt ? (
            <span className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg flex items-center gap-1 text-gray-600">
              <Clock className="w-3.5 h-3.5" />
              Updated {today}
            </span>
          ) : (
            <span className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg flex items-center gap-1 text-gray-600">
              <Clock className="w-3.5 h-3.5" />
              {today}
            </span>
          )}

          {/* Refresh button — spinner only on background fetch, not blocking */}
          <button
            onClick={refresh}
            disabled={isFetching}
            className="p-2 hover:bg-gray-100 rounded-xl transition disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Soft error banner — shown when refresh fails but old data is visible */}
      {error && data && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Could not refresh: {error}
          <button onClick={refresh} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* ── KPI Cards — always rendered, skeleton while loading ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi, idx) => (
          <KpiCard
            key={kpi.label}
            idx={idx}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            loading={isLoading}
          />
        ))}
      </div>

      {/* ── Charts — skeleton while loading ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          {isLoading || !data ? (
            <ChartSkeleton height={280} />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `PKR ${v / 1000}k`} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Room Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Room Status Distribution</h3>
          {isLoading || !data ? (
            <div className="h-[280px] flex items-center justify-center">
              <Skeleton className="w-40 h-40 rounded-full" />
            </div>
          ) : (
            <div className="h-[280px]">
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
                    label={({ name, percent }) =>
                      percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                    }
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
          )}
        </div>
      </div>

      {/* Second chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Types */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Room Types</h3>
          {isLoading || !data ? (
            <ChartSkeleton height={250} />
          ) : (
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
          )}
        </div>

        {/* Today's Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Today's Activity</h3>
          {isLoading || !data ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
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

              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                {[
                  { label: "Total Customers",   value: data.customers.total,        cls: "text-gray-900"    },
                  { label: "Active Customers",  value: data.customers.active,       cls: "text-emerald-600" },
                  { label: "Pending Bookings",  value: data.bookings.pending,       cls: "text-amber-600"   },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className={`font-semibold ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Recent Bookings Table ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
          <button className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  {["Guest", "Room", "Check In", "Check Out", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-6 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {data.recentBookings.slice(0, 8).map((b) => (
                  <tr key={b.booking_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium">{b.guestName}</td>
                    <td className="px-6 py-3 text-gray-600">#{b.roomNumber}</td>
                    <td className="px-6 py-3 text-gray-600">{b.checkIn}</td>
                    <td className="px-6 py-3 text-gray-600">{b.checkOut}</td>
                    <td className="px-6 py-3 font-medium">{fmt(b.totalAmount)}</td>
                    <td className="px-6 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent Notifications ──────────────────────────────── */}
      {(isLoading || (data?.recentNotifications?.length ?? 0) > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">
              Recent Notifications
              {(data?.unreadNotifications ?? 0) > 0 && (
                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {data!.unreadNotifications} unread
                </span>
              )}
            </h3>
          </div>

          {isLoading || !data ? (
            <div className="divide-y divide-gray-100">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.recentNotifications.map((n) => (
                <div
                  key={n.notification_id}
                  className={`px-6 py-3 hover:bg-gray-50 transition ${!n.is_read ? "bg-blue-50/40" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}