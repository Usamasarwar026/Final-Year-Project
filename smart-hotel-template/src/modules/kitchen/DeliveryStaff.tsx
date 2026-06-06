// src/app/staff/delivery/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  MapPin,
  User,
  Phone,
  CheckCircle,
  Loader2,
  Clock,
  Navigation,
  PhoneCall,
  MessageSquare,
  AlertCircle,
  Package,
  ChevronRight,
  X,
  RefreshCw,
  Star,
  ChefHat,
  ArrowRight,
  Receipt,
  CreditCard,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import Image from "next/image";
import { ORDER_TYPE_CONFIG, ORDER_STATUS_CONFIG } from "@/types/kitchen";

// Types
interface DeliveryTask {
  id: number;
  order_id: number;
  assigned_to: number;
  status: "Assigned" | "Accepted" | "InProgress" | "Completed";
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  order: {
    id: number;
    booking_id: number | null;
    customer_name: string | null;
    order_type: string;
    room_number: string | null;
    table_number: string | null;
    status: string;
    total_amount: number;
    special_instructions: string | null;
    placed_at: string;
    accepted_at: string | null;
    preparing_at: string | null;
    ready_at: string | null;
    assigned_at: string | null;
    out_for_delivery_at: string | null;
    delivered_at: string | null;
    items: {
      id: number;
      food_item_id: number;
      quantity: number;
      price: number;
      subtotal: number;
      special_note: string | null;
      foodItem?: {
        id: number;
        name: string;
        image: string | null;
        price: number;
      };
    }[];
    timelines?: {
      id: number;
      status: string;
      notes: string | null;
      created_at: string;
    }[];
  };
}

