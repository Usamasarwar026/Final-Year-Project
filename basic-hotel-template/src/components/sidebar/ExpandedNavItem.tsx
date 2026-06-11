"use client"
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";
import { NavItem } from "./nav.config";

export default function ExpandedNavItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;

  const isGroupActive =
    hasChildren && item.children!.some((c) => pathname.startsWith(c.href));
  const [open, setOpen] = useState(isGroupActive);

  useEffect(() => {
    if (isGroupActive) setOpen(true);
  }, [isGroupActive]);

  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={clsx(
          "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium",
          "transition-all duration-150",
          isActive
            ? "text-gold bg-gold/10"
            : "text-white/50 hover:text-gold hover:bg-white/5",
        )}
      >
        <Icon
          size={16}
          className={clsx(
            "shrink-0 transition-colors duration-150",
            isActive ? "text-gold" : "text-white/40 group-hover:text-gold",
          )}
        />
        <span>{item.label}</span>
        {isActive && (
          <motion.span
            layoutId="activeIndicator"
            className="ml-auto w-1 h-4 rounded-full bg-gold"
          />
        )}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13.5px] font-medium",
          "transition-all duration-150",
          isGroupActive
            ? "text-gold bg-gold/10"
            : "text-white/50 hover:text-gold hover:bg-white/5",
        )}
      >
        <Icon size={16} className="shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          className="opacity-50"
        >
          <ChevronRight size={14} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-4 pl-3 border-l border-white/10 mt-0.5 mb-1 space-y-0.5">
              {item.children!.map((child) => {
                const CIcon = child.icon;
                const childActive =
                  pathname === child.href ||
                  pathname.startsWith(child.href + "/");
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onNavigate}
                    className={clsx(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm",
                      "transition-all duration-150",
                      childActive
                        ? "text-gold bg-gold/10"
                        : "text-white/45 hover:text-gold hover:bg-white/5",
                    )}
                  >
                    <CIcon size={13} className="shrink-0" />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
