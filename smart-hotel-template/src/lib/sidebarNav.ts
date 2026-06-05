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
  permission?: string;
  children?: NavItem[];
};

export const adminNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
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
  {
    label: "Kitchen",
    href: "/staff/kitchen",
    icon: ChefHat,
    permission: "kitchen",
  },
  {
    label: "Inventory",
    href: "/staff/inventory",
    icon: Package,
    permission: "inventory",
  },
  {
    label: "House Keeping",
    href: "/staff/housekeeping",
    icon: BrushCleaning,
    permission: "housekeeping",
  },
];

export const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", href: "/customer/booking", icon: CalendarCheck },
  { label: "Billing", href: "/customer/billing", icon: CreditCard },
];