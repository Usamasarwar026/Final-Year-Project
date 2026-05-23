"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import * as Yup from "yup";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import heroImg from "../../../../public/assets/hero-hotel.jpg";

import { resetPassword } from "@/services/authService";

import { Button } from "@/components/button/Button";
import { Input } from "@/components/input/Input";
import { Label } from "@/components/label/Label";
import { Card } from "@/components/card/Card";
import { WebsiteName } from "@/constant/constant";

const resetSchema = Yup.object({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm password is required"),
});

export const ResetForm = () => {
  const router = useRouter();

  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPassword(token, password),

    onSuccess: (data) => {
      toast.success(data.message || "Password reset successful");

      router.push("/login");
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to reset password");
    },
  });

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await resetSchema.validate(
        {
          password,
          confirmPassword,
        },
        {
          abortEarly: false,
        },
      );

      if (!token) {
        toast.error("Invalid reset token");
        return;
      }

      mutation.mutate({
        token,
        password,
      });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        toast.error(error.errors[0]);
      }
    }
  };

  const loading = mutation.isPending;

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Side */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden md:block relative"
      >
        <Image
          src={heroImg}
          alt="Hotel"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-primary/60" />

        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="font-serif text-2xl text-gold">
            {WebsiteName}
          </Link>

          <div>
            <h2 className="font-serif text-4xl">Create new password</h2>

            <p className="mt-2 text-primary-foreground/80 max-w-sm">
              Your new password should be secure and easy to remember.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right Side */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center p-6 md:p-12 bg-background"
      >
        <Card className="w-full max-w-md p-8 border-0 shadow-elegant">
          <h1 className="font-serif text-3xl text-primary">New Password</h1>

          <p className="text-sm text-muted-foreground mt-1">
            Enter your new password below
          </p>

          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>

              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? "Updating..." : "Reset Password"}

              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Back to{" "}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};
