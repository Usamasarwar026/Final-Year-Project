// src/hooks/useCustomerModule.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import type {
  Customer,
  CustomerProfile,
  UpdateCustomerPayload,
} from "@/types/customers";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

// ── Customer List ─────────────────────────────────────────────
export function useCustomerModule() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ customers: Customer[] }>("/customers");
      setCustomers(data.customers || []);
    } catch (e: any) {
      console.error("Failed to load customers:", e);
      setError(e?.response?.data?.error ?? "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateCustomer = async (
    id: string | number,
    payload: UpdateCustomerPayload,
  ): Promise<ApiResult<Customer>> => {
    try {
      const { data } = await api.patch<{ customer: Customer }>(
        `/customers/${id}`,
        payload,
      );
      setCustomers((prev) =>
        prev.map((c) =>
          c.customer_id === Number(id) ? { ...c, ...data.customer } : c,
        ),
      );
      return { ok: true, data: data.customer };
    } catch (e: any) {
      console.error("Failed to update customer:", e);
      return {
        ok: false,
        error: e?.response?.data?.error ?? "Failed to update customer",
      };
    }
  };

  const toggleSuspend = async (
    id: string | number,
    isActive: boolean,
  ): Promise<ApiResult<Customer>> => {
    return updateCustomer(id, { is_active: isActive });
  };

  return {
    customers,
    loading,
    error,
    refresh: fetch,
    updateCustomer,
    toggleSuspend,
  };
}

// ── Single Customer Profile ───────────────────────────────────
export function useCustomerProfile(id: number | null) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ customer: CustomerProfile }>(
        `/customers/${id}`,
      );
      setProfile(data.customer);
    } catch (e: any) {
      console.error("Failed to load profile:", e);
      setError(e?.response?.data?.error ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { profile, loading, error, refresh: fetch, setProfile };
}
