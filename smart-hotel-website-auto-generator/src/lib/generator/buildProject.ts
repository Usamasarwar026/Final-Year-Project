// src/lib/generator/buildProject.ts
// Reads files DIRECTLY from hotel-template project (sibling folder)

import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import {
  BASE_FILES,
  MODULE_FILES,
  MODULE_PRISMA_MODELS,
  type ModuleId,
} from "./moduleFiles";
import { BASE_PACKAGES, MODULE_PACKAGES, DEV_PACKAGES } from "./packageMapping";
import { processTemplate, buildVars } from "./templateEngine";

// ─── Path Configuration ───────────────────────────────────────
const GENERATOR_ROOT = process.cwd();
const TEMPLATE_ROOT = path.join(GENERATOR_ROOT, "..", "smart-hotel-template");

// Cache for template package.json
let templatePackageJson: any = null;

function getTemplatePackageJson() {
  if (templatePackageJson) return templatePackageJson;

  const packageJsonPath = path.join(TEMPLATE_ROOT, "package.json");
  try {
    const content = fs.readFileSync(packageJsonPath, "utf-8");
    templatePackageJson = JSON.parse(content);
    return templatePackageJson;
  } catch (error) {
    console.error("Failed to read template package.json:", error);
    return null;
  }
}

function verifyTemplateRoot() {
  if (!fs.existsSync(TEMPLATE_ROOT)) {
    throw new Error(
      `hotel-template folder not found at: ${TEMPLATE_ROOT}\n` +
        `Expected structure:\n` +
        `  root/\n` +
        `    smart-hotel-website-auto-generator/\n` +
        `    smart-hotel-template/\n`,
    );
  }
}

type BuildInput = {
  websiteName: string;
  modules: ModuleId[];
};

export async function buildProjectZip({
  websiteName,
  modules,
}: BuildInput): Promise<Buffer> {
  verifyTemplateRoot();

  const zip = new JSZip();
  const vars = buildVars(websiteName);
  const slug = vars.WEBSITE_SLUG;

  const root = zip.folder(slug)!;
  const copiedFiles = new Set<string>();

  // ── 1. BASE files (always included) ──────────────────────────
  console.log("[generator] Copying base files...");
  for (const filePath of BASE_FILES) {
    const content = readFromTemplate(filePath);
    if (content === null) {
      console.warn(`[generator] MISSING base file: ${filePath}`);
      continue;
    }
    root.file(filePath, processTemplate(content, vars));
    copiedFiles.add(filePath);
  }

  // ── 2. MODULE files ───────────────────────────────────────────
  for (const moduleId of modules) {
    console.log(`[generator] Copying module: ${moduleId}`);
    const files = MODULE_FILES[moduleId] ?? [];

    for (const filePath of files) {
      if (copiedFiles.has(filePath)) continue;

      const content = readFromTemplate(filePath);
      if (content === null) {
        console.warn(
          `[generator] MISSING module file (${moduleId}): ${filePath}`,
        );
        continue;
      }
      root.file(filePath, processTemplate(content, vars));
      copiedFiles.add(filePath);
    }
  }

  // ── 3. Prisma schema — base + module models merged ───────────
  const baseSchema = readFromTemplate("prisma/schema.prisma") ?? "";
  const extraModels = modules
    .map((m) => MODULE_PRISMA_MODELS[m] ?? "")
    .filter(Boolean)
    .join("\n\n");
  root.file(
    "prisma/schema.prisma",
    processTemplate(baseSchema + "\n\n" + extraModels, vars),
  );

  // ── 4. .env — generated dynamically ─────────────────────────
  root.file(".env", buildEnvTemplate(websiteName, modules));

  // ── 5. package.json — dynamically from template ──────────────
  root.file("package.json", buildPackageJson(slug, modules));

  // ── 6. README ─────────────────────────────────────────────────
  root.file("README.md", buildReadme(websiteName, slug, modules));

  // ── 7. nav.config.ts — generated dynamically ─────────────────
  root.file("src/components/sidebar/nav.config.ts", buildNavConfig(modules));

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  console.log(
    `[generator] Done. Files: ${copiedFiles.size}, ZIP size: ${(buffer.length / 1024).toFixed(1)}KB`,
  );

  return buffer;
}

