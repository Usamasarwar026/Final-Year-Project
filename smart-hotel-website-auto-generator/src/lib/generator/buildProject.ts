// // src/lib/generator/buildProject.ts
// // Reads files DIRECTLY from hotel-template project (sibling folder)
// // Updated: Uses MODULE_FILE_GROUPS for conditional role-based file copying
// //          Uses schemaBuilder for dynamic Prisma schema generation

// import JSZip from "jszip";
// import * as fs from "fs";
// import * as path from "path";
// import {
//   BASE_FILES,
//   type ModuleId,
// } from "./moduleFiles";
// import { resolveDependencies } from "./moduleDependencies";
// import { BASE_PACKAGES, MODULE_PACKAGES, DEV_PACKAGES } from "./packageMapping";
// import { processTemplate, buildVars } from "./templateEngine";
// import { buildSchema } from "./schemaBuilder";

// // ─── Path Configuration ───────────────────────────────────────
// const GENERATOR_ROOT = process.cwd();
// const TEMPLATE_ROOT = path.join(GENERATOR_ROOT, "..", "smart-hotel-template");

// let templatePackageJson: any = null;

// function getTemplatePackageJson() {
//   if (templatePackageJson) return templatePackageJson;
//   const packageJsonPath = path.join(TEMPLATE_ROOT, "package.json");
//   try {
//     const content = fs.readFileSync(packageJsonPath, "utf-8");
//     templatePackageJson = JSON.parse(content);
//     return templatePackageJson;
//   } catch (error) {
//     console.error("Failed to read template package.json:", error);
//     return null;
//   }
// }

// function verifyTemplateRoot() {
//   if (!fs.existsSync(TEMPLATE_ROOT)) {
//     throw new Error(
//       `hotel-template folder not found at: ${TEMPLATE_ROOT}\n` +
//         `Expected structure:\n` +
//         `  root/\n` +
//         `    smart-hotel-website-auto-generator/\n` +
//         `    smart-hotel-template/\n`,
//     );
//   }
// }

// type BuildInput = {
//   websiteName: string;
//   modules: ModuleId[]; // User-selected modules (before dependency resolution)
// };

// export async function buildProjectZip({
//   websiteName,
//   modules: rawModules,
// }: BuildInput): Promise<Buffer> {
//   verifyTemplateRoot();

//   // ── Resolve dependencies first ─────────────────────────────
//   // e.g. user selects [billing] → becomes [billing, booking, rooms, customer]
//   const modules = resolveDependencies(rawModules);
//   const moduleSet = new Set<ModuleId>(modules);

//   console.log(`[generator] Raw modules: ${rawModules.join(", ")}`);
//   console.log(`[generator] Resolved modules: ${modules.join(", ")}`);

//   const zip = new JSZip();
//   const vars = buildVars(websiteName);
//   const slug = vars.WEBSITE_SLUG;

//   const root = zip.folder(slug)!;
//   const copiedFiles = new Set<string>();

//   // ── Helper to safely add a file to ZIP ────────────────────
//   function addFile(filePath: string): boolean {
//     if (copiedFiles.has(filePath)) return true; // already copied, skip
//     const content = readFromTemplate(filePath);
//     if (content === null) {
//       console.warn(`[generator] MISSING file: ${filePath}`);
//       return false;
//     }
//     root.file(filePath, processTemplate(content, vars));
//     copiedFiles.add(filePath);
//     return true;
//   }

//   // ── 1. BASE files ─────────────────────────────────────────
//   console.log("[generator] Copying base files...");
//   for (const filePath of BASE_FILES) {
//     // Skip schema.prisma — we generate it dynamically below
//     if (filePath === "prisma/schema.prisma") continue;
//     addFile(filePath);
//   }

//   // ── 2. MODULE files (conditional) ────────────────────────
//   for (const moduleId of modules) {
//     console.log(`[generator] Copying module: ${moduleId}`);
//     const groups = MODULE_FILE_GROUPS[moduleId] ?? [];

//     for (const group of groups) {
//       // Check if all condition modules are present
//       if (group.condition) {
//         const conditionMet = group.condition.every((dep) => moduleSet.has(dep));
//         if (!conditionMet) {
//           console.log(
//             `[generator]   Skipping group (needs ${group.condition.join("+")}) for ${moduleId}`,
//           );
//           continue;
//         }
//       }

//       for (const filePath of group.files) {
//         if (filePath.trim()) addFile(filePath);
//       }
//     }
//   }

