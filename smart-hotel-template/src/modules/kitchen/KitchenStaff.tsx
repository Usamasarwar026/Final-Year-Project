// src/app/admin/kitchen/staff/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Clock,
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Award,
  Bike,
  ChefHat,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import Image from "next/image";

// Types
interface KitchenStaff {
  staff_id: number;
  user_id: string;
  designation: string;
  is_active: boolean;
  is_on_duty: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    profileImage: string | null;
    permissions: string[];
  };
  department?: {
    id: number;
    name: string;
  };
  shift?: {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
  };
  kitchenTasks?: {
    id: number;
    status: string;
    order_id: number;
  }[];
}

interface StaffStats {
  total: number;
  active: number;
  onDuty: number;
  deliveryStaff: number;
  kitchenStaff: number;
}

// ─── Staff Card Component ─────────────────────────────────────────────────────
function StaffCard({
  staff,
  onEdit,
  onToggleStatus,
  onToggleDuty,
}: {
  staff: KitchenStaff;
  onEdit: (staff: KitchenStaff) => void;
  onToggleStatus: (id: number, active: boolean) => void;
  onToggleDuty: (id: number, onDuty: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDelivery = staff.designation.toLowerCase().includes("delivery") || 
                     staff.user.permissions?.includes("DELIVERY_ACCESS");
  const isKitchen = staff.designation.toLowerCase().includes("kitchen") ||
                    staff.user.permissions?.includes("KITCHEN_ACCESS");

  const completedTasks = staff.kitchenTasks?.filter(t => t.status === "Completed").length || 0;
  const pendingTasks = staff.kitchenTasks?.filter(t => t.status !== "Completed").length || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        "relative rounded-2xl border bg-background overflow-hidden transition-all hover:shadow-lg",
        !staff.is_active && "opacity-60 grayscale-[20%]"
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              {staff.user.profileImage ? (
                <Image
                  src={staff.user.profileImage}
                  alt={staff.user.name}
                  width={56}
                  height={56}
                  className="rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {staff.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {staff.is_on_duty && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div>
              <h3 className="font-bold text-foreground text-base">
                {staff.user.name}
              </h3>
              <p className="text-xs text-muted-foreground">{staff.designation}</p>
              <div className="flex items-center gap-2 mt-1">
                {isKitchen && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                    <ChefHat size={10} /> Kitchen
                  </span>
                )}
                {isDelivery && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                    <Bike size={10} /> Delivery
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <MoreVertical size={16} className="text-muted-foreground" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 w-40 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      onEdit(staff);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left hover:bg-muted transition-colors"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      onToggleStatus(staff.staff_id, !staff.is_active);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left hover:bg-muted transition-colors"
                  >
                    {staff.is_active ? <XCircle size={12} /> : <CheckCircle size={12} />}
                    {staff.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-1.5">
          {staff.user.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail size={12} />
              <span className="truncate">{staff.user.email}</span>
            </div>
          )}
          {staff.user.phoneNumber && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone size={12} />
              <span>{staff.user.phoneNumber}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-muted/30 rounded-xl p-2 text-center">
            <p className="text-lg font-bold text-primary">{completedTasks}</p>
            <p className="text-[9px] text-muted-foreground">Completed</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-2 text-center">
            <p className={clsx("text-lg font-bold", pendingTasks > 0 ? "text-amber-600" : "text-muted-foreground")}>
              {pendingTasks}
            </p>
            <p className="text-[9px] text-muted-foreground">Pending Tasks</p>
          </div>
        </div>

        {/* Duty Toggle */}
        <div className="mt-4 pt-3 border-t border-border">
          <button
            onClick={() => onToggleDuty(staff.staff_id, !staff.is_on_duty)}
            disabled={!staff.is_active}
            className={clsx(
              "w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              staff.is_on_duty
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
              !staff.is_active && "opacity-50 cursor-not-allowed"
            )}
          >
            {staff.is_on_duty ? (
              <>
                <CheckCircle size={12} /> On Duty
              </>
            ) : (
              <>
                <Clock size={12} /> Off Duty
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Add/Edit Staff Modal ─────────────────────────────────────────────────────
function StaffFormModal({
  isOpen,
  onClose,
  editingStaff,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingStaff: KitchenStaff | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    userId: "",
    designation: "",
    department: "kitchen",
  });
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isEditing = !!editingStaff;

  // Fetch available users (not already staff)
  useEffect(() => {
    if (isOpen && !isEditing) {
      setLoadingUsers(true);
      api.get("/users/available?role=STAFF")
        .then((res) => setAvailableUsers(res.data.users || []))
        .catch(console.error)
        .finally(() => setLoadingUsers(false));
    }
  }, [isOpen, isEditing]);

  useEffect(() => {
    if (editingStaff) {
      setFormData({
        userId: editingStaff.user_id,
        designation: editingStaff.designation,
        department: editingStaff.department?.name?.toLowerCase() === "kitchen" ? "kitchen" : "delivery",
      });
    } else {
      setFormData({
        userId: "",
        designation: "Kitchen Staff",
        department: "kitchen",
      });
    }
  }, [editingStaff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !formData.userId) {
      toast.error("Please select a user");
      return;
    }
    if (!formData.designation) {
      toast.error("Designation is required");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && editingStaff) {
        await api.patch(`/staff/${editingStaff.staff_id}`, {
          designation: formData.designation,
        });
        toast.success("Staff updated successfully");
      } else {
        await api.post("/staff", {
          userId: formData.userId,
          designation: formData.designation,
          department: formData.department,
        });
        toast.success("Staff added successfully");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {isEditing ? "Edit Staff" : "Add Kitchen Staff"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <XCircle size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                Select User <span className="text-red-500">*</span>
              </label>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary/40" />
                </div>
              ) : (
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">Select a user</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
              Designation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g., Kitchen Chef, Delivery Staff"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                Department
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    value="kitchen"
                    checked={formData.department === "kitchen"}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="rounded-full border-border"
                  />
                  <span className="text-xs">Kitchen</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    value="delivery"
                    checked={formData.department === "delivery"}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="rounded-full border-border"
                  />
                  <span className="text-xs">Delivery</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? "Update" : "Add Staff")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Kitchen Staff Page ──────────────────────────────────────────────────
export default function KitchenStaff() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "kitchen" | "delivery">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<KitchenStaff | null>(null);

  const queryClient = useQueryClient();

  const { data: staff = [], isLoading, refetch } = useQuery({
    queryKey: ["kitchen-staff"],
    queryFn: async () => {
      const { data } = await api.get("/staff?department=kitchen");
      return data.staff || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["kitchen-staff-stats"],
    queryFn: async () => {
      const { data } = await api.get("/staff/stats?department=kitchen");
      return data.stats as StaffStats;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      await api.patch(`/staff/${id}`, { is_active: active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-staff"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-staff-stats"] });
      toast.success("Staff status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const toggleDuty = useMutation({
    mutationFn: async ({ id, onDuty }: { id: number; onDuty: boolean }) => {
      await api.patch(`/staff/${id}`, { is_on_duty: onDuty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-staff"] });
      toast.success("Duty status updated");
    },
    onError: () => toast.error("Failed to update duty status"),
  });

  const filteredStaff = staff.filter((s: KitchenStaff) => {
    const matchesSearch = s.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" ? true :
                        roleFilter === "kitchen" ? 
                          s.designation.toLowerCase().includes("kitchen") :
                          s.designation.toLowerCase().includes("delivery");
    const matchesStatus = statusFilter === "all" ? true :
                          statusFilter === "active" ? s.is_active : !s.is_active;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="text-primary" size={28} />
              Kitchen Staff Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage kitchen and delivery staff, assign roles, and track duty status
            </p>
          </div>
          <button
            onClick={() => {
              setEditingStaff(null);
              setShowForm(true);
            }}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <UserPlus size={18} />
            Add Staff
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
            <p className="text-2xl font-bold text-primary">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Total Staff</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-600">{stats?.active || 0}</p>
            <p className="text-xs text-muted-foreground">Active Staff</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-4 border border-green-500/20">
            <p className="text-2xl font-bold text-green-600">{stats?.onDuty || 0}</p>
            <p className="text-xs text-muted-foreground">Currently On Duty</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-2xl p-4 border border-orange-500/20">
            <p className="text-2xl font-bold text-orange-600">{stats?.deliveryStaff || 0}</p>
            <p className="text-xs text-muted-foreground">Delivery Staff</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="kitchen">Kitchen Staff</option>
            <option value="delivery">Delivery Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Staff Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary/40" />
            <p className="text-sm text-muted-foreground">Loading staff...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
            <Users size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground/70">No staff members found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? "Try a different search term" : "Add kitchen staff to get started"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setShowForm(true);
                }}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                <UserPlus size={14} /> Add Staff
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredStaff.map((staffMember: KitchenStaff) => (
              <StaffCard
                key={staffMember.staff_id}
                staff={staffMember}
                onEdit={setEditingStaff}
                onToggleStatus={(id, active) => toggleStatus.mutate({ id, active })}
                onToggleDuty={(id, onDuty) => toggleDuty.mutate({ id, onDuty })}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {filteredStaff.length > 0 && (
          <div className="flex justify-between items-center pt-4 text-xs text-muted-foreground border-t border-border">
            <span>Showing {filteredStaff.length} of {staff.length} staff members</span>
            <div className="flex gap-3">
              <span className="flex items-center gap-1"><ChefHat size={10} /> {staff.filter((s: KitchenStaff) => s.designation.toLowerCase().includes("kitchen")).length} Kitchen</span>
              <span className="flex items-center gap-1"><Bike size={10} /> {staff.filter((s: KitchenStaff) => s.designation.toLowerCase().includes("delivery")).length} Delivery</span>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <StaffFormModal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingStaff(null);
          }}
          editingStaff={editingStaff}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["kitchen-staff-stats"] });
          }}
        />
      )}
    </div>
  );
}