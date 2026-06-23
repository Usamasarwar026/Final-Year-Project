// src/lib/staffPermissions.ts

export interface ModulePermission {
  key:         string;
  label:       string;
  description: string;
  group:       string;
  icon:        string;
}

export const MODULE_PERMISSIONS: ModulePermission[] = [
  // ── General ──────────────────────────────────────────────────
  { key: "booking",      label: "Booking",       description: "View and manage hotel reservations", group: "General", icon: "📅" },
  { key: "rooms",        label: "Rooms",         description: "View room availability and status",  group: "General", icon: "🛏️" },
  { key: "customer",     label: "Customer",      description: "View and manage guest profiles",     group: "General", icon: "👤" },
  { key: "inventory",    label: "Inventory",     description: "View and manage stock items",        group: "General", icon: "📦" },
  { key: "housekeeping", label: "House Keeping", description: "View and manage cleaning tasks",     group: "General", icon: "🧹" },
  { key: "billing",      label: "Billing",       description: "View and process invoices",          group: "General", icon: "💳" },

  // ── Reports ───────────────────────────────────────────────────
  { key: "REPORTS_ACCESS",    label: "Reports — Dashboard",         description: "View KPI dashboard and overall analytics",     group: "Reports", icon: "📊" },
  { key: "REPORTS_REVENUE",   label: "Reports — Revenue",           description: "View revenue reports and financial analytics",  group: "Reports", icon: "💰" },
  { key: "REPORTS_OCCUPANCY", label: "Reports — Occupancy",         description: "View room occupancy reports",                  group: "Reports", icon: "🛏️" },
  { key: "REPORTS_STAFF",     label: "Reports — Staff Performance", description: "View staff performance and attendance reports", group: "Reports", icon: "👥" },
  { key: "REPORTS_INVENTORY", label: "Reports — Inventory",         description: "View inventory usage and stock reports",        group: "Reports", icon: "📦" },
  { key: "REPORTS_BOOKINGS",  label: "Reports — Bookings",          description: "View booking trends and reservation reports",   group: "Reports", icon: "📅" },
  { key: "REPORTS_GUESTS",    label: "Reports — Guests",            description: "View guest profiles and visit history reports", group: "Reports", icon: "👤" },
  { key: "REPORTS_SCHEDULED", label: "Reports — Scheduled",         description: "View and manage scheduled report exports",      group: "Reports", icon: "🕐" },

  // ── Kitchen ───────────────────────────────────────────────────
  { key: "KITCHEN_ACCESS",            label: "Kitchen — Dashboard",       description: "View kitchen dashboard and active orders overview",      group: "Kitchen", icon: "🍳" },
  { key: "KITCHEN_ORDER_PROCESS",     label: "Kitchen — Process Orders",  description: "Accept, prepare and update status of kitchen orders",    group: "Kitchen", icon: "🥘" },
  { key: "KITCHEN_MENU_MANAGE",       label: "Kitchen — Menu Management", description: "Add, edit and remove menu items",                        group: "Kitchen", icon: "🗒️" },
  { key: "KITCHEN_CATEGORIES_MANAGE", label: "Kitchen — Categories",      description: "Create and manage food categories",                      group: "Kitchen", icon: "🏷️" },
  { key: "KITCHEN_STAFF_MANAGE",      label: "Kitchen — Staff",           description: "View and manage kitchen staff assignments",               group: "Kitchen", icon: "👨‍🍳" },
  { key: "KITCHEN_REPORTS",           label: "Kitchen — Reports",         description: "View kitchen performance and sales reports",              group: "Kitchen", icon: "📈" },
  { key: "DELIVERY_ASSIGN",           label: "Delivery — Assign",         description: "Assign delivery tasks to staff and track all deliveries", group: "Kitchen", icon: "🛵" },
  { key: "DELIVERY_ACCESS",           label: "Delivery — My Deliveries",  description: "View and update own assigned food deliveries",            group: "Kitchen", icon: "🚴" },
];

// ── Grouped for UI picker ─────────────────────────────────────
export interface PermissionGroup {
  group:       string;
  permissions: ModulePermission[];
}

export function getGroupedPermissions(): PermissionGroup[] {
  const map: Record<string, ModulePermission[]> = {};
  for (const p of MODULE_PERMISSIONS) {
    if (!map[p.group]) map[p.group] = [];
    map[p.group].push(p);
  }
  return Object.entries(map).map(([group, permissions]) => ({ group, permissions }));
}

// ── Default permissions per department ───────────────────────
export const DEPT_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  Reception:    ["booking", "rooms", "customer", "billing"],
  Housekeeping: ["rooms", "housekeeping"],
  Kitchen:      ["KITCHEN_ACCESS", "KITCHEN_ORDER_PROCESS", "inventory"],
  Management:   [
    "booking", "rooms", "customer", "inventory", "housekeeping", "billing",
    "REPORTS_ACCESS", "REPORTS_REVENUE", "REPORTS_OCCUPANCY", "REPORTS_STAFF",
    "REPORTS_INVENTORY", "REPORTS_BOOKINGS", "REPORTS_GUESTS", "REPORTS_SCHEDULED",
    "KITCHEN_ACCESS", "KITCHEN_ORDER_PROCESS", "KITCHEN_MENU_MANAGE",
    "KITCHEN_CATEGORIES_MANAGE", "KITCHEN_STAFF_MANAGE", "KITCHEN_REPORTS",
    "DELIVERY_ASSIGN", "DELIVERY_ACCESS",
  ],
  Security:     ["booking", "rooms", "customer"],
  Other:        [],
};