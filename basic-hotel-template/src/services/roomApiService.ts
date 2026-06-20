// services/roomApiService.ts
import type { Room } from "@/constant/constant";
import api from "@/lib/axios";

export interface RoomsResponse {
  rooms: Room[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RoomFilters {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const roomApiService = {
  // Get all rooms with pagination and filters
  getRooms: async (filters: RoomFilters = {}): Promise<RoomsResponse> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "All") {
        params.append(key, String(value));
      }
    });

    const response = await api.get(`/rooms?${params.toString()}`);
    return response.data;
  },

  // Get single room
  getRoom: async (id: number): Promise<{ room: Room }> => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  // Create room
  createRoom: async (
    data: Omit<Room, "room_id" | "created_at" | "updated_at">,
  ): Promise<{ room: Room }> => {
    const response = await api.post("/rooms", data);
    return response.data;
  },

  // Update room
  updateRoom: async (
    id: number,
    data: Partial<Room>,
  ): Promise<{ room: Room }> => {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data;
  },

  // Delete room
  deleteRoom: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },

  // Upload photo
  uploadPhoto: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/rooms/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
