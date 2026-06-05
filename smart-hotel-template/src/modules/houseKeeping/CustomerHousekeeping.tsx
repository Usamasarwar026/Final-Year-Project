// src/modules/housekeeping/CustomerHousekeeping.tsx
"use client";

import {
  useActiveBooking,
  useCustomerServiceRequests,
} from "@/hooks/useCustomerHousekeeping";
import type { RequestType, ServiceRequest } from "@/types/housekeeping";
import { REQUEST_STATUS_CONFIG } from "@/types/housekeeping";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  BedDouble,
  Bell,
  CheckCircle2,
  ChevronRight,
  Droplets,
  History,
  Info,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Send,
  Shirt,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtDT = (d: string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Request Type Visual Config (richer icons for customer UI) ────────────────
const CUSTOMER_REQUEST_CONFIG: Record<
  RequestType,
  {
    label: string;
    icon: React.ElementType;
    description: string;
    emoji: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  Towels: {
    label: "Extra Towels",
    icon: Droplets,
    description: "Request fresh towels for your room",
    emoji: "🛁",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  Laundry: {
    label: "Laundry",
    icon: Shirt,
    description: "Send clothes for washing and pressing",
    emoji: "👕",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  RoomService: {
    label: "Room Service",
    icon: UtensilsCrossed,
    description: "Order food or beverages to your room",
    emoji: "🍽️",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  Water: {
    label: "Water Bottle",
    icon: ShoppingBag,
    description: "Request drinking water bottles",
    emoji: "💧",
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  Other: {
    label: "Other Request",
    icon: Package,
    description: "Any other housekeeping request",
    emoji: "📦",
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const c = REQUEST_STATUS_CONFIG[status as keyof typeof REQUEST_STATUS_CONFIG];
  if (!c) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
        c.bg,
        c.color,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ req }: { req: ServiceRequest }) {
  const cfg = CUSTOMER_REQUEST_CONFIG[req.request_type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "rounded-2xl border p-4 transition-all",
        cfg.bg,
        cfg.border,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
            cfg.bg,
            cfg.border,
          )}
        >
          <span className="text-xl">{cfg.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className={clsx("text-sm font-semibold", cfg.color)}>
              {cfg.label}
            </p>
            <StatusBadge status={req.status} />
          </div>
          {req.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {req.description}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {fmtDT(req.created_at)} · Room {req.room?.room_number ?? "—"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-2">
        {(["Pending", "Assigned", "Completed"] as const).map((step, i) => {
          const steps = ["Pending", "Assigned", "Completed"];
          const curr = steps.indexOf(req.status);
          const done = i <= curr && req.status !== "Cancelled";
          return (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div
                className={clsx(
                  "w-full h-1 rounded-full transition-all",
                  done ? "bg-current" : "bg-muted-foreground/20",
                  cfg.color,
                )}
              ></div>
              {i === steps.length - 1 && (
                <div
                  className={clsx(
                    "w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-all",
                    done
                      ? clsx("border-current bg-current/10", cfg.color)
                      : "border-muted-foreground/20",
                  )}
                >
                  {done && <CheckCircle2 size={10} className={cfg.color} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-muted-foreground">Submitted</span>
        <span className="text-[9px] text-muted-foreground">Assigned</span>
        <span className="text-[9px] text-muted-foreground">Done</span>
      </div>
    </motion.div>
  );
}

// ─── Submit Request Modal ─────────────────────────────────────────────────────
function SubmitRequestModal({
  bookingId,
  roomNumber,
  onClose,
  onSubmitted,
  defaultType,
}: {
  bookingId: number;
  roomNumber: string;
  onClose: () => void;
  onSubmitted: () => void;
  defaultType: RequestType | null;
}) {
  const { submitRequest } = useCustomerServiceRequests();
  const [selected, setSelected] = useState<RequestType | null>(defaultType);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"select" | "details">("select");

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    const res = await submitRequest(
      bookingId,
      selected,
      description || undefined,
    );
    setSubmitting(false);
    if (res.ok) {
      toast.success(
        "Request submitted! Our team will attend to you shortly. 🛎️",
      );
      onSubmitted();
      onClose();
    } else {
      toast.error(res.error ?? "Failed to submit request");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-base">
              🛎️
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                New Request
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Room {roomNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted transition-colors"
          >
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{ scrollbarWidth: "thin" }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Select type */}
            {step === "select" && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-3"
              >
                <p className="text-xs text-muted-foreground">
                  What do you need?
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    Object.entries(CUSTOMER_REQUEST_CONFIG) as [
                      RequestType,
                      (typeof CUSTOMER_REQUEST_CONFIG)[RequestType],
                    ][]
                  ).map(([type, cfg]) => {
                    const selected_ = selected === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelected(type)}
                        className={clsx(
                          "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                          selected_
                            ? clsx("border-2 border-primary bg-primary/5")
                            : clsx(
                                "border-border hover:border-primary/30",
                                cfg.bg,
                                cfg.border,
                              ),
                        )}
                      >
                        <span className="text-2xl">{cfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={clsx(
                              "text-sm font-semibold",
                              selected_ ? "text-primary" : cfg.color,
                            )}
                          >
                            {cfg.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {cfg.description}
                          </p>
                        </div>
                        {selected_ && (
                          <CheckCircle2
                            size={16}
                            className="text-primary shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === "details" && selected && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                {/* Selected type preview */}
                <div
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-xl border",
                    CUSTOMER_REQUEST_CONFIG[selected].bg,
                    CUSTOMER_REQUEST_CONFIG[selected].border,
                  )}
                >
                  <span className="text-2xl">
                    {CUSTOMER_REQUEST_CONFIG[selected].emoji}
                  </span>
                  <div>
                    <p
                      className={clsx(
                        "text-sm font-semibold",
                        CUSTOMER_REQUEST_CONFIG[selected].color,
                      )}
                    >
                      {CUSTOMER_REQUEST_CONFIG[selected].label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Room {roomNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep("select")}
                    className="ml-auto text-[10px] text-primary hover:underline"
                  >
                    Change
                  </button>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Additional Details{" "}
                    <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 resize-none transition-all"
                    placeholder={
                      selected === "Towels"
                        ? "e.g. 2 bath towels, 1 hand towel"
                        : selected === "Laundry"
                          ? "e.g. 3 shirts, 2 trousers"
                          : selected === "RoomService"
                            ? "e.g. 1 tea, 2 sandwiches"
                            : selected === "Water"
                              ? "e.g. 2 bottles"
                              : "Describe your request…"
                    }
                  />
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-blue-700">
                    Our housekeeping team will attend to your request shortly.
                    You can track the status from your requests history.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={step === "select" ? onClose : () => setStep("select")}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {step === "select" ? "Cancel" : "← Back"}
          </button>
          {step === "select" ? (
            <button
              onClick={() => {
                if (selected) setStep("details");
                else toast.error("Please select a request type");
              }}
              disabled={!selected}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Next → <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send size={13} /> Submit Request
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── No Active Booking State ──────────────────────────────────────────────────
function NoBookingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-4">
        <BedDouble size={32} className="text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">No Active Stay</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        You need to be checked in to a room to submit housekeeping requests.
      </p>
      <div className="mt-6 flex items-start gap-2 p-4 bg-blue-50 border border-blue-100 rounded-xl max-w-sm">
        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 text-left">
          Once you are checked in, you can request towels, laundry pickup, room
          service, and more directly from this page.
        </p>
      </div>
    </div>
  );
}

// ─── Main CustomerHousekeeping ────────────────────────────────────────────────
export default function CustomerHousekeeping() {
  const {
    booking,
    loading: bLoading,
    refresh: refreshBooking,
  } = useActiveBooking();
  console.log("Active booking:", booking); // Debug log
  const {
    requests,
    loading: rLoading,
    refresh: refreshRequests,
  } = useCustomerServiceRequests();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"request" | "history">("request");
  const [selectedRequestType, setSelectedRequestType] =
    useState<RequestType | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "Pending").length,
    [requests],
  );
  const assignedCount = useMemo(
    () => requests.filter((r) => r.status === "Assigned").length,
    [requests],
  );
  const completedCount = useMemo(
    () => requests.filter((r) => r.status === "Completed").length,
    [requests],
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    await Promise.all([refreshBooking(), refreshRequests()]);

    setRefreshing(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            Room Services
          </h1>
          <p className="text-sm text-muted-foreground">
            Request housekeeping and room services
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
        >
          <RefreshCw size={15} className={clsx(refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Active booking banner */}
      {bLoading ? (
        <div className="py-6 flex justify-center">
          <Loader2
            size={18}
            className="animate-spin text-muted-foreground/40"
          />
        </div>
      ) : booking ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <BedDouble size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">
                  Room {booking.room.room_number}
                </p>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
                  Checked In
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Floor {booking.room.floor} · {booking.room.room_type}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(booking.check_in_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}{" "}
                →{" "}
                {new Date(booking.check_out_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus size={13} /> Request
            </button>
          </div>
        </motion.div>
      ) : (
        <NoBookingState />
      )}

      {booking && (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Pending",
                value: pendingCount,
                color: "text-amber-600",
                bg: "bg-amber-50",
                dot: "bg-amber-400",
              },
              {
                label: "Assigned",
                value: assignedCount,
                color: "text-blue-600",
                bg: "bg-blue-50",
                dot: "bg-blue-500",
              },
              {
                label: "Completed",
                value: completedCount,
                color: "text-green-600",
                bg: "bg-green-50",
                dot: "bg-green-500",
              },
            ].map(({ label, value, color, bg, dot }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "rounded-2xl p-4 text-center border border-transparent",
                  bg,
                )}
              >
                <p className={clsx("text-3xl font-bold", color)}>{value}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className={clsx("w-1.5 h-1.5 rounded-full", dot)} />
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick request shortcuts */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              Quick Request
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                Object.entries(CUSTOMER_REQUEST_CONFIG) as [
                  RequestType,
                  (typeof CUSTOMER_REQUEST_CONFIG)[RequestType],
                ][]
              ).map(([type, cfg]) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedRequestType(type);
                    setShowModal(true);
                  }}
                  className={clsx(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all hover:scale-105 active:scale-95",
                    cfg.bg,
                    cfg.border,
                    "hover:shadow-sm",
                  )}
                >
                  <span className="text-2xl">{cfg.emoji}</span>
                  <span
                    className={clsx(
                      "text-[10px] font-semibold leading-tight",
                      cfg.color,
                    )}
                  >
                    {cfg.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border flex">
            {[
              { key: "request", label: "Recent Requests", icon: Bell },
              { key: "history", label: "All History", icon: History },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* Requests List */}
          {rLoading ? (
            <div className="py-10 flex flex-col items-center gap-2">
              <Loader2
                size={18}
                className="animate-spin text-muted-foreground/40"
              />
              <p className="text-sm text-muted-foreground">Loading requests…</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {(() => {
                  const list =
                    activeTab === "request"
                      ? requests
                          .filter(
                            (r) =>
                              r.status !== "Completed" &&
                              r.status !== "Cancelled",
                          )
                          .slice(0, 10)
                      : requests;

                  if (list.length === 0) {
                    return (
                      <div className="py-14 text-center">
                        <Bell
                          size={28}
                          className="mx-auto text-muted-foreground/20 mb-3"
                        />
                        <p className="text-sm font-medium text-foreground">
                          {activeTab === "request"
                            ? "No active requests"
                            : "No requests yet"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tap the Request button to get started
                        </p>
                        <button
                          onClick={() => setShowModal(true)}
                          className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity mx-auto"
                        >
                          <Plus size={12} /> New Request
                        </button>
                      </div>
                    );
                  }

                  return list.map((req) => (
                    <RequestCard key={req.request_id} req={req} />
                  ));
                })()}
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}

      {/* Submit Modal */}
      <AnimatePresence>
        {showModal && booking && (
          <SubmitRequestModal
            bookingId={booking.booking_id}
            roomNumber={booking.room.room_number}
            onClose={() => setShowModal(false)}
            onSubmitted={() => refreshRequests()}
            defaultType={selectedRequestType}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
