"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Hotel } from "lucide-react";
import ThemeToggle from "../themeToggle/ThemeToggle";
import { Button } from "../button/Button";
import { Input } from "../input/Input";
import { Label } from "../label/Label";
import useRegister from "../../hooks/useRegisterForm";

export default function RegisterForm() {
  const {
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
    loading,
  } = useRegister();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className="w-full max-w-md"
      >
        {/* Logo */}

        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Hotel className="w-5 h-5 text-primary-foreground" />
          </div>

          <span className="text-xl font-display font-bold text-foreground">
            HotelGen
          </span>
        </Link>

        {/* Card */}

        <div className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-display font-bold text-foreground text-center mb-2">
            Create your account
          </h1>

          <p className="text-muted-foreground text-center mb-6 text-sm">
            Start generating hotel websites in minutes
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name */}

            <div className="space-y-2">
              <Label>Name</Label>

              <Input
                type="text"
                placeholder="Enter Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Email */}

            <div className="space-y-2">
              <Label>Email</Label>

              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Password */}

            <div className="space-y-2">
              <Label>Password</Label>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
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

            <div className="space-y-2">
              <Label>Confirm Password</Label>

              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Button */}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground font-semibold"
            >
              {loading ? "Please wait..." : "Create Account"}

              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
