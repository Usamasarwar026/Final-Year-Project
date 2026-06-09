// src/lib/generator/buildProject.ts

import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import { BASE_FILES, MODULE_FILES, type ModuleId } from "./moduleFiles";
import { resolveDependencies } from "./moduleDependencies";
import { BASE_PACKAGES, MODULE_PACKAGES, DEV_PACKAGES } from "./packageMapping";
import { processTemplate, buildVars } from "./templateEngine";
import { buildSchema } from "./schemaBuilder";

// ─── Path Configuration ───────────────────────────────────────
const GENERATOR_ROOT = process.cwd();
const TEMPLATE_ROOT  = path.join(GENERATOR_ROOT, "..", "smart-hotel-template");

let templatePackageJson: any = null;

// ─── Binary file extensions — these must NEVER be read as utf-8 ─
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg",
  ".ico", ".bmp", ".tiff", ".tif",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".pdf", ".zip", ".tar", ".gz",
  ".mp4", ".mp3", ".wav", ".ogg", ".webm",
]);

function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

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
      `Template folder not found at: ${TEMPLATE_ROOT}\n` +
        `Expected: smart-hotel-template/ alongside generator`,
    );
  }
}

type BuildInput = {
  websiteName: string;
  modules:     ModuleId[];
};

export async function buildProjectZip({
  websiteName,
  modules: rawModules,
}: BuildInput): Promise<Buffer> {
  verifyTemplateRoot();

  // Resolve dependencies
  const modules   = resolveDependencies(rawModules);
  const moduleSet = new Set<ModuleId>(modules);

  console.log(`[generator] Raw modules:      ${rawModules.join(", ")}`);
  console.log(`[generator] Resolved modules: ${modules.join(", ")}`);

  const zip         = new JSZip();
  const vars        = buildVars(websiteName);
  const slug        = vars.WEBSITE_SLUG;
  const root        = zip.folder(slug)!;
  const copiedFiles = new Set<string>();

  // ── Helper: add a single file to zip ────────────────────────
  function addFile(filePath: string): boolean {
    if (copiedFiles.has(filePath)) return true;

    const fullPath = path.join(TEMPLATE_ROOT, filePath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`[generator] MISSING: ${filePath}`);
      return false;
    }

    if (isBinaryFile(filePath)) {
      // Binary: read as Buffer, add without template processing
      const buffer = fs.readFileSync(fullPath);
      root.file(filePath, buffer, { binary: true });
    } else {
      // Text: read as utf-8, run template substitution
      const content = fs.readFileSync(fullPath, "utf-8");
      root.file(filePath, processTemplate(content, vars));
    }

    copiedFiles.add(filePath);
    return true;
  }

  // ── 1. BASE files ────────────────────────────────────────────
  console.log("[generator] Copying base files...");
  for (const filePath of BASE_FILES) {
    if (filePath === "prisma/schema.prisma") continue;
    addFile(filePath);
  }

  // ── 2. Public folder ─────────────────────────────────────────
  console.log("[generator] Copying public folder...");
  copyPublicFolder(root, vars, copiedFiles);

  // ── 3. MODULE files ──────────────────────────────────────────
  for (const moduleId of modules) {
    console.log(`[generator] Copying module: ${moduleId}`);
    const files = MODULE_FILES[moduleId] ?? [];
    for (const filePath of files) {
      addFile(filePath);
    }
  }

  // ── 4. Prisma schema ─────────────────────────────────────────
  console.log("[generator] Building Prisma schema...");
  const schema = buildSchema(modules);
  root.file("prisma/schema.prisma", schema);

  // ── 5. .env file ─────────────────────────────────────────────
  root.file(".env", buildEnvTemplate(websiteName, modules));

  // ── 6. package.json ──────────────────────────────────────────
  root.file("package.json", buildPackageJson(slug, modules));

  // ── 7. README ────────────────────────────────────────────────
  root.file("README.md", buildReadme(websiteName, slug, modules, rawModules));

  // ── 8. nav.config.ts ─────────────────────────────────────────
  root.file(
    "src/components/sidebar/nav.config.ts",
    buildNavConfig(modules),
  );

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  console.log(
    `[generator] Done. Files: ${copiedFiles.size}, ZIP: ${(buffer.length / 1024).toFixed(1)} KB`,
  );

  return buffer;
}