//   // ── 3. Dynamic Prisma schema ──────────────────────────────
//   console.log("[generator] Building Prisma schema...");
//   const schema = buildSchema(modules);
//   root.file("prisma/schema.prisma", schema);

//   // ── 4. .env ───────────────────────────────────────────────
//   root.file(".env", buildEnvTemplate(websiteName, modules));

//   // ── 5. package.json ───────────────────────────────────────
//   root.file("package.json", buildPackageJson(slug, modules));

//   // ── 6. README ─────────────────────────────────────────────
//   root.file("README.md", buildReadme(websiteName, slug, modules, rawModules));

//   // ── 7. nav.config.ts ──────────────────────────────────────
//   root.file("src/components/sidebar/nav.config.ts", buildNavConfig(modules));

//   const buffer = await zip.generateAsync({
//     type: "nodebuffer",
//     compression: "DEFLATE",
//     compressionOptions: { level: 6 },
//   });

//   console.log(
//     `[generator] Done. Files: ${copiedFiles.size}, Modules: ${modules.length}, ZIP size: ${(buffer.length / 1024).toFixed(1)}KB`,
//   );

//   return buffer;
// }

// function readFromTemplate(filePath: string): string | null {
//   const fullPath = path.join(TEMPLATE_ROOT, filePath);
//   try {
//     return fs.readFileSync(fullPath, "utf-8");
//   } catch {
//     return null;
//   }
// }

// function buildEnvTemplate(websiteName: string, modules: ModuleId[]): string {
//   const needsCloudinary = modules.includes("rooms");
//   const needsEmail = modules.includes("authentication");

//   return `# ================================================
// # ${websiteName} — Environment Variables
// # ================================================

// # ── Selected Modules ────────────────────────────────
// # SELECTED_MODULES="${modules.join(",")}"

// # ── Database ─────────────────────────────────────
// DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"

// # ── NextAuth ─────────────────────────────────────
// NEXTAUTH_URL="http://localhost:3000"
// NEXTAUTH_SECRET=""
// # Generate: openssl rand -base64 32

// ${
//   needsEmail
//     ? `# ── Email (Password Reset) ──────────────────────
// SMTP_HOST="smtp.gmail.com"
// SMTP_PORT="587"
// SMTP_USER=""
// SMTP_PASS=""
// SMTP_FROM=""
// `
//     : ""
// }

// ${
//   needsCloudinary
//     ? `# ── Cloudinary (Image Uploads) ───────────────────
// CLOUDINARY_CLOUD_NAME=""
// CLOUDINARY_API_KEY=""
// CLOUDINARY_API_SECRET=""
// `
//     : ""
// }

// # ── App ──────────────────────────────────────────
// NEXT_PUBLIC_APP_NAME="${websiteName}"
// NEXT_PUBLIC_APP_URL="http://localhost:3000"
// `;
// }

// function buildPackageJson(slug: string, modules: ModuleId[]): string {
//   const templatePackage = getTemplatePackageJson();

//   if (!templatePackage) {
//     console.log("[generator] Template package.json not found, using fallback");
//     return buildFallbackPackageJson(slug, modules);
//   }

//   const deps: Record<string, string> = {};
//   const templateDeps = templatePackage.dependencies || {};

//   // Base packages
//   BASE_PACKAGES.forEach((pkg) => {
//     if (templateDeps[pkg]) deps[pkg] = templateDeps[pkg];
//   });

//   // Module-specific packages
//   modules.forEach((moduleId) => {
//     const modulePkgs = MODULE_PACKAGES[moduleId];
//     if (modulePkgs) {
//       modulePkgs.forEach((pkg) => {
//         if (templateDeps[pkg] && !deps[pkg]) deps[pkg] = templateDeps[pkg];
//       });
//     }
//   });

//   // Dev dependencies
//   const devDeps: Record<string, string> = {};
//   const templateDevDeps = templatePackage.devDependencies || {};
//   DEV_PACKAGES.forEach((pkg) => {
//     if (templateDevDeps[pkg]) devDeps[pkg] = templateDevDeps[pkg];
//   });

//   return JSON.stringify(
//     {
//       name: slug,
//       version: templatePackage.version || "0.1.0",
//       private: true,
//       scripts: templatePackage.scripts || {
//         dev: "next dev",
//         build: "next build",
//         start: "next start",
//         lint: "eslint",
//         seed: "tsx prisma/seed.ts",
//       },
//       dependencies: deps,
//       devDependencies: devDeps,
//     },
//     null,
//     2,
//   );
// }

