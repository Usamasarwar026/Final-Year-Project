"use client";

import { Input } from "../input/Input";

import useResetForm from "@/hooks/useResetForm";

import { motion } from "framer-motion";

import { Hotel, Lock, ArrowRight } from "lucide-react";

import ThemeToggle from "../themeToggle/ThemeToggle";

export default function ResetForm() {
  const { password, setPassword, handleResetPassword, loading } =
    useResetForm();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Hotel className="w-5 h-5 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">HotelGen</h1>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center text-foreground mb-2">
            Reset Password
          </h2>

          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter your new password
          </p>

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                New Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-xl bg-gradient-brand text-white font-semibold transition flex items-center justify-center gap-2 ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
              }`}
            >
              {loading ? "Resetting..." : "Reset Password"}

              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
