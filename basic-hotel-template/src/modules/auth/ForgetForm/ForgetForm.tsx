"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import * as Yup from "yup";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { forgetPassword } from "@/services/authService";
import { Button } from "@/components/button/Button";
import { Input } from "@/components/input/Input";
import { Label } from "@/components/label/Label";
import { Card } from "@/components/card/Card";
import { IMAGES, WebsiteName } from "@/constant/constant";

const forgetSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
});

export const ForgetForm = () => {
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: forgetPassword,

    onSuccess: (data) => {
      toast.success(data.message || "Reset link sent successfully");

      setEmail("");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to send reset link",
      );
    },
  });

  const handleForgetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await forgetSchema.validate({ email }, { abortEarly: false });

      mutation.mutate(email);
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
          src={IMAGES.heroImage}
          alt="Hotel"
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-primary/60" />

        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="font-serif text-2xl text-gold">
            {WebsiteName}
          </Link>

          <div>
            <h2 className="font-serif text-4xl">Forgot your password?</h2>

            <p className="mt-2 text-primary-foreground/80 max-w-sm">
              Enter your email address and we will send you a secure reset link.
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
          <h1 className="font-serif text-3xl text-primary">Forget Password</h1>

          <p className="text-sm text-muted-foreground mt-1">
            Enter your email to receive a password reset link
          </p>

          <form onSubmit={handleForgetPassword} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>

              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? "Sending..." : "Send Reset Link"}

              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};
