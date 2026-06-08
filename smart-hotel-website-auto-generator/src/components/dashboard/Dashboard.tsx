// // src/app/dashboard/page.tsx  OR  wherever your Dashboard component lives
// // GENERATOR project — updated dashboard with generate flow

// "use client";

// import { useState } from "react";
// import { signOut, useSession } from "next-auth/react";
// import { motion, AnimatePresence } from "framer-motion";
// import { toast } from "sonner";
// import axios from "axios";
// import {
//   Hotel, BedDouble, CalendarCheck, Utensils, Users, CreditCard,
//   ArrowRight, ArrowLeft, Download, Check, LogOut, Globe,
//   ShieldCheck, ClipboardList, Package, UserCog, BarChart3,
//   Loader2, FolderOpen, Clock, CheckCircle2, XCircle,
// } from "lucide-react";
// import api from "@/lib/axios";

// // ─── Types ───────────────────────────────────────────────────
// type ModuleId =
//   | "authentication" | "rooms" | "booking" | "customer"
//   | "billing" | "housekeeping" | "inventory"
//   | "staff" | "kitchen" | "reports";

// type StepId = "modules" | "config" | "generating" | "done";

// interface Module {
//   id: ModuleId;
//   name: string;
//   description: string;
//   icon: React.ElementType;
//   required?: boolean;
// }

// type Project = {
//   id: string;
//   name: string;
//   modules: string[];
//   status: "PENDING" | "GENERATING" | "DONE" | "FAILED";
//   createdAt: string;
// };

// // ─── Module definitions ───────────────────────────────────────
// const MODULES: Module[] = [
//   { id: "authentication", name: "Authentication & Authorization",
//     description: "Login, registration, roles, permissions, profile management",
//     icon: ShieldCheck, required: true },
//   { id: "rooms",    name: "Room Management",
//     description: "Rooms, categories, pricing, availability, amenities",
//     icon: BedDouble},
//   { id: "booking",  name: "Booking & Reservation",
//     description: "Reservations, check-in/check-out management",
//     icon: CalendarCheck},
//   { id: "customer", name: "Customer Management",
//     description: "Guest profiles, history, preferences",
//     icon: Users },
//   { id: "billing",  name: "Billing & Invoices",
//     description: "Invoices, payments, billing records",
//     icon: CreditCard },
//   { id: "housekeeping", name: "Housekeeping",
//     description: "Cleaning schedules, service requests",
//     icon: ClipboardList },
//   { id: "inventory", name: "Inventory & Stock",
//     description: "Supplies, stock levels, purchases",
//     icon: Package },
//   { id: "staff",   name: "Staff Management",
//     description: "Employees, departments, attendance",
//     icon: UserCog },
//   { id: "kitchen", name: "Food & Kitchen",
//     description: "Menu, food orders, dining services",
//     icon: Utensils },
//   { id: "reports", name: "Reports & Analytics",
//     description: "Insights, occupancy, revenue analytics",
//     icon: BarChart3 },
// ];

// const STATUS_STYLES = {
//   DONE:       "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
//   GENERATING: "text-blue-600  bg-blue-100  dark:bg-blue-900/30  dark:text-blue-400",
//   PENDING:    "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
//   FAILED:     "text-red-600   bg-red-100   dark:bg-red-900/30   dark:text-red-400",
// };

// const STATUS_ICONS = {
//   DONE:       CheckCircle2,
//   GENERATING: Loader2,
//   PENDING:    Clock,
//   FAILED:     XCircle,
// };

// // ─── Step indicator ───────────────────────────────────────────
// function StepBar({ step }: { step: StepId }) {
//   const steps = ["modules", "config", "generating", "done"] as StepId[];
//   const labels = ["Select Modules", "Configure", "Generate"];
//   const idx = steps.indexOf(step);

