"use client";

import { useState } from "react";
import { Button } from "../../components/button/Button";
import { Input } from "../../components/input/Input";
import { Label } from "../../components/label/Label";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";

import { toast } from "sonner";

import {
  Hotel,
  BedDouble,
  CalendarCheck,
  Utensils,
  Image,
  Phone,
  Star,
  Users,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Download,
  Check,
  LogOut,
  Database,
  Globe,
  Key,
} from "lucide-react";

import ThemeToggle from "../../components/themeToggle/ThemeToggle";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: any;
  required?: boolean;
}

const MODULES: Module[] = [
  {
    id: "rooms",
    name: "Rooms & Suites",
    description: "Room listings with details, images, and pricing",
    icon: BedDouble,
    required: true,
  },
  {
    id: "booking",
    name: "Booking System",
    description: "Online room reservation with date picker",
    icon: CalendarCheck,
  },
  {
    id: "restaurant",
    name: "Restaurant & Dining",
    description: "Menu display and table reservations",
    icon: Utensils,
  },
  {
    id: "gallery",
    name: "Photo Gallery",
    description: "Image gallery showcasing the hotel",
    icon: Image,
  },
  {
    id: "contact",
    name: "Contact & Location",
    description: "Contact form, map, and hotel details",
    icon: Phone,
  },
  {
    id: "reviews",
    name: "Guest Reviews",
    description: "Testimonials and rating system",
    icon: Star,
  },
  {
    id: "staff",
    name: "Staff Management",
    description: "Admin panel for staff and roles",
    icon: Users,
  },
  {
    id: "billing",
    name: "Billing & Invoices",
    description: "Payment tracking and invoice generation",
    icon: CreditCard,
  },
];

const Dashboard = () => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [step, setStep] = useState<
    "modules" | "config" | "generating" | "done"
  >("modules");
  const [selectedModules, setSelectedModules] = useState<string[]>(["rooms"]);
  const [websiteName, setWebsiteName] = useState("");
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [progress, setProgress] = useState(0);
  const toggleModule = (id: string) => {
    const mod = MODULES.find((m) => m.id === id);
    if (mod?.required) return;
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };
  const handleGenerate = async () => {
    if (!websiteName.trim()) {
      toast.error("Please enter a website name");
      return;
    }
    setStep("generating");
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      // Fake generation delay
      await new Promise((resolve) => setTimeout(resolve, 3000));
      clearInterval(interval);
      setProgress(100);
      setStep("done");
      toast.success("Website generated successfully!");
    } catch (err: any) {
      clearInterval(interval);
      toast.error("Generation failed");
      setStep("config");
    }
  };

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Hotel className="w-5 h-5 text-primary-foreground" />
          </div>

          <span className="text-lg font-display font-bold text-foreground">
            HotelGen
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Welcome {user?.name}
          </span>

          <ThemeToggle />

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="border-border text-foreground hover:bg-secondary"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Sign Out
          </Button>


          {/* here inject the profile icon */}
          
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {["Select Modules", "Configure", "Generate"].map((label, i) => {
            const stepIndex = [
              "modules",
              "config",
              "generating",
              "done",
            ].indexOf(step);

            const isActive = i <= stepIndex;

            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-gradient-brand text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i < stepIndex || step === "done" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>

                <span
                  className={`text-sm font-medium hidden sm:block ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>

                {i < 2 && (
                  <div
                    className={`w-12 h-0.5 ${
                      isActive ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Modules */}
        {step === "modules" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Select Modules
            </h2>

            <p className="text-muted-foreground mb-6">
              Choose the features you want in your hotel website
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {MODULES.map((mod) => {
                const isSelected = selectedModules.includes(mod.id);

                return (
                  <motion.button
                    key={mod.id}
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={() => toggleModule(mod.id)}
                    className={`relative text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    {mod.required && (
                      <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Required
                      </span>
                    )}

                    <mod.icon
                      className={`w-6 h-6 mb-3 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />

                    <h3 className="font-display font-semibold text-foreground text-sm mb-1">
                      {mod.name}
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      {mod.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep("config")}
                className="bg-gradient-brand hover:opacity-90 text-primary-foreground font-semibold"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Config */}
        {step === "config" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-lg mx-auto"
          >
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Configure Website
            </h2>

            <div className="glass rounded-xl p-6 space-y-5 mt-6">
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Website Name
                </Label>

                <Input
                  placeholder="e.g. Grand Palace Hotel..."
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Database URL
                </Label>

                <Input
                  placeholder="enter the postgresql connection link"
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  Secret Key
                </Label>

                <Input
                  type="password"
                  placeholder="your-secret-key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep("modules")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={handleGenerate}
                className="bg-gradient-brand hover:opacity-90 text-primary-foreground font-semibold"
              >
                Generate
                <Download className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Generating */}
        {step === "generating" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              Generating Website...
            </h2>

            <div className="max-w-xs mx-auto bg-secondary rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-brand rounded-full"
                animate={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(progress)}%
            </p>
          </motion.div>
        )}

        {/* Done */}
        {step === "done" && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-accent" />
            </div>

            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
              Website Generated!
            </h2>

            <p className="text-muted-foreground mb-6">
              Your hotel website{" "}
              <strong className="text-foreground">{websiteName}</strong> has
              been generated.
            </p>

            <Button
              onClick={() => {
                setStep("modules");

                setProgress(0);

                setWebsiteName("");
              }}
              className="bg-gradient-brand hover:opacity-90 text-primary-foreground font-semibold"
            >
              Generate Another
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
