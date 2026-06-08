// src/types/staff.ts

// ─── Attendance ───────────────────────────────────────────────────────────────
export type AttendanceStatus = "Present" | "Absent" | "HalfDay" | "Leave";

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "Present", "Absent", "HalfDay", "Leave",
];

export const ATTENDANCE_CONFIG: Record<
  AttendanceStatus,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  Present: { label: "Present",  bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  border: "border-green-200"  },
  Absent:  { label: "Absent",   bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    border: "border-red-200"    },
  HalfDay: { label: "Half Day", bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500",  border: "border-amber-200"  },
  Leave:   { label: "On Leave", bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   border: "border-blue-200"   },
};

// ─── Dynamic Dept & Shift (from DB) ──────────────────────────────────────────
export interface DepartmentConfig {
  id:        number;
  name:      string;
  icon:      string;
  color:     string;
  bg:        string;
  is_active: boolean;
}

export interface ShiftConfig {
  id:         number;
  name:       string;
  start_time: string;
  end_time:   string;
  color:      string;
  bg:         string;
  is_active:  boolean;
}

// ─── Static fallback colors for dept badges ───────────────────────────────────
export const DEPT_FALLBACK: Record<string, { icon: string; bg: string; color: string }> = {
  Reception:    { icon: "🛎️",  bg: "bg-blue-100",   color: "text-blue-700"   },
  Housekeeping: { icon: "🧹",  bg: "bg-green-100",  color: "text-green-700"  },
  Kitchen:      { icon: "👨‍🍳", bg: "bg-orange-100", color: "text-orange-700" },
  Management:   { icon: "💼",  bg: "bg-purple-100", color: "text-purple-700" },
  Security:     { icon: "🔒",  bg: "bg-red-100",    color: "text-red-700"    },
  Other:        { icon: "👤",  bg: "bg-gray-100",   color: "text-gray-700"   },
  _default:     { icon: "👤",  bg: "bg-gray-100",   color: "text-gray-700"   },
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE PERMISSIONS
// key MUST exactly match the `permission` field in staffNav
// ─────────────────────────────────────────────────────────────────────────────
export interface ModulePermission {
  key:         string;
  label:       string;
  description: string;
  group:       string;
  icon:        string;
}

export const MODULE_PERMISSIONS: ModulePermission[] = [
  // ── General ────────────────────────────────────────────────────────────────
  { key: "booking",      label: "Booking",           description: "View and manage hotel reservations",          group: "General", icon: "📅" },
  { key: "rooms",        label: "Rooms",             description: "View room availability and status",           group: "General", icon: "🛏️" },
  { key: "customer",     label: "Customer",          description: "View and manage guest profiles",              group: "General", icon: "👤" },
  { key: "inventory",    label: "Inventory",         description: "View and manage stock items",                 group: "General", icon: "📦" },
  { key: "housekeeping", label: "House Keeping",     description: "View and manage cleaning tasks",              group: "General", icon: "🧹" },
  { key: "billing",      label: "Billing",           description: "View and process invoices",                   group: "General", icon: "💳" },
  { key: "reports",      label: "Reports",           description: "View analytics and export reports",           group: "General", icon: "📊" },

  // ── Kitchen (granular) ─────────────────────────────────────────────────────
  // Each key maps 1-to-1 with a `permission` field in staffNav kitchen children
  { key: "KITCHEN_ACCESS",             label: "Kitchen — Dashboard",       description: "View kitchen dashboard and active orders overview",      group: "Kitchen", icon: "🍳" },
  { key: "KITCHEN_ORDER_PROCESS",      label: "Kitchen — Process Orders",  description: "Accept, prepare and update status of kitchen orders",    group: "Kitchen", icon: "🥘" },
  { key: "KITCHEN_MENU_MANAGE",        label: "Kitchen — Menu Management", description: "Add, edit and remove menu items",                        group: "Kitchen", icon: "🗒️" },
  { key: "KITCHEN_CATEGORIES_MANAGE",  label: "Kitchen — Categories",      description: "Create and manage food categories",                      group: "Kitchen", icon: "🏷️" },
  { key: "KITCHEN_STAFF_MANAGE",       label: "Kitchen — Staff",           description: "View and manage kitchen staff assignments",               group: "Kitchen", icon: "👨‍🍳" },
  { key: "KITCHEN_REPORTS",            label: "Kitchen — Reports",         description: "View kitchen performance and sales reports",              group: "Kitchen", icon: "📈" },
  { key: "DELIVERY_ASSIGN",            label: "Delivery — Assign",         description: "Assign delivery tasks to staff and track all deliveries", group: "Kitchen", icon: "🛵" },
  { key: "DELIVERY_ACCESS",            label: "Delivery — My Deliveries",  description: "View and update own assigned food deliveries",            group: "Kitchen", icon: "🚴" },
];

// ─── Permissions grouped for UI picker ───────────────────────────────────────
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

// ─── Default permissions per department name ──────────────────────────────────
export const DEPT_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  Reception:    ["booking", "rooms", "customer", "billing"],
  Housekeeping: ["rooms", "housekeeping"],
  Kitchen:      ["KITCHEN_ACCESS", "KITCHEN_ORDER_PROCESS", "inventory"],
  Management:   [
    "booking", "rooms", "customer", "inventory", "housekeeping", "billing", "reports",
    "KITCHEN_ACCESS", "KITCHEN_ORDER_PROCESS",
    "KITCHEN_MENU_MANAGE", "KITCHEN_CATEGORIES_MANAGE",
    "KITCHEN_STAFF_MANAGE", "KITCHEN_REPORTS",
    "DELIVERY_ASSIGN", "DELIVERY_ACCESS",
  ],
  Security:     ["booking", "rooms", "customer"],
  Other:        [],
};

