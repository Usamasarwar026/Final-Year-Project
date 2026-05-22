"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { verifyEmail } from "../services/authService";

export default function useVerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      return await verifyEmail(token);
    },
  });

  useEffect(() => {
    if (!token) return;
    verifyMutation.mutate(token, {
      onSuccess: (data) => {
        setTimeout(() => {
          router.push("/login");
        }, 4000);
      },
    });
  }, [token]);

  const handleRedirect = () => {
    router.push("/login");
  };

  return {
    loading: verifyMutation.isPending,
    success: verifyMutation.isSuccess,
    message:
      verifyMutation.data?.message || verifyMutation.error?.message || "",
    handleRedirect,
  };
}