// ─── Delivery Task Card ───────────────────────────────────────────────────────
function DeliveryTaskCard({
  task,
  onUpdateStatus,
  isUpdating,
}: {
  task: DeliveryTask;
  onUpdateStatus: (taskId: number, status: string) => void;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  
  const tc = ORDER_TYPE_CONFIG[task.order.order_type as keyof typeof ORDER_TYPE_CONFIG];
  
  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string; nextAction?: { label: string; status: string; description: string } }> = {
    Assigned: {
      label: "Assigned",
      color: "text-purple-700",
      bg: "bg-purple-50",
      icon: "📋",
      nextAction: { 
        label: "Start Delivery", 
        status: "InProgress",
        description: "Mark that you're heading to the customer"
      }
    },
    InProgress: {
      label: "Out for Delivery",
      color: "text-orange-700",
      bg: "bg-orange-50",
      icon: "🚚",
      nextAction: { 
        label: "Mark as Delivered", 
        status: "Completed",
        description: "Confirm order has been delivered"
      }
    },
    Completed: {
      label: "Delivered",
      color: "text-green-700",
      bg: "bg-green-50",
      icon: "✅",
    },
  };

  const currentStatus = statusConfig[task.status] || statusConfig.Assigned;
  const isCompleted = task.status === "Completed";
  
  // Calculate time elapsed since assignment
  const assignedTime = new Date(task.created_at);
  const now = new Date();
  const elapsedMinutes = Math.floor((now.getTime() - assignedTime.getTime()) / 60000);
  const isDelayed = elapsedMinutes > 30 && !isCompleted;

  // Get order status display
  const orderStatusConfig = ORDER_STATUS_CONFIG[task.order.status as keyof typeof ORDER_STATUS_CONFIG];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "bg-background border rounded-2xl overflow-hidden transition-all",
        isDelayed ? "border-red-300 shadow-red-100" : "border-border",
        isCompleted && "opacity-80"
      )}
    >
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">{tc?.icon || "🍽️"}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground text-lg">Order #{task.order.id}</p>
                {orderStatusConfig && (
                  <span className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded-full", orderStatusConfig.bg, orderStatusConfig.color)}>
                    {orderStatusConfig.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {task.order.order_type === "RoomService" 
                  ? `Room ${task.order.room_number}` 
                  : `Table ${task.order.table_number}`}
              </p>
            </div>
          </div>
          <div className={clsx("px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5", currentStatus.bg, currentStatus.color)}>
            <span>{currentStatus.icon}</span>
            {currentStatus.label}
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="text-muted-foreground" />
            <span className="text-foreground">{task.order.customer_name || "Guest"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Package size={14} className="text-muted-foreground" />
            <span className="text-foreground">{task.order.items.length} items</span>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Amount</span>
            <span className="text-lg font-bold text-primary">PKR {Number(task.order.total_amount).toLocaleString()}</span>
          </div>
        </div>

        {/* Location Details */}
        <div className="bg-muted/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-primary" />
            <span className="text-xs font-semibold text-foreground">Delivery Location</span>
          </div>
          <p className="text-sm text-foreground">
            {task.order.order_type === "RoomService" 
              ? `Room ${task.order.room_number}${task.order.booking_id ? ` (Booking #${task.order.booking_id})` : ""}`
              : `Table ${task.order.table_number} - Restaurant Area`}
          </p>
        </div>

        {/* Time Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>Assigned: {new Date(task.created_at).toLocaleTimeString()}</span>
          </div>
          {!isCompleted && (
            <div className={clsx("flex items-center gap-1", isDelayed ? "text-red-500 font-semibold" : "")}>
              <AlertCircle size={12} />
              <span>{elapsedMinutes} min ago</span>
            </div>
          )}
        </div>

        {/* Expandable Sections */}
        <div className="space-y-2">
          {/* Special Instructions */}
          {task.order.special_instructions && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1">
                <MessageSquare size={12} />
                Special Instructions
              </span>
              <ChevronRight size={12} className={clsx("transition-transform", expanded && "rotate-90")} />
            </button>
          )}

          {expanded && task.order.special_instructions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-3"
            >
              <p className="text-xs text-amber-800">{task.order.special_instructions}</p>
            </motion.div>
          )}

          {/* Order Items */}
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1">
              <Receipt size={12} />
              Order Items ({task.order.items.length})
            </span>
            <ChevronRight size={12} className={clsx("transition-transform", showTimeline && "rotate-90")} />
          </button>

          {showTimeline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {task.order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{item.foodItem?.name || `Item #${item.food_item_id}`}</span>
                    <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    {item.special_note && (
                      <p className="text-[10px] text-amber-600 mt-0.5">Note: {item.special_note}</p>
                    )}
                  </div>
                  <span className="text-primary font-semibold">PKR {Number(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-primary text-lg">PKR {Number(task.order.total_amount).toLocaleString()}</span>
              </div>
            </motion.div>
          )}

          {/* Timeline History */}
          {task.order.timelines && task.order.timelines.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Order Timeline</p>
              <div className="space-y-1.5">
                {task.order.timelines.map((timeline, idx) => {
                  const config = ORDER_STATUS_CONFIG[timeline.status as keyof typeof ORDER_STATUS_CONFIG];
                  return (
                    <div key={timeline.id} className="flex items-center gap-2 text-[10px]">
                      <div className={clsx("w-1.5 h-1.5 rounded-full", config?.dot || "bg-muted-foreground")} />
                      <span className={clsx("font-medium", config?.color || "text-muted-foreground")}>
                        {config?.label || timeline.status}
                      </span>
                      <span className="text-muted-foreground">{timeline.notes}</span>
                      <span className="text-muted-foreground/50 ml-auto">
                        {new Date(timeline.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {!isCompleted && currentStatus.nextAction && (
          <button
            onClick={() => onUpdateStatus(task.id, currentStatus.nextAction!.status)}
            disabled={isUpdating}
            className={clsx(
              "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 mt-3",
              task.status === "Assigned" 
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-green-500 text-white hover:bg-green-600"
            )}
          >
            {isUpdating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {task.status === "Assigned" ? <Navigation size={16} /> : <CheckCircle size={16} />}
                {currentStatus.nextAction.label}
              </>
            )}
          </button>
        )}

        {/* Action Description */}
        {!isCompleted && currentStatus.nextAction && (
          <p className="text-[10px] text-muted-foreground text-center">
            {currentStatus.nextAction.description}
          </p>
        )}

        {/* Completed Badge */}
        {isCompleted && task.order.delivered_at && (
          <div className="flex items-center justify-center gap-2 mt-3 p-3 bg-green-50 rounded-xl">
            <CheckCircle size={18} className="text-green-500" />
            <span className="text-sm font-semibold text-green-700">Delivered Successfully</span>
            <span className="text-xs text-green-600">
              at {new Date(task.order.delivered_at).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({ label, value, icon: Icon, color, subtitle }: { label: string; value: number | string; icon: React.ElementType; color: string; subtitle?: string }) {
  return (
    <div className={clsx("rounded-2xl p-4", color)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          {subtitle && <p className="text-[8px] text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <Icon size={24} className="opacity-50" />
      </div>
    </div>
  );
}

// ─── Main Delivery Staff Page ─────────────────────────────────────────────────
export default function DeliveryStaff() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  
  const queryClient = useQueryClient();

  // Fetch delivery tasks for this staff member
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["delivery-tasks", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      try {
        // First get staff profile
        const staffRes = await api.get(`/staff/user/${session.user.id}`);
        const staffProfile = staffRes.data.staff;
        
        if (!staffProfile) return [];
        
        // Then get tasks for this staff
        const { data } = await api.get(`/kitchen/tasks?staff_id=${staffProfile.staff_id}`);
        return data.tasks || [];
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return [];
      }
    },
    enabled: !!session?.user?.id,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const { data } = await api.patch(`/kitchen/tasks/${taskId}`, { status });
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.status === "InProgress") {
        toast.success("🚚 Delivery started! Heading to customer...");
      } else if (variables.status === "Completed") {
        toast.success("🎉 Order delivered successfully!");
      }
      queryClient.invalidateQueries({ queryKey: ["delivery-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen", "orders"] });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to update task status");
    },
  });

  const activeTasks = tasks.filter((t: DeliveryTask) => t.status !== "Completed");
  const completedTasks = tasks.filter((t: DeliveryTask) => t.status === "Completed");

  // Stats
  const stats = {
    assigned: activeTasks.filter((t: DeliveryTask) => t.status === "Assigned").length,
    inProgress: activeTasks.filter((t: DeliveryTask) => t.status === "InProgress").length,
    completed: completedTasks.length,
    totalEarnings: completedTasks.reduce((sum: number, t: DeliveryTask) => sum + Number(t.order.total_amount), 0),
    todayEarnings: completedTasks
      .filter((t: DeliveryTask) => {
        const today = new Date().toDateString();
        return new Date(t.completed_at || t.updated_at).toDateString() === today;
      })
      .reduce((sum: number, t: DeliveryTask) => sum + Number(t.order.total_amount), 0),
  };

  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 15000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Bike className="text-primary" size={28} />
              My Deliveries
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your assigned deliveries and update status in real-time
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
          >
            <RefreshCw size={15} className="text-muted-foreground" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard
            label="Assigned"
            value={stats.assigned}
            icon={Clock}
            color="bg-purple-50 border border-purple-200"
            subtitle="Waiting to start"
          />
          <StatsCard
            label="Out for Delivery"
            value={stats.inProgress}
            icon={Bike}
            color="bg-orange-50 border border-orange-200"
            subtitle="On the way"
          />
          <StatsCard
            label="Completed Today"
            value={completedTasks.filter((t: DeliveryTask) => {
              const today = new Date().toDateString();
              return new Date(t.completed_at || t.updated_at).toDateString() === today;
            }).length}
            icon={CheckCircle}
            color="bg-green-50 border border-green-200"
          />
          <StatsCard
            label="Today's Earnings"
            value={`PKR ${stats.todayEarnings.toLocaleString()}`}
            icon={Star}
            color="bg-gold/10 border border-gold/30"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("active")}
            className={clsx(
              "px-4 py-2 text-sm font-medium transition-all relative",
              activeTab === "active"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Active Deliveries
            {activeTasks.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full">
                {activeTasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={clsx(
              "px-4 py-2 text-sm font-medium transition-all relative",
              activeTab === "completed"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Completed
            {completedTasks.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-green-100 text-green-600 rounded-full">
                {completedTasks.length}
              </span>
            )}
          </button>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary/40" />
            <p className="text-sm text-muted-foreground">Loading deliveries...</p>
          </div>
        ) : activeTab === "active" ? (
          <>
            {activeTasks.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                <Bike size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-foreground/70">No active deliveries</p>
                <p className="text-xs text-muted-foreground mt-1">
                  When orders are assigned to you, they'll appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {activeTasks.map((task: DeliveryTask) => (
                  <DeliveryTaskCard
                    key={task.id}
                    task={task}
                    onUpdateStatus={(taskId, status) => updateTaskStatus.mutate({ taskId, status })}
                    isUpdating={updateTaskStatus.isPending}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {completedTasks.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                <CheckCircle size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-foreground/70">No completed deliveries yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed deliveries will appear here for your records
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {completedTasks.map((task: DeliveryTask) => (
                  <DeliveryTaskCard
                    key={task.id}
                    task={task}
                    onUpdateStatus={() => {}}
                    isUpdating={false}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Quick Tips */}
        {activeTasks.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-2">
              <PhoneCall size={14} /> Delivery Tips
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 📞 Call the customer before arriving to confirm location</li>
              <li>• 🍕 Handle food with care - hot items should stay hot</li>
              <li>• 🚚 Mark as "Out for Delivery" when you leave the kitchen</li>
              <li>• ✅ Mark as "Delivered" only when order is handed to customer</li>
              <li>• 💰 Collect cash payment if applicable (order total shown above)</li>
              <li>• ⭐ Get customer signature or confirmation for delivery proof</li>
            </ul>
          </div>
        )}

        {/* Stats Summary */}
        {completedTasks.length > 0 && (
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Total Completed</p>
                <p className="text-xl font-bold text-primary">{stats.completed} deliveries</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-xl font-bold text-primary">PKR {stats.totalEarnings.toLocaleString()}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">Avg per Delivery</p>
                <p className="text-xl font-bold text-primary">
                  PKR {stats.completed > 0 ? Math.round(stats.totalEarnings / stats.completed).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}