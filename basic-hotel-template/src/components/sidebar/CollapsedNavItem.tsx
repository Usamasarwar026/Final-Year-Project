"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { NavItem } from "./nav.config";

export default function CollapsedNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;

  const isActive =
    pathname === item.href ||
    pathname.startsWith(item.href + "/") ||
    (hasChildren && item.children!.some((c) => pathname.startsWith(c.href)));

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShow(true);
  };

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setShow(false), 150);
  };

  // For items without children, navigate directly — no flyout needed
  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className={clsx(
          "flex items-center justify-center w-10 h-10 rounded-xl mx-auto transition-all duration-150",
          isActive ? "text-gold" : "text-white/40 hover:text-gold",
        )}
      >
        <Icon size={18} />
      </Link>
    );
  }

  // For items with children, show flyout on hover
  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Icon — clicking it navigates to first child */}
      <Link
        href={item.children![0].href}
        className={clsx(
          "flex items-center justify-center w-10 h-10 rounded-xl mx-auto transition-all duration-150",
          isActive ? "text-gold" : "text-white/40 hover:text-gold",
        )}
      >
        <Icon size={18} />
      </Link>

      {/* Children flyout */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            className="absolute left-[calc(100%+10px)] top-0 z-[200] min-w-[180px]
                       bg-[#1a1a2e] border border-white/10
                       rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-1.5"
            style={{ backdropFilter: "blur(8px)" }}
          >
            {/* Caret arrow pointing left */}
            <span
              className="absolute -left-[5px] top-[13px] w-2.5 h-2.5 border-l border-t border-white/10 rotate-[-45deg]"
              style={{ background: "#1a1a2e" }}
            />

            {/* Section label */}
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/35 border-b border-white/8 mb-1">
              {item.label}
            </p>

            {item.children!.map((child) => {
              const CIcon = child.icon;
              const childActive =
                pathname === child.href ||
                pathname.startsWith(child.href + "/");
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setShow(false)}
                  className={clsx(
                    "flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-[13px] transition-all duration-100",
                    childActive
                      ? "text-gold bg-gold/10 font-medium"
                      : "text-white/55 hover:text-white hover:bg-white/8",
                  )}
                >
                  <CIcon size={13} className="shrink-0" />
                  {child.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}