//   return (
//     <div className="flex items-center justify-center gap-2 mb-10">
//       {labels.map((label, i) => {
//         const active = i <= idx;
//         const done   = i < idx || step === "done";
//         return (
//           <div key={label} className="flex items-center gap-2">
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center
//                             text-sm font-semibold transition-all duration-300
//                             ${active
//                               ? "bg-primary text-primary-foreground"
//                               : "bg-secondary text-muted-foreground"}`}>
//               {done ? <Check className="w-4 h-4" /> : i + 1}
//             </div>
//             <span className={`text-sm font-medium hidden sm:block
//                               ${active ? "text-foreground" : "text-muted-foreground"}`}>
//               {label}
//             </span>
//             {i < 2 && (
//               <div className={`w-12 h-0.5 transition-colors duration-300
//                               ${active ? "bg-primary" : "bg-border"}`} />
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ─── Past projects list ────────────────────────────────────────
// function PastProjects({ projects }: { projects: Project[] }) {
//   if (projects.length === 0) return null;
//   return (
//     <div className="mt-10 border-t border-border pt-8">
//       <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
//         <FolderOpen className="w-4 h-4 text-muted-foreground" />
//         Previously Generated
//       </h3>
//       <div className="space-y-2">
//         {projects.map((p) => {
//           const StatusIcon = STATUS_ICONS[p.status];
//           return (
//             <div key={p.id}
//               className="flex items-center gap-3 p-3 rounded-xl
//                          bg-muted/50 border border-border">
//               <StatusIcon
//                 className={`w-4 h-4 shrink-0
//                             ${p.status === "GENERATING" ? "animate-spin" : ""}
//                             ${p.status === "DONE" ? "text-green-600" : ""}
//                             ${p.status === "FAILED" ? "text-red-500" : ""}
//                             ${p.status === "PENDING" ? "text-amber-500" : ""}`}
//               />
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
//                 <p className="text-xs text-muted-foreground">
//                   {p.modules.length} modules ·{" "}
//                   {new Date(p.createdAt).toLocaleDateString()}
//                 </p>
//               </div>
//               <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
//                                ${STATUS_STYLES[p.status]}`}>
//                 {p.status}
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ─── Main Dashboard ───────────────────────────────────────────
// export default function Dashboard() {
//   const { data: session } = useSession();
//   const user = session?.user;

//   const [step,            setStep]            = useState<StepId>("modules");
//   const [selectedModules, setSelectedModules] = useState<ModuleId[]>(
//     ["authentication"]
//   );
//   const [websiteName,     setWebsiteName]     = useState("");
//   const [progress,        setProgress]        = useState(0);
//   const [projects,        setProjects]        = useState<Project[]>([]);

//   const toggleModule = (id: ModuleId) => {
//     const mod = MODULES.find((m) => m.id === id);
//     if (mod?.required) return;
//     setSelectedModules((prev) =>
//       prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
//     );
//   };

//   const handleGenerate = async () => {
//     if (!websiteName.trim()) {
//       toast.error("Please enter a website name");
//       return;
//     }

//     setStep("generating");
//     setProgress(0);

//     // Progress animation
//     const timer = setInterval(() => {
//       setProgress((p) => {
//         if (p >= 85) { clearInterval(timer); return 85; }
//         return p + Math.random() * 12;
//       });
//     }, 300);

//     try {
//       // Call API — returns ZIP binary
//       const res = await api.post(
//         "/generate",
//         { websiteName: websiteName.trim(), modules: selectedModules },
//         { responseType: "blob" }
//       );

//       clearInterval(timer);
//       setProgress(100);

//       // Trigger browser download
//       const slug = websiteName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
//       const url  = URL.createObjectURL(new Blob([res.data], { type: "application/zip" }));
//       const a    = document.createElement("a");
//       a.href     = url;
//       a.download = `${slug}.zip`;
//       a.click();
//       URL.revokeObjectURL(url);

//       // Refresh projects list
//       const { data } = await api.get("/projects");
//       setProjects(data);

//       setStep("done");
//       toast.success("Website generated and downloading!");
//     } catch (err: any) {
//       clearInterval(timer);
//       toast.error(err?.response?.data?.error ?? "Generation failed");
//       setStep("config");
//     }
//   };

