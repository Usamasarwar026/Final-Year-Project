"use client";
import { useState, useRef } from "react";
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
    closeTimer.current = setTimeout(() => setShow(false), 100);
  };

  const targetHref = hasChildren ? item.children![0].href : item.href;

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href={targetHref}
        className={clsx(
          "flex items-center justify-center w-10 h-10 rounded-xl mx-auto transition-all duration-150",
          isActive ? "text-gold" : "text-white/40 hover:text-gold",
        )}
      >
        <Icon size={18} />
      </Link>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.96 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            className="absolute left-[calc(100%+8px)] top-0 z-[200] min-w-[176px]
                       bg-primary border border-white/10
                       rounded-xl shadow-elegant py-1.5 overflow-hidden"
          >
            {/* Caret */}
            <span className="absolute -left-[5px] top-[14px] w-2.5 h-2.5 bg-primary border-l border-t border-white/10 rotate-[-45deg]" />

            {/* Header */}
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40 border-b border-white/10 mb-1">
              {item.label}
            </p>

            {hasChildren ? (
              item.children!.map((child) => {
                const CIcon = child.icon;
                const childActive =
                  pathname === child.href ||
                  pathname.startsWith(child.href + "/");
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={clsx(
                      "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                      childActive
                        ? "text-gold font-medium"
                        : "text-white/60 hover:text-gold",
                    )}
                  >
                    <CIcon size={14} className="shrink-0 opacity-70" />
                    {child.label}
                  </Link>
                );
              })
            ) : (
              <Link
                href={item.href}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "text-gold font-medium"
                    : "text-white/60 hover:text-gold",
                )}
              >
                <Icon size={14} className="shrink-0 opacity-70" />
                {item.label}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
