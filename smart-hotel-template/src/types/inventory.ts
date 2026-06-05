// src/types/inventory.ts

// ─── Enums ────────────────────────────────────────────────────────────────────
export type InventoryDepartment = "Kitchen" | "Housekeeping" | "Bar" | "Maintenance" | "Reception" | "General";
export type POStatus = "Pending" | "Sent" | "PartiallyReceived" | "Received" | "Cancelled";
export type WastageReason = "Expired" | "Damaged" | "Lost" | "Other";
export type AlertStatus = "Active" | "Resolved" | "Dismissed";

export const INVENTORY_DEPARTMENTS: InventoryDepartment[] = [
  "Kitchen", "Housekeeping", "Bar", "Maintenance", "Reception", "General",
];

export const PO_STATUSES: POStatus[] = [
  "Pending", "Sent", "PartiallyReceived", "Received", "Cancelled",
];

export const WASTAGE_REASONS: WastageReason[] = ["Expired", "Damaged", "Lost", "Other"];

// ─── Category ─────────────────────────────────────────────────────────────────
export interface InventoryCategory {
  id: number;
  name: string;
  description?: string | null;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: { items: number };
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  icon?: string;
}

// ─── Vendor ───────────────────────────────────────────────────────────────────
export interface InventoryVendor {
  id: number;
  name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorPayload {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateVendorPayload extends Partial<CreateVendorPayload> {
  is_active?: boolean;
}

// ─── Item Vendor (junction) ───────────────────────────────────────────────────
export interface InventoryItemVendor {
  id: number;
  item_id: number;
  vendor_id: number;
  unit_price: number;
  lead_time_days: number;
  is_preferred: boolean;
  vendor?: InventoryVendor;
}

// ─── Inventory Item ───────────────────────────────────────────────────────────
export interface InventoryItem {
  id: number;
  name: string;
  sku?: string | null;
  category_id: number;
  unit: string;
  quantity: number;
  low_stock_threshold: number;
  unit_cost: number;
  expiry_date?: string | null;
  location?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  category?: InventoryCategory;
  itemVendors?: InventoryItemVendor[];
  // computed
  is_low_stock?: boolean;
  is_expiring_soon?: boolean;
  total_value?: number;
}

export interface CreateItemPayload {
  name: string;
  sku?: string;
  category_id: number;
  unit: string;
  quantity?: number;
  low_stock_threshold?: number;
  unit_cost?: number;
  expiry_date?: string;
  location?: string;
  notes?: string;
}

export interface UpdateItemPayload extends Partial<CreateItemPayload> {
  is_active?: boolean;
}

// ─── Purchase Order ───────────────────────────────────────────────────────────
export interface PurchaseOrderItem {
  id: number;
  po_id: number;
  item_id: number;
  ordered_quantity: number;
  received_quantity: number;
  unit_price: number;
  subtotal: number;
  item?: Pick<InventoryItem, "id" | "name" | "unit" | "sku">;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_id: number;
  status: POStatus;
  ordered_by: string;
  notes?: string | null;
  total_cost: number;
  ordered_at: string;
  sent_at?: string | null;
  received_at?: string | null;
  created_at: string;
  updated_at: string;
  vendor?: InventoryVendor;
  items?: PurchaseOrderItem[];
}

export interface CreatePOPayload {
  vendor_id: number;
  notes?: string;
  items: {
    item_id: number;
    ordered_quantity: number;
    unit_price: number;
  }[];
}

export interface ReceiveStockPayload {
  items: {
    po_item_id: number;
    received_quantity: number;
  }[];
}

// ─── Usage Log ────────────────────────────────────────────────────────────────
export interface InventoryUsageLog {
  id: number;
  item_id: number;
  quantity_used: number;
  department: InventoryDepartment;
  used_by: string;
  reference_id?: string | null;
  notes?: string | null;
  used_at: string;
  created_at: string;
  item?: Pick<InventoryItem, "id" | "name" | "unit">;
}

export interface LogUsagePayload {
  item_id: number;
  quantity_used: number;
  department: InventoryDepartment;
  reference_id?: string;
  notes?: string;
}

// ─── Wastage ─────────────────────────────────────────────────────────────────
export interface WastageRecord {
  id: number;
  item_id: number;
  quantity: number;
  reason: WastageReason;
  unit_cost: number;
  total_cost: number;
  reported_by: string;
  notes?: string | null;
  wasted_at: string;
  created_at: string;
  updated_at: string;
  item?: Pick<InventoryItem, "id" | "name" | "unit">;
}

export interface CreateWastagePayload {
  item_id: number;
  quantity: number;
  reason: WastageReason;
  notes?: string;
}

// ─── Low Stock Alert ──────────────────────────────────────────────────────────
export interface LowStockAlert {
  id: number;
  item_id: number;
  current_quantity: number;
  threshold: number;
  status: AlertStatus;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  item?: Pick<InventoryItem, "id" | "name" | "unit" | "category_id"> & { category?: InventoryCategory };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface InventoryDashboardStats {
  totalItems: number;
  lowStockCount: number;
  expiringCount: number;
  pendingPOs: number;
  monthlyWastageCost: number;
  monthlyCOGS: number;
  consumptionByDepartment: { department: string; total: number }[];
  top10Items: { name: string; total_used: number }[];
  monthlyCostTrend: { month: string; cogs: number; wastage: number }[];
  categoryDistribution: { category: string; count: number; value: number }[];
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export interface ConsumptionReport {
  department: string;
  item_name: string;
  unit: string;
  total_used: number;
  period: string;
}

export interface COGSReport {
  department: string;
  total_cost: number;
  month: string;
}

export interface WastageReport {
  reason: WastageReason;
  item_name: string;
  quantity: number;
  total_cost: number;
  month: string;
}

// ─── Permissions ──────────────────────────────────────────────────────────────
export const INVENTORY_PERMISSIONS = {
  VIEW: "INVENTORY_VIEW",
  MANAGE: "INVENTORY_MANAGE",
  LOG_USE: "INVENTORY_LOG_USE",
  RECEIVE: "INVENTORY_RECEIVE",
  REPORTS: "INVENTORY_REPORTS",
  PO_CREATE: "INVENTORY_PO_CREATE",
} as const;

export type InventoryPermission = (typeof INVENTORY_PERMISSIONS)[keyof typeof INVENTORY_PERMISSIONS];

// ─── POStatus badge config ────────────────────────────────────────────────────
export const PO_STATUS_CONFIG: Record<POStatus, { label: string; bg: string; text: string; border: string }> = {
  Pending:          { label: "Pending",           bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200" },
  Sent:             { label: "Sent",               bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"   },
  PartiallyReceived:{ label: "Partial",            bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  Received:         { label: "Received",           bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200"  },
  Cancelled:        { label: "Cancelled",          bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
};

export const DEFAULT_CATEGORIES = [
  { name: "Food",         icon: "🍽️" },
  { name: "Beverage",     icon: "🥤" },
  { name: "Cleaning",     icon: "🧹" },
  { name: "Linen",        icon: "🛏️" },
  { name: "Minibar",      icon: "🍷" },
  { name: "Stationery",   icon: "✏️" },
  { name: "Maintenance",  icon: "🔧" },
  { name: "Other",        icon: "📦" },
];