// function buildFallbackPackageJson(slug: string, modules: ModuleId[]): string {
//   const hasCloudinary = modules.includes("rooms");

//   const deps: Record<string, string> = {
//     next: "16.2.6",
//     react: "19.2.4",
//     "react-dom": "19.2.4",
//     "next-auth": "^4.24.14",
//     "@prisma/adapter-neon": "^7.8.0",
//     "@prisma/client": "^7.8.0",
//     "@tanstack/react-query": "^5.100.11",
//     axios: "^1.16.1",
//     bcryptjs: "^3.0.3",
//     "class-variance-authority": "^0.7.1",
//     clsx: "^2.1.1",
//     "framer-motion": "^12.40.0",
//     "lucide-react": "^1.16.0",
//     sonner: "^2.0.7",
//     yup: "^1.7.1",
//     "tailwind-merge": "^3.6.0",
//     "tw-animate-css": "^1.4.0",
//     "radix-ui": "^1.4.3",
//   };

//   if (hasCloudinary) deps["cloudinary"] = "^2.10.0";
//   if (modules.includes("authentication")) deps["nodemailer"] = "^7.0.13";
//   if (modules.includes("reports") || modules.includes("billing")) {
//     deps["jspdf"] = "^4.2.1";
//     deps["jspdf-autotable"] = "^5.0.8";
//   }
//   if (modules.includes("reports") || modules.includes("booking")) {
//     deps["recharts"] = "^3.8.1";
//   }

//   return JSON.stringify(
//     {
//       name: slug,
//       version: "0.1.0",
//       private: true,
//       scripts: {
//         dev: "next dev",
//         build: "next build",
//         start: "next start",
//         lint: "eslint",
//         seed: "tsx prisma/seed.ts",
//       },
//       dependencies: deps,
//       devDependencies: {
//         prisma: "^7.8.0",
//         typescript: "^5",
//         "@types/node": "^20",
//         "@types/react": "^19",
//         "@types/react-dom": "^19",
//         "@types/bcryptjs": "^2.4.6",
//         "@types/nodemailer": "^8.0.0",
//         tailwindcss: "^3.4.19",
//         "@tailwindcss/postcss": "^4",
//         autoprefixer: "^10.5.0",
//         postcss: "^8.5.15",
//         eslint: "^9",
//         "eslint-config-next": "16.2.6",
//         tsx: "^4.22.3",
//       },
//     },
//     null,
//     2,
//   );
// }

// function buildReadme(
//   websiteName: string,
//   slug: string,
//   resolvedModules: ModuleId[],
//   rawModules: ModuleId[],
// ): string {
//   const autoAdded = resolvedModules.filter((m) => !rawModules.includes(m));

//   return `# ${websiteName}

// Generated by HotelGen · ${new Date().toLocaleDateString()}

// ## Selected Modules
// ${rawModules.map((m) => `- ✅ ${m}`).join("\n")}
// ${autoAdded.length > 0 ? `\n## Auto-included (required dependencies)\n${autoAdded.map((m) => `- 🔗 ${m} (required by another module)`).join("\n")}` : ""}

// ## Quick Start

// \`\`\`bash
// # 1. Setup environment
// cp .env .env.local
// # Edit .env.local with your actual values

// # 2. Install dependencies
// npm install

// # 3. Generate Prisma client + migrate
// npx prisma generate
// npx prisma migrate dev --name init

// # 4. Run development server
// npm run dev
// \`\`\`

// Visit: http://localhost:3000

// ## Default Credentials (after seeding)

// Run \`npm run seed\` to create a default admin account.

// ## Project Structure

// \`src/modules/\` — Feature modules
// \`src/app/api/\` — API routes
// \`src/hooks/\` — React Query hooks
// \`src/services/\` — API client services
// \`prisma/schema.prisma\` — Database schema (only selected modules)
// `;
// }

// function buildNavConfig(modules: ModuleId[]): string {
//   const moduleSet = new Set<ModuleId>(modules);

