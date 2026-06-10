"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  BedDouble,
  Users,
  SquareStack,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  MoreHorizontal,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useRooms } from "@/hooks/useRooms";
import {
  ROOM_TYPES,
  ROOM_STATUSES,
  STATUS_CONFIG,
  TYPE_CONFIG,
  type Room,
  type RoomType,
  type RoomStatus,
} from "@/constant/constant";
import { RoomModal, type SaveFn } from "./components/RoomModal";
import { ViewRoomModal } from "./components/ViewRoomModal";
import { ConfirmDialog } from "./components/ConfirmDialog";

// ── Badges ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RoomStatus }) {
  const c = STATUS_CONFIG[status];
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

function TypeBadge({ type }: { type: RoomType }) {
  const c = TYPE_CONFIG[type];
  return (
    <span className={clsx("text-sm font-medium", c.color)}>
      {c.icon} {type}
    </span>
  );
}

// ── Stats Card ────────────────────────────────────────────────
function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
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

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      className={clsx(
        "fixed bottom-6 right-6 z-[500] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-elegant text-sm font-medium",
        type === "success"
          ? "bg-emerald-500 text-white"
          : "bg-red-500 text-white",
      )}
    >
      {type === "success" ? <CheckCircle2 size={15} /> : <X size={15} />}
      {msg}
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function BasicRooms() {
  const {
    rooms,
    loading,
    error,
    createRoom,
    updateRoom,
    deleteRoom,
    uploadPhoto,
  } = useRooms();

  const [modalOpen, setModalOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [viewRoom, setViewRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<RoomType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<RoomStatus | "All">("All");
  const [sortKey, setSortKey] = useState<
    "room_number" | "floor" | "price_per_night"
  >("room_number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── filter + sort ──────────────────────────────────────────
  const filtered = rooms
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        (!q ||
          r.room_number.toLowerCase().includes(q) ||
          r.room_type.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)) &&
        (filterType === "All" || r.room_type === filterType) &&
        (filterStatus === "All" || r.status === filterStatus)
      );
    })
    .sort((a, b) => {
      const av = String(a[sortKey]),
        bv = String(b[sortKey]);
      return sortDir === "asc"
        ? av.localeCompare(bv, undefined, { numeric: true })
        : bv.localeCompare(av, undefined, { numeric: true });
    });

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  // ── FIXED save: omit room_number when unchanged in edit ────
  const handleSave: SaveFn = async (data, isEdit, originalRoomNumber) => {
    if (isEdit && editRoom?.room_id) {
      const payload = { ...data } as Partial<Room>;
      // If room_number didn't change, remove it to avoid Prisma P2002 unique error
      if (payload.room_number === originalRoomNumber)
        delete payload.room_number;
      const res = await updateRoom(Number(editRoom.room_id), payload);
      if (!res.ok) return false;
      showToast("Room updated");
    } else {
      const res = await createRoom(data);
      if (!res.ok) return false;
      showToast("Room added");
    }
    return true;
  };

  const handleUpload = async (file: File): Promise<string | null> => {
    const res = await uploadPhoto(file);
    if (!res.ok) {
      showToast(res.error ?? "Upload failed", "error");
      return null;
    }
    return res.url ?? null;
  };

  // ── FIXED delete: Number() ensures no BigInt issues ───────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = Number(deleteTarget.room_id);
    if (!id) {
      showToast("Invalid room ID", "error");
      return;
    }
    setDeleteLoading(true);
    const res = await deleteRoom(id);
    setDeleteLoading(false);
    setDeleteTarget(null);
    if (!res.ok) {
      showToast(res.error ?? "Delete failed", "error");
      return;
    }
    showToast("Room deleted");
  };

  const openEdit = (room: Room) => {
    setEditRoom(room);
    setViewRoom(null);
    setModalOpen(true);
  };
  const openAdd = () => {
    setEditRoom(null);
    setModalOpen(true);
  };

  const stats = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === "Available").length,
    occupied: rooms.filter((r) => r.status === "Occupied").length,
    maintenance: rooms.filter((r) => r.status === "Maintenance").length,
  };

  const SortIcon = ({ k }: { k: typeof sortKey }) =>
    sortKey !== k ? (
      <MoreHorizontal size={11} className="opacity-30" />
    ) : sortDir === "asc" ? (
      <ChevronUp size={11} />
    ) : (
      <ChevronDown size={11} />
    );

  const selCls =
    "px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-gold/50 transition-colors";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rooms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all hotel rooms, availability and pricing
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shrink-0"
        >
          <Plus size={15} /> Add Room
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          label="Total Rooms"
          value={stats.total}
          icon={BedDouble}
          color="bg-primary"
        />
        <StatsCard
          label="Available"
          value={stats.available}
          icon={Eye}
          color="bg-emerald-500"
        />
        <StatsCard
          label="Occupied"
          value={stats.occupied}
          icon={Users}
          color="bg-amber-500"
        />
        <StatsCard
          label="Maintenance"
          value={stats.maintenance}
          icon={SquareStack}
          color="bg-red-500"
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room #, type, status…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className={selCls}
          >
            <option value="All">All Types</option>
            {ROOM_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className={selCls}
          >
            <option value="All">All Status</option>
            {ROOM_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-2xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading rooms…</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {[
                    {
                      label: "Room #",
                      k: "room_number" as const,
                      sortable: true,
                    },
                    { label: "Type", k: null, sortable: false },
                    { label: "Floor", k: "floor" as const, sortable: true },
                    { label: "Bed", k: null, sortable: false },
                    { label: "Guests", k: null, sortable: false },
                    {
                      label: "Rate/Night",
                      k: "price_per_night" as const,
                      sortable: true,
                    },
                    { label: "Status", k: null, sortable: false },
                    { label: "Active", k: null, sortable: false },
                  ].map(({ label, k, sortable }) => (
                    <th
                      key={label}
                      className={clsx(
                        "px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                        sortable &&
                          "cursor-pointer hover:text-foreground select-none",
                      )}
                      onClick={() => sortable && k && toggleSort(k)}
                    >
                      {sortable && k ? (
                        <span className="flex items-center gap-1">
                          {label} <SortIcon k={k} />
                        </span>
                      ) : (
                        label
                      )}
                    </th>
                  ))}
                  <th className="px-4 py-3.5 w-24 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <BedDouble
                        size={30}
                        className="mx-auto mb-2.5 text-muted-foreground/20"
                      />
                      <p className="text-sm text-muted-foreground">
                        No rooms found
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Try adjusting your search or filters
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((room, i) => (
                    <motion.tr
                      key={room.room_id}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-t border-border hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {room.photos?.[0] ? (
                            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-border">
                              <Image
                                src={room.photos[0]}
                                alt=""
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                              <BedDouble
                                size={13}
                                className="text-muted-foreground/40"
                              />
                            </div>
                          )}
                          <span className="font-semibold text-foreground">
                            {room.room_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <TypeBadge type={room.room_type} />
                      </td>
                      <td className="px-4 py-3.5 text-foreground">
                        {room.floor}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {room.bed_type}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {room.capacity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        PKR {Number(room.price_per_night).toFixed(0)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={room.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {room.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setViewRoom(room)}
                            title="View"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            onClick={() => openEdit(room)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Pencil size={13} />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(room)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/20 flex justify-between text-xs text-muted-foreground">
            <span>
              Showing {filtered.length} of {rooms.length} rooms
            </span>
            <span>
              {stats.available} available · {stats.occupied} occupied
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      <RoomModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditRoom(null);
        }}
        editRoom={editRoom}
        onSave={handleSave}
        onUpload={handleUpload}
      />

      <ViewRoomModal
        room={viewRoom}
        onClose={() => setViewRoom(null)}
        onEdit={() => openEdit(viewRoom!)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Room"
        message={`Are you sure you want to delete Room ${deleteTarget?.room_number}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
