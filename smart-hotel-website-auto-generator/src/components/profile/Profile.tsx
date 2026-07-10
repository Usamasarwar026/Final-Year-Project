/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  FolderKanban,
  Pencil,
  X,
  Save,
  Clock,
} from "lucide-react";
import clsx from "clsx";
import api from "@/lib/axios";
import Navbar from "../navbar/Navbar";
import { useUserDisplayName } from "@/context/UserContext";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  country: string | null;
  city: string | null;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  _count?: { projects: number };
};

function getInitial(name?: string | null) {
  return name?.trim()?.[0]?.toUpperCase() ?? "U";
}

export default function Profile() {
  const { update: updateSession } = useSession();
  const { setDisplayName } = useUserDisplayName();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [nameError, setNameError] = useState("");

  const loadProfile = () => {
    setLoading(true);
    api
      .get("/profile")
      .then((res) => {
        setProfile(res.data);
        setName(res.data.name ?? "");
        setPhoneNumber(res.data.phoneNumber ?? "");
        setCountry(res.data.country ?? "");
        setCity(res.data.city ?? "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleCancel = () => {
    if (!profile) return;
    setName(profile.name ?? "");
    setPhoneNumber(profile.phoneNumber ?? "");
    setCountry(profile.country ?? "");
    setCity(profile.city ?? "");
    setNameError("");
    setEditing(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch("/profile", {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        country: country.trim(),
        city: city.trim(),
      });
      setProfile(res.data);
      setEditing(false);
      setNameError("");
      toast.success("Profile updated successfully");
      setDisplayName(res.data.name);
      updateSession?.({ name: res.data.name });
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} /> Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-24 text-muted-foreground text-sm">
          Could not load profile.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your account information
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* ── Left column: identity card ── */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-xl border border-border bg-card text-center lg:sticky lg:top-20">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-brand flex items-center justify-center text-white text-3xl font-bold shrink-0">
                {getInitial(profile.name)}
              </div>

              <h2 className="text-lg font-bold text-foreground mt-4 truncate">
                {profile.name}
              </h2>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Mail size={12} />
                <span className="truncate">{profile.email}</span>
              </p>

              <div className="flex items-center justify-center flex-wrap gap-1.5 mt-3">
                {profile.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                    <ShieldCheck size={11} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    <ShieldAlert size={11} /> Not Verified
                  </span>
                )}
                {typeof profile._count?.projects === "number" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-brand/10 text-primary border border-primary/20">
                    <FolderKanban size={11} /> {profile._count.projects}{" "}
                    Projects
                  </span>
                )}
              </div>

              <div className="border-t border-border mt-5 pt-4 space-y-3 text-left">
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={14} className="text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                      Joined
                    </p>
                    <p className="text-xs text-foreground font-medium">
                      {new Date(profile.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {profile.lastLogin && (
                  <div className="flex items-center gap-2.5">
                    <Clock size={14} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                        Last Login
                      </p>
                      <p className="text-xs text-foreground font-medium">
                        {new Date(profile.lastLogin).toLocaleString("en-US")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full mt-5 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-brand text-white hover:opacity-90 transition-opacity"
                >
                  <Pencil size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* ── Right column: details / edit form ── */}
          <div className="lg:col-span-2">
            <div className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-base font-bold text-foreground mb-5">
                {editing ? "Edit Profile Details" : "Profile Details"}
              </h2>

              {!editing ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <DetailRow
                    icon={Phone}
                    label="Phone Number"
                    value={profile.phoneNumber || "—"}
                  />
                  <DetailRow
                    icon={MapPin}
                    label="Country"
                    value={profile.country || "—"}
                  />
                  <DetailRow
                    icon={MapPin}
                    label="City"
                    value={profile.city || "—"}
                  />
                  <DetailRow icon={Mail} label="Email" value={profile.email} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setNameError("");
                      }}
                      className={clsx(
                        "w-full px-4 py-2.5 rounded-lg border-2 bg-card text-foreground text-sm outline-none transition-colors",
                        nameError
                          ? "border-destructive"
                          : "border-border focus:border-primary/60",
                      )}
                    />
                    {nameError && (
                      <p className="text-xs text-destructive mt-1">
                        {nameError}
                      </p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        Phone Number
                      </label>
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +92 300 1234567"
                        className="w-full px-4 py-2.5 rounded-lg border-2 bg-card text-foreground text-sm outline-none border-border focus:border-primary/60 transition-colors placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        Country
                      </label>
                      <input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. Pakistan"
                        className="w-full px-4 py-2.5 rounded-lg border-2 bg-card text-foreground text-sm outline-none border-border focus:border-primary/60 transition-colors placeholder:text-muted-foreground/40"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        City
                      </label>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Faisalabad"
                        className="w-full px-4 py-2.5 rounded-lg border-2 bg-card text-foreground text-sm outline-none border-border focus:border-primary/60 transition-colors placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Email (cannot be changed)
                      </label>
                      <input
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-muted/30 text-muted-foreground text-sm outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-brand text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />{" "}
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={15} /> Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-60"
                    >
                      <X size={15} /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
      <div className="w-9 h-9 rounded-lg bg-gradient-brand/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
          {label}
        </p>
        <p className="text-sm text-foreground font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
