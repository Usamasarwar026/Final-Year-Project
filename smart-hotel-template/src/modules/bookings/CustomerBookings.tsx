// src/modules/booking/CustomerBookings.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, BedDouble, X,
  CheckCircle2, XCircle, ArrowRight, CalendarDays,
} from "lucide-react";
import clsx from "clsx";
import { useBookings, useAvailableRooms } from "@/hooks/useBookings";
import {
  BOOKING_STATUS_CONFIG, type Booking, type BookingStatus,
} from "@/types/bookings";

// ── Helpers ───────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const addDays = (d: string, n: number) => {
  const dt = new Date(d); dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const c = BOOKING_STATUS_CONFIG[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", c.bg, c.text)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
      className={clsx(
        "fixed bottom-6 right-6 z-[500] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-elegant text-sm font-medium",
        type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
      )}>
      {type === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
      {msg}
    </motion.div>
  );
}

// ── Room Card ─────────────────────────────────────────────────
function RoomCard({ room, checkIn, checkOut, nights, onBook }: {
  room: any; checkIn: string; checkOut: string; nights: number;
  onBook: (room: any) => void;
}) {
  const photos    = Array.isArray(room.photos)    ? room.photos    : [];
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];
  const total     = Number(room.price_per_night) * nights;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
      className="bg-background border border-border rounded-2xl overflow-hidden hover:shadow-elegant transition-all duration-200 group"
    >
      {/* Photo */}
      <div className="relative h-48 bg-muted">
        {photos[0] ? (
          <Image src={photos[0]} alt={`Room ${room.room_number}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble size={36} className="text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Room number overlay */}
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-bold">Room {room.room_number}</p>
          <p className="text-white/70 text-xs">Floor {room.floor}</p>
        </div>

        {/* Available badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Available
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Type + bed */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{room.room_type}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{room.bed_type} Bed · {room.capacity} Guests max</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">PKR ${Number(room.price_per_night).toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">per night</p>
          </div>
        </div>

        {/* Amenity chips — top 4 */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 4).map((a: string) => (
              <span key={a} className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-medium text-muted-foreground">
                {a}
              </span>
            ))}
            {amenities.length > 4 && (
              <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] text-muted-foreground">
                +{amenities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Total + Book Now */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">{nights} night{nights > 1 ? "s" : ""} total</p>
            <p className="font-bold text-foreground">PKR ${total.toFixed(0)}</p>
          </div>
          <button onClick={() => onBook(room)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            Book Now <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Booking Confirmation Modal ────────────────────────────────
function BookingModal({ room, checkIn, checkOut, nights, onConfirm, onClose }: {
  room: any; checkIn: string; checkOut: string; nights: number;
  onConfirm: (requests: string) => Promise<void>;
  onClose: () => void;
}) {
  const [requests, setRequests] = useState("");
  const [saving,   setSaving]   = useState(false);
  const photos = Array.isArray(room.photos) ? room.photos : [];

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(requests);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
         style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div
        className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md"
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Confirm Booking</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Room preview */}
          <div className="flex gap-3 p-3 bg-muted/40 border border-border rounded-xl">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted">
              {photos[0] ? (
                <Image src={photos[0]} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BedDouble size={20} className="text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Room {room.room_number}</p>
              <p className="text-sm text-muted-foreground">{room.room_type} · {room.bed_type} Bed</p>
              <p className="text-xs text-muted-foreground mt-0.5">Floor {room.floor}</p>
            </div>
          </div>

          {/* Date summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Check-in",  value: new Date(checkIn).toLocaleDateString("en-US", { day: "numeric", month: "short" }) },
              { label: "Check-out", value: new Date(checkOut).toLocaleDateString("en-US", { day: "numeric", month: "short" }) },
              { label: "Total",     value: `PKR ${(Number(room.price_per_night) * nights).toFixed(0)}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/50 border border-border rounded-xl px-2.5 py-2 text-center">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {nights} night{nights > 1 ? "s" : ""} · PKR ${Number(room.price_per_night).toFixed(0)}/night
          </p>

          {/* Special requests */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Special Requests <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea rows={3} value={requests} onChange={(e) => setRequests(e.target.value)}
              placeholder="e.g. Early check-in, extra pillows, ground floor preference…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors resize-none" />
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Your booking will be <strong>Pending</strong> until confirmed by our team.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
            {saving ? "Booking…" : "Confirm Booking"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── My Bookings List ──────────────────────────────────────────
function MyBookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: number) => void }) {
  const photos = booking.room?.photos ?? [];
  const canCancel = ["Pending","Confirmed"].includes(booking.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-background border border-border rounded-2xl overflow-hidden"
    >
      <div className="flex gap-0">
        {/* Room photo strip */}
        <div className="relative w-24 sm:w-32 shrink-0">
          {photos[0] ? (
            <Image src={photos[0]} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <BedDouble size={20} className="text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-4 space-y-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                Room {booking.room?.room_number} · {booking.room?.room_type}
              </p>
              <p className="text-xs text-muted-foreground">{booking.room?.bed_type} Bed · Floor {booking.room?.floor}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays size={11} />
              {new Date(booking.check_in_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
              {" → "}
              {new Date(booking.check_out_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
            </span>
            <span>{booking.total_nights} nights</span>
            <span className="font-semibold text-foreground">PKR ${booking.total_amount.toFixed(0)}</span>
          </div>

          {canCancel && (
            <button onClick={() => onCancel(booking.booking_id)}
              className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors">
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Customer Bookings Page ───────────────────────────────
export default function CustomerBookings() {
  const { bookings, loading, error, createBooking, cancelBooking } = useBookings();

  // Date picker state
  const [checkIn,  setCheckIn]  = useState(today());
  const [checkOut, setCheckOut] = useState(addDays(today(), 2));
  const [tab, setTab] = useState<"browse" | "my">("browse");

  // Room search
  const { rooms: availableRooms, loading: roomsLoading, error: roomsError } = useAvailableRooms(checkIn, checkOut);

  // Booking modal
  const [bookingRoom, setBookingRoom] = useState<any | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const nights = Math.max(1, Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
  ));

  const handleConfirmBooking = async (requests: string) => {
    if (!bookingRoom) return;
    const res = await createBooking({
      room_id:          bookingRoom.room_id,
      check_in_date:    checkIn,
      check_out_date:   checkOut,
      special_requests: requests || undefined,
    });
    setBookingRoom(null);
    if (res.ok) {
      showToast("Booking created! Awaiting confirmation.");
      setTab("my");
    } else {
      showToast(res.error ?? "Failed to book", "error");
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this booking?")) return;
    const res = await cancelBooking(id);
    if (res.ok) showToast("Booking cancelled.");
    else showToast(res.error ?? "Failed", "error");
  };

  const inputCls = "px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse available rooms and manage your reservations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {(["browse", "my"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>
            {t === "browse" ? "Browse Rooms" : `My Bookings (${bookings.length})`}
          </button>
        ))}
      </div>

      {/* ── Browse Tab ── */}
      {tab === "browse" && (
        <div className="space-y-5">
          {/* Date picker */}
          <div className="bg-background border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Select your dates</p>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Check-in</label>
                <input type="date" value={checkIn} min={today()}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1));
                  }}
                  className={inputCls + " w-full"} />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Check-out</label>
                <input type="date" value={checkOut} min={addDays(checkIn, 1)}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={inputCls + " w-full"} />
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground whitespace-nowrap">
                {nights} night{nights > 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Room cards grid */}
          {roomsLoading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Checking availability…</p>
            </div>
          ) : roomsError ? (
            <p className="text-sm text-red-500 text-center py-8">{roomsError}</p>
          ) : availableRooms.length === 0 ? (
            <div className="py-16 text-center">
              <BedDouble size={32} className="mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground font-medium">No rooms available for these dates</p>
              <p className="text-xs text-muted-foreground mt-1">Try different dates</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{availableRooms.length}</span> room{availableRooms.length !== 1 ? "s" : ""} available
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableRooms.map((room: any) => (
                  <RoomCard key={room.room_id} room={room}
                    checkIn={checkIn} checkOut={checkOut} nights={nights}
                    onBook={setBookingRoom} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── My Bookings Tab ── */}
      {tab === "my" && (
        <div className="space-y-3">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your bookings…</p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarCheck size={32} className="mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground font-medium">No bookings yet</p>
              <button onClick={() => setTab("browse")}
                className="mt-3 text-sm text-primary hover:underline">
                Browse available rooms
              </button>
            </div>
          ) : (
            bookings.map((b) => (
              <MyBookingCard key={b.booking_id} booking={b} onCancel={handleCancel} />
            ))
          )}
        </div>
      )}

      {/* Booking confirmation modal */}
      <AnimatePresence>
        {bookingRoom && (
          <BookingModal
            room={bookingRoom}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            onConfirm={handleConfirmBooking}
            onClose={() => setBookingRoom(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}