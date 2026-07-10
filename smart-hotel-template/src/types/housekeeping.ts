// src/types/housekeeping.ts

// ─── Enums ────────────────────────────────────────────────────────────────────
export type TaskType =
  | "Cleaning"
  | "LaundryPickup"
  | "ServiceRequest"
  | "Maintenance";
export type TaskPriority = "Normal" | "High" | "VIP";
export type TaskStatus = "Pending" | "InProgress" | "Done" | "Cancelled";
export type CleaningStatus = "Clean" | "Dirty" | "InProgress";
export type RequestType =
  | "Towels"
  | "Laundry"
  | "RoomService"
  | "Water"
  | "Other";
export type RequestStatus = "Pending" | "Assigned" | "Completed" | "Cancelled";
export type LaundryStatus = "Pending" | "Sent" | "Returned";

// ─── Configs ──────────────────────────────────────────────────────────────────
export const TASK_TYPE_CONFIG: Record<
  TaskType,
  { label: string; icon: string; color: string; bg: string }
> = {
  Cleaning: {
    label: "Cleaning",
    icon: "🧹",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  LaundryPickup: {
    label: "Laundry Pickup",
    icon: "👕",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
  ServiceRequest: {
    label: "Service Request",
    icon: "🔔",
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  Maintenance: {
    label: "Maintenance",
    icon: "🔧",
    color: "text-red-700",
    bg: "bg-red-100",
  },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; dot: string }
> = {
  Normal: {
    label: "Normal",
    color: "text-gray-700",
    bg: "bg-gray-100",
    dot: "bg-gray-400",
  },
  High: {
    label: "High",
    color: "text-orange-700",
    bg: "bg-orange-100",
    dot: "bg-orange-500",
  },
  VIP: {
    label: "VIP",
    color: "text-rose-700",
    bg: "bg-rose-100",
    dot: "bg-rose-500",
  },
};

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  Pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  InProgress: {
    label: "In Progress",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  Done: {
    label: "Done",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400",
  },
};

export const CLEANING_STATUS_CONFIG: Record<
  CleaningStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  Clean: {
    label: "Clean",
    color: "text-green-700",
    bg: "bg-green-100",
    dot: "bg-green-500",
  },
  Dirty: {
    label: "Dirty",
    color: "text-red-700",
    bg: "bg-red-100",
    dot: "bg-red-500",
  },
  InProgress: {
    label: "In Progress",
    color: "text-blue-700",
    bg: "bg-blue-100",
    dot: "bg-blue-500",
  },
};

export const REQUEST_TYPE_CONFIG: Record<
  RequestType,
  { label: string; icon: string }
> = {
  Towels: { label: "Extra Towels", icon: "🛁" },
  Laundry: { label: "Laundry", icon: "👕" },
  RoomService: { label: "Room Service", icon: "🍽️" },
  Water: { label: "Water Bottle", icon: "💧" },
  Other: { label: "Other", icon: "📦" },
};

export const REQUEST_STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  Pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  Assigned: {
    label: "Assigned",
    color: "text-blue-700",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
  },
  Completed: {
    label: "Completed",
    color: "text-green-700",
    bg: "bg-green-50",
    dot: "bg-green-500",
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50",
    dot: "bg-red-400",
  },
};

export const LAUNDRY_STATUS_CONFIG: Record<
  LaundryStatus,
  { label: string; color: string; bg: string }
> = {
  Pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50" },
  Sent: { label: "Sent", color: "text-blue-700", bg: "bg-blue-50" },
  Returned: { label: "Returned", color: "text-green-700", bg: "bg-green-50" },
};

export const TASK_TYPES: TaskType[] = [
  "Cleaning",
  "LaundryPickup",
  "ServiceRequest",
  "Maintenance",
];
export const TASK_PRIORITIES: TaskPriority[] = ["Normal", "High", "VIP"];
export const TASK_STATUSES: TaskStatus[] = [
  "Pending",
  "InProgress",
  "Done",
  "Cancelled",
];
export const REQUEST_TYPES: RequestType[] = [
  "Towels",
  "Laundry",
  "RoomService",
  "Water",
  "Other",
];
export const LAUNDRY_STATUSES: LaundryStatus[] = [
  "Pending",
  "Sent",
  "Returned",
];

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface HousekeepingTask {
  task_id: number;
  room_id: number | null;
  assigned_to: number | null;
  booking_id: number | null;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  request_description: string | null;
  is_billable: boolean;
  charge_amount: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  room?: {
    room_number: string;
    floor: number;
    room_type: string;
    cleaning_status: CleaningStatus;
  } | null;
  assignedStaff?: {
    staff_id: number;
    designation: string;
    user: { name: string; email: string };
  } | null;
  booking?: {
    booking_id: number;
    check_in_date: string;
    check_out_date: string;
  } | null;
}

export interface ServiceRequest {
  request_id: number;
  booking_id: number;
  room_id: number;
  request_type: RequestType;
  description: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  room?: { room_number: string } | null;
  booking?: { user: { name: string } } | null;
}

export interface LaundryRecord {
  text_id: number;
  room_id: number;
  booking_id: number | null;
  item_name: string;
  quantity: number;
  sent_at: string;
  returned_at: string | null;
  charge_amount: number | null;
  status: LaundryStatus;
  room?: { room_number: string } | null;
  booking?: { user: { name: string } } | null;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface HousekeepingStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedToday: number;
  vipTasks: number;
  serviceRequests: number;
  dirtyRooms: number;
  cleanRooms: number;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────
export interface CreateTaskPayload {
  room_id?: number;
  assigned_to?: number;
  booking_id?: number;
  task_type: TaskType;
  priority: TaskPriority;
  request_description?: string;
  is_billable?: boolean;
  charge_amount?: number;
}

export interface UpdateTaskPayload {
  assigned_to?: number | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  request_description?: string;
  is_billable?: boolean;
  charge_amount?: number;
  started_at?: string;
  completed_at?: string;
}

export interface CreateLaundryPayload {
  room_id: number;
  booking_id?: number;
  item_name: string;
  quantity: number;
  charge_amount?: number;
}
