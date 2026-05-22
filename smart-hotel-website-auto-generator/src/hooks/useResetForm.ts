"use client";

import { useState } from "react";

import * as Yup from "yup";

import { toast } from "sonner";

import { useMutation } from "@tanstack/react-query";

import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/services/authService";

const resetSchema = Yup.object({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function useResetForm() {
  const [password, setPassword] = useState("");

  const router = useRouter();

  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const resetMutation = useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) => {
      return await resetPassword(token, password);
    },

    onSuccess: (data) => {
      toast.success(data.message || "Password reset successful");

      setPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Something went wrong",
      );
    },
  });

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await resetSchema.validate({ password }, { abortEarly: false });

      if (!token) {
        toast.error("Invalid or missing reset token");
        return;
      }

      resetMutation.mutate({
        token,
        password,
      });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        toast.error(error.errors.join(", "));
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  return {
    password,
    setPassword,
    handleResetPassword,
    loading: resetMutation.isPending,
  };
}
