// src/modules/staff/AdminStaff.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  X,
  Eye,
  Trash2,
  Edit3,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Building2,
  Clock,
  DollarSign,
  Calendar,
  Shield,
  ChevronDown,
  AlertCircle,
  Loader2,
  Info,
  Star,
  ToggleLeft,
  ToggleRight,
  ClipboardList,
  Copy,
  RefreshCw,
  UserCheck,
  UserX,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import {
  useStaff,
  useAttendance,
  useDepartments,
  useShifts,
} from "@/hooks/useStaff";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_CONFIG,
  MODULE_PERMISSIONS,
  DEPT_DEFAULT_PERMISSIONS,
  DEPT_FALLBACK,
  type StaffUser,
  type AttendanceStatus,
  type CreateStaffPayload,
  type DepartmentConfig,
  type ShiftConfig,
} from "@/types/staff";
import SettingStaffTab from "./SettingStaffTab";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const initials = (n: string) =>
  n
    .split(" ")
    .map((x) => x[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const avatarGrad = (id: string) => {
  const colors = [
    "from-blue-600 to-cyan-500",
    "from-purple-600 to-pink-500",
    "from-green-600 to-teal-500",
    "from-amber-600 to-orange-500",
    "from-red-600 to-rose-500",
    "from-indigo-600 to-purple-500",
  ];
  return colors[id.charCodeAt(0) % colors.length];
};

const fmtTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

// ─── Badges ───────────────────────────────────────────────────────────────────
function DeptBadge({ dept }: { dept?: DepartmentConfig | null }) {
  if (!dept)
    return <span className="text-[10px] text-muted-foreground">—</span>;
  const fb = DEPT_FALLBACK[dept.name] ?? DEPT_FALLBACK._default;
  const bg = dept.bg || fb.bg;
  const color = dept.color || fb.color;
  const icon = dept.icon || fb.icon;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
        bg,
        color,
      )}
    >
      <span>{icon}</span> {dept.name}
    </span>
  );
}

function ShiftBadge({ shift }: { shift?: ShiftConfig | null }) {
  if (!shift) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-border bg-muted/60 text-muted-foreground">
      <Clock size={9} /> {shift.name} · {shift.start_time}–{shift.end_time}
    </span>
  );
}

