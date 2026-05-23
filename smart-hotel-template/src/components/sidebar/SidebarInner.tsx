import clsx from "clsx";
import { NavItem } from "./nav.config";
import SidebarHeader from "./SidebarHeader";
import CollapsedNavItem from "./CollapsedNavItem";
import SidebarFooter from "./SidebarFooter";
import ExpandedNavItem from "./ExpandedNavItem";

export default function SidebarInner({
  collapsed,
  navItems,
  email,
  name,
  onNavigate,
  onToggle,
}: {
  collapsed: boolean;
  navItems: NavItem[];
  email?: string | null;
  name?: string | null;
  onNavigate?: () => void;
  onToggle?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <SidebarHeader
        collapsed={collapsed}
        name={name}
        onToggle={onToggle}
        onNavigate={onNavigate}
      />

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

      <SidebarFooter collapsed={collapsed} email={email} name={name} />
    </div>
  );
}
