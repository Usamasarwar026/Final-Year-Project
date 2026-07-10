"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Hotel, LogOut, User as UserIcon, FolderKanban } from "lucide-react";
import clsx from "clsx";
import { useUserDisplayName } from "@/context/UserContext";

function getInitial(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim();
  return source?.[0]?.toUpperCase() ?? "U";
}

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const { displayName: overrideName } = useUserDisplayName();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    overrideName ?? user?.name ?? user?.email?.split("@")[0] ?? "User";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/dashboard"
          onClick={() => {
            window.dispatchEvent(new Event("reset-dashboard-wizard"));
          }}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Hotel className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">HotelGen</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border text-foreground hover:bg-secondary transition-colors"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            My Projects
          </Link>

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              {getInitial(displayName, user?.email)}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                {/* User info */}
                <div className="flex items-center gap-3 p-3 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-base font-bold shrink-0">
                    {getInitial(displayName, user?.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Mobile-only My Projects link */}
                <Link
                  href="/projects"
                  onClick={() => setOpen(false)}
                  className="sm:hidden flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <FolderKanban size={15} className="text-primary" />
                  My Projects
                </Link>

                {/* Profile link */}
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <UserIcon size={15} className="text-primary" />
                  Profile
                </Link>

                {/* Sign out */}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className={clsx(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors border-t border-border",
                  )}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
