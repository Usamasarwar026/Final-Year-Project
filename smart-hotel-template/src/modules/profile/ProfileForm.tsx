// components/profile/ProfileForm.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { useUpdateProfile, type UserProfile } from "@/hooks/useProfile";
import clsx from "clsx";

type Props = { profile: UserProfile };

type FormState = {
  name: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
};

// Reusable input field
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  readOnly,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </label>
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
          "w-full px-3.5 py-2.5 rounded-xl text-sm",
          "bg-muted border border-border",
          "text-foreground placeholder:text-muted-foreground",
          "outline-none transition-all duration-150",
          "focus:border-accent focus:ring-2 focus:ring-accent/15",
          (disabled || readOnly) && "opacity-60 cursor-not-allowed bg-muted/50"
        )}
      />
    </div>
  );
}

// Status badge shown after save
function StatusBadge({ status }: { status: "idle" | "success" | "error" }) {
  return (
    <AnimatePresence mode="wait">
      {status === "success" && (
        <motion.span
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400"
        >
          <Check size={15} />
          Saved successfully
        </motion.span>
      )}
      {status === "error" && (
        <motion.span
          key="error"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5 text-sm text-red-500"
        >
          <AlertCircle size={15} />
          Failed to save
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default function ProfileForm({ profile }: Props) {
  const update = useUpdateProfile();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const [form, setForm] = useState<FormState>({
    name:        profile.name        ?? "",
    phoneNumber: profile.phoneNumber ?? "",
    address:     profile.address     ?? "",
    city:        profile.city        ?? "",
    country:     profile.country     ?? "",
  });

  // Sync if profile refetches
  useEffect(() => {
    setForm({
      name:        profile.name        ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      address:     profile.address     ?? "",
      city:        profile.city        ?? "",
      country:     profile.country     ?? "",
    });
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status !== "idle") setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({
        name:        form.name.trim()        || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        address:     form.address.trim()     || undefined,
        city:        form.city.trim()        || undefined,
        country:     form.country.trim()     || undefined,
      });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    }
  };

  const roleBadgeColor: Record<string, string> = {
    ADMIN:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    STAFF:    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    CUSTOMER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Read-only info row */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-border">
        <span className={clsx(
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
          roleBadgeColor[profile.role]
        )}>
          {profile.role}
        </span>

        {profile.isVerified && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                           text-xs font-semibold bg-green-100 text-green-700
                           dark:bg-green-900/30 dark:text-green-300">
            <Check size={11} />
            Verified
          </span>
        )}

        {profile.designation && (
          <span className="text-sm text-muted-foreground">
            {profile.designation}
          </span>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          Member since {new Date(profile.createdAt).toLocaleDateString("en-US", {
            year: "numeric", month: "long",
          })}
        </span>
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="John Doe"
          disabled={update.isPending}
        />
        <Field
          label="Email"
          name="email"
          value={profile.email}
          readOnly
          placeholder="your@email.com"
        />
        <Field
          label="Phone Number"
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={handleChange}
          type="tel"
          placeholder="+1 234 567 890"
          disabled={update.isPending}
        />
        {/* Employee ID — read only for staff */}
        {profile.employeeId && (
          <Field
            label="Employee ID"
            name="employeeId"
            value={profile.employeeId}
            readOnly
          />
        )}
      </div>

      {/* Address section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Address Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field
              label="Street Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Main Street"
              disabled={update.isPending}
            />
          </div>
          <Field
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Karachi"
            disabled={update.isPending}
          />
          <Field
            label="Country"
            name="country"
            value={form.country}
            onChange={handleChange}
            placeholder="Pakistan"
            disabled={update.isPending}
          />
        </div>
      </div>

      {/* Submit row */}
      <div className="flex items-center justify-between pt-2">
        <StatusBadge status={status} />
        <button
          type="submit"
          disabled={update.isPending}
          className={clsx(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium",
            "bg-primary text-primary-foreground",
            "hover:opacity-90 active:scale-[0.98]",
            "transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
            "ml-auto"
          )}
        >
          {update.isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}