//   const adminNavItems: Record<string, string> = {
//     rooms: `  { label: "Rooms", href: "/admin/rooms", icon: BedDouble },`,
//     booking: `  { label: "Booking", href: "/admin/booking", icon: CalendarCheck },`,
//     customer: `  { label: "Customer", href: "/admin/customer", icon: UserRound },`,
//     staff: `  { label: "Staff Management", href: "/admin/staff", icon: Users },`,
//     kitchen: `  {
//     label: "Kitchen Management",
//     href: "/admin/kitchen",
//     icon: ChefHat,
//     children: [
//       { label: "Dashboard",            href: "/admin/kitchen/dashboard",   icon: LayoutDashboard },
//       { label: "Orders",               href: "/admin/kitchen/orders",      icon: Utensils },
//       { label: "Menu Management",      href: "/admin/kitchen/menu",        icon: Package },
//       { label: "Categories",           href: "/admin/kitchen/categories",  icon: ClipboardCheck },
//       { label: "Kitchen Staff",        href: "/admin/kitchen/staff",       icon: Users },
//       { label: "Delivery Assignments", href: "/admin/kitchen/deliveries",  icon: Bike },
//       { label: "Reports",              href: "/admin/kitchen/reports",     icon: BarChart3 },
//     ],
//   },`,
//     inventory: `  { label: "Inventory", href: "/admin/inventory", icon: Package },`,
//     housekeeping: `  { label: "House Keeping", href: "/admin/housekeeping", icon: Brush },`,
//     billing: `  { label: "Billing", href: "/admin/billing", icon: CreditCard },`,
//     reports: `  { label: "Reports", href: "/admin/reports", icon: BarChart3 },`,
//   };

//   // Staff nav items — only add if staff module is selected
//   const staffNavItems: Record<string, string> = {
//     booking: `  { label: "Booking", href: "/staff/booking", icon: CalendarCheck, permission: "booking" },`,
//     rooms: `  { label: "Rooms", href: "/staff/rooms", icon: BedDouble, permission: "rooms" },`,
//     customer: `  { label: "Customer", href: "/staff/customer", icon: UserRound, permission: "customer" },`,
//     kitchen: moduleSet.has("staff")
//       ? `  {
//     label: "Kitchen Management",
//     href: "/staff/kitchen",
//     icon: ChefHat,
//     permission: "KITCHEN_ACCESS",
//     children: [
//       { label: "Dashboard",            href: "/staff/kitchen/dashboard",   icon: LayoutDashboard },
//       { label: "Orders",               href: "/staff/kitchen/orders",      icon: Utensils },
//       { label: "Menu Management",      href: "/staff/kitchen/menu",        icon: Package },
//       { label: "Categories",           href: "/staff/kitchen/categories",  icon: ClipboardCheck },
//       { label: "Kitchen Staff",        href: "/staff/kitchen/staff",       icon: Users },
//       { label: "Delivery Assignments", href: "/staff/kitchen/deliveries",  icon: Bike },
//       { label: "Reports",              href: "/staff/kitchen/reports",     icon: BarChart3 },
//     ],
//   },`
//       : "",
//     inventory: `  { label: "Inventory", href: "/staff/inventory", icon: Package, permission: "inventory" },`,
//     housekeeping: `  { label: "House Keeping", href: "/staff/housekeeping", icon: Brush, permission: "housekeeping" },`,
//     billing: `  { label: "Billing", href: "/staff/billing", icon: CreditCard, permission: "billing" },`,
//     reports: `  { label: "Reports", href: "/staff/reports", icon: BarChart3, permission: "reports" },`,
//   };

//   // Customer nav items — only add if customer module is selected
//   const customerNavItems: Record<string, string> = {
//     booking: `  { label: "My Bookings", href: "/customer/booking", icon: CalendarCheck },`,
//     kitchen: `  { label: "Order Food", href: "/customer/kitchen", icon: ChefHat },`,
//     billing: `  { label: "Billing", href: "/customer/billing", icon: CreditCard },`,
//     housekeeping: `  { label: "Housekeeping", href: "/customer/housekeeping", icon: Brush },`,
//   };

//   const adminNav: string[] = [
//     `  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },`,
//   ];

//   // Staff nav — only if staff module present
//   const staffNav: string[] = moduleSet.has("staff")
//     ? [
//         `  { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },`,
//         `  { label: "Attendance", href: "/staff/attendance", icon: ClipboardCheck },`,
//       ]
//     : [
//         `  { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },`,
//       ];

//   // Customer nav — only if customer module present
//   const customerNav: string[] = moduleSet.has("customer")
//     ? [
//         `  { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },`,
//       ]
//     : [
//         `  { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },`,
//       ];

//   modules.forEach((module) => {
//     if (adminNavItems[module]) adminNav.push(adminNavItems[module]);

//     // Staff nav items only relevant if staff module is selected
//     if (moduleSet.has("staff") && staffNavItems[module]) {
//       staffNav.push(staffNavItems[module]);
//     }

