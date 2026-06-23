// src/modules/kitchen/KitchenOrders.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils,
  Search,
  X,
  Eye,
  RefreshCw,
  Loader2,
  Clock,
  ChefHat,
  CheckCircle2,
  Bike,
  AlertCircle,
  LayoutGrid,
  List,
  Phone,
  MapPin,
  Star,
  UserPlus,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Printer } from "lucide-react";
import clsx from "clsx";
import {
  useKitchenOrders,
  useUpdateOrderStatus,
  useDeliveryStaff,
  KITCHEN_KEYS,
} from "@/hooks/useKitchen";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ORDER_STATUS_CONFIG,
  ORDER_TYPE_CONFIG,
  ORDER_STATUSES,
  type FoodOrder,
  type FoodOrderStatus,
} from "@/types/kitchen";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Types for delivery staff
interface DeliveryStaff {
  staff_id: number;
  user_id: string;
  designation: string;
  is_on_duty: boolean;
  is_active: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    profileImage: string | null;
  };
}

const PAGE_SIZE = 10;

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const elapsed = (d: string) => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60_000);
  return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: FoodOrderStatus }) {
  const c = ORDER_STATUS_CONFIG[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap",
        c.bg,
        c.color,
        c.border,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

// ─── Status Action Buttons ─────────────────────────────────────────────────────
const STATUS_TRANSITIONS: Record<
  FoodOrderStatus,
  {
    label: string;
    next: FoodOrderStatus;
    color: string;
    requiresStaff?: boolean;
  }[]
> = {
  Pending: [
    {
      label: "Accept",
      next: "Accepted",
      color: "bg-indigo-600 text-white hover:bg-indigo-700",
    },
  ],
  Accepted: [
    {
      label: "Preparing",
      next: "Preparing",
      color: "bg-amber-500 text-white hover:bg-amber-600",
    },
  ],
  Preparing: [
    {
      label: "Mark Ready",
      next: "Ready",
      color: "bg-teal-600 text-white hover:bg-teal-700",
    },
  ],
  Ready: [
    {
      label: "Assign",
      next: "Assigned",
      color: "bg-purple-600 text-white hover:bg-purple-700",
      requiresStaff: true,
    },
  ],
  Assigned: [
    {
      label: "Out for Delivery",
      next: "OutForDelivery",
      color: "bg-orange-600 text-white hover:bg-orange-700",
    },
  ],
  OutForDelivery: [
    {
      label: "Delivered",
      next: "Delivered",
      color: "bg-green-600 text-white hover:bg-green-700",
    },
  ],
  Delivered: [],
  Cancelled: [],
};
const CANCEL_ALLOWED: FoodOrderStatus[] = ["Pending", "Accepted", "Preparing"];

// ─── Table Skeleton ────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-t border-border">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className={clsx(
                  "h-4 bg-muted/60 rounded animate-pulse",
                  j === 0
                    ? "w-10"
                    : j === 2
                      ? "w-24"
                      : j === 8
                        ? "w-20"
                        : "w-16",
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Assign Staff Modal ───────────────────────────────────────────────────────
function AssignStaffModal({
  isOpen,
  onClose,
  order,
  staffList,
  onAssign,
  isAssigning,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: FoodOrder | null;
  staffList: DeliveryStaff[];
  onAssign: (orderId: number, staffId: number) => void;
  isAssigning: boolean;
}) {
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStaff = staffList.filter((staff) => {
    if (!staff.is_on_duty || !staff.is_active) return false;
    const matchesSearch =
      staff.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAssign = () => {
    if (selectedStaffId && order) {
      onAssign(order.id, selectedStaffId);
      onClose();
    } else {
      toast.error("Please select a staff member");
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Bike size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Assign Delivery Staff
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Order Info */}
        <div className="p-5 bg-muted/10 border-b border-border">
          <p className="text-xs text-muted-foreground">Order Details</p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="font-bold text-foreground">Order #{order.id}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.order_type === "RoomService"
                  ? `Room ${order.room_number}`
                  : `Table ${order.table_number}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">
                PKR {Number(order.total_amount).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {order.items.length} items
              </p>
            </div>
          </div>
        </div>

        {/* Staff Selection */}
        <div className="p-5">
          <label className="block text-xs font-semibold text-foreground/70 mb-3">
            Select Delivery Staff (Active &amp; On-Duty Only)
          </label>

          <div className="relative mb-4">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search staff by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredStaff.length === 0 ? (
              <div className="py-8 text-center">
                <UserPlus
                  size={32}
                  className="mx-auto text-muted-foreground/30 mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? "No matching staff found"
                    : "No available delivery staff on duty"}
                </p>
              </div>
            ) : (
              filteredStaff.map((staff) => (
                <label
                  key={staff.staff_id}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    selectedStaffId === staff.staff_id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/30",
                  )}
                >
                  <input
                    type="radio"
                    name="staff"
                    value={staff.staff_id}
                    checked={selectedStaffId === staff.staff_id}
                    onChange={() => setSelectedStaffId(staff.staff_id)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div className="relative">
                    {staff.user.profileImage ? (
                      <img
                        src={staff.user.profileImage}
                        alt={staff.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {staff.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {staff.user.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {staff.designation}
                    </p>
                    {staff.user.phoneNumber && (
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone size={8} /> {staff.user.phoneNumber}
                      </p>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full">
                    On Duty
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedStaffId || isAssigning}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAssigning ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Send size={14} /> Assign Order
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  onAssignClick,
  loadingOrderId,
}: {
  order: FoodOrder;
  onClose: () => void;
  onStatusChange: (id: number, status: string, staffId?: number) => void;
  onAssignClick?: (order: FoodOrder) => void;
  loadingOrderId: number | null;
}) {
  const tc = ORDER_TYPE_CONFIG[order.order_type];
  const actions = STATUS_TRANSITIONS[order.status] ?? [];
  const isLoading = loadingOrderId === order.id;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const isStaff = session?.user?.role === "STAFF";

  const steps: FoodOrderStatus[] = [
    "Pending",
    "Accepted",
    "Preparing",
    "Ready",
    "Assigned",
    "OutForDelivery",
    "Delivered",
  ];
  const currentIdx = steps.indexOf(order.status);

  const assignedStaff = order.tasks?.[0]?.assignedStaff;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="relative h-14 flex items-center justify-between px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{tc?.icon}</span>
            <div>
              <p className="text-sm font-bold text-foreground">
                Order #{order.id}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {fmtDate(order.placed_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-muted"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Assigned Staff Info */}
          {assignedStaff && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-purple-50 border border-purple-200">
              <p className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide">
                Assigned Delivery Staff
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-700">
                    {assignedStaff.user?.name?.charAt(0) || "S"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {assignedStaff.user?.name || "Staff"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {assignedStaff.designation}
                  </p>
                </div>
                {assignedStaff.user?.phoneNumber && (
                  <a
                    href={`tel:${assignedStaff.user.phoneNumber}`}
                    className="ml-auto p-2 rounded-lg bg-purple-100 text-purple-700"
                  >
                    <Phone size={14} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Delivery info */}
          <div className="grid grid-cols-3 gap-2 p-5">
            {[
              { label: "Type", value: tc?.label },
              {
                label: order.order_type === "RoomService" ? "Room" : "Table",
                value:
                  order.order_type === "RoomService"
                    ? order.room_number
                    : order.table_number,
              },
              { label: "Customer", value: order.customer_name },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/40 rounded-xl px-3 py-2.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {label}
                </p>
                <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                  {value ?? "—"}
                </p>
              </div>
            ))}
          </div>

          {/* Timeline Progress */}
          <div className="px-5 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Order Progress
            </p>
            <div className="relative flex justify-between items-center">
              <div className="absolute left-4 right-4 top-4 h-0.5 bg-border -z-10" />
              <motion.div
                className="absolute left-4 top-4 h-0.5 bg-green-500 -z-10"
                initial={{ width: 0 }}
                animate={{
                  width:
                    order.status === "Cancelled"
                      ? 0
                      : `${(currentIdx / (steps.length - 1)) * 88}%`,
                }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
              {steps.map((step, idx) => {
                const done = idx < currentIdx;
                const active =
                  idx === currentIdx && order.status !== "Cancelled";
                const sc = ORDER_STATUS_CONFIG[step];
                return (
                  <div key={step} className="flex flex-col items-center z-10">
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all",
                        done
                          ? "bg-green-500 border-green-500 text-white"
                          : active
                            ? "bg-white border-green-500 text-green-600 ring-4 ring-green-100 scale-110"
                            : "bg-muted border-border text-muted-foreground",
                      )}
                    >
                      {done ? "✓" : idx + 1}
                    </div>
                    <span
                      className={clsx(
                        "text-[8px] mt-1 whitespace-nowrap font-semibold",
                        active ? "text-green-600" : "text-muted-foreground",
                      )}
                    >
                      {sc?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div className="px-5 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Items
            </p>
            <div className="space-y-1.5">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-2.5 bg-muted/40 rounded-xl"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {item.foodItem?.name ?? `Item #${item.food_item_id}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                    {item.special_note && (
                      <p className="text-[10px] text-amber-600 italic mt-0.5">
                        Note: {item.special_note}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-bold text-foreground shrink-0 ml-2">
                    PKR {Number(item.subtotal).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 px-2 text-sm font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-primary">
                PKR {Number(order.total_amount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Special instructions */}
          {order.special_instructions && (
            <div className="mx-5 mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                Special Instructions
              </p>
              <p className="text-xs text-amber-900 mt-1">
                {order.special_instructions}
              </p>
            </div>
          )}

          {/* Timeline log */}
          {order.timelines && order.timelines.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Activity Log
              </p>
              <div className="space-y-1.5">
                {order.timelines.map((t) => {
                  const sc = ORDER_STATUS_CONFIG[t.status];
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 text-[10px]"
                    >
                      <span
                        className={clsx(
                          "w-2 h-2 rounded-full shrink-0",
                          sc?.dot ?? "bg-muted-foreground",
                        )}
                      />
                      <span
                        className={clsx(
                          "font-semibold",
                          sc?.color ?? "text-muted-foreground",
                        )}
                      >
                        {sc?.label ?? t.status}
                      </span>
                      <span className="text-muted-foreground flex-1 truncate">
                        {t.notes}
                      </span>
                      <span className="text-muted-foreground/60 shrink-0">
                        {fmtTime(t.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2.5 px-5 py-4 border-t border-border shrink-0 flex-wrap">
          {CANCEL_ALLOWED.includes(order.status) && (
            <button
              onClick={() => {
                onStatusChange(order.id, "Cancelled");
                onClose();
              }}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Cancel Order
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>

          {order.status === "Delivered" && (
            <button
              onClick={() => {
                const invoiceUrl = isAdmin
                  ? `/admin/kitchen/orders/${order.id}/invoice`
                  : `/staff/kitchen/orders/${order.id}/invoice`;
                window.open(invoiceUrl, "_blank");
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Printer size={13} /> Print Invoice
            </button>
          )}
          {actions.map((a) => {
            if (a.requiresStaff && onAssignClick) {
              return (
                <button
                  key={a.next}
                  onClick={() => onAssignClick(order)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Bike size={14} /> {a.label}
                </button>
              );
            }
            return (
              <button
                key={a.next}
                onClick={() => onStatusChange(order.id, a.next)}
                disabled={isLoading}
                className={clsx(
                  "flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-60",
                  a.color,
                )}
              >
                {isLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : null}
                {a.label}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Orders Page ─────────────────────────────────────────────────────────
export default function KitchenOrders() {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState<FoodOrder | null>(null);
  const [orderToAssign, setOrderToAssign] = useState<FoodOrder | null>(null);
  const [page, setPage] = useState(1);
  // Track which order is currently being mutated for per-row loading
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useKitchenOrders({
    status: statusFilter || undefined,
    order_type: typeFilter || undefined,
    q: search || undefined,
  });

  // Fetch delivery staff — only active & on duty
  const { data: staff = [] } = useQuery({
    queryKey: ["delivery-staff"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/kitchen/delivery");
        return (data.staff || []).filter(
          (s: DeliveryStaff) => s.is_active && s.is_on_duty,
        );
      } catch (error) {
        console.error("Failed to fetch staff:", error);
        return [];
      }
    },
  });

  const updateStatus = useUpdateOrderStatus();

  // Was hitting "/kitchen/delivery" (wrong/non-existent route) and reused
  // the "delivery-staff" cache key with a different queryFn than the
  // Deliveries page — caused stale/empty staff lists. Fixed via shared hook.
  const { data: allDeliveryStaff = [] } = useDeliveryStaff();
  const staffs = allDeliveryStaff.filter(
    (s: DeliveryStaff) => s.is_active && s.is_on_duty,
  );

  // FIX: No inline onSuccess toast — the hook already fires one.
  // We only add side-effects here: refetch + invalidate delivery-staff cache.
  const handleStatusChange = (id: number, status: string, staffId?: number) => {
    const payload: { status: string; assigned_to?: number } = { status };
    if (staffId) payload.assigned_to = staffId;

    setLoadingOrderId(id);
    updateStatus.mutate(
      { id, payload },
      {
        onSettled: () => {
          setLoadingOrderId(null);
          refetch();
          queryClient.invalidateQueries({
            queryKey: KITCHEN_KEYS.deliveryStaff,
          });
        },
      },
    );
  };

  const handleAssignWithStaff = (orderId: number, staffId: number) => {
    handleStatusChange(orderId, "Assigned", staffId);
    setOrderToAssign(null);
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          String(o.id).includes(q) ||
          (o.room_number ?? "").toLowerCase().includes(q) ||
          (o.table_number ?? "").toLowerCase().includes(q) ||
          (o.customer_name ?? "").toLowerCase().includes(q),
      );
    }
    if (statusFilter)
      filtered = filtered.filter((o) => o.status === statusFilter);
    if (typeFilter)
      filtered = filtered.filter((o) => o.order_type === typeFilter);
    return filtered;
  }, [orders, search, statusFilter, typeFilter]);

  // Pagination (table view only)
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // Reset page when filters change
  const handleFilterChange = (cb: () => void) => {
    cb();
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Utensils size={22} className="text-primary" /> Kitchen Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and track all food orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
          >
            <RefreshCw
              size={15}
              className={clsx(
                "text-muted-foreground",
                isLoading && "animate-spin",
              )}
            />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) =>
              handleFilterChange(() => setSearch(e.target.value))
            }
            placeholder="Search #ID, room, table…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            handleFilterChange(() => setStatusFilter(e.target.value))
          }
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none"
        >
          <option value="">All Status</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) =>
            handleFilterChange(() => setTypeFilter(e.target.value))
          }
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="RoomService">Room Service</option>
          <option value="Restaurant">Restaurant</option>
        </select>
        {(search || statusFilter || typeFilter) && (
          <button
            onClick={() =>
              handleFilterChange(() => {
                setSearch("");
                setStatusFilter("");
                setTypeFilter("");
              })
            }
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X size={12} /> Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredOrders.length} orders
        </span>
      </div>

      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                {[
                  "#",
                  "Type",
                  "Customer",
                  "Location",
                  "Items",
                  "Total",
                  "Status",
                  "Placed",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton />
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <Utensils
                      size={28}
                      className="mx-auto mb-2.5 text-muted-foreground/20"
                    />
                    <p className="text-sm text-muted-foreground">
                      No orders found
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, i) => {
                  const tc = ORDER_TYPE_CONFIG[order.order_type];
                  const actions = STATUS_TRANSITIONS[order.status] ?? [];
                  const assignedStaff = order.tasks?.[0]?.assignedStaff;
                  const isRowLoading = loadingOrderId === order.id;

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={clsx(
                        "border-t border-border transition-colors",
                        isRowLoading
                          ? "bg-primary/3 opacity-75"
                          : "hover:bg-muted/20",
                      )}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            tc?.bg,
                            tc?.color,
                          )}
                        >
                          {tc?.icon} {tc?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-foreground">
                          {order.customer_name || "Guest"}
                        </p>
                        {assignedStaff && order.status !== "Delivered" && (
                          <p className="text-[9px] text-purple-600 mt-0.5">
                            Staff: {assignedStaff.user?.name}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-foreground">
                          {order.order_type === "RoomService"
                            ? `Room ${order.room_number}`
                            : `Table ${order.table_number}`}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-foreground">
                          {order.items.length} items
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground text-xs">
                        PKR {Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3.5 text-[10px] text-muted-foreground whitespace-nowrap">
                        {fmtDate(order.placed_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewOrder(order)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Eye size={13} />
                          </button>
                          {actions.map((a) => {
                            if (a.requiresStaff) {
                              return (
                                <button
                                  key={a.next}
                                  onClick={() => setOrderToAssign(order)}
                                  disabled={isRowLoading}
                                  className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1 disabled:opacity-50"
                                >
                                  {isRowLoading ? (
                                    <Loader2
                                      size={10}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Bike size={10} />
                                  )}
                                  {a.label}
                                </button>
                              );
                            }
                            return (
                              <button
                                key={a.next}
                                onClick={() =>
                                  handleStatusChange(order.id, a.next)
                                }
                                disabled={isRowLoading}
                                className={clsx(
                                  "px-2 py-1.5 rounded-lg text-[10px] font-bold transition-opacity hover:opacity-80 flex items-center gap-1 disabled:opacity-50",
                                  a.color,
                                )}
                              >
                                {isRowLoading ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : null}
                                {a.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Summary + Pagination */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              {Math.min((page - 1) * PAGE_SIZE + 1, filteredOrders.length)}–
              {Math.min(page * PAGE_SIZE, filteredOrders.length)} of{" "}
              {filteredOrders.length} orders &nbsp;·&nbsp;
              {orders.filter((o) => o.status === "Pending").length} pending
              &nbsp;·&nbsp;
              {orders.filter((o) => o.status === "Preparing").length} preparing
              &nbsp;·&nbsp;
              {orders.filter((o) => o.status === "Ready").length} ready
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (
                      idx > 0 &&
                      typeof arr[idx - 1] === "number" &&
                      (p as number) - (arr[idx - 1] as number) > 1
                    ) {
                      acc.push("…");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "…" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 text-xs text-muted-foreground"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={clsx(
                          "min-w-[28px] h-7 rounded-lg text-xs font-semibold transition-colors",
                          page === p
                            ? "bg-primary text-white"
                            : "border border-border hover:bg-muted text-foreground",
                        )}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewOrder && (
          <OrderDetailModal
            order={viewOrder}
            onClose={() => setViewOrder(null)}
            onStatusChange={handleStatusChange}
            onAssignClick={setOrderToAssign}
            loadingOrderId={loadingOrderId}
          />
        )}
      </AnimatePresence>

      {/* Assign Staff Modal */}
      <AnimatePresence>
        {orderToAssign && (
          <AssignStaffModal
            isOpen={!!orderToAssign}
            onClose={() => setOrderToAssign(null)}
            order={orderToAssign}
            staffList={staff}
            onAssign={handleAssignWithStaff}
            isAssigning={updateStatus.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
