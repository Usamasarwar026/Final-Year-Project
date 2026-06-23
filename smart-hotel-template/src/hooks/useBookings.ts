// src/hooks/useBookings.ts
import type { Booking, BookingStatus, CreateBookingPayload } from "@/types/bookings";
import api from "@/lib/axios";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export interface BookingFilters {
  page?:   number;
  limit?:  number;
  search?: string;
  status?: BookingStatus | "All";
}

interface BookingListResponse {
  bookings: Booking[];
  pagination: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

export const bookingKeys = {
  all:  ["bookings"] as const,
  list: (filters: BookingFilters) => ["bookings", "list", filters] as const,
};

function isPaginatedList(val: unknown): val is BookingListResponse {
  return (
    typeof val === "object" &&
    val !== null &&
    "bookings" in val &&
    Array.isArray((val as any).bookings) &&
    "pagination" in val
  );
}

export function useBookings(filters: BookingFilters = {}) {
  const { page = 1, limit = 10, search = "", status = "All" } = filters;
  const queryClient = useQueryClient();

  const { data, isLoading: loading, isFetching, error: queryError, refetch } =
    useQuery<BookingListResponse>({
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
      gcTime:    5 * 60_000,
      refetchOnWindowFocus: false,
    });

  // ── Update Status Mutation — with optimistic update ───────────────────
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: BookingStatus }) => {
      const { data } = await api.patch<{ booking: Booking }>(`/bookings/${id}`, { status });
      return data.booking;
    },

    onMutate: async ({ id, status }) => {
      // Cancel in-flight refetches
      await queryClient.cancelQueries({ queryKey: ["bookings", "list"] });

      // Snapshot all list caches for rollback
      const previousCaches = queryClient.getQueriesData<BookingListResponse>({
        queryKey: ["bookings", "list"],
      });

      // Optimistically update every cached page immediately
      queryClient.setQueriesData<BookingListResponse>(
        { queryKey: ["bookings", "list"], exact: false },
        (old) => {
          if (!isPaginatedList(old)) return old;
          return {
            ...old,
            bookings: old.bookings.map((b) =>
              b.booking_id === id ? { ...b, status } : b,
            ),
          };
        },
      );

      return { previousCaches };
    },

    onSuccess: (updated) => {
      // Replace optimistic data with confirmed server data
      queryClient.setQueriesData<BookingListResponse>(
        { queryKey: ["bookings", "list"], exact: false },
        (old) => {
          if (!isPaginatedList(old)) return old;
          return {
            ...old,
            bookings: old.bookings.map((b) =>
              b.booking_id === updated.booking_id ? { ...b, ...updated } : b,
            ),
          };
        },
      );
      // Mark stale — background refetch on next navigation
      queryClient.invalidateQueries({
        queryKey: ["bookings", "list"],
        refetchType: "none",
      });
    },

    onError: (_err, _vars, context) => {
      // Rollback to snapshots
      if (context?.previousCaches) {
        for (const [queryKey, data] of context.previousCaches) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
  });

  // ── Delete Mutation ───────────────────────────────────────────────────
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/bookings/${id}`);
      return id;
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["bookings", "list"] });

      const previousCaches = queryClient.getQueriesData<BookingListResponse>({
        queryKey: ["bookings", "list"],
      });

      queryClient.setQueriesData<BookingListResponse>(
        { queryKey: ["bookings", "list"], exact: false },
        (old) => {
          if (!isPaginatedList(old)) return old;
          return {
            ...old,
            bookings: old.bookings.filter((b) => b.booking_id !== id),
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1),
            },
          };
        },
      );

      return { previousCaches };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookings", "list"],
        refetchType: "none",
      });
    },

    onError: (_err, _vars, context) => {
      if (context?.previousCaches) {
        for (const [queryKey, data] of context.previousCaches) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
  });

  // ── Public API ────────────────────────────────────────────────────────
  const updateStatus = async (
    id: number,
    status: BookingStatus,
  ): Promise<ApiResult<Booking>> => {
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

  const createBooking = async (
    payload: CreateBookingPayload,
  ): Promise<ApiResult<Booking>> => {
    try {
      const { data } = await api.post<{ booking: Booking }>("/bookings", payload);
      // Invalidate so list refetches with new booking
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      return { ok: true, data: data.booking };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error ?? "Failed to create booking" };
    }
  };

  return {
    bookings:   data?.bookings   ?? [],
    pagination: data?.pagination ?? null,
    loading,
    isFetching,
    error: queryError ? String((queryError as any)?.message) : null,
    refresh: refetch,
    createBooking,
    updateStatus,
    cancelBooking: (id: number) => updateStatus(id, "Cancelled"),
    deleteBooking,
    // Per-row loading states
    updatingId:     updateStatusMutation.isPending ? updateStatusMutation.variables?.id     : null,
    updatingStatus: updateStatusMutation.isPending ? updateStatusMutation.variables?.status : null,
    isDeleting:     deleteBookingMutation.isPending,
    deletingId:     deleteBookingMutation.isPending ? deleteBookingMutation.variables : null,
  };
}

// ── Available Rooms Hook ───────────────────────────────────────────────────
export function useAvailableRooms(checkIn: string, checkOut: string) {
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
    refetchOnWindowFocus: false,
  });

  return {
    rooms: data ?? [],
    loading,
    error: error ? String((error as any)?.message) : null,
  };
}