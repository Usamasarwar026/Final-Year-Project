// src/services/profile.service.ts
import api from "@/lib/axios";
import { UserProfile, UpdateProfilePayload } from "@/types/profile.type";

const BASE = "/profile";

export const profileService = {
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>(BASE);
    return data;
  },

  updateProfile: async (
    payload: UpdateProfilePayload,
  ): Promise<UserProfile> => {
    const { data } = await api.patch<UserProfile>(BASE, payload);
    return data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<{ url: string }>(
      `${BASE}/upload-image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },
};
