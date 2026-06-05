// src/modules/staff/StaffDashboard.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Banknote,
  Building2,
  ShieldCheck,
  Star,
  TrendingUp,
  CalendarDays,
  BarChart3,
  Loader2,
  RefreshCw,
  BriefcaseBusiness,
  Coffee,
  Minus,
  AlertCircle,
  ChevronRight,
  Lock,
  Unlock,
  Activity,
  Clock1,
} from "lucide-react";
import clsx from "clsx";
import api from "@/lib/axios";
import { MODULE_PERMISSIONS } from "@/types/staff";

// ── Types ─────────────────────────────────────────────────────
type AttStatus = "Present" | "Absent" | "HalfDay" | "Leave";

interface AttLog {
  id: number;
  staff_id: number;
  date: string;
  status: AttStatus;
  check_in?: string | null;
  check_out?: string | null;
  hours?: number | null;
  notes?: string | null;
}

interface DeptConfig {
  id: number;
  name: string;
  icon: string;
  color: string;
  bg: string;
}
interface ShiftConfig {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
  bg: string;
}

interface StaffProfile {
  staff_id: number;
  designation: string;
  joining_date: string | null;
  basic_salary: number | null;
  is_on_duty: boolean;
  is_active: boolean;
  attendance_status: AttStatus | null;
  performance_notes: string | null;
  department: DeptConfig | null;
  shift: ShiftConfig | null;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  profileImage: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  employeeId: string | null;
  permissions: string[];
  cnic: string | null;
  dateOfBirth: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  staffProfile: StaffProfile | null;
}

interface Stats {
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  totalHours: number;
  totalDays: number;
  attendanceRate: number;
}

interface DashboardData {
  profile: Profile;
  todayLog: AttLog | null;
  attendanceLogs: AttLog[];
  stats: Stats;
}

// ── Attendance config ─────────────────────────────────────────
const ATT: Record<
  AttStatus,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
    border: string;
    icon: React.ElementType;
  }
