"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Upload, Link2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  ROOM_TYPES, ROOM_STATUSES, BED_TYPES, AMENITIES_LIST,
  type Room, type RoomType, type RoomStatus, type BedType,
} from "@/constant/constant";

// ── Photo Input ───────────────────────────────────────────────
function PhotoInput({ photos, onAdd, onRemove, onUpload }: {
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
  onUpload: (file: File) => Promise<string | null>;
}) {
  const [urlInput, setUrlInput]   = useState("");
  const [uploading, setUploading] = useState(false);
  const [mode, setMode]           = useState<"upload" | "url" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const url = await onUpload(file);
    if (url) onAdd(url);
    setUploading(false);
    e.target.value = "";
  };

  const handleAddUrl = () => {
    const t = urlInput.trim(); if (!t) return;
    try { new URL(t); } catch { return; }
    onAdd(t); setUrlInput("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">Photos</label>
      <div className="flex gap-2">
        {(["upload", "url"] as const).map((m) => (
          <button key={m} type="button"
            disabled={mode !== null && mode !== m}
            onClick={() => setMode(m)}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
              mode === m ? "border-gold bg-gold/10 text-gold"
                : mode !== null ? "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                : "border-border text-foreground hover:border-gold hover:text-gold"
            )}
          >
            {m === "upload" ? <><Upload size={13} /> Upload File</> : <><Link2 size={13} /> Paste URL</>}
          </button>
        ))}
        {mode !== null && (
          <button type="button" onClick={() => { setMode(null); setUrlInput(""); }}
            className="ml-auto p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {mode === "upload" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-gold/50 rounded-xl p-5 text-center cursor-pointer transition-colors group">
              <Upload size={18} className="mx-auto mb-1.5 text-muted-foreground group-hover:text-gold transition-colors" />
              <p className="text-sm text-muted-foreground">Click to upload <span className="text-foreground font-medium">JPG, PNG, WEBP</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">Max 5MB</p>
              {uploading && <p className="text-xs text-gold mt-1.5 animate-pulse">Uploading…</p>}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
          </motion.div>
        )}
        {mode === "url" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex gap-2">
              <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/room.jpg"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:border-gold/50 transition-colors" />
              <button type="button" onClick={handleAddUrl}
                className="px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/30 text-sm font-medium hover:bg-gold/20 transition-colors">
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-border bg-muted">
              <Image src={url} alt="" fill className="object-cover" unoptimized />
              <button type="button" onClick={() => onRemove(url)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={14} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── RoomModal ─────────────────────────────────────────────────
const EMPTY: Omit<Room, "room_id" | "created_at" | "updated_at"> = {
  room_number: "", floor: 1, room_type: "Single", status: "Available",
  price_per_night: 100, capacity: 2, bed_type: "Double",
  size_sqft: null, amenities: [], photos: [], description: "", is_active: true,
};

export type SaveFn = (
  data: Omit<Room, "room_id" | "created_at" | "updated_at">,
  isEdit: boolean,
  originalRoomNumber?: string
) => Promise<boolean>;

interface Props {
  open: boolean;
  onClose: () => void;
  editRoom: Room | null;
  onSave: SaveFn;
  onUpload: (file: File) => Promise<string | null>;
}

export function RoomModal({ open, onClose, editRoom, onSave, onUpload }: Props) {
  const isEdit = !!editRoom;
  const [form, setForm]     = useState<Omit<Room, "room_id" | "created_at" | "updated_at">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(editRoom ? {
      room_number:     editRoom.room_number,
      floor:           editRoom.floor,
      room_type:       editRoom.room_type,
      status:          editRoom.status,
      price_per_night: Number(editRoom.price_per_night),
      capacity:        editRoom.capacity,
      bed_type:        editRoom.bed_type,
      size_sqft:       editRoom.size_sqft ?? null,
      amenities:       editRoom.amenities ?? [],
      photos:          editRoom.photos    ?? [],
      description:     editRoom.description ?? "",
      is_active:       editRoom.is_active,
    } : { ...EMPTY });
  }, [open, editRoom]);

  const set = (k: keyof typeof form, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.room_number.trim()) { setError("Room number is required"); return; }
    if (form.price_per_night <= 0) { setError("Valid price is required"); return; }
    setSaving(true);
    const ok = await onSave(form, isEdit, editRoom?.room_number);
    setSaving(false);
    if (!ok) { setError("Could not save room. Please try again."); return; }
    onClose();
  };

  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors";

  return (
    <AnimatePresence>
      {open && (
        // Fixed overlay — fills viewport, does not scroll with page
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ position: "fixed", top: -25, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop — fixed, full screen, never moves */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal — scrollable independently */}
          <motion.div
            className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {isEdit ? `Edit — Room ${editRoom?.room_number}` : "Add New Room"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEdit ? "Update the details below" : "Fill in the room details"}
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5" style={{ scrollbarWidth: "thin" }}>
              <form id="room-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Room Number <span className="text-red-500">*</span></label>
                    <input value={form.room_number} onChange={(e) => set("room_number", e.target.value)} placeholder="101, 202A…" className={inp} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Floor <span className="text-red-500">*</span></label>
                    <input type="number" min={1} value={form.floor} onChange={(e) => set("floor", Number(e.target.value))} className={inp} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Room Type</label>
                    <select value={form.room_type} onChange={(e) => set("room_type", e.target.value as RoomType)} className={inp}>
                      {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Status</label>
                    <select value={form.status} onChange={(e) => set("status", e.target.value as RoomStatus)} className={inp}>
                      {ROOM_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Price / Night <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">PKR</span>
                      <input type="number" min={0} step="0.01" value={form.price_per_night}
                        onChange={(e) => set("price_per_night", Number(e.target.value))}
                        className="w-full pl-12 pr-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:border-gold/60 transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Capacity</label>
                    <input type="number" min={1} max={20} value={form.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className={inp} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Bed Type</label>
                    <select value={form.bed_type} onChange={(e) => set("bed_type", e.target.value as BedType)} className={inp}>
                      {BED_TYPES.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Size (sq ft)</label>
                    <input type="number" min={0} value={form.size_sqft ?? ""} placeholder="Optional"
                      onChange={(e) => set("size_sqft", e.target.value ? Number(e.target.value) : null)} className={inp} />
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES_LIST.map((a) => {
                      const on = form.amenities?.includes(a);
                      return (
                        <button key={a} type="button"
                          onClick={() => set("amenities", on ? form.amenities!.filter((x) => x !== a) : [...(form.amenities ?? []), a])}
                          className={clsx("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                            on ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40 hover:text-foreground"
                          )}>
                          {on && <CheckCircle2 size={9} className="inline mr-1" />}{a}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe the room, view, special features…"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors resize-none" />
                </div>

                {/* Photos */}
                <PhotoInput
                  photos={form.photos ?? []}
                  onAdd={(url) => set("photos", [...(form.photos ?? []), url])}
                  onRemove={(url) => set("photos", (form.photos ?? []).filter((p) => p !== url))}
                  onUpload={onUpload}
                />

                {/* Active toggle */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/40 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active Listing</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Guests can see and book this room</p>
                  </div>
                  <button type="button" onClick={() => set("is_active", !form.is_active)}
                    className={clsx("relative w-11 h-6 rounded-full transition-colors duration-200", form.is_active ? "bg-gold" : "bg-muted-foreground/30")}>
                    <span className={clsx("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200", form.is_active ? "translate-x-5" : "")} />
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2.5 rounded-xl border border-red-500/20">⚠ {error}</p>
                )}
              </form>
            </div>

            {/* Sticky footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" form="room-form" disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Room"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}