// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/axios";

export interface Notification {
  notification_id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  module: string;
  reference_id: string | null;
  recipient_user_id: string;
  sender_user_id: string | null;
  role_target: string | null;
  is_read: boolean;
  created_at: string;
}

interface UseNotificationsOptions {
  /** Auto-poll interval in ms (default: 30000 = 30s) */
  pollInterval?: number;
  /** Number of items per page (default: 20) */
  pageSize?: number;
  /** Only fetch unread notifications */
  unreadOnly?: boolean;
}

export function useNotifications(opts: UseNotificationsOptions = {}) {
  const { pollInterval = 30000, pageSize = 20, unreadOnly = false } = opts;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(
    async (skip = 0) => {
      try {
        const params = new URLSearchParams();
        params.set("skip", String(skip));
        params.set("take", String(pageSize));
        if (unreadOnly) params.set("unreadOnly", "true");

        const { data } = await api.get<{
          notifications: Notification[];
          total: number;
          unreadCount: number;
        }>(`/notifications?${params.toString()}`);

        if (skip === 0) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }
        setUnreadCount(data.unreadCount);
        setTotal(data.total);
        setError(null);
      } catch (e: any) {
        setError(
          e?.response?.data?.error ?? "Failed to fetch notifications"
        );
      } finally {
        setLoading(false);
      }
    },
    [pageSize, unreadOnly]
  );

  // Initial fetch + polling
  useEffect(() => {
    setLoading(true);
    fetchNotifications(0);

    if (pollInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchNotifications(0);
      }, pollInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications, pollInterval]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await api.patch(`/notifications/${notificationId}`);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId
              ? { ...n, is_read: true }
              : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e: any) {
        console.error("Failed to mark notification as read", e);
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put("/notifications");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (e: any) {
      console.error("Failed to mark all notifications as read", e);
    }
  }, []);

  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        await api.delete(`/notifications/${notificationId}`);
        setNotifications((prev) =>
          prev.filter((n) => n.notification_id !== notificationId)
        );
        setTotal((t) => Math.max(0, t - 1));
      } catch (e: any) {
        console.error("Failed to delete notification", e);
      }
    },
    []
  );

  const loadMore = useCallback(() => {
    if (notifications.length < total) {
      fetchNotifications(notifications.length);
    }
  }, [notifications.length, total, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    refresh: () => fetchNotifications(0),
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    hasMore: notifications.length < total,
  };
}
