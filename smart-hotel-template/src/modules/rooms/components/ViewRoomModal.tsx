"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Pencil, BedDouble, Users, MapPin, Maximize2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { STATUS_CONFIG, TYPE_CONFIG, type Room, type RoomStatus, type RoomType } from "@/constant/constant";

function StatusBadge({ status }: { status: RoomStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", cfg.bg, cfg.text)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

interface Props {
  room: Room | null;
  onClose: () => void;
  onEdit: () => void;
}

export function ViewRoomModal({ room, onClose, onEdit }: Props) {
  const [activePhoto, setActivePhoto] = useState(0);
  useEffect(() => { setActivePhoto(0); }, [room]);

  const photos    = room?.photos    ?? [];
  const amenities = room?.amenities ?? [];
  const typeCfg   = room ? TYPE_CONFIG[room.room_type] : null;

  return (
    <AnimatePresence>
      {room && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} />

          <motion.div
            className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo section */}
            <div className="relative shrink-0" style={{ height: photos.length ? 260 : 100 }}>
              {photos.length > 0 ? (
                <>
                  <Image src={photos[activePhoto]} alt={`Room ${room.room_number}`} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Dot indicators */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((_, i) => (
                        <button key={i} onClick={() => setActivePhoto(i)}
                          className={clsx("h-1.5 rounded-full transition-all", i === activePhoto ? "bg-white w-5" : "bg-white/50 w-1.5")} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <BedDouble size={32} className="text-muted-foreground/20" />
                </div>
              )}

              {/* Top bar */}
              <div className="absolute top-3 left-3"><StatusBadge status={room.status} /></div>
              <button onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm">
                <X size={15} />
              </button>

              {/* Room number on photo */}
              {photos.length > 0 && (
                <div className="absolute bottom-5 left-4">
                  <p className="text-white text-2xl font-bold drop-shadow-sm">Room {room.room_number}</p>
                  {typeCfg && (
                    <p className={clsx("text-sm font-medium", typeCfg.color)}>{typeCfg.icon} {room.room_type}</p>
                  )}
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4" style={{ scrollbarWidth: "thin" }}>

              {/* Header (when no photo) */}
              {photos.length === 0 && (
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Room {room.room_number}</h2>
                    {typeCfg && <p className={clsx("text-sm font-medium mt-0.5", typeCfg.color)}>{typeCfg.icon} {room.room_type}</p>}
                  </div>
                  <p className="text-xl font-bold text-foreground">PKR ${Number(room.price_per_night).toFixed(0)}<span className="text-xs text-muted-foreground font-normal">/night</span></p>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Rate",     value: `PKR ${Number(room.price_per_night).toFixed(0)}/night` },
                  { label: "Floor",    value: `Floor ${room.floor}` },
                  { label: "Guests",   value: `${room.capacity} guests` },
                  { label: "Size",     value: room.size_sqft ? `${room.size_sqft} sqft` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
                    <p className="text-xs font-semibold text-foreground mt-1 leading-tight">{value}</p>
                  </div>
                ))}
              </div>

              {/* Bed + Active */}
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs font-medium text-foreground">
                  <BedDouble size={12} className="text-muted-foreground" /> {room.bed_type} Bed
                </span>
                <span className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium",
                  room.is_active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-muted border-border text-muted-foreground")}>
                  {room.is_active ? "Active Listing" : "Inactive"}
                </span>
              </div>

              {/* Description */}
              {room.description && (
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{room.description}</p>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {amenities.map((a) => (
                      <span key={a} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium text-foreground">
                        <CheckCircle2 size={9} className="text-gold shrink-0" /> {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Thumbnail strip */}
              {photos.length > 1 && (
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">All Photos</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((url, i) => (
                      <button key={i} onClick={() => setActivePhoto(i)}
                        className={clsx("relative shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all",
                          i === activePhoto ? "border-gold" : "border-border hover:border-gold/50")}>
                        <Image src={url} alt="" fill className="object-cover" unoptimized />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              {(room.created_at || room.updated_at) && (
                <div className="flex gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border">
                  {room.created_at && <span>Created {new Date(room.created_at).toLocaleDateString()}</span>}
                  {room.updated_at && <span>Updated {new Date(room.updated_at).toLocaleDateString()}</span>}
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-border shrink-0">
              <button onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Close
              </button>
              <button onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Pencil size={14} /> Edit Room
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}