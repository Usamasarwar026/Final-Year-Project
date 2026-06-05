"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, UserRound, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useProfile } from "@/hooks/useProfile";

export default function Topbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: profile } = useProfile();
  const email = profile?.email;
  const name = profile?.name;
  const image = profile?.profileImage;

  const role = (session?.user as any)?.role as string | undefined;

  const initial = name
    ? name[0].toUpperCase()
    : (email?.[0]?.toUpperCase() ?? "U");

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const profileHref =
    role === "ADMIN"
      ? "/admin/profile"
      : role === "STAFF"
        ? "/staff/profile"
        : "/customer/profile";

  const settingsHref =
    role === "ADMIN"
      ? "/admin/settings"
      : role === "STAFF"
        ? "/staff/settings"
        : "/customer/settings";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <header
      className="h-14 bg-background border-b border-border
                 flex items-center justify-end px-4 lg:px-6 gap-3 shrink-0"
    >
      {/* Mobile spacer */}
      <div className="flex-1 lg:hidden" />

      {/* Notification bell */}
      <button
        className="relative p-2 rounded-xl hover:bg-muted transition-colors group"
        aria-label="Notifications"
      >
        <Bell
          size={18}
          className="text-muted-foreground group-hover:text-foreground transition-colors"
        />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2
                     bg-primary rounded-full ring-2 ring-background"
        />
      </button>

      {/* Avatar + Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-1.5 group focus:outline-none"
          aria-label="User menu"
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full overflow-hidden
                       ring-2 ring-gold group-hover:ring-gold
                       transition-all duration-150 shrink-0
                       bg-primary flex items-center justify-center"
          >
            {image ? (
              <Image
                src={image}
                alt={name ?? "User"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gold text-xs font-semibold">{initial}</span>
            )}
          </div>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-[calc(100%+8px)] z-[200]
                         w-52 bg-background border border-border
                         rounded-2xl shadow-elegant overflow-hidden"
            >
              {/* User info header */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden shrink-0
                                bg-primary flex items-center justify-center
                                ring-2 ring-gold"
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={name ?? "User"}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-semibold">
                        {initial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    {name && (
                      <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
                        {name}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground leading-tight truncate mt-0.5">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <button
                  onClick={() => {
                    router.push(profileHref);
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                             text-foreground hover:bg-muted transition-colors group"
                >
                  <UserRound
                    size={15}
                    className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                  />
                  Profile
                </button>

                <button
                  onClick={() => {
                    router.push(settingsHref);
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                             text-foreground hover:bg-muted transition-colors group"
                >
                  <Settings
                    size={15}
                    className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                  />
                  Settings
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-border py-1.5">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                             text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10
                             transition-colors group"
                >
                  <LogOut
                    size={15}
                    className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