//   const reset = () => {
//     setStep("modules");
//     setProgress(0);
//     setWebsiteName("");
//     setSelectedModules(["authentication"]);
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
//         <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
//           <div className="flex items-center gap-2.5">
//             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
//               <Hotel className="w-4 h-4 text-primary-foreground" />
//             </div>
//             <span className="font-semibold text-foreground">HotelGen</span>
//           </div>

//           <div className="flex items-center gap-3">
//             <span className="text-sm text-muted-foreground hidden sm:block">
//               {user?.name ?? user?.email}
//             </span>
//             <button
//               onClick={() => signOut({ callbackUrl: "/" })}
//               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
//                          border border-border text-foreground
//                          hover:bg-secondary transition-colors"
//             >
//               <LogOut className="w-3.5 h-3.5" />
//               Sign Out
//             </button>
//           </div>
//         </div>
//       </header>

//       <main className="max-w-5xl mx-auto px-6 py-10">
//         <StepBar step={step} />

//         <AnimatePresence mode="wait">
//           {/* ── Step 1: Modules ── */}
//           {step === "modules" && (
//             <motion.div key="modules"
//               initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
//               <h2 className="text-2xl font-bold text-foreground mb-1">Select Modules</h2>
//               <p className="text-muted-foreground text-sm mb-6">
//                 Choose which features to include in your hotel website.
//                 Required modules are always included.
//               </p>

//               <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
//                 {MODULES.map((mod) => {
//                   const selected = selectedModules.includes(mod.id);
//                   return (
//                     <motion.button key={mod.id}
//                       whileHover={{ scale: mod.required ? 1 : 1.02 }}
//                       whileTap={{ scale: mod.required ? 1 : 0.98 }}
//                       onClick={() => toggleModule(mod.id)}
//                       className={`relative text-left p-4 rounded-xl border transition-all
//                                   ${selected
//                                     ? "border-accent bg-accent/5"
//                                     : "border-border bg-card hover:border-muted-foreground/40"}
//                                   ${mod.required ? "cursor-default" : "cursor-pointer"}`}
//                     >
//                       {mod.required && (
//                         <span className="absolute top-2 right-2 text-[9px] font-bold
//                                          px-1.5 py-0.5 rounded-full
//                                          bg-primary/10 text-primary uppercase tracking-wide">
//                           Required
//                         </span>
//                       )}
//                       <mod.icon className={`w-5 h-5 mb-3
//                                             ${selected ? "text-accent" : "text-muted-foreground"}`} />
//                       <h3 className="font-semibold text-foreground text-sm mb-1 leading-tight">
//                         {mod.name}
//                       </h3>
//                       <p className="text-xs text-muted-foreground leading-relaxed">
//                         {mod.description}
//                       </p>
//                       {selected && !mod.required && (
//                         <div className="absolute top-2 left-2 w-4 h-4 rounded-full
//                                         bg-accent flex items-center justify-center">
//                           <Check className="w-2.5 h-2.5 text-white" />
//                         </div>
//                       )}
//                     </motion.button>
//                   );
//                 })}
//               </div>

//               <div className="flex items-center justify-between">
//                 <p className="text-sm text-muted-foreground">
//                   {selectedModules.length} module{selectedModules.length !== 1 ? "s" : ""} selected
//                 </p>
//                 <button
//                   onClick={() => setStep("config")}
//                   className="flex items-center gap-2 px-5 py-2.5 rounded-xl
//                              bg-primary text-primary-foreground text-sm font-semibold
//                              hover:opacity-90 transition-opacity"
//                 >
//                   Continue <ArrowRight className="w-4 h-4" />
//                 </button>
//               </div>

//               <PastProjects projects={projects} />
//             </motion.div>
//           )}

//           {/* ── Step 2: Config ── */}
//           {step === "config" && (
//             <motion.div key="config"
//               initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
//               className="max-w-md mx-auto">
//               <h2 className="text-2xl font-bold text-foreground mb-1">Configure</h2>
//               <p className="text-muted-foreground text-sm mb-6">
//                 Name your website. You'll get a <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.template</code> file
//                 with all required environment variables to fill in.
//               </p>

