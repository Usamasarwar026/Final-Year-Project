// src/modules/kitchen/KitchenStaff.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  Edit2,
  CheckCircle,
  XCircle,
  Loader2,
  Bike,
  ChefHat,
  X,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import Image from "next/image";

interface StaffMember {
  staff_id: number;
  user_id: string;
  designation: string;
  is_active: boolean;
  is_on_duty: boolean;
  created_at?: string;
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
  kitchenTasks?: {
    id: number;
    status: string;
    order_id: number;
  }[];
}

// ─── Edit Staff Modal ─────────────────────────────────────────────────────
function EditStaffModal({
  isOpen,
  onClose,
  staff,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  onSuccess: () => void;
}) {
  const [designation, setDesignation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staff) {
      setDesignation(staff.designation || "");
    }
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation.trim()) {
      toast.error("Designation is required");
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/staff/${staff?.user_id}`, { designation });
      toast.success("Staff updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update staff");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !staff) return null;

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
            <Edit2 size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Edit Staff</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
              Staff Name
            </label>
            <input
              type="text"
              value={staff.user?.name || ""}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={staff.user?.email || ""}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
              Designation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g., Kitchen Chef, Delivery Staff"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
              required
            />
          </div>

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
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Update Staff"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Kitchen Staff Component ──────────────────────────────────────────────────
export default function KitchenStaff() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "kitchen" | "delivery">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [dutyFilter, setDutyFilter] = useState<"all" | "onDuty" | "offDuty">(
    "all",
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const queryClient = useQueryClient();

  const {
    data: staff = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["kitchen-staff"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/kitchen/staff");
        return data.staff || [];
      } catch (error) {
        console.error("Failed to fetch staff:", error);
        return [];
      }
    },
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["kitchen-staff-stats"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/kitchen/staff-stats");
        return data.stats;
      } catch (error) {
        return {
          total: 0,
          active: 0,
          onDuty: 0,
          deliveryStaff: 0,
          kitchenStaff: 0,
        };
      }
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const staffMember = staff.find((s: StaffMember) => s.staff_id === id);
      if (staffMember) {
        await api.patch(`/staff/${staffMember.user_id}`, { isActive: active });
      }
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
      const staffMember = staff.find((s: StaffMember) => s.staff_id === id);
      if (staffMember) {
        await api.patch(`/staff/${staffMember.user_id}`, {
          is_on_duty: onDuty,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-staff"] });
      toast.success("Duty status updated");
    },
    onError: () => toast.error("Failed to update duty status"),
  });

  const filteredStaff = staff.filter((s: StaffMember) => {
    const userName = s.user?.name || "";
    const userEmail = s.user?.email || "";
    const designation = s.designation || "";

    const matchesSearch =
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "all"
        ? true
        : roleFilter === "kitchen"
          ? designation.toLowerCase().includes("kitchen") ||
            s.user?.permissions?.includes("KITCHEN_ACCESS")
          : designation.toLowerCase().includes("delivery") ||
            s.user?.permissions?.includes("DELIVERY_ACCESS");

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? s.is_active
          : !s.is_active;

    const matchesDuty =
      dutyFilter === "all"
        ? true
        : dutyFilter === "onDuty"
          ? s.is_on_duty
          : !s.is_on_duty;

    return matchesSearch && matchesRole && matchesStatus && matchesDuty;
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
              Manage kitchen and delivery staff, assign roles, and track duty
              status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refetch();
                refetchStats();
              }}
              className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <RefreshCw size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
            <p className="text-2xl font-bold text-primary">
              {stats?.total || 0}
            </p>
            <p className="text-xs text-muted-foreground">Total Staff</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-600">
              {stats?.active || 0}
            </p>
            <p className="text-xs text-muted-foreground">Active Staff</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-4 border border-green-500/20">
            <p className="text-2xl font-bold text-green-600">
              {stats?.onDuty || 0}
            </p>
            <p className="text-xs text-muted-foreground">Currently On Duty</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-4 border border-blue-500/20">
            <p className="text-2xl font-bold text-blue-600">
              {stats?.deliveryStaff || 0}
            </p>
            <p className="text-xs text-muted-foreground">Delivery Staff</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
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

          <select
            value={dutyFilter}
            onChange={(e) => setDutyFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none"
          >
            <option value="all">All Duty</option>
            <option value="onDuty">On Duty</option>
            <option value="offDuty">Off Duty</option>
          </select>

          {(searchQuery ||
            roleFilter !== "all" ||
            statusFilter !== "all" ||
            dutyFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
                setStatusFilter("all");
                setDutyFilter("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>

        {/* Staff Table */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary/40" />
            <p className="text-sm text-muted-foreground">Loading staff...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
            <Users
              size={48}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <p className="text-sm font-semibold text-foreground/70">
              No staff members found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery
                ? "Try a different search term"
                : "No staff members available"}
            </p>
          </div>
        ) : (
          <div className="bg-background border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Staff
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Designation
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Department
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Duty
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Tasks
                    </th>
                    <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(
                    (staffMember: StaffMember, idx: number) => {
                      const userName = staffMember.user?.name || "Unknown";
                      const userEmail = staffMember.user?.email || "";
                      const userPhone = staffMember.user?.phoneNumber || null;
                      const userImage = staffMember.user?.profileImage || null;

                      const isDelivery =
                        staffMember.designation
                          ?.toLowerCase()
                          .includes("delivery") ||
                        staffMember.user?.permissions?.includes(
                          "DELIVERY_ACCESS",
                        );
                      const isKitchen =
                        staffMember.designation
                          ?.toLowerCase()
                          .includes("kitchen") ||
                        staffMember.user?.permissions?.includes(
                          "KITCHEN_ACCESS",
                        );

                      const completedTasks =
                        staffMember.kitchenTasks?.filter(
                          (t) => t.status === "Completed",
                        ).length || 0;
                      const pendingTasks =
                        staffMember.kitchenTasks?.filter(
                          (t) =>
                            t.status !== "Completed" &&
                            t.status !== "Cancelled",
                        ).length || 0;

                      return (
                        <tr
                          key={staffMember.staff_id}
                          className="border-t border-border hover:bg-muted/20 transition-colors"
                        >
                          {/* Staff Info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {userImage ? (
                                  <Image
                                    src={userImage}
                                    alt={userName}
                                    width={36}
                                    height={36}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">
                                      {userName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                {staffMember.is_on_duty &&
                                  staffMember.is_active && (
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                                  )}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-sm">
                                  {userName}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  ID: {staffMember.staff_id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail size={10} /> {userEmail}
                              </p>
                              {userPhone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone size={10} /> {userPhone}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Designation */}
                          <td className="px-4 py-3">
                            <p className="text-sm text-foreground">
                              {staffMember.designation || "—"}
                            </p>
                          </td>

                          {/* Department */}
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              {isKitchen && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                                  <ChefHat size={9} /> Kitchen
                                </span>
                              )}
                              {isDelivery && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                                  <Bike size={9} /> Delivery
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                toggleStatus.mutate({
                                  id: staffMember.staff_id,
                                  active: !staffMember.is_active,
                                })
                              }
                              className={clsx(
                                "px-2 py-1 rounded-full text-[10px] font-semibold transition-all",
                                staffMember.is_active
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-red-100 text-red-700 hover:bg-red-200",
                              )}
                            >
                              {staffMember.is_active ? "Active" : "Inactive"}
                            </button>
                          </td>

                          {/* Duty */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                toggleDuty.mutate({
                                  id: staffMember.staff_id,
                                  onDuty: !staffMember.is_on_duty,
                                })
                              }
                              disabled={!staffMember.is_active}
                              className={clsx(
                                "px-2 py-1 rounded-full text-[10px] font-semibold transition-all flex items-center gap-1",
                                staffMember.is_on_duty && staffMember.is_active
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : staffMember.is_active
                                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed",
                              )}
                            >
                              <Clock size={9} />
                              {staffMember.is_on_duty && staffMember.is_active
                                ? "On Duty"
                                : "Off Duty"}
                            </button>
                          </td>

                          {/* Tasks */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-primary">
                                {completedTasks}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                /
                              </span>
                              <span
                                className={clsx(
                                  "text-xs font-semibold",
                                  pendingTasks > 0
                                    ? "text-amber-600"
                                    : "text-muted-foreground",
                                )}
                              >
                                {pendingTasks}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setEditingStaff(staffMember);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                              title="Edit Staff"
                            >
                              <Edit2
                                size={14}
                                className="text-muted-foreground"
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground">
              <span>
                Showing {filteredStaff.length} of {staff.length} staff members
              </span>
              <div className="flex gap-3">
                <span className="flex items-center gap-1">
                  <ChefHat size={10} />{" "}
                  {
                    staff.filter((s: StaffMember) =>
                      s.designation?.toLowerCase().includes("kitchen"),
                    ).length
                  }{" "}
                  Kitchen
                </span>
                <span className="flex items-center gap-1">
                  <Bike size={10} />{" "}
                  {
                    staff.filter((s: StaffMember) =>
                      s.designation?.toLowerCase().includes("delivery"),
                    ).length
                  }{" "}
                  Delivery
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle size={10} className="text-green-500" />{" "}
                  {staff.filter((s: StaffMember) => s.is_on_duty).length} On
                  Duty
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingStaff && (
          <EditStaffModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingStaff(null);
            }}
            staff={editingStaff}
            onSuccess={() => {
              refetch();
              refetchStats();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
