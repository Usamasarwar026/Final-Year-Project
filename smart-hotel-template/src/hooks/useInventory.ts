// src/hooks/useInventory.ts
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import type {
  InventoryItem,
  InventoryCategory,
  InventoryVendor,
  PurchaseOrder,
  InventoryUsageLog,
  WastageRecord,
  LowStockAlert,
  InventoryDashboardStats,
  CreateItemPayload,
  UpdateItemPayload,
  CreateCategoryPayload,
  CreateVendorPayload,
  UpdateVendorPayload,
  CreatePOPayload,
  ReceiveStockPayload,
  LogUsagePayload,
  CreateWastagePayload,
} from "@/types/inventory";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export function useInventory() {
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ stats: InventoryDashboardStats }>("/inventory/dashboard");
      setStats(data.stats);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load inventory stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, loading, error, refresh: fetch };
}

// ─── Items ────────────────────────────────────────────────────────────────────
export function useInventoryItems(filters?: {
  categoryId?: number;
  isActive?: boolean;
  search?: string;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.set("categoryId", String(filters.categoryId));
    if (filters?.isActive !== undefined) params.set("isActive", String(filters.isActive));
    if (filters?.search) params.set("search", filters.search);
    return params.toString();
  }, [filters?.categoryId, filters?.isActive, filters?.search]);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = buildQuery();
      const { data } = await api.get<{ items: InventoryItem[] }>(
        `/inventory/items${q ? `?${q}` : ""}`
      );
      setItems(data.items);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetch(); }, [fetch]);

  const createItem = async (payload: CreateItemPayload): Promise<ApiResult<InventoryItem>> => {
    try {
      const { data } = await api.post<{ item: InventoryItem }>("/inventory/items", payload);
      setItems((prev) => [data.item, ...prev]);
      return { ok: true, data: data.item };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to create item" };
    }
  };

  const updateItem = async (id: number, payload: UpdateItemPayload): Promise<ApiResult<InventoryItem>> => {
    try {
      const { data } = await api.patch<{ item: InventoryItem }>(`/inventory/items/${id}`, payload);
      setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)));
      return { ok: true, data: data.item };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to update item" };
    }
  };

  const deleteItem = async (id: number): Promise<ApiResult> => {
    try {
      await api.delete(`/inventory/items/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to deactivate item" };
    }
  };

  return { items, loading, error, refresh: fetch, createItem, updateItem, deleteItem };
}

// ─── Categories ───────────────────────────────────────────────────────────────
export function useCategories() {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ categories: InventoryCategory[] }>("/inventory/categories");
      setCategories(data.categories);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createCategory = async (payload: CreateCategoryPayload): Promise<ApiResult<InventoryCategory>> => {
    try {
      const { data } = await api.post<{ category: InventoryCategory }>("/inventory/categories", payload);
      setCategories((prev) => [...prev, data.category]);
      return { ok: true, data: data.category };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to create category" };
    }
  };

  return { categories, loading, error, refresh: fetch, createCategory };
}

// ─── Vendors ──────────────────────────────────────────────────────────────────
export function useVendors() {
  const [vendors, setVendors] = useState<InventoryVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ vendors: InventoryVendor[] }>("/inventory/vendors");
      setVendors(data.vendors);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createVendor = async (payload: CreateVendorPayload): Promise<ApiResult<InventoryVendor>> => {
    try {
      const { data } = await api.post<{ vendor: InventoryVendor }>("/inventory/vendors", payload);
      setVendors((prev) => [...prev, data.vendor]);
      return { ok: true, data: data.vendor };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to create vendor" };
    }
  };

  const updateVendor = async (id: number, payload: UpdateVendorPayload): Promise<ApiResult<InventoryVendor>> => {
    try {
      const { data } = await api.patch<{ vendor: InventoryVendor }>(`/inventory/vendors/${id}`, payload);
      setVendors((prev) => prev.map((v) => (v.id === id ? data.vendor : v)));
      return { ok: true, data: data.vendor };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to update vendor" };
    }
  };

  return { vendors, loading, error, refresh: fetch, createVendor, updateVendor };
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export function usePurchaseOrders(filters?: { status?: string }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = filters?.status ? `?status=${filters.status}` : "";
      const { data } = await api.get<{ orders: PurchaseOrder[] }>(`/inventory/purchase-orders${q}`);
      setOrders(data.orders);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, [filters?.status]);

  useEffect(() => { fetch(); }, [fetch]);

  const createOrder = async (payload: CreatePOPayload): Promise<ApiResult<PurchaseOrder>> => {
    try {
      const { data } = await api.post<{ order: PurchaseOrder }>("/inventory/purchase-orders", payload);
      setOrders((prev) => [data.order, ...prev]);
      return { ok: true, data: data.order };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to create purchase order" };
    }
  };

  const updateStatus = async (id: number, status: string): Promise<ApiResult<PurchaseOrder>> => {
    try {
      const { data } = await api.patch<{ order: PurchaseOrder }>(`/inventory/purchase-orders/${id}`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? data.order : o)));
      return { ok: true, data: data.order };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to update order" };
    }
  };

  const receiveStock = async (poId: number, payload: ReceiveStockPayload): Promise<ApiResult<PurchaseOrder>> => {
    try {
      const { data } = await api.post<{ order: PurchaseOrder }>(`/inventory/stock-receive/${poId}`, payload);
      setOrders((prev) => prev.map((o) => (o.id === poId ? data.order : o)));
      return { ok: true, data: data.order };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to receive stock" };
    }
  };

  return { orders, loading, error, refresh: fetch, createOrder, updateStatus, receiveStock };
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export function useAlerts() {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ alerts: LowStockAlert[] }>("/inventory/alerts?status=Active");
      setAlerts(data.alerts);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const resolve = async (id: number, dismiss = false): Promise<ApiResult> => {
    try {
      await api.patch(`/inventory/alerts/${id}`, { action: dismiss ? "dismiss" : "resolve" });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to resolve alert" };
    }
  };

  return { alerts, loading, refresh: fetch, resolve };
}

// ─── Usage Logs ───────────────────────────────────────────────────────────────
export function useUsageLogs(filters?: { department?: string; from?: string; to?: string }) {
  const [logs, setLogs] = useState<InventoryUsageLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.department) params.set("department", filters.department);
      if (filters?.from) params.set("from", filters.from);
      if (filters?.to) params.set("to", filters.to);
      const { data } = await api.get<{ logs: InventoryUsageLog[] }>(
        `/inventory/usage-logs${params.toString() ? `?${params}` : ""}`
      );
      setLogs(data.logs);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.department, filters?.from, filters?.to]);

  useEffect(() => { fetch(); }, [fetch]);

  const logUsage = async (payload: LogUsagePayload): Promise<ApiResult<InventoryUsageLog>> => {
    try {
      const { data } = await api.post<{ log: InventoryUsageLog }>("/inventory/usage-logs", payload);
      setLogs((prev) => [data.log, ...prev]);
      return { ok: true, data: data.log };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to log usage" };
    }
  };

  return { logs, loading, refresh: fetch, logUsage };
}

// ─── Wastage ─────────────────────────────────────────────────────────────────
export function useWastage(filters?: { from?: string; to?: string }) {
  const [records, setRecords] = useState<WastageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.from) params.set("from", filters.from);
      if (filters?.to) params.set("to", filters.to);
      const { data } = await api.get<{ records: WastageRecord[] }>(
        `/inventory/wastage${params.toString() ? `?${params}` : ""}`
      );
      setRecords(data.records);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.from, filters?.to]);

  useEffect(() => { fetch(); }, [fetch]);

  const addWastage = async (payload: CreateWastagePayload): Promise<ApiResult<WastageRecord>> => {
    try {
      const { data } = await api.post<{ record: WastageRecord }>("/inventory/wastage", payload);
      setRecords((prev) => [data.record, ...prev]);
      return { ok: true, data: data.record };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to record wastage" };
    }
  };

  const totalCost = records.reduce((sum, r) => sum + r.total_cost, 0);

  return { records, loading, refresh: fetch, addWastage, totalCost };
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export function useReports(dateFrom: string, dateTo: string) {
  const [consumption, setConsumption] = useState<any[]>([]);
  const [cogs, setCogs] = useState<any[]>([]);
  const [wastage, setWastage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const q = `from=${dateFrom}&to=${dateTo}`;
      const [consumptionRes, cogsRes, wastageRes] = await Promise.all([
        api.get<{ report: any[] }>(`/inventory/reports/consumption?${q}`),
        api.get<{ report: any[] }>(`/inventory/reports/cogs?${q}`),
        api.get<{ report: any[] }>(`/inventory/reports/wastage?${q}`),
      ]);
      setConsumption(consumptionRes.data.report);
      setCogs(cogsRes.data.report);
      setWastage(wastageRes.data.report);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { consumption, cogs, wastage, loading, refresh: fetch };
}
