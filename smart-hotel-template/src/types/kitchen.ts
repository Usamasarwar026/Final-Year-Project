// src/types/kitchen.ts
// ─── Enums & Literals ────────────────────────────────────────────────────────
export type FoodOrderStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "Assigned"
  | "OutForDelivery"
  | "Delivered"
  | "Cancelled"
  | "Rejected";
export type KitchenTaskStatus = "Assigned" | "Accepted" | "InProgress" | "Completed";
export type OrderType = "RoomService" | "Restaurant";
export const ORDER_TYPES: OrderType[] = ["RoomService", "Restaurant"];
export const ORDER_STATUSES: FoodOrderStatus[] = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
  "Assigned",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
  "Rejected",
];
export const KITCHEN_TASK_STATUSES: KitchenTaskStatus[] = [
  "Assigned",
  "Accepted",
  "InProgress",
  "Completed",
];
// ─── Configs ──────────────────────────────────────────────────────────────────
export const ORDER_STATUS_CONFIG: Record<
  FoodOrderStatus,
  { label: string; color: string; bg: string; border: string; dot: string; step: number }
> = {
  Pending: {
    label: "Pending",
    color: "text-blue-700",
    bg: "bg-blue-50/50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    step: 0,
  },
  Accepted: {
    label: "Accepted",
    color: "text-indigo-700",
    bg: "bg-indigo-50/50",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
    step: 1,
  },
  Preparing: {
    label: "Preparing",
    color: "text-amber-700",
    bg: "bg-amber-50/50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    step: 2,
  },
  Ready: {
    label: "Ready",
    color: "text-teal-700",
    bg: "bg-teal-50/50",
    border: "border-teal-200",
    dot: "bg-teal-500",
    step: 3,
  },
  Assigned: {
    label: "Staff Assigned",
    color: "text-purple-700",
    bg: "bg-purple-50/50",
    border: "border-purple-200",
    dot: "bg-purple-500",
    step: 4,
  },
  OutForDelivery: {
    label: "Out for Delivery",
    color: "text-orange-700",
    bg: "bg-orange-50/50",
    border: "border-orange-200",
    dot: "bg-orange-500",
    step: 5,
  },
  Delivered: {
    label: "Delivered",
    color: "text-green-700",
    bg: "bg-green-50/50",
    border: "border-green-200",
    dot: "bg-green-500",
    step: 6,
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50/50",
    border: "border-red-200",
    dot: "bg-red-500",
    step: -1,
  },
  Rejected: {
    label: "Rejected",
    color: "text-rose-700",
    bg: "bg-rose-50/50",
    border: "border-rose-200",
    dot: "bg-rose-500",
    step: -1,
  },
};
export const ORDER_TYPE_CONFIG: Record<OrderType, { label: string; icon: string; color: string; bg: string }> = {
  RoomService: { label: "Room Service", icon: "🛎️", color: "text-blue-700", bg: "bg-blue-100" },
  Restaurant: { label: "Restaurant", icon: "🍽️", color: "text-purple-700", bg: "bg-purple-100" },
};
// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface FoodCategory {
  id:          number;
  name:        string;
  description: string | null;
  created_at:  string;
  updated_at:  string;
  foodItems?:  FoodItem[];
}
export interface FoodItem {
  id:                       number;
  name:                     string;
  category_id:              number;
  description:              string | null;
  image:                    string | null;
  price:                    number;
  preparation_time_minutes: number;
  ingredients_text:         string | null;
  availability_status:      boolean;
  featured:                 boolean;
  active:                   boolean;
  created_at:               string;
  updated_at:               string;
  category?:                FoodCategory;
}
export interface FoodOrderItem {
  id:           number;
  order_id:     number;
  food_item_id: number;
  quantity:     number;
  price:        number;
  subtotal:     number;
  special_note: string | null;
  foodItem?:    FoodItem;
}
export interface FoodOrderTimeline {
  id:         number;
  order_id:   number;
  status:     FoodOrderStatus;
  notes:      string | null;
  created_at: string;
}
export interface KitchenTask {
  id:             number;
  order_id:       number;
  assigned_to:    number | null;
  status:         KitchenTaskStatus;
  created_at:     string;
  updated_at:     string;
  order?:         FoodOrder;
  assignedStaff?: {
    staff_id:    number;
    designation: string;
    user: {
      name:  string;
      email: string;
    };
  } | null;
}
export interface FoodOrder {
  id:                   number;
  booking_id:           number | null;
  user_id:              string | null;
  customer_name:        string | null;
  order_type:           OrderType;
  table_number:         string | null;
  room_number:          string | null;
  status:               FoodOrderStatus;
  total_amount:         number;
  special_instructions: string | null;
  placed_at:            string;
  accepted_at:          string | null;
  preparing_at:         string | null;
  ready_at:             string | null;
  delivered_at:         string | null;
  created_at:           string;
  updated_at:           string;
  items:                FoodOrderItem[];
  timelines?:           FoodOrderTimeline[];
  tasks?:               KitchenTask[];
  user?:                { id: string; name: string; email: string } | null;
  booking?: {
    booking_id: number;
    room: {
      room_number: string;
      floor:       number;
      room_type:   string;
    };
  } | null;
}
// ─── Kitchen Stats ────────────────────────────────────────────────────────────
export interface KitchenStats {
  totalOrders:      number;
  pendingOrders:    number;
  preparingOrders:  number;
  readyOrders:      number;
  deliveredOrders:  number;
  revenue:          number;
  ordersByDay:      { date: string; count: number }[];
  mostOrderedFoods: { name: string; count: number }[];
  categoryPerformance: { name: string; count: number; revenue: number }[];
}
// ─── Payloads ─────────────────────────────────────────────────────────────────
export interface CreateCategoryPayload {
  name:        string;
  description?: string;
}
export interface CreateFoodItemPayload {
  name:                     string;
  category_id:              number;
  description?:             string;
  image?:                   string;
  price:                    number;
  preparation_time_minutes?: number;
  ingredients_text?:        string;
  availability_status?:     boolean;
  featured?:                boolean;
  active?:                  boolean;
}
export interface PlaceOrderPayload {
  booking_id?:          number;
  customer_name?:       string;
  order_type:           OrderType;
  table_number?:        string;
  room_number?:         string;
  special_instructions?: string;
  items: {
    food_item_id: number;
    quantity:     number;
    special_note?: string;
  }[];
}