// ─── Copy entire public/ folder ───────────────────────────────
function copyPublicFolder(
  root:        JSZip,
  vars:        ReturnType<typeof buildVars>,
  copiedFiles: Set<string>,
) {
  const publicSrc = path.join(TEMPLATE_ROOT, "public");
  if (!fs.existsSync(publicSrc)) {
    console.warn("[generator] public/ folder not found — skipping");
    return;
  }

  let count = 0;

  function walk(srcDir: string, destPrefix: string) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath  = path.join(srcDir, entry.name);
      const destPath = `${destPrefix}/${entry.name}`;   // always forward slash in zip

      if (entry.isDirectory()) {
        walk(srcPath, destPath);
        continue;
      }

      // It's a file
      if (isBinaryFile(entry.name)) {
        // ── Binary: Buffer ─────────────────────────────────────
        const buf = fs.readFileSync(srcPath);
        root.file(destPath, buf, { binary: true });
      } else {
        // ── Text: template substitution ────────────────────────
        const text = fs.readFileSync(srcPath, "utf-8");
        root.file(destPath, processTemplate(text, vars));
      }

      copiedFiles.add(destPath);
      count++;
    }
  }

  walk(publicSrc, "public");
  console.log(`[generator] public/ copied — ${count} files`);
}

// ─── .env template ────────────────────────────────────────────
function buildEnvTemplate(websiteName: string, modules: ModuleId[]): string {
  const needsCloudinary = modules.includes("rooms");
  const needsEmail      = modules.includes("authentication");

  return `# ${websiteName} — Environment Variables
# Generated by HotelGen · ${new Date().toLocaleDateString()}

# ── Database ──────────────────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"

# ── NextAuth ──────────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-in-production"
${
  needsEmail
    ? `
# ── Email (password reset) ────────────────────────────────────
EMAIL_USER=""
EMAIL_PASS=""
`
    : ""
}${
  needsCloudinary
    ? `
# ── Cloudinary (image uploads) ────────────────────────────────
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
`
    : ""
}
# ── App ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="${websiteName}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;
}

// ─── package.json ─────────────────────────────────────────────
function buildPackageJson(slug: string, modules: ModuleId[]): string {
  const templatePkg = getTemplatePackageJson();
  if (!templatePkg) return buildFallbackPackageJson(slug, modules);

  const deps: Record<string, string>    = {};
  const devDeps: Record<string, string> = {};

  const tDeps    = templatePkg.dependencies    ?? {};
  const tDevDeps = templatePkg.devDependencies ?? {};

  BASE_PACKAGES.forEach((pkg) => {
    if (tDeps[pkg]) deps[pkg] = tDeps[pkg];
  });

  modules.forEach((moduleId) => {
    (MODULE_PACKAGES[moduleId] ?? []).forEach((pkg) => {
      if (tDeps[pkg] && !deps[pkg]) deps[pkg] = tDeps[pkg];
    });
  });

  DEV_PACKAGES.forEach((pkg) => {
    if (tDevDeps[pkg]) devDeps[pkg] = tDevDeps[pkg];
  });

  return JSON.stringify(
    {
      name:    slug,
      version: templatePkg.version ?? "0.1.0",
      private: true,
      scripts: templatePkg.scripts ?? {
        dev:   "next dev",
        build: "next build",
        start: "next start",
        lint:  "eslint",
        seed:  "tsx prisma/seed.ts",
      },
      dependencies:    deps,
      devDependencies: devDeps,
    },
    null,
    2,
  );
}

function buildFallbackPackageJson(slug: string, modules: ModuleId[]): string {
  const deps: Record<string, string> = {
    next:                   "16.2.6",
    react:                  "19.2.4",
    "react-dom":            "19.2.4",
    "next-auth":            "^4.24.14",
    "@prisma/client":       "^7.8.0",
    "@tanstack/react-query":"^5.100.11",
    axios:                  "^1.16.1",
    bcryptjs:               "^3.0.3",
    clsx:                   "^2.1.1",
    "lucide-react":         "^1.16.0",
    sonner:                 "^2.0.7",
    "framer-motion":        "^11.0.0",
    "tailwind-merge":       "^3.6.0",
    "radix-ui":             "^1.4.3",
    recharts:               "^2.12.0",
    yup:                    "^1.7.1",
  };

  if (modules.includes("rooms"))          deps.cloudinary  = "^2.10.0";
  if (modules.includes("authentication")) deps.nodemailer  = "^7.0.13";
  if (modules.includes("billing") || modules.includes("booking")) {
    deps.jspdf            = "^2.5.1";
    deps["jspdf-autotable"] = "^3.8.0";
    deps.xlsx             = "^0.18.5";
  }

  return JSON.stringify(
    {
      name:    slug,
      version: "0.1.0",
      private: true,
      scripts: {
        dev:   "next dev",
        build: "next build",
        start: "next start",
        lint:  "eslint",
        seed:  "tsx prisma/seed.ts",
      },
      dependencies:    deps,
      devDependencies: {
        prisma:               "^7.8.0",
        typescript:           "^5",
        "@types/node":        "^20",
        "@types/react":       "^19",
        "@types/react-dom":   "^19",
        "@types/bcryptjs":    "^2.4.6",
        "@types/nodemailer":  "^6.4.0",
        tailwindcss:          "^3.4.19",
        autoprefixer:         "^10.5.0",
        postcss:              "^8.5.15",
        eslint:               "^9",
        "eslint-config-next": "16.2.6",
        tsx:                  "^4.22.3",
      },
    },
    null,
    2,
  );
}

// ─── README.md ────────────────────────────────────────────────
function buildReadme(
  websiteName:     string,
  slug:            string,
  resolvedModules: ModuleId[],
  rawModules:      ModuleId[],
): string {
  const autoAdded = resolvedModules.filter(
    (m) => !rawModules.includes(m) && m !== "authentication",
  );
  return `# ${websiteName}

Generated by HotelGen · ${new Date().toLocaleDateString()}

## Selected Modules
${rawModules.map((m) => `- ✅ ${m}`).join("\n")}
${autoAdded.length > 0 ? `\n## Auto-included Dependencies\n${autoAdded.map((m) => `- 🔗 ${m}`).join("\n")}` : ""}

## Quick Start
\`\`\`bash
cp .env .env.local
# Edit .env.local with your credentials

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
\`\`\`

Visit: http://localhost:3000

## Default Credentials
After seeding the database (\`npm run seed\`):
- **Admin:** admin@hotel.com / admin123
- **Staff:** staff@hotel.com / staff123
- **Customer:** Sign up via /signup
`;
}