> = {
  Present: {
    label: "Present",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  Absent: {
    label: "Absent",
    bg: "bg-red-500/10",
    text: "text-red-500",
    dot: "bg-red-500",
    border: "border-red-500/20",
    icon: XCircle,
  },
  HalfDay: {
    label: "Half Day",
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    dot: "bg-amber-500",
    border: "border-amber-500/20",
    icon: Minus,
  },
  Leave: {
    label: "On Leave",
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    dot: "bg-blue-400",
    border: "border-blue-500/20",
    icon: Coffee,
  },
};

// ── Helpers ───────────────────────────────────────────────────
const fmtTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

const fmtDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const initials = (n: string) =>
  n
    .split(" ")
    .map((x) => x[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const avatarBg = (id: string) => {
  const g = [
    "from-blue-500 to-cyan-400",
    "from-violet-500 to-purple-400",
    "from-emerald-500 to-teal-400",
    "from-amber-500 to-orange-400",
    "from-rose-500 to-pink-400",
  ];
  return g[id.charCodeAt(0) % g.length];
};

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={clsx(
        "fixed bottom-6 right-6 z-[600] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold",
        type === "success"
          ? "bg-emerald-500 text-white"
          : "bg-red-500 text-white",
      )}
    >
      {type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {msg}
    </motion.div>
  );
}

// ── Live Clock ────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right">
      <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
        {time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {time.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

// ── Check-In / Check-Out button ───────────────────────────────
function CheckInButton({
  todayLog,
  onAction,
  loading,
}: {
  todayLog: AttLog | null;
  onAction: (a: "checkin" | "checkout") => Promise<void>;
  loading: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const hasCheckedIn = !!todayLog?.check_in;
  const hasCheckedOut = !!todayLog?.check_out;

  const handle = async (action: "checkin" | "checkout") => {
    setBusy(true);
    await onAction(action);
    setBusy(false);
  };

  if (hasCheckedOut) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted/50 border border-border">
        <CheckCircle2 size={15} className="text-emerald-500" />
        <span className="text-sm font-semibold text-foreground">
          Shift Complete
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          {fmtTime(todayLog?.check_in)} → {fmtTime(todayLog?.check_out)}
          {todayLog?.hours && (
            <span className="ml-1.5 font-medium text-foreground">
              ({todayLog.hours}h)
            </span>
          )}
        </span>
      </div>
    );
  }

  if (hasCheckedIn) {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => handle("checkout")}
        disabled={busy || loading}
        className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-60 transition-all shadow-lg shadow-red-500/20"
      >
        {busy ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <LogOut size={15} />
        )}
        {busy ? "Processing…" : "Check Out"}
        {!busy && (
          <span className="text-red-200 text-xs font-normal">
            since {fmtTime(todayLog?.check_in)}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => handle("checkin")}
      disabled={busy || loading}
      className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-60 transition-all shadow-lg shadow-emerald-500/20"
    >
      {busy ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <LogIn size={15} />
      )}
      {busy ? "Processing…" : "Check In"}
    </motion.button>
  );
}

// ── Attendance Calendar (mini) ────────────────────────────────
function AttendanceCalendar({ logs }: { logs: AttLog[] }) {
  const logMap = useMemo(() => {
    const m: Record<string, AttStatus> = {};
    logs.forEach((l) => {
      m[l.date] = l.status;
    });
    return m;
  }, [logs]);

  // Build last 35 days grid
  const days = useMemo(() => {
    const arr: { date: string; status: AttStatus | null; isToday: boolean }[] =
      [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      arr.push({ date: key, status: logMap[key] ?? null, isToday: i === 0 });
    }
    return arr;
  }, [logMap]);

  const dotColor: Record<AttStatus, string> = {
    Present: "bg-emerald-500",
    Absent: "bg-red-500",
    HalfDay: "bg-amber-500",
    Leave: "bg-blue-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Last 35 Days
        </p>
        <div className="flex items-center gap-3">
          {(["Present", "Absent", "HalfDay", "Leave"] as AttStatus[]).map(
            (s) => (
              <div
                key={s}
                className="flex items-center gap-1 text-[10px] text-muted-foreground"
              >
                <span className={clsx("w-2 h-2 rounded-sm", dotColor[s])} />
                {ATT[s].label}
              </div>
            ),
          )}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <p
            key={d}
            className="text-[9px] text-center text-muted-foreground font-semibold"
          >
            {d}
          </p>
        ))}
        {/* padding for first day */}
        {Array.from({ length: new Date(days[0].date).getDay() }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map(({ date, status, isToday }) => (
          <motion.div
            key={date}
            title={`${date}${status ? ` — ${ATT[status].label}` : " — No record"}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={clsx(
              "aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold transition-all cursor-default relative",
              isToday &&
                "ring-2 ring-primary ring-offset-1 ring-offset-background",
              status
                ? dotColor[status] + " text-white"
                : "bg-muted/50 text-muted-foreground/40",
            )}
          >
            {new Date(date).getDate()}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Permission Badge ──────────────────────────────────────────
function PermissionGrid({ permissions }: { permissions: string[] }) {
  const all = MODULE_PERMISSIONS;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {all.map((p) => {
        const granted = permissions.includes(p.key);
        return (
          <div
            key={p.key}
            className={clsx(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all",
              granted
                ? "bg-primary/5 border-primary/20 text-foreground"
                : "bg-muted/30 border-border text-muted-foreground/50",
            )}
          >
            <span
              className={clsx("text-base", !granted && "grayscale opacity-40")}
            >
              {p.icon}
            </span>
            <div className="min-w-0">
              <p
                className={clsx(
                  "font-semibold truncate",
                  !granted && "line-through",
                )}
              >
                {p.label}
              </p>
            </div>
            {granted ? (
              <Unlock size={10} className="ml-auto text-primary shrink-0" />
            ) : (
              <Lock size={10} className="ml-auto shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Staff Dashboard ──────────────────────────────────────
export default function StaffDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "overview" | "attendance" | "profile" | "permissions"
  >("overview");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get<DashboardData>("/staff/me");
      setData(res);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckAction = async (action: "checkin" | "checkout") => {
    try {
      const { data: res } = await api.post<{ log: AttLog; action: string }>(
        "/staff/me/checkin",
        { action },
      );
      setData((prev) => (prev ? { ...prev, todayLog: res.log } : prev));
      showToast(
        action === "checkin"
          ? "Checked in successfully!"
          : "Checked out. Great work today!",
      );
      // Refresh full data after a beat
      setTimeout(fetchData, 800);
    } catch (e: any) {
      showToast(e?.response?.data?.error ?? "Failed", "error");
    }
  };

  const weeklyData = useMemo(() => {
    if (!data) return [];

    const weeks = [];

    for (let w = 4; w >= 0; w--) {
      const end = new Date();
      end.setDate(end.getDate() - w * 7);

      const start = new Date(end);
      start.setDate(start.getDate() - 6);

      const label = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      const wLogs = data.attendanceLogs.filter(
        (l) => l.date >= startStr && l.date <= endStr,
      );

      weeks.push({
        label,
        present: wLogs.filter((l) => l.status === "Present").length,
        absent: wLogs.filter((l) => l.status === "Absent").length,
        halfDay: wLogs.filter((l) => l.status === "HalfDay").length,
        leave: wLogs.filter((l) => l.status === "Leave").length,
      });
    }

    return weeks;
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-border border-t-primary"
        />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-sm text-red-500">
          {error ?? "Something went wrong"}
        </p>
        <button
          onClick={fetchData}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  const { profile, todayLog, attendanceLogs, stats } = data;
  const sp = profile.staffProfile;

  const tabCls = (t: string) =>
    clsx(
      "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
      tab === t
        ? "bg-primary text-primary-foreground shadow"
        : "text-muted-foreground hover:text-foreground hover:bg-muted",
    );

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-background border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <div
              className={clsx(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br shrink-0 shadow-md",
                avatarBg(profile.id),
              )}
            >
              {initials(profile.name)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">
                  {profile.name}
                </h1>

                {sp?.is_on_duty && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    On Duty
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {sp?.designation ?? "Staff"} · {sp?.department?.icon}{" "}
                {sp?.department?.name ?? "—"}
              </p>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-mono bg-muted px-2 py-1 rounded-lg">
                  {profile.employeeId ?? "No ID"}
                </span>

                {sp?.shift && (
                  <span
                    className={clsx(
                      "text-[11px] font-medium px-2 py-1 rounded-lg border flex",
                      sp.shift.bg,
                      sp.shift.color,
                    )}
                  >
                    <Clock1 className="h-4 w-4 pr-1" /> {sp.shift.name} ·{" "}
                    {sp.shift.start_time}–{sp.shift.end_time}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-end gap-3">
            <LiveClock />

            <CheckInButton
              todayLog={todayLog}
              onAction={handleCheckAction}
              loading={loading}
            />
          </div>
        </div>

        {/* Today Status */}
        {todayLog && (
          <div
            className={clsx(
              "mt-5 flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl border text-sm",
              ATT[todayLog.status].bg,
              ATT[todayLog.status].border,
            )}
          >
            <span
              className={clsx("w-2 h-2 rounded-full", ATT[todayLog.status].dot)}
            />

            <span className={clsx("font-semibold", ATT[todayLog.status].text)}>
              Today: {ATT[todayLog.status].label}
            </span>

            {todayLog.check_in && (
              <span className="text-muted-foreground text-xs">
                Check-in:
                <span className="ml-1 font-medium text-foreground">
                  {fmtTime(todayLog.check_in)}
                </span>
              </span>
            )}

            {todayLog.check_out && (
              <span className="text-muted-foreground text-xs">
                Check-out:
                <span className="ml-1 font-medium text-foreground">
                  {fmtTime(todayLog.check_out)}
                </span>
              </span>
            )}

            {todayLog.hours && (
              <span className="ml-auto text-xs font-semibold text-foreground">
                {todayLog.hours}h Logged
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Quick Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Attendance Rate",
            value: `${stats.attendanceRate}%`,
            icon: TrendingUp,
            color:
              stats.attendanceRate >= 80
                ? "bg-emerald-500"
                : stats.attendanceRate >= 60
                  ? "bg-amber-500"
                  : "bg-red-500",
          },
          {
            label: "Present",
            value: stats.present,
            icon: CheckCircle2,
            color: "bg-emerald-500",
          },
          {
            label: "Absent",
            value: stats.absent,
            icon: XCircle,
            color: "bg-red-500",
          },
          {
            label: "Half Day",
            value: stats.halfDay,
            icon: Minus,
            color: "bg-amber-500",
          },
          {
            label: "On Leave",
            value: stats.leave,
            icon: Coffee,
            color: "bg-blue-500",
          },
          {
            label: "Hours Logged",
            value: `${stats.totalHours.toFixed(1)}h`,
            icon: Clock,
            color: "bg-violet-500",
          },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-background border border-border rounded-2xl p-3.5 flex flex-col gap-2"
          >
            <div
              className={clsx(
                "w-8 h-8 rounded-xl flex items-center justify-center",
                color,
              )}
            >
              <Icon size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">
                {value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTab("overview")}
          className={tabCls("overview")}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("attendance")}
          className={tabCls("attendance")}
        >
          Attendance History
        </button>
        <button onClick={() => setTab("profile")} className={tabCls("profile")}>
          My Profile
        </button>
        <button
          onClick={() => setTab("permissions")}
          className={tabCls("permissions")}
        >
          Permissions
        </button>
      </div>

      {/* ── Tab Content ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          >
            {/* Left — Calendar + weekly chart */}
            <div className="lg:col-span-2 space-y-5">
              {/* Attendance calendar */}
              <div className="bg-background border border-border rounded-2xl p-5">
                <AttendanceCalendar logs={attendanceLogs} />
              </div>

              {/* Weekly bar chart */}
              <div className="bg-background border border-border rounded-2xl p-5">
                <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 size={15} className="text-primary" />
                  Weekly Breakdown
                </p>
                <div className="flex items-end gap-3 h-32">
                  {weeklyData.map((w, i) => {
                    const maxVal = Math.max(
                      ...weeklyData.map(
                        (x) => x.present + x.absent + x.halfDay + x.leave,
                      ),
                      1,
                    );
                    const total = w.present + w.absent + w.halfDay + w.leave;
                    const h =
                      total === 0
                        ? 0
                        : Math.max(8, Math.round((total / maxVal) * 100));
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-full flex flex-col-reverse rounded-xl overflow-hidden"
                          style={{
                            height: `${h}%`,
                            minHeight: total > 0 ? 8 : 0,
                          }}
                        >
                          {w.present > 0 && (
                            <div
                              style={{ flex: w.present }}
                              className="bg-emerald-500"
                            />
                          )}
                          {w.halfDay > 0 && (
                            <div
                              style={{ flex: w.halfDay }}
                              className="bg-amber-500"
                            />
                          )}
                          {w.leave > 0 && (
                            <div
                              style={{ flex: w.leave }}
                              className="bg-blue-400"
                            />
                          )}
                          {w.absent > 0 && (
                            <div
                              style={{ flex: w.absent }}
                              className="bg-red-500"
                            />
                          )}
                        </div>
                        {total === 0 && (
                          <div className="w-full rounded-xl bg-muted h-1.5" />
                        )}
                        <p className="text-[9px] text-muted-foreground text-center">
                          {w.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right — Employment info */}
            <div className="space-y-4">
              {/* Employment card */}
              <div className="bg-background border border-border rounded-2xl p-5 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Employment
                </p>
                {[
                  {
                    icon: BriefcaseBusiness,
                    label: "Designation",
                    value: sp?.designation,
                  },
                  {
                    icon: Building2,
                    label: "Department",
                    value: sp?.department
                      ? `${sp.department.icon} ${sp.department.name}`
                      : null,
                  },
                  {
                    icon: Clock,
                    label: "Shift",
                    value: sp?.shift
                      ? `${sp.shift.name} (${sp.shift.start_time}–${sp.shift.end_time})`
                      : null,
                  },
                  {
                    icon: Calendar,
                    label: "Joining Date",
                    value: sp?.joining_date ? fmtDate(sp.joining_date) : null,
                  },
                  {
                    icon: Banknote,
                    label: "Basic Salary",
                    value: sp?.basic_salary
                      ? `PKR ${Number(sp.basic_salary).toLocaleString()}/month`
                      : null,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-2.5 py-2 border-b border-border/40 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon size={12} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {label}
                      </p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">
                        {value ?? "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Attendance rate ring */}
              <div className="bg-background border border-border rounded-2xl p-5 flex flex-col items-center gap-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider self-start">
                  30-Day Rate
                </p>
                <div className="relative w-28 h-28">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full -rotate-90"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/40"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={
                        stats.attendanceRate >= 80
                          ? "#10b981"
                          : stats.attendanceRate >= 60
                            ? "#f59e0b"
                            : "#ef4444"
                      }
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={{
                        strokeDashoffset:
                          2 * Math.PI * 40 * (1 - stats.attendanceRate / 100),
                      }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">
                      {stats.attendanceRate}%
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      Rate
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {stats.present} present out of {stats.totalDays} days tracked
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ATTENDANCE HISTORY ── */}
        {tab === "attendance" && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <CalendarDays size={15} className="text-primary" /> Attendance
                  Log — Last 31 Days
                </p>
                <p className="text-xs text-muted-foreground">
                  {attendanceLogs.length} records
                </p>
              </div>

              {attendanceLogs.length === 0 ? (
                <div className="py-16 text-center">
                  <CalendarDays
                    size={28}
                    className="mx-auto mb-2 text-muted-foreground/20"
                  />
                  <p className="text-sm text-muted-foreground">
                    No attendance records yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {attendanceLogs.map((log, i) => {
                    const c = ATT[log.status];
                    const Icon = c.icon;
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
                      >
                        {/* Date */}
                        <div className="w-20 shrink-0">
                          <p className="text-xs font-bold text-foreground">
                            {fmtShort(log.date)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(log.date).getFullYear()}
                          </p>
                        </div>

                        {/* Status icon */}
                        <div
                          className={clsx(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                            c.bg,
                          )}
                        >
                          <Icon size={13} className={c.text} />
                        </div>

                        {/* Status label */}
                        <span
                          className={clsx(
                            "text-xs font-semibold min-w-[70px]",
                            c.text,
                          )}
                        >
                          {c.label}
                        </span>

                        {/* Times */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-1">
                          {log.check_in ? (
                            <span className="flex items-center gap-1">
                              <LogIn size={10} className="text-emerald-500" />
                              <span className="font-medium text-foreground">
                                {fmtTime(log.check_in)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 text-[11px]">
                              No check-in
                            </span>
                          )}

                          {log.check_out ? (
                            <span className="flex items-center gap-1">
                              <LogOut size={10} className="text-red-500" />
                              <span className="font-medium text-foreground">
                                {fmtTime(log.check_out)}
                              </span>
                            </span>
                          ) : null}
                        </div>

                        {/* Hours */}
                        {log.hours ? (
                          <span className="text-xs font-bold text-foreground ml-auto shrink-0">
                            {log.hours}h
                          </span>
                        ) : null}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── MY PROFILE ── */}
        {tab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {[
              {
                title: "Personal Information",
                icon: User,
                fields: [
                  { icon: User, label: "Full Name", value: profile.name },
                  { icon: Mail, label: "Email", value: profile.email },
                  { icon: Phone, label: "Phone", value: profile.phoneNumber },
                  { icon: CreditCard, label: "CNIC", value: profile.cnic },
                  {
                    icon: Calendar,
                    label: "Date of Birth",
                    value: profile.dateOfBirth
                      ? fmtDate(profile.dateOfBirth)
                      : null,
                  },
                  {
                    icon: MapPin,
                    label: "Address",
                    value:
                      [profile.address, profile.city, profile.country]
                        .filter(Boolean)
                        .join(", ") || null,
                  },
                ],
              },
              {
                title: "Account & Security",
                icon: ShieldCheck,
                fields: [
                  {
                    icon: Star,
                    label: "Account Status",
                    value: profile.isActive ? "Active ✓" : "Suspended",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Verified",
                    value: profile.isVerified ? "Verified ✓" : "Unverified",
                  },
                  {
                    icon: CalendarDays,
                    label: "Member Since",
                    value: fmtDate(profile.createdAt),
                  },
                  {
                    icon: Clock,
                    label: "Last Login",
                    value: profile.lastLogin
                      ? fmtDate(profile.lastLogin)
                      : "Never",
                  },
                ],
              },
            ].map(({ title, icon: TIcon, fields }) => (
              <div
                key={title}
                className="bg-background border border-border rounded-2xl p-5 space-y-1"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <TIcon size={11} /> {title}
                </p>
                {fields.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={11} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {label}
                      </p>
                      <p className="text-xs font-semibold text-foreground mt-0.5 break-words">
                        {value ?? (
                          <span className="text-muted-foreground/40 font-normal">
                            Not set
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Performance notes from manager */}
            {sp?.performance_notes && (
              <div className="sm:col-span-2 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Star size={11} /> Manager Performance Notes
                </p>
                <p className="text-sm text-foreground">
                  {sp.performance_notes}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── PERMISSIONS ── */}
        {tab === "permissions" && (
          <motion.div
            key="permissions"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-background border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    Module Access
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You have access to{" "}
                    <span className="font-bold text-foreground">
                      {profile.permissions.length}
                    </span>{" "}
                    of {MODULE_PERMISSIONS.length} modules
                  </p>
                </div>
                <div
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-bold",
                    profile.permissions.length === MODULE_PERMISSIONS.length
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {Math.round(
                    (profile.permissions.length / MODULE_PERMISSIONS.length) *
                      100,
                  )}
                  % Access
                </div>
              </div>

              {/* Rate bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(profile.permissions.length / MODULE_PERMISSIONS.length) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-primary rounded-full"
                />
              </div>

              <PermissionGrid permissions={profile.permissions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
