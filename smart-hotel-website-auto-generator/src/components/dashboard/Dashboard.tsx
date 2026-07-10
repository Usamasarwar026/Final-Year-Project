"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  Lock,
  LogIn,
  BedDouble,
  CalendarCheck,
  UserRound,
  Users,
  CreditCard,
  Brush,
  ChefHat,
  Package,
  BarChart3,
  Info,
  ChevronRight,
  CheckCircle2,
  Circle,
  Check,
  ArrowRight,
  Zap,
  Layers,
  Crown,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import clsx from "clsx";
import api from "@/lib/axios";
import type { ModuleId } from "@/lib/generator/moduleFiles";
import {
  resolveDependencies,
  getDependencyDescription,
  getLockedModules,
  getDependentModules,
} from "@/lib/generator/moduleDependencies";
import Navbar from "../navbar/Navbar";

// ─── Types ────────────────────────────────────────────────────
type TierId = "basic" | "intermediate" | "advanced";
type Step = 1 | 2 | 3 | 4;

// ─── Tier Presets (Available modules in each tier - including authentication) ─────
const TIER_AVAILABLE_MODULES: Record<TierId, ModuleId[]> = {
  // Basic: Authentication + core modules
  basic: ["authentication", "rooms", "booking", "customer"],

  // Intermediate: Authentication + extended modules
  intermediate: [
    "authentication",
    "rooms",
    "booking",
    "customer",
    "staff",
    "billing",
    "housekeeping",
  ],

  // Advanced: Authentication + full suite
  advanced: [
    "authentication",
    "rooms",
    "booking",
    "customer",
    "staff",
    "billing",
    "housekeeping",
    "kitchen",
    "inventory",
    "reports",
  ],
};

// Which modules are required (cannot be deselected)
const REQUIRED_MODULES: Set<ModuleId> = new Set(["authentication"]);

// Tier configurations
const TIERS: {
  id: TierId;
  label: string;
  tagline: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
  schemaType: "simple" | "standard" | "full";
}[] = [
  {
    id: "basic",
    label: "Basic",
    tagline: "Core Modules",
    icon: Zap,
    description:
      "Core hotel operations — authentication, rooms, bookings & guest management.",
    schemaType: "simple",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    tagline: "+ Staff & Operations",
    icon: Layers,
    badge: "Popular",
    description: "Basic + staff management, billing & housekeeping workflow.",
    schemaType: "standard",
  },
  {
    id: "advanced",
    label: "Advanced",
    tagline: "Full Suite",
    icon: Crown,
    description:
      "Full suite — kitchen, inventory & analytics reports included.",
    schemaType: "full",
  },
];

// ─── Module Meta ──────────────────────────────────────────────
const MODULE_META: Record<
  ModuleId,
  {
    label: string;
    icon: React.ElementType;
    description: string;
    available: boolean;
  }
> = {
  authentication: {
    label: "Authentication",
    icon: LogIn,
    description: "Login, signup, password reset (Required)",
    available: true,
  },
  rooms: {
    label: "Rooms",
    icon: BedDouble,
    description: "Room listing, photos, management",
    available: true,
  },
  booking: {
    label: "Booking",
    icon: CalendarCheck,
    description: "Reservations, check-in / check-out",
    available: true,
  },
  customer: {
    label: "Customer",
    icon: UserRound,
    description: "Guest profiles & self-service portal",
    available: true,
  },
  staff: {
    label: "Staff",
    icon: Users,
    description: "Staff management & attendance",
    available: true,
  },
  billing: {
    label: "Billing",
    icon: CreditCard,
    description: "Invoices & payment tracking",
    available: true,
  },
  housekeeping: {
    label: "Housekeeping",
    icon: Brush,
    description: "Tasks, laundry & service requests",
    available: true,
  },
  kitchen: {
    label: "Kitchen",
    icon: ChefHat,
    description: "Food orders & menu management",
    available: true,
  },
  inventory: {
    label: "Inventory",
    icon: Package,
    description: "Stock, vendors & purchase orders",
    available: true,
  },
  reports: {
    label: "Reports",
    icon: BarChart3,
    description: "Analytics & scheduled reports",
    available: true,
  },
};