// ─── nav.config.ts ────────────────────────────────────────────
function buildNavConfig(modules: ModuleId[]): string {
  const adminItems: string[] = [
    `  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },`,
  ];
  const staffItems: string[] = [
    `  { label: "Dashboard",  href: "/staff/dashboard",  icon: LayoutDashboard },`,
    `  { label: "Attendance", href: "/staff/attendance", icon: ClipboardCheck  },`,
  ];
  const customerItems: string[] = [
    `  { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },`,
  ];

  // Admin nav entries
  const adminMap: Partial<Record<ModuleId, string>> = {
    rooms:        `  { label: "Rooms",              href: "/admin/rooms",        icon: BedDouble     },`,
    booking:      `  { label: "Booking",            href: "/admin/booking",      icon: CalendarCheck },`,
    customer:     `  { label: "Customer",           href: "/admin/customer",     icon: UserRound     },`,
    staff:        `  { label: "Staff Management",   href: "/admin/staff",        icon: Users         },`,
    kitchen:      `  { label: "Kitchen",            href: "/admin/kitchen/dashboard", icon: ChefHat  },`,
    inventory:    `  { label: "Inventory",          href: "/admin/inventory",    icon: Package       },`,
    housekeeping: `  { label: "House Keeping",      href: "/admin/housekeeping", icon: Brush         },`,
    billing:      `  { label: "Billing",            href: "/admin/billing",      icon: CreditCard    },`,
    reports:      `  { label: "Reports",            href: "/admin/reports",      icon: BarChart3     },`,
  };

  // Staff nav entries
  const staffMap: Partial<Record<ModuleId, string>> = {
    booking:      `  { label: "Booking",      href: "/staff/booking",      icon: CalendarCheck, permission: "booking"      },`,
    rooms:        `  { label: "Rooms",        href: "/staff/rooms",        icon: BedDouble,     permission: "rooms"        },`,
    customer:     `  { label: "Customer",     href: "/staff/customer",     icon: UserRound,     permission: "customer"     },`,
    kitchen:      `  { label: "Kitchen",      href: "/staff/kitchen/dashboard", icon: ChefHat, permission: "kitchen"      },`,
    inventory:    `  { label: "Inventory",    href: "/staff/inventory",    icon: Package,       permission: "inventory"    },`,
    housekeeping: `  { label: "House Keeping",href: "/staff/housekeeping", icon: Brush,         permission: "housekeeping" },`,
    billing:      `  { label: "Billing",      href: "/staff/billing",      icon: CreditCard,    permission: "billing"      },`,
    reports:      `  { label: "Reports",      href: "/staff/reports",      icon: BarChart3,     permission: "reports"      },`,
  };

  // Customer nav entries
  const customerMap: Partial<Record<ModuleId, string>> = {
    booking:      `  { label: "My Bookings", href: "/customer/booking",      icon: CalendarCheck },`,
    kitchen:      `  { label: "Order Food",  href: "/customer/kitchen",      icon: ChefHat       },`,
    billing:      `  { label: "Billing",     href: "/customer/billing",      icon: CreditCard    },`,
    housekeeping: `  { label: "Room Service",href: "/customer/housekeeping", icon: Brush         },`,
  };

  // Populate arrays in a sensible display order
  const ORDER: ModuleId[] = [
    "booking", "rooms", "customer", "staff",
    "kitchen", "inventory", "housekeeping", "billing", "reports",
  ];

  for (const mod of ORDER) {
    if (!modules.includes(mod)) continue;
    if (adminMap[mod])    adminItems.push(adminMap[mod]!);
    if (staffMap[mod])    staffItems.push(staffMap[mod]!);
    if (customerMap[mod]) customerItems.push(customerMap[mod]!);
  }

  return `// src/config/nav.ts
// Auto-generated by HotelGen for modules: [${modules.join(", ")}]

import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  Users,
  BedDouble,
  UserRound,
  ChefHat,
  Package,
  BarChart3,
  ClipboardCheck,
  Brush,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label:       string;
  href:        string;
  icon:        LucideIcon;
  permission?: string;
  children?:   NavItem[];
};

// ── Admin (full access, no permission guard) ──────────────────
export const adminNav: NavItem[] = [
${adminItems.join("\n")}
];

// ── Staff (permission-gated per module) ───────────────────────
export const staffNav: NavItem[] = [
${staffItems.join("\n")}
];

// ── Customer ──────────────────────────────────────────────────
export const customerNav: NavItem[] = [
${customerItems.join("\n")}
];
`;
}