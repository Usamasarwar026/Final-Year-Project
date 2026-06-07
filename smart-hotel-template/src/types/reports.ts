// src/types/reports.ts
// ── Reports Module Type Definitions ─────────────────────────────────────────

export type ReportType =
  | "Revenue"
  | "Occupancy"
  | "Staff"
  | "Inventory"
  | "Booking"
  | "Guest";

export type ScheduleFrequency = "Daily" | "Weekly" | "Monthly";

// ── Dashboard KPIs ──────────────────────────────────────────────────────────

export interface ReportKpi {
  revenue_today: number;
  revenue_this_month: number;
  occupancy_percent: number;
  active_bookings: number;
  pending_payments: number;
  low_stock_items: number;
  staff_attendance_today: number;
  new_guests_today: number;
}

// ── Date Filter ──────────────────────────────────────────────────────────────

export interface DateRangeFilter {
  from: string; // ISO date string
  to: string;
}

export type PresetRange = "today" | "week" | "month" | "year" | "custom";

// ── Revenue Report ────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  date: string;
  room_revenue: number;
  food_revenue: number;
  service_revenue: number;
  total_revenue: number;
}

export interface RevenueReport {
  room_revenue: number;
  food_revenue: number;
  service_revenue: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  net_revenue: number;
  amount_paid: number;
  pending_amount: number;
  trend: RevenueDataPoint[];
}

// ── Occupancy Report ──────────────────────────────────────────────────────────

export interface OccupancyDataPoint {
  date: string;
  occupied: number;
  available: number;
  occupancy_percent: number;
}

export interface OccupancyReport {
  total_rooms: number;
  occupied: number;
  available: number;
  reserved: number;
  maintenance: number;
  occupancy_percent: number;
  trend: OccupancyDataPoint[];
}

// ── Staff Performance Report ─────────────────────────────────────────────────

export interface StaffPerformanceEntry {
  staff_id: number;
  name: string;
  department: string | null;
  assigned_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
  present_days: number;
  working_days: number;
  attendance_rate: number;
}

export interface StaffReport {
  staff: StaffPerformanceEntry[];
}

// ── Inventory Report ──────────────────────────────────────────────────────────

export interface InventoryCategoryUsage {
  category: string;
  items_count: number;
  total_consumed: number;
  total_cost: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  unit: string;
}

export interface InventoryReport {
  total_items: number;
  low_stock_count: number;
  total_purchase_cost: number;
  total_consumption_cost: number;
  category_usage: InventoryCategoryUsage[];
  low_stock_items: LowStockItem[];
}

// ── Booking Report ────────────────────────────────────────────────────────────

export interface BookingDataPoint {
  date: string;
  total: number;
  confirmed: number;
  cancelled: number;
  checked_in: number;
  checked_out: number;
}

export interface BookingReport {
  total_bookings: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  checked_in: number;
  checked_out: number;
  conversion_rate: number;
  trend: BookingDataPoint[];
  status_distribution: { name: string; value: number }[];
}

// ── Guest Analytics ───────────────────────────────────────────────────────────

export interface GuestSegment {
  name: string;
  value: number;
}

export interface GuestReport {
  total_guests: number;
  new_guests: number;
  returning_guests: number;
  vip_guests: number;
  avg_stay_duration: number;
  segments: GuestSegment[];
}

// ── Scheduled Reports ────────────────────────────────────────────────────────

export interface ReportSchedule {
  id: number;
  report_type: ReportType;
  frequency: ScheduleFrequency;
  is_active: boolean;
  created_by: string;
  last_run_at: string | null;
  next_run_at: string | null;
  parameters: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSchedulePayload {
  report_type: ReportType;
  frequency: ScheduleFrequency;
  parameters?: Record<string, unknown>;
}

export interface UpdateSchedulePayload {
  frequency?: ScheduleFrequency;
  is_active?: boolean;
  parameters?: Record<string, unknown>;
}
