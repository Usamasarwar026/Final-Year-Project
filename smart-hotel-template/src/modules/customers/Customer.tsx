// src/modules/customers/Customers.tsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  X,
  CheckCircle2,
  XCircle,
  Eye,
  UserCheck,
  UserX,
  Edit3,
  Save,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  CalendarDays,
  BedDouble,
  Hash,
  Clock,
  Star,
  Banknote,
  UserPlus,
  Globe,
  Building2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import type { Customer, UpdateCustomerPayload } from "@/types/customers";
import {
  useCustomerModule,
  useCustomerProfile,
} from "@/hooks/useCustomerModule";

// ── Booking status config ─────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  Pending: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    dot: "bg-amber-500",
    label: "Pending",
  },
  Confirmed: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    dot: "bg-blue-500",
    label: "Confirmed",
  },
  CheckedIn: {
    bg: "bg-green-500/10",
    text: "text-green-500",
    dot: "bg-green-500",
    label: "Checked In",
  },
  CheckedOut: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    label: "Checked Out",
  },
  Cancelled: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    dot: "bg-red-500",
    label: "Cancelled",
  },
};

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, x: 16 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 16, x: 16 }}
      className={clsx(
        "fixed bottom-6 right-6 z-[600] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium",
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
  size = "md",
}: {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
  };
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  if (image) {
    return (
      <div
        className={clsx(
          sizes[size],
          "rounded-full overflow-hidden shrink-0 border border-border",
        )}
      >
        <Image
          src={image}
          alt={name}
          width={80}
          height={80}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div
      className={clsx(
        sizes[size],
        color,
        "rounded-full flex items-center justify-center shrink-0 text-white font-bold",
      )}
    >
      {initials}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────
function CustomerBadge({
  isActive,
  // isVerified,
}: {
  isActive: boolean;
  // isVerified: boolean;
}) {
  if (!isActive)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Suspended
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-background border border-border rounded-2xl p-4 flex items-start gap-3">
      <div
        className={clsx(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          color,
        )}
      >
        <Icon size={15} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-foreground leading-none">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

// ── Edit Form ─────────────────────────────────────────────────
function EditForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Customer;
  onSave: (data: UpdateCustomerPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial.name,
    email: initial.email,
    phoneNumber: initial.phoneNumber ?? "",
    cnic: initial.cnic ?? "",
    address: initial.address ?? "",
    city: initial.city ?? "",
    country: initial.country ?? "",
    dateOfBirth: initial.dateOfBirth ? initial.dateOfBirth.split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim() || undefined,
      cnic: form.cnic.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      country: form.country.trim() || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
    });
    setSaving(false);
  };

  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors";

  const fields: {
    key: keyof typeof form;
    label: string;
    icon: React.ElementType;
    type?: string;
    placeholder: string;
  }[] = [
    { key: "name", label: "Full Name", icon: Users, placeholder: "John Doe" },
    {
      key: "email",
      label: "Email",
      icon: Mail,
      type: "email",
      placeholder: "email@example.com",
    },
    {
      key: "phoneNumber",
      label: "Phone",
      icon: Phone,
      placeholder: "+92 300 0000000",
    },
    {
      key: "cnic",
      label: "CNIC",
      icon: CreditCard,
      placeholder: "12345-1234567-1",
    },
    {
      key: "address",
      label: "Address",
      icon: MapPin,
      placeholder: "Street address",
    },
    { key: "city", label: "City", icon: Building2, placeholder: "Karachi" },
    { key: "country", label: "Country", icon: Globe, placeholder: "Pakistan" },
    {
      key: "dateOfBirth",
      label: "Date of Birth",
      icon: Calendar,
      type: "date",
      placeholder: "",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
          <div
            key={key}
            className={clsx(
              "space-y-1",
              key === "name" || key === "email" || key === "address"
                ? "col-span-2"
                : "",
            )}
          >
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Icon size={10} /> {label}
            </label>
            <input
              type={type ?? "text"}
              value={form[key]}
              onChange={set(key)}
              placeholder={placeholder}
              className={inputCls}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Profile Drawer ────────────────────────────────────────────
function ProfileDrawer({
  customerId,
  onClose,
  onUpdate,
}: {
  customerId: string;
  onClose: () => void;
  onUpdate: (
    id: string,
    data: UpdateCustomerPayload,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const { profile, loading, error, refresh, setProfile } =
    useCustomerProfile(customerId);
  const [tab, setTab] = useState<"overview" | "bookings" | "account">(
    "overview",
  );
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdate = async (data: UpdateCustomerPayload) => {
    const res = await onUpdate(customerId, data);
    if (res.ok) {
      refresh();
      setEditing(false);
      showToast("Customer updated successfully");
    } else {
      showToast(res.error ?? "Failed to update", "error");
    }
  };

  const handleToggleSuspend = async () => {
    if (!profile) return;
    const res = await onUpdate(customerId, { isActive: !profile.isActive });
    if (res.ok) {
      refresh();
      showToast(profile.isActive ? "Customer suspended" : "Customer activated");
    } else {
      showToast(res.error ?? "Failed", "error");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        className="fixed right-0 top-0 bottom-0 z-[250] w-full max-w-xl bg-background border-l border-border shadow-2xl flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="font-bold text-foreground">Customer Profile</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2
                size={24}
                className="animate-spin text-muted-foreground"
              />
              <p className="text-sm text-muted-foreground">Loading profile…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={refresh}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          ) : profile ? (
            <div className="space-y-0">
              {/* Hero */}
              <div className="px-5 pt-5 pb-4 space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    name={profile.name}
                    image={profile.profileImage}
                    size="xl"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-foreground truncate">
                          {profile.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.email}
                        </p>
                      </div>
                      <CustomerBadge
                        isActive={profile.isActive}
                        // isVerified={profile.isVerified}
                      />
                    </div>
                    {profile.phoneNumber && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Phone size={10} /> {profile.phoneNumber}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.createdByAdmin && (
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 text-[10px] font-semibold">
                          Admin Created
                        </span>
                      )}
                      {profile.lastLogin && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock size={9} /> Last login{" "}
                          {new Date(profile.lastLogin).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Total Bookings",
                      value: profile.stats.totalBookings,
                      icon: Hash,
                      color: "bg-primary",
                    },
                    {
                      label: "Total Spent",
                      value: `$${profile.stats.totalSpent.toFixed(0)}`,
                      icon: Banknote,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "Completed",
                      value: profile.stats.completedStays,
                      icon: Star,
                      color: "bg-amber-500",
                    },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div
                      key={label}
                      className="bg-muted/50 border border-border rounded-xl p-3 text-center"
                    >
                      <div
                        className={clsx(
                          "w-7 h-7 rounded-lg mx-auto mb-1.5 flex items-center justify-center",
                          color,
                        )}
                      >
                        <Icon size={12} className="text-white" />
                      </div>
                      <p className="text-base font-bold text-foreground">
                        {value}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="px-5 border-b border-border">
                <div className="flex gap-0">
                  {(["overview", "bookings", "account"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTab(t);
                        setEditing(false);
                      }}
                      className={clsx(
                        "px-4 py-2.5 text-sm font-medium border-b-2 transition-all capitalize",
                        tab === t
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t === "overview"
                        ? "Overview"
                        : t === "bookings"
                          ? `Bookings (${profile.stats.totalBookings})`
                          : "Account"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="px-5 py-4 space-y-4">
                {/* ── Overview Tab ── */}
                {tab === "overview" && (
                  <div className="space-y-4">
                    {editing ? (
                      <EditForm
                        initial={profile}
                        onSave={handleUpdate}
                        onCancel={() => setEditing(false)}
                      />
                    ) : (
                      <>
                        {/* Info grid */}
                        <div className="space-y-2">
                          {[
                            {
                              icon: Mail,
                              label: "Email",
                              value: profile.email,
                            },
                            {
                              icon: Phone,
                              label: "Phone",
                              value: profile.phoneNumber,
                            },
                            {
                              icon: CreditCard,
                              label: "CNIC",
                              value: profile.cnic,
                            },
                            {
                              icon: Calendar,
                              label: "Date of Birth",
                              value: profile.dateOfBirth
                                ? new Date(
                                    profile.dateOfBirth,
                                  ).toLocaleDateString("en-US", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
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
                          ].map(({ icon: Icon, label, value }) =>
                            value ? (
                              <div
                                key={label}
                                className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                              >
                                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                  <Icon
                                    size={12}
                                    className="text-muted-foreground"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                                    {label}
                                  </p>
                                  <p className="text-sm text-foreground mt-0.5 break-all">
                                    {value}
                                  </p>
                                </div>
                              </div>
                            ) : null,
                          )}
                        </div>

                        {/* Extended stats */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <StatCard
                            label="Active Bookings"
                            value={profile.stats.activeBookings}
                            icon={CalendarDays}
                            color="bg-blue-500"
                          />
                          <StatCard
                            label="Cancelled"
                            value={profile.stats.cancelledBookings}
                            icon={XCircle}
                            color="bg-red-500"
                          />
                          <StatCard
                            label="Avg Stay"
                            value={`${profile.stats.avgNightsPerStay}n`}
                            icon={BedDouble}
                            color="bg-violet-500"
                            sub="avg nights/stay"
                          />
                          <StatCard
                            label="Member Since"
                            value={new Date(
                              profile.createdAt,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                            icon={Star}
                            color="bg-amber-500"
                          />
                        </div>

                        <button
                          onClick={() => setEditing(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          <Edit3 size={13} /> Edit Profile
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* ── Bookings Tab ── */}
                {tab === "bookings" && (
                  <div className="space-y-2.5">
                    {profile.recentBookings.length === 0 ? (
                      <div className="py-12 text-center">
                        <BedDouble
                          size={28}
                          className="mx-auto mb-2 text-muted-foreground/20"
                        />
                        <p className="text-sm text-muted-foreground">
                          No bookings yet
                        </p>
                      </div>
                    ) : (
                      profile.recentBookings.map((b) => {
                        const sc =
                          STATUS_CONFIG[b.status] ?? STATUS_CONFIG.Pending;
                        const photo = b.room?.photos?.[0];
                        return (
                          <motion.div
                            key={b.booking_id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 p-3 bg-muted/30 border border-border rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            {/* Room photo */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted border border-border">
                              {photo ? (
                                <Image
                                  src={photo}
                                  alt=""
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BedDouble
                                    size={16}
                                    className="text-muted-foreground/20"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {b.room
                                      ? `Room ${b.room.room_number} · ${b.room.room_type}`
                                      : "—"}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {new Date(
                                      b.check_in_date,
                                    ).toLocaleDateString("en-US", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                    {" → "}
                                    {new Date(
                                      b.check_out_date,
                                    ).toLocaleDateString("en-US", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                    {" · "}
                                    {b.total_nights}n
                                  </p>
                                </div>
                                <span
                                  className={clsx(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
                                    sc.bg,
                                    sc.text,
                                  )}
                                >
                                  <span
                                    className={clsx(
                                      "w-1.5 h-1.5 rounded-full",
                                      sc.dot,
                                    )}
                                  />
                                  {sc.label}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <p className="text-xs font-bold text-foreground">
                                  ${b.total_amount.toFixed(0)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  #{b.booking_id} ·{" "}
                                  {b.source === "ADMIN"
                                    ? "Admin booking"
                                    : "Self-booked"}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                    {profile.stats.totalBookings > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Showing latest 10 of {profile.stats.totalBookings}{" "}
                        bookings
                      </p>
                    )}
                  </div>
                )}

                {/* ── Account Tab ── */}
                {tab === "account" && (
                  <div className="space-y-3">
                    {/* Account info */}
                    <div className="space-y-2">
                      {[
                        {
                          label: "Account Status",
                          value: profile.isActive ? "Active" : "Suspended",
                          good: profile.isActive,
                        },

                        {
                          label: "Created By",
                          value: profile.createdByAdmin
                            ? "Admin"
                            : "Self-Registration",
                          good: true,
                        },
                        {
                          label: "Member Since",
                          value: new Date(profile.createdAt).toLocaleDateString(
                            "en-US",
                            { day: "numeric", month: "long", year: "numeric" },
                          ),
                          good: true,
                        },
                        {
                          label: "Last Updated",
                          value: new Date(profile.updatedAt).toLocaleDateString(
                            "en-US",
                            { day: "numeric", month: "long", year: "numeric" },
                          ),
                          good: true,
                        },
                        // {
                        //   label: "Last Login",
                        //   value: profile.lastLogin
                        //     ? new Date(profile.lastLogin).toLocaleString()
                        //     : "Never",
                        //   good: !!profile.lastLogin,
                        // },
                      ].map(({ label, value, good }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
                        >
                          <p className="text-sm text-muted-foreground">
                            {label}
                          </p>
                          <p
                            className={clsx(
                              "text-sm font-semibold",
                              good
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Account Actions
                      </p>

                      <button
                        onClick={handleToggleSuspend}
                        className={clsx(
                          "w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors",
                          profile.isActive
                            ? "border-red-500/30 text-red-500 hover:bg-red-500/10"
                            : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10",
                        )}
                      >
                        {profile.isActive ? (
                          <UserX size={15} />
                        ) : (
                          <UserCheck size={15} />
                        )}
                        {profile.isActive
                          ? "Suspend Account"
                          : "Activate Account"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* Toast inside drawer */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </>
  );
}

// ── Main Customers Page ───────────────────────────────────────
export default function Customers() {
  const { customers, loading, error, refresh, updateCustomer } =
    useCustomerModule();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended"
  >("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "admin" | "self">(
    "all",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phoneNumber ?? "").includes(q) ||
        (c.cnic ?? "").includes(q) ||
        (c.city ?? "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive) ||
        (statusFilter === "suspended" && !c.isActive);

      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "admin" && c.createdByAdmin) ||
        (sourceFilter === "self" && !c.createdByAdmin);

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [customers, search, statusFilter, sourceFilter]);

  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.isActive).length,
    suspended: customers.filter((c) => !c.isActive).length,
    adminCreated: customers.filter((c) => c.createdByAdmin).length,
  };

  const handleUpdate = async (id: string, data: UpdateCustomerPayload) => {
    return updateCustomer(id, data);
  };

  const selCls =
    "px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all registered and admin-created customers
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Customers",
            value: stats.total,
            icon: Users,
            color: "bg-primary",
          },
          {
            label: "Active",
            value: stats.active,
            icon: UserCheck,
            color: "bg-emerald-500",
          },
          {
            label: "Suspended",
            value: stats.suspended,
            icon: UserX,
            color: "bg-red-500",
          },
          {
            label: "Admin Created",
            value: stats.adminCreated,
            icon: UserPlus,
            color: "bg-violet-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3.5"
          >
            <div
              className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                color,
              )}
            >
              <Icon size={17} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, CNIC, phone…"
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className={selCls}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as any)}
          className={selCls}
        >
          <option value="all">All Sources</option>
          <option value="admin">Admin Created</option>
          <option value="self">Self Registered</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-2xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading customers…</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {[
                    "Customer",
                    "Contact",
                    "CNIC",
                    "Location",
                    "Status",
                    "Source",
                    "Joined",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
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
                        No customers found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className="border-t border-border hover:bg-muted/30 transition-colors group"
                    >
                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={c.name}
                            image={c.profileImage}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-xs truncate max-w-[130px]">
                              {c.name}
                            </p>
                            <p className="text-muted-foreground text-[11px] truncate max-w-[130px]">
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {c.phoneNumber ?? (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* CNIC */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                        {c.cnic ?? (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {[c.city, c.country].filter(Boolean).join(", ") || (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <CustomerBadge isActive={c.isActive} />
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5">
                        <span
                          className={clsx(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                            c.createdByAdmin
                              ? "bg-violet-500/10 text-violet-500"
                              : "bg-blue-500/10 text-blue-500",
                          )}
                        >
                          {c.createdByAdmin ? "Admin" : "Self"}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedId(c.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="View Profile"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={async () => {
                              const res = await updateCustomer(c.id, {
                                isActive: !c.isActive,
                              });
                              if (res.ok)
                                showToast(
                                  c.isActive
                                    ? "Customer suspended"
                                    : "Customer activated",
                                );
                              else showToast(res.error ?? "Failed", "error");
                            }}
                            className={clsx(
                              "p-1.5 rounded-lg transition-colors",
                              c.isActive
                                ? "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10",
                            )}
                            title={c.isActive ? "Suspend" : "Activate"}
                          >
                            {c.isActive ? (
                              <UserX size={13} />
                            ) : (
                              <UserCheck size={13} />
                            )}
                          </button>
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
          <div className="px-4 py-3 border-t border-border bg-muted/20 flex justify-between text-xs text-muted-foreground">
            <span>
              Showing {filtered.length} of {customers.length} customers
            </span>
            <span>
              {stats.active} active · {stats.suspended} suspended
            </span>
          </div>
        )}
      </div>

      {/* Profile Drawer */}
      <AnimatePresence>
        {selectedId && (
          <ProfileDrawer
            key={selectedId}
            customerId={selectedId}
            onClose={() => setSelectedId(null)}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
