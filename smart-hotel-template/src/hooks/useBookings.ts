// src/hooks/useBookings.ts
import { useState, useEffect, useCallback } from "react";
import type {
  Booking,
  CreateBookingPayload,
  BookingStatus,
} from "@/types/bookings";
import api from "@/lib/axios";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ bookings: Booking[] }>("/bookings");
      setBookings(data.bookings);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createBooking = async (
    payload: CreateBookingPayload,
  ): Promise<ApiResult<Booking>> => {
    try {
      const { data } = await api.post<{ booking: Booking }>(
        "/bookings",
        payload,
      );
      setBookings((prev) => [data.booking, ...prev]);
      return { ok: true, data: data.booking };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.error ?? "Failed to create booking",
      };
    }
  };

  const updateStatus = async (
    id: number,
    status: BookingStatus,
  ): Promise<ApiResult<Booking>> => {
    try {
      const { data } = await api.patch<{ booking: Booking }>(
        `/bookings/${id}`,
        { status },
      );
      setBookings((prev) =>
        prev.map((b) => (b.booking_id === id ? data.booking : b)),
      );
      return { ok: true, data: data.booking };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.error ?? "Failed to update booking",
      };
    }
  };

  const cancelBooking = async (id: number): Promise<ApiResult<Booking>> => {
    return updateStatus(id, "Cancelled");
  };

  const deleteBooking = async (id: number): Promise<ApiResult<void>> => {
    try {
      await api.delete(`/bookings/${id}`);
      setBookings((prev) => prev.filter((b) => b.booking_id !== id));
      return { ok: true };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.error ?? "Failed to delete booking",
      };
    }
  };

  return {
    bookings,
    loading,
    error,
    refresh: fetch,
    createBooking,
    updateStatus,
    cancelBooking,
    deleteBooking,
  };
}

// Hook for fetching available rooms for given dates
export function useAvailableRooms(checkIn: string, checkOut: string) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      setRooms([]);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(`/bookings/available-rooms?checkIn=${checkIn}&checkOut=${checkOut}`)
      .then(({ data }) => setRooms(data.rooms))
      .catch((e) =>
        setError(e?.response?.data?.error ?? "Failed to fetch rooms"),
      )
      .finally(() => setLoading(false));
  }, [checkIn, checkOut]);

  return { rooms, loading, error };
}
