// src/types/kitchen.ts

// ─── Enums ────────────────────────────────────────────────────────────────────
export type FoodCategory  = "Breakfast" | "Lunch" | "Dinner" | "Snacks" | "Beverages" | "Special";
export type OrderType     = "RoomService" | "Restaurant";
export type OrderStatus   = "Placed" | "Accepted" | "Preparing" | "Ready" | "OutForDelivery" | "Delivered" | "Cancelled";
export type OrderPriority = "Normal" | "High" | "VIP";

export const FOOD_CATEGORIES: FoodCategory[] = ["Breakfast", "Lunch", "Dinner", "Snacks", "Beverages", "Special"];
export const ORDER_TYPES:     OrderType[]     = ["RoomService", "Restaurant"];
export const ORDER_STATUSES:  OrderStatus[]   = ["Placed","Accepted","Preparing","Ready","OutForDelivery","Delivered","Cancelled"];
export const ORDER_PRIORITIES: OrderPriority[] = ["Normal", "High", "VIP"];

// ─── Configs ──────────────────────────────────────────────────────────────────
export const CATEGORY_CONFIG: Record<FoodCategory, { label: string; icon: string; color: string; bg: string }> = {
  Breakfast:  { label: "Breakfast",  icon: "🍳", color: "text-amber-700",  bg: "bg-amber-100"  },
  Lunch:      { label: "Lunch",      icon: "🍱", color: "text-green-700",  bg: "bg-green-100"  },
  Dinner:     { label: "Dinner",     icon: "🍽️", color: "text-purple-700", bg: "bg-purple-100" },
  Snacks:     { label: "Snacks",     icon: "🍟", color: "text-orange-700", bg: "bg-orange-100" },
  Beverages:  { label: "Beverages",  icon: "☕", color: "text-blue-700",   bg: "bg-blue-100"   },
  Special:    { label: "Chef Special",icon: "⭐", color: "text-rose-700",  bg: "bg-rose-100"   },
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string; color: string; bg: string; border: string; dot: string; step: number;
}> = {
  Placed:         { label: "Order Placed",    color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500",   step: 0 },
  Accepted:       { label: "Accepted",        color: "text-indigo-700", bg: "bg-indigo-50",  border: "border-indigo-200", dot: "bg-indigo-500", step: 1 },
  Preparing:      { label: "Preparing",       color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-500",  step: 2 },
  Ready:          { label: "Ready",           color: "text-teal-700",   bg: "bg-teal-50",    border: "border-teal-200",   dot: "bg-teal-500",   step: 3 },
  OutForDelivery: { label: "Out for Delivery",color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200", dot: "bg-orange-500", step: 4 },
  Delivered:      { label: "Delivered",       color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  dot: "bg-green-500",  step: 5 },
  Cancelled:      { label: "Cancelled",       color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200",    dot: "bg-red-500",    step: -1},
};

export const PRIORITY_CONFIG: Record<OrderPriority, { label: string; color: string; bg: string; dot: string }> = {
  Normal: { label: "Normal", color: "text-gray-700",  bg: "bg-gray-100",  dot: "bg-gray-400"  },
  High:   { label: "High",   color: "text-orange-700",bg: "bg-orange-100",dot: "bg-orange-500"},
  VIP:    { label: "VIP",    color: "text-rose-700",  bg: "bg-rose-100",  dot: "bg-rose-500"  },
};

export const ORDER_TYPE_CONFIG: Record<OrderType, { label: string; icon: string; color: string; bg: string }> = {
  RoomService: { label: "Room Service", icon: "🛎️", color: "text-blue-700",   bg: "bg-blue-100"   },
  Restaurant:  { label: "Restaurant",  icon: "🍽️", color: "text-purple-700", bg: "bg-purple-100" },
};

// Status flow for KDS actions
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  Placed:         "Accepted",
  Accepted:       "Preparing",
  Preparing:      "Ready",
  Ready:          "OutForDelivery",
  OutForDelivery: "Delivered",
};

export const STATUS_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  Placed:         "Accept Order",
  Accepted:       "Start Preparing",
  Preparing:      "Mark Ready",
  Ready:          "Out for Delivery",
  OutForDelivery: "Mark Delivered",
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface MenuItem {
  menu_item_id:     number;
  name:             string;
  description:      string | null;
  category:         FoodCategory;
  price:            number;
  prep_time_minutes: number;
  is_available:     boolean;
  is_vegetarian:    boolean;
  is_vip_special:   boolean;
  is_halal:         boolean;
  image_url:        string | null;
  calories:         number | null;
  created_at:       string;
  updated_at:       string;
}

export interface OrderItem {
  id:           number;
  order_id:     number;
  menu_item_id: number;
  quantity:     number;
  unit_price:   number;
  subtotal:     number;
  special_note: string | null;
  menuItem:     MenuItem;
}

export interface FoodOrder {
  order_id:             number;
  booking_id:           number | null;
  user_id:              string;
  order_type:           OrderType;
  table_number:         string | null;
  status:               OrderStatus;
  priority:             OrderPriority;
  total_amount:         number;
  is_billed:            boolean;
  special_instructions: string | null;
  placed_at:            string;
  accepted_at:          string | null;
  preparing_at:         string | null;
  ready_at:             string | null;
  delivered_at:         string | null;
  created_at:           string;
  updated_at:           string;
  // Relations
  items:   OrderItem[];
  user?:   { id: string; name: string; email: string } | null;
  booking?: {
    booking_id: number;
    room: { room_number: string; floor: number; room_type: string };
  } | null;
}

// ─── Kitchen Stats ────────────────────────────────────────────────────────────
export interface KitchenStats {
  totalToday:     number;
  pending:        number;    // Placed + Accepted
  preparing:      number;
  ready:          number;
  deliveredToday: number;
  cancelledToday: number;
  revenueToday:   number;
  avgPrepTime:    number;    // minutes
}

// ─── Payloads ─────────────────────────────────────────────────────────────────
export interface CreateMenuItemPayload {
  name:             string;
  description?:     string;
  category:         FoodCategory;
  price:            number;
  prep_time_minutes?: number;
  is_vegetarian?:   boolean;
  is_vip_special?:  boolean;
  is_halal?:        boolean;
  calories?:        number;
}

export interface UpdateMenuItemPayload extends Partial<CreateMenuItemPayload> {
  is_available?: boolean;
}

export interface CartItem {
  menu_item_id: number;
  quantity:     number;
  special_note?: string;
  menuItem:     MenuItem;
}

export interface PlaceOrderPayload {
  booking_id?:          number;
  order_type:           OrderType;
  table_number?:        string;
  special_instructions?: string;
  items: {
    menu_item_id: number;
    quantity:     number;
    special_note?: string;
  }[];
}