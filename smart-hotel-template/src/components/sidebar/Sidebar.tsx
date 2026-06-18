"use client";

import { useState, useEffect } from "react";

import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { adminNav, customerNav, filterStaffNavByPermissions, NavItem, staffNav } from "./nav.config";
import SidebarInner from "./SidebarInner";
import { useProfile } from "@/hooks/useProfile";

// ─────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────
export default function Sidebar() {
  const { data: session } = useSession();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = (session?.user as any)?.role as string | undefined;
  const permissions: string[] = (session?.user as any)?.permissions ?? [];
  const { data: profile } = useProfile();
  const email = profile?.email;
  const name = profile?.name;

  console.log(session);

  const navItems: NavItem[] =
    role === "ADMIN"
      ? adminNav
      : role === "STAFF"
        ? filterStaffNavByPermissions(permissions)
        : customerNav;

  useEffect(() => {
    const fn = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-[60] p-2 rounded-xl bg-primary text-white shadow-elegant hover:bg-primary/90 transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 z-[70] bg-black/50 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* Mobile slide-in panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              damping: 26,
              stiffness: 240,
              mass: 0.8,
            }}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-[80] w-64 bg-primary overflow-hidden"
          >
            <SidebarInner
              collapsed={false}
              navItems={navItems}
              email={email}
              name={name}
              role={role}
              onNavigate={() => setMobileOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: desktopCollapsed ? 72 : 240 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col bg-primary h-screen shrink-0 overflow-hidden"
      >
        <SidebarInner
          collapsed={desktopCollapsed}
          navItems={navItems}
          email={email}
          name={name}
          role={role}
          onToggle={() => setDesktopCollapsed((v) => !v)}
        />
      </motion.aside>
    </>
  );
}
