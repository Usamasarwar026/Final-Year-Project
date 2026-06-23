// src/modules/staff/SettingStaffTab.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Bell,
  Sparkles,
  ChefHat,
  Briefcase,
  Shield,
  User,
  Hotel,
  Waves,
  Utensils,
  Wrench,
  Pill,
  Theater,
  Car,
  Package,
  Target,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { useDepartments, useShifts } from "@/hooks/useStaff";
import type { DepartmentConfig, ShiftConfig } from "@/types/staff";

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all";

// ─── Dept Icon Options ────────────────────────────────────────────────────────
const DEPT_ICONS = [
  { icon: Bell, label: "Bell" },
  { icon: Sparkles, label: "Sparkles" },
  { icon: ChefHat, label: "Chef Hat" },
  { icon: Briefcase, label: "Briefcase" },
  { icon: Shield, label: "Shield" },
  { icon: User, label: "User" },
  { icon: Hotel, label: "Hotel" },
  { icon: Waves, label: "Waves" },
  { icon: Utensils, label: "Utensils" },
  { icon: Wrench, label: "Wrench" },
  { icon: Pill, label: "Pill" },
  { icon: Theater, label: "Theater" },
  { icon: Car, label: "Car" },
  { icon: Package, label: "Package" },
  { icon: Target, label: "Target" },
];

// ─── Color Options for dept badges ───────────────────────────────────────────
const COLOR_OPTIONS = [
  { label: "Blue", color: "text-blue-700", bg: "bg-blue-100" },
  { label: "Green", color: "text-green-700", bg: "bg-green-100" },
  { label: "Orange", color: "text-orange-700", bg: "bg-orange-100" },
  { label: "Purple", color: "text-purple-700", bg: "bg-purple-100" },
  { label: "Red", color: "text-red-700", bg: "bg-red-100" },
  { label: "Teal", color: "text-teal-700", bg: "bg-teal-100" },
  { label: "Amber", color: "text-amber-700", bg: "bg-amber-100" },
  { label: "Gray", color: "text-gray-700", bg: "bg-gray-100" },
];

// ─── Helper to get icon component by label ──────────────────────────────────
const getIconByLabel = (label: string) => {
  const found = DEPT_ICONS.find((i) => i.label === label);
  return found ? found.icon : User; // Default to User icon
};

