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

// ─── Module Permissions (key must match staffNav permission field) ─────────────
export interface ModulePermission {
  key:         string;
  label:       string;
  description: string;
  href:        string;
  icon:        string;
}

export const MODULE_PERMISSIONS: ModulePermission[] = [
  { key: "booking",      label: "Booking",      description: "View and manage hotel reservations", href: "/staff/booking",      icon: "📅" },
  { key: "rooms",        label: "Rooms",        description: "View room availability and status",  href: "/staff/rooms",        icon: "🛏️" },
  { key: "customer",     label: "Customer",     description: "View and manage guest profiles",     href: "/staff/customer",     icon: "👤" },
  { key: "kitchen",      label: "Kitchen",      description: "View and manage food orders",        href: "/staff/kitchen",      icon: "👨‍🍳" },
  { key: "inventory",    label: "Inventory",    description: "View and manage stock items",        href: "/staff/inventory",    icon: "📦" },
  { key: "housekeeping", label: "House Keeping",description: "View and manage cleaning tasks",     href: "/staff/housekeeping", icon: "🧹" },
  { key: "billing",      label: "Billing",      description: "View and process invoices",          href: "/staff/billing",      icon: "💳" },
  { key: "reports",      label: "Reports",      description: "View analytics and export reports",  href: "/staff/reports",      icon: "📊" },
];

// Default permissions per department name
export const DEPT_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  Reception:    ["booking", "rooms", "customer", "billing"],
  Housekeeping: ["rooms", "housekeeping"],
  Kitchen:      ["kitchen", "inventory"],
  Management:   ["booking", "rooms", "customer", "kitchen", "inventory", "housekeeping", "billing", "reports"],
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

// ─── Payloads ─────────────────────────────────────────────────────────────────
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