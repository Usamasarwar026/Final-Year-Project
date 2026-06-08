// src/modules/staff/StaffDashboard.tsx
"use client";

import { useMyTasks, useStaffMe } from "@/hooks/useCustomerHousekeeping";
import {
  PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  TASK_TYPE_CONFIG,
  type HousekeepingTask,
  type TaskStatus,
} from "@/types/housekeeping";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Flag,
  Loader2,
  Play,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtDT = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// ─── Task Type Badge ──────────────────────────────────────────────────────────
function TaskTypeBadge({ type }: { type: string }) {
  const c = TASK_TYPE_CONFIG[type as keyof typeof TASK_TYPE_CONFIG];
  if (!c) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
        c.bg,
        c.color,
      )}
    >
      {c.icon} {c.label}
    </span>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const c = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
  if (!c) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
        c.bg,
        c.color,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {priority === "VIP" ? " VIP" : c.label}
    </span>
  );
}

// ─── Task Status Badge ────────────────────────────────────────────────────────
function TaskStatusBadge({ status }: { status: string }) {
  const c = TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG];
  if (!c) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
        c.bg,
        c.color,
        c.border,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

// ─── My Task Card ─────────────────────────────────────────────────────────────
function MyTaskCard({
  task,
  onUpdate,
}: {
  task: HousekeepingTask;
  onUpdate: () => void;
}) {
  const { updateTaskStatus } = useMyTasks();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAction = async (status: TaskStatus) => {
    setLoading(true);
    const res = await updateTaskStatus(task.task_id, status);
    setLoading(false);
    if (res.ok) {
      toast.success(
        status === "InProgress"
          ? "Task started!"
          : status === "Done"
            ? "Task completed! "
            : "Task cancelled",
      );
      onUpdate();
    } else {
      toast.error(res.error ?? "Failed");
    }
  };

  const tc = TASK_TYPE_CONFIG[task.task_type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "rounded-2xl border transition-all overflow-hidden",
        task.priority === "VIP"
          ? "border-rose-200 bg-rose-50/40"
          : task.priority === "High"
            ? "border-orange-200 bg-orange-50/30"
            : "border-border bg-background",
      )}
    >
      {/* Priority stripe */}
      {task.priority !== "Normal" && (
        <div
          className={clsx(
            "h-0.5",
            task.priority === "VIP" ? "bg-rose-500" : "bg-orange-400",
          )}
        />
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0",
              tc.bg,
            )}
          >
            {tc.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-bold text-foreground">
                #{task.task_id}
              </p>
              <TaskTypeBadge type={task.task_type} />
              <PriorityBadge priority={task.priority} />
            </div>
            {task.room && (
              <p className="text-sm font-semibold text-foreground mt-0.5">
                Room {task.room.room_number}
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  · Floor {task.room.floor} · {task.room.room_type}
                </span>
              </p>
            )}
            {task.request_description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {task.request_description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <TaskStatusBadge status={task.status} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight
                size={13}
                className={clsx(
                  "text-muted-foreground transition-transform",
                  expanded && "rotate-90",
                )}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        {task.status !== "Done" && task.status !== "Cancelled" && (
          <div className="flex gap-2 mt-3">
            {task.status === "Pending" && (
              <button
                onClick={() => handleAction("InProgress")}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {loading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Play size={12} />
                )}
                Start Task
              </button>
            )}
            {task.status === "InProgress" && (
              <button
                onClick={() => handleAction("Done")}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {loading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Flag size={12} />
                )}
                Mark Complete
              </button>
            )}
          </div>
        )}
        {task.status === "Done" && (
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-green-600">
            <CheckCircle2 size={12} />
            Completed {fmtDT(task.completed_at)}
          </div>
        )}

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
                {[
                  { label: "Created", value: fmtDT(task.created_at) },
                  { label: "Started", value: fmtDT(task.started_at) },
                  { label: "Completed", value: fmtDT(task.completed_at) },
                  {
                    label: "Billable",
                    value: task.is_billable
                      ? `Yes${task.charge_amount ? ` · PKR ${task.charge_amount}` : ""}`
                      : "No",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-2">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-[10px] font-medium text-foreground mt-0.5">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── My Tasks Tab ─────────────────────────────────────────────────────────────
function MyTasksTab() {
  const { tasks, stats, loading, error, refresh } = useMyTasks();
  const [statusFilter, setStatusFilter] = useState<string>("active"); // active = not done/cancelled

  const filtered = useMemo(() => {
    if (statusFilter === "active")
      return tasks.filter(
        (t) => t.status !== "Done" && t.status !== "Cancelled",
      );
    if (statusFilter === "done")
      return tasks.filter((t) => t.status === "Done");
    return tasks;
  }, [tasks, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Pending",
            value: stats?.pendingCount ?? 0,
            color: "bg-amber-500",
            icon: Clock,
          },
          {
            label: "In Progress",
            value: stats?.inProgressCount ?? 0,
            color: "bg-blue-600",
            icon: Zap,
          },
          {
            label: "Completed Today",
            value: stats?.todayCompleted ?? 0,
            color: "bg-green-600",
            icon: CheckCircle2,
          },
          {
            label: "Total Done",
            value: stats?.totalDone ?? 0,
            color: "bg-primary",
            icon: Flag,
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-background border border-border rounded-2xl p-3.5 flex items-center gap-2.5"
          >
            <div
              className={clsx(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                s.color,
              )}
            >
              <s.icon size={15} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">
                {s.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {s.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter + Refresh */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: "active", label: "Active" },
          { key: "done", label: "Completed" },
          { key: "all", label: "All" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={clsx(
              "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
              statusFilter === key
                ? "bg-primary text-white border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            {label}
          </button>
        ))}
        <button
          onClick={refresh}
          className="ml-auto p-2 rounded-xl border border-border hover:bg-muted transition-colors"
        >
          <RefreshCw size={13} className="text-muted-foreground" />
        </button>
      </div>

      {/* Task Cards */}
      {loading ? (
        <div className="py-12 flex flex-col items-center gap-3">
          <Loader2
            size={20}
            className="animate-spin text-muted-foreground/40"
          />
          <p className="text-sm text-muted-foreground">Loading tasks…</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <AlertCircle size={20} className="mx-auto text-red-400 mb-2" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <ClipboardList
            size={32}
            className="mx-auto text-muted-foreground/20 mb-3"
          />
          <p className="text-sm font-medium text-foreground">
            {statusFilter === "active"
              ? "No active tasks assigned"
              : "No tasks found"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tasks assigned by admin will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <MyTaskCard key={task.task_id} task={task} onUpdate={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main StaffDashboard ──────────────────────────────────────────────────────
export default function StaffHousekeeping() {
  const { data, loading, error, refresh } = useStaffMe();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={24} className="animate-spin text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle size={24} className="text-red-400" />
        <p className="text-sm text-red-500">{error ?? "Failed to load"}</p>
        <button
          onClick={refresh}
          className="text-xs text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">House Keeping</h1>
          <p className="text-sm text-muted-foreground">
            Manage your tasks and view your schedule
          </p>
        </div>
        <button
          onClick={() => {
            refresh();
          }}
          className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
        >
          <RefreshCw size={15} className="text-muted-foreground" />
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key="tk" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <MyTasksTab />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
