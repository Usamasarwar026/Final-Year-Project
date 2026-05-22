"use client";

import { useState } from "react";
import * as Yup from "yup";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { forgetPassword } from "@/services/authService";

const forgetSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
});

export default function useForgetForm() {
  const [email, setEmail] = useState("");

  const forgetMutation = useMutation({
    mutationFn: forgetPassword,
    onSuccess: (data) => {
      toast.success(data.message || "Reset link sent successfully");
      setEmail("");
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "something went wrong");
    },
  });

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await forgetSchema.validate({ email }, { abortEarly: false });

      forgetMutation.mutate(email);
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        toast.error(error.errors.join(", "));
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  return {
    email,
    setEmail,
    handleUpdatePassword,
    loading: forgetMutation.isPending,
  };
}
