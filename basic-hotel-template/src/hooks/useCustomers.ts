// src/hooks/useCustomers.ts
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import type { Customer, CreateCustomerPayload } from "@/types/bookings";

type ApiResult<T = void> = { ok: boolean; data?: T; error?: string };

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ customers: Customer[] }>("/customers");
      console.log("data", data);
      setCustomers(data.customers);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createCustomer = async (
    payload: CreateCustomerPayload,
  ): Promise<ApiResult<Customer>> => {
    try {
      const { data } = await api.post<{ customer: Customer }>(
        "/customers",
        payload,
      );
      // Append to local state so dropdown updates immediately
      setCustomers((prev) => [data.customer, ...prev]);
      return { ok: true, data: data.customer };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.error ?? "Failed to create customer",
      };
    }
  };

  return { customers, loading, error, refresh: fetch, createCustomer };
}

// Hook: available rooms for a date range
export function useAvailableRoomsForAdmin(checkIn: string, checkOut: string) {
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
      .then(({ data }) => setRooms(data.rooms ?? []))
      .catch((e) =>
        setError(e?.response?.data?.error ?? "Failed to fetch rooms"),
      )
      .finally(() => setLoading(false));
  }, [checkIn, checkOut]);

  return { rooms, loading, error };
}
