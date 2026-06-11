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
// modules/rooms/Rooms.tsx (optimized with pagination)

// ... (StatusBadge, TypeBadge, StatsCard components remain same)

export default function Rooms() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<RoomType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<RoomStatus | "All">("All");
  const [sortBy, setSortBy] = useState<"room_number" | "floor" | "price_per_night">("room_number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [viewRoom, setViewRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  const {
    rooms,
    pagination,
    isLoading,
    isFetching,
    createRoom,
    updateRoom,
    deleteRoom,
    uploadPhoto,
    isCreating,
    isUpdating,
    isDeleting,
  } = useRooms({
    page,
    limit,
    search,
    type: filterType,
    status: filterStatus,
    sortBy,
    sortOrder,
  });

  const handleSave: SaveFn = async (data, isEdit, originalRoomNumber) => {
    if (isEdit && editRoom?.room_id) {
      const payload = { ...data } as Partial<Room>;
      if (payload.room_number === originalRoomNumber) delete payload.room_number;
      const res = await updateRoom(Number(editRoom.room_id), payload);
      if (!res.ok) return false;
    } else {
      const res = await createRoom(data);
      if (!res.ok) return false;
    }
    setModalOpen(false);
    setEditRoom(null);
    return true;
  };

  const handleUpload = async (file: File): Promise<string | null> => {
    const res = await uploadPhoto(file);
    if (!res.ok) {
      toast.error(res.error ?? "Upload failed");
      return null;
    }
    return res.url ?? null;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteRoom(Number(deleteTarget.room_id));
    if (res.ok) {
      setDeleteTarget(null);
    }
  };

  const openEdit = (room: Room) => {
    setEditRoom(room);
    setViewRoom(null);
    setModalOpen(true);
  };

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  // Stats calculation (from API or cached)
  const stats = {
    total: pagination?.total || 0,
    available: rooms.filter(r => r.status === "Available").length,
    occupied: rooms.filter(r => r.status === "Occupied").length,
    maintenance: rooms.filter(r => r.status === "Maintenance").length,
  };

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
          onClick={() => {
            setEditRoom(null);
            setModalOpen(true);
          }}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shrink-0 disabled:opacity-50"
        >
          <Plus size={15} /> Add Room
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard label="Total Rooms" value={stats.total} icon={BedDouble} color="bg-primary" />
        <StatsCard label="Available" value={stats.available} icon={Eye} color="bg-emerald-500" />
        <StatsCard label="Occupied" value={stats.occupied} icon={Users} color="bg-amber-500" />
        <StatsCard label="Maintenance" value={stats.maintenance} icon={SquareStack} color="bg-red-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
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
            onChange={(e) => {
              setFilterType(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-gold/50 transition-colors"
          >
            <option value="All">All Types</option>
            {ROOM_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-gold/50 transition-colors"
          >
            <option value="All">All Status</option>
            {ROOM_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading indicator */}
      {(isLoading || isFetching) && (
        <div className="flex items-center justify-center py-8">
          <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
          <span className="ml-3 text-sm text-muted-foreground">Loading...</span>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <>
          <div className="bg-background border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    {[
                      { label: "Room #", key: "room_number", sortable: true },
                      { label: "Type", key: null, sortable: false },
                      { label: "Floor", key: "floor", sortable: true },
                      { label: "Bed", key: null, sortable: false },
                      { label: "Guests", key: null, sortable: false },
                      { label: "Rate/Night", key: "price_per_night", sortable: true },
                      { label: "Status", key: null, sortable: false },
                      { label: "Active", key: null, sortable: false },
                    ].map(({ label, key, sortable }) => (
                      <th
                        key={label}
                        className={clsx(
                          "px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                          sortable && "cursor-pointer hover:text-foreground select-none"
                        )}
                        onClick={() => sortable && key && toggleSort(key as any)}
                      >
                        {sortable && key ? (
                          <span className="flex items-center gap-1">
                            {label}
                            {sortBy === key ? (
                              sortOrder === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                            ) : (
                              <MoreHorizontal size={11} className="opacity-30" />
                            )}
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
                  {rooms.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <BedDouble size={30} className="mx-auto mb-2.5 text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground">No rooms found</p>
                      </td>
                    </tr>
                  ) : (
                    rooms.map((room, i) => (
                      <motion.tr
                        key={room.room_id}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-t border-border hover:bg-muted/30 transition-colors group"
                      >
                        {/* Table cells same as before */}
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
                                <BedDouble size={13} className="text-muted-foreground/40" />
                              </div>
                            )}
                            <span className="font-semibold text-foreground">{room.room_number}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <TypeBadge type={room.room_type} />
                        </td>
                        <td className="px-4 py-3.5 text-foreground">{room.floor}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{room.bed_type}</td>
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
                              disabled={isDeleting}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
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

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} rooms
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={clsx(
                            "w-8 h-8 rounded-lg text-sm transition-colors",
                            pagination.page === pageNum
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

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
        loading={isDeleting}
      />
    </div>
  );
}