function AttBadge({ status }: { status?: string | null }) {
  if (!status)
    return <span className="text-[10px] text-muted-foreground">—</span>;
  const c = ATTENDANCE_CONFIG[status as AttendanceStatus];
  if (!c) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
        c.bg,
        c.text,
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
      initial={{ opacity: 0, y: 10 }}
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
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Permission Picker ────────────────────────────────────────────────────────
function PermissionPicker({
  selected,
  onChange,
  deptName,
}: {
  selected: string[];
  onChange: (perms: string[]) => void;
  deptName?: string;
}) {
  const toggle = (key: string) =>
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    );
  const setDefs = () => {
    if (deptName) onChange(DEPT_DEFAULT_PERMISSIONS[deptName] ?? []);
  };
  const clearAll = () => onChange([]);
  const selectAll = () => onChange(MODULE_PERMISSIONS.map((p) => p.key));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {deptName && (
          <button
            type="button"
            onClick={setDefs}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
          >
            <Star size={10} /> {deptName} defaults
          </button>
        )}
        <button
          type="button"
          onClick={selectAll}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium hover:bg-muted/70 transition-colors"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium hover:bg-muted/70 transition-colors"
        >
          Clear all
        </button>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {selected.length} selected
        </span>
      </div>

      <div
        className="space-y-2 max-h-64 overflow-y-auto pr-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {MODULE_PERMISSIONS.map(({ key, label, description, icon }) => {
          const on = selected.includes(key);
          return (
            <label
              key={key}
              className={clsx(
                "flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all",
                on
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <div
                className={clsx(
                  "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                  on
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30",
                )}
              >
                {on && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <span className="text-xl leading-none">{icon}</span>
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    "text-xs font-medium",
                    on ? "text-primary" : "text-foreground",
                  )}
                >
                  {label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {description}
                </p>
              </div>
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(key)}
                className="hidden"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── Credentials Banner ───────────────────────────────────────────────────────
function CredentialsBanner({
  name,
  email,
  empId,
  tempPwd,
  onDismiss,
}: {
  name: string;
  email: string;
  empId: string;
  tempPwd: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyAll = () => {
    navigator.clipboard.writeText(
      `Email: ${email}\nEmployee ID: ${empId}\nPassword: ${tempPwd}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">
            Staff Account Created!
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-emerald-500 hover:text-emerald-700"
        >
          <X size={13} />
        </button>
      </div>
      <div className="bg-white/60 rounded-lg p-3 space-y-1.5 text-xs">
        {[
          { k: "Name", v: name },
          { k: "Email", v: email },
          { k: "Employee ID", v: empId },
          { k: "Password", v: tempPwd },
        ].map(({ k, v }) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0">{k}:</span>
            <code
              className={clsx(
                "font-mono font-semibold truncate",
                k === "Password"
                  ? "text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded"
                  : "text-foreground",
              )}
            >
              {v}
            </code>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          <Copy size={11} /> {copied ? "Copied!" : "Copy credentials"}
        </button>
        <span className="text-[10px] text-emerald-600 ml-auto">
          📧 Credentials emailed
        </span>
      </div>
    </motion.div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, icon: Users, label: "Personal Info" },
  { n: 2, icon: Briefcase, label: "Job Details" },
  { n: 3, icon: Shield, label: "Permissions" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-5">
      {STEPS.map(({ n, icon: Icon, label }, i) => (
        <div key={n} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                current > n
                  ? "bg-primary text-white"
                  : current === n
                    ? "bg-primary text-white shadow-lg scale-110"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {current > n ? <CheckCircle2 size={14} /> : <Icon size={13} />}
            </div>
            <p
              className={clsx(
                "text-[9px] mt-1 font-medium hidden sm:block whitespace-nowrap",
                current === n ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </p>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={clsx(
                "flex-1 h-px mx-1 mb-4 transition-colors",
                current > n ? "bg-primary" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

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
        {label} {required && <span className="text-red-400">*</span>}
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

// ─── Create Staff Modal ───────────────────────────────────────────────────────
function CreateStaffModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (s: StaffUser, pwd: string, empId: string) => void;
}) {
  const { createStaff } = useStaff();
  const { departments, loading: dLoading } = useDepartments();
  const { shifts, loading: sLoading } = useShifts();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creds, setCreds] = useState<{
    pwd: string;
    empId: string;
    staff: StaffUser;
  } | null>(null);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Pakistan");

  // Step 2
  const [deptId, setDeptId] = useState<number | "">("");
  const [shiftId, setShiftId] = useState<number | "">("");
  const [designation, setDesignation] = useState("");
  const [joinDate, setJoinDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [salary, setSalary] = useState("");

  // Step 3
  const [permissions, setPermissions] = useState<string[]>([]);

  const selectedDept = departments.find((d) => d.id === Number(deptId));
  const selectedShift = shifts.find((s) => s.id === Number(shiftId));

  // Auto-set default permissions when dept changes
  useEffect(() => {
    if (selectedDept)
      setPermissions(DEPT_DEFAULT_PERMISSIONS[selectedDept.name] ?? []);
  }, [deptId]); // eslint-disable-line

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!name.trim()) e.name = "Required";
      if (!email.trim()) e.email = "Required";
      else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    }
    if (s === 2) {
      if (!deptId) e.deptId = "Select a department";
      if (!shiftId) e.shiftId = "Select a shift";
      if (!designation.trim()) e.designation = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate(step)) setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3);
  };
  const back = () => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3);

  const handleSubmit = async () => {
    if (!validate(step)) return;
    setSaving(true);
    const payload: CreateStaffPayload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phone || undefined,
      cnic: cnic || undefined,
      dateOfBirth: dob || undefined,
      address: address || undefined,
      city: city || undefined,
      country: country || undefined,
      department_id: Number(deptId),
      designation: designation.trim(),
      shift_id: Number(shiftId),
      joining_date: joinDate || undefined,
      basic_salary: salary ? parseFloat(salary) : undefined,
      permissions,
    };
    const res = await createStaff(payload);
    setSaving(false);
    if (res.ok && res.data) {
      setCreds({
        staff: res.data.staff,
        pwd: res.data.tempPassword,
        empId: res.data.staff.employeeId ?? "",
      });
    } else {
      toast.error(res.error ?? "Failed to create staff");
    }
  };

  if (creds) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <CredentialsBanner
            name={creds.staff.name}
            email={creds.staff.email}
            empId={creds.empId}
            tempPwd={creds.pwd}
            onDismiss={() => {
              onCreated(creds.staff, creds.pwd, creds.empId);
              onClose();
            }}
          />
          <button
            onClick={() => {
              onCreated(creds.staff, creds.pwd, creds.empId);
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </motion.div>
      </div>
    );
  }

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
        className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col"
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <UserPlus size={15} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                Add New Staff Member
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Credentials will be emailed automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pt-4 shrink-0">
          <StepIndicator current={step} />
        </div>

        {/* Body */}
        <div
          className="overflow-y-auto flex-1 px-5 pb-2"
          style={{ scrollbarWidth: "thin" }}
        >
          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="col-span-2">
                  <Field label="Full Name" required error={errors.name}>
                    <div className="relative">
                      <Users
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        className={clsx(
                          inputCls,
                          "pl-8",
                          errors.name && "border-red-400",
                        )}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Muhammad Ali"
                      />
                    </div>
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Email Address" required error={errors.email}>
                    <div className="relative">
                      <Mail
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="email"
                        className={clsx(
                          inputCls,
                          "pl-8",
                          errors.email && "border-red-400",
                        )}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ali@hotel.com"
                      />
                    </div>
                  </Field>
                </div>
                <Field label="Phone Number">
                  <div className="relative">
                    <Phone
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="tel"
                      className={clsx(inputCls, "pl-8")}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 0000000"
                    />
                  </div>
                </Field>
                <Field label="CNIC">
                  <div className="relative">
                    <CreditCard
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      className={clsx(inputCls, "pl-8")}
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value)}
                      placeholder="35202-XXXXXXX-X"
                    />
                  </div>
                </Field>
                <Field label="Date of Birth">
                  <input
                    type="date"
                    className={inputCls}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </Field>
                <Field label="City">
                  <div className="relative">
                    <MapPin
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      className={clsx(inputCls, "pl-8")}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Lahore"
                    />
                  </div>
                </Field>
                <div className="col-span-2">
                  <Field label="Address">
                    <input
                      className={inputCls}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address"
                    />
                  </Field>
                </div>
                <Field label="Country">
                  <input
                    className={inputCls}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Pakistan"
                  />
                </Field>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="grid grid-cols-2 gap-3"
              >
                <Field label="Department" required error={errors.deptId}>
                  <div className="relative">
                    <Building2
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <select
                      className={clsx(
                        selectCls,
                        "pl-8",
                        errors.deptId && "border-red-400",
                      )}
                      value={deptId}
                      onChange={(e) =>
                        setDeptId(e.target.value ? Number(e.target.value) : "")
                      }
                    >
                      <option value="">— Select Department —</option>
                      {dLoading ? (
                        <option disabled>Loading…</option>
                      ) : (
                        departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.icon} {d.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </Field>

                <Field label="Designation" required error={errors.designation}>
                  <div className="relative">
                    <Briefcase
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      className={clsx(
                        inputCls,
                        "pl-8",
                        errors.designation && "border-red-400",
                      )}
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder={
                        selectedDept
                          ? `${selectedDept.name} Staff`
                          : "e.g. Receptionist"
                      }
                    />
                  </div>
                </Field>

                <Field label="Shift" required error={errors.shiftId}>
                  <div className="relative">
                    <Clock
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <select
                      className={clsx(
                        selectCls,
                        "pl-8",
                        errors.shiftId && "border-red-400",
                      )}
                      value={shiftId}
                      onChange={(e) =>
                        setShiftId(e.target.value ? Number(e.target.value) : "")
                      }
                    >
                      <option value="">— Select Shift —</option>
                      {sLoading ? (
                        <option disabled>Loading…</option>
                      ) : (
                        shifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.start_time}–{s.end_time})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </Field>

                <Field label="Joining Date">
                  <div className="relative">
                    <Calendar
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <input
                      type="date"
                      className={clsx(inputCls, "pl-8")}
                      value={joinDate}
                      onChange={(e) => setJoinDate(e.target.value)}
                    />
                  </div>
                </Field>

                <div className="col-span-2">
                  <Field label="Basic Monthly Salary (PKR)">
                    <div className="relative">
                      <DollarSign
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="number"
                        min="0"
                        className={clsx(inputCls, "pl-8")}
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder="45000"
                      />
                    </div>
                  </Field>
                </div>

                {selectedShift && (
                  <div className="col-span-2 p-3 rounded-xl border border-border bg-muted/30 flex items-center gap-2.5 text-xs">
                    <Clock
                      size={13}
                      className="text-muted-foreground shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-foreground">
                        {selectedShift.name} Shift
                      </p>
                      <p className="text-muted-foreground">
                        {selectedShift.start_time} – {selectedShift.end_time}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-blue-700">
                    Default permissions for{" "}
                    <strong>
                      {selectedDept?.name ?? "selected department"}
                    </strong>{" "}
                    pre-selected. Staff dashboard + attendance is always
                    accessible.
                  </p>
                </div>
                <PermissionPicker
                  selected={permissions}
                  onChange={setPermissions}
                  deptName={selectedDept?.name}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={step === 1 ? onClose : back}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <UserPlus size={14} /> Create Staff
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Attendance Dropdown ──────────────────────────────────────────────────────
function AttendancePicker({
  staff,
  onMark,
}: {
  staff: StaffUser;
  onMark: (
    staffId: number,
    userId: string,
    status: AttendanceStatus,
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    await onMark(staff.staffProfile!.staff_id, staff.id, s);
    setLoading(false);
    setOpen(false);
  };

  const current = staff.staffProfile?.attendance_status;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        <AttBadge status={current} />
        {loading ? (
          <Loader2 size={10} className="animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown size={10} className="text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            className="absolute left-0 top-full mt-1 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden w-36"
          >
            {ATTENDANCE_STATUSES.map((s) => {
              const c = ATTENDANCE_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => handle(s)}
                  className={clsx(
                    "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted/60 transition-colors",
                    current === s && "bg-muted/40",
                  )}
                >
                  <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />{" "}
                  {c.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Attendance Calendar (monthly view) ──────────────────────────────────────
function AttendanceCalendar({
  logs,
}: {
  logs: { date: string; status: AttendanceStatus }[];
}) {
  const [month, setMonth] = useState(() => new Date());

  const year = month.getFullYear();
  const mon = month.getMonth();
  const first = new Date(year, mon, 1).getDay();
  const days = new Date(year, mon + 1, 0).getDate();

  const logMap = useMemo(() => {
    const m: Record<string, AttendanceStatus> = {};
    logs.forEach((l) => {
      const d = l.date.split("T")[0];
      m[d] = l.status;
    });
    return m;
  }, [logs]);

  const prevMonth = () =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const monthLabel = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-3">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft size={14} className="text-muted-foreground" />
        </button>
        <p className="text-xs font-semibold text-foreground">{monthLabel}</p>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronRight size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            className="text-center text-[9px] font-semibold text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells */}
        {Array.from({ length: first }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {/* Day cells */}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const status = logMap[dateStr];
          const isToday = dateStr === today;
          const cfg = status ? ATTENDANCE_CONFIG[status] : null;

          return (
            <div
              key={day}
              className={clsx(
                "aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium transition-all",
                cfg
                  ? clsx(cfg.bg, cfg.text, "border", cfg.border)
                  : isToday
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-muted/50",
              )}
              title={status ?? dateStr}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        {ATTENDANCE_STATUSES.map((s) => {
          const c = ATTENDANCE_CONFIG[s];
          return (
            <div key={s} className="flex items-center gap-1">
              <span
                className={clsx(
                  "w-2.5 h-2.5 rounded",
                  c.bg,
                  "border",
                  c.border,
                )}
              />
              <span className="text-[9px] text-muted-foreground">
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Permission Viewer ────────────────────────────────────────────────────────
function PermissionViewer({
  permissions,
  staffId,
  onSaved,
}: {
  permissions: string[];
  staffId: string;
  onSaved: () => void;
}) {
  const { updateStaff } = useStaff();
  const [editing, setEditing] = useState(false);
  const [perms, setPerms] = useState(permissions);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await updateStaff(staffId, { permissions: perms });
    setSaving(false);
    if (res.ok) {
      toast.success("Permissions updated");
      setEditing(false);
      onSaved();
    } else toast.error(res.error ?? "Failed");
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">
            Edit Permissions
          </p>
          <button
            onClick={() => {
              setEditing(false);
              setPerms(permissions);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
        <PermissionPicker selected={perms} onChange={setPerms} />
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity"
        >
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <CheckCircle2 size={13} /> Save Permissions
            </>
          )}
        </button>
      </div>
    );
  }

  const granted = MODULE_PERMISSIONS.filter((p) => permissions.includes(p.key));
  const denied = MODULE_PERMISSIONS.filter((p) => !permissions.includes(p.key));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {permissions.length} of {MODULE_PERMISSIONS.length} modules granted
        </p>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Edit3 size={11} /> Edit
        </button>
      </div>

      {granted.length === 0 ? (
        <div className="py-8 text-center">
          <Shield size={20} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No module permissions</p>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-primary mt-1 hover:underline"
          >
            Assign now
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Granted Access
          </p>
          {granted.map(({ key, label, icon }) => (
            <div
              key={key}
              className="flex items-center gap-2.5 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg"
            >
              <span>{icon}</span>
              <CheckCircle2 size={11} className="text-primary shrink-0" />
              <span className="text-xs text-foreground">{label}</span>
            </div>
          ))}
          {denied.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-3">
                No Access
              </p>
              {denied.map(({ key, label, icon }) => (
                <div
                  key={key}
                  className="flex items-center gap-2.5 px-3 py-2 bg-muted/30 border border-border rounded-lg opacity-60"
                >
                  <span>{icon}</span>
                  <X size={11} className="text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Staff Detail Side Panel ──────────────────────────────────────────────────
function StaffDetailPanel({
  staff,
  onClose,
  onUpdate,
}: {
  staff: StaffUser;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { updateStaff } = useStaff();
  const { logs, markAttendance, refresh } = useAttendance(
    staff.staffProfile?.staff_id,
  );
  const [editNotes, setEditNotes] = useState(
    staff.staffProfile?.performance_notes ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "info" | "attendance" | "permissions"
  >("info");

  const sp = staff.staffProfile;

  const saveNotes = async () => {
    setSaving(true);
    const res = await updateStaff(staff.id, { performance_notes: editNotes });
    setSaving(false);
    if (res.ok) {
      toast.success("Notes saved");
      onUpdate();
    } else toast.error(res.error ?? "Failed");
  };

  const attSummary = useMemo(
    () => ({
      present: logs.filter((l) => l.status === "Present").length,
      absent: logs.filter((l) => l.status === "Absent").length,
      halfDay: logs.filter((l) => l.status === "HalfDay").length,
      leave: logs.filter((l) => l.status === "Leave").length,
    }),
    [logs],
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-screen w-full max-w-md bg-background border-l border-border shadow-2xl z-[200] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <p className="font-semibold text-foreground text-sm">Staff Details</p>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-muted transition-colors"
        >
          <X size={15} className="text-muted-foreground" />
        </button>
      </div>

      {/* Profile header */}
      <div className="px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-start gap-4">
          <div
            className={clsx(
              "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br shrink-0",
              avatarGrad(staff.id),
            )}
          >
            {initials(staff.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {staff.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {sp?.designation} · {staff.employeeId ?? "—"}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {sp?.department && <DeptBadge dept={sp.department} />}
              {sp?.shift && <ShiftBadge shift={sp.shift} />}
              {sp?.is_on_duty ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
                  On Duty
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Off Duty
                </span>
              )}
              {!staff.isActive && (
                <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-border shrink-0">
        {(["info", "attendance", "permissions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={clsx(
              "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
              activeTab === t
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        className="flex-1 overflow-y-auto px-5 py-4"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* INFO */}
        {activeTab === "info" && (
          <div className="space-y-4">
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Contact
              </p>
              <div className="space-y-1.5">
                {[
                  { icon: Mail, label: "Email", value: staff.email },
                  { icon: Phone, label: "Phone", value: staff.phoneNumber },
                  { icon: CreditCard, label: "CNIC", value: staff.cnic },
                  { icon: MapPin, label: "City", value: staff.city },
                  {
                    icon: Calendar,
                    label: "Date of Birth",
                    value: staff.dateOfBirth ? fmt(staff.dateOfBirth) : null,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 p-2.5 bg-muted/40 rounded-xl"
                  >
                    <Icon
                      size={13}
                      className="text-muted-foreground shrink-0"
                    />
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        {label}
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {value ?? "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Employment
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Joining Date",
                    value: sp?.joining_date ? fmt(sp.joining_date) : "—",
                  },
                  {
                    label: "Shift",
                    value: sp?.shift
                      ? `${sp.shift.name} (${sp.shift.start_time}–${sp.shift.end_time})`
                      : "—",
                  },
                  {
                    label: "Monthly Salary",
                    value: sp?.basic_salary
                      ? `PKR ${Number(sp.basic_salary).toLocaleString()}`
                      : "—",
                  },
                  {
                    label: "Last Login",
                    value: staff.lastLogin ? fmt(staff.lastLogin) : "Never",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-xl p-2.5">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Performance Notes
              </p>
              <textarea
                rows={4}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add performance notes…"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 resize-none transition-all"
              />
              <button
                onClick={saveNotes}
                disabled={saving}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-60 transition-colors"
              >
                {saving ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={11} />
                )}
                {saving ? "Saving…" : "Save notes"}
              </button>
            </section>
          </div>
        )}

        {/* ATTENDANCE */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            {/* Summary chips */}
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: "Present",
                  value: attSummary.present,
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
                {
                  label: "Absent",
                  value: attSummary.absent,
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
                {
                  label: "Half Day",
                  value: attSummary.halfDay,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  label: "Leave",
                  value: attSummary.leave,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
              ].map(({ label, value, color, bg }) => (
                <div
                  key={label}
                  className={clsx("rounded-xl p-2 text-center", bg)}
                >
                  <p className={clsx("text-lg font-bold", color)}>{value}</p>
                  <p className="text-[9px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Calendar */}
            <AttendanceCalendar logs={logs} />

            {/* Recent list */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Recent Records · {logs.length} total
              </p>
              <div
                className="space-y-1.5 max-h-52 overflow-y-auto"
                style={{ scrollbarWidth: "thin" }}
              >
                {logs.length === 0 ? (
                  <div className="py-6 text-center">
                    <ClipboardList
                      size={18}
                      className="mx-auto text-muted-foreground/30 mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      No attendance records
                    </p>
                  </div>
                ) : (
                  logs.map((log) => {
                    const c = ATTENDANCE_CONFIG[log.status];
                    return (
                      <div
                        key={log.id}
                        className={clsx(
                          "flex items-center justify-between p-2.5 rounded-xl",
                          c.bg,
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx("w-1.5 h-1.5 rounded-full", c.dot)}
                          />
                          <p className="text-xs font-medium text-foreground">
                            {new Date(log.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {fmtTime(log.check_in) && (
                            <span>In: {fmtTime(log.check_in)}</span>
                          )}
                          {fmtTime(log.check_out) && (
                            <span>Out: {fmtTime(log.check_out)}</span>
                          )}
                          {log.hours && (
                            <span className="font-medium text-foreground">
                              {log.hours}h
                            </span>
                          )}
                          <AttBadge status={log.status} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* PERMISSIONS */}
        {activeTab === "permissions" && (
          <PermissionViewer
            permissions={staff.permissions}
            staffId={staff.id}
            onSaved={onUpdate}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── Main AdminStaff Page ─────────────────────────────────────────────────────
export default function Staff() {
  const {
    staff,
    loading,
    error,
    refresh,
    updateStaff,
    toggleDuty,
    deactivateStaff,
    activateStaff,
  } = useStaff();
  const { markAttendance } = useAttendance();
  const { departments } = useDepartments();
  const { shifts } = useShifts();

  const [activeTab, setActiveTab] = useState<"staff" | "settings">("staff");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<number | "">("");
  const [shiftFilter, setShiftFilter] = useState<number | "">("");
  const [attFilter, setAttFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewStaff, setViewStaff] = useState<StaffUser | null>(null);

  const stats = useMemo(
    () => ({
      total: staff.length,
      onDuty: staff.filter((s) => s.staffProfile?.is_on_duty).length,
      present: staff.filter(
        (s) => s.staffProfile?.attendance_status === "Present",
      ).length,
      absent: staff.filter(
        (s) => s.staffProfile?.attendance_status === "Absent",
      ).length,
      inactive: staff.filter((s) => !s.isActive).length,
    }),
    [staff],
  );

  // Filter — compare dept/shift by ID
  const filtered = useMemo(
    () =>
      staff.filter((s) => {
        const q = search.toLowerCase();
        const sp = s.staffProfile;
        return (
          (!q ||
            s.name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            (s.employeeId ?? "").toLowerCase().includes(q) ||
            (sp?.designation ?? "").toLowerCase().includes(q)) &&
          (!deptFilter || sp?.department_id === Number(deptFilter)) &&
          (!shiftFilter || sp?.shift_id === Number(shiftFilter)) &&
          (!attFilter || sp?.attendance_status === attFilter)
        );
      }),
    [staff, search, deptFilter, shiftFilter, attFilter],
  );

  const handleAttendance = async (
    staffId: number,
    userId: string,
    status: AttendanceStatus,
  ) => {
    const res = await markAttendance(staffId, userId, status);
    if (res.ok) {
      toast.success(`Marked ${status}`);
      refresh();
    } else toast.error(res.error ?? "Failed");
  };

  const handleToggleDuty = async (s: StaffUser) => {
    const next = !s.staffProfile?.is_on_duty;
    const res = await toggleDuty(s.id, next);
    if (res.ok)
      toast.success(
        next ? `${s.name} is now on duty` : `${s.name} is off duty`,
      );
    else toast.error(res.error ?? "Failed");
  };

  const handleDeactivate = async (s: StaffUser) => {
    if (!confirm(`Deactivate ${s.name}? They will lose system access.`)) return;
    const res = await deactivateStaff(s.id);
    if (res.ok) toast.success("Staff deactivated");
    else toast.error(res.error ?? "Failed");
  };

  const handleActivate = async (s: StaffUser) => {
    if (!confirm(`Activate ${s.name}?`)) return;

    const res = await activateStaff(s.id);

    if (res.ok) {
      toast.success("Staff activated");
    } else {
      toast.error(res.error ?? "Failed");
    }
  };
  const clearFilters = () => {
    setSearch("");
    setDeptFilter("");
    setShiftFilter("");
    setAttFilter("");
  };
  const hasFilters = !!(search || deptFilter || shiftFilter || attFilter);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Staff Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage employees, shifts, attendance and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <UserPlus size={15} />{" "}
            <span className="hidden sm:inline">Add Staff</span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border flex gap-1">
        {[
          { key: "staff", label: "All Staff", icon: Users },
          { key: "settings", label: "Settings", icon: Settings },
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
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "staff" && (
          <motion.div
            key="staff-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard
                label="Total Staff"
                value={stats.total}
                icon={Users}
                color="bg-primary"
              />
              <StatCard
                label="On Duty Now"
                value={stats.onDuty}
                icon={UserCheck}
                color="bg-green-600"
                sub="Currently working"
              />
              <StatCard
                label="Present Today"
                value={stats.present}
                icon={CheckCircle2}
                color="bg-teal-600"
              />
              <StatCard
                label="Absent Today"
                value={stats.absent}
                icon={UserX}
                color="bg-red-500"
              />
              <StatCard
                label="Inactive"
                value={stats.inactive}
                icon={AlertCircle}
                color="bg-gray-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, ID, role…"
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <X
                      size={12}
                      className="text-muted-foreground hover:text-foreground"
                    />
                  </button>
                )}
              </div>

              <select
                value={deptFilter}
                onChange={(e) =>
                  setDeptFilter(e.target.value ? Number(e.target.value) : "")
                }
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.icon} {d.name}
                  </option>
                ))}
              </select>

              <select
                value={shiftFilter}
                onChange={(e) =>
                  setShiftFilter(e.target.value ? Number(e.target.value) : "")
                }
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="">All Shifts</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={attFilter}
                onChange={(e) => setAttFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="">All Attendance</option>
                {ATTENDANCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ATTENDANCE_CONFIG[s].label}
                  </option>
                ))}
              </select>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-2.5"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {/* Table */}
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <Loader2
                    size={22}
                    className="animate-spin text-muted-foreground/40"
                  />
                  <p className="text-sm text-muted-foreground">
                    Loading staff…
                  </p>
                </div>
              ) : error ? (
                <div className="py-20 text-center">
                  <AlertCircle
                    size={22}
                    className="mx-auto text-red-400 mb-2"
                  />
                  <p className="text-sm text-red-500">{error}</p>
                  <button
                    onClick={refresh}
                    className="text-xs text-primary mt-2 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm overflow-y-auto">
                    <thead className="border-b border-border bg-muted/40">
                      <tr>
                        {[
                          "Staff Member",
                          "Department / Role",
                          "Shift",
                          "Salary",
                          "Attendance",
                          "Status",
                          "On Duty",
                          "Joined",
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
                          <td colSpan={8} className="py-16 text-center">
                            <Users
                              size={28}
                              className="mx-auto mb-2.5 text-muted-foreground/20"
                            />
                            <p className="text-sm text-muted-foreground">
                              {hasFilters
                                ? "No staff match your filters"
                                : "No staff members yet"}
                            </p>
                            {hasFilters && (
                              <button
                                onClick={clearFilters}
                                className="text-xs text-primary mt-1.5 hover:underline"
                              >
                                Clear filters
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filtered.map((s, i) => {
                          const sp = s.staffProfile;
                          return (
                            <motion.tr
                              key={s.id}
                              initial={{ opacity: 0, y: 3 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className={clsx(
                                "border-t border-border hover:bg-muted/20 transition-colors cursor-default",
                                !s.isActive && "opacity-50",
                              )}
                            >
                              {/* Staff */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={clsx(
                                      "w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br",
                                      avatarGrad(s.id),
                                    )}
                                  >
                                    {initials(s.name)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                                        {s.name}
                                      </p>
                                      {!s.isActive && (
                                        <span className="text-[9px] text-red-600 bg-red-50 px-1 py-0.5 rounded">
                                          Inactive
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                                      {s.email}
                                    </p>
                                    <p className="text-[9px] font-mono text-muted-foreground/60">
                                      {s.employeeId}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Dept */}
                              <td className="px-4 py-3.5">
                                <div className="space-y-1">
                                  <DeptBadge dept={sp?.department} />
                                  <p className="text-[10px] text-muted-foreground">
                                    {sp?.designation ?? "—"}
                                  </p>
                                </div>
                              </td>

                              {/* Shift */}
                              <td className="px-4 py-3.5 w-full">
                                <ShiftBadge shift={sp?.shift} />
                              </td>

                              {/* Salary */}
                              <td className="px-4 py-3.5">
                                <p className="text-xs font-medium text-foreground">
                                  {sp?.basic_salary
                                    ? `PKR ${Number(sp.basic_salary).toLocaleString()}`
                                    : "—"}
                                </p>
                                {sp?.basic_salary && (
                                  <p className="text-[9px] text-muted-foreground">
                                    / month
                                  </p>
                                )}
                              </td>

                              {/* Attendance */}
                              <td className="px-4 py-3.5">
                                {sp ? (
                                  <AttendancePicker
                                    staff={s}
                                    onMark={handleAttendance}
                                  />
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </td>
                              <td>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    s.isActive
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {s.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>

                              {/* On Duty Toggle */}
                              <td className="px-4 py-3.5">
                                <button
                                  onClick={() => handleToggleDuty(s)}
                                  className="transition-opacity hover:opacity-70"
                                >
                                  {sp?.is_on_duty ? (
                                    <ToggleRight
                                      size={22}
                                      className="text-green-500"
                                    />
                                  ) : (
                                    <ToggleLeft
                                      size={22}
                                      className="text-muted-foreground/40"
                                    />
                                  )}
                                </button>
                              </td>

                              {/* Joined */}
                              <td className="px-4 py-3.5">
                                <p className="text-[10px] text-muted-foreground">
                                  {sp?.joining_date
                                    ? fmt(sp.joining_date)
                                    : "—"}
                                </p>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setViewStaff(s)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    title="View details"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  {s.isActive ? (
                                    <button
                                      onClick={() => handleDeactivate(s)}
                                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                      title="Deactivate"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleActivate(s)}
                                      className="p-1.5 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                                      title="Activate"
                                    >
                                      <RefreshCw size={13} />
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

              {!loading && !error && filtered.length > 0 && (
                <div className="px-4 py-3 border-t border-border bg-muted/10 flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    Showing{" "}
                    <strong className="text-foreground">
                      {filtered.length}
                    </strong>{" "}
                    of {staff.length} staff
                  </span>
                  <span>
                    {stats.onDuty} on duty · {stats.present} present today
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            key="settings-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SettingStaffTab />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateStaffModal
            onClose={() => setShowCreate(false)}
            onCreated={(s, pwd, empId) => {
              toast.success(`${s.name} added successfully`);
              refresh();
            }}
          />
        )}
      </AnimatePresence>

      {/* Detail Side Panel */}
      <AnimatePresence>
        {viewStaff && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[190]"
              onClick={() => setViewStaff(null)}
            />
            <StaffDetailPanel
              staff={viewStaff}
              onClose={() => setViewStaff(null)}
              onUpdate={() => {
                refresh();
                setViewStaff((p) => (p ? { ...p } : null));
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
