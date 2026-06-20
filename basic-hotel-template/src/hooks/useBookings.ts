// src/hooks/useBookings.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { Booking, BookingStatus, CreateBookingPayload } from "@/types/bookings";

export interface BookingFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: BookingStatus | "All";
}

interface BookingListResponse {
  bookings: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (filters: BookingFilters) => ["bookings", "list", filters] as const,
};

export function useBookings(filters: BookingFilters = {}) {
  const { page = 1, limit = 10, search = "", status = "All" } = filters;
  const queryClient = useQueryClient();

  const { data, isLoading: loading, isFetching, error: queryError, refetch } = useQuery<BookingListResponse>({
    queryKey: bookingKeys.list({ page, limit, search, status }),
    queryFn: async () => {
      const { data } = await api.get<BookingListResponse>("/bookings", {
        params: {
          page,
          limit,
          ...(search.trim() ? { q: search.trim() } : {}),
          ...(status !== "All" ? { status } : {}),
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Update status mutation — per-booking loading via `variables`
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: BookingStatus }) => {
      const { data } = await api.patch<{ booking: Booking }>(`/bookings/${id}`, { status });
      return data.booking;
    },
    onSuccess: (updated) => {
      queryClient.setQueriesData<BookingListResponse>(
        { queryKey: bookingKeys.all, exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            bookings: old.bookings.map((b) =>
              b.booking_id === updated.booking_id ? { ...b, ...updated } : b
            ),
          };
        }
      );
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error ?? "Failed to update booking");
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/bookings/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueriesData<BookingListResponse>(
        { queryKey: bookingKeys.all, exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            bookings: old.bookings.filter((b) => b.booking_id !== deletedId),
            pagination: { ...old.pagination, total: old.pagination.total - 1 },
          };
        }
      );
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error ?? "Failed to delete booking");
    },
  });

  const updateStatus = async (id: number, status: BookingStatus): Promise<ApiResult<Booking>> => {
    try {
      const booking = await updateStatusMutation.mutateAsync({ id, status });
      return { ok: true, data: booking };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to update" };
    }
  };

  const deleteBooking = async (id: number): Promise<ApiResult<void>> => {
    try {
      await deleteBookingMutation.mutateAsync(id);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to delete" };
    }
  };

  const createBooking = async (payload: CreateBookingPayload): Promise<ApiResult<Booking>> => {
    try {
      const { data } = await api.post<{ booking: Booking }>("/bookings", payload);
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      return { ok: true, data: data.booking };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to create booking" };
    }
  };

  // Expose which booking+action is currently loading
  const updatingId = updateStatusMutation.isPending
    ? updateStatusMutation.variables?.id
    : null;
  const updatingStatus = updateStatusMutation.isPending
    ? updateStatusMutation.variables?.status
    : null;

  return {
    bookings: data?.bookings ?? [],
    pagination: data?.pagination ?? null,
    loading,
    isFetching,
    error: queryError ? String((queryError as any)?.message) : null,
    refresh: refetch,
    createBooking,
    updateStatus,
    cancelBooking: (id: number) => updateStatus(id, "Cancelled"),
    deleteBooking,
    // granular loading state
    updatingId,
    updatingStatus,
    isDeleting: deleteBookingMutation.isPending,
    deletingId: deleteBookingMutation.isPending ? deleteBookingMutation.variables : null,
  };
}

// Hook for available rooms
export function useAvailableRooms(checkIn: string, checkOut: string) {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["available-rooms", checkIn, checkOut],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/available-rooms?checkIn=${checkIn}&checkOut=${checkOut}`);
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