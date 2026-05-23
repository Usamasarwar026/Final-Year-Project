// components/profile/ProfileClient.tsx
"use client";

import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import AvatarUpload from "./AvatarUpload";
import ProfileForm from "./ProfileForm";
import { Loader2, AlertCircle } from "lucide-react";

// Skeleton loader
function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Avatar skeleton */}
      <div className="flex flex-col items-center gap-3 pb-6 border-b border-border">
        <div className="w-28 h-28 rounded-full bg-muted" />
        <div className="h-3 w-40 rounded bg-muted" />
      </div>
      {/* Fields skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-10 rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function ProfileClient() {
  const { data: profile, isLoading, isError, refetch } = useProfile();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto"
    >
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Card */}
      <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-accent/40" />

        <div className="p-6 sm:p-8">
          {isLoading && <ProfileSkeleton />}

          {isError && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle size={36} className="text-red-400" />
              <p className="text-foreground font-medium">Failed to load profile</p>
              <p className="text-muted-foreground text-sm">Please check your connection and try again.</p>
              <button
                onClick={() => refetch()}
                className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground
                           text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          )}

          {profile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-8"
            >
              {/* Avatar section */}
              <div className="flex flex-col items-center pb-6 border-b border-border">
                <AvatarUpload
                  currentImage={profile.profileImage}
                  name={profile.name}
                />
              </div>

              {/* Form section */}
              <ProfileForm profile={profile} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}