//     // Customer nav items only relevant if customer module is selected
//     if (moduleSet.has("customer") && customerNavItems[module]) {
//       customerNav.push(customerNavItems[module]);
//     }
//   });

//   return `// src/components/sidebar/nav.config.ts
// // Auto-generated for selected modules: ${modules.join(", ")}

// import {
//   LayoutDashboard,
//   CalendarCheck,
//   CreditCard,
//   Users,
//   type LucideIcon,
//   BedDouble,
//   UserRound,
//   ChefHat,
//   Package,
//   BarChart3,
//   ClipboardCheck,
//   Brush,
//   Utensils,
//   Bike,
// } from "lucide-react";

// export type NavItem = {
//   label: string;
//   href: string;
//   icon: LucideIcon;
//   permission?: string;
//   children?: NavItem[];
// };

// export const adminNav: NavItem[] = [
// ${adminNav.join("\n")}
// ];

// export const staffNav: NavItem[] = [
// ${staffNav.join("\n")}
// ];

// export const customerNav: NavItem[] = [
// ${customerNav.join("\n")}
// ];
// `;
// }

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
const TEMPLATE_ROOT = path.join(GENERATOR_ROOT, "..", "smart-hotel-template");

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
      `Template folder not found at: ${TEMPLATE_ROOT}\n` +
        `Expected: smart-hotel-template/ alongside generator`,
    );
  }
}

type BuildInput = {
  websiteName: string;
  modules: ModuleId[];
};

export async function buildProjectZip({
  websiteName,
  modules: rawModules,
}: BuildInput): Promise<Buffer> {
  verifyTemplateRoot();

  // Resolve dependencies
  const modules = resolveDependencies(rawModules);
  const moduleSet = new Set<ModuleId>(modules);

  console.log(`[generator] Raw modules: ${rawModules.join(", ")}`);
  console.log(`[generator] Resolved modules: ${modules.join(", ")}`);

  const zip = new JSZip();
  const vars = buildVars(websiteName);
  const slug = vars.WEBSITE_SLUG;
  const root = zip.folder(slug)!;
  const copiedFiles = new Set<string>();

  // Helper to add file
  function addFile(filePath: string): boolean {
    if (copiedFiles.has(filePath)) return true;
    const content = readFromTemplate(filePath);
    if (content === null) {
      console.warn(`[generator] MISSING: ${filePath}`);
      return false;
    }
    root.file(filePath, processTemplate(content, vars));
    copiedFiles.add(filePath);
    return true;
  }

  // ── 1. BASE files ─────────────────────────────────────────
  console.log("[generator] Copying base files...");
  for (const filePath of BASE_FILES) {
    if (filePath === "prisma/schema.prisma") continue;
    addFile(filePath);
  }

  // ── 2. Public folder ─────────────────────────────────────
  console.log("[generator] Copying public folder...");
  copyPublicFolder(root, vars, copiedFiles);

  // ── 3. MODULE files ──────────────────────────────────────
  for (const moduleId of modules) {
    console.log(`[generator] Copying module: ${moduleId}`);
    const files = MODULE_FILES[moduleId] ?? [];
    for (const filePath of files) {
      addFile(filePath);
    }
  }

  // ── 4. Prisma schema ─────────────────────────────────────
  console.log("[generator] Building Prisma schema...");
  const schema = buildSchema(modules);
  root.file("prisma/schema.prisma", schema);

  // ── 5. .env file ─────────────────────────────────────────
  root.file(".env", buildEnvTemplate(websiteName, modules));

  // ── 6. package.json ──────────────────────────────────────
  root.file("package.json", buildPackageJson(slug, modules));

  // ── 7. README ────────────────────────────────────────────
  root.file("README.md", buildReadme(websiteName, slug, modules, rawModules));

  // ── 8. nav.config.ts ─────────────────────────────────────
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

function copyPublicFolder(root: JSZip, vars: any, copiedFiles: Set<string>) {
  const publicSrcPath = path.join(TEMPLATE_ROOT, "public");
  if (!fs.existsSync(publicSrcPath)) {
    console.warn("[generator] Public folder not found");
    return;
  }

  function copyDir(src: string, dest: string) {
    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        root.folder(destPath);
        copyDir(srcPath, destPath);
      } else {
        const content = fs.readFileSync(srcPath, "utf-8");
        root.file(destPath, processTemplate(content, vars));
        copiedFiles.add(destPath);
      }
    }
  }

  copyDir(publicSrcPath, "public");
  console.log("[generator] Public folder copied");
}

