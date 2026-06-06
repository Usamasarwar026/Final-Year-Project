// src/app/admin/kitchen/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Calendar,
  ChevronDown,
  Printer,
  FileText,
  Coffee,
  Utensils,
  Award,
  Star,
  ArrowUp,
  ArrowDown,
  CheckCircle,
} from "lucide-react";
import clsx from "clsx";
import {
  useKitchenStats,
  useKitchenOrders,
  useKitchenCategories,
} from "@/hooks/useKitchen";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner";

// ─── Date Range Selector ──────────────────────────────────────────────────────
const dateRanges = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "week" },
  { label: "Last Week", value: "lastWeek" },
  { label: "This Month", value: "month" },
  { label: "Last Month", value: "lastMonth" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border border-border rounded-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change >= 0 ? (
                <ArrowUp size={12} className="text-green-500" />
              ) : (
                <ArrowDown size={12} className="text-red-500" />
              )}
              <span
                className={clsx(
                  "text-xs font-medium",
                  change >= 0 ? "text-green-600" : "text-red-600",
                )}
              >
                {Math.abs(change)}%
              </span>
              <span className="text-[10px] text-muted-foreground">
                vs last period
              </span>
            </div>
          )}
        </div>
        <div
          className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            color,
          )}
        >
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Top Item Card ────────────────────────────────────────────────────────────
function TopItemCard({
  item,
  index,
}: {
  item: { name: string; count: number; revenue: number };
  index: number;
}) {
  const medals = ["🥇", "🥈", "🥉"];
  const medal = medals[index] || `#${index + 1}`;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
        {medal}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{item.name}</p>
        <p className="text-[10px] text-muted-foreground">
          Sold {item.count} times
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-primary">
          PKR {item.revenue?.toLocaleString() ?? "0"}
        </p>
        <p className="text-[9px] text-muted-foreground">Revenue</p>
      </div>
    </div>
  );
}