// ─── Progress Steps ───────────────────────────────────────────
const STEP_LABELS = ["Choose Tier", "Modules", "Project Name", "Generate"];

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="max-w-lg mx-auto mb-8">
      <div className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const s = (i + 1) as Step;
          const done = step > s;
          const active = step === s;
          const last = i === STEP_LABELS.length - 1;
          return (
            <div
              key={label}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                    done
                      ? "bg-gradient-brand border-transparent text-white"
                      : active
                        ? "border-primary text-primary bg-transparent"
                        : "border-border text-muted-foreground bg-transparent",
                  )}
                >
                  {done ? <Check size={14} /> : s}
                </div>
                <span
                  className={clsx(
                    "text-[10px] font-medium whitespace-nowrap hidden sm:block",
                    active
                      ? "text-primary"
                      : done
                        ? "text-foreground/70"
                        : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {!last && (
                <div className="flex-1 h-px mx-2 mb-5 bg-border">
                  <div
                    className="h-full bg-gradient-brand transition-all duration-500"
                    style={{ width: done ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── STEP 1: Tier Selection ────────────────────────────────────
function StepTier({ onSelect }: { onSelect: (t: TierId) => void }) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.22 }}
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Choose Your Tier</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a tier based on your hotel size and requirements
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs">
          <Check size={12} />
          <span>Authentication is included in all tiers</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {TIERS.map((tier, i) => {
          const Icon = tier.icon;
          const availableModules = TIER_AVAILABLE_MODULES[tier.id];
          const moduleCount = availableModules.length;

          return (
            <motion.button
              key={tier.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onSelect(tier.id)}
              className={clsx(
                "relative group text-left p-4 rounded-xl border border-border",
                "bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5",
                "transition-all duration-200 cursor-pointer",
              )}
            >
              {tier.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-brand text-white text-[10px] font-bold uppercase tracking-wider">
                  {tier.badge}
                </span>
              )}

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    {tier.label}
                  </h3>
                  <p className="text-xs text-primary font-semibold">
                    {tier.tagline}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {tier.description}
              </p>

              <div className="space-y-1.5 mb-3">
                <p className="text-[10px] text-muted-foreground font-semibold mb-1">
                  Includes:
                </p>
                {availableModules.map((m) => {
                  const meta = MODULE_META[m];
                  const MIcon = meta.icon;
                  return (
                    <div key={m} className="flex items-center gap-2">
                      <MIcon
                        size={11}
                        className={
                          m === "authentication"
                            ? "text-green-500"
                            : "text-primary"
                        }
                      />
                      <span className="text-[11px] text-foreground/80">
                        {meta.label}
                        {m === "authentication" && (
                          <span className="ml-1 text-[9px] text-green-500">
                            (Required)
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  {moduleCount} modules total
                </span>
                <ArrowRight
                  size={14}
                  className="text-primary transition-transform duration-200 group-hover:translate-x-1"
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── STEP 2: Module Customization ─────────
function StepModules({
  availableModules,
  selected,
  onToggle,
  onToggleAll,
  onBack,
  onNext,
}: {
  availableModules: ModuleId[];
  selected: ModuleId[];
  onToggle: (id: ModuleId, isAdding: boolean) => void;
  onToggleAll: (selectAll: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  // Get modules that are locked (dependencies of selected modules)
  const lockedModules = getLockedModules(selected);

  // All modules to display (from availableModules)
  const allDisplayModules = availableModules.map((id) => ({
    id,
    isRequired: REQUIRED_MODULES.has(id),
  }));

  const allSelected = allDisplayModules.every(
    ({ id, isRequired }) => isRequired || selected.includes(id),
  );

  const handleToggle = (moduleId: ModuleId, isRequired: boolean) => {
    if (isRequired) {
      toast.info("Authentication is required and cannot be removed");
      return;
    }

    const isSelected = selected.includes(moduleId);

    if (!isSelected && lockedModules.has(moduleId)) {
      toast.info(
        `${MODULE_META[moduleId]?.label} is already locked as a dependency`,
      );
      return;
    }

    onToggle(moduleId, !isSelected);
  };

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.22 }}
      className="max-w-2xl mx-auto relative"
    >
      <button
        onClick={onBack}
        aria-label="Go back"
        className="absolute -top-1 left-0 flex items-center justify-center w-10 h-8 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
      >
        <ArrowLeft size={16} />
      </button>
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-foreground">Select Modules</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which modules to include in your project
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs">
          <Info size={12} />
          <span>Selecting a module may automatically add dependencies</span>
        </div>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-gradient-brand/5 border border-primary/20">
        <p className="text-xs font-medium text-foreground"> How it works:</p>
        <ul className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
          <li>• Required modules (Authentication) are always selected</li>
          <li>• Click on any module to select/deselect it</li>
          <li>• Locked modules are dependencies and cannot be removed</li>
          <li>
            • When you deselect a module, its locked dependencies will also be
            removed
          </li>
        </ul>
      </div>
      <button
        type="button"
        onClick={() => onToggleAll(!allSelected)}
        className="flex items-center gap-2 mb-3 px-1 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
      >
        {allSelected ? (
          <CheckCircle2 size={14} className="text-primary" />
        ) : (
          <Circle size={14} className="text-muted-foreground/40" />
        )}
        {allSelected ? "Deselect All" : "Select All Modules"}
      </button>

      <div className="grid sm:grid-cols-2 gap-2.5 mb-4">
        {allDisplayModules.map(({ id, isRequired }) => {
          const meta = MODULE_META[id];
          if (!meta) return null;

          const Icon = meta.icon;
          const isSelected = selected.includes(id) || isRequired;
          const isLocked = lockedModules.has(id) && !isRequired;
          const depDesc = getDependencyDescription(id);
          const dependents = getDependentModules(id, selected);

          let lockReason = "";
          if (isLocked && dependents.length > 0) {
            lockReason = `Required by: ${dependents.map((d) => MODULE_META[d]?.label).join(", ")}`;
          }

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleToggle(id, isRequired)}
              className={clsx(
                "text-left p-3 rounded-lg border transition-all duration-150 relative",
                isRequired
                  ? "bg-gradient-brand/10 border-primary/40 cursor-default"
                  : isLocked && !isSelected
                    ? "opacity-50 cursor-not-allowed bg-muted/30 border-border"
                    : isSelected
                      ? "bg-gradient-brand/5 border-primary/40 shadow-sm hover:border-primary/60"
                      : "bg-card border-border hover:border-primary/30",
              )}
            >
              {(isLocked || isRequired) && isSelected && (
                <div className="absolute top-2 right-2">
                  <Lock size={12} className="text-muted-foreground" />
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {isSelected ? (
                    <CheckCircle2
                      size={14}
                      className={isRequired ? "text-green-500" : "text-primary"}
                    />
                  ) : (
                    <Circle size={14} className="text-muted-foreground/25" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                    <Icon
                      size={12}
                      className={
                        isSelected
                          ? isRequired
                            ? "text-green-500"
                            : "text-primary"
                          : "text-muted-foreground"
                      }
                    />
                    <span
                      className={clsx(
                        "text-sm font-semibold",
                        isSelected ? "text-foreground" : "text-foreground/60",
                      )}
                    >
                      {meta.label}
                    </span>
                    {isRequired && (
                      <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">
                        Required
                      </span>
                    )}
                    {isLocked && !isRequired && (
                      <span className="text-[9px] bg-orange-500/20 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {meta.description}
                  </p>
                  {depDesc && !isSelected && !isLocked && !isRequired && (
                    <p className="flex items-center gap-1 text-[10px] text-muted-foreground/60 mt-0.5">
                      <Info size={9} />
                      {depDesc}
                    </p>
                  )}
                  {lockReason && (
                    <p className="flex items-center gap-1 text-[10px] text-orange-500/70 mt-0.5">
                      <Lock size={9} />
                      {lockReason}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-3 rounded-lg bg-gradient-brand/5 border border-primary/20 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">
              {selected.length} module{selected.length !== 1 ? "s" : ""}{" "}
              selected
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Authentication is always included
            </p>
          </div>
          <div className="flex items-center gap-1">
            {selected.slice(0, 3).map((m) => {
              const MIcon = MODULE_META[m]?.icon;
              if (!MIcon) return null;
              return (
                <div
                  key={m}
                  className="w-6 h-6 rounded-lg bg-gradient-brand/10 border border-primary/20 flex items-center justify-center"
                >
                  <MIcon size={11} className="text-primary" />
                </div>
              );
            })}
            {selected.length > 3 && (
              <div className="w-6 h-6 rounded-lg bg-gradient-brand/10 border border-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary">
                +{selected.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Continue <ChevronRight size={15} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── STEP 3: Project Name + Admin Details ─────────────────────

function StepName({
  initialName,
  initialAdminName,
  initialAdminEmail,
  initialAdminPassword,
  serverNameError,
  onClearServerNameError,
  onBack,
  onNext,
}: {
  initialName: string;
  initialAdminName: string;
  initialAdminEmail: string;
  initialAdminPassword: string;
  serverNameError?: string;
  onClearServerNameError?: () => void;
  onBack: () => void;
  onNext: (data: {
    name: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [adminName, setAdminName] = useState(initialAdminName);
  const [adminEmail, setAdminEmail] = useState(initialAdminEmail);
  const [adminPassword, setAdminPassword] = useState(initialAdminPassword);

  // 🆕 Per-field errors instead of one generic string
  const [errors, setErrors] = useState<{
    name?: string;
    adminName?: string;
    adminEmail?: string;
    adminPassword?: string;
  }>({});

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const handleNext = () => {
    const t = name.trim();
    const an = adminName.trim();
    const ae = adminEmail.trim();
    const ap = adminPassword.trim();

    const newErrors: typeof errors = {};

    if (!t) {
      newErrors.name = "Please enter a project name";
    } else if (t.length < 3) {
      newErrors.name = "Project name must be at least 3 characters";
    }

    if (!an) {
      newErrors.adminName = "Please enter admin name";
    }

    if (!ae) {
      newErrors.adminEmail = "Please enter admin email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ae)) {
      newErrors.adminEmail = "Invalid email format";
    }

    if (!ap) {
      newErrors.adminPassword = "Please enter admin password";
    } else if (ap.length < 6) {
      newErrors.adminPassword = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onNext({ name: t, adminName: an, adminEmail: ae, adminPassword: ap });
  };

  // Server se aaya duplicate-name error priority pe dikhega jab tak user name change na kare
  const nameErrorToShow = serverNameError || errors.name;

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.22 }}
      className="max-w-md mx-auto relative"
    >
      <button
        onClick={onBack}
        aria-label="Go back"
        className="absolute -top-1 left-0 flex items-center justify-center w-10 h-8 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
      >
        <ArrowLeft size={16} />
      </button>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Project & Admin Setup
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter project name and admin credentials (used for seeding)
        </p>
      </div>

      <div className="space-y-3 mb-5">
        {/* Project Name */}
        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Hotel / Website Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
              onClearServerNameError?.();
            }}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            placeholder="e.g. Grand Palace Hotel"
            className={clsx(
              "w-full px-4 py-2.5 rounded-lg border-2 bg-card text-foreground text-base outline-none transition-colors placeholder:text-muted-foreground/40",
              nameErrorToShow
                ? "border-destructive"
                : "border-border focus:border-primary/60",
            )}
          />
          {nameErrorToShow && (
            <p className="flex items-center gap-1 text-xs text-destructive mt-1">
              <AlertCircle size={12} />
              {nameErrorToShow}
            </p>
          )}
          {slug && !nameErrorToShow && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Folder:{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">
                {slug}/
              </code>
            </p>
          )}
        </div>

        {/* Admin Name */}
        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Admin Name
          </label>
          <input
            value={adminName}
            onChange={(e) => {
              setAdminName(e.target.value);
              setErrors((prev) => ({ ...prev, adminName: undefined }));
            }}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            placeholder="e.g. John Doe"
            className={clsx(
              "w-full px-4 py-2.5 rounded-lg border-2 bg-card text-foreground text-base outline-none transition-colors placeholder:text-muted-foreground/40",
              errors.adminName
                ? "border-destructive"
                : "border-border focus:border-primary/60",
            )}
          />
          {errors.adminName && (
            <p className="flex items-center gap-1 text-xs text-destructive mt-1">
              <AlertCircle size={12} />
              {errors.adminName}
            </p>
          )}
        </div>

        {/* Admin Email */}
        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Admin Email
          </label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => {
              setAdminEmail(e.target.value);
              setErrors((prev) => ({ ...prev, adminEmail: undefined }));
            }}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            placeholder="admin@hotel.com"
            className={clsx(
              "w-full px-4 py-2.5 rounded-lg border-2 bg-card text-foreground text-base outline-none transition-colors placeholder:text-muted-foreground/40",
              errors.adminEmail
                ? "border-destructive"
                : "border-border focus:border-primary/60",
            )}
          />
          {errors.adminEmail && (
            <p className="flex items-center gap-1 text-xs text-destructive mt-1">
              <AlertCircle size={12} />
              {errors.adminEmail}
            </p>
          )}
        </div>

        {/* Admin Password */}
        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Admin Password
          </label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => {
              setAdminPassword(e.target.value);
              setErrors((prev) => ({ ...prev, adminPassword: undefined }));
            }}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            placeholder="Minimum 6 characters"
            className={clsx(
              "w-full px-4 py-2.5 rounded-lg border-2 bg-card text-foreground text-base outline-none transition-colors placeholder:text-muted-foreground/40",
              errors.adminPassword
                ? "border-destructive"
                : "border-border focus:border-primary/60",
            )}
          />
          {errors.adminPassword && (
            <p className="flex items-center gap-1 text-xs text-destructive mt-1">
              <AlertCircle size={12} />
              {errors.adminPassword}
            </p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-gradient-brand/5 border border-primary/20 mb-5 space-y-1.5">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">
          This name & credentials will be used for
        </p>
        {[
          "ZIP folder name & project directory",
          "package.json → name field",
          "Browser tab title & meta tags",
          "Admin account in seed file (npm run seed)",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 text-xs text-foreground/70"
          >
            <Check size={10} className="text-primary shrink-0" />
            {item}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Continue <ChevronRight size={15} />
        </button>
      </div>
    </motion.div>
  );
}
// ─── STEP 4: Review + Generate ────────────────────────────────
function StepGenerate({
  websiteName,
  adminName,
  adminEmail,
  // adminPassword,
  selectedModules,
  selectedTier,
  onBack,
  onGenerate,
  generating,
}: {
  websiteName: string;
  adminName: string;
  adminEmail: string;
  // adminPassword: string;
  selectedModules: ModuleId[];
  selectedTier: TierId;
  onBack: () => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  const tier = TIERS.find((t) => t.id === selectedTier)!;
  const TierIcon = tier.icon;

  // Final modules - authentication is already included in selectedModules
  const allModules = resolveDependencies(selectedModules);
  const slug = websiteName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.22 }}
      className="max-w-lg mx-auto relative"
    >
      <button
        onClick={onBack}
        disabled={generating}
        aria-label="Go back"
        className="absolute -top-1 left-0 flex items-center justify-center w-10 h-8 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
      >
        <ArrowLeft size={16} />
      </button>
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-foreground">Review & Generate</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Everything looks good? Hit generate to download your project.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-gradient-brand/5 border border-primary/20 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-primary/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
              Project
            </p>
            <p className="text-base font-bold text-foreground">{websiteName}</p>
            <div>
              <p className="text-[10px] text-muted-foreground">Admin</p>
              <p className="text-sm font-semibold">
                {adminName} ({adminEmail})
              </p>
            </div>
            <code className="text-[10px] text-primary font-mono">
              {slug}.zip
            </code>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-brand/10 border border-primary/20 text-primary">
            <TierIcon size={14} />
            <span className="text-xs font-bold">{tier.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: "Framework", value: "Next.js 16 + TS" },
            { label: "Auth", value: "NextAuth.js" },
            { label: "Schema Type", value: tier.schemaType },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-background border border-border rounded-lg px-2 py-1.5"
            >
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                {label}
              </p>
              <p className="text-[11px] font-semibold text-foreground mt-0.5">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
            Modules ({allModules.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allModules.map((m) => {
              const MIcon = MODULE_META[m]?.icon;
              if (!MIcon) return null;
              return (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-brand/10 border border-primary/20 text-primary font-medium"
                >
                  <MIcon size={9} />
                  {MODULE_META[m]?.label}
                  {m === "authentication" && (
                    <span className="text-[8px] text-green-500 ml-0.5">✓</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-brand text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        >
          {generating ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Download size={15} /> Generate & Download
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const [step, setStep] = useState<Step>(1);
  const [tier, setTier] = useState<TierId | null>(null);
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>([]);
  const [explicitModules, setExplicitModules] = useState<ModuleId[]>([]);
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [nameError, setNameError] = useState("");

  const handleTierSelect = (t: TierId) => {
    setTier(t);
    // Get available modules for this tier
    const availableModules = TIER_AVAILABLE_MODULES[t];
    // Authentication is always selected by default (as it's required)
    // But we don't add it to selectedModules array? Actually we do, but it will be required
    setSelectedModules(availableModules.filter((m) => m === "authentication"));
    setExplicitModules([]);
    setStep(2);
  };
  const handleToggleAll = (selectAll: boolean) => {
    if (!tier) return;
    const availableModules = TIER_AVAILABLE_MODULES[tier];

    if (selectAll) {
      const explicit = availableModules.filter((m) => m !== "authentication");
      setExplicitModules(explicit);
      setSelectedModules(resolveDependencies(availableModules));
      toast.success(" All modules selected");
    } else {
      setExplicitModules([]);
      setSelectedModules(
        availableModules.filter((m) => m === "authentication"),
      );
      toast.info(" All modules deselected (Authentication kept)");
    }
  };

  const handleToggle = (moduleId: ModuleId, isAdding: boolean) => {
    if (isAdding) {
      // Adding module — mark as explicit user selection
      const newExplicit = [...explicitModules, moduleId];
      const resolved = resolveDependencies([...newExplicit, "authentication"]);

      const autoAdded = resolved.filter(
        (m) =>
          !selectedModules.includes(m) &&
          m !== moduleId &&
          m !== "authentication",
      );
      if (autoAdded.length > 0) {
        toast.success(
          ` Auto-added: ${autoAdded.map((m) => MODULE_META[m]?.label).join(", ")}`,
        );
      }

      setExplicitModules(newExplicit);
      setSelectedModules(resolved);
    } else {
      // Removing module — sirf explicit list se nikalo, phir closure recompute karo
      const newExplicit = explicitModules.filter((m) => m !== moduleId);
      const requiredClosure = new Set(
        resolveDependencies([...newExplicit, "authentication"]),
      );

      // Sirf woh modules orphan honge jinki zaroorat kisi bhi
      // remaining EXPLICIT selection ko nahi hai
      const orphaned = selectedModules.filter(
        (m) =>
          m !== moduleId && m !== "authentication" && !requiredClosure.has(m),
      );

      if (orphaned.length > 0) {
        toast.info(
          ` Removed dependencies: ${orphaned.map((m) => MODULE_META[m]?.label).join(", ")}`,
        );
      }

      setExplicitModules(newExplicit);
      setSelectedModules(Array.from(requiredClosure));
    }
  };

  const getAvailableModules = () => {
    if (!tier) return [];
    return TIER_AVAILABLE_MODULES[tier];
  };

  const handleGenerate = async () => {
    const finalModules = resolveDependencies(selectedModules);

    if (!name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post(
        "/generate",
        {
          websiteName: name.trim(),
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword: adminPassword.trim(),
          modules: finalModules,
          tier: tier,
        },
        { responseType: "blob" },
      );

      const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/zip" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(" Project generated and downloading!");

      setStep(1);
      setTier(null);
      setSelectedModules([]);
      setExplicitModules([]);
      setName("");
      setNameError("");
    } catch (err: any) {
      //  Blob response error ko JSON mein parse karo (kyunki responseType: "blob" hai)
      let message = "Generation failed. Please try again.";
      let field: string | undefined;

      const rawData = err?.response?.data;
      if (rawData instanceof Blob) {
        try {
          const text = await rawData.text();
          const parsed = JSON.parse(text);
          message = parsed?.error ?? message;
          field = parsed?.field;
        } catch {
          // ignore parse failure, use default message
        }
      } else if (rawData?.error) {
        message = rawData.error;
        field = rawData.field;
      } else if (err?.message) {
        message = err.message;
      }

      if (field === "name") {
        setNameError(message);
        setStep(3);
      }

      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleLogoClick = () => {
    setStep(1);
    setTier(null);
    setSelectedModules([]);
    setExplicitModules([]);
    setName("");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setNameError("");
  };

  useEffect(() => {
    const handler = () => handleLogoClick();
    window.addEventListener("reset-dashboard-wizard", handler);
    return () => window.removeEventListener("reset-dashboard-wizard", handler);
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <ProgressBar step={step} />

        <AnimatePresence mode="wait">
          {step === 1 && <StepTier key="s1" onSelect={handleTierSelect} />}
          {step === 2 && tier && (
            <StepModules
              key="s2"
              availableModules={getAvailableModules()}
              selected={selectedModules}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <StepName
              key="s3"
              initialName={name}
              initialAdminName={adminName}
              initialAdminEmail={adminEmail}
              initialAdminPassword={adminPassword}
              serverNameError={nameError}
              onClearServerNameError={() => setNameError("")}
              onBack={() => setStep(2)}
              onNext={(data) => {
                setName(data.name);
                setAdminName(data.adminName);
                setAdminEmail(data.adminEmail);
                setAdminPassword(data.adminPassword);
                setStep(4);
              }}
            />
          )}
          {step === 4 && tier && (
            <StepGenerate
              key="s4"
              websiteName={name}
              adminName={adminName}
              adminEmail={adminEmail}
              selectedModules={selectedModules}
              selectedTier={tier}
              onBack={() => setStep(3)}
              onGenerate={handleGenerate}
              generating={generating}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