//               {/* Selected modules summary */}
//               <div className="mb-5 p-4 rounded-xl bg-muted/50 border border-border">
//                 <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
//                   Selected Modules
//                 </p>
//                 <div className="flex flex-wrap gap-1.5">
//                   {selectedModules.map((id) => {
//                     const mod = MODULES.find((m) => m.id === id);
//                     return (
//                       <span key={id}
//                         className="inline-flex items-center gap-1 px-2.5 py-1
//                                    rounded-full text-xs font-medium
//                                    bg-primary/10 text-primary">
//                         {mod && <mod.icon className="w-3 h-3" />}
//                         {mod?.name.split(" ")[0]}
//                       </span>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Website name */}
//               <div className="mb-6 space-y-1.5">
//                 <label className="text-sm font-medium text-foreground flex items-center gap-2">
//                   <Globe className="w-4 h-4 text-muted-foreground" />
//                   Website / Hotel Name
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. Grand Palace Hotel"
//                   value={websiteName}
//                   onChange={(e) => setWebsiteName(e.target.value)}
//                   onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
//                   className="w-full px-3.5 py-2.5 rounded-xl text-sm
//                              bg-muted border border-border text-foreground
//                              placeholder:text-muted-foreground
//                              outline-none focus:border-accent focus:ring-2 focus:ring-accent/15
//                              transition-all duration-150"
//                 />
//                 <p className="text-xs text-muted-foreground">
//                   This will be used as the project folder name and in the app.
//                 </p>
//               </div>

//               {/* What's included note */}
//               <div className="mb-6 p-4 rounded-xl border border-border bg-background space-y-1.5">
//                 <p className="text-xs font-semibold text-foreground">What you'll get:</p>
//                 <ul className="text-xs text-muted-foreground space-y-1">
//                   <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />Complete Next.js 15 project</li>
//                   <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />Prisma schema for selected modules</li>
//                   <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />.env.template with all required vars</li>
//                   <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />Sidebar + Topbar already configured</li>
//                   <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />Role-based auth (Admin/Staff/Customer)</li>
//                 </ul>
//               </div>

//               <div className="flex justify-between">
//                 <button onClick={() => setStep("modules")}
//                   className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
//                              border border-border text-foreground
//                              hover:bg-muted transition-colors">
//                   <ArrowLeft className="w-4 h-4" /> Back
//                 </button>
//                 <button onClick={handleGenerate}
//                   disabled={!websiteName.trim()}
//                   className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm
//                              font-semibold bg-primary text-primary-foreground
//                              hover:opacity-90 transition-opacity
//                              disabled:opacity-50 disabled:cursor-not-allowed">
//                   Generate <Download className="w-4 h-4" />
//                 </button>
//               </div>
//             </motion.div>
//           )}

//           {/* ── Step 3: Generating ── */}
//           {step === "generating" && (
//             <motion.div key="generating"
//               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//               className="text-center py-20">
//               <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
//                               justify-center mx-auto mb-6">
//                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
//               </div>
//               <h2 className="text-2xl font-bold text-foreground mb-2">
//                 Building Your Project...
//               </h2>
//               <p className="text-muted-foreground text-sm mb-8">
//                 Assembling files, configuring modules, zipping everything up
//               </p>
//               <div className="max-w-xs mx-auto">
//                 <div className="bg-secondary rounded-full h-2 overflow-hidden mb-2">
//                   <motion.div
//                     className="h-full bg-primary rounded-full"
//                     animate={{ width: `${progress}%` }}
//                     transition={{ duration: 0.3 }}
//                   />
//                 </div>
//                 <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
//               </div>
//             </motion.div>
//           )}

//           {/* ── Step 4: Done ── */}
//           {step === "done" && (
//             <motion.div key="done"
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ opacity: 1, scale: 1 }}
//               className="text-center py-16 max-w-md mx-auto">
//               <motion.div
//                 initial={{ scale: 0 }} animate={{ scale: 1 }}
//                 transition={{ type: "spring", delay: 0.1 }}
//                 className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30
//                            flex items-center justify-center mx-auto mb-6">
//                 <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
//               </motion.div>