// ─── Core interfaces ──────────────────────────────────────────────────────────
export interface StaffUser {
  id:             string;
  name:           string;
  email:          string;
  phoneNumber?:   string | null;
  profileImage?:  string | null;
  address?:       string | null;
  city?:          string | null;
  country?:       string | null;
  cnic?:          string | null;
  dateOfBirth?:   string | null;
  role:           string;
  employeeId?:    string | null;
  permissions:    string[];
  isActive:       boolean;
  isVerified:     boolean;
  lastLogin?:     string | null;
  createdAt:      string;
  staffProfile?:  StaffProfile | null;
  todayAttendance?: AttendanceLog | null;
}

export interface StaffProfile {
  staff_id:           number;
  user_id:            string;
  cnic?:              string | null;
  department_id?:     number | null;
  shift_id?:          number | null;
  designation:        string;
  joining_date?:      string | null;
  basic_salary?:      number | null;
  attendance_status?: AttendanceStatus | null;
  performance_notes?: string | null;
  is_on_duty:         boolean;
  is_active:          boolean;
  created_at:         string;
  department?:        DepartmentConfig | null;
  shift?:             ShiftConfig | null;
}

export interface AttendanceLog {
  id:         number;
  staff_id:   number;
  user_id:    string;
  date:       string;
  status:     AttendanceStatus;
  check_in?:  string | null;
  check_out?: string | null;
  hours?:     number | null;
  notes?:     string | null;
  created_at?: string;
}

export interface CreateStaffPayload {
  name:          string;
  email:         string;
  phoneNumber?:  string;
  cnic?:         string;
  dateOfBirth?:  string;
  address?:      string;
  city?:         string;
  country?:      string;
  department_id: number;
  designation:   string;
  shift_id:      number;
  joining_date?: string;
  basic_salary?: number;
  permissions:   string[];
}

export interface UpdateStaffPayload {
  name?:              string;
  phoneNumber?:       string;
  address?:           string;
  city?:              string;
  country?:           string;
  department_id?:     number;
  designation?:       string;
  shift_id?:          number;
  joining_date?:      string;
  basic_salary?:      number;
  performance_notes?: string;
  is_on_duty?:        boolean;
  isActive?:          boolean;
  permissions?:       string[];
}