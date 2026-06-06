"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import {
  useKitchenCategories,
  useKitchenMenu,
  useKitchenOrders,
  usePlaceOrder,
  useUpdateOrderStatus,
} from "@/hooks/useKitchen";
import {
  Search,
  ShoppingBag,
  Clock,
  Utensils,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  CheckCircle,
  FileText,
  BadgeAlert,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ORDER_STATUS_CONFIG } from "@/types/kitchen";
import { toast } from "sonner";
import api from "@/lib/axios";
export default function CustomerFoodOrdering() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  // Checkout states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<"RoomService" | "Restaurant">("RoomService");
  const [tableNumber, setTableNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [userRoom, setUserRoom] = useState<string | null>(null);
  const [hasBooking, setHasBooking] = useState<boolean>(false);
  const [detectingRoom, setDetectingRoom] = useState(true);
  // Cart
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateSpecialNote,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();
  // Queries
  const { data: categories, isLoading: catsLoading } = useKitchenCategories();
  const { data: menuItems, isLoading: menuLoading } = useKitchenMenu({
    category_id: selectedCategory || undefined,
    available: true,
    active: true,
    q: searchQuery || undefined,
  });
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useKitchenOrders();
  const placeOrderMutation = usePlaceOrder();
  // Detect active checked-in booking
  useEffect(() => {
    async function detectActiveBooking() {
      try {
        setDetectingRoom(true);
        // Let's call /api/bookings or a specific endpoint
        const { data } = await api.get("/bookings");
        // Check if there is an active check-in booking
        const active = data?.bookings?.find((b: any) => b.status === "CheckedIn" || b.status === "Checked-In");
        if (active && active.room) {
          setUserRoom(active.room.room_number);
          setHasBooking(true);
        } else {
          setUserRoom(null);
          setHasBooking(false);
        }
      } catch (err) {
        console.error("Failed to detect active booking", err);
      } finally {
        setDetectingRoom(false);
      }
    }
    if (session) {
      detectActiveBooking();
    }
  }, [session]);
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (orderType === "Restaurant" && !tableNumber) {
      toast.error("Please enter a table number");
      return;
    }
    if (orderType === "RoomService" && !hasBooking) {
      toast.error("No active room booking detected. Room service is only available for checked-in guests.");
      return;
    }
    const payload = {
      order_type: orderType,
      table_number: orderType === "Restaurant" ? tableNumber : undefined,
      room_number: orderType === "RoomService" ? userRoom || undefined : undefined,
      special_instructions: specialInstructions,
      items: cart.map((item) => ({
        food_item_id: item.foodItem.id,
        quantity: item.quantity,
        special_note: item.special_note,
      })),
    };
    placeOrderMutation.mutate(payload, {
      onSuccess: () => {
        clearCart();
        setIsCartOpen(false);
        setSpecialInstructions("");
        setTableNumber("");
        setActiveTab("orders");
        refetchOrders();
      },
    });
  };
  const activeOrders = orders?.filter((o) => !["Delivered", "Cancelled", "Rejected"].includes(o.status)) || [];
  const pastOrders = orders?.filter((o) => ["Delivered", "Cancelled", "Rejected"].includes(o.status)) || [];
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary to-primary/95 p-6 rounded-2xl border border-white/10 shadow-elegant text-white">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            Hotel Kitchen <Sparkles className="text-gold w-6 h-6 animate-pulse" />
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Order premium dishes from our kitchen directly to your room or restaurant table
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === "menu"
                ? "bg-gold text-primary border-gold"
                : "border-white/10 text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            Menu
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all border relative ${
              activeTab === "orders"
                ? "bg-gold text-primary border-gold"
                : "border-white/10 text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            My Orders
            {activeOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-bounce">
                {activeOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>
      {activeTab === "menu" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Menu Categories Sidebar (Desktop) / Carousel (Mobile) */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-bold text-foreground/80 px-1">Categories</h3>
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none flex-nowrap lg:flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border text-left shrink-0 lg:shrink ${
                  selectedCategory === null
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-background border-border text-muted-foreground hover:bg-muted/40"
                }`}
              >
                All Categories
              </button>
              {catsLoading ? (
                <div className="py-2 px-4 text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading categories...
                </div>
              ) : (
                categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border text-left shrink-0 lg:shrink ${
                      selectedCategory === cat.id
                        ? "bg-primary text-white border-primary shadow-md"
                        : "bg-background border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))
              )}
            </div>
          </div>
          {/* Menu Items Grid */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search food items by name, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {/* Menu Items Grid */}
            {menuLoading ? (
              <div className="py-24 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary/40 mb-3" />
                <p className="text-sm text-muted-foreground">Loading menu items...</p>
              </div>
            ) : !menuItems || menuItems.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-border rounded-2xl bg-muted/20">
                <Utensils className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground/70">No food items found</p>
                <p className="text-xs text-muted-foreground mt-1">Try expanding your search query or category filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {menuItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border border-border rounded-2xl overflow-hidden bg-background shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group relative"
                  >
                    {/* Item Image */}
                    <div className="h-44 bg-muted relative overflow-hidden shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-primary/5 text-primary/20">
                          🍳
                        </div>
                      )}
                      {item.featured && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 bg-gold text-primary font-extrabold text-[9px] uppercase tracking-wider rounded-md shadow flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Chef Special
                        </span>
                      )}
                      <span className="absolute bottom-3 left-3 bg-black/60 text-white font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gold" /> {item.preparation_time_minutes} mins
                      </span>
                    </div>
                    {/* Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                            {item.name}
                          </h4>
                          <span className="font-extrabold text-sm text-primary">
                            PKR {Number(item.price).toLocaleString()}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.ingredients_text && (
                          <p className="text-[10px] text-muted-foreground mt-2 italic line-clamp-1">
                            Ingredients: {item.ingredients_text}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          addToCart(item, 1);
                          toast.success(`Added ${item.name} to cart`);
                        }}
                        className="w-full py-2 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to Order
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Orders History/Timeline Tracking */
        <div className="space-y-6">
          {ordersLoading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary/40 mb-3" />
              <p className="text-sm text-muted-foreground">Loading your orders...</p>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-border rounded-2xl bg-muted/20">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground/70">No food orders placed yet</p>
              <p className="text-xs text-muted-foreground mt-1">Order history and live tracking timeline will appear here</p>
              <button
                onClick={() => setActiveTab("menu")}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Orders Section */}
              {activeOrders.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    Active Orders
                  </h3>
                  <div className="space-y-4">
                    {activeOrders.map((order) => (
                      <ActiveOrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </div>
              )}
              {/* Past Orders Section */}
              {pastOrders.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground/80">Past Orders</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pastOrders.map((order) => (
                      <PastOrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Floating Cart Widget */}
      {cart.length > 0 && activeTab === "menu" && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-gold text-primary font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <ShoppingBag className="w-5 h-5 animate-pulse" />
            View Order
            <span className="bg-primary text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
            <span className="text-primary/70 font-semibold border-l border-primary/20 pl-2">
              PKR {totalPrice.toLocaleString()}
            </span>
          </button>
        </div>
      )}
      {/* Cart Drawer Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-50 bg-black backdrop-blur-[1px]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-md bg-background border-l border-border shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/40">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <span className="font-extrabold text-sm text-foreground">Your Order Summary</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted border border-border transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {cart.map((item) => (
                  <div key={item.foodItem.id} className="flex gap-3 border-b border-border pb-4 last:border-b-0">
                    {/* Item details */}
                    <div className="flex-1 space-y-1">
                      <h5 className="font-bold text-sm text-foreground">{item.foodItem.name}</h5>
                      <p className="text-xs text-primary font-bold">
                        PKR {Number(item.foodItem.price).toLocaleString()}
                      </p>
                      
                      {/* Special Note Input */}
                      <input
                        type="text"
                        placeholder="Add special instructions for this item..."
                        value={item.special_note || ""}
                        onChange={(e) => updateSpecialNote(item.foodItem.id, e.target.value)}
                        className="w-full text-xs bg-muted/50 border border-border/80 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-primary"
                      />
                    </div>
                    {/* Quantity Adjustment Controls */}
                    <div className="flex flex-col items-end justify-between shrink-0 h-20">
                      <button
                        onClick={() => removeFromCart(item.foodItem.id)}
                        className="text-muted-foreground hover:text-rose-500 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center border border-border rounded-lg bg-muted/40 p-0.5">
                        <button
                          onClick={() => updateQuantity(item.foodItem.id, item.quantity - 1)}
                          className="p-1 hover:bg-background rounded text-muted-foreground"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.foodItem.id, item.quantity + 1)}
                          className="p-1 hover:bg-background rounded text-muted-foreground"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Delivery Form */}
                <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Delivery & Ordering Type
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType("RoomService")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        orderType === "RoomService"
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-border text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      🛎️ Room Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType("Restaurant")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        orderType === "Restaurant"
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-border text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      🍽️ Restaurant/Table
                    </button>
                  </div>
                  {orderType === "RoomService" ? (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-foreground/60 uppercase">
                        Room Information
                      </label>
                      {detectingRoom ? (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 bg-background border border-border p-3 rounded-lg">
                          <Loader2 className="w-3 h-3 animate-spin" /> Detecting booking...
                        </div>
                      ) : hasBooking && userRoom ? (
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Delivery details: Room {userRoom} (Auto-detected)
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center gap-1.5">
                          <BadgeAlert className="w-4 h-4 text-rose-500 shrink-0" />
                          No active checked-in booking found. Room service delivery is restricted.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-foreground/60 uppercase">
                        Table Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter table number (e.g. 5, A4)..."
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full text-xs border border-border bg-background rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}
                  {/* Special instructions */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-foreground/60 uppercase">
                      Special Order Instructions
                    </label>
                    <textarea
                      placeholder="Add overall instructions (e.g. deliver hot, no spoons, less spices)..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={2}
                      className="w-full text-xs border border-border bg-background rounded-lg py-2 px-3 focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                </div>
              </div>
              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-muted/40 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-muted-foreground">Order Subtotal:</span>
                  <span className="font-extrabold text-lg text-primary">
                    PKR {totalPrice.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placeOrderMutation.isPending || (orderType === "RoomService" && !hasBooking)}
                  className="w-full py-3 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {placeOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                    </>
                  ) : (
                    <>
                      Confirm & Send Order
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
// ─── Active Order Card with Timeline Tracker ──────────────────────────────────
function ActiveOrderCard({ order }: { order: any }) {
  const steps = ["Pending", "Accepted", "Preparing", "Ready", "Assigned", "OutForDelivery", "Delivered"];
  const currentStepIndex = steps.indexOf(order.status);
  // Custom step titles/descriptions
  const stepLabels: Record<string, string> = {
    Pending: "Placed",
    Accepted: "Accepted",
    Preparing: "Preparing",
    Ready: "Ready",
    Assigned: "Assigned",
    OutForDelivery: "Out for Delivery",
    Delivered: "Delivered",
  };
  return (
    <div className="border border-border bg-background rounded-2xl p-5 shadow-sm space-y-5">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-foreground">Order #{order.id}</span>
            <span className="text-xs text-muted-foreground">
              · {new Date(order.placed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex gap-2 mt-1">
            <span className="px-2.5 py-0.5 bg-primary/5 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider">
              {order.order_type === "RoomService" ? `🛎️ Room ${order.room_number}` : `🍽️ Table ${order.table_number}`}
            </span>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
              ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.bg
            } ${ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.color}`}>
              {ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Bill</p>
          <p className="text-base font-black text-primary">PKR {Number(order.total_amount).toLocaleString()}</p>
        </div>
      </div>
      {/* Items Summary */}
      <div className="bg-muted/30 rounded-xl p-3 space-y-2">
        <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">Items ordered</p>
        <div className="divide-y divide-border/60">
          {order.items.map((i: any) => (
            <div key={i.id} className="py-2 flex justify-between items-start text-xs">
              <div>
                <span className="font-bold text-foreground">{i.foodItem?.name}</span>
                <span className="text-muted-foreground ml-1.5 font-medium">x{i.quantity}</span>
                {i.special_note && (
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5 italic">Note: {i.special_note}</p>
                )}
              </div>
              <span className="font-bold text-foreground">PKR {Number(i.subtotal).toLocaleString()}</span>
            </div>
          ))}
        </div>
        {order.special_instructions && (
          <div className="pt-2 border-t border-border/60 text-[10.5px] text-muted-foreground">
            <span className="font-bold text-foreground/70">Special Instructions:</span> {order.special_instructions}
          </div>
        )}
      </div>
      {/* Timeline Status Tracker */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">Live tracking timeline</p>
        <div className="relative flex justify-between items-center w-full px-2">
          {/* Connector Line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-border -z-10" />
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-300 -z-10"
            style={{
              width: `${(currentStepIndex / (steps.length - 1)) * 90}%`,
            }}
          />
          {/* Timeline Nodes */}
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;
            const label = stepLabels[step];
            return (
              <div key={step} className="flex flex-col items-center relative">
                <div
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all shadow ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                        ? "bg-white border-emerald-500 text-emerald-500 scale-110 ring-4 ring-emerald-100"
                        : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span
                  className={`text-[9px] font-extrabold mt-1.5 absolute top-9 whitespace-nowrap ${
                    isActive ? "text-emerald-600 scale-105 font-black" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-6" /> {/* Extra spacing for timeline labels */}
    </div>
  );
}
// ─── Past Order Card ──────────────────────────────────────────────────────────
function PastOrderCard({ order }: { order: any }) {
  return (
    <div className="border border-border bg-background rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        <div className="flex justify-between items-start border-b border-border pb-3">
          <div>
            <h5 className="font-extrabold text-xs text-foreground">Order #{order.id}</h5>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(order.placed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
            ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.bg
          } ${ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.color}`}>
            {ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.label}
          </span>
        </div>
        {/* Items List */}
        <div className="space-y-1.5 mt-3">
          {order.items.map((i: any) => (
            <div key={i.id} className="flex justify-between text-xs text-muted-foreground">
              <span>
                {i.foodItem?.name} <span className="text-[10px]">x{i.quantity}</span>
              </span>
              <span>PKR {Number(i.subtotal).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border pt-3 flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground font-bold uppercase">Total Bill</span>
        <span className="font-bold text-sm text-primary">PKR {Number(order.total_amount).toLocaleString()}</span>
      </div>
    </div>
  );
}
