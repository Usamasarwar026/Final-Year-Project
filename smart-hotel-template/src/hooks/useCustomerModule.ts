"use client";

import { useCallback } from "react";
import api from "@/lib/axios";
import type {
  Customer,
  CustomerProfile,
  UpdateCustomerPayload,
} from "@/types/customers";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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
  status?: "all" | "active" | "suspended";
  source?: "all" | "admin" | "self";
}

interface CustomerListResponse {
  customers: Customer[];
  pagination: CustomerPagination;
}

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

// ── Query Key Factory ─────────────────────────────────────────
export const customerKeys = {
  all: ["customers"] as const,
  list: (params: CustomerListParams) => ["customers", "list", params] as const,
  profile: (id: string) => ["customers", "profile", id] as const,
};

// ── Type Guard ────────────────────────────────────────────────
function isPaginatedList(val: unknown): val is CustomerListResponse {
  return (
    typeof val === "object" &&
    val !== null &&
    "customers" in val &&
    Array.isArray((val as any).customers) &&
    "pagination" in val
  );
}

// ── Customer List Hook ────────────────────────────────────────
export function useCustomerModule(params: CustomerListParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    source = "all",
  } = params;

  const queryClient = useQueryClient();
  const queryKey = customerKeys.list({ page, limit, search, status, source });

  const { data, isLoading: loading, isFetching, error: queryError, refetch } =
    useQuery<CustomerListResponse>({
      queryKey,
      queryFn: async () => {
        const { data } = await api.get<CustomerListResponse>("/customers", {
          params: {
            page,
            limit,
            ...(search.trim() ? { q: search.trim() } : {}),
            ...(status !== "all" ? { status } : {}),
            ...(source !== "all" ? { source } : {}),
          },
        });
        return data;
      },
      placeholderData: keepPreviousData,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    });

  // ── Update Mutation ───────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCustomerPayload;
    }): Promise<Customer> => {
      const axiosResponse = await api.patch(`/customers/${id}`, payload);

      const raw: unknown =
        axiosResponse &&
        typeof axiosResponse === "object" &&
        "data" in axiosResponse
          ? (axiosResponse as any).data
          : axiosResponse;

      const customer: Customer =
        raw && typeof raw === "object" && "customer" in (raw as any)
          ? (raw as any).customer
          : (raw as Customer);

      if (!customer?.id) {
        throw new Error("Invalid response: customer data missing");
      }

      return customer;
    },

    // ── Optimistic update — fires BEFORE the API call ─────
    onMutate: async ({ id, payload }) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["customers", "list"] });

      // Snapshot all current list caches for rollback on error
      const previousCaches = queryClient.getQueriesData<CustomerListResponse>({
        queryKey: ["customers", "list"],
      });

      // Immediately update every cached page with the new values
      queryClient.setQueriesData<CustomerListResponse>(
        { queryKey: ["customers", "list"], exact: false },
        (old) => {
          if (!isPaginatedList(old)) return old;
          return {
            ...old,
            customers: old.customers.map((c) =>
              c.id === id ? { ...c, ...payload } : c,
            ),
          };
        },
      );

      return { previousCaches };
    },

    // ── On success: replace optimistic data with real server data ──
    onSuccess: (updated) => {
      // Write confirmed server data into all list caches
      queryClient.setQueriesData<CustomerListResponse>(
        { queryKey: ["customers", "list"], exact: false },
        (old) => {
          if (!isPaginatedList(old)) return old;
          return {
            ...old,
            customers: old.customers.map((c) =>
              c.id === updated.id ? { ...c, ...updated } : c,
            ),
          };
        },
      );

      // Update open profile drawer cache
      queryClient.setQueryData<{ customer: CustomerProfile }>(
        customerKeys.profile(updated.id),
        (old) => {
          if (!old?.customer) return old;
          return { customer: { ...old.customer, ...updated } };
        },
      );

      // Invalidate so next focus/navigation gets fresh server data
      // (non-blocking — runs in background after UI already updated)
      queryClient.invalidateQueries({
        queryKey: ["customers", "list"],
        refetchType: "none", // don't refetch right now, just mark stale
      });
    },

    // ── On error: rollback to snapshots ───────────────────
    onError: (_err, _vars, context) => {
      if (context?.previousCaches) {
        for (const [queryKey, data] of context.previousCaches) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
  });

  const updateCustomer = useCallback(
    async (
      id: string,
      payload: UpdateCustomerPayload,
    ): Promise<ApiResult<Customer>> => {
      try {
        const customer = await updateMutation.mutateAsync({ id, payload });
        return { ok: true, data: customer };
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ?? e?.message ?? "Failed to update customer";
        return { ok: false, error: msg };
      }
    },
    [updateMutation],
  );

  return {
    customers: data?.customers ?? [],
    pagination: data?.pagination ?? null,
    loading,
    isFetching,
    error: queryError ? String((queryError as any)?.message) : null,
    refresh: refetch,
    updateCustomer,
  };
}

// ── Single Customer Profile Hook ──────────────────────────────
export function useCustomerProfile(id: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error: queryError, refetch } =
    useQuery<{ customer: CustomerProfile }>({
      queryKey: customerKeys.profile(id ?? ""),
      queryFn: async () => {
        const { data } = await api.get<{ customer: CustomerProfile }>(
          `/customers/${id}`,
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
        customerKeys.profile(id ?? ""),
        (old) => {
          if (!old) return old;
          const next = updater(old.customer);
          return next ? { customer: next } : old;
        },
      );
    },
    [queryClient, id],
  );

  return {
    profile: data?.customer ?? null,
    loading,
    error: queryError ? String((queryError as any)?.message) : null,
    refresh: refetch,
    setProfile,
  };
}