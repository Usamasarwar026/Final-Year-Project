// src/hooks/useCustomerModule.ts
"use client";

import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  Customer,
  CustomerProfile,
  UpdateCustomerPayload,
} from "@/types/customers";

// ── Types ─────────────────────────────────────────────────────
export interface CustomerPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "active" | "inactive";
}

interface CustomerListResponse {
  customers: Customer[];
  pagination: CustomerPagination;
}

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

// ── Query Key Factory ─────────────────────────────────────────
export const customerKeys = {
  all: ["customers"] as const,
  // paginated admin list — ["customers", "list", { page, limit, ... }]
  list: (params: CustomerListParams) => ["customers", "list", params] as const,
  // single profile
  profile: (id: number) => ["customers", "profile", id] as const,
};

// ── Helper: is this cache entry a paginated CustomerListResponse? ──
function isPaginatedList(val: unknown): val is CustomerListResponse {
  return (
    typeof val === "object" &&
    val !== null &&
    "customers" in val &&
    Array.isArray((val as any).customers) &&
    "pagination" in val
  );
}

// ── Customer List (paginated + filtered) ──────────────────────
export function useCustomerModule(params: CustomerListParams = {}) {
  const { page = 1, limit = 10, search = "", status = "all" } = params;
  const queryClient = useQueryClient();

  const queryKey = customerKeys.list({ page, limit, search, status });

  const {
    data,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery<CustomerListResponse>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<CustomerListResponse>("/customers", {
        params: {
          page,
          limit,
          ...(search.trim() ? { q: search.trim() } : {}),
          ...(status !== "all" ? { status } : {}),
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: UpdateCustomerPayload;
    }): Promise<Customer> => {
      // api.patch returns AxiosResponse — response.data = { customer: {...} }
      // But some axios interceptors unwrap to response.data directly.
      // Handle both cases safely.
      const axiosResponse = await api.patch(`/customers/${id}`, payload);

      // axiosResponse might be AxiosResponse OR already the unwrapped data
      // depending on the interceptor setup
      const raw: unknown =
        axiosResponse && typeof axiosResponse === "object" && "data" in axiosResponse
          ? (axiosResponse as any).data
          : axiosResponse;

      // raw is either { customer: Customer } or Customer directly
      const customer: Customer =
        raw && typeof raw === "object" && "customer" in (raw as any)
          ? (raw as any).customer
          : (raw as Customer);

      if (!customer?.customer_id) {
        throw new Error("Invalid response: customer data missing");
      }

      return customer;
    },

    onSuccess: (updated) => {
      // Only update paginated list caches — NOT ["customers", "active"] from useCustomers()
      // We target ["customers", "list", *] specifically to avoid touching other cache shapes
      queryClient.setQueriesData<CustomerListResponse>(
        { queryKey: ["customers", "list"], exact: false },
        (old) => {
          // Extra safety: skip if not a paginated list shape
          if (!isPaginatedList(old)) return old;
          return {
            ...old,
            customers: old.customers.map((c) =>
              c.customer_id === updated.customer_id ? { ...c, ...updated } : c
            ),
          };
        }
      );

      // Update profile cache if it's open
      queryClient.setQueryData<{ customer: CustomerProfile }>(
        customerKeys.profile(updated.customer_id),
        (old) => {
          if (!old?.customer) return old;
          return { customer: { ...old.customer, ...updated } };
        }
      );
    },

    // Suppress React Query's default error — handleUpdate catches it manually
    onError: () => {},
  });

  const handleUpdate = useCallback(
    async (
      id: string | number,
      payload: UpdateCustomerPayload
    ): Promise<ApiResult<Customer>> => {
      try {
        const customer = await updateMutation.mutateAsync({ id, payload });
        return { ok: true, data: customer };
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ??
          e?.message ??
          "Failed to update customer";
        return { ok: false, error: msg };
      }
    },
    [updateMutation]
  );

  return {
    customers: data?.customers ?? [],
    pagination: data?.pagination ?? null,
    loading,
    isFetching,
    error: queryError ? String((queryError as any)?.message) : null,
    refresh: refetch,
    updateCustomer: handleUpdate,
  };
}

// ── Single Customer Profile ───────────────────────────────────
export function useCustomerProfile(id: number | null) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<{ customer: CustomerProfile }>({
    queryKey: customerKeys.profile(id!),
    queryFn: async () => {
      const { data } = await api.get<{ customer: CustomerProfile }>(
        `/customers/${id}`
      );
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const setProfile = useCallback(
    (updater: (old: CustomerProfile | null) => CustomerProfile | null) => {
      queryClient.setQueryData<{ customer: CustomerProfile }>(
        customerKeys.profile(id!),
        (old) => {
          if (!old) return old;
          const next = updater(old.customer);
          return next ? { customer: next } : old;
        }
      );
    },
    [queryClient, id]
  );

  return {
    profile: data?.customer ?? null,
    loading,
    error: queryError ? String((queryError as any)?.message) : null,
    refresh: refetch,
    setProfile,
  };
}