// ─── Department Form ──────────────────────────────────────────────────────────
function DeptForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<DepartmentConfig>;
  onSave: (data: {
    name: string;
    icon: string;
    color: string;
    bg: string;
  }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [iconIndex, setIconIndex] = useState(() => {
    const idx = DEPT_ICONS.findIndex((i) => i.label === initial?.icon);
    return idx >= 0 ? idx : 0; // Default to first icon if not found
  });
  const [color, setColor] = useState(
    COLOR_OPTIONS.find((c) => c.color === initial?.color) ?? COLOR_OPTIONS[0]
  );

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }
    await onSave({ 
      name: name.trim(), 
      icon: DEPT_ICONS[iconIndex].label, 
      color: color.color, 
      bg: color.bg 
    });
  };

  const SelectedIcon = DEPT_ICONS[iconIndex]?.icon || User;

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-border">
      {/* Name */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Department Name <span className="text-red-400">*</span>
        </label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Reception, Security…"
          autoFocus
        />
      </div>

      {/* Icon picker */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Icon
        </label>
        <div className="flex flex-wrap gap-2">
          {DEPT_ICONS.map((ic, idx) => {
            const IconComponent = ic.icon;
            return (
              <button
                key={ic.label}
                type="button"
                onClick={() => setIconIndex(idx)}
                className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all",
                  iconIndex === idx
                    ? "border-primary bg-primary/10 scale-110"
                    : "border-border hover:border-primary/40"
                )}
              >
                <IconComponent size={16} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Badge Color
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setColor(c)}
              className={clsx(
                "px-2.5 py-1 rounded-lg text-[11px] font-semibold border-2 transition-all",
                c.bg,
                c.color,
                color.label === c.label
                  ? "border-primary scale-105"
                  : "border-transparent"
              )}
            >
              <SelectedIcon size={12} className="inline mr-1" />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Preview:</span>
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
            color.bg,
            color.color
          )}
        >
          <SelectedIcon size={12} />
          {name || "Department"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check size={13} /> Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Shift Form ───────────────────────────────────────────────────────────────
function ShiftForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<ShiftConfig>;
  onSave: (data: {
    name: string;
    start_time: string;
    end_time: string;
  }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [start, setStart] = useState(initial?.start_time ?? "09:00");
  const [end, setEnd] = useState(initial?.end_time ?? "17:00");

  // Compute duration display
  const duration = (() => {
    try {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      let mins = eh * 60 + em - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60; // overnight
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    } catch {
      return "—";
    }
  })();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Shift name is required");
      return;
    }
    if (!start) {
      toast.error("Start time is required");
      return;
    }
    if (!end) {
      toast.error("End time is required");
      return;
    }
    await onSave({ name: name.trim(), start_time: start, end_time: end });
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-border">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Shift Name <span className="text-red-400">*</span>
        </label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning, Night…"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Start Time
          </label>
          <input
            type="time"
            className={inputCls}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            End Time
          </label>
          <input
            type="time"
            className={inputCls}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-2.5 bg-background rounded-xl border border-border">
        <Clock size={14} className="text-muted-foreground shrink-0" />
        <div>
          <p className="text-xs font-semibold text-foreground">
            {name || "Shift Name"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {start} – {end} · {duration}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check size={13} /> Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon size={15} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-[10px] text-muted-foreground">
            {count} configured
          </p>
        </div>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

// ─── Main SettingStaffTab ─────────────────────────────────────────────────────
export default function SettingStaffTab() {
  const {
    departments,
    loading: deptLoading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refresh: refreshDepts,
  } = useDepartments();
  const {
    shifts,
    loading: shiftLoading,
    createShift,
    updateShift,
    deleteShift,
    refresh: refreshShifts,
  } = useShifts();

  const [deptForm, setDeptForm] = useState<"add" | number | null>(null); // null=hidden, "add"=new, number=editing id
  const [shiftForm, setShiftForm] = useState<"add" | number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // ── Dept handlers ──────────────────────────────────────────────────────────
  const handleSaveDept = async (payload: {
    name: string;
    icon: string;
    color: string;
    bg: string;
  }) => {
    setSaving(true);
    let res;
    if (deptForm === "add") {
      res = await createDepartment(payload);
    } else {
      res = await updateDepartment(deptForm as number, payload);
    }
    setSaving(false);
    if (res.ok) {
      toast.success(
        deptForm === "add" ? "Department created" : "Department updated"
      );
      setDeptForm(null);
    } else toast.error(res.error ?? "Failed");
  };

  const handleDeleteDept = async (d: DepartmentConfig) => {
    if (
      !confirm(
        `Delete department "${d.name}"? Staff assigned to it will lose their department.`
      )
    )
      return;
    setDeleting(d.id);
    const res = await deleteDepartment(d.id);
    setDeleting(null);
    if (res.ok) toast.success("Department removed");
    else toast.error(res.error ?? "Failed");
  };

  // ── Shift handlers ─────────────────────────────────────────────────────────
  const handleSaveShift = async (payload: {
    name: string;
    start_time: string;
    end_time: string;
  }) => {
    setSaving(true);
    let res;
    if (shiftForm === "add") {
      res = await createShift(payload);
    } else {
      res = await updateShift(shiftForm as number, payload);
    }
    setSaving(false);
    if (res.ok) {
      toast.success(shiftForm === "add" ? "Shift created" : "Shift updated");
      setShiftForm(null);
    } else toast.error(res.error ?? "Failed");
  };

  const handleDeleteShift = async (s: ShiftConfig) => {
    if (!confirm(`Delete shift "${s.name}"?`)) return;
    setDeleting(s.id);
    const res = await deleteShift(s.id);
    setDeleting(null);
    if (res.ok) toast.success("Shift removed");
    else toast.error(res.error ?? "Failed");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── DEPARTMENTS ────────────────────────────────────────────── */}
      <SectionCard
        title="Departments"
        icon={Building2}
        count={departments.length}
      >
        {deptLoading ? (
          <div className="py-6 flex justify-center">
            <Loader2
              size={18}
              className="animate-spin text-muted-foreground/40"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {departments.map((d) => {
              const IconComponent = getIconByLabel(d.icon || "User");
              return (
                <div key={d.id}>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/30 transition-colors group">
                    {/* Badge preview */}
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                        d.bg,
                        d.color
                      )}
                    >
                      <IconComponent size={12} />
                      {d.name}
                    </span>
                    <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          setDeptForm(deptForm === d.id ? null : d.id)
                        }
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteDept(d)}
                        disabled={deleting === d.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {deleting === d.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  <AnimatePresence>
                    {deptForm === d.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-2"
                      >
                        <DeptForm
                          initial={d}
                          onSave={handleSaveDept}
                          onCancel={() => setDeptForm(null)}
                          saving={saving}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Add new form */}
            <AnimatePresence>
              {deptForm === "add" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <DeptForm
                    onSave={handleSaveDept}
                    onCancel={() => setDeptForm(null)}
                    saving={saving}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {deptForm !== "add" && (
              <button
                onClick={() => setDeptForm("add")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30 transition-all"
              >
                <Plus size={14} /> Add Department
              </button>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── SHIFTS ─────────────────────────────────────────────────── */}
      <SectionCard title="Shifts & Timings" icon={Clock} count={shifts.length}>
        {shiftLoading ? (
          <div className="py-6 flex justify-center">
            <Loader2
              size={18}
              className="animate-spin text-muted-foreground/40"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {shifts.map((s) => (
              <div key={s.id}>
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/30 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock size={13} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {s.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.start_time} – {s.end_time}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() =>
                        setShiftForm(shiftForm === s.id ? null : s.id)
                      }
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteShift(s)}
                      disabled={deleting === s.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {deleting === s.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {shiftForm === s.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-2"
                    >
                      <ShiftForm
                        initial={s}
                        onSave={handleSaveShift}
                        onCancel={() => setShiftForm(null)}
                        saving={saving}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <AnimatePresence>
              {shiftForm === "add" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <ShiftForm
                    onSave={handleSaveShift}
                    onCancel={() => setShiftForm(null)}
                    saving={saving}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {shiftForm !== "add" && (
              <button
                onClick={() => setShiftForm("add")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30 transition-all"
              >
                <Plus size={14} /> Add Shift
              </button>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}