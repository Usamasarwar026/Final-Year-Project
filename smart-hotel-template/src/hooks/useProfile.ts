// src/hooks/useProfile.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profileService";
import { UserProfile, UpdateProfilePayload } from "@/types/profile.type";
import { toast } from "sonner";

export const PROFILE_KEY = ["profile"] as const;

// ── Fetch ──
export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: PROFILE_KEY,
    queryFn: profileService.getProfile,
    staleTime: 1000 * 60 * 3, // 3 min cache
  });
}

// ── Update fields ──
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<UserProfile, Error, UpdateProfilePayload>({
    mutationFn: profileService.updateProfile,
    // Optimistic update — UI turant update ho jata hai response ka wait kiye bina
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: PROFILE_KEY });
      const prev = qc.getQueryData<UserProfile>(PROFILE_KEY);
      qc.setQueryData<UserProfile>(PROFILE_KEY, (old) =>
        old ? { ...old, ...payload } : old,
      );
      return { prev };
    },

    onSuccess: () => {
      toast.success("Profile updated successfully");
    },

    onError: (_err, _vars, ctx: any) => {
      // Rollback on error
      if (ctx?.prev) qc.setQueryData(PROFILE_KEY, ctx.prev);
      toast.error("Failed to update profile");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}

// ── Upload image ──
export function useUploadProfileImage() {
  const qc = useQueryClient();
  return useMutation<{ url: string }, Error, File>({
    mutationFn: profileService.uploadImage,
    onSuccess: ({ url }) => {
      // Sirf image field update karo
      qc.setQueryData<UserProfile>(PROFILE_KEY, (old) =>
        old ? { ...old, profileImage: url } : old,
      );
      toast.success("Profile image updated successfully");
    },
    onError: () => {
      toast.error("Failed to upload image");
    },
  });
}
