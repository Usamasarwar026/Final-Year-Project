// src/components/sidebar/nav.config.ts

import {
  LayoutDashboard,
  CalendarCheck,
  type LucideIcon,
  BedDouble,
  UserRound,
  BarChart3,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string; // must match MODULE_PERMISSIONS key
  children?: NavItem[];
};

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Booking", href: "/admin/booking", icon: CalendarCheck },
  { label: "Rooms", href: "/admin/rooms", icon: BedDouble },
  { label: "Customer", href: "/admin/customer", icon: UserRound },
];
