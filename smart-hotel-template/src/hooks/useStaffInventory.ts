"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import type {
  CreateWastagePayload,
  InventoryDepartment,
  InventoryItem,
  InventoryUsageLog,
  LogUsagePayload,
  LowStockAlert,
  WastageRecord,
} from "@/types/inventory";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

interface StaffInventoryStats {
  totalItems: number;
  lowStockCount: number;
  expiringCount: number;
  totalStockValue: number;
}

interface StaffInventoryData {
  department: InventoryDepartment;
  items: InventoryItem[];
  usageLogs: InventoryUsageLog[];
  alerts: LowStockAlert[];
  stats: StaffInventoryStats;
}

const emptyStats: StaffInventoryStats = {
  totalItems: 0,
  lowStockCount: 0,
  expiringCount: 0,
  totalStockValue: 0,
};

export function useStaffInventory(filters?: {
  search?: string;
  department?: InventoryDepartment;
}) {
  const [data, setData] = useState<StaffInventoryData>({
    department: filters?.department ?? "General",
    items: [],
    usageLogs: [],
    alerts: [],
    stats: emptyStats,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.department) params.set("department", filters.department);

      const { data: response } = await api.get<StaffInventoryData>(
        `/staff/inventory${params.toString() ? `?${params}` : ""}`,
      );

      setData(response);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to load staff inventory");
    } finally {
      setLoading(false);
    }
  }, [filters?.department, filters?.search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const logUsage = async (
    payload: LogUsagePayload,
  ): Promise<ApiResult<InventoryUsageLog>> => {
    try {
      const { data: response } = await api.post<{ log: InventoryUsageLog }>(
        "/staff/inventory",
        payload,
      );
      await fetch();
      return { ok: true, data: response.log };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.response?.data?.error ?? "Failed to log usage",
      };
    }
  };

  const reportWastage = async (
    payload: CreateWastagePayload,
  ): Promise<ApiResult<WastageRecord>> => {
    try {
      const { data: response } = await api.post<{ record: WastageRecord }>(
        "/staff/inventory/wastage",
        payload,
      );
      await fetch();
      return { ok: true, data: response.record };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.response?.data?.error ?? "Failed to report wastage",
      };
    }
  };

  return {
    ...data,
    loading,
    error,
    refresh: fetch,
    logUsage,
    reportWastage,
  };
}