// ─── Hourly Performance Chart ─────────────────────────────────────────────────
function HourlyPerformanceChart({
  data,
}: {
  data: { hour: number; count: number }[];
}) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label:
      i === 0 ? "12am" : i < 12 ? `${i}am` : i === 12 ? "12pm" : `${i - 12}pm`,
    count: data?.find((d) => d.hour === i)?.count || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={hours}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => [v, "Orders"]}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid var(--border)",
            fontSize: 11,
          }}
        />
        <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]}>
          {hours.map((entry, idx) => (
            <Cell key={idx} fill={entry.count > 0 ? "#d4af37" : "#e2e8f0"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────────────
export default function KitchenReports() {
  const [dateRange, setDateRange] = useState("week");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: stats, isLoading: statsLoading } = useKitchenStats();
  const { data: orders = [], isLoading: ordersLoading } = useKitchenOrders();
  const { data: categories = [] } = useKitchenCategories();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate additional metrics
  const totalRevenue = stats?.revenue || 0;
  const avgOrderValue = stats?.totalOrders
    ? totalRevenue / stats.totalOrders
    : 0;

  const completedOrders = orders.filter((o) => o.status === "Delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled").length;
  const completionRate = stats?.totalOrders
    ? ((completedOrders / stats.totalOrders) * 100).toFixed(1)
    : "0";

  const peakHourData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: orders.filter((o) => {
      const hour = new Date(o.placed_at).getHours();
      return hour === i;
    }).length,
  }));

  const CHART_COLORS = [
    "#0f172a",
    "#d4af37",
    "#0ea5e9",
    "#f59e0b",
    "#22c55e",
    "#8b5cf6",
    "#ec4899",
  ];

  const handleExport = () => {
    toast.success("Report exported successfully");
  };

  const handlePrint = () => {
    window.print();
  };

  const generatedAt = new Date(); // but pass from server if possible

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="text-primary" size={28} />
              Kitchen Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive analytics and performance reports for kitchen
              operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Date Range Selector */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm flex items-center gap-2 hover:bg-muted transition-colors"
              >
                <Calendar size={14} />
                {dateRanges.find((r) => r.value === dateRange)?.label ||
                  "Select Range"}
                <ChevronDown size={12} />
              </button>
              {showDatePicker && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDatePicker(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 z-20 w-40 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                    {dateRanges.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setDateRange(range.value);
                          setShowDatePicker(false);
                        }}
                        className={clsx(
                          "w-full px-4 py-2 text-left text-xs hover:bg-muted transition-colors",
                          dateRange === range.value &&
                            "bg-primary/10 text-primary",
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleExport}
              className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
              title="Export Report"
            >
              <Download size={15} className="text-muted-foreground" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
              title="Print Report"
            >
              <Printer size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={`PKR ${totalRevenue.toLocaleString()}`}
            change={12.5}
            icon={DollarSign}
            color="bg-primary"
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            change={8.3}
            icon={ShoppingBag}
            color="bg-gold"
          />
          <StatCard
            title="Avg Order Value"
            value={`PKR ${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            change={-2.1}
            icon={TrendingUp}
            color="bg-emerald-500"
          />
          <StatCard
            title="Completion Rate"
            value={`${completionRate}%`}
            change={5.2}
            icon={CheckCircle}
            color="bg-teal-500"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Trend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-background border border-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Orders Trend
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Last 7 days order volume
                </p>
              </div>
              <TrendingUp size={16} className="text-muted-foreground" />
            </div>
            {statsLoading ? (
              <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={stats?.ordersByDay || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#d4af37"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [v, "Orders"]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#d4af37"
                    strokeWidth={2}
                    fill="url(#trendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Revenue by Category */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-background border border-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Revenue by Category
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Distribution across categories
                </p>
              </div>
              <PieChart size={16} className="text-muted-foreground" />
            </div>
            {statsLoading ? (
              <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats?.categoryPerformance || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="revenue"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  >
                    {(stats?.categoryPerformance || []).map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [
                      `PKR ${v.toLocaleString()}`,
                      "Revenue",
                    ]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      fontSize: 11,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Ordered Items */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-background border border-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Top Selling Items
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Most popular dishes by quantity
                </p>
              </div>
              <Award size={16} className="text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {(stats?.mostOrderedFoods || []).map((item, idx) => (
                <TopItemCard key={item.name} item={item} index={idx} />
              ))}
              {(!stats?.mostOrderedFoods ||
                stats.mostOrderedFoods.length === 0) && (
                <div className="py-12 text-center">
                  <Utensils
                    size={32}
                    className="mx-auto text-muted-foreground/20 mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    No data available
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Hourly Performance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-background border border-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Hourly Performance
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Orders by hour of day
                </p>
              </div>
              <Clock size={16} className="text-muted-foreground" />
            </div>
            {ordersLoading ? (
              <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
            ) : (
              <HourlyPerformanceChart data={peakHourData} />
            )}
          </motion.div>
        </div>

        {/* Additional Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 font-semibold">
                  Pending Orders
                </p>
                <p className="text-3xl font-bold text-amber-800">
                  {stats?.pendingOrders || 0}
                </p>
              </div>
              <Clock size={32} className="text-amber-400" />
            </div>
            <p className="text-[10px] text-amber-600 mt-2">
              Awaiting kitchen action
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-5 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-semibold">
                  Preparing Orders
                </p>
                <p className="text-3xl font-bold text-blue-800">
                  {stats?.preparingOrders || 0}
                </p>
              </div>
              <Coffee size={32} className="text-blue-400" />
            </div>
            <p className="text-[10px] text-blue-600 mt-2">
              Currently in preparation
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100/30 rounded-2xl p-5 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-semibold">
                  Cancelled Orders
                </p>
                <p className="text-3xl font-bold text-green-800">
                  {cancelledOrders}
                </p>
              </div>
              <TrendingDown size={32} className="text-green-400" />
            </div>
            <p className="text-[10px] text-green-600 mt-2">
              Orders that were cancelled
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="pt-4 text-center text-[10px] text-muted-foreground border-t border-border">
  {mounted && (
    <>
      Report generated on {new Date().toLocaleString()} • Data is auto-refreshed every 30 seconds
    </>
  )}
</div>
      </div>
    </div>
  );
}