function buildEnvTemplate(websiteName: string, modules: ModuleId[]): string {
  const needsCloudinary = modules.includes("rooms");
  const needsEmail = modules.includes("authentication");

  return `# ${websiteName} - Environment Variables

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""

${
  needsEmail
    ? `
# Email (for password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
`
    : ""
}

${
  needsCloudinary
    ? `
# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
`
    : ""
}

# App
NEXT_PUBLIC_APP_NAME="${websiteName}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;
}

function buildPackageJson(slug: string, modules: ModuleId[]): string {
  const templatePackage = getTemplatePackageJson();
  if (!templatePackage) {
    return buildFallbackPackageJson(slug, modules);
  }

  const deps: Record<string, string> = {};
  const templateDeps = templatePackage.dependencies || {};

  BASE_PACKAGES.forEach((pkg) => {
    if (templateDeps[pkg]) deps[pkg] = templateDeps[pkg];
  });

  modules.forEach((moduleId) => {
    const modulePkgs = MODULE_PACKAGES[moduleId];
    if (modulePkgs) {
      modulePkgs.forEach((pkg) => {
        if (templateDeps[pkg] && !deps[pkg]) deps[pkg] = templateDeps[pkg];
      });
    }
  });

  const devDeps: Record<string, string> = {};
  const templateDevDeps = templatePackage.devDependencies || {};
  DEV_PACKAGES.forEach((pkg) => {
    if (templateDevDeps[pkg]) devDeps[pkg] = templateDevDeps[pkg];
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
        seed: "tsx prisma/seed.ts",
      },
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2,
  );
}

function buildFallbackPackageJson(slug: string, modules: ModuleId[]): string {
  const deps: Record<string, string> = {
    next: "16.2.6",
    react: "19.2.4",
    "react-dom": "19.2.4",
    "next-auth": "^4.24.14",
    "@prisma/client": "^7.8.0",
    "@tanstack/react-query": "^5.100.11",
    axios: "^1.16.1",
    bcryptjs: "^3.0.3",
    clsx: "^2.1.1",
    "lucide-react": "^1.16.0",
    sonner: "^2.0.7",
    yup: "^1.7.1",
    "tailwind-merge": "^3.6.0",
    "radix-ui": "^1.4.3",
  };

  if (modules.includes("rooms")) deps["cloudinary"] = "^2.10.0";
  if (modules.includes("authentication")) deps["nodemailer"] = "^7.0.13";

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
        seed: "tsx prisma/seed.ts",
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
        tsx: "^4.22.3",
      },
    },
    null,
    2,
  );
}

function buildReadme(
  websiteName: string,
  slug: string,
  resolvedModules: ModuleId[],
  rawModules: ModuleId[],
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
# Edit .env.local with your values

npm install
npx prisma generate
npx prisma migrate dev --name init
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
      { label: "Dashboard",            href: "/admin/kitchen/dashboard",   icon: LayoutDashboard },
      { label: "Orders",               href: "/admin/kitchen/orders",      icon: Utensils },
      { label: "Menu Management",      href: "/admin/kitchen/menu",        icon: Package },
      { label: "Categories",           href: "/admin/kitchen/categories",  icon: ClipboardCheck },
      { label: "Kitchen Staff",        href: "/admin/kitchen/staff",       icon: Users },
      { label: "Delivery Assignments", href: "/admin/kitchen/deliveries",  icon: Bike },
      { label: "Reports",              href: "/admin/kitchen/reports",     icon: BarChart3 },
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
    kitchen: `  {
    label: "Kitchen Management",
    href: "/admin/kitchen",
    icon: ChefHat,
    permission: "KITCHEN_ACCESS",
    children: [
      { label: "Dashboard",            href: "/staff/kitchen/dashboard",   icon: LayoutDashboard },
      { label: "Orders",               href: "/staff/kitchen/orders",      icon: Utensils },
      { label: "Menu Management",      href: "/staff/kitchen/menu",        icon: Package },
      { label: "Categories",           href: "/staff/kitchen/categories",  icon: ClipboardCheck },
      { label: "Kitchen Staff",        href: "/staff/kitchen/staff",       icon: Users },
      { label: "Delivery Assignments", href: "/staff/kitchen/deliveries",  icon: Bike },
      { label: "Reports",              href: "/staff/kitchen/reports",     icon: BarChart3 },
    ],
  },`,
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
  Bike,
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
