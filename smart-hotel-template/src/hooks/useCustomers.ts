// src/hooks/useCustomers.ts
"use client";

import api from "@/lib/axios";
import type { CustomerUser, CreateCustomerPayload } from "@/types/bookings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

export const customerKeys = {
  active: ["users", "active"] as const,
};

export function useCustomers() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery<CustomerUser[]>({
    queryKey: customerKeys.active,
    queryFn: async () => {
      const { data } = await api.get<{ customers: CustomerUser[] }>("/customers", {
        params: { status: "active", limit: 200, page: 1 },
      });
      return data.customers ?? [];
    },
    staleTime:            60_000,
    gcTime:               10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateCustomerPayload) => {
      // POST /api/customers returns { customer: CustomerUser, tempPassword: string }
      const { data } = await api.post<{ customer: CustomerUser; tempPassword: string }>(
        "/customers",
        payload,
      );
      return data.customer; // single object, not array
    },

    onSuccess: (newCustomer) => {
      // Prepend to active list cache so dropdown shows the new customer immediately
      queryClient.setQueryData<CustomerUser[]>(customerKeys.active, (old) => {
        if (!old) return [newCustomer];
        return [newCustomer, ...old];
      });
    },

    onError: (e: any) => {
      toast.error(e?.response?.data?.error ?? "Failed to create customer");
    },
  });

  const createCustomer = async (
    payload: CreateCustomerPayload,
  ): Promise<ApiResult<CustomerUser>> => {
    try {
      const customer = await createMutation.mutateAsync(payload);
      return { ok: true, data: customer };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.error ?? "Failed to create customer",
      };
    }
  };

  return {
    customers:  data ?? [],
    loading,
    error:      error ? String((error as any)?.message) : null,
    createCustomer,
    isCreating: createMutation.isPending,
  };
}

// ── Available Rooms for Admin booking modal ────────────────────────────────
export function useAvailableRoomsForAdmin(checkIn: string, checkOut: string) {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["available-rooms", checkIn, checkOut],
    queryFn:  async () => {
      const { data } = await api.get(
        `/bookings/available-rooms?checkIn=${checkIn}&checkOut=${checkOut}`,
      );
      return data.rooms ?? [];
    },
    enabled:              !!checkIn && !!checkOut && checkIn < checkOut,
    staleTime:            60_000,
    gcTime:               5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    rooms:   data ?? [],
    loading,
    error: error ? String((error as any)?.message) : null,
  };
}