function readFromTemplate(filePath: string): string | null {
  const fullPath = path.join(TEMPLATE_ROOT, filePath);
  try {
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    return null;
  }
}

function buildEnvTemplate(websiteName: string, modules: ModuleId[]): string {
  const needsCloudinary =
    modules.includes("authentication") || modules.includes("rooms");

  // ✅ FIXED: Selected modules add karo for reference
  return `# ================================================
# ${websiteName} — Environment Variables
# ================================================

# ── Selected Modules ────────────────────────────────
# SELECTED_MODULES="${modules.join(",")}"

# ── Database ─────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"

# ── NextAuth ─────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
# Generate secret: openssl rand -base64 32

${
  needsCloudinary
    ? `
# ── Cloudinary (Image Uploads) ───────────────────
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
`
    : ""
}

# ── App ──────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="${websiteName}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;
}

function buildPackageJson(slug: string, modules: ModuleId[]): string {
  const templatePackage = getTemplatePackageJson();
  console.log("[generator] Building package.json...");

  if (!templatePackage) {
    console.log("Template package.json not found, using fallback");
    return buildFallbackPackageJson(slug, modules);
  }

  const deps: Record<string, string> = {};
  const templateDeps = templatePackage.dependencies || {};

  // Base packages
  BASE_PACKAGES.forEach((pkg) => {
    if (templateDeps[pkg]) {
      deps[pkg] = templateDeps[pkg];
    }
  });

  // Module-specific packages
  modules.forEach((moduleId) => {
    const modulePkgs = MODULE_PACKAGES[moduleId];
    if (modulePkgs && Array.isArray(modulePkgs)) {
      modulePkgs.forEach((pkg) => {
        if (templateDeps[pkg] && !deps[pkg]) {
          deps[pkg] = templateDeps[pkg];
        }
      });
    }
  });

  // Cloudinary special case
  if (modules.includes("rooms") && !deps["cloudinary"]) {
    if (templateDeps["cloudinary"]) {
      deps["cloudinary"] = templateDeps["cloudinary"];
    }
  }

  // Dev dependencies
  const devDeps: Record<string, string> = {};
  const templateDevDeps = templatePackage.devDependencies || {};

  DEV_PACKAGES.forEach((pkg) => {
    if (templateDevDeps[pkg]) {
      devDeps[pkg] = templateDevDeps[pkg];
    }
  });

  return JSON.stringify(
    {
      name: slug,
      version: templatePackage.version || "0.1.0",
      private: true,
      scripts: templatePackage.scripts || {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "eslint",
      },
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2,
  );
}

// Fallback if template package.json can't be read
function buildFallbackPackageJson(slug: string, modules: ModuleId[]): string {
  const needsCloudinary =
    modules.includes("authentication") || modules.includes("rooms");

  const deps: Record<string, string> = {
    next: "16.2.6",
    react: "19.2.4",
    "react-dom": "19.2.4",
    "next-auth": "^4.24.14",
    "@prisma/client": "^7.8.0",
    "@tanstack/react-query": "^5.100.11",
    axios: "^1.16.1",
    bcryptjs: "^3.0.3",
    "class-variance-authority": "^0.7.1",
    clsx: "^2.1.1",
    "framer-motion": "^12.40.0",
    "lucide-react": "^1.16.0",
    sonner: "^2.0.7",
    yup: "^1.7.1",
    "tailwind-merge": "^3.6.0",
    "radix-ui": "^1.4.3",
  };

  if (needsCloudinary) {
    deps["cloudinary"] = "^2.10.0";
  }

  return JSON.stringify(
    {
      name: slug,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "eslint",
      },
      dependencies: deps,
      devDependencies: {
        prisma: "^7.8.0",
        typescript: "^5",
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "@types/bcryptjs": "^2.4.6",
        tailwindcss: "^3.4.19",
        autoprefixer: "^10.5.0",
        postcss: "^8.5.15",
        eslint: "^9",
        "eslint-config-next": "16.2.6",
      },
    },
    null,
    2,
  );
}

function buildReadme(
  websiteName: string,
  slug: string,
  modules: ModuleId[],
): string {
  return `# ${websiteName}

Generated by HotelGen · ${new Date().toLocaleDateString()}

## Included Modules
${modules.map((m) => `- ${m}`).join("\n")}

## Quick Start

\`\`\`bash
# 1. Setup environment
cp .env .env.local
# Edit .env.local with your values

# 2. Install
npm install

# 3. Database
npx prisma migrate dev --name init
npx prisma generate

# 4. Run
npm run dev
\`\`\`

Visit: http://localhost:3000
`;
}

