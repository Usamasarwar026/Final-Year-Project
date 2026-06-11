"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SearchX, ArrowLeft } from "lucide-react";

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_40%)]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div className="bg-card/90 border border-border shadow-elegant rounded-3xl p-10 text-center backdrop-blur-sm">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center size-20 rounded-full bg-primary/10 border border-gold/20">
            <SearchX className="size-10 text-gold" />
          </div>

          {/* Heading */}
          <h1 className="mt-6 font-serif text-5xl text-primary">
            Page Not Found
          </h1>

          {/* Description */}
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-md mx-auto">
            The page you are looking for doesn’t exist or may have been moved.
            Please check the URL or return to the homepage.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-medium text-primary transition hover:bg-gold/90"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              Sign In
            </Link>
          </div>

          {/* Error Code */}
          <div className="mt-10 text-xs tracking-[0.35em] uppercase text-muted-foreground/70">
            Error 404
          </div>
        </div>
      </motion.div>
    </div>
  );
}