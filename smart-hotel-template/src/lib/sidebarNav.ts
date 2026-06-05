// lib/sidebarNav.ts
import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  BedDouble,
  Users,
  UserRound,
  ChefHat,
  Package,
  BrushCleaning,
  BarChart3,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string; // staff ke liye permission key
  children?: NavItem[]; // nested routes
};

export const adminNav: NavItem[] = [
  // Overview
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },

  // Booking & Rooms
  {
    label: "Booking",
    href: "/admin/booking",
    icon: CalendarCheck,
  },
  {
    label: "Rooms",
    href: "/admin/rooms",
    icon: BedDouble,
  },

  // Customer & Staff
  {
    label: "Customer",
    href: "/admin/customer",
    icon: UserRound,
  },
  {
    label: "Staff Management",
    href: "/admin/staff",
    icon: Users,
  },

  // Operations
  {
    label: "Kitchen",
    href: "/admin/kitchen",
    icon: ChefHat,
  },
  {
    label: "Inventory Management",
    href: "/admin/inventory",
    icon: Package,
  },
  {
    label: "House Keeping",
    href: "/admin/housekeeping",
    icon: BrushCleaning,
  },

  // Finance
  {
    label: "Billing",
    href: "/admin/billing",
    icon: CreditCard,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
];
export const staffNav: NavItem[] = [
  { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
  {
    label: "Bookings",
    href: "/staff/booking",
    icon: CalendarCheck,
    permission: "booking",
  },
  {
    label: "Billing",
    href: "/staff/billing",
    icon: CreditCard,
    permission: "billing",
  },
];

export const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", href: "/customer/booking", icon: CalendarCheck },
  { label: "Billing", href: "/customer/billing", icon: CreditCard },
];
