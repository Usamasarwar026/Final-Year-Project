// src/config/nav.ts

import {
  LayoutDashboard, CalendarCheck, CreditCard, Users,
  type LucideIcon, BedDouble, UserRound, ChefHat, Package,
  BarChart3, ClipboardCheck, Brush, Bike, Utensils,
  ShoppingCart, Truck, MenuSquare, Tags, UsersRound, TrendingUp,
} from "lucide-react";

export type NavItem = {
  label:       string;
  href:        string;
  icon:        LucideIcon;
  permission?: string;   // must match MODULE_PERMISSIONS key
  children?:  NavItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN NAV — full access, no permission checks
// ─────────────────────────────────────────────────────────────────────────────
export const adminNav: NavItem[] = [
  { label: "Dashboard",        href: "/admin/dashboard",   icon: LayoutDashboard },
  { label: "Booking",          href: "/admin/booking",     icon: CalendarCheck   },
  { label: "Rooms",            href: "/admin/rooms",       icon: BedDouble       },
  { label: "Customer",         href: "/admin/customer",    icon: UserRound       },
  { label: "Staff Management", href: "/admin/staff",       icon: Users           },
  {
    label: "Kitchen Management",
    href:  "/admin/kitchen",
    icon:  ChefHat,
    children: [
      { label: "Dashboard",            href: "/admin/kitchen/dashboard",   icon: LayoutDashboard },
      { label: "Orders",               href: "/admin/kitchen/orders",      icon: Utensils        },
      { label: "Menu Management",      href: "/admin/kitchen/menu",        icon: MenuSquare      },
      { label: "Categories",           href: "/admin/kitchen/categories",  icon: Tags            },
      { label: "Kitchen Staff",        href: "/admin/kitchen/staff",       icon: UsersRound      },
      { label: "Delivery Assignments", href: "/admin/kitchen/deliveries",  icon: Bike            },
      { label: "Reports",              href: "/admin/kitchen/reports",     icon: TrendingUp      },
    ],
  },
  { label: "Inventory",        href: "/admin/inventory",    icon: Package  },
  { label: "House Keeping",    href: "/admin/housekeeping", icon: Brush    },
  { label: "Billing",          href: "/admin/billing",      icon: CreditCard },
  { label: "Reports",          href: "/admin/reports",      icon: BarChart3  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STAFF NAV — permission-gated
// Each `permission` value MUST match a key in MODULE_PERMISSIONS
// Attendance is always shown (no permission needed)
// ─────────────────────────────────────────────────────────────────────────────
export const staffNav: NavItem[] = [
  // Always visible
  { label: "Dashboard",  href: "/staff/dashboard",  icon: LayoutDashboard },
  { label: "Attendance", href: "/staff/attendance", icon: ClipboardCheck  },

  // General modules
  { label: "Booking",     href: "/staff/booking",     icon: CalendarCheck, permission: "booking"      },
  { label: "Rooms",       href: "/staff/rooms",       icon: BedDouble,     permission: "rooms"        },
  { label: "Customer",    href: "/staff/customer",    icon: UserRound,     permission: "customer"     },
  { label: "Inventory",   href: "/staff/inventory",   icon: Package,       permission: "inventory"    },
  { label: "House Keeping",href:"/staff/housekeeping",icon: Brush,         permission: "housekeeping" },
  { label: "Billing",     href: "/staff/billing",     icon: CreditCard,    permission: "billing"      },
  { label: "Reports",     href: "/staff/reports",     icon: BarChart3,     permission: "reports"      },

  // ── Kitchen module — the parent guard is KITCHEN_ACCESS ──────────────────
  // A staff sees the Kitchen menu only if they have at least KITCHEN_ACCESS.
  // Each child is individually guarded; the sidebar filters children too.
  {
    label:      "Kitchen",
    href:       "/staff/kitchen",
    icon:       ChefHat,
    permission: "KITCHEN_ACCESS",          // parent guard
    children: [
      {
        label:      "Dashboard",
        href:       "/staff/kitchen/dashboard",
        icon:       LayoutDashboard,
        permission: "KITCHEN_ACCESS",
      },
      {
        label:      "Orders",
        href:       "/staff/kitchen/orders",
        icon:       Utensils,
        permission: "KITCHEN_ORDER_PROCESS",
      },
      {
        label:      "Menu Management",
        href:       "/staff/kitchen/menu",
        icon:       MenuSquare,
        permission: "KITCHEN_MENU_MANAGE",
      },
      {
        label:      "Categories",
        href:       "/staff/kitchen/categories",
        icon:       Tags,
        permission: "KITCHEN_CATEGORIES_MANAGE",
      },
      {
        label:      "Kitchen Staff",
        href:       "/staff/kitchen/staff",
        icon:       UsersRound,
        permission: "KITCHEN_STAFF_MANAGE",
      },
      {
        label:      "Delivery Assignments",
        href:       "/staff/kitchen/deliveries",
        icon:       Bike,
        permission: "DELIVERY_ASSIGN",
      },
      {
        label:      "My Deliveries",
        href:       "/staff/kitchen/my-deliveries",
        icon:       Truck,
        permission: "DELIVERY_ACCESS",
      },
      {
        label:      "Reports",
        href:       "/staff/kitchen/reports",
        icon:       TrendingUp,
        permission: "KITCHEN_REPORTS",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER NAV
// ─────────────────────────────────────────────────────────────────────────────
export const customerNav: NavItem[] = [
  { label: "Dashboard",    href: "/customer/dashboard",        icon: LayoutDashboard },
  { label: "My Bookings",  href: "/customer/booking",          icon: CalendarCheck   },
  { label: "Order Food",   href: "/customer/kitchen",          icon: ShoppingCart    },
  { label: "Billing",      href: "/customer/billing",          icon: CreditCard      },
  { label: "Housekeeping", href: "/customer/housekeeping",     icon: Brush           },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — filter staffNav by user's permissions
// ─────────────────────────────────────────────────────────────────────────────
export function filterStaffNavByPermissions(userPermissions: string[]): NavItem[] {
  function filter(items: NavItem[]): NavItem[] {
    return items
      .map((item) => {
        // Items without permission are always shown
        if (item.permission && !userPermissions.includes(item.permission)) return null;

        if (item.children) {
          const filteredChildren = filter(item.children);
          // If the parent has a permission AND all children got filtered out, hide the parent too
          if (filteredChildren.length === 0 && item.permission) return null;
          return { ...item, children: filteredChildren.length ? filteredChildren : undefined };
        }

        return item;
      })
      .filter(Boolean) as NavItem[];
  }

  return filter(staffNav);
}