// ─── Dynamic nav.config.ts generate karo ──────────────────
function buildNavConfig(modules: ModuleId[]): string {
  // Define module to nav item mapping
  const adminNavItems: Record<string, string> = {
    rooms: `  { label: "Rooms", href: "/admin/rooms", icon: BedDouble },`,
    booking: `  { label: "Booking", href: "/admin/booking", icon: CalendarCheck },`,
    customer: `  { label: "Customer", href: "/admin/customer", icon: UserRound },`,
    staff: `  { label: "Staff Management", href: "/admin/staff", icon: Users },`,
    kitchen: `  { 
    label: "Kitchen Management",
    href: "/admin/kitchen",
    icon: ChefHat,
    children: [
      { label: "Dashboard", href: "/admin/kitchen/dashboard", icon: LayoutDashboard },
      { label: "Orders", href: "/admin/kitchen/orders", icon: Utensils },
      { label: "Menu Management", href: "/admin/kitchen/menu", icon: Package },
    ],
  },`,
    inventory: `  { label: "Inventory", href: "/admin/inventory", icon: Package },`,
    housekeeping: `  { label: "House Keeping", href: "/admin/housekeeping", icon: Brush },`,
    billing: `  { label: "Billing", href: "/admin/billing", icon: CreditCard },`,
    reports: `  { label: "Reports", href: "/admin/reports", icon: BarChart3 },`,
  };

  const staffNavItems: Record<string, string> = {
    booking: `  { label: "Booking", href: "/staff/booking", icon: CalendarCheck, permission: "booking" },`,
    rooms: `  { label: "Rooms", href: "/staff/rooms", icon: BedDouble, permission: "rooms" },`,
    customer: `  { label: "Customer", href: "/staff/customer", icon: UserRound, permission: "customer" },`,
    kitchen: `  { label: "Kitchen KDS", href: "/staff/kitchen", icon: ChefHat, permission: "KITCHEN_ACCESS" },`,
    inventory: `  { label: "Inventory", href: "/staff/inventory", icon: Package, permission: "inventory" },`,
    housekeeping: `  { label: "House Keeping", href: "/staff/housekeeping", icon: Brush, permission: "housekeeping" },`,
    billing: `  { label: "Billing", href: "/staff/billing", icon: CreditCard, permission: "billing" },`,
    reports: `  { label: "Reports", href: "/staff/reports", icon: BarChart3, permission: "reports" },`,
  };

  const customerNavItems: Record<string, string> = {
    booking: `  { label: "My Bookings", href: "/customer/booking", icon: CalendarCheck },`,
    kitchen: `  { label: "Order Food", href: "/customer/kitchen", icon: ChefHat },`,
    billing: `  { label: "Billing", href: "/customer/billing", icon: CreditCard },`,
    housekeeping: `  { label: "Housekeeping", href: "/customer/housekeeping", icon: Brush },`,
  };

  // Build arrays based on selected modules
  const adminNav: string[] = [
    `  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },`,
  ];
  const staffNav: string[] = [
    `  { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },`,
    `  { label: "Attendance", href: "/staff/attendance", icon: ClipboardCheck },`,
  ];
  const customerNav: string[] = [
    `  { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },`,
  ];

  // Add module-specific items
  modules.forEach((module) => {
    if (adminNavItems[module]) adminNav.push(adminNavItems[module]);
    if (staffNavItems[module]) staffNav.push(staffNavItems[module]);
    if (customerNavItems[module]) customerNav.push(customerNavItems[module]);
  });

  return `// src/config/nav.ts
// Auto-generated for selected modules: ${modules.join(", ")}

import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  Users,
  type LucideIcon,
  BedDouble,
  UserRound,
  ChefHat,
  Package,
  BarChart3,
  ClipboardCheck,
  Brush,
  Utensils,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  children?: NavItem[];
};

export const adminNav: NavItem[] = [
${adminNav.join("\n")}
];

export const staffNav: NavItem[] = [
${staffNav.join("\n")}
];

export const customerNav: NavItem[] = [
${customerNav.join("\n")}
];
`;
}