//               <h2 className="text-2xl font-bold text-foreground mb-2">
//                 Project Generated!
//               </h2>
//               <p className="text-muted-foreground text-sm mb-2">
//                 <strong className="text-foreground">{websiteName}</strong> has been
//                 downloaded to your computer.
//               </p>
//               <p className="text-muted-foreground text-xs mb-8">
//                 Extract the ZIP, fill in <code className="bg-muted px-1 py-0.5 rounded">.env.template</code>,
//                 rename it to <code className="bg-muted px-1 py-0.5 rounded">.env.local</code>,
//                 then run <code className="bg-muted px-1 py-0.5 rounded">npm install</code>.
//               </p>

//               {/* Quick start steps */}
//               <div className="text-left bg-muted/50 border border-border rounded-xl
//                               p-4 mb-6 space-y-2">
//                 <p className="text-xs font-semibold text-foreground mb-3">Quick Start</p>
//                 {[
//                   "Extract the ZIP file",
//                   "Copy .env.template → .env.local",
//                   "Fill in DATABASE_URL and NEXTAUTH_SECRET",
//                   "npm install",
//                   "npx prisma migrate dev --name init",
//                   "npm run dev",
//                 ].map((step, i) => (
//                   <div key={i} className="flex items-center gap-2.5 text-xs text-muted-foreground">
//                     <span className="w-5 h-5 rounded-full bg-primary/10 text-primary
//                                      flex items-center justify-center font-semibold shrink-0 text-[10px]">
//                       {i + 1}
//                     </span>
//                     {step}
//                   </div>
//                 ))}
//               </div>

//               <button onClick={reset}
//                 className="flex items-center gap-2 px-5 py-2.5 rounded-xl mx-auto
//                            bg-primary text-primary-foreground text-sm font-semibold
//                            hover:opacity-90 transition-opacity">
//                 Generate Another <ArrowRight className="w-4 h-4" />
//               </button>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </main>
//     </div>
//   );
// }







"use client";

import { useState, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Hotel, BedDouble, CalendarCheck, Utensils, Users, CreditCard,
  ArrowRight, ArrowLeft, Download, Check, LogOut, Globe,
  ShieldCheck, ClipboardList, Package, UserCog, BarChart3,
  Loader2, FolderOpen, Clock, CheckCircle2, XCircle, Link2, AlertCircle,
} from "lucide-react";
import api from "@/lib/axios";
import {
  MODULE_DEPENDENCIES,
  resolveDependencies,
  getRequiredBy,
} from "@/lib/generator/moduleDependencies";

// ─── Types ───────────────────────────────────────────────────
type ModuleId =
  | "authentication" | "rooms" | "booking" | "customer"
  | "billing" | "housekeeping" | "inventory"
  | "staff" | "kitchen" | "reports";

type StepId = "modules" | "config" | "generating" | "done";

interface Module {
  id: ModuleId;
  name: string;
  description: string;
  icon: React.ElementType;
  required?: boolean;
}

type Project = {
  id: string;
  name: string;
  modules: string[];
  status: "PENDING" | "GENERATING" | "DONE" | "FAILED";
  createdAt: string;
};

// ─── Module definitions ───────────────────────────────────────
const MODULES: Module[] = [
  { id: "authentication", name: "Authentication",
    description: "Login, signup, roles, password reset, profile",
    icon: ShieldCheck, required: true },
  { id: "rooms", name: "Room Management",
    description: "Rooms, categories, pricing, availability",
    icon: BedDouble },
  { id: "booking", name: "Booking & Reservation",
    description: "Reservations, check-in/check-out — requires Rooms + Customer",
    icon: CalendarCheck },
  { id: "customer", name: "Customer Management",
    description: "Guest profiles, history, preferences",
    icon: Users },
  { id: "billing", name: "Billing & Invoices",
    description: "Invoices, payments — requires Booking",
    icon: CreditCard },
  { id: "housekeeping", name: "Housekeeping",
    description: "Cleaning tasks, laundry, service requests — requires Rooms",
    icon: ClipboardList },
  { id: "inventory", name: "Inventory & Stock",
    description: "Supplies, purchase orders, stock alerts",
    icon: Package },
  { id: "staff", name: "Staff Management",
    description: "Employees, departments, attendance, shifts",
    icon: UserCog },
  { id: "kitchen", name: "Food & Kitchen",
    description: "Menu, orders, delivery management",
    icon: Utensils },
  { id: "reports", name: "Reports & Analytics",
    description: "Revenue, occupancy, KPI dashboards",
    icon: BarChart3 },
];

