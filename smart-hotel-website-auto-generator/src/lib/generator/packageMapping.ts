// src/lib/generator/packageMapping.ts
import { ModuleId } from "./moduleFiles";

// Module-specific packages
export const MODULE_PACKAGES: Partial<Record<ModuleId, string[]>> = {
  authentication: [
    "next-auth",
    "bcryptjs",
    "radix-ui",
    "yup",
    "sonner",
    "nodemailer",
    "lucide-react",
    "class-variance-authority",
  ],
  rooms: ["cloudinary"],
  booking: ["jspdf", "jspdf-autotable", "xlsx"],
  billing: ["jspdf", "jspdf-autotable"],
  reports: ["recharts", "xlsx"],
  customer: ["clsx"],
  housekeeping: [],
  inventory: [],
  staff: [],
  kitchen: [],
};
//
// Base packages jo hamesha chahiye
export const BASE_PACKAGES = [
  "next",
  "react",
  "react-dom",
  "next-auth",
  "@prisma/adapter-neon",
  "@prisma/client",
  "@tanstack/react-query",
  "axios",
  "bcryptjs",
  "clsx",
  "lucide-react",
  "sonner",
  "framer-motion",
  "class-variance-authority",
  "tailwind-merge",
  "tw-animate-css",
  "yup",
  "xlsx",

];

// Dev dependencies
export const DEV_PACKAGES = [
  "prisma",
  "typescript",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "@types/bcryptjs",
  "tailwindcss",
  "autoprefixer",
  "postcss",
  "eslint",
  "eslint-config-next",
];
