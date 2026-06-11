"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  User,
  RefreshCw,
  BadgeCheck,
  Calendar,
  CreditCard,
} from "lucide-react";
import {
  useProfile,
  useUpdateProfile,
  useUploadProfileImage,
} from "@/hooks/useProfile";
import { UserProfile } from "@/types/profile.type";
import clsx from "clsx";

// ─── Avatar Upload ────────────────────────────────────────────────────────────
function AvatarUpload({
  currentImage,
  name,
}: {
  currentImage: string | null;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const upload = useUploadProfileImage();

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // Cloudinary URL detect — use Next.js optimization, local blob preview skip karo
  const isCloudinaryUrl = (url: string) => url.includes("res.cloudinary.com");

  const handleFile = async (file: File) => {
    setError(null);
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setError("JPG, PNG, WEBP only");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Max 5MB");
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    try {
      await upload.mutateAsync(file);

      setPreview(null);
      URL.revokeObjectURL(localPreview);
    } catch {
      setPreview(null);
      URL.revokeObjectURL(localPreview);
      setError("Upload failed — try again");
    }
  };

  // Priority: local blob preview > Cloudinary URL > initials
  const displaySrc = preview || currentImage;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        whileHover={{ scale: upload.isPending ? 1 : 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-24 h-24 cursor-pointer group"
        onClick={() => !upload.isPending && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Change profile photo"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/20 shadow-elegant">
          {displaySrc ? (
            <Image
              src={displaySrc}
              alt={name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              // Local blob preview = unoptimized, Cloudinary URL = Next.js optimize kare
              unoptimized={
                !!preview || (!!currentImage && !isCloudinaryUrl(currentImage))
              }
            />
          ) : (
            <div className="w-full h-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-white text-2xl font-bold select-none">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Overlay */}
        <div
          className={clsx(
            "absolute inset-0 rounded-full bg-black/60",
            "flex flex-col items-center justify-center gap-1",
            "transition-opacity duration-200",
            upload.isPending
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100",
          )}
        >
          <AnimatePresence mode="wait">
            {upload.isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 size={20} className="text-white animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="camera"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-0.5"
              >
                <Camera size={16} className="text-white" />
                <span className="text-white text-[9px] font-bold tracking-widest">
                  EDIT
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Verified badge */}
        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-accent ring-2 ring-primary flex items-center justify-center">
          <BadgeCheck size={13} className="text-white" />
        </div>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <AnimatePresence>
        {error && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[10px] text-red-300 text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="text-[10px] text-white/40 text-center leading-relaxed">
        Click to change photo
        <br />
        JPG, PNG, WEBP · Max 5MB
      </p>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  readOnly,
  icon: Icon,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  icon?: React.ElementType;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={clsx(
            "w-full py-2.5 rounded-xl text-sm",
            "bg-muted border border-border",
            "text-foreground placeholder:text-muted-foreground",
            "outline-none transition-all duration-150",
            "focus:border-accent focus:ring-2 focus:ring-accent/15",
            Icon ? "pl-9 pr-3.5" : "px-3.5",
            (disabled || readOnly) && "opacity-50 cursor-not-allowed",
          )}
        />
      </div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
          {title}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Pulse({ className }: { className?: string }) {
  return (
    <div className={clsx("animate-pulse rounded-xl bg-muted/50", className)} />
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-8 p-6 sm:p-8">
      <div className="flex gap-2">
        <Pulse className="h-6 w-20 rounded-full" />
        <Pulse className="h-6 w-20 rounded-full" />
      </div>
      {[4, 3].map((count, si) => (
        <div key={si} className="space-y-4">
          <Pulse className="h-3 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "space-y-1.5",
                  i === 0 && si === 1 && "sm:col-span-2",
                )}
              >
                <Pulse className="h-2.5 w-20" />
                <Pulse className="h-11" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Role badge styles ────────────────────────────────────────────────────────
const roleStyle: Record<string, string> = {
  ADMIN: "bg-primary text-gold",
  STAFF: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  CUSTOMER:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

// ─── Form body ────────────────────────────────────────────────────────────────
function ProfileFormBody({ profile }: { profile: UserProfile }) {
  const update = useUpdateProfile();

  const [form, setForm] = useState({
    name: profile.name ?? "",
    phoneNumber: profile.phoneNumber ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    country: profile.country ?? "",
    cnic: profile.cnic ?? "",
    dateOfBirth: profile.dateOfBirth
      ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
      : "",
  });

  // Profile reload hone pe form sync karo (e.g. refetch ke baad)
  useEffect(() => {
    setForm({
      name: profile.name ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      address: profile.address ?? "",
      city: profile.city ?? "",
      country: profile.country ?? "",
      cnic: profile.cnic ?? "",
      dateOfBirth: profile.dateOfBirth
        ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
        : "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile.name,
    profile.phoneNumber,
    profile.address,
    profile.city,
    profile.country,
    profile.cnic,
    profile.dateOfBirth,
  ]);

  const ch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await update.mutateAsync({
      name: form.name.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      country: form.country.trim() || undefined,
      cnic: form.cnic.trim() || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="p-6 sm:p-8 space-y-8">
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={clsx(
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
            roleStyle[profile.role] ?? roleStyle.ADMIN,
          )}
        >
          {profile.role}
        </span>
        {profile.isVerified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <ShieldCheck size={11} />
            Verified
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">
          Joined{" "}
          {new Date(profile.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Personal Info */}
      <Section title="Personal Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Full Name"
            name="name"
            value={form.name}
            onChange={ch}
            placeholder="John Doe"
            disabled={update.isPending}
            icon={User}
          />
          <Field
            label="Email Address"
            name="email"
            value={profile.email}
            readOnly
            icon={Mail}
            hint="Cannot be changed"
          />
          <Field
            label="Phone Number"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={ch}
            placeholder="+92 300 1234567"
            disabled={update.isPending}
            icon={Phone}
            type="tel"
          />
          <Field
            label="Date of Birth"
            name="dateOfBirth"
            value={form.dateOfBirth}
            onChange={ch}
            disabled={update.isPending}
            icon={Calendar}
            type="date"
          />
        </div>
      </Section>

      {/* Identity */}
      <Section title="Identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="CNIC"
            name="cnic"
            value={form.cnic}
            onChange={ch}
            placeholder="35202-1234567-1"
            disabled={update.isPending}
            icon={CreditCard}
            hint="National ID number"
          />
        </div>
      </Section>

      {/* Address */}
      <Section title="Address Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field
              label="Street Address"
              name="address"
              value={form.address}
              onChange={ch}
              placeholder="123 Main Street"
              disabled={update.isPending}
              icon={MapPin}
            />
          </div>
          <Field
            label="City"
            name="city"
            value={form.city}
            onChange={ch}
            placeholder="Faisalabad"
            disabled={update.isPending}
            icon={Building2}
          />
          <Field
            label="Country"
            name="country"
            value={form.country}
            onChange={ch}
            placeholder="Pakistan"
            disabled={update.isPending}
            icon={Globe}
          />
        </div>
      </Section>

      {/* Save */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        {/* Mutation feedback */}
        <AnimatePresence mode="wait">
          {update.isSuccess && (
            <motion.p
              key="ok"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-green-600 dark:text-green-400 font-medium"
            >
              ✓ Saved successfully
            </motion.p>
          )}
          {update.isError && (
            <motion.p
              key="err"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-red-500 font-medium"
            >
              {(update.error as any)?.message ?? "Save failed — try again"}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={update.isPending}
          whileHover={{ scale: update.isPending ? 1 : 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                     bg-primary text-primary-foreground shadow-sm
                     hover:opacity-90 transition-all duration-150
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {update.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </motion.button>
      </div>
    </form>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ProfileClient() {
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useProfile();

  return (
    <div className="h-full flex flex-col -m-4 lg:-m-6 overflow-hidden">
      {/* Hero / Cover */}
      <div className="shrink-0 relative bg-hero overflow-hidden">
        {/* Decorative blobs */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute top-4 left-1/3 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-8 left-8 w-32 h-32 rounded-full bg-primary/40 blur-2xl" />
        </div>

        <div className="relative z-10 px-6 sm:px-10 pt-8 pb-6 flex flex-col sm:flex-row items-center sm:items-end gap-5">
          {/* Avatar — skeleton jab tak profile nahi aata */}
          {profile ? (
            <AvatarUpload
              currentImage={profile.profileImage}
              name={profile.name}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/10 animate-pulse shrink-0" />
          )}

          {/* Name + email */}
          <div className="text-center sm:text-left pb-1 min-w-0 flex-1">
            {profile ? (
              <>
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="text-2xl font-semibold text-white leading-tight truncate"
                >
                  {profile.name}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm text-white/60 mt-0.5 truncate"
                >
                  {profile.email}
                </motion.p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-6 w-40 rounded-lg bg-white/10 animate-pulse" />
                <div className="h-4 w-56 rounded-lg bg-white/10 animate-pulse" />
              </div>
            )}
          </div>

          {/* Background refetch indicator */}
          {isFetching && !isLoading && (
            <div className="sm:ml-auto pb-1 shrink-0">
              <RefreshCw size={14} className="text-white/40 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto bg-background">
        {isLoading && <FormSkeleton />}

        {isError && !isLoading && (
          <div className="flex flex-col items-center gap-4 py-20 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle size={26} className="text-red-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Failed to load profile
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Check your connection and try again.
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        )}

        {profile && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <ProfileFormBody profile={profile} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
