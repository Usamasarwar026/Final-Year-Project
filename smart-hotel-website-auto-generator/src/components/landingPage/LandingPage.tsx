"use client";

import { Button } from "../../components/button/Button";
import { motion } from "framer-motion";
import { Hotel, ArrowRight, LogIn } from "lucide-react";
import ThemeToggle from "../../components/themeToggle/ThemeToggle";
import useLandingPage from "@/hooks/useLandingPage";

const LandingPage = () => {
  const { router, user, features } = useLandingPage();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Hotel className="w-5 h-5 text-primary-foreground" />
          </div>

          <span className="text-lg font-display font-bold text-foreground">
            HotelGen
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Button
            onClick={() => router.push(user ? "/dashboard" : "/login")}
            variant="outline"
            className="border-border text-foreground hover:bg-secondary"
          >
            {user ? "Dashboard" : "Sign In"}

            <LogIn className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
          }}
        >
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-sm font-medium text-primary">
              Smart Hotel Website Auto-Generator
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
            Build Your Hotel Website{" "}
            <span className="text-gradient">In Minutes</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Select prebuilt modules, customize your credentials, and generate a
            complete hotel website with frontend and backend — ready to deploy.
          </p>

          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push(user ? "/dashboard" : "/register")}
              className="bg-gradient-brand hover:opacity-90 text-primary-foreground font-semibold px-8"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.2 + i * 0.1,
                duration: 0.5,
              }}
              className="glass rounded-xl p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>

              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>

              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Smart Hotel Website Auto-Generator — Final Year Project GCUF
      </footer>
    </div>
  );
};

export default LandingPage;
