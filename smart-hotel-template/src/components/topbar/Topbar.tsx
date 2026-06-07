"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, UserRound, Settings, LogOut, Check, CheckCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications, type Notification } from "@/hooks/useNotifications";

// ── Module → route mapping for deep-link navigation ──────────────────────────
function getNotificationHref(
  n: Notification,
  role: string | undefined
): string {
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

// ── Priority badge colors ────────────────────────────────────────────────────
function priorityDot(priority: string) {
  switch (priority) {
    case "High":
      return "bg-red-500";
    case "Medium":
      return "bg-amber-400";
    case "Low":
      return "bg-emerald-400";
    default:
      return "bg-gray-400";
  }
}

// ── Type icon/emoji mapping ──────────────────────────────────────────────────
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

// ── Time-ago helper ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Topbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { data: profile } = useProfile();
  const email = profile?.email;
  const name = profile?.name;
  const image = profile?.profileImage;

  const role = (session?.user as any)?.role as string | undefined;

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ pollInterval: 30000, pageSize: 5 });

  // Show only top 5 in dropdown
  const previewNotifs = useMemo(() => notifications.slice(0, 5), [notifications]);

  const initial = name
    ? name[0].toUpperCase()
    : (email?.[0]?.toUpperCase() ?? "U");

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const profileHref =
    role === "ADMIN"
      ? "/admin/profile"
      : role === "STAFF"
        ? "/staff/profile"
        : "/customer/profile";

  const settingsHref =
    role === "ADMIN"
      ? "/admin/settings"
      : role === "STAFF"
        ? "/staff/settings"
        : "/customer/settings";

  const notificationsPageHref =
    role === "ADMIN"
      ? "/admin/notifications"
      : role === "STAFF"
        ? "/staff/notifications"
        : "/customer/notifications";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.is_read) {
      await markAsRead(n.notification_id);
    }
    setNotifOpen(false);
    router.push(getNotificationHref(n, role));
  };

  return (
    <header
      className="h-14 bg-background border-b border-border
                 flex items-center justify-end px-4 lg:px-6 gap-3 shrink-0"
    >
      {/* Mobile spacer */}
      <div className="flex-1 lg:hidden" />

      {/* ── Notification bell ────────────────────────────────────────── */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => {
            setNotifOpen((v) => !v);
            setDropdownOpen(false);
          }}
          className="relative p-2 rounded-xl hover:bg-muted transition-colors group"
          aria-label="Notifications"
        >
          <Bell
            size={18}
            className="text-muted-foreground group-hover:text-foreground transition-colors"
          />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                         flex items-center justify-center
                         bg-red-500 text-white text-[10px] font-bold
                         rounded-full ring-2 ring-background"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification dropdown */}
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-[calc(100%+8px)] z-[200]
                         w-80 sm:w-96 bg-background border border-border
                         rounded-2xl shadow-elegant overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs font-medium text-muted-foreground">
                      ({unreadCount} unread)
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="flex items-center gap-1 text-xs text-primary
                               hover:text-primary/80 transition-colors font-medium"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-[340px] overflow-y-auto">
                {previewNotifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Bell size={28} className="mb-2 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  previewNotifs.map((n) => (
                    <button
                      key={n.notification_id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3
                                  hover:bg-muted/60 transition-colors border-b border-border/50
                                  last:border-b-0
                                  ${!n.is_read ? "bg-primary/[0.03]" : ""}`}
                    >
                      {/* Type icon */}
                      <span className="text-base mt-0.5 shrink-0">
                        {typeIcon(n.type)}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {/* Priority dot */}
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot(
                              n.priority
                            )}`}
                          />
                          <p
                            className={`text-[13px] leading-tight truncate ${
                              n.is_read
                                ? "text-muted-foreground font-normal"
                                : "text-foreground font-semibold"
                            }`}
                          >
                            {n.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!n.is_read && (
                        <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-4 py-2.5">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    router.push(notificationsPageHref);
                  }}
                  className="w-full text-center text-xs font-medium text-primary
                             hover:text-primary/80 transition-colors py-1"
                >
                  View All Notifications
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Avatar + Dropdown ────────────────────────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            setDropdownOpen((v) => !v);
            setNotifOpen(false);
          }}
          className="flex items-center gap-1.5 group focus:outline-none"
          aria-label="User menu"
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full overflow-hidden
                       ring-2 ring-gold group-hover:ring-gold
                       transition-all duration-150 shrink-0
                       bg-primary flex items-center justify-center"
          >
            {image ? (
              <Image
                src={image}
                alt={name ?? "User"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gold text-xs font-semibold">{initial}</span>
            )}
          </div>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-[calc(100%+8px)] z-[200]
                         w-52 bg-background border border-border
                         rounded-2xl shadow-elegant overflow-hidden"
            >
              {/* User info header */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden shrink-0
                                bg-primary flex items-center justify-center
                                ring-2 ring-gold"
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={name ?? "User"}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-semibold">
                        {initial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    {name && (
                      <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
                        {name}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground leading-tight truncate mt-0.5">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <button
                  onClick={() => {
                    router.push(profileHref);
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                             text-foreground hover:bg-muted transition-colors group"
                >
                  <UserRound
                    size={15}
                    className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                  />
                  Profile
                </button>

                <button
                  onClick={() => {
                    router.push(settingsHref);
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                             text-foreground hover:bg-muted transition-colors group"
                >
                  <Settings
                    size={15}
                    className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                  />
                  Settings
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-border py-1.5">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                             text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10
                             transition-colors group"
                >
                  <LogOut
                    size={15}
                    className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
