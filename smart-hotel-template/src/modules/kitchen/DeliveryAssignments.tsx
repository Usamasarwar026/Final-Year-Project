// src/app/admin/kitchen/deliveries/page.tsx
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  Search,
  CheckCircle,
  Loader2,
  Clock,
  MapPin,
  User,
  Phone,
  Send,
  X,
  RefreshCw,
  Package,
  AlertCircle,
  UserCheck,
  TrendingUp,
  Users,
  ChevronRight,
  Star,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { useKitchenOrders, useUpdateOrderStatus } from "@/hooks/useKitchen";
import { ORDER_TYPE_CONFIG, type FoodOrder } from "@/types/kitchen";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import Image from "next/image";

// Types
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
  completedDeliveries?: number;
  currentDelivery?: FoodOrder | null;
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
    if (staff.currentDelivery) return false;
    const matchesSearch = staff.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Bike size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Assign Delivery Staff
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
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
              <p className="text-[10px] text-muted-foreground">{order.items.length} items</p>
            </div>
          </div>
        </div>

        {/* Staff Selection */}
        <div className="p-5">
          <label className="block text-xs font-semibold text-foreground/70 mb-3">
            Select Delivery Staff
          </label>
          
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                <Users size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? "No matching staff found" : "No available delivery staff on duty"}
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
                      : "border-border hover:bg-muted/30"
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
                    {staff.is_on_duty && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{staff.user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{staff.designation}</p>
                    {staff.user.phoneNumber && (
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone size={8} /> {staff.user.phoneNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">{staff.completedDeliveries || 0}</p>
                    <p className="text-[8px] text-muted-foreground">Deliveries</p>
                  </div>
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

// ─── Delivery Order Card ──────────────────────────────────────────────────────
function DeliveryOrderCard({
  order,
  onAssignClick,
  isAssigning,
}: {
  order: FoodOrder;
  onAssignClick: (order: FoodOrder) => void;
  isAssigning: boolean;
}) {
  const tc = ORDER_TYPE_CONFIG[order.order_type];
  const minutes = Math.floor((Date.now() - new Date(order.ready_at || order.placed_at).getTime()) / 60000);
  const isUrgent = minutes > 15;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border border-border rounded-2xl p-5 space-y-4 hover:shadow-lg transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <span className="text-xl">{tc?.icon}</span>
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Order #{order.id}</p>
            <p className="text-[10px] text-muted-foreground">
              Ready since: {new Date(order.ready_at || order.placed_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        {isUrgent && (
          <span className="px-2 py-1 bg-red-100 text-red-600 text-[9px] font-bold rounded-full flex items-center gap-1 animate-pulse">
            <AlertCircle size={10} /> {minutes} min wait
          </span>
        )}
      </div>

      {/* Delivery Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-xs">
          <MapPin size={12} className="text-muted-foreground" />
          <span className="text-foreground">
            {order.order_type === "RoomService" 
              ? `Room ${order.room_number}` 
              : `Table ${order.table_number}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <User size={12} className="text-muted-foreground" />
          <span className="text-foreground">{order.customer_name || "Guest"}</span>
        </div>
      </div>

      {/* Items Summary */}
      <div className="bg-muted/20 rounded-xl p-3">
        <p className="text-[10px] font-semibold text-muted-foreground mb-2">Items to deliver:</p>
        <div className="space-y-1">
          {order.items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex justify-between text-[10px]">
              <span className="text-foreground">{item.foodItem?.name}</span>
              <span className="text-muted-foreground">x{item.quantity}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-[9px] text-muted-foreground">+{order.items.length - 3} more items</p>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-border/50 flex justify-between">
          <span className="text-[10px] font-semibold text-foreground">Total Amount</span>
          <span className="text-xs font-bold text-primary">PKR {Number(order.total_amount).toLocaleString()}</span>
        </div>
      </div>

      {/* Assign Button */}
      <button
        onClick={() => onAssignClick(order)}
        disabled={isAssigning}
        className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/95 transition-colors disabled:opacity-50"
      >
        <Bike size={14} /> Assign to Staff
      </button>
    </motion.div>
  );
}

// ─── Assigned Order Card (shows assigned staff) ───────────────────────────────
function AssignedOrderCard({
  order,
  onViewDetails,
}: {
  order: FoodOrder;
  onViewDetails: (order: FoodOrder) => void;
}) {
  const tc = ORDER_TYPE_CONFIG[order.order_type];
  const assignedStaff = order.tasks?.[0]?.assignedStaff;
  const status = order.status;

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    Assigned: { label: "Assigned", color: "text-purple-600 bg-purple-50", icon: "👤" },
    OutForDelivery: { label: "Out for Delivery", color: "text-orange-600 bg-orange-50", icon: "🚚" },
    Delivered: { label: "Delivered", color: "text-green-600 bg-green-50", icon: "✅" },
  };
  const currentStatus = statusConfig[status] || statusConfig.Assigned;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border border-border rounded-2xl p-5 space-y-4 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <span className="text-xl">{tc?.icon}</span>
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Order #{order.id}</p>
            <p className="text-[10px] text-muted-foreground">
              {order.order_type === "RoomService" ? `Room ${order.room_number}` : `Table ${order.table_number}`}
            </p>
          </div>
        </div>
        <span className={clsx("px-2 py-1 rounded-full text-[9px] font-bold flex items-center gap-1", currentStatus.color)}>
          <span>{currentStatus.icon}</span> {currentStatus.label}
        </span>
      </div>

      {/* Assigned Staff Info */}
      {assignedStaff && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
          <div className="relative">
            {assignedStaff.user?.profileImage ? (
              <img
                src={assignedStaff.user.profileImage}
                alt={assignedStaff.user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {assignedStaff.user?.name?.charAt(0) || "S"}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{assignedStaff.user?.name || "Staff"}</p>
            <p className="text-[10px] text-muted-foreground">{assignedStaff.designation}</p>
          </div>
          {assignedStaff.user?.phoneNumber && (
            <a
              href={`tel:${assignedStaff.user.phoneNumber}`}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Phone size={14} />
            </a>
          )}
        </div>
      )}

      <button
        onClick={() => onViewDetails(order)}
        className="w-full py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1"
      >
        View Details <ChevronRight size={12} />
      </button>
    </motion.div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
}: {
  order: FoodOrder | null;
  onClose: () => void;
}) {
  if (!order) return null;

  const steps = ["Pending", "Accepted", "Preparing", "Ready", "Assigned", "OutForDelivery", "Delivered"];
  const currentIdx = steps.indexOf(order.status);

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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-lg bg-background rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">Order #{order.id}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/20 rounded-xl p-3">
              <p className="text-[9px] text-muted-foreground uppercase">Customer</p>
              <p className="text-sm font-semibold text-foreground">{order.customer_name || "Guest"}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3">
              <p className="text-[9px] text-muted-foreground uppercase">Location</p>
              <p className="text-sm font-semibold text-foreground">
                {order.order_type === "RoomService" ? `Room ${order.room_number}` : `Table ${order.table_number}`}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-3">Order Progress</p>
            <div className="relative flex justify-between">
              <div className="absolute left-4 right-4 top-4 h-0.5 bg-border -z-10" />
              <motion.div
                className="absolute left-4 top-4 h-0.5 bg-green-500 -z-10"
                initial={{ width: 0 }}
                animate={{ width: `${(currentIdx / (steps.length - 1)) * 88}%` }}
              />
              {steps.map((step, idx) => {
                const done = idx < currentIdx;
                const active = idx === currentIdx;
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div className={clsx(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                      done ? "bg-green-500 border-green-500 text-white" :
                      active ? "bg-white border-green-500 text-green-600 ring-4 ring-green-100" :
                      "bg-muted border-border text-muted-foreground"
                    )}>
                      {done ? "✓" : idx + 1}
                    </div>
                    <span className="text-[8px] mt-1 text-muted-foreground">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Items</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/20 rounded-lg">
                  <div>
                    <span className="font-medium text-foreground">{item.foodItem?.name}</span>
                    <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    {item.special_note && (
                      <p className="text-[10px] text-amber-600 mt-0.5">Note: {item.special_note}</p>
                    )}
                  </div>
                  <span className="font-bold text-primary">PKR {Number(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-primary text-lg">PKR {Number(order.total_amount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Delivery Assignments Page ──────────────────────────────────────────
export default function DeliveryAssignments() {
  const [viewMode, setViewMode] = useState<"pending" | "assigned">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<FoodOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<FoodOrder | null>(null);

  const queryClient = useQueryClient();

  // Fetch ready orders (pending assignment)
  const { data: readyOrders = [], isLoading: readyLoading, refetch: refetchReady } = useKitchenOrders({
    status: "Ready",
  });

  // Fetch all orders to show assigned ones
  const { data: allOrders = [], refetch: refetchAll } = useKitchenOrders();

  const { data: staff = [], refetch: refetchStaff } = useQuery({
  queryKey: ["delivery-staff"],
  queryFn: async () => {
    try {
      // ✅ delivery-staff endpoint use karo, delivery nahi
      const { data } = await api.get("/kitchen/delivery-staff");
      return data.staff || [];
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      return [];
    }
  },
});

  const updateOrderStatus = useUpdateOrderStatus();

  const assignDelivery = useMutation({
    mutationFn: async ({ orderId, staffId }: { orderId: number; staffId: number }) => {
      return updateOrderStatus.mutateAsync({
        id: orderId,
        payload: { status: "Assigned", assigned_to: staffId, notes: `Assigned to delivery staff` },
      });
    },
    onSuccess: () => {
      toast.success("Order assigned to delivery staff");
      refetchReady();
      refetchAll();
      refetchStaff();
      queryClient.invalidateQueries({ queryKey: ["delivery-stats"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to assign order");
    },
  });

  // Filter ready orders (not yet assigned)
  const pendingOrders = readyOrders.filter((o) => o.status === "Ready");
  
  // Filter assigned orders (Assigned or OutForDelivery)
  const assignedOrders = allOrders.filter((o) => 
    o.status === "Assigned" || o.status === "OutForDelivery"
  );

  const filteredPending = pendingOrders.filter((o) =>
    String(o.id).includes(searchQuery) ||
    (o.room_number?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (o.table_number?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const availableStaff = staff.filter((s: DeliveryStaff) => s.is_on_duty && s.is_active && !s.currentDelivery);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Bike className="text-primary" size={28} />
              Delivery Assignments
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Assign ready orders to delivery staff and track deliveries
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-muted rounded-xl gap-1">
              <button
                onClick={() => setViewMode("pending")}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  viewMode === "pending" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                )}
              >
                Pending ({pendingOrders.length})
              </button>
              <button
                onClick={() => setViewMode("assigned")}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  viewMode === "assigned" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                )}
              >
                Assigned ({assignedOrders.length})
              </button>
            </div>
            <button
              onClick={() => {
                refetchReady();
                refetchAll();
                refetchStaff();
              }}
              className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <RefreshCw size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl p-4 border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-600">{pendingOrders.length}</p>
            <p className="text-xs text-muted-foreground">Ready for Delivery</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-4 border border-purple-500/20">
            <p className="text-2xl font-bold text-purple-600">{assignedOrders.length}</p>
            <p className="text-xs text-muted-foreground">In Progress / Assigned</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-4 border border-green-500/20">
            <p className="text-2xl font-bold text-green-600">{availableStaff.length}</p>
            <p className="text-xs text-muted-foreground">Available Staff</p>
          </div>
        </div>

        {/* Search */}
        {viewMode === "pending" && (
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders by #ID, room, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Content */}
        {viewMode === "pending" ? (
          <div>
            {readyLoading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-primary/40" />
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              </div>
            ) : filteredPending.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                <Bike size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-foreground/70">No orders ready for delivery</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Orders will appear here when kitchen marks them as "Ready"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPending.map((order) => (
                  <DeliveryOrderCard
                    key={order.id}
                    order={order}
                    onAssignClick={setSelectedOrderForAssign}
                    isAssigning={assignDelivery.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {assignedOrders.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                <CheckCircle size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-foreground/70">No active deliveries</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Assigned deliveries will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {assignedOrders.map((order) => (
                  <AssignedOrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={setViewingOrder}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Stats */}
        {viewMode === "pending" && filteredPending.length > 0 && (
          <div className="flex justify-between items-center pt-4 text-xs text-muted-foreground border-t border-border">
            <span>{filteredPending.length} order{filteredPending.length !== 1 ? "s" : ""} waiting for delivery</span>
            <span className="flex items-center gap-1">
              <UserCheck size={10} /> {availableStaff.length} staff available
            </span>
          </div>
        )}
      </div>

      {/* Assign Staff Modal */}
      <AnimatePresence>
        {selectedOrderForAssign && (
          <AssignStaffModal
            isOpen={!!selectedOrderForAssign}
            onClose={() => setSelectedOrderForAssign(null)}
            order={selectedOrderForAssign}
            staffList={staff}
            onAssign={(orderId, staffId) => assignDelivery.mutate({ orderId, staffId })}
            isAssigning={assignDelivery.isPending}
          />
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <OrderDetailModal
            order={viewingOrder}
            onClose={() => setViewingOrder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}