// src/modules/housekeeping/AdminHousekeeping.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brush,
  ClipboardList,
  Bell,
  Shirt,
  Plus,
  X,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Star,
  Trash2,
  UserPlus,
  Edit3,
  Building2,
  Zap,
  Shield,
  Calendar,
  DollarSign,
  ArrowRight,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import {
  useTasks,
  useHousekeepingStats,
  useServiceRequests,
  useLaundry,
} from "@/hooks/useHousekeeping";
import {
  TASK_TYPE_CONFIG,
  PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  CLEANING_STATUS_CONFIG,
  REQUEST_TYPE_CONFIG,
  REQUEST_STATUS_CONFIG,
  LAUNDRY_STATUS_CONFIG,
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  REQUEST_TYPES,
  LAUNDRY_STATUSES,
  type HousekeepingTask,
  type TaskType,
  type TaskPriority,
  type TaskStatus,
  type ServiceRequest,
  type LaundryRecord,
  type CreateTaskPayload,
} from "@/types/housekeeping";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const fmtDateTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// ─── shared UI pieces ─────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all";
const selectCls = inputCls + " cursor-pointer";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={9} />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function TaskTypeBadge({ type }: { type: TaskType }) {
  const c = TASK_TYPE_CONFIG[type];
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

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const c = PRIORITY_CONFIG[priority];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full",
        c.bg,
        c.color,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {priority === "VIP" ? "VIP" : c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const c = TASK_STATUS_CONFIG[status];
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3.5"
    >
      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          color,
        )}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Room Status Dots ─────────────────────────────────────────────────────────
function RoomCleanBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const c =
    CLEANING_STATUS_CONFIG[status as keyof typeof CLEANING_STATUS_CONFIG];
  if (!c) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md",
        c.bg,
        c.color,
      )}
    >
      <span className={clsx("w-1 h-1 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────────────
function CreateTaskModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (t: HousekeepingTask) => void;
}) {
  const { createTask } = useTasks();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [taskType, setTaskType] = useState<TaskType>("Cleaning");
  const [priority, setPriority] = useState<TaskPriority>("Normal");
  const [roomId, setRoomId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [description, setDescription] = useState("");
  const [isBillable, setIsBillable] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");

  // Fetch rooms + staff for dropdowns
  const [rooms, setRooms] = useState<
    {
      room_id: number;
      room_number: string;
      floor: number;
      cleaning_status: string;
    }[]
  >([]);
  const [staff, setStaff] = useState<
    { staff_id: number; designation: string; user: { name: string } }[]
  >([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingDropdowns(true);
      try {
        const [rRes, sRes] = await Promise.all([
          fetch("/api/rooms?active=true"),
          fetch("/api/staff"),
        ]);
        const rData = await rRes.json();
        const sData = await sRes.json();
        setRooms(rData.rooms ?? []);
        setStaff(
          (sData.staff ?? [])
            .map((s: any) => ({
              staff_id: s.staffProfile?.staff_id,
              designation: s.staffProfile?.designation ?? "Staff",
              user: { name: s.name },
            }))
            .filter((s: any) => s.staff_id),
        );
      } catch {
        /* silent */
      } finally {
        setLoadingDropdowns(false);
      }
    };
    load();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!taskType) e.taskType = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload: CreateTaskPayload = {
      room_id: roomId ? parseInt(roomId) : undefined,
      assigned_to: assignedTo ? parseInt(assignedTo) : undefined,
      task_type: taskType,
      priority,
      request_description: description || undefined,
      is_billable: isBillable,
      charge_amount: chargeAmount ? parseFloat(chargeAmount) : undefined,
    };
    const res = await createTask(payload);
    setSaving(false);
    if (res.ok && res.data) {
      toast.success("Task created");
      onCreated(res.data);
      onClose();
    } else toast.error(res.error ?? "Failed");
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Plus size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Create Housekeeping Task
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Assign work to your housekeeping team
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted transition-colors"
          >
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
          style={{ scrollbarWidth: "thin" }}
        >
          {/* Task Type */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Task Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TASK_TYPES.map((t) => {
                const c = TASK_TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTaskType(t)}
                    className={clsx(
                      "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all text-xs font-medium",
                      taskType === t
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/30 hover:bg-muted/30 text-foreground",
                    )}
                  >
                    <span className="text-base">{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {TASK_PRIORITIES.map((p) => {
                const c = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all",
                      priority === p
                        ? clsx("border-current", c.bg, c.color)
                        : "border-border text-muted-foreground hover:bg-muted/30",
                    )}
                  >
                    <span className={clsx("w-2 h-2 rounded-full", c.dot)} />
                    {p === "VIP" ? " VIP" : p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room */}
          <Field label="Room">
            <div className="relative">
              <Building2
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <select
                className={clsx(selectCls, "pl-8")}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={loadingDropdowns}
              >
                <option value="">Select Room (optional)</option>
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id}>
                    Room {r.room_number} · Floor {r.floor} [{r.cleaning_status}]
                  </option>
                ))}
              </select>
            </div>
          </Field>

          {/* Assign to */}
          <Field label="Assign To (Staff)">
            <div className="relative">
              <UserPlus
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <select
                className={clsx(selectCls, "pl-8")}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={loadingDropdowns}
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.staff_id} value={s.staff_id}>
                    {s.user.name} · {s.designation}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          {/* Description */}
          <Field label="Notes / Instructions">
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={clsx(inputCls, "resize-none")}
              placeholder="Special instructions…"
            />
          </Field>

          {/* Billable */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <div
                onClick={() => setIsBillable(!isBillable)}
                className={clsx(
                  "w-9 h-5 rounded-full transition-colors relative cursor-pointer",
                  isBillable ? "bg-primary" : "bg-muted-foreground/30",
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                    isBillable ? "left-4" : "left-0.5",
                  )}
                />
              </div>
              <span className="text-xs font-medium text-foreground">
                Billable to Guest
              </span>
            </label>
            {isBillable && (
              <div className="relative w-32">
                <DollarSign
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="number"
                  min="0"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none focus:border-primary/50"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Plus size={14} /> Create Task
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Task Detail Side Panel ───────────────────────────────────────────────────
function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
}: {
  task: HousekeepingTask;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { updateTask } = useTasks();
  const [updating, setUpdating] = useState(false);
  const [staff, setStaff] = useState<
    { staff_id: number; user: { name: string }; designation: string }[]
  >([]);
  const [assignTo, setAssignTo] = useState(task.assigned_to?.toString() ?? "");

  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((d) =>
        setStaff(
          (d.staff ?? [])
            .map((s: any) => ({
              staff_id: s.staffProfile?.staff_id,
              user: { name: s.name },
              designation: s.staffProfile?.designation ?? "Staff",
            }))
            .filter((s: any) => s.staff_id),
        ),
      )
      .catch(() => {});
  }, []);

  const handleStatus = async (status: TaskStatus) => {
    setUpdating(true);
    const res = await updateTask(task.task_id, { status });
    setUpdating(false);
    if (res.ok) {
      toast.success(`Task ${status}`);
      onUpdate();
    } else toast.error(res.error ?? "Failed");
  };

  const handleAssign = async () => {
    setUpdating(true);
    const res = await updateTask(task.task_id, {
      assigned_to: assignTo ? parseInt(assignTo) : null,
    });
    setUpdating(false);
    if (res.ok) {
      toast.success("Task assigned");
      onUpdate();
    } else toast.error(res.error ?? "Failed");
  };

  const sc = TASK_STATUS_CONFIG[task.status];
  const tc = TASK_TYPE_CONFIG[task.task_type];
  const pc = PRIORITY_CONFIG[task.priority];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-screen w-full max-w-md bg-background border-l border-border shadow-2xl z-[200] flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{tc.icon}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Task #{task.task_id}
            </p>
            <p className="text-[10px] text-muted-foreground">{tc.label}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-muted transition-colors"
        >
          <X size={15} className="text-muted-foreground" />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Status + Priority */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <TaskTypeBadge type={task.task_type} />
          {task.is_billable && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Billable{" "}
              {task.charge_amount
                ? `PKR ${task.charge_amount.toLocaleString()}`
                : ""}
            </span>
          )}
        </div>

        {/* Room + Booking */}
        {task.room && (
          <div className="p-3 bg-muted/40 rounded-xl space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Room
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">
                Room {task.room.room_number}
              </p>
              <div className="flex items-center gap-1.5">
                <RoomCleanBadge status={task.room.cleaning_status} />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Floor {task.room.floor} · {task.room.room_type}
            </p>
          </div>
        )}

        {/* Assigned staff */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Assigned Staff
          </p>
          <div className="flex gap-2">
            <select
              className={clsx(selectCls, "flex-1 text-xs")}
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
            >
              <option value="">— Unassigned —</option>
              {staff.map((s) => (
                <option key={s.staff_id} value={s.staff_id}>
                  {s.user.name} · {s.designation}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={updating}
              className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {updating ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                "Assign"
              )}
            </button>
          </div>
          {task.assignedStaff && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                {task.assignedStaff.user.name[0]}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  {task.assignedStaff.user.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {task.assignedStaff.designation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {task.request_description && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </p>
            <p className="text-xs text-foreground bg-muted/40 rounded-xl p-3">
              {task.request_description}
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline
          </p>
          <div className="space-y-1.5">
            {[
              { label: "Created", value: fmtDateTime(task.created_at) },
              { label: "Started", value: fmtDateTime(task.started_at) },
              { label: "Completed", value: fmtDateTime(task.completed_at) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-center px-3 py-2 bg-muted/40 rounded-lg"
              >
                <span className="text-[10px] text-muted-foreground">
                  {label}
                </span>
                <span className="text-xs font-medium text-foreground">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Actions */}
        {task.status !== "Done" && task.status !== "Cancelled" && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {task.status === "Pending" && (
                <button
                  onClick={() => handleStatus("InProgress")}
                  disabled={updating}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  <Zap size={12} /> Start Task
                </button>
              )}
              {task.status === "InProgress" && (
                <button
                  onClick={() => handleStatus("Done")}
                  disabled={updating}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  <CheckCircle2 size={12} /> Mark Done
                </button>
              )}
              <button
                onClick={() => handleStatus("Cancelled")}
                disabled={updating}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-60 transition-colors"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────
function TasksTab() {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewTask, setViewTask] = useState<HousekeepingTask | null>(null);

  const { tasks, loading, error, refresh, createTask, updateTask, deleteTask } =
    useTasks({
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      priority: priorityFilter || undefined,
    });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q
      ? tasks
      : tasks.filter(
          (t) =>
            (t.room?.room_number ?? "").includes(q) ||
            (t.assignedStaff?.user.name ?? "").toLowerCase().includes(q) ||
            (t.request_description ?? "").toLowerCase().includes(q) ||
            `#${t.task_id}`.includes(q),
        );
  }, [tasks, search]);

  const handleDelete = async (t: HousekeepingTask) => {
    if (!confirm(`Delete task #${t.task_id}?`)) return;
    const res = await deleteTask(t.task_id);
    if (res.ok) toast.success("Task deleted");
    else toast.error(res.error ?? "Failed");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task, room…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none transition-colors"
        >
          <option value="">All Status</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none transition-colors"
        >
          <option value="">All Types</option>
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {TASK_TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none transition-colors"
        >
          <option value="">All Priority</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {(statusFilter || typeFilter || priorityFilter || search) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setTypeFilter("");
              setPriorityFilter("");
              setSearch("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X size={12} /> Clear
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button
            onClick={refresh}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
          >
            <RefreshCw size={14} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Loader2
              size={22}
              className="animate-spin text-muted-foreground/40"
            />
            <p className="text-sm text-muted-foreground">Loading tasks…</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <AlertCircle size={22} className="mx-auto text-red-400 mb-2" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {[
                    "Task",
                    "Room",
                    "Type",
                    "Priority",
                    "Status",
                    "Assigned To",
                    "Created",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <ClipboardList
                        size={28}
                        className="mx-auto mb-2 text-muted-foreground/20"
                      />
                      <p className="text-sm text-muted-foreground">
                        No tasks found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, i) => (
                    <motion.tr
                      key={t.task_id}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-t border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-mono font-bold text-muted-foreground">
                          #{t.task_id}
                        </p>
                        {t.request_description && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[150px] mt-0.5">
                            {t.request_description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {t.room ? (
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              Room {t.room.room_number}
                            </p>
                            <RoomCleanBadge status={t.room.cleaning_status} />
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <TaskTypeBadge type={t.task_type} />
                      </td>
                      <td className="px-4 py-3.5">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={t.status} />
                      </td>

                      <td className="px-4 py-3.5">
                        {t.assignedStaff ? (
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {t.assignedStaff.user.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {t.assignedStaff.designation}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-[10px] text-muted-foreground">
                          {fmt(t.created_at)}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewTask(t)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye size={13} />
                          </button>
                          {t.status !== "Done" && (
                            <button
                              onClick={() => handleDelete(t)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/10 flex justify-between text-xs text-muted-foreground">
            <span>
              Showing{" "}
              <strong className="text-foreground">{filtered.length}</strong> of{" "}
              {tasks.length} tasks
            </span>
            <span>
              {tasks.filter((t) => t.status === "Pending").length} pending ·{" "}
              {tasks.filter((t) => t.status === "InProgress").length} in
              progress
            </span>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateTaskModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              refresh();
            }}
          />
        )}
      </AnimatePresence>

      {/* Detail Panel */}
      <AnimatePresence>
        {viewTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[190]"
              onClick={() => setViewTask(null)}
            />
            <TaskDetailPanel
              task={viewTask}
              onClose={() => setViewTask(null)}
              onUpdate={() => {
                refresh();
                setViewTask(null);
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Service Requests Tab ─────────────────────────────────────────────────────
function ServiceRequestsTab() {
  const { requests, loading, error, refresh, updateRequest, cancelRequest } =
    useServiceRequests();
  const [updating, setUpdating] = useState<number | null>(null);

  const handleStatus = async (
    id: number,
    status: "Assigned" | "Completed" | "Cancelled",
  ) => {
    setUpdating(id);
    const res = await updateRequest(id, status);
    setUpdating(null);
    if (res.ok) toast.success(`Request ${status.toLowerCase()}`);
    else toast.error(res.error ?? "Failed");
  };

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Service Requests
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Guest requests queue
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
        >
          <RefreshCw size={14} className="text-muted-foreground" />
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center gap-2">
          <Loader2
            size={20}
            className="animate-spin text-muted-foreground/40"
          />
          <p className="text-sm text-muted-foreground">Loading requests…</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                {[
                  "#",
                  "Room",
                  "Guest",
                  "Request Type",
                  "Description",
                  "Status",
                  "Time",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Bell
                      size={24}
                      className="mx-auto mb-2 text-muted-foreground/20"
                    />
                    <p className="text-sm text-muted-foreground">
                      No pending requests
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((r, i) => {
                  const rc = REQUEST_TYPE_CONFIG[r.request_type];
                  const sc = REQUEST_STATUS_CONFIG[r.status];
                  return (
                    <motion.tr
                      key={r.request_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-t border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        #{r.request_id}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-foreground">
                          Room {r.room?.room_number ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-foreground">
                          {(r.booking as any)?.user?.name ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          <span>{rc.icon}</span> {rc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                          {r.description || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            sc.bg,
                            sc.color,
                          )}
                        >
                          <span
                            className={clsx("w-1.5 h-1.5 rounded-full", sc.dot)}
                          />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[10px] text-muted-foreground">
                          {fmtDateTime(r.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {r.status === "Pending" && (
                            <button
                              onClick={() =>
                                handleStatus(r.request_id, "Assigned")
                              }
                              disabled={updating === r.request_id}
                              className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
                            >
                              {updating === r.request_id ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                "Assign"
                              )}
                            </button>
                          )}
                          {r.status === "Assigned" && (
                            <button
                              onClick={() =>
                                handleStatus(r.request_id, "Completed")
                              }
                              disabled={updating === r.request_id}
                              className="px-2 py-1 rounded-lg bg-green-600 text-white text-[10px] font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
                            >
                              {updating === r.request_id ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                "Complete"
                              )}
                            </button>
                          )}
                          {r.status !== "Completed" &&
                            r.status !== "Cancelled" && (
                              <button
                                onClick={() =>
                                  handleStatus(r.request_id, "Cancelled")
                                }
                                disabled={updating === r.request_id}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Laundry Tab ──────────────────────────────────────────────────────────────
function LaundryTab() {
  const {
    records,
    loading,
    error,
    refresh,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useLaundry();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  // Form state
  const [roomId, setRoomId] = useState("");
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("1");
  const [charge, setCharge] = useState("");
  const [rooms, setRooms] = useState<
    { room_id: number; room_number: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/rooms?active=true")
      .then((r) => r.json())
      .then((d) => setRooms(d.rooms ?? []))
      .catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!roomId || !item.trim() || !qty) {
      toast.error("Room, item, quantity required");
      return;
    }
    setSaving(true);
    const res = await createRecord({
      room_id: parseInt(roomId),
      item_name: item.trim(),
      quantity: parseInt(qty),
      charge_amount: charge ? parseFloat(charge) : undefined,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Laundry record added");
      setShowAdd(false);
      setItem("");
      setQty("1");
      setCharge("");
    } else toast.error(res.error ?? "Failed");
  };

  const handleStatus = async (id: number, status: "Sent" | "Returned") => {
    setUpdating(id);
    const res = await updateRecord(id, { status });
    setUpdating(null);
    if (res.ok) toast.success(`Marked as ${status}`);
    else toast.error(res.error ?? "Failed");
  };

  return (
    <div className="space-y-4">
      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-foreground">
                  Add Laundry Record
                </p>
                <button
                  onClick={() => setShowAdd(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Room" required>
                  <select
                    className={selectCls}
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  >
                    <option value="">— Select Room —</option>
                    {rooms.map((r) => (
                      <option key={r.room_id} value={r.room_id}>
                        Room {r.room_number}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Item Name" required>
                  <input
                    className={inputCls}
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    placeholder="Shirt, Pants…"
                  />
                </Field>
                <Field label="Quantity" required>
                  <input
                    type="number"
                    min="1"
                    className={inputCls}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </Field>
                <Field label="Charge (PKR)">
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={charge}
                    onChange={(e) => setCharge(e.target.value)}
                    placeholder="0"
                  />
                </Field>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {saving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}{" "}
                  Add Record
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Laundry Records
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {records.length} records total
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <RefreshCw size={14} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={13} /> Add
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center gap-2">
            <Loader2
              size={20}
              className="animate-spin text-muted-foreground/40"
            />
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {[
                    "#",
                    "Room",
                    "Item",
                    "Qty",
                    "Charge",
                    "Status",
                    "Sent At",
                    "Returned At",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <Shirt
                        size={24}
                        className="mx-auto mb-2 text-muted-foreground/20"
                      />
                      <p className="text-sm text-muted-foreground">
                        No laundry records
                      </p>
                    </td>
                  </tr>
                ) : (
                  records.map((r, i) => {
                    const sc = LAUNDRY_STATUS_CONFIG[r.status];
                    return (
                      <tr
                        key={r.laundry_id}
                        className="border-t border-border hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                          #{r.laundry_id}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground">
                          Room {r.room?.room_number ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          {r.item_name}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-foreground">
                          {r.quantity}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          {r.charge_amount
                            ? `PKR ${r.charge_amount.toLocaleString()}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              sc.bg,
                              sc.color,
                            )}
                          >
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-muted-foreground">
                          {fmtDateTime(r.sent_at)}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-muted-foreground">
                          {fmtDateTime(r.returned_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {r.status === "Pending" && (
                              <button
                                onClick={() =>
                                  handleStatus(r.laundry_id, "Sent")
                                }
                                disabled={updating === r.laundry_id}
                                className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-medium hover:opacity-90 disabled:opacity-60"
                              >
                                Sent
                              </button>
                            )}
                            {r.status === "Sent" && (
                              <button
                                onClick={() =>
                                  handleStatus(r.laundry_id, "Returned")
                                }
                                disabled={updating === r.laundry_id}
                                className="px-2 py-1 rounded-lg bg-green-600 text-white text-[10px] font-medium hover:opacity-90 disabled:opacity-60"
                              >
                                Returned
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (!confirm("Delete?")) return;
                                const res = await deleteRecord(r.laundry_id);
                                if (!res.ok) toast.error(res.error ?? "Failed");
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main AdminHousekeeping ───────────────────────────────────────────────────
export default function Housekeeping() {
  const {
    stats,
    loading: statsLoading,
    refresh: refreshStats,
  } = useHousekeepingStats();
  const [activeTab, setActiveTab] = useState<"tasks" | "requests" | "laundry">(
    "tasks",
  );

  const statCards = [
    {
      label: "Total Tasks",
      value: stats?.totalTasks ?? 0,
      icon: ClipboardList,
      color: "bg-primary",
    },
    {
      label: "Pending",
      value: stats?.pendingTasks ?? 0,
      icon: Clock,
      color: "bg-amber-500",
    },
    {
      label: "In Progress",
      value: stats?.inProgressTasks ?? 0,
      icon: Zap,
      color: "bg-blue-600",
    },
    {
      label: "Completed Today",
      value: stats?.completedToday ?? 0,
      icon: CheckCircle2,
      color: "bg-green-600",
    },
    {
      label: "VIP Tasks",
      value: stats?.vipTasks ?? 0,
      icon: Star,
      color: "bg-rose-600",
    },
    {
      label: "Service Requests",
      value: stats?.serviceRequests ?? 0,
      icon: Bell,
      color: "bg-purple-600",
    },
    {
      label: "Dirty Rooms",
      value: stats?.dirtyRooms ?? 0,
      icon: AlertCircle,
      color: "bg-red-500",
    },
    {
      label: "Clean Rooms",
      value: stats?.cleanRooms ?? 0,
      icon: Shield,
      color: "bg-teal-600",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">🧹</span> House Keeping
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Task management, service requests and laundry
          </p>
        </div>
        <button
          onClick={refreshStats}
          className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
        >
          <RefreshCw size={15} className="text-muted-foreground" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-background border border-border rounded-2xl p-3.5 flex flex-col items-center text-center gap-2"
          >
            <div
              className={clsx(
                "w-9 h-9 rounded-xl flex items-center justify-center",
                s.color,
              )}
            >
              <s.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">
                {statsLoading ? (
                  <span className="text-muted-foreground/30">…</span>
                ) : (
                  s.value
                )}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                {s.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="border-b border-border flex gap-1">
        {[
          { key: "tasks", label: "Tasks", icon: ClipboardList },
          { key: "requests", label: "Service Requests", icon: Bell },
          { key: "laundry", label: "Laundry", icon: Shirt },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "tasks" && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <TasksTab />
          </motion.div>
        )}
        {activeTab === "requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ServiceRequestsTab />
          </motion.div>
        )}
        {activeTab === "laundry" && (
          <motion.div
            key="laundry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <LaundryTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
