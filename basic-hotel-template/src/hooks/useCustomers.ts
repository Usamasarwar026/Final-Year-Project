// src/hooks/useCustomers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { Customer, CreateCustomerPayload } from "@/types/bookings";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

export const customerKeys = {
  active: ["customers", "active"] as const,
};

// Only active customers — for booking dropdown
export function useCustomers() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery<Customer[]>({
    queryKey: customerKeys.active,
    queryFn: async () => {
      // status=active → backend returns only is_active=true customers, no pagination (limit=200)
      const { data } = await api.get<{ customers: Customer[] }>("/customers", {
        params: { status: "active", limit: 200, page: 1 },
      });
      return data.customers ?? [];
    },
    staleTime: 60_000,         // customer list doesn't change often
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateCustomerPayload) => {
      const { data } = await api.post<{ customer: Customer }>("/customers", payload);
      return data.customer;
    },
    onSuccess: (newCustomer) => {
      // Prepend to active list cache so dropdown shows immediately
      queryClient.setQueryData<Customer[]>(customerKeys.active, (old = []) => [
        newCustomer,
        ...old,
      ]);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error ?? "Failed to create customer");
    },
  });

  const createCustomer = async (payload: CreateCustomerPayload): Promise<ApiResult<Customer>> => {
    try {
      const customer = await createMutation.mutateAsync(payload);
      return { ok: true, data: customer };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to create customer" };
    }
  };

  return {
    customers: data ?? [],
    loading,
    error: error ? String((error as any)?.message) : null,
    createCustomer,
    isCreating: createMutation.isPending,
  };
}

// Available rooms for admin booking modal
export function useAvailableRoomsForAdmin(checkIn: string, checkOut: string) {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["available-rooms", checkIn, checkOut],
    queryFn: async () => {
      const { data } = await api.get(
        `/bookings/available-rooms?checkIn=${checkIn}&checkOut=${checkOut}`
      );
      return data.rooms ?? [];
    },
    enabled: !!checkIn && !!checkOut && checkIn < checkOut,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    rooms: data ?? [],
    loading,
    error: error ? String((error as any)?.message) : null,
  };
}