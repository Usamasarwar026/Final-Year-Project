// src/hooks/useReportModule.ts
// Reports module client-side hooks — mirrors existing hook patterns in the project
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import type {
  ReportKpi,
  RevenueReport,
  OccupancyReport,
  StaffReport,
  InventoryReport,
  BookingReport,
  GuestReport,
  ReportSchedule,
  CreateSchedulePayload,
  UpdateSchedulePayload,
} from "@/types/reports";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

// ── KPI ───────────────────────────────────────────────────────────────────────

export function useReportKpi() {
  const [kpi, setKpi] = useState<ReportKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ kpi: ReportKpi }>("/reports/kpi");
      setKpi(data.kpi);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load KPIs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { kpi, loading, error, refresh: fetch };
}

// ── Revenue ───────────────────────────────────────────────────────────────────

export function useRevenueReport(from: string, to: string) {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ report: RevenueReport }>(
        `/reports/revenue?from=${from}&to=${to}`
      );
      setReport(data.report);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load revenue report");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);
  return { report, loading, error, refresh: fetch };
}

// ── Occupancy ─────────────────────────────────────────────────────────────────

export function useOccupancyReport(from: string, to: string) {
  const [report, setReport] = useState<OccupancyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ report: OccupancyReport }>(
        `/reports/occupancy?from=${from}&to=${to}`
      );
      setReport(data.report);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load occupancy report");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);
  return { report, loading, error, refresh: fetch };
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export function useStaffReport(from: string, to: string) {
  const [report, setReport] = useState<StaffReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ report: StaffReport }>(
        `/reports/staff?from=${from}&to=${to}`
      );
      setReport(data.report);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load staff report");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);
  return { report, loading, error, refresh: fetch };
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export function useInventoryReport(from: string, to: string) {
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ report: InventoryReport }>(
        `/reports/inventory?from=${from}&to=${to}`
      );
      setReport(data.report);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load inventory report");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);
  return { report, loading, error, refresh: fetch };
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export function useBookingReport(from: string, to: string) {
  const [report, setReport] = useState<BookingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ report: BookingReport }>(
        `/reports/bookings?from=${from}&to=${to}`
      );
      setReport(data.report);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load booking report");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);
  return { report, loading, error, refresh: fetch };
}

// ── Guests ────────────────────────────────────────────────────────────────────

export function useGuestReport(from: string, to: string) {
  const [report, setReport] = useState<GuestReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ report: GuestReport }>(
        `/reports/guests?from=${from}&to=${to}`
      );
      setReport(data.report);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load guest report");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);
  return { report, loading, error, refresh: fetch };
}

// ── Schedules ─────────────────────────────────────────────────────────────────

export function useReportSchedules() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ schedules: ReportSchedule[] }>(
        "/reports/schedules"
      );
      setSchedules(data.schedules);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createSchedule = async (
    payload: CreateSchedulePayload
  ): Promise<ApiResult<ReportSchedule>> => {
    try {
      const { data } = await api.post<{ schedule: ReportSchedule }>(
        "/reports/schedules",
        payload
      );
      setSchedules((prev) => [data.schedule, ...prev]);
      return { ok: true, data: data.schedule };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.error ?? "Failed to create schedule",
      };
    }
  };

  const updateSchedule = async (
    id: number,
    payload: UpdateSchedulePayload
  ): Promise<ApiResult<ReportSchedule>> => {
    try {
      const { data } = await api.patch<{ schedule: ReportSchedule }>(
        `/reports/schedules/${id}`,
        payload
      );
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? data.schedule : s))
      );
      return { ok: true, data: data.schedule };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.error ?? "Failed to update schedule",
      };
    }
  };

  const deleteSchedule = async (id: number): Promise<ApiResult> => {
    try {
      await api.delete(`/reports/schedules/${id}`);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      return { ok: true };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.error ?? "Failed to delete schedule",
      };
    }
  };

  return {
    schedules,
    loading,
    error,
    refresh: fetch,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}
