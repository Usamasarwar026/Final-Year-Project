"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { adminNav, NavItem } from "./nav.config";
import SidebarInner from "./SidebarInner";
import { useProfile } from "@/hooks/useProfile";

export default function Sidebar() {
  const { data: session, status } = useSession();

  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = session?.user?.role as string | undefined;

  const { data: profile, isLoading: profileLoading } = useProfile();
  console.log("profile data LOADING", profileLoading,)
  console.log("profile data ", profile,)

  const email = profile?.email;
  const name = profile?.name;

  const navItems: NavItem[] = adminNav;

  // Only block render until session resolves — profile loads in background
  // and populates footer/header without blocking nav
  const loading = status === "loading";

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-[60] p-2 rounded-xl bg-primary text-white shadow-elegant hover:bg-primary/90 transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* Mobile Backdrop */}
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

      {/* Mobile Sidebar */}
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
              loading={loading}
              onNavigate={() => setMobileOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
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
          loading={loading}
          onToggle={() => setDesktopCollapsed((prev) => !prev)}
        />
      </motion.aside>
    </>
  );
}