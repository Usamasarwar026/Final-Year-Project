"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/services/authService";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
const registerSchema = Yup.object({
  name: Yup.string()
    .min(3, "Name must be at least 3 characters")
    .required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm password is required"),
});

export default function useRegister() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast.success(data.message || "Registration successful");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Registration failed");
    },
  });
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerSchema.validate(
        {
          name,
          email,
          password,
          confirmPassword,
        },
        { abortEarly: false },
      );

      mutation.mutate({
        name,
        email,
        password,
      });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        toast.error(error.errors[0]);
      }
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    handleRegister,
    loading: mutation.isPending,
  };
}
