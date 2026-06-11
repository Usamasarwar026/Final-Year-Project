import clsx from "clsx";
import { NavItem } from "./nav.config";
import SidebarHeader from "./SidebarHeader";
import CollapsedNavItem from "./CollapsedNavItem";
import SidebarFooter from "./SidebarFooter";
import ExpandedNavItem from "./ExpandedNavItem";

function NavSkeleton({ collapsed }: { collapsed: boolean }) {
  const items = [1, 2, 3, 4, 5];
  return (
    <div
      className={clsx(
        "flex-1 py-3 space-y-1 animate-pulse",
        collapsed ? "px-2" : "px-3",
      )}
    >
      {items.map((i) => (
        <div
          key={i}
          className={clsx(
            "rounded-lg bg-white/5",
            collapsed ? "w-10 h-10 mx-auto" : "h-10 w-full",
          )}
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

export default function SidebarInner({
  collapsed,
  navItems,
  email,
  name,
  role,
  onNavigate,
  onToggle,
  loading,
}: {
  collapsed: boolean;
  navItems: NavItem[];
  email?: string | null;
  name?: string | null;
  role?: string;
  onNavigate?: () => void;
  onToggle?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <SidebarHeader
        collapsed={collapsed}
        name={name}
        role={role}
        onToggle={onToggle}
        onNavigate={onNavigate}
      />

      {loading ? (
        <NavSkeleton collapsed={collapsed} />
      ) : (
        <nav
          className={clsx(
            "flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5",
            collapsed ? "px-2 items-center" : "px-3",
          )}
          style={{ scrollbarWidth: "none" }}
        >
          {navItems.map((item) =>
            collapsed ? (
              <CollapsedNavItem key={item.href} item={item} />
            ) : (
              <ExpandedNavItem
                key={item.href}
                item={item}
                onNavigate={onNavigate}
              />
            ),
          )}
        </nav>
      )}

      <SidebarFooter collapsed={collapsed} email={email} name={name} />
    </div>
  );
}