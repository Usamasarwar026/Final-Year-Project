// src/lib/generator/buildProject.ts
// Reads files DIRECTLY from hotel-template project (sibling folder)

import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import {
  BASE_FILES,
  MODULE_FILES,
  MODULE_PRISMA_MODELS,
  MODULE_NAV_ENTRIES,
  type ModuleId,
} from "./moduleFiles";
import { processTemplate, buildVars } from "./templateEngine";

// ─── Path Configuration ───────────────────────────────────────
// Root directory jahan dono projects hain:
//   root/
//     smart-hotel-website-auto-generator/   ← generator (process.cwd())
//     hotel-template/                        ← template source

const GENERATOR_ROOT  = process.cwd(); // smart-hotel-website-auto-generator/
const TEMPLATE_ROOT   = path.join(GENERATOR_ROOT, "..", "smart-hotel-template"); // sibling folder

// Verify template project exists at startup
function verifyTemplateRoot() {
  if (!fs.existsSync(TEMPLATE_ROOT)) {
    throw new Error(
      `hotel-template folder not found at: ${TEMPLATE_ROOT}\n` +
      `Expected structure:\n` +
      `  root/\n` +
      `    smart-hotel-website-auto-generator/\n` +
      `    hotel-template/\n`
    );
  }
}

// ─── Main Build Function ──────────────────────────────────────
type BuildInput = {
  websiteName: string;
  modules: ModuleId[];
};

export async function buildProjectZip({
  websiteName,
  modules,
}: BuildInput): Promise<Buffer> {
  verifyTemplateRoot();

  const zip  = new JSZip();
  const vars = buildVars(websiteName);
  const slug = vars.WEBSITE_SLUG;

  // Root folder inside ZIP — extracted as: grand-palace-hotel/
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
      if (copiedFiles.has(filePath)) continue; // no duplicates

      const content = readFromTemplate(filePath);
      if (content === null) {
        console.warn(`[generator] MISSING module file (${moduleId}): ${filePath}`);
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
    processTemplate(baseSchema + "\n\n" + extraModels, vars)
  );

  // ── 4. sidebarNav.ts — generated dynamically ─────────────────
  root.file("src/lib/sidebarNav.ts", buildSidebarNav(modules, vars.WEBSITE_NAME));

  // ── 5. .env.template — generated dynamically ─────────────────
  root.file(".env.template", buildEnvTemplate(websiteName, modules));

  // ── 6. package.json — with correct project name ──────────────
  root.file("package.json", buildPackageJson(slug, modules));

  // ── 7. README ─────────────────────────────────────────────────
  root.file("README.md", buildReadme(websiteName, slug, modules));

  // ── Generate ZIP buffer ───────────────────────────────────────
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  console.log(
    `[generator] Done. Files: ${copiedFiles.size}, ZIP size: ${(buffer.length / 1024).toFixed(1)}KB`
  );

  return buffer;
}

// ─── Read file from hotel-template ───────────────────────────
function readFromTemplate(filePath: string): string | null {
  const fullPath = path.join(TEMPLATE_ROOT, filePath);
  try {
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    return null;
  }
}

// ─── Dynamic sidebarNav.ts ────────────────────────────────────
function buildSidebarNav(modules: ModuleId[], websiteName: string): string {
  const adminEntries: string[]    = [`{ label: "Dashboard", href: "/admin/dashboard",    icon: LayoutDashboard }`];
  const staffEntries: string[]    = [`{ label: "Dashboard", href: "/staff/dashboard",    icon: LayoutDashboard }`];
  const customerEntries: string[] = [`{ label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard }`];

  for (const mod of modules) {
    const nav = MODULE_NAV_ENTRIES[mod];
    if (!nav) continue;
    if (nav.admin)    adminEntries.push(nav.admin);
    if (nav.staff)    staffEntries.push(nav.staff);
    if (nav.customer) customerEntries.push(nav.customer);
  }

  return `// src/lib/sidebarNav.ts
// Auto-generated for: ${websiteName}

import {
  LayoutDashboard, UserCircle, BedDouble, CalendarCheck,
  CreditCard, Users, BarChart3, type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  children?: NavItem[];
};

export const adminNav: NavItem[] = [
  ${adminEntries.join(",\n  ")},
];

export const staffNav: NavItem[] = [
  ${staffEntries.join(",\n  ")},
];

export const customerNav: NavItem[] = [
  ${customerEntries.join(",\n  ")},
];
`;
}

// ─── Dynamic .env.template ────────────────────────────────────
function buildEnvTemplate(websiteName: string, modules: ModuleId[]): string {
  const needsCloudinary =
    modules.includes("authentication") || modules.includes("rooms");

  return `# ================================================
# ${websiteName} — Environment Variables
# ================================================
# 1. Copy this file:  cp .env.template .env.local
# 2. Fill in YOUR values below
# 3. Never commit .env.local to git

# ── Database ─────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"

# ── NextAuth ─────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
# Generate secret: openssl rand -base64 32
${needsCloudinary ? `
# ── Cloudinary (Image Uploads) ───────────────────
# Sign up free at: https://cloudinary.com
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
` : ""}
# ── App ──────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="${websiteName}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;
}

// ─── Dynamic package.json ────────────────────────────────────
function buildPackageJson(slug: string, modules: ModuleId[]): string {
  const needsCloudinary =
    modules.includes("authentication") || modules.includes("rooms");

  const deps: Record<string, string> = {
    next:                   "15.1.0",
    react:                  "^19.0.0",
    "react-dom":            "^19.0.0",
    "next-auth":            "^4.24.11",
    "@prisma/client":       "^6.0.0",
    "@tanstack/react-query":"^5.62.0",
    axios:                  "^1.7.9",
    "framer-motion":        "^11.13.0",
    bcryptjs:               "^2.4.3",
    clsx:                   "^2.1.1",
    "lucide-react":         "^0.469.0",
    sonner:                 "^1.7.1",
  };

  if (needsCloudinary) deps["cloudinary"] = "^2.5.1";

  return JSON.stringify(
    {
      name:    slug,
      version: "0.1.0",
      private: true,
      scripts: {
        dev:   "next dev",
        build: "next build",
        start: "next start",
        lint:  "next lint",
      },
      dependencies: deps,
      devDependencies: {
        prisma:           "^6.0.0",
        typescript:       "^5",
        "@types/node":    "^20",
        "@types/react":   "^19",
        "@types/react-dom":"^19",
        "@types/bcryptjs": "^2.4.6",
        tailwindcss:      "^3.4.17",
        autoprefixer:     "^10.4.20",
        postcss:          "^8",
      },
    },
    null,
    2
  );
}

// ─── README ───────────────────────────────────────────────────
function buildReadme(
  websiteName: string,
  slug: string,
  modules: ModuleId[]
): string {
  return `# ${websiteName}

Generated by HotelGen · ${new Date().toLocaleDateString()}

## Included Modules
${modules.map((m) => `- ${m}`).join("\n")}

## Quick Start

\`\`\`bash
# 1. Setup environment
cp .env.template .env.local
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