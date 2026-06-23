"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  Users,
  Clock,
  CheckCircle2,
  Search,
  X,
  Eye,
  Trash2,
  BedDouble,
  Plus,
  ChevronDown,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ArrowLeft,
  Loader2,
  UserCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { useBookings } from "@/hooks/useBookings";
import { useCustomers, useAvailableRoomsForAdmin } from "@/hooks/useCustomers";
import {
  BOOKING_STATUS_CONFIG,
  ALL_BOOKING_STATUSES,
  STATUS_ACTIONS,
  type Booking,
  type BookingStatus,
  type Customer,
  type Room,
} from "@/types/bookings";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { ConfirmDialog } from "../rooms/components/ConfirmDialog";
import api from "@/lib/axios";

// ─── helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const addDays = (d: string, n: number) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
};
const nights = (ci: string, co: string) =>
  Math.max(
    0,
    Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000),
  );
const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtShort = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" });

// ─── Page size options (same pattern as Rooms) ────────────────────────────────
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: BookingStatus }) {
  const c = BOOKING_STATUS_CONFIG[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
        c.bg,
        c.text,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3.5">
      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          color,
        )}
      >
        <Icon size={17} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  total,
  limit,
  isFetching,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: PageSize;
  isFetching: boolean;
  onPageChange: (p: number) => void;
  onLimitChange: (l: PageSize) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const navBtn = (disabled: boolean) =>
    clsx(
      "h-8 w-8 flex items-center justify-center rounded-lg border border-border text-xs transition-colors",
      disabled
        ? "text-muted-foreground/30 bg-muted/30 cursor-not-allowed"
        : "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer",
    );

  return (
    <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {total === 0 ? (
            "No bookings"
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-foreground">
                {from}–{to}
              </span>{" "}
              of <span className="font-medium text-foreground">{total}</span>
            </>
          )}
        </span>
        {isFetching && (
          <Loader2 size={11} className="animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Rows per page
          </span>
          <select
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value) as PageSize);
              onPageChange(1);
            }}
            className="h-7 px-2 pr-6 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="w-px h-4 bg-border" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={navBtn(page === 1)}
          >
            <ChevronLeft size={13} />
          </button>
          <span className="text-xs text-muted-foreground whitespace-nowrap px-1">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">
              {totalPages || 1}
            </span>
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={navBtn(page >= totalPages)}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Detail Modal ──────────────────────────────────────────────────────
function BookingDetailModal({
  booking,
  onClose,
  onStatusChange,
  updatingId,
  updatingStatus,
}: {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: number, status: BookingStatus) => Promise<void>;
  updatingId: number | null;
  updatingStatus: BookingStatus | null;
}) {
  const actions = STATUS_ACTIONS[booking.status] ?? [];
  const photos = booking.room?.photos ?? [];
  const isThisUpdating = updatingId === booking.booking_id;

  const handleAction = async (next: BookingStatus) => {
    await onStatusChange(booking.booking_id, next);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ margin: 0, padding: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo / header */}
        <div className="relative h-44 shrink-0 rounded-t-2xl overflow-hidden bg-muted">
          {photos[0] ? (
            <>
              <Image
                src={photos[0] as string}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent/60">
              <BedDouble size={40} className="text-white/30" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <StatusBadge status={booking.status} />
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X size={15} />
          </button>
          <div className="absolute bottom-3 left-4">
            <p className="text-white font-bold text-lg">
              Room {booking.room?.room_number}
            </p>
            <p className="text-white/70 text-sm">
              {booking.room?.room_type} · {booking.room?.bed_type} Bed
            </p>
          </div>
        </div>

        <div
          className="overflow-y-auto flex-1 p-5 space-y-4"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground">
                Booking #{booking.booking_id}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {booking.source === "ADMIN"
                  ? " Admin booking"
                  : " Customer booking"}{" "}
                · {fmt(booking.created_at)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">
                PKR {Number(booking.total_amount).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {booking.total_nights} nights
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Guest", value: booking.user?.name ?? "—" },
              { label: "Email", value: booking.user?.email ?? "—" },
              { label: "Phone", value: booking.user?.phoneNumber ?? "—" },
              { label: "Check-in", value: fmtShort(booking.check_in_date) },
              { label: "Check-out", value: fmtShort(booking.check_out_date) },
              { label: "Floor", value: `Floor ${booking.room?.floor}` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-muted/50 border border-border rounded-xl px-3 py-2.5"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {label}
                </p>
                <p className="text-xs font-semibold text-foreground mt-1 truncate">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {booking.special_requests && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold mb-1">
                Special Requests
              </p>
              <p className="text-sm text-foreground">
                {booking.special_requests}
              </p>
            </div>
          )}

          {(booking.actual_check_in || booking.actual_check_out) && (
            <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
              {booking.actual_check_in && (
                <p>
                  Checked in:{" "}
                  {new Date(booking.actual_check_in).toLocaleString()}
                </p>
              )}
              {booking.actual_check_out && (
                <p>
                  Checked out:{" "}
                  {new Date(booking.actual_check_out).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2.5 px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
          {actions.map((a) => {
            const isThisAction = isThisUpdating && updatingStatus === a.next;
            return (
              <button
                key={a.next}
                onClick={() => handleAction(a.next)}
                disabled={isThisUpdating}
                className={clsx(
                  "flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60",
                  a.color,
                )}
              >
                {isThisAction ? (
                  <Loader2 size={14} className="animate-spin mx-auto" />
                ) : (
                  a.label
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Customer Search Dropdown ─────────────────────────────────────────────────
function CustomerDropdown({
  customers,
  selected,
  onSelect,
  onCreateNew,
  loading,
}: {
  customers: Customer[];
  selected: Customer | null;
  onSelect: (c: Customer) => void;
  onCreateNew: () => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        const q = search.toLowerCase();
        return (
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          (c.phone_number ?? "").includes(q)
        );
      }),
    [customers, search],
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={clsx(
          "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors text-left",
          open
            ? "border-accent/60 ring-2 ring-accent/20"
            : "border-border hover:border-accent/40",
          "bg-background text-foreground",
        )}
      >
        {selected ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent/70 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {selected.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{selected.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {selected.email}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">
            Select or search customer…
          </span>
        )}
        <ChevronDown
          size={14}
          className={clsx(
            "text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, phone…"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-muted/60 rounded-xl border border-border/50 outline-none focus:border-accent/40 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div
              className="max-h-56 overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              {loading ? (
                <div className="py-6 text-center">
                  <Loader2
                    size={16}
                    className="animate-spin text-muted-foreground mx-auto"
                  />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No customers found
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.customer_id}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors",
                      selected?.customer_id === c.customer_id && "bg-accent/8",
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent/70 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">
                          {c.name}
                        </p>
                        {(c.bookings?.length ?? 0) > 0 && (
                          <span className="text-[9px] font-semibold bg-gold/20 text-gold px-1.5 py-0.5 rounded-full shrink-0">
                            {c.bookings?.length} stays
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {c.email}
                      </p>
                    </div>
                    {selected?.customer_id === c.customer_id && (
                      <CheckCircle2
                        size={13}
                        className="text-accent shrink-0"
                      />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="p-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  onCreateNew();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-accent hover:bg-accent/8 transition-colors"
              >
                <UserPlus size={14} />
                Create new customer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Room Dropdown ─────────────────────────────────────────────────────────────
function RoomDropdown({
  rooms,
  selected,
  onSelect,
  loading,
  error,
  disabled,
}: {
  rooms: Room[];
  selected: Room | null;
  onSelect: (r: Room) => void;
  loading: boolean;
  error: string | null;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (selected && !rooms.find((r) => r.room_id === selected.room_id))
      onSelect(null as any);
  }, [rooms]);

  const typeColors: Record<string, string> = {
    Single: "bg-blue-100 text-blue-700",
    Double: "bg-green-100 text-green-700",
    Suite: "bg-purple-100 text-purple-700",
    Deluxe: "bg-amber-100 text-amber-700",
    Presidential: "bg-gold/20 text-gold",
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        className={clsx(
          "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors text-left",
          disabled
            ? "opacity-50 cursor-not-allowed bg-muted/40 border-border"
            : open
              ? "border-accent/60 ring-2 ring-accent/20 bg-background"
              : "border-border hover:border-accent/40 bg-background",
          "text-foreground",
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 size={13} className="animate-spin" /> Checking
            availability…
          </span>
        ) : selected ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent/70 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {selected.room_number}
            </div>
            <div className="min-w-0">
              <p className="font-medium">
                {selected.room_type} · Floor {selected.floor}
              </p>
              <p className="text-[10px] text-muted-foreground">
                PKR ${Number(selected.price_per_night)}/night ·{" "}
                {selected.bed_type} Bed
              </p>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">
            {disabled
              ? "Select dates first"
              : rooms.length === 0
                ? "No rooms available"
                : "Select an available room…"}
          </span>
        )}
        {!disabled && (
          <ChevronDown
            size={14}
            className={clsx(
              "text-muted-foreground shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {error ? (
              <div className="p-4 text-sm text-red-500 text-center">
                {error}
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-5 text-center">
                <BedDouble
                  size={20}
                  className="mx-auto text-muted-foreground/30 mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  No rooms available for these dates
                </p>
              </div>
            ) : (
              <div
                className="max-h-64 overflow-y-auto"
                style={{ scrollbarWidth: "thin" }}
              >
                {rooms.map((room) => {
                  const amenities = (room.amenities ?? []) as string[];
                  const price = Number(room.price_per_night);
                  return (
                    <button
                      key={room.room_id}
                      type="button"
                      onClick={() => {
                        onSelect(room);
                        setOpen(false);
                      }}
                      className={clsx(
                        "w-full flex items-start gap-3 px-3.5 py-3 text-left hover:bg-muted/60 border-b border-border/50 last:border-0 transition-colors",
                        selected?.room_id === room.room_id && "bg-accent/8",
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent/70 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {room.room_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">
                            Room {room.room_number}
                          </p>
                          <span
                            className={clsx(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                              typeColors[room.room_type] ??
                                "bg-muted text-foreground",
                            )}
                          >
                            {room.room_type}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            Floor {room.floor}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {room.capacity} guests
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {room.bed_type} Bed
                          {room.size_sqft ? ` · ${room.size_sqft} sqft` : ""}
                        </p>
                        {amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {amenities.slice(0, 3).map((a) => (
                              <span
                                key={a}
                                className="text-[9px] bg-muted border border-border px-1.5 py-0.5 rounded text-muted-foreground"
                              >
                                {a}
                              </span>
                            ))}
                            {amenities.length > 3 && (
                              <span className="text-[9px] text-muted-foreground">
                                +{amenities.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">
                          PKR {price}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          /night
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Create Customer Sub-Form ──────────────────────────────────────────────────
interface NewCustomerForm {
  name: string;
  email: string;
  phoneNumber: string;
  cnic: string;
  gender: "Male" | "Female" | "Other" | "";
  dateOfBirth: string;
  city: string;
  country: string;
  emergencyContact: string;
  notes: string;
}

function CreateCustomerPanel({
  onBack,
  onCreated,
  createCustomer,
}: {
  onBack: () => void;
  onCreated: (c: Customer) => void;
  createCustomer: (
    p: any,
  ) => Promise<{ ok: boolean; data?: Customer; error?: string }>;
}) {
  const [form, setForm] = useState<NewCustomerForm>({
    name: "",
    email: "",
    phoneNumber: "",
    cnic: "",
    gender: "",
    dateOfBirth: "",
    city: "",
    country: "",
    emergencyContact: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<NewCustomerForm>>({});

  const set =
    (k: keyof NewCustomerForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const errs: Partial<NewCustomerForm> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.phoneNumber.trim()) errs.phoneNumber = "Required";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Invalid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    const res = await createCustomer({
      name: form.name,
      email: form.email,
      phone_number: form.phoneNumber,
      cnic: form.cnic,
      gender: form.gender,
      date_of_birth: form.dateOfBirth,
      city: form.city,
      country: form.country,
      emergency_contact: form.emergencyContact,
      notes: form.notes,
    });
    setSaving(false);
    if (res.ok && res.data) {
      onCreated(res.data);
    } else {
      setErrors({ email: res.error ?? "Failed to create" });
    }
  };

  const fields = [
    {
      k: "name",
      label: "Full Name *",
      type: "text",
      placeholder: "John Smith",
      icon: Users,
    },
    {
      k: "email",
      label: "Email",
      type: "email",
      placeholder: "john@email.com",
      icon: Mail,
    },
    {
      k: "phoneNumber",
      label: "Phone Number *",
      type: "tel",
      placeholder: "+92 300 1234567",
      icon: Phone,
    },
    {
      k: "cnic",
      label: "CNIC",
      type: "text",
      placeholder: "35202-1234567-1",
      icon: CreditCard,
    },
    {
      k: "city",
      label: "City",
      type: "text",
      placeholder: "Lahore",
      icon: MapPin,
    },
    {
      k: "country",
      label: "Country",
      type: "text",
      placeholder: "Pakistan",
      icon: MapPin,
    },
    {
      k: "emergencyContact",
      label: "Emergency Contact",
      type: "tel",
      placeholder: "+92 300 1111111",
      icon: Phone,
    },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Create New Customer
          </h4>
          <p className="text-xs text-muted-foreground">
            Create a guest profile for hotel bookings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ k, label, type, placeholder, icon: Icon }) => (
          <div key={k} className={k === "name" ? "col-span-2" : ""}>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {label}
            </label>
            <div className="relative">
              <Icon
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type={type}
                value={form[k]}
                onChange={set(k)}
                placeholder={placeholder}
                className={clsx(
                  "w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm bg-background text-foreground outline-none transition-colors",
                  errors[k]
                    ? "border-red-400 focus:border-red-400"
                    : "border-border focus:border-accent/50",
                )}
              />
            </div>
            {errors[k] && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors[k]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Gender
          </label>
          <select
            value={form.gender}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, gender: e.target.value as any }))
            }
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Date of Birth
          </label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
            }
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Notes
        </label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Additional guest notes..."
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none"
        />
      </div>

      <button
        type="button"
        onClick={handleCreate}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <UserPlus size={14} />
        )}
        {saving ? "Creating…" : "Create Customer"}
      </button>
    </motion.div>
  );
}

// ─── Create Booking Modal ──────────────────────────────────────────────────────
function CreateBookingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (b: Booking) => void;
}) {
  const { customers, loading: custLoading, createCustomer } = useCustomers();
  const [step, setStep] = useState<"main" | "create-customer">("main");
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [checkIn, setCheckIn] = useState(addDays(today(), 1));
  const [checkOut, setCheckOut] = useState(addDays(today(), 3));
  const [specialReqs, setSpecialReqs] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
  } = useAvailableRoomsForAdmin(checkIn, checkOut);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const nightCount = nights(checkIn, checkOut);
  const total = selectedRoom
    ? Number(selectedRoom.price_per_night) * nightCount
    : 0;
  const datesValid = checkIn && checkOut && checkIn < checkOut;

  const handleCustomerCreated = (c: Customer) => {
    setSelectedCust(c);
    setStep("main");
  };

  const handleSubmit = async () => {
    if (!selectedCust) return toast.error("Please select a customer");
    if (!selectedRoom) return toast.error("Please select a room");
    if (!datesValid) return toast.error("Please enter valid dates");

    setSaving(true);
    try {
      const { data } = await api.post("/bookings", {
        room_id: selectedRoom.room_id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        special_requests: specialReqs || undefined,
        customer_id: selectedCust.customer_id,
        source: "ADMIN",
      });

      toast.success(`Booking #${data.booking.booking_id} created!`);
      onCreated(data.booking);
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ margin: 0, padding: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col"
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <CalendarCheck size={15} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                Create New Booking
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Admin reservation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div
          className="overflow-y-auto flex-1 p-5"
          style={{ scrollbarWidth: "thin" }}
        >
          <AnimatePresence mode="wait">
            {step === "create-customer" ? (
              <CreateCustomerPanel
                key="create"
                onBack={() => setStep("main")}
                onCreated={handleCustomerCreated}
                createCustomer={createCustomer}
              />
            ) : (
              <motion.div
                key="main"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                {/* Customer */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                    <UserCheck size={12} className="text-accent" /> Customer *
                  </label>
                  <CustomerDropdown
                    customers={customers}
                    selected={selectedCust}
                    onSelect={setSelectedCust}
                    onCreateNew={() => setStep("create-customer")}
                    loading={custLoading}
                  />
                  {selectedCust && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-3 flex-wrap text-[11px] text-muted-foreground mt-1 pl-1">
                        {selectedCust.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} />
                            {selectedCust.phone_number}
                          </span>
                        )}
                        {selectedCust.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {selectedCust.city}
                            {selectedCust.country
                              ? `, ${selectedCust.country}`
                              : ""}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CalendarCheck size={10} />
                          {selectedCust.bookings?.length ?? 0} previous booking
                          {(selectedCust.bookings?.length ?? 0) !== 1
                            ? "s"
                            : ""}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Dates */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                    <Calendar size={12} className="text-accent" /> Stay Dates *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Check-in
                      </p>
                      <input
                        type="date"
                        value={checkIn}
                        min={today()}
                        onChange={(e) => {
                          setCheckIn(e.target.value);
                          if (e.target.value >= checkOut)
                            setCheckOut(addDays(e.target.value, 1));
                          setSelectedRoom(null);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-accent/50 transition-colors"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Check-out
                      </p>
                      <input
                        type="date"
                        value={checkOut}
                        min={addDays(checkIn, 1)}
                        onChange={(e) => {
                          setCheckOut(e.target.value);
                          setSelectedRoom(null);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-accent/50 transition-colors"
                      />
                    </div>
                  </div>
                  {datesValid && nightCount > 0 && (
                    <p className="text-xs text-accent font-medium pl-0.5">
                      {nightCount} night{nightCount !== 1 ? "s" : ""} ·{" "}
                      {fmtShort(checkIn)} → {fmtShort(checkOut)}
                    </p>
                  )}
                </div>

                {/* Room */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                      <BedDouble size={12} className="text-accent" /> Room *
                    </label>
                    {!roomsLoading && datesValid && rooms.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {rooms.length} available
                      </span>
                    )}
                  </div>
                  <RoomDropdown
                    rooms={rooms}
                    selected={selectedRoom}
                    onSelect={setSelectedRoom}
                    loading={roomsLoading}
                    error={roomsError}
                    disabled={!datesValid}
                  />
                  {selectedRoom && nightCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-3 rounded-xl bg-muted/50 border border-border space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            PKR {Number(selectedRoom.price_per_night)} ×{" "}
                            {nightCount} nights
                          </span>
                          <span className="font-medium">
                            PKR {total.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1.5 font-semibold text-sm">
                          <span className="text-foreground">Total</span>
                          <span className="text-accent">
                            PKR {total.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Booking will be auto-confirmed (Admin)
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Special Requests */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Special Requests{" "}
                    <span className="text-muted-foreground font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={specialReqs}
                    onChange={(e) => setSpecialReqs(e.target.value)}
                    placeholder="e.g. Early check-in, extra pillows, sea-facing room…"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent/50 resize-none transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === "main" && (
          <div className="flex gap-3 px-5 py-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !selectedCust || !selectedRoom}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <CalendarCheck size={14} /> Confirm Booking
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main Admin Bookings Page ──────────────────────────────────────────────────
export default function AdminBookings() {
  // ── Pagination + filter state ──
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageSize>(10);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "All">(
    "All",
  );
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);

  // Debounce search so API isn't hit on every keystroke
  const debouncedSearch = useDebounce(search, 400);

  const {
    bookings,
    pagination,
    loading,
    isFetching,
    error,
    refresh,
    updateStatus,
    deleteBooking,
    updatingId,
    updatingStatus,
    isDeleting,
    deletingId,
  } = useBookings({
    page,
    limit,
    search: debouncedSearch,
    status: filterStatus,
  });

  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Reset to page 1 when filters change
  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };
  const handleStatusFilter = (val: BookingStatus | "All") => {
    setFilterStatus(val);
    setPage(1);
  };

  const handleStatusChange = async (id: number, status: BookingStatus) => {
    const res = await updateStatus(id, status);
    if (res.ok) toast.success(`Booking ${status}`);
    else toast.error(res.error);
  };
  const handleDelete = (booking: Booking) => {
    setDeleteTarget(booking);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteBooking(deleteTarget.booking_id);
    if (res.ok) {
      toast.success("Booking deleted");
      setDeleteTarget(null);
    } else {
      toast.error(res.error);
    }
  };

  // Stats from current page data (server handles filtering, these reflect visible rows)
  const stats = {
    total: pagination?.total ?? bookings.length,
    pending: bookings.filter((b) => b.status === "Pending").length,
    confirmed: bookings.filter((b) => b.status === "Confirmed").length,
    checkedIn: bookings.filter((b) => b.status === "CheckedIn").length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all reservations, check-ins and check-outs
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={15} /> Add Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={CalendarCheck}
          color="bg-primary"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          icon={CheckCircle2}
          color="bg-blue-500"
        />
        <StatCard
          label="Checked In"
          value={stats.checkedIn}
          icon={Users}
          color="bg-green-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search guest, room, booking ID…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <select
          value={filterStatus}
          onChange={(e) => handleStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
        >
          <option value="All">All Statuses</option>
          {ALL_BOOKING_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2
              size={22}
              className="animate-spin text-muted-foreground/40"
            />
            <p className="text-sm text-muted-foreground">Loading bookings…</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto relative">
            {/* Overlay spinner on page / filter change (not initial load) */}
            {isFetching && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border shadow-sm">
                  <Loader2
                    size={13}
                    className="animate-spin text-muted-foreground"
                  />
                  <span className="text-xs text-muted-foreground">
                    Updating…
                  </span>
                </div>
              </div>
            )}

            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {[
                    "ID",
                    "Guest",
                    "Room",
                    "Check-in",
                    "Check-out",
                    "Nights",
                    "Amount",
                    "Status",
                    "Source",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <CalendarCheck
                        size={28}
                        className="mx-auto mb-2.5 text-muted-foreground/20"
                      />
                      <p className="text-sm text-muted-foreground">
                        No bookings found
                      </p>
                    </td>
                  </tr>
                ) : (
                  bookings.map((b, i) => {
                    const isRowUpdating = updatingId === b.booking_id;
                    const isRowDeleting = deletingId === b.booking_id;

                    return (
                      <motion.tr
                        key={b.booking_id}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={clsx(
                          "border-t border-border hover:bg-muted/30 transition-colors",
                          (isRowUpdating || isRowDeleting) && "opacity-60",
                        )}
                      >
                        {/* ID */}
                        <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">
                          #{b.booking_id}
                        </td>

                        {/* Guest */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent/70 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                              {(b.user?.name ?? "?")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-xs truncate max-w-[110px]">
                                {b.user?.name ?? "—"}
                              </p>
                              <p className="text-muted-foreground text-[10px] truncate max-w-[110px]">
                                {b.user?.email ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Room */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {b.room?.photos?.[0] ? (
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-border">
                                <Image
                                  src={b.room.photos[0] as string}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                                <BedDouble
                                  size={12}
                                  className="text-muted-foreground/40"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground text-xs">
                                {b.room?.room_number ?? "—"}
                              </p>
                              <p className="text-muted-foreground text-[10px]">
                                {b.room?.room_type}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Check-in */}
                        <td className="px-4 py-3.5 text-foreground text-xs whitespace-nowrap">
                          {fmtShort(b.check_in_date)}
                        </td>
                        {/* Check-out */}
                        <td className="px-4 py-3.5 text-foreground text-xs whitespace-nowrap">
                          {fmtShort(b.check_out_date)}
                        </td>
                        {/* Nights */}
                        <td className="px-4 py-3.5 text-muted-foreground text-xs">
                          {b.total_nights}n
                        </td>
                        {/* Amount */}
                        <td className="px-4 py-3.5 font-semibold text-foreground text-xs">
                          PKR {Number(b.total_amount).toFixed(0)}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {isRowUpdating ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                              <Loader2 size={10} className="animate-spin" />
                              Updating…
                            </span>
                          ) : (
                            <StatusBadge status={b.status} />
                          )}
                        </td>
                        {/* Source */}
                        <td className="px-4 py-3.5">
                          <span
                            className={clsx(
                              "text-[9px] font-semibold px-1.5 py-0.5 rounded",
                              b.source === "ADMIN"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700",
                            )}
                          >
                            {b.source === "ADMIN" ? "Admin" : "Customer"}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setViewBooking(b)}
                              disabled={isRowUpdating || isRowDeleting}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(b)}
                              disabled={isDeleting || isRowUpdating}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                            >
                              {isRowDeleting ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin text-red-400"
                                />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pagination && (
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={limit}
            isFetching={isFetching}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {viewBooking && (
          <BookingDetailModal
            booking={viewBooking}
            onClose={() => setViewBooking(null)}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
            updatingStatus={updatingStatus}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <CreateBookingModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              refresh();
              setShowCreate(false);
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Booking"
        message={`Are you sure you want to delete Booking #${deleteTarget?.booking_id} for ${deleteTarget?.user?.name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </div>
  );
}
