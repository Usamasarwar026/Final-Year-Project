// hooks/useProfile.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  profileImage: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  designation: string | null;
  employeeId: string | null;
  isVerified: boolean;
  createdAt: string;
};

export type UpdateProfilePayload = Partial<
  Pick<UserProfile, "name" | "phoneNumber" | "address" | "city" | "country" | "profileImage">
>;

// ── Fetch profile ──
export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await axios.get("/api/profile");
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

// ── Update profile ──
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<UserProfile, Error, UpdateProfilePayload>({
    mutationFn: async (payload) => {
      const { data } = await axios.patch("/api/profile", payload);
      return data;
    },
    onSuccess: (updated) => {
      // Optimistic cache update
      qc.setQueryData<UserProfile>(["profile"], updated);
    },
  });
}

// ── Upload profile image ──
export function useUploadProfileImage() {
  const qc = useQueryClient();
  return useMutation<{ url: string }, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post("/api/profile/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: ({ url }) => {
      // Update profile cache with new image URL
      qc.setQueryData<UserProfile>(["profile"], (old) =>
        old ? { ...old, profileImage: url } : old
      );
    },
  });
}