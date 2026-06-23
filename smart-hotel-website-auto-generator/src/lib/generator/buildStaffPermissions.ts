// src/lib/generator/buildStaffPermissions.ts

import type { ModuleId } from "./moduleFiles";

// ── Per-module permission definitions ────────────────────────
const GENERAL_PERMISSIONS: Partial<Record<ModuleId, {
  key: string; label: string; description: string; icon: string;
}>> = {
  booking:      { key: "booking",      label: "Booking",       description: "View and manage hotel reservations", icon: "📅" },
  rooms:        { key: "rooms",        label: "Rooms",         description: "View room availability and status",  icon: "🛏️" },
  customer:     { key: "customer",     label: "Customer",      description: "View and manage guest profiles",     icon: "👤" },
  inventory:    { key: "inventory",    label: "Inventory",     description: "View and manage stock items",        icon: "📦" },
  housekeeping: { key: "housekeeping", label: "House Keeping", description: "View and manage cleaning tasks",     icon: "🧹" },
  billing:      { key: "billing",      label: "Billing",       description: "View and process invoices",          icon: "💳" },
};

const REPORTS_PERMISSIONS = [
  { key: "REPORTS_ACCESS",    label: "Reports — Dashboard",         description: "View KPI dashboard and overall analytics",     icon: "📊" },
  { key: "REPORTS_REVENUE",   label: "Reports — Revenue",           description: "View revenue reports and financial analytics",  icon: "💰" },
  { key: "REPORTS_OCCUPANCY", label: "Reports — Occupancy",         description: "View room occupancy reports",                  icon: "🛏️" },
  { key: "REPORTS_STAFF",     label: "Reports — Staff Performance", description: "View staff performance and attendance reports", icon: "👥" },
  { key: "REPORTS_INVENTORY", label: "Reports — Inventory",         description: "View inventory usage and stock reports",        icon: "📦" },
  { key: "REPORTS_BOOKINGS",  label: "Reports — Bookings",          description: "View booking trends and reservation reports",   icon: "📅" },
  { key: "REPORTS_GUESTS",    label: "Reports — Guests",            description: "View guest profiles and visit history reports", icon: "👤" },
  { key: "REPORTS_SCHEDULED", label: "Reports — Scheduled",         description: "View and manage scheduled report exports",      icon: "🕐" },
];

const KITCHEN_PERMISSIONS = [
  { key: "KITCHEN_ACCESS",            label: "Kitchen — Dashboard",       description: "View kitchen dashboard and active orders overview",      icon: "🍳" },
  { key: "KITCHEN_ORDER_PROCESS",     label: "Kitchen — Process Orders",  description: "Accept, prepare and update status of kitchen orders",    icon: "🥘" },
  { key: "KITCHEN_MENU_MANAGE",       label: "Kitchen — Menu Management", description: "Add, edit and remove menu items",                        icon: "🗒️" },
  { key: "KITCHEN_CATEGORIES_MANAGE", label: "Kitchen — Categories",      description: "Create and manage food categories",                      icon: "🏷️" },
  { key: "KITCHEN_STAFF_MANAGE",      label: "Kitchen — Staff",           description: "View and manage kitchen staff assignments",               icon: "👨‍🍳" },
  { key: "KITCHEN_REPORTS",           label: "Kitchen — Reports",         description: "View kitchen performance and sales reports",              icon: "📈" },
  { key: "DELIVERY_ASSIGN",           label: "Delivery — Assign",         description: "Assign delivery tasks to staff and track all deliveries", icon: "🛵" },
  { key: "DELIVERY_ACCESS",           label: "Delivery — My Deliveries",  description: "View and update own assigned food deliveries",            icon: "🚴" },
];

// ── Main builder ──────────────────────────────────────────────
export function buildStaffPermissionsFile(modules: ModuleId[]): string {
  const generalOrder: ModuleId[] = ["booking", "rooms", "customer", "inventory", "housekeeping", "billing"];

  // ── Permission lines collect karo ─────────────────────────
  const lines: string[] = [];

  // General — sirf selected modules
  for (const mod of generalOrder) {
    if (!modules.includes(mod)) continue;
    const p = GENERAL_PERMISSIONS[mod];
    if (!p) continue;
    lines.push(
      `  { key: "${p.key}", label: "${p.label}", description: "${p.description}", group: "General", icon: "${p.icon}" },`,
    );
  }

  // Reports — sirf agar reports module selected hai
  if (modules.includes("reports")) {
    for (const p of REPORTS_PERMISSIONS) {
      lines.push(
        `  { key: "${p.key}", label: "${p.label}", description: "${p.description}", group: "Reports", icon: "${p.icon}" },`,
      );
    }
  }

  // Kitchen — sirf agar kitchen module selected hai
  if (modules.includes("kitchen")) {
    for (const p of KITCHEN_PERMISSIONS) {
      lines.push(
        `  { key: "${p.key}", label: "${p.label}", description: "${p.description}", group: "Kitchen", icon: "${p.icon}" },`,
      );
    }
  }

  // ── DEPT_DEFAULT_PERMISSIONS dynamic banao ────────────────
  const pick = (keys: string[]) =>
    keys.filter((k) => {
      // General permission keys — module selected hona chahiye
      if (GENERAL_PERMISSIONS[k as ModuleId]) return modules.includes(k as ModuleId);
      // REPORTS_* keys
      if (k.startsWith("REPORTS_")) return modules.includes("reports");
      // KITCHEN_* / DELIVERY_* keys
      if (k.startsWith("KITCHEN_") || k.startsWith("DELIVERY_")) return modules.includes("kitchen");
      return false;
    })
    .map((k) => `"${k}"`)
    .join(", ");

  const receptionPerms  = pick(["booking", "rooms", "customer", "billing"]);
  const housekeepingPerms = pick(["rooms", "housekeeping"]);
  const kitchenPerms    = pick(["KITCHEN_ACCESS", "KITCHEN_ORDER_PROCESS", "inventory"]);
  const securityPerms   = pick(["booking", "rooms", "customer"]);
  const mgmtPerms       = pick([
    "booking", "rooms", "customer", "inventory", "housekeeping", "billing",
    "REPORTS_ACCESS", "REPORTS_REVENUE", "REPORTS_OCCUPANCY", "REPORTS_STAFF",
    "REPORTS_INVENTORY", "REPORTS_BOOKINGS", "REPORTS_GUESTS", "REPORTS_SCHEDULED",
    "KITCHEN_ACCESS", "KITCHEN_ORDER_PROCESS", "KITCHEN_MENU_MANAGE",
    "KITCHEN_CATEGORIES_MANAGE", "KITCHEN_STAFF_MANAGE", "KITCHEN_REPORTS",
    "DELIVERY_ASSIGN", "DELIVERY_ACCESS",
  ]);

  return `// src/lib/staffPermissions.ts — Auto-generated by HotelGen
// Modules: ${modules.join(", ")}

export interface ModulePermission {
  key:         string;
  label:       string;
  description: string;
  group:       string;
  icon:        string;
}

export const MODULE_PERMISSIONS: ModulePermission[] = [
${lines.join("\n")}
];

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

export const DEPT_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  Reception:    [${receptionPerms}],
  Housekeeping: [${housekeepingPerms}],
  Kitchen:      [${kitchenPerms}],
  Management:   [${mgmtPerms}],
  Security:     [${securityPerms}],
  Other:        [],
};
`;
}