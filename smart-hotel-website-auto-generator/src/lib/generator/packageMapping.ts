// src/lib/generator/packageMapping.ts
import { ModuleId } from "./moduleFiles";

/**
 * Module-specific packages — added when module is selected.
 * Base packages ko dobara mat daalo yahan (woh BASE_PACKAGES mein hain).
 */
export const MODULE_PACKAGES: Partial<Record<ModuleId, string[]>> = {
  authentication: [
    "nodemailer",       // password reset email
  ],
  rooms: [
    "cloudinary",       // image uploads
  ],
  booking: [
    "jspdf",
    "jspdf-autotable",
    "xlsx",
  ],
  billing: [
    "jspdf",
    "jspdf-autotable",
  ],
  reports: [
    "recharts",
    "xlsx",
    "jspdf",
    "jspdf-autotable",
  ],
  customer: [],
  housekeeping: [],
  inventory: [],
  staff: [],
  kitchen: ["recharts",],
};

/**
 * Base packages — always included regardless of modules.
 * These are the core of every generated project.
 */
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
  "radix-ui",
  "recharts",
  "cloudinary",
];

/**
 * Dev dependencies — always included.
 */
export const DEV_PACKAGES = [
  "prisma",
  "typescript",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "@types/bcryptjs",
  "@types/nodemailer",
  "@types/recharts",
  "tailwindcss",
  "@tailwindcss/postcss",
  "autoprefixer",
  "postcss",
  "eslint",
  "eslint-config-next",
  "tsx",
];