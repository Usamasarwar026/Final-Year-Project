import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  ShoppingBag,
  FileText,
  Users,
  type LucideIcon,
  BedDouble,
  UserRound,
  ChefHat,
  Package,
  BrushCleaning,
  BarChart3,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  children?: NavItem[];
};

// ─────────────────────────────────────────
// Nav Configs
// ─────────────────────────────────────────
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
  {
    label: "Orders",
    href: "/staff/orders",
    icon: ShoppingBag,
    permission: "orders",
  },
  {
    label: "Reports",
    href: "/staff/reports",
    icon: FileText,
    permission: "reports",
  },
];

export const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", href: "/customer/bookings", icon: CalendarCheck },
  { label: "Billing", href: "/customer/billing", icon: CreditCard },
  { label: "Orders", href: "/customer/orders", icon: ShoppingBag },
];
