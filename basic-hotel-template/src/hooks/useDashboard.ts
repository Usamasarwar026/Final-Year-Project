// src/hooks/useDashboard.ts
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

// ── Types ─────────────────────────────────────────────────────
export interface DashboardData {
  rooms: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    reserved: number;
    occupancyRate: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    checkedIn: number;
    checkedOut: number;
    cancelled: number;
    activeGuests: number;
  };
  financial: {
    totalRevenue: number;
    outstandingPayments: number;
  };
  todayActivity: {
    checkIns: number;
    checkOuts: number;
    dirtyRooms: number;
  };
  customers: {
    total: number;
    active: number;
    inactive: number;
  };
  recentBookings: Array<{
    booking_id: number;
    guestName: string;
    roomNumber: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    totalNights: number;
    totalAmount: number;
    status: string;
    source: string;
  }>;
  recentNotifications: Array<{
    notification_id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    is_read: boolean;
    created_at: string;
  }>;
  unreadNotifications: number;
  charts: {
    occupancyChart: Array<{ name: string; value: number; color: string }>;
    roomTypeChart: Array<{ name: string; value: number }>;
    revenueTrend: Array<{ date: string; revenue: number }>;
  };
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
  data: () => ["dashboard", "data"] as const,
};

export function useDashboard() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,        // true only on very first load (no cache yet)
    isFetching,       // true on background refresh too
    error,
    dataUpdatedAt,
  } = useQuery<DashboardData>({
    queryKey: dashboardKeys.data(),
    queryFn: async () => {
      const { data } = await api.get<DashboardData>("/admin/dashboard");
      return data;
    },

    // ── Caching strategy ──────────────────────────────────────
    // Data stays "fresh" for 2 minutes — no refetch during this window
    staleTime: 2 * 60_000,

    // Keep cache for 10 minutes even if component unmounts
    // so navigating away and back is instant
    gcTime: 10 * 60_000,

    // Don't refetch when user switches browser tabs
    refetchOnWindowFocus: false,

    // Don't refetch when internet reconnects (dashboard is not real-time)
    refetchOnReconnect: false,

    // Retry once on failure, not 3 times (default)
    retry: 1,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.data() });
  };

  return {
    data: data ?? null,
    // isLoading = true only when there is zero cached data (first ever visit)
    // After that, stale cache is shown immediately while background refresh runs
    isLoading,
    isFetching,
    error: error ? String((error as any)?.message ?? "Failed to load dashboard") : null,
    dataUpdatedAt,
    refresh,
  };
}