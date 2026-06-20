// src/hooks/useProfile.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profileService";
import { UserProfile, UpdateProfilePayload } from "@/types/profile.type";
import { toast } from "sonner";

export const PROFILE_KEY = ["profile"] as const;

// ── Fetch ─────────────────────────────────────────────────────────────────────
export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: PROFILE_KEY,
    queryFn:  profileService.getProfile,
  });
}

// ── Update fields ─────────────────────────────────────────────────────────────
export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfilePayload, { prev: UserProfile | undefined }>({
    mutationFn: profileService.updateProfile,

    // Optimistic update — UI turant reflect kare
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

    onError: (_err, _vars, ctx) => {
      // Rollback — optimistic update undo karo
      if (ctx?.prev) qc.setQueryData(PROFILE_KEY, ctx.prev);
      toast.error("Failed to update profile — please try again");
    },

    // Success ya error dono ke baad server se fresh data lo
    onSettled: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}

// ── Upload image ──────────────────────────────────────────────────────────────
export function useUploadProfileImage() {
  const qc = useQueryClient();

  return useMutation<{ url: string }, Error, File>({
    mutationFn: profileService.uploadImage,

    onSuccess: ({ url }) => {
      // Full refetch nahi — sirf image field patch karo cache mein
      qc.setQueryData<UserProfile>(PROFILE_KEY, (old) =>
        old ? { ...old, profileImage: url } : old,
      );
      toast.success("Profile photo updated");
    },

    onError: () => {
      toast.error("Image upload failed — please try again");
    },
  });
}