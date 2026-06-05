// src/hooks/useStaff.ts
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import type {
  StaffUser, CreateStaffPayload, UpdateStaffPayload,
  AttendanceStatus, AttendanceLog, DepartmentConfig, ShiftConfig,
} from "@/types/staff";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

// ─── useDepartments ───────────────────────────────────────────────────────────
export function useDepartments() {
  const [departments, setDepartments] = useState<DepartmentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get<{ departments: DepartmentConfig[] }>("/staff/departments");
      setDepartments(data.departments);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load departments");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createDepartment = async (payload: { name: string; icon?: string; color?: string; bg?: string }): Promise<ApiResult<DepartmentConfig>> => {
    try {
      const { data } = await api.post<{ department: DepartmentConfig }>("/staff/departments", payload);
      setDepartments((prev) => [...prev, data.department].sort((a, b) => a.name.localeCompare(b.name)));
      return { ok: true, data: data.department };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const updateDepartment = async (id: number, payload: Partial<DepartmentConfig>): Promise<ApiResult<DepartmentConfig>> => {
    try {
      const { data } = await api.patch<{ department: DepartmentConfig }>("/staff/departments", { id, ...payload });
      setDepartments((prev) => prev.map((d) => d.id === id ? data.department : d));
      return { ok: true, data: data.department };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const deleteDepartment = async (id: number): Promise<ApiResult> => {
    try {
      await api.delete(`/staff/departments?id=${id}`);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  return { departments, loading, error, refresh: fetch, createDepartment, updateDepartment, deleteDepartment };
}

// ─── useShifts ────────────────────────────────────────────────────────────────
export function useShifts() {
  const [shifts,  setShifts]  = useState<ShiftConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get<{ shifts: ShiftConfig[] }>("/staff/shifts");
      setShifts(data.shifts);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load shifts");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createShift = async (payload: { name: string; start_time: string; end_time: string; color?: string; bg?: string }): Promise<ApiResult<ShiftConfig>> => {
    try {
      const { data } = await api.post<{ shift: ShiftConfig }>("/staff/shifts", payload);
      setShifts((prev) => [...prev, data.shift].sort((a, b) => a.name.localeCompare(b.name)));
      return { ok: true, data: data.shift };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const updateShift = async (id: number, payload: Partial<ShiftConfig>): Promise<ApiResult<ShiftConfig>> => {
    try {
      const { data } = await api.patch<{ shift: ShiftConfig }>("/staff/shifts", { id, ...payload });
      setShifts((prev) => prev.map((s) => s.id === id ? data.shift : s));
      return { ok: true, data: data.shift };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const deleteShift = async (id: number): Promise<ApiResult> => {
    try {
      await api.delete(`/staff/shifts?id=${id}`);
      setShifts((prev) => prev.filter((s) => s.id !== id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  return { shifts, loading, error, refresh: fetch, createShift, updateShift, deleteShift };
}

// ─── useStaff ─────────────────────────────────────────────────────────────────
export function useStaff() {
  const [staff,   setStaff]   = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get<{ staff: StaffUser[] }>("/staff");
      console.log("staff is here data",data)
      setStaff(data.staff);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load staff");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createStaff = async (
    payload: CreateStaffPayload,
  ): Promise<ApiResult<{ staff: StaffUser; tempPassword: string; employeeId: string }>> => {
    try {
      const { data } = await api.post<{ staff: StaffUser; tempPassword: string; employeeId: string }>("/staff", payload);
      setStaff((prev) => [data.staff, ...prev]);
      return { ok: true, data };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to create staff" };
    }
  };

  const updateStaff = async (id: string, payload: UpdateStaffPayload): Promise<ApiResult<StaffUser>> => {
    try {
      const { data } = await api.patch<{ staff: StaffUser }>(`/staff/${id}`, payload);
      setStaff((prev) => prev.map((s) => s.id === id ? data.staff : s));
      return { ok: true, data: data.staff };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to update staff" };
    }
  };

  const toggleDuty = async (id: string, is_on_duty: boolean): Promise<ApiResult<StaffUser>> => {
    try {
      const { data } = await api.patch<{ staff: StaffUser }>(`/staff/${id}`, { is_on_duty });
      setStaff((prev) => prev.map((s) => s.id === id ? data.staff : s));
      return { ok: true, data: data.staff };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const deactivateStaff = async (id: string): Promise<ApiResult> => {
    try {
      await api.delete(`/staff/${id}`);
      setStaff((prev) => prev.map((s) => s.id === id ? { ...s, isActive: false } : s));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const activateStaff = async (id: string): Promise<ApiResult> => {
  try {
    await api.patch(`/staff/${id}/activate`);

    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, isActive: true }
          : s
      )
    );

    return { ok: true };
  } catch (e: any) {
    return {
      ok: false,
      error: e?.response?.data?.error ?? "Failed",
    };
  }
};

  return { staff, loading, error, refresh: fetch, createStaff, updateStaff, toggleDuty, deactivateStaff, activateStaff };
}
 
// ─── useAttendance ────────────────────────────────────────────────────────────
export function useAttendance(staffId?: number) {
  const [logs,    setLogs]    = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
 
  const fetch = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ logs: AttendanceLog[] }>(`/staff/attendance?staffId=${staffId}`);
      setLogs(data.logs);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [staffId]);
 
  useEffect(() => { fetch(); }, [fetch]);
 
  const markAttendance = async (
    staffId: number,
    userId: string,
    status: AttendanceStatus,
    date?: string,
    checkIn?: string,
    checkOut?: string,
    notes?: string,
  ): Promise<ApiResult<AttendanceLog>> => {
    try {
      const { data } = await api.post<{ log: AttendanceLog }>("/staff/attendance", {
        staff_id: staffId,
        user_id:  userId,
        status,
        date:      date ?? new Date().toISOString().split("T")[0],
        check_in:  checkIn  ?? null,
        check_out: checkOut ?? null,
        notes:     notes    ?? null,
      });
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.date.startsWith(data.log.date.split("T")[0]));
        if (idx >= 0) { const n = [...prev]; n[idx] = data.log; return n; }
        return [data.log, ...prev];
      });
      return { ok: true, data: data.log };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };
 
  return { logs, loading, markAttendance, refresh: fetch };
}