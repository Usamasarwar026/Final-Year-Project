"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  ChevronDown,
  Search,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, type Notification } from "@/hooks/useNotifications";

// ── Module → route mapping ───────────────────────────────────────────────────
function getNotificationHref(n: Notification, role: string | undefined): string {
  const base =
    role === "ADMIN" ? "/admin" : role === "STAFF" ? "/staff" : "/customer";
  const moduleRoutes: Record<string, string> = {
    booking: `${base}/bookings`,
    room: `${base}/rooms`,
    customer: `${base}/customers`,
    staff: `${base}/staff`,
    housekeeping: `${base}/housekeeping`,
    laundry: `${base}/housekeeping`,
    kitchen: `${base}/kitchen`,
    inventory: `${base}/inventory`,
    billing: `${base}/billing`,
    reports: `${base}/reports`,
    maintenance: `${base}/housekeeping`,
    system: `${base}/dashboard`,
  };
  const route = moduleRoutes[n.module] || moduleRoutes[n.type] || `${base}/dashboard`;
  return n.reference_id ? `${route}/${n.reference_id}` : route;
}

function priorityBadge(priority: string) {
  const styles: Record<string, string> = {
    High: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  };
  return styles[priority] || "bg-gray-100 text-gray-600";
}

function typeIcon(type: string) {
  const icons: Record<string, string> = {
    booking: "📋",
    room: "🏨",
    customer: "👤",
    staff: "👥",
    housekeeping: "🧹",
    laundry: "👕",
    kitchen: "🍽️",
    inventory: "📦",
    billing: "💳",
    reports: "📊",
    maintenance: "🔧",
    system: "⚙️",
  };
  return icons[type] || "🔔";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const TYPES = [
  "all",
  "booking",
  "room",
  "customer",
  "staff",
  "housekeeping",
  "laundry",
  "kitchen",
  "inventory",
  "billing",
  "reports",
  "maintenance",
  "system",
];

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role as string | undefined;

  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const {
    notifications,
    unreadCount,
    total,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    hasMore,
  } = useNotifications({ pollInterval: 30000, pageSize: 20 });

  // Client-side filtering (type + search)
  const filtered = notifications.filter((n) => {
    if (filterType !== "all" && n.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.notification_id);
    router.push(getNotificationHref(n, role));
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bell size={22} className="text-primary" />
            Notifications
            {unreadCount > 0 && (
              <span
                className="ml-1 min-w-[22px] h-[22px] px-1.5
                           flex items-center justify-center
                           bg-red-500 text-white text-[11px] font-bold rounded-full"
              >
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} total notification{total !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                         text-primary border border-primary/20 rounded-xl
                         hover:bg-primary/5 transition-colors"
            >
              <CheckCheck size={15} />
              Mark All Read
            </button>
          )}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                        rounded-xl border transition-colors
                        ${showFilters
                ? "bg-primary/10 text-primary border-primary/20"
                : "text-muted-foreground border-border hover:bg-muted"
              }`}
          >
            <Filter size={15} />
            Filters
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="flex flex-col sm:flex-row gap-3 p-4
                         bg-muted/30 border border-border rounded-2xl"
            >
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border
                             bg-background text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {/* Type filter */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-border
                             bg-background text-foreground
                             focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notification List ───────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell size={40} className="mb-3 opacity-30" />
          <p className="text-base font-medium">No notifications found</p>
          <p className="text-sm mt-1">
            {searchQuery || filterType !== "all"
              ? "Try adjusting your filters"
              : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => (
            <motion.div
              key={n.notification_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors cursor-pointer
                          group hover:shadow-sm
                          ${n.is_read
                  ? "bg-background border-border hover:bg-muted/30"
                  : "bg-primary/[0.03] border-primary/10 hover:bg-primary/[0.06]"
                }`}
              onClick={() => handleClick(n)}
            >
              {/* Type icon */}
              <span className="text-lg mt-0.5 shrink-0">{typeIcon(n.type)}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p
                    className={`text-sm leading-tight ${n.is_read
                      ? "text-muted-foreground font-normal"
                      : "text-foreground font-semibold"
                    }`}
                  >
                    {n.title}
                  </p>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${priorityBadge(
                      n.priority
                    )}`}
                  >
                    {n.priority}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 px-1.5 py-0.5 rounded-full bg-muted/60">
                    {n.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {n.message}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                  {timeAgo(n.created_at)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.notification_id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                    title="Mark as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.notification_id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10
                             text-muted-foreground hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Unread dot */}
              {!n.is_read && (
                <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
              )}
            </motion.div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                className="px-5 py-2 text-sm font-medium text-primary border border-primary/20
                           rounded-xl hover:bg-primary/5 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
