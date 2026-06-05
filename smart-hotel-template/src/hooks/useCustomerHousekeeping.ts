// src/hooks/useCustomerHousekeeping.ts
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import type { ServiceRequest, RequestType } from "@/types/housekeeping";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

interface ActiveBooking {
  booking_id:     number;
  check_in_date:  string;
  check_out_date: string;
  status:         string;
  room: {
    room_id:         number;
    room_number:     string;
    floor:           number;
    room_type:       string;
    cleaning_status: string;
  };
}

// ─── useActiveBooking ─────────────────────────────────────────────────────────
export function useActiveBooking() {
  const [booking,  setBooking]  = useState<ActiveBooking | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get<{ booking: ActiveBooking | null }>("/customers/active-booking");
      setBooking(data.booking);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { booking, loading, error, refresh: fetch };
}

// ─── useCustomerServiceRequests ───────────────────────────────────────────────
export function useCustomerServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get<{ requests: ServiceRequest[] }>("/customers/service-requests");
      setRequests(data.requests);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const submitRequest = async (
    bookingId: number,
    requestType: RequestType,
    description?: string
  ): Promise<ApiResult<ServiceRequest>> => {
    try {
      const { data } = await api.post<{ request: ServiceRequest }>("/customers/service-requests", {
        booking_id:   bookingId,
        request_type: requestType,
        description:  description || undefined,
      });
      setRequests((prev) => [data.request, ...prev]);
      return { ok: true, data: data.request };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to submit request" };
    }
  };

  return { requests, loading, error, refresh: fetch, submitRequest };
}

// ─── useStaffMe ───────────────────────────────────────────────────────────────
export interface StaffMeData {
  user: {
    id: string; name: string; email: string; phoneNumber?: string | null;
    employeeId?: string | null; permissions: string[]; isActive: boolean;
    city?: string | null; address?: string | null; cnic?: string | null;
    dateOfBirth?: string | null; lastLogin?: string | null; createdAt: string;
    staffProfile?: {
      staff_id: number; designation: string; joining_date?: string | null;
      basic_salary?: number | null; is_on_duty: boolean;
      attendance_status?: string | null; performance_notes?: string | null;
      department?: { name: string; icon: string; color: string; bg: string } | null;
      shift?: { name: string; start_time: string; end_time: string } | null;
    } | null;
  };
  todayAttendance: {
    id: number; date: string; status: string;
    check_in?: string | null; check_out?: string | null; hours?: number | null;
  } | null;
  recentAttendance: {
    id: number; date: string; status: string; hours?: number | null;
  }[];
  attSummary: {
    present: number; absent: number; halfDay: number; leave: number; totalHours: number;
  };
}

export function useStaffMe() {
  const [data,    setData]    = useState<StaffMeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: d } = await api.get<StaffMeData>("/staff/me");
      setData(d);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refresh: fetch };
}

// ─── useMyTasks ───────────────────────────────────────────────────────────────
import type { HousekeepingTask, TaskStatus } from "@/types/housekeeping";

interface MyTasksData {
  tasks: HousekeepingTask[];
  stats: {
    todayCompleted: number;
    totalDone:      number;
    pendingCount:   number;
    inProgressCount: number;
  } | null;
}

export function useMyTasks() {
  const [data,    setData]    = useState<MyTasksData>({ tasks: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: d } = await api.get<MyTasksData>("/staff/my-tasks");
      setData(d);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateTaskStatus = async (taskId: number, status: TaskStatus): Promise<ApiResult> => {
    try {
      await api.patch(`/housekeeping/tasks/${taskId}`, { status });
      await fetch(); // refresh after update
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  return { ...data, loading, error, refresh: fetch, updateTaskStatus };
}