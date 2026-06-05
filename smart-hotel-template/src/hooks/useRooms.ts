// hooks/useRooms.ts
import { useState, useEffect, useCallback } from "react";
import type { Room } from "@/constant/constant";

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch rooms");
      setRooms(json.rooms);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ── CREATE ─────────────────────────────────────────────────
  const createRoom = async (
    data: Omit<Room, "room_id" | "created_at" | "updated_at">,
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error };
    await fetchRooms();
    return { ok: true };
  };

  // ── UPDATE ─────────────────────────────────────────────────
  const updateRoom = async (
    id: number,
    data: Partial<Room>,
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/rooms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error };
    await fetchRooms();
    return { ok: true };
  };

  // ── DELETE ─────────────────────────────────────────────────
  const deleteRoom = async (
    id: number,
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error };
    await fetchRooms();
    return { ok: true };
  };

  // ── UPLOAD PHOTO ───────────────────────────────────────────
  const uploadPhoto = async (
    file: File,
  ): Promise<{ ok: boolean; url?: string; error?: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/rooms/upload", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error };
    return { ok: true, url: json.url };
  };

  return {
    rooms,
    loading,
    error,
    refetch: fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    uploadPhoto,
  };
}