const STATUS_STYLES = {
  DONE:       "text-green-600 bg-green-100",
  GENERATING: "text-blue-600  bg-blue-100",
  PENDING:    "text-amber-600 bg-amber-100",
  FAILED:     "text-red-600   bg-red-100",
};

const STATUS_ICONS = {
  DONE: CheckCircle2,
  GENERATING: Loader2,
  PENDING: Clock,
  FAILED: XCircle,
};

// Dependency display labels
const DEP_LABELS: Partial<Record<ModuleId, string>> = {
  booking: "Rooms + Customer",
  billing: "Booking",
  housekeeping: "Rooms",
  reports: "Booking",
};

// ─── Step indicator ───────────────────────────────────────────
function StepBar({ step }: { step: StepId }) {
  const steps = ["modules", "config", "generating", "done"] as StepId[];
  const labels = ["Select Modules", "Configure", "Generate"];
  const idx = steps.indexOf(step);

  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {labels.map((label, i) => {
        const active = i <= idx;
        const done = i < idx || step === "done";
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center
                            text-sm font-semibold transition-all duration-300
                            ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block
                              ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < 2 && (
              <div className={`w-12 h-0.5 transition-colors duration-300
                              ${active ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PastProjects({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;
  return (
    <div className="mt-10 border-t border-border pt-8">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-muted-foreground" />
        Previously Generated
      </h3>
      <div className="space-y-2">
        {projects.map((p) => {
          const StatusIcon = STATUS_ICONS[p.status];
          return (
            <div key={p.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              <StatusIcon
                className={`w-4 h-4 shrink-0
                  ${p.status === "GENERATING" ? "animate-spin" : ""}
                  ${p.status === "DONE" ? "text-green-600" : ""}
                  ${p.status === "FAILED" ? "text-red-500" : ""}
                  ${p.status === "PENDING" ? "text-amber-500" : ""}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.modules.length} modules · {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]}`}>
                {p.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const { data: session } = useSession();
  const user = session?.user;

  const [step, setStep] = useState<StepId>("modules");
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>(["authentication"]);
  const [websiteName, setWebsiteName] = useState("");
  const [progress, setProgress] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  // Track which modules were auto-added (to show tooltip)
  // const [autoAdded, setAutoAdded] = useState<Set<ModuleId>>(new Set());

  // Resolved = selected + their dependencies
  const resolvedModules = useMemo(
    () => resolveDependencies(selectedModules),
    [selectedModules],
  );
  const resolvedSet = new Set<ModuleId>(resolvedModules);
  const autoAddedModules = resolvedModules.filter((m) => !selectedModules.includes(m));

  const toggleModule = (id: ModuleId) => {
    const mod = MODULES.find((m) => m.id === id);
    if (mod?.required) return; // authentication = always on

    // Check if this module is required by another selected module
    const requiredBy = getRequiredBy(id, selectedModules);
    if (requiredBy.length > 0) {
      toast.error(
        `Cannot deselect — required by: ${requiredBy.join(", ")}`,
        { description: `First deselect ${requiredBy.join(", ")} to remove this module.` }
      );
      return;
    }

    setSelectedModules((prev) => {
      if (prev.includes(id)) {
        // Removing: also remove any modules that ONLY exist because of this one
        return prev.filter((m) => m !== id);
      } else {
        // Adding: show which deps will be auto-added
        const deps = (MODULE_DEPENDENCIES[id] ?? []).filter((d) => !prev.includes(d));
        if (deps.length > 0) {
          toast.info(
            `Auto-including: ${deps.join(", ")}`,
            { description: `${id} requires these modules` }
          );
        }
        return [...prev, id];
      }
    });
  };

  const handleGenerate = async () => {
    if (!websiteName.trim()) {
      toast.error("Please enter a website name");
      return;
    }

    setStep("generating");
    setProgress(0);

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) { clearInterval(timer); return 85; }
        return p + Math.random() * 12;
      });
    }, 300);

    try {
      // Send user-selected modules — server will resolve deps
      const res = await api.post(
        "/generate",
        { websiteName: websiteName.trim(), modules: selectedModules },
        { responseType: "blob" }
      );

      clearInterval(timer);
      setProgress(100);

      const slug = websiteName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      const { data } = await api.get("/projects");
      setProjects(data);
      setStep("done");
      toast.success("Project generated and downloading!");
    } catch (err: any) {
      clearInterval(timer);
      toast.error(err?.response?.data?.error ?? "Generation failed");
      setStep("config");
    }
  };

  const reset = () => {
    setStep("modules");
    setProgress(0);
    setWebsiteName("");
    setSelectedModules(["authentication"]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Hotel className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">HotelGen</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.name ?? user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                         border border-border text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <StepBar step={step} />

        <AnimatePresence mode="wait">
          {/* ── Step 1: Modules ── */}
          {step === "modules" && (
            <motion.div key="modules"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <h2 className="text-2xl font-bold text-foreground mb-1">Select Modules</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Choose features for your hotel website. Some modules automatically include dependencies.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {MODULES.map((mod) => {
                  const isSelected = selectedModules.includes(mod.id);
                  const isAutoAdded = autoAddedModules.includes(mod.id);
                  const isResolved = resolvedSet.has(mod.id);
                  const depLabel = DEP_LABELS[mod.id];
                  const requiredBy = getRequiredBy(mod.id, selectedModules);
                  const isLocked = mod.required || requiredBy.length > 0;

                  return (
                    <motion.button key={mod.id}
                      whileHover={{ scale: isLocked ? 1 : 1.02 }}
                      whileTap={{ scale: isLocked ? 1 : 0.98 }}
                      onClick={() => toggleModule(mod.id)}
                      className={`relative text-left p-4 rounded-xl border transition-all
                        ${isAutoAdded
                          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600"
                          : isSelected
                            ? "border-accent bg-accent/5"
                            : "border-border bg-card hover:border-muted-foreground/40"}
                        ${isLocked ? "cursor-default" : "cursor-pointer"}`}
                    >
                      {/* Badges */}
                      {mod.required && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold
                                         px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                          Required
                        </span>
                      )}
                      {isAutoAdded && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold
                                         px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700
                                         dark:bg-blue-900/40 dark:text-blue-300 uppercase tracking-wide
                                         flex items-center gap-0.5">
                          <Link2 className="w-2.5 h-2.5" />
                          Auto
                        </span>
                      )}
                      {requiredBy.length > 0 && !mod.required && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold
                                         px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                          Locked
                        </span>
                      )}

                      <mod.icon className={`w-5 h-5 mb-3
                        ${isAutoAdded ? "text-blue-500" : isSelected ? "text-accent" : "text-muted-foreground"}`}
                      />
                      <h3 className="font-semibold text-foreground text-sm mb-1 leading-tight">
                        {mod.name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {mod.description}
                      </p>

                      {/* Dependency note */}
                      {depLabel && !isSelected && !isAutoAdded && (
                        <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Needs: {depLabel}
                        </p>
                      )}

                      {/* Check mark */}
                      {(isSelected || isAutoAdded) && !mod.required && (
                        <div className={`absolute top-2 left-2 w-4 h-4 rounded-full flex items-center justify-center
                          ${isAutoAdded ? "bg-blue-500" : "bg-accent"}`}>
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Auto-included notice */}
              {autoAddedModules.length > 0 && (
                <div className="mb-6 flex items-start gap-2 p-3 rounded-xl
                                bg-blue-50 border border-blue-200
                                dark:bg-blue-900/20 dark:border-blue-700">
                  <Link2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Auto-included:</strong>{" "}
                    {autoAddedModules.join(", ")} — required by your selected modules.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {resolvedModules.length} module{resolvedModules.length !== 1 ? "s" : ""} total
                  {autoAddedModules.length > 0
                    ? ` (${selectedModules.length} selected + ${autoAddedModules.length} auto)`
                    : ""}
                </p>
                <button
                  onClick={() => setStep("config")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                             bg-primary text-primary-foreground text-sm font-semibold
                             hover:opacity-90 transition-opacity"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <PastProjects projects={projects} />
            </motion.div>
          )}

          {/* ── Step 2: Config ── */}
          {step === "config" && (
            <motion.div key="config"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
              className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-1">Configure</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Name your project. A complete Next.js 15 project will be generated.
              </p>

              {/* Module summary */}
              <div className="mb-5 p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Modules ({resolvedModules.length} total)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {resolvedModules.map((id) => {
                    const mod = MODULES.find((m) => m.id === id);
                    const isAuto = autoAddedModules.includes(id);
                    return (
                      <span key={id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1
                                   rounded-full text-xs font-medium
                                   ${isAuto
                                     ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                     : "bg-primary/10 text-primary"}`}
                      >
                        {mod && <mod.icon className="w-3 h-3" />}
                        {mod?.name.split(" ")[0]}
                        {isAuto && <Link2 className="w-2.5 h-2.5 opacity-60" />}
                      </span>
                    );
                  })}
                </div>
                {autoAddedModules.length > 0 && (
                  <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    Blue = auto-included dependencies
                  </p>
                )}
              </div>

              {/* Website name */}
              <div className="mb-6 space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  Website / Hotel Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grand Palace Hotel"
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm
                             bg-muted border border-border text-foreground
                             placeholder:text-muted-foreground
                             outline-none focus:border-accent focus:ring-2 focus:ring-accent/15
                             transition-all duration-150"
                />
                <p className="text-xs text-muted-foreground">
                  Used as project folder name and in the app config.
                </p>
              </div>

              {/* What's included */}
              <div className="mb-6 p-4 rounded-xl border border-border bg-background space-y-1.5">
                <p className="text-xs font-semibold text-foreground">What you'll get:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />Complete Next.js 15 + TypeScript project</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />Prisma schema — only selected module models</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />.env template with all required variables</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />Role-based nav (Admin/Staff/Customer) pre-configured</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />Only role-specific pages (no dead code)</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep("modules")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                             border border-border text-foreground hover:bg-muted transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleGenerate}
                  disabled={!websiteName.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm
                             font-semibold bg-primary text-primary-foreground
                             hover:opacity-90 transition-opacity
                             disabled:opacity-50 disabled:cursor-not-allowed">
                  Generate <Download className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Generating ── */}
          {step === "generating" && (
            <motion.div key="generating"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
                              justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Building Your Project...
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                Assembling files, building schema, configuring {resolvedModules.length} modules
              </p>
              <div className="max-w-xs mx-auto">
                <div className="bg-secondary rounded-full h-2 overflow-hidden mb-2">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Done ── */}
          {step === "done" && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30
                           flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                Project Generated!
              </h2>
              <p className="text-muted-foreground text-sm mb-2">
                <strong className="text-foreground">{websiteName}</strong> has been
                downloaded to your computer.
              </p>

              <div className="text-left bg-muted/50 border border-border rounded-xl
                              p-4 mb-6 space-y-2">
                <p className="text-xs font-semibold text-foreground mb-3">Quick Start</p>
                {[
                  "Extract the ZIP file",
                  "Copy .env → .env.local",
                  "Fill in DATABASE_URL and NEXTAUTH_SECRET",
                  "npm install",
                  "npx prisma generate",
                  "npx prisma migrate dev --name init",
                  "npm run dev",
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary
                                     flex items-center justify-center font-semibold shrink-0 text-[10px]">
                      {i + 1}
                    </span>
                    {s}
                  </div>
                ))}
              </div>

              <button onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl mx-auto
                           bg-primary text-primary-foreground text-sm font-semibold
                           hover:opacity-90 transition-opacity">
                Generate Another <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}