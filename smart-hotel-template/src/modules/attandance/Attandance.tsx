// src/modules/staff/AdminAttendance.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Search,
  X,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  Edit3,
  Save,
  SlidersHorizontal,
  Minus,
  TrendingUp,
  BarChart3,
  Coffee,
} from "lucide-react";
import clsx from "clsx";
import api from "@/lib/axios";
import type {
  AttendanceStatus,
  DepartmentConfig,
  ShiftConfig,
} from "@/types/staff";

// ── Types ─────────────────────────────────────────────────────
interface AttendanceLog {
  id: number;
  staff_id: number;
  user_id: string;
  date: string;
  status: AttendanceStatus;
  check_in?: string | null;
  check_out?: string | null;
  hours?: number | null;
  notes?: string | null;
}

interface StaffAttendanceRow {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  profileImage: string | null;
  staffProfile: {
    staff_id: number;
    department_id: number | null;
    shift_id: number | null;
    designation: string;
    basic_salary: number | null;
    is_on_duty: boolean;
    attendance_status?: AttendanceStatus | null;
    department?: DepartmentConfig | null;
    shift?: ShiftConfig | null;
  } | null;
  todayLog: AttendanceLog | null;
}

interface DailySummary {
  total: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  onDuty: number;
  unmarked: number;
}

// ── Config ────────────────────────────────────────────────────
const ATT_CONFIG: Record<
  AttendanceStatus,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  Present: {
    label: "Present",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
    border: "border-emerald-500/30",
  },
  Absent: {
    label: "Absent",
    bg: "bg-red-500/10",
    text: "text-red-500",
    dot: "bg-red-500",
    border: "border-red-500/30",
  },
  HalfDay: {
    label: "Half Day",
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    dot: "bg-amber-500",
    border: "border-amber-500/30",
  },
  Leave: {
    label: "On Leave",
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    dot: "bg-blue-400",
    border: "border-blue-500/30",
  },
};
const ATT_STATUSES: AttendanceStatus[] = [
  "Present",
  "Absent",
  "HalfDay",
  "Leave",
];

