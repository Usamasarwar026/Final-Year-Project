// src/hooks/useStaff.ts
"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import api from "@/lib/axios";
import type {
  StaffUser,
  CreateStaffPayload,
  UpdateStaffPayload,
  AttendanceStatus,
  AttendanceLog,
  DepartmentConfig,
  ShiftConfig,
} from "@/types/staff";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

// ── Query Keys ────────────────────────────────────────────────────────────────
export const staffKeys = {
  all:         ["staff"] as const,
  list:        (filters: StaffFilters) => ["staff", "list", filters] as const,
  departments: ["staff", "departments"] as const,
  shifts:      ["staff", "shifts"] as const,
  attendance:  (staffId?: number) => ["staff", "attendance", staffId] as const,
};

export interface StaffFilters {
  page?:   number;
  limit?:  number;
  search?: string;
  dept?:   number | "";
  shift?:  number | "";
  att?:    string;
}

interface StaffListResponse {
  staff: StaffUser[];
  pagination: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

// ── Type Guard ────────────────────────────────────────────────────────────────
function isStaffList(val: unknown): val is StaffListResponse {
  return (
    typeof val === "object" &&
    val !== null &&
    "staff" in val &&
    Array.isArray((val as any).staff) &&
    "pagination" in val
  );
}

// ─── useDepartments ───────────────────────────────────────────────────────────
export function useDepartments() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery<DepartmentConfig[]>({
    queryKey: staffKeys.departments,
    queryFn:  async () => {
      const { data } = await api.get<{ departments: DepartmentConfig[] }>("/staff/departments");
      return data.departments;
    },
    staleTime:            5 * 60_000,
    gcTime:               15 * 60_000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; icon?: string; color?: string; bg?: string }) => {
      const { data } = await api.post<{ department: DepartmentConfig }>("/staff/departments", payload);
      return data.department;
    },
    onSuccess: (dept) => {
      queryClient.setQueryData<DepartmentConfig[]>(staffKeys.departments, (old = []) =>
        [...old, dept].sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<DepartmentConfig> & { id: number }) => {
      const { data } = await api.patch<{ department: DepartmentConfig }>("/staff/departments", { id, ...payload });
      return data.department;
    },
    onSuccess: (dept) => {
      queryClient.setQueryData<DepartmentConfig[]>(staffKeys.departments, (old = []) =>
        old.map((d) => (d.id === dept.id ? dept : d)),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/staff/departments?id=${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<DepartmentConfig[]>(staffKeys.departments, (old = []) =>
        old.filter((d) => d.id !== id),
      );
    },
  });

  const createDepartment = async (payload: { name: string; icon?: string; color?: string; bg?: string }): Promise<ApiResult<DepartmentConfig>> => {
    try {
      const dept = await createMutation.mutateAsync(payload);
      return { ok: true, data: dept };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const updateDepartment = async (id: number, payload: Partial<DepartmentConfig>): Promise<ApiResult<DepartmentConfig>> => {
    try {
      const dept = await updateMutation.mutateAsync({ id, ...payload });
      return { ok: true, data: dept };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const deleteDepartment = async (id: number): Promise<ApiResult> => {
    try {
      await deleteMutation.mutateAsync(id);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  return {
    departments: data ?? [],
    loading,
    error: error ? String((error as any)?.message) : null,
    refresh: () => queryClient.invalidateQueries({ queryKey: staffKeys.departments }),
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}

// ─── useShifts ────────────────────────────────────────────────────────────────
export function useShifts() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery<ShiftConfig[]>({
    queryKey: staffKeys.shifts,
    queryFn:  async () => {
      const { data } = await api.get<{ shifts: ShiftConfig[] }>("/staff/shifts");
      return data.shifts;
    },
    staleTime:            5 * 60_000,
    gcTime:               15 * 60_000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; start_time: string; end_time: string; color?: string; bg?: string }) => {
      const { data } = await api.post<{ shift: ShiftConfig }>("/staff/shifts", payload);
      return data.shift;
    },
    onSuccess: (shift) => {
      queryClient.setQueryData<ShiftConfig[]>(staffKeys.shifts, (old = []) =>
        [...old, shift].sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ShiftConfig> & { id: number }) => {
      const { data } = await api.patch<{ shift: ShiftConfig }>("/staff/shifts", { id, ...payload });
      return data.shift;
    },
    onSuccess: (shift) => {
      queryClient.setQueryData<ShiftConfig[]>(staffKeys.shifts, (old = []) =>
        old.map((s) => (s.id === shift.id ? shift : s)),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/staff/shifts?id=${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<ShiftConfig[]>(staffKeys.shifts, (old = []) =>
        old.filter((s) => s.id !== id),
      );
    },
  });

  const createShift = async (payload: { name: string; start_time: string; end_time: string }): Promise<ApiResult<ShiftConfig>> => {
    try {
      const shift = await createMutation.mutateAsync(payload);
      return { ok: true, data: shift };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const updateShift = async (id: number, payload: Partial<ShiftConfig>): Promise<ApiResult<ShiftConfig>> => {
    try {
      const shift = await updateMutation.mutateAsync({ id, ...payload });
      return { ok: true, data: shift };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const deleteShift = async (id: number): Promise<ApiResult> => {
    try {
      await deleteMutation.mutateAsync(id);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  return {
    shifts: data ?? [],
    loading,
    error: error ? String((error as any)?.message) : null,
    refresh: () => queryClient.invalidateQueries({ queryKey: staffKeys.shifts }),
    createShift,
    updateShift,
    deleteShift,
  };
}

// ─── useStaff ─────────────────────────────────────────────────────────────────
export function useStaff(filters: StaffFilters = {}) {
  const { page = 1, limit = 10, search = "", dept = "", shift = "", att = "" } = filters;
  const queryClient = useQueryClient();

  const { data, isLoading: loading, isFetching, error: queryError, refetch } =
    useQuery<StaffListResponse>({
      queryKey: staffKeys.list({ page, limit, search, dept, shift, att }),
      queryFn:  async () => {
        const { data } = await api.get<StaffListResponse>("/staff", {
          params: {
            page,
            limit,
            ...(search.trim()    ? { q:     search.trim()   } : {}),
            ...(dept             ? { dept:  dept             } : {}),
            ...(shift            ? { shift: shift            } : {}),
            ...(att              ? { att:   att              } : {}),
          },
        });
        return data;
      },
      placeholderData:      keepPreviousData,
      staleTime:            20_000,
      gcTime:               5 * 60_000,
      refetchOnWindowFocus: false,
    });

  // ── Optimistic helpers ────────────────────────────────────────────────────
  const patchAllLists = (updater: (s: StaffUser) => StaffUser, predicate: (s: StaffUser) => boolean = () => true) => {
    queryClient.setQueriesData<StaffListResponse>(
      { queryKey: ["staff", "list"], exact: false },
      (old) => {
        if (!isStaffList(old)) return old;
        return { ...old, staff: old.staff.map((s) => (predicate(s) ? updater(s) : s)) };
      },
    );
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: CreateStaffPayload) => {
      const { data } = await api.post<{ staff: StaffUser; tempPassword: string; employeeId: string }>("/staff", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
    },
  });

  const createStaff = async (payload: CreateStaffPayload): Promise<ApiResult<{ staff: StaffUser; tempPassword: string; employeeId: string }>> => {
    try {
      const result = await createMutation.mutateAsync(payload);
      return { ok: true, data: result };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to create staff" };
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateStaffPayload }) => {
      const { data } = await api.patch<{ staff: StaffUser }>(`/staff/${id}`, payload);
      return data.staff;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["staff", "list"] });
      const previousCaches = queryClient.getQueriesData<StaffListResponse>({ queryKey: ["staff", "list"] });
      patchAllLists((s) => ({ ...s, ...payload, staffProfile: s.staffProfile ? { ...s.staffProfile, ...(payload as any) } : s.staffProfile }), (s) => s.id === id);
      return { previousCaches };
    },
    onSuccess: (updated) => {
      patchAllLists((s) => ({ ...s, ...updated }), (s) => s.id === updated.id);
      queryClient.invalidateQueries({ queryKey: ["staff", "list"], refetchType: "none" });
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previousCaches) {
        for (const [key, val] of ctx.previousCaches) queryClient.setQueryData(key, val);
      }
    },
  });

  const updateStaff = async (id: string, payload: UpdateStaffPayload): Promise<ApiResult<StaffUser>> => {
    try {
      const staff = await updateMutation.mutateAsync({ id, payload });
      return { ok: true, data: staff };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to update staff" };
    }
  };

  // ── Toggle duty — optimistic ──────────────────────────────────────────────
  const toggleDutyMutation = useMutation({
    mutationFn: async ({ id, is_on_duty }: { id: string; is_on_duty: boolean }) => {
      const { data } = await api.patch<{ staff: StaffUser }>(`/staff/${id}`, { is_on_duty });
      return data.staff;
    },
    onMutate: async ({ id, is_on_duty }) => {
      await queryClient.cancelQueries({ queryKey: ["staff", "list"] });
      const previousCaches = queryClient.getQueriesData<StaffListResponse>({ queryKey: ["staff", "list"] });
      patchAllLists(
        (s) => ({ ...s, staffProfile: s.staffProfile ? { ...s.staffProfile, is_on_duty } : s.staffProfile }),
        (s) => s.id === id,
      );
      return { previousCaches };
    },
    onSuccess: (updated) => {
      patchAllLists((s) => ({ ...s, ...updated }), (s) => s.id === updated.id);
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previousCaches) {
        for (const [key, val] of ctx.previousCaches) queryClient.setQueryData(key, val);
      }
    },
  });

  const toggleDuty = async (id: string, is_on_duty: boolean): Promise<ApiResult<StaffUser>> => {
    try {
      const staff = await toggleDutyMutation.mutateAsync({ id, is_on_duty });
      return { ok: true, data: staff };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  // ── Deactivate — optimistic ───────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/staff/${id}`);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["staff", "list"] });
      const previousCaches = queryClient.getQueriesData<StaffListResponse>({ queryKey: ["staff", "list"] });
      patchAllLists((s) => ({ ...s, isActive: false }), (s) => s.id === id);
      return { previousCaches };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previousCaches) {
        for (const [key, val] of ctx.previousCaches) queryClient.setQueryData(key, val);
      }
    },
  });

  const deactivateStaff = async (id: string): Promise<ApiResult> => {
    try {
      await deactivateMutation.mutateAsync(id);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  // ── Activate — optimistic ─────────────────────────────────────────────────
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/staff/${id}/activate`);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["staff", "list"] });
      const previousCaches = queryClient.getQueriesData<StaffListResponse>({ queryKey: ["staff", "list"] });
      patchAllLists((s) => ({ ...s, isActive: true }), (s) => s.id === id);
      return { previousCaches };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previousCaches) {
        for (const [key, val] of ctx.previousCaches) queryClient.setQueryData(key, val);
      }
    },
  });

  const activateStaff = async (id: string): Promise<ApiResult> => {
    try {
      await activateMutation.mutateAsync(id);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };


  return {
    staff:      data?.staff      ?? [],
    pagination: data?.pagination ?? null,
    loading,
    isFetching,
    error: queryError ? String((queryError as any)?.message) : null,
    refresh: refetch,
    createStaff,
    updateStaff,
    toggleDuty,
    deactivateStaff,
    activateStaff,
  };
}

// ─── useAttendance ────────────────────────────────────────────────────────────
export function useAttendance(staffId?: number) {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, refetch } = useQuery<AttendanceLog[]>({
    queryKey: staffKeys.attendance(staffId),
    queryFn:  async () => {
      const { data } = await api.get<{ logs: AttendanceLog[] }>(
        `/staff/attendance?staffId=${staffId}`,
      );
      return data.logs;
    },
    enabled:              !!staffId,
    staleTime:            60_000,
    gcTime:               5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const markMutation = useMutation({
    mutationFn: async (payload: {
      staff_id: number;
      user_id:  string;
      status:   AttendanceStatus;
      date?:    string;
      check_in?:  string | null;
      check_out?: string | null;
      notes?:     string | null;
    }) => {
      const { data } = await api.post<{ log: AttendanceLog }>("/staff/attendance", payload);
      return data.log;
    },

    // Optimistic: update attendance log list + staff list attendance_status
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: staffKeys.attendance(staffId) });
      const previousLogs = queryClient.getQueryData<AttendanceLog[]>(staffKeys.attendance(staffId));

      queryClient.setQueryData<AttendanceLog[]>(staffKeys.attendance(staffId), (old = []) => {
        const dateKey = payload.date ?? new Date().toISOString().split("T")[0];
        const idx = old.findIndex((l) => l.date.startsWith(dateKey));
        const optimistic: AttendanceLog = {
          id:         idx >= 0 ? old[idx].id : -1,
          staff_id:   payload.staff_id,
          user_id:    payload.user_id,
          date:       dateKey,
          status:     payload.status,
          check_in:   payload.check_in  ?? null,
          check_out:  payload.check_out ?? null,
          notes:      payload.notes     ?? null,
          hours:      null,
          created_at: new Date().toISOString(),
        };
        if (idx >= 0) { const n = [...old]; n[idx] = optimistic; return n; }
        return [optimistic, ...old];
      });

      // Also patch the staff list so the badge updates immediately
      queryClient.setQueriesData<StaffListResponse>(
        { queryKey: ["staff", "list"], exact: false },
        (old) => {
          if (!isStaffList(old)) return old;
          return {
            ...old,
            staff: old.staff.map((s) =>
              s.staffProfile?.staff_id === payload.staff_id
                ? { ...s, staffProfile: s.staffProfile ? { ...s.staffProfile, attendance_status: payload.status } : s.staffProfile }
                : s,
            ),
          };
        },
      );

      return { previousLogs };
    },

    onSuccess: (log) => {
      queryClient.setQueryData<AttendanceLog[]>(staffKeys.attendance(staffId), (old = []) => {
        const idx = old.findIndex((l) => l.date.startsWith(log.date.split("T")[0]));
        if (idx >= 0) { const n = [...old]; n[idx] = log; return n; }
        return [log, ...old];
      });
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.previousLogs) {
        queryClient.setQueryData(staffKeys.attendance(staffId), ctx.previousLogs);
      }
    },
  });

  

  const markAttendance = useCallback(
    async (
      staffId: number,
      userId:  string,
      status:  AttendanceStatus,
      date?:   string,
      checkIn?: string,
      checkOut?: string,
      notes?:  string,
    ): Promise<ApiResult<AttendanceLog>> => {
      try {
        const log = await markMutation.mutateAsync({
          staff_id:  staffId,
          user_id:   userId,
          status,
          date:      date      ?? new Date().toISOString().split("T")[0],
          check_in:  checkIn   ?? null,
          check_out: checkOut  ?? null,
          notes:     notes     ?? null,
        });
        return { ok: true, data: log };
      } catch (e: any) {
        return { ok: false, error: e?.response?.data?.error ?? "Failed" };
      }
    },
    [markMutation],
  );

  return {
    logs:            data ?? [],
    loading,
    markAttendance,
    refresh:         refetch,
  };
}
