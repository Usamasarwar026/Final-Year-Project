import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { WebsiteName } from "@/constant/constant";

export default function SidebarHeader({
  collapsed,
  name,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  name?: string | null;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const initials = WebsiteName
    ? WebsiteName.split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 1)
        .toUpperCase()
    : "";
  return (
    <div
      className={clsx(
        "shrink-0 border-b border-white/10",
        collapsed
          ? "flex flex-col items-center gap-2 px-2 pt-5 pb-4"
          : "px-4 pt-5 pb-4",
      )}
    >
      {!collapsed ? (
        <div className="flex items-start gap-3">
          {/* Circle avatar */}
          <div
            className="w-10 h-10 rounded-full border-2 border-gold/50 flex items-center justify-center
                          text-gold text-sm font-bold shrink-0 bg-gold/10"
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-white text-[15px] font-semibold leading-tight truncate">
              {WebsiteName ?? name}
            </p>
            <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.15em] mt-0.5">
              Admin Console
            </p>
          </div>

          {/* Desktop toggle */}
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all duration-150 mt-0.5"
            >
              <Menu size={16} />
            </button>
          )}
          {/* Mobile close */}
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all duration-150 mt-0.5"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className="w-9 h-9 rounded-full border-2 border-gold/50 flex items-center justify-center
                         text-gold text-xs font-bold bg-gold/10"
          >
            {initials}
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all duration-150"
            >
              <Menu size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