// ── Helpers ───────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtTime = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const initials = (n: string) =>
  n
    .split(" ")
    .map((x) => x[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
const avatarColor = (id: string) => {
  const palette = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-pink-500",
  ];
  return palette[id.charCodeAt(0) % palette.length];
};

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, x: 16 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className={clsx(
        "fixed bottom-6 right-6 z-[600] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold",
        type === "success"
          ? "bg-emerald-500 text-white"
          : "bg-red-500 text-white",
      )}
    >
      {type === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
      {msg}
    </motion.div>
  );
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({
  name,
  image,
  size = "sm",
}: {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sz = {
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-16 h-16 text-lg",
  };
  if (image)
    return (
      <div
        className={clsx(
          sz[size],
          "rounded-2xl overflow-hidden shrink-0 border border-border",
        )}
      >
        <Image
          src={image}
          alt={name}
          width={64}
          height={64}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  return (
    <div
      className={clsx(
        sz[size],
        avatarColor(name),
        "rounded-2xl flex items-center justify-center shrink-0 text-white font-bold",
      )}
    >
      {initials(name)}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }: { status?: AttendanceStatus | null }) {
  if (!status)
    return (
      <span className="text-[11px] text-muted-foreground/50 font-medium">
        Unmarked
      </span>
    );
  const c = ATT_CONFIG[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
        c.bg,
        c.text,
        c.border,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

// ── Status Picker Dropdown ────────────────────────────────────
function StatusPicker({
  current,
  onSelect,
  loading,
}: {
  current?: AttendanceStatus | null;
  onSelect: (s: AttendanceStatus) => Promise<void>;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handle = async (s: AttendanceStatus) => {
    setBusy(true);
    await onSelect(s);
    setBusy(false);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
      >
        <StatusBadge status={current} />
        {busy ? (
          <Loader2 size={10} className="animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown size={11} className="text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1.5 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden min-w-[140px]"
          >
            {ATT_STATUSES.map((s) => {
              const c = ATT_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => handle(s)}
                  className={clsx(
                    "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold hover:bg-muted/60 transition-colors",
                    current === s && "bg-muted/40",
                  )}
                >
                  <span
                    className={clsx("w-2 h-2 rounded-full shrink-0", c.dot)}
                  />
                  <span className={c.text}>{c.label}</span>
                  {current === s && (
                    <CheckCircle2
                      size={10}
                      className="ml-auto text-muted-foreground"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Duty Toggle ───────────────────────────────────────────────
function DutyToggle({
  isOnDuty,
  onChange,
}: {
  isOnDuty: boolean;
  onChange: (v: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    await onChange(!isOnDuty);
    setBusy(false);
  };
  return (
    <button
      onClick={handle}
      disabled={busy}
      className="flex items-center gap-1.5 transition-opacity hover:opacity-70 disabled:opacity-50"
    >
      {busy ? (
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      ) : isOnDuty ? (
        <ToggleRight size={24} className="text-emerald-500" />
      ) : (
        <ToggleLeft size={24} className="text-muted-foreground/40" />
      )}
      <span
        className={clsx(
          "text-[10px] font-semibold",
          isOnDuty ? "text-emerald-500" : "text-muted-foreground/60",
        )}
      >
        {isOnDuty ? "On Duty" : "Off Duty"}
      </span>
    </button>
  );
}

// ── Staff History Drawer ──────────────────────────────────────
function StaffHistoryDrawer({
  staff,
  onClose,
}: {
  staff: StaffAttendanceRow;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!staff.staffProfile?.staff_id) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ logs: AttendanceLog[] }>(
        `/staff/attendance?staffId=${staff.staffProfile.staff_id}`,
      );
      setLogs(data.logs);
    } finally {
      setLoading(false);
    }
  }, [staff.staffProfile?.staff_id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const summary = useMemo(
    () => ({
      present: logs.filter((l) => l.status === "Present").length,
      absent: logs.filter((l) => l.status === "Absent").length,
      halfDay: logs.filter((l) => l.status === "HalfDay").length,
      leave: logs.filter((l) => l.status === "Leave").length,
      hours: logs.reduce((s, l) => s + (l.hours ?? 0), 0),
    }),
    [logs],
  );

  const rate =
    logs.length > 0 ? Math.round((summary.present / logs.length) * 100) : 0;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed right-0 top-0 bottom-0 z-[250] w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Avatar name={staff.name} image={staff.profileImage} size="md" />
            <div>
              <p className="font-bold text-foreground text-sm">{staff.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {staff.staffProfile?.designation} ·{" "}
                {staff.staffProfile?.department?.name ?? "—"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Summary cards */}
        <div className="px-5 pt-4 pb-3 border-b border-border shrink-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Last 31 Days
          </p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              {
                label: "Present",
                value: summary.present,
                color: "text-emerald-600",
                bg: "bg-emerald-500/10",
              },
              {
                label: "Absent",
                value: summary.absent,
                color: "text-red-500",
                bg: "bg-red-500/10",
              },
              {
                label: "Half Day",
                value: summary.halfDay,
                color: "text-amber-600",
                bg: "bg-amber-500/10",
              },
              {
                label: "Leave",
                value: summary.leave,
                color: "text-blue-600",
                bg: "bg-blue-500/10",
              },
            ].map(({ label, value, color, bg }) => (
              <div
                key={label}
                className={clsx(
                  "rounded-2xl px-2 py-2.5 text-center border border-transparent",
                  bg,
                )}
              >
                <p className={clsx("text-lg font-bold", color)}>{value}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Attendance rate bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">
                Attendance Rate
              </span>
              <span
                className={clsx(
                  "font-bold",
                  rate >= 80
                    ? "text-emerald-600"
                    : rate >= 60
                      ? "text-amber-600"
                      : "text-red-500",
                )}
              >
                {rate}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rate}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={clsx(
                  "h-full rounded-full",
                  rate >= 80
                    ? "bg-emerald-500"
                    : rate >= 60
                      ? "bg-amber-500"
                      : "bg-red-500",
                )}
              />
            </div>
            {summary.hours > 0 && (
              <p className="text-[10px] text-muted-foreground text-right">
                {summary.hours.toFixed(1)} total hours logged
              </p>
            )}
          </div>
        </div>

        {/* Log list */}
        <div
          className="flex-1 overflow-y-auto px-5 py-3 space-y-2"
          style={{ scrollbarWidth: "thin" }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2
                size={20}
                className="animate-spin text-muted-foreground/40"
              />
              <p className="text-sm text-muted-foreground">Loading history…</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardList
                size={28}
                className="mx-auto mb-2 text-muted-foreground/20"
              />
              <p className="text-sm text-muted-foreground">No records found</p>
            </div>
          ) : (
            logs.map((log, i) => {
              const c = ATT_CONFIG[log.status];
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={clsx(
                    "flex items-start gap-3 p-3 rounded-2xl border",
                    c.bg,
                    c.border,
                  )}
                >
                  <div
                    className={clsx(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      c.dot,
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">
                        {new Date(log.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <StatusBadge status={log.status} />
                    </div>
                    {(log.check_in || log.check_out) && (
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        {log.check_in && (
                          <span>
                            In:{" "}
                            <span className="font-medium text-foreground">
                              {fmtTime(log.check_in)}
                            </span>
                          </span>
                        )}
                        {log.check_out && (
                          <span>
                            Out:{" "}
                            <span className="font-medium text-foreground">
                              {fmtTime(log.check_out)}
                            </span>
                          </span>
                        )}
                        {log.hours && (
                          <span className="ml-auto font-semibold text-foreground">
                            {log.hours}h
                          </span>
                        )}
                      </div>
                    )}
                    {log.notes && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {log.notes}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Bulk Mark Modal ───────────────────────────────────────────
function BulkMarkModal({
  staff,
  date,
  onMark,
  onClose,
}: {
  staff: StaffAttendanceRow[];
  date: string;
  onMark: (status: AttendanceStatus) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<AttendanceStatus>("Present");
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    await onMark(selected);
    setBusy(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ position: "fixed", inset: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5"
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-bold text-foreground">Bulk Mark Attendance</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Mark{" "}
            <span className="font-semibold text-foreground">
              {staff.length}
            </span>{" "}
            unmarked staff for{" "}
            <span className="font-semibold text-foreground">
              {fmtDate(date)}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ATT_STATUSES.map((s) => {
            const c = ATT_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setSelected(s)}
                className={clsx(
                  "flex items-center gap-2 p-3 rounded-2xl border-2 text-sm font-semibold transition-all",
                  selected === s
                    ? `${c.border} ${c.bg} ${c.text}`
                    : "border-border hover:bg-muted",
                )}
              >
                <span className={clsx("w-2.5 h-2.5 rounded-full", c.dot)} />
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {busy ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCircle2 size={13} />
            )}
            {busy ? "Marking…" : "Mark All"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main AdminAttendance Page ─────────────────────────────────
export default function Attendance() {
  const [date, setDate] = useState(todayStr());
  const [staff, setStaff] = useState<StaffAttendanceRow[]>([]);
  const [summary, setSummary] = useState<DailySummary>({
    total: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    onDuty: 0,
    unmarked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewStaff, setViewStaff] = useState<StaffAttendanceRow | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch day data ───────────────────────────────────────────
  const fetchDay = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const { data } = await api.get<{
        staff: StaffAttendanceRow[];
        summary: DailySummary;
        date: string;
      }>(`/staff/attendance?date=${d}`);
      setStaff(data.staff);
      setSummary(data.summary);
    } catch {
      showToast("Failed to load attendance", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDay(date);
  }, [date, fetchDay]);

  // ── Navigate dates ───────────────────────────────────────────
  const shiftDate = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d.toISOString().split("T")[0]);
  };
  const isToday = date === todayStr();

  // ── Mark attendance ──────────────────────────────────────────
  const markAttendance = async (
    row: StaffAttendanceRow,
    status: AttendanceStatus,
  ) => {
    if (!row.staffProfile) return;
    try {
      await api.post("/staff/attendance", {
        staff_id: row.staffProfile.staff_id,
        user_id: row.id,
        status,
        date,
      });
      setStaff((prev) =>
        prev.map((s) =>
          s.id === row.id
            ? {
                ...s,
                todayLog: {
                  ...(s.todayLog ?? {
                    id: 0,
                    staff_id: s.staffProfile!.staff_id,
                    user_id: s.id,
                    date,
                    notes: null,
                    check_in: null,
                    check_out: null,
                    hours: null,
                  }),
                  status,
                },
              }
            : s,
        ),
      );
      setSummary((prev) => {
        const old = row.todayLog?.status;
        const next = { ...prev };
        if (old)
          next[
            old === "HalfDay"
              ? "halfDay"
              : (old.toLowerCase() as keyof DailySummary)
          ] = Math.max(
            0,
            (next[
              old === "HalfDay"
                ? "halfDay"
                : (old.toLowerCase() as keyof DailySummary)
            ] as number) - 1,
          );
        else next.unmarked = Math.max(0, next.unmarked - 1);
        next[
          status === "HalfDay"
            ? "halfDay"
            : (status.toLowerCase() as keyof DailySummary)
        ] =
          ((next[
            status === "HalfDay"
              ? "halfDay"
              : (status.toLowerCase() as keyof DailySummary)
          ] as number) ?? 0) + 1;
        return next;
      });
      showToast(`${row.name} marked ${status}`);
    } catch {
      showToast("Failed to mark attendance", "error");
    }
  };

  // ── Toggle duty ──────────────────────────────────────────────
  const toggleDuty = async (row: StaffAttendanceRow, val: boolean) => {
    if (!row.staffProfile) return;
    try {
      await api.patch("/staff/attendance", {
        staff_id: row.staffProfile.staff_id,
        is_on_duty: val,
      });
      setStaff((prev) =>
        prev.map((s) =>
          s.id === row.id && s.staffProfile
            ? { ...s, staffProfile: { ...s.staffProfile, is_on_duty: val } }
            : s,
        ),
      );
      setSummary((prev) => ({
        ...prev,
        onDuty: val ? prev.onDuty + 1 : Math.max(0, prev.onDuty - 1),
      }));
      showToast(`${row.name} is now ${val ? "On Duty" : "Off Duty"}`);
    } catch {
      showToast("Failed to update duty status", "error");
    }
  };

  // ── Bulk mark unmarked ───────────────────────────────────────
  const handleBulkMark = async (status: AttendanceStatus) => {
    const unmarked = staff.filter((s) => !s.todayLog && s.staffProfile);
    if (unmarked.length === 0) return;
    try {
      await api.post("/staff/attendance", {
        bulk: unmarked.map((s) => ({
          staff_id: s.staffProfile!.staff_id,
          user_id: s.id,
          status,
        })),
        date,
      });
      setStaff((prev) =>
        prev.map((s) => {
          if (!s.todayLog && s.staffProfile) {
            return {
              ...s,
              todayLog: {
                id: 0,
                staff_id: s.staffProfile.staff_id,
                user_id: s.id,
                date,
                status,
                notes: null,
                check_in: null,
                check_out: null,
                hours: null,
              },
            };
          }
          return s;
        }),
      );
      setSummary((prev) => {
        const next = { ...prev };
        const key =
          status === "HalfDay"
            ? "halfDay"
            : (status.toLowerCase() as keyof DailySummary);
        (next[key] as number) += prev.unmarked;
        next.unmarked = 0;
        return next;
      });
      showToast(`${unmarked.length} staff marked ${status}`);
    } catch {
      showToast("Failed bulk mark", "error");
    }
  };

  // ── Filter ───────────────────────────────────────────────────
  const departments = useMemo(() => {
    const seen = new Set<string>();
    const depts: DepartmentConfig[] = [];
    staff.forEach((s) => {
      const d = s.staffProfile?.department;
      if (d && !seen.has(d.name)) {
        seen.add(d.name);
        depts.push(d);
      }
    });
    return depts.sort((a, b) => a.name.localeCompare(b.name));
  }, [staff]);

  const filtered = useMemo(
    () =>
      staff.filter((s) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.employeeId ?? "").toLowerCase().includes(q);
        const matchDept =
          !deptFilter || s.staffProfile?.department?.name === deptFilter;
        const matchStatus =
          !statusFilter ||
          (statusFilter === "unmarked"
            ? !s.todayLog
            : s.todayLog?.status === statusFilter);
        return matchSearch && matchDept && matchStatus;
      }),
    [staff, search, deptFilter, statusFilter],
  );

  const unmarkedStaff = staff.filter((s) => !s.todayLog && s.staffProfile);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mark and track staff attendance, manage on-duty status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDay(date)}
            className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          {unmarkedStaff.length > 0 && (
            <button
              onClick={() => setShowBulk(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <SlidersHorizontal size={14} />
              Mark {unmarkedStaff.length} Unmarked
            </button>
          )}
        </div>
      </div>

      {/* ── Date Navigator ─────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-3 w-fit">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center min-w-[180px]">
          <p className="text-sm font-bold text-foreground">{fmtDate(date)}</p>
          {isToday && (
            <p className="text-[10px] text-primary font-semibold mt-0.5">
              Today
            </p>
          )}
        </div>
        <button
          onClick={() => shiftDate(1)}
          disabled={isToday}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
        <div className="w-px h-6 bg-border" />
        <input
          type="date"
          value={date}
          max={todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className="text-sm bg-transparent text-foreground focus:outline-none cursor-pointer"
        />
      </div>

      {/* ── Summary Stats ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          {
            label: "Total",
            value: summary.total,
            icon: Users,
            color: "bg-primary",
            key: "",
          },
          {
            label: "Present",
            value: summary.present,
            icon: UserCheck,
            color: "bg-emerald-500",
            key: "Present",
          },
          {
            label: "Absent",
            value: summary.absent,
            icon: UserX,
            color: "bg-red-500",
            key: "Absent",
          },
          {
            label: "Half Day",
            value: summary.halfDay,
            icon: Minus,
            color: "bg-amber-500",
            key: "HalfDay",
          },
          {
            label: "On Leave",
            value: summary.leave,
            icon: Coffee,
            color: "bg-blue-500",
            key: "Leave",
          },
          {
            label: "On Duty",
            value: summary.onDuty,
            icon: Clock,
            color: "bg-violet-500",
            key: "",
          },
          {
            label: "Unmarked",
            value: summary.unmarked,
            icon: AlertCircle,
            color: "bg-muted-foreground",
            key: "unmarked",
          },
        ].map(({ label, value, icon: Icon, color, key }) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setStatusFilter(statusFilter === key ? "" : key)}
            className={clsx(
              "bg-background border rounded-2xl p-3.5 flex flex-col items-start gap-2 transition-all text-left hover:shadow-md",
              statusFilter === key && key
                ? "border-primary/40 bg-primary/5"
                : "border-border",
            )}
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
          </motion.button>
        ))}
      </div>

      {/* ── Attendance Rate Bar ──────────────────────────────── */}
      {summary.total > 0 && (
        <div className="bg-background border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp size={13} className="text-primary" />
              Today's Attendance Rate
            </span>
            <span className="text-xs font-bold text-foreground">
              {Math.round(
                ((summary.present + summary.halfDay * 0.5) / summary.total) *
                  100,
              )}
              %
            </span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden gap-px bg-muted">
            {summary.present > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(summary.present / summary.total) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-emerald-500 h-full"
                title={`Present: ${summary.present}`}
              />
            )}
            {summary.halfDay > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(summary.halfDay / summary.total) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                className="bg-amber-500 h-full"
                title={`Half Day: ${summary.halfDay}`}
              />
            )}
            {summary.leave > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(summary.leave / summary.total) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="bg-blue-500 h-full"
                title={`Leave: ${summary.leave}`}
              />
            )}
            {summary.absent > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(summary.absent / summary.total) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="bg-red-500 h-full"
                title={`Absent: ${summary.absent}`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {[
              {
                label: "Present",
                color: "bg-emerald-500",
                value: summary.present,
              },
              {
                label: "Half Day",
                color: "bg-amber-500",
                value: summary.halfDay,
              },
              { label: "Leave", color: "bg-blue-500", value: summary.leave },
              { label: "Absent", color: "bg-red-500", value: summary.absent },
              {
                label: "Unmarked",
                color: "bg-muted-foreground",
                value: summary.unmarked,
              },
            ]
              .filter((x) => x.value > 0)
              .map(({ label, color, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                >
                  <span className={clsx("w-2 h-2 rounded-sm", color)} />
                  {label}: {value}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, email…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.icon} {d.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
        >
          <option value="">All Statuses</option>
          {ATT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ATT_CONFIG[s].label}
            </option>
          ))}
          <option value="unmarked">Unmarked</option>
        </select>

        {(search || deptFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setDeptFilter("");
              setStatusFilter("");
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* ── Main Table ──────────────────────────────────────── */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2
              size={22}
              className="animate-spin text-muted-foreground/40"
            />
            <p className="text-sm text-muted-foreground">Loading attendance…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {[
                    "Staff",
                    "Department",
                    "Shift",
                    "Attendance",
                    "On Duty",
                    "Check In",
                    "Check Out",
                    "Hours",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <ClipboardList
                        size={28}
                        className="mx-auto mb-2.5 text-muted-foreground/20"
                      />
                      <p className="text-sm text-muted-foreground">
                        No staff found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => {
                    const sp = row.staffProfile;
                    const log = row.todayLog;
                    const dept = sp?.department;
                    const shift = sp?.shift;

                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.018 }}
                        className={clsx(
                          "border-t border-border hover:bg-muted/20 transition-colors",
                          !log && "bg-amber-500/[0.02]",
                        )}
                      >
                        {/* Staff */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              name={row.name}
                              image={row.profileImage}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                                {row.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {row.employeeId ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3.5">
                          {dept ? (
                            <span
                              className={clsx(
                                "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                dept.bg,
                                dept.color,
                              )}
                            >
                              <span>{dept.icon}</span> {dept.name}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/40">
                              —
                            </span>
                          )}
                        </td>

                        {/* Shift */}
                        <td className="px-4 py-3.5">
                          {shift ? (
                            <div
                              className={clsx(
                                "inline-flex flex-col px-2.5 py-1 rounded-xl border text-[10px]",
                                shift.bg,
                                shift.color,
                              )}
                            >
                              <span className="font-semibold">
                                {shift.name}
                              </span>
                              <span className="opacity-70">
                                {shift.start_time}–{shift.end_time}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/40">
                              —
                            </span>
                          )}
                        </td>

                        {/* Attendance — clickable picker */}
                        <td className="px-4 py-3.5">
                          {sp ? (
                            <StatusPicker
                              current={log?.status}
                              onSelect={(status) => markAttendance(row, status)}
                            />
                          ) : (
                            <span className="text-[11px] text-muted-foreground/40">
                              —
                            </span>
                          )}
                        </td>

                        {/* On Duty */}
                        <td className="px-4 py-3.5">
                          {sp ? (
                            <DutyToggle
                              isOnDuty={sp.is_on_duty}
                              onChange={(val) => toggleDuty(row, val)}
                            />
                          ) : (
                            <span className="text-[11px] text-muted-foreground/40">
                              —
                            </span>
                          )}
                        </td>

                        {/* Check In */}
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {log?.check_in ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <Clock size={10} /> {fmtTime(log.check_in)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Check Out */}
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {log?.check_out ? (
                            <span className="flex items-center gap-1 text-red-500 font-medium">
                              <Clock size={10} /> {fmtTime(log.check_out)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Hours */}
                        <td className="px-4 py-3.5 text-xs font-semibold text-foreground">
                          {log?.hours ? `${log.hours}h` : "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setViewStaff(row)}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                          >
                            <BarChart3 size={12} /> History
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/20 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Showing {filtered.length} of {staff.length} staff
            </span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {summary.present} present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {summary.absent} absent
              </span>
              {summary.unmarked > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle size={10} />
                  {summary.unmarked} unmarked
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── Staff History Drawer ─────────────────────────── */}
      <AnimatePresence>
        {viewStaff && (
          <StaffHistoryDrawer
            key={viewStaff.id}
            staff={viewStaff}
            onClose={() => setViewStaff(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Bulk Mark Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showBulk && (
          <BulkMarkModal
            staff={unmarkedStaff}
            date={date}
            onMark={handleBulkMark}
            onClose={() => setShowBulk(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Toast ───────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
