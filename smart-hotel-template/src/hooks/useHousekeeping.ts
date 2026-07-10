// src/hooks/useHousekeeping.ts
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import type {
  HousekeepingTask,
  ServiceRequest,
  LaundryRecord,
  HousekeepingStats,
  CreateTaskPayload,
  UpdateTaskPayload,
  CreateLaundryPayload,
  TaskStatus,
  RequestStatus,
  LaundryStatus,
} from "@/types/housekeeping";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

// ─── useTasks ─────────────────────────────────────────────────────────────────
export function useTasks(filters?: {
  status?: string;
  type?: string;
  priority?: string;
  assignedTo?: string;
  date?: string;
  roomId?: string;
}) {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = () => {
    if (!filters) return "";
    const p = new URLSearchParams();
    if (filters.status) p.set("status", filters.status);
    if (filters.type) p.set("type", filters.type);
    if (filters.priority) p.set("priority", filters.priority);
    if (filters.assignedTo) p.set("assignedTo", filters.assignedTo);
    if (filters.date) p.set("date", filters.date);
    if (filters.roomId) p.set("roomId", filters.roomId);
    const q = p.toString();
    return q ? `?${q}` : "";
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ tasks: HousekeepingTask[] }>(
        `/housekeeping/tasks${buildQuery()}`,
      );
      setTasks(data.tasks);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // eslint-disable-line

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createTask = async (
    payload: CreateTaskPayload,
  ): Promise<ApiResult<HousekeepingTask>> => {
    try {
      const { data } = await api.post<{ task: HousekeepingTask }>(
        "/housekeeping/tasks",
        payload,
      );
      setTasks((prev) => [data.task, ...prev]);
      return { ok: true, data: data.task };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const updateTask = async (
    id: number,
    payload: UpdateTaskPayload,
  ): Promise<ApiResult<HousekeepingTask>> => {
    try {
      const { data } = await api.patch<{ task: HousekeepingTask }>(
        `/housekeeping/tasks/${id}`,
        payload,
      );
      setTasks((prev) => prev.map((t) => (t.task_id === id ? data.task : t)));
      return { ok: true, data: data.task };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const deleteTask = async (id: number): Promise<ApiResult> => {
    try {
      await api.delete(`/housekeeping/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.task_id !== id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  // Quick status helpers
  const startTask = (id: number) => updateTask(id, { status: "InProgress" });
  const completeTask = (id: number) => updateTask(id, { status: "Done" });
  const cancelTask = (id: number) => updateTask(id, { status: "Cancelled" });
  const assignTask = (id: number, assignedTo: number) =>
    updateTask(id, { assigned_to: assignedTo });

  return {
    tasks,
    loading,
    error,
    refresh: fetch,
    createTask,
    updateTask,
    deleteTask,
    startTask,
    completeTask,
    cancelTask,
    assignTask,
  };
}

// ─── useHousekeepingStats ─────────────────────────────────────────────────────
export function useHousekeepingStats() {
  const [stats, setStats] = useState<HousekeepingStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ stats: HousekeepingStats }>(
        "/housekeeping/stats",
      );
      setStats(data.stats);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, loading, refresh: fetch };
}

// ─── useServiceRequests ───────────────────────────────────────────────────────
export function useServiceRequests(filters?: {
  status?: string;
  type?: string;
}) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = () => {
    if (!filters) return "";
    const p = new URLSearchParams();
    if (filters.status) p.set("status", filters.status);
    if (filters.type) p.set("type", filters.type);
    const q = p.toString();
    return q ? `?${q}` : "";
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ requests: ServiceRequest[] }>(
        `/housekeeping/service-requests${buildQuery()}`,
      );
      setRequests(data.requests);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // eslint-disable-line

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateRequest = async (
    id: number,
    status: RequestStatus,
  ): Promise<ApiResult<ServiceRequest>> => {
    try {
      const { data } = await api.patch<{ request: ServiceRequest }>(
        `/housekeeping/service-requests/${id}`,
        { status },
      );
      setRequests((prev) =>
        prev.map((r) => (r.request_id === id ? data.request : r)),
      );
      return { ok: true, data: data.request };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const cancelRequest = async (id: number): Promise<ApiResult> => {
    try {
      await api.delete(`/housekeeping/service-requests/${id}`);
      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === id
            ? { ...r, status: "Cancelled" as RequestStatus }
            : r,
        ),
      );
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  return {
    requests,
    loading,
    error,
    refresh: fetch,
    updateRequest,
    cancelRequest,
  };
}

// ─── useLaundry ───────────────────────────────────────────────────────────────
export function useLaundry(filters?: { status?: string; roomId?: string }) {
  const [records, setRecords] = useState<LaundryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = () => {
    if (!filters) return "";
    const p = new URLSearchParams();
    if (filters.status) p.set("status", filters.status);
    if (filters.roomId) p.set("roomId", filters.roomId);
    const q = p.toString();
    return q ? `?${q}` : "";
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ records: LaundryRecord[] }>(
        `/housekeeping/laundry${buildQuery()}`,
      );
      const normalized = (data.records ?? []).map((r: any) => ({
        ...r,
        laundry_id: r.laundry_id ?? r.text_id,
      }));
      setRecords(normalized);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load laundry records");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // eslint-disable-line

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createRecord = async (
    payload: CreateLaundryPayload,
  ): Promise<ApiResult<LaundryRecord>> => {
    try {
      const { data } = await api.post<{ record: LaundryRecord }>(
        "/housekeeping/laundry",
        payload,
      );
      setRecords((prev) => [data.record, ...prev]);
      return { ok: true, data: data.record };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const updateRecord = async (
    id: number,
    payload: {
      status?: LaundryStatus;
      charge_amount?: number;
      returned_at?: string;
    },
  ): Promise<ApiResult<LaundryRecord>> => {
    try {
      const { data } = await api.patch<{ record: LaundryRecord }>(
        `/housekeeping/laundry/${id}`,
        payload,
      );
      setRecords((prev) =>
        prev.map((r) => (r.laundry_id === id ? data.record : r)),
      );
      return { ok: true, data: data.record };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  const deleteRecord = async (id: number): Promise<ApiResult> => {
    try {
      await api.delete(`/housekeeping/laundry/${id}`);
      setRecords((prev) => prev.filter((r) => r.laundry_id !== id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed" };
    }
  };

  return {
    records,
    loading,
    error,
    refresh: fetch,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
