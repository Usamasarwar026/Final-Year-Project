// src/config/nav.ts
import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  Users,
  type LucideIcon,
  BedDouble,
  UserRound,
  ChefHat,
  Package,
  BarChart3,
  ClipboardCheck,
  Brush,
   Bike,
  Utensils,
  History,
  Bell,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string; // matches MODULE_PERMISSIONS key exactly
  children?: NavItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin Nav  — no permission guards, admin sees everything
// ─────────────────────────────────────────────────────────────────────────────
export const adminNav: NavItem[] = [
  { label: "Dashboard",          href: "/admin/dashboard",    icon: LayoutDashboard },
  { label: "Booking",            href: "/admin/booking",      icon: CalendarCheck   },
  { label: "Rooms",              href: "/admin/rooms",        icon: BedDouble       },
  { label: "Customer",           href: "/admin/customer",     icon: UserRound       },
  { label: "Staff Management",   href: "/admin/staff",        icon: Users           },
  // { label: "Kitchen",            href: "/admin/kitchen",      icon: ChefHat         },
  {
    label: "Kitchen Management",
    href: "/admin/kitchen",
    icon: ChefHat,
    children: [
      { label: "Dashboard",            href: "/admin/kitchen/dashboard",   icon: LayoutDashboard },
      { label: "Orders",               href: "/admin/kitchen/orders",      icon: Utensils },
      { label: "Menu Management",      href: "/admin/kitchen/menu",        icon: Package },
      { label: "Categories",           href: "/admin/kitchen/categories",  icon: ClipboardCheck },
      { label: "Kitchen Staff",        href: "/admin/kitchen/staff",       icon: Users },
      { label: "Delivery Assignments", href: "/admin/kitchen/deliveries",  icon: Bike },
      { label: "Reports",              href: "/admin/kitchen/reports",     icon: BarChart3 },
    ],
  },
  { label: "Inventory",          href: "/admin/inventory",    icon: Package         },
  { label: "House Keeping",      href: "/admin/housekeeping", icon: Brush           },
  { label: "Billing",            href: "/admin/billing",      icon: CreditCard      },
  { label: "Reports",            href: "/admin/reports",      icon: BarChart3       },
];

// ─────────────────────────────────────────────────────────────────────────────
// Staff Nav  — permission keys MUST match MODULE_PERMISSIONS keys in types/staff.ts
// Dashboard + Attendance = always visible (no permission needed)
// ─────────────────────────────────────────────────────────────────────────────
export const staffNav: NavItem[] = [
  // Always visible
  { label: "Dashboard",    href: "/staff/dashboard",    icon: LayoutDashboard },
  { label: "Attendance",   href: "/staff/attendance",   icon: ClipboardCheck  },
  // Permission-gated — key matches MODULE_PERMISSIONS
  { label: "Booking",      href: "/staff/booking",      icon: CalendarCheck,  permission: "booking"      },
  { label: "Rooms",        href: "/staff/rooms",        icon: BedDouble,      permission: "rooms"        },
  { label: "Customer",     href: "/staff/customer",     icon: UserRound,      permission: "customer"     },
  // { label: "Kitchen",      href: "/staff/kitchen",      icon: ChefHat,        permission: "kitchen"      },
   { label: "Kitchen KDS",  href: "/admin/kitchen",      icon: ChefHat,        permission: "KITCHEN_ACCESS" },
  { label: "Deliveries",   href: "/staff/delivery",     icon: Bike,           permission: "DELIVERY_ACCESS" },
  { label: "Inventory",    href: "/staff/inventory",    icon: Package,        permission: "inventory"    },
  { label: "House Keeping",href: "/staff/housekeeping", icon: Brush,          permission: "housekeeping" },
  { label: "Billing",      href: "/staff/billing",      icon: CreditCard,     permission: "billing"      },
  { label: "Reports",      href: "/staff/reports",      icon: BarChart3,      permission: "reports"      },
];

// ─────────────────────────────────────────────────────────────────────────────
// Customer Nav
// ─────────────────────────────────────────────────────────────────────────────
export const customerNav: NavItem[] = [
  { label: "Dashboard",   href: "/customer/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", href: "/customer/booking",   icon: CalendarCheck   },
  { label: "Order Food",  href: "/customer/kitchen",   icon: ChefHat         },
  { label: "Billing",     href: "/customer/billing",   icon: CreditCard      },
  { label: "Housekeeping",     href: "/customer/housekeeping",   icon: Brush      },
];