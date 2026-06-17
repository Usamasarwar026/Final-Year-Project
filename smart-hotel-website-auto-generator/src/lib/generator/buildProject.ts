// src/lib/generator/buildProject.ts

import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import {
  type ModuleId,
  type TierId,
  getModuleFilesForTier,
  getBaseFilesForTierFunc,
} from "./moduleFiles";
import { resolveDependencies } from "./moduleDependencies";
import { BASE_PACKAGES, MODULE_PACKAGES, DEV_PACKAGES } from "./packageMapping";
import { processTemplate, processModuleBlocks, buildVars } from "./templateEngine";
import { buildSchema } from "./schemaBuilder";

// ─── Path Configuration ───────────────────────────────────────
const GENERATOR_ROOT = process.cwd();

const ADVANCED_TEMPLATE_ROOT = path.join(
  GENERATOR_ROOT,
  "..",
  "smart-hotel-template",
);

const BASIC_TEMPLATE_ROOT = path.join(
  GENERATOR_ROOT,
  "..",
  "basic-hotel-template",
);

function getTemplateRoot(tier: TierId): string {
  return tier === "basic" ? BASIC_TEMPLATE_ROOT : ADVANCED_TEMPLATE_ROOT;
}

// ─── Binary file extensions ───────────────────────────────────
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico",
  ".bmp", ".tiff", ".tif", ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".pdf", ".zip", ".tar", ".gz", ".mp4", ".mp3", ".wav", ".ogg", ".webm",
]);

function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function verifyTemplateRoot(tier: TierId): string {
  const templateRoot = getTemplateRoot(tier);
  if (!fs.existsSync(templateRoot)) {
    throw new Error(`Template folder not found: ${templateRoot}`);
  }
  return templateRoot;
}

type BuildInput = {
  websiteName: string;
  modules: ModuleId[];
  tier: TierId;
};

export async function buildProjectZip({
  websiteName,
  modules: rawModules,
  tier,
}: BuildInput): Promise<Buffer> {
  const templateRoot = verifyTemplateRoot(tier);

  // Resolve dependencies
  const modules = resolveDependencies(rawModules);



  
  console.log(`\n========== GENERATOR DEBUG ==========`);
  console.log(`[generator] Tier: ${tier}`);
  console.log(`[generator] Raw modules: ${rawModules.join(', ')}`);
  console.log(`[generator] Resolved modules: ${modules.join(', ')}`);
  console.log(`[generator] Modules count: ${modules.length}`);
  console.log(`=====================================\n`);

  const zip = new JSZip();
  const vars = buildVars(websiteName);
  const slug = vars.WEBSITE_SLUG;
  const root = zip.folder(slug)!;
  const copiedFiles = new Set<string>();


function addFile(
  filePath: string,
  sourceRoot: string = templateRoot,
): boolean {
  if (copiedFiles.has(filePath)) return true;

  const fullPath = path.join(sourceRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`[generator] MISSING: ${filePath}`);
    return false;
  }

  if (isBinaryFile(filePath)) {
    const buffer = fs.readFileSync(fullPath);
    root.file(filePath, buffer, { binary: true });
  } else {
    let content = fs.readFileSync(fullPath, "utf-8");

    // DEBUG: Log for dashboard files
    if (filePath.includes('AdminDashboard') || filePath.includes('dashboard/route')) {
      console.log(`\n[generator] ========== Processing: ${filePath} ==========`);
      console.log('[generator] Modules:', modules);
      console.log('[generator] Tier:', tier);
      console.log('[generator] Original contains {{#if}}:', content.includes('{{#if'));
      
      // Show first few lines for debugging
      const lines = content.split('\n');
      const firstLines = lines.slice(0, 5).join('\n');
      console.log('[generator] First 5 lines:\n', firstLines);
    }

    // Step 1: Process module blocks FIRST
    if (content.includes('{{#if')) {
      const beforeLength = content.length;
      console.log(`[generator] Processing {{#if}} blocks...`);
      content = processModuleBlocks(content, modules, tier);
      const afterLength = content.length;
      console.log(`[generator] After processing: ${beforeLength} -> ${afterLength} chars`);
      console.log('[generator] Still has {{#if}}:', content.includes('{{#if'));
    }

    // Step 2: Process template variables
    if (content.includes('{{')) {
      console.log('[generator] Processing template variables...');
      content = processTemplate(content, vars);
    }

    // DEBUG: Verify result
    if (filePath.includes('AdminDashboard') || filePath.includes('dashboard/route')) {
      console.log('[generator] Final check - has {{#if}}:', content.includes('{{#if'));
      const finalLines = content.split('\n').slice(0, 10).join('\n');
      console.log('[generator] First 10 lines after processing:\n', finalLines);
      console.log('[generator] ========== Done ==========\n');
    }

    root.file(filePath, content);
  }

  copiedFiles.add(filePath);
  return true;
}
  // ── Helper: list se files add karo ───────────────────────────
  function addFiles(filePaths: string[], sourceRoot: string) {
    for (const filePath of filePaths) {
      // Prisma schema skip — hum dynamically build karte hain
      if (filePath === "prisma/schema.prisma") continue;
      addFile(filePath, sourceRoot);
    }
  }

  // ── 1. BASE files for this tier ──────────────────────────────
  console.log("[generator] Copying base files...");
  const baseFiles = getBaseFilesForTierFunc(tier);
  addFiles(baseFiles, templateRoot);

  // ── 2. Public folder ─────────────────────────────────────────
  console.log("[generator] Copying public folder...");
  copyPublicFolder(root, vars, copiedFiles, templateRoot);

  // ── 3. MODULE files for selected modules ─────────────────────
  for (const moduleId of modules) {
    console.log(`[generator] Copying module: ${moduleId}`);
    const moduleFiles = getModuleFilesForTier(moduleId, tier);
    addFiles(moduleFiles, templateRoot);
  }

  // ── 4. Prisma schema (dynamically built) ─────────────────────
  console.log("[generator] Building Prisma schema...");
  const schema = buildSchema(modules, tier);
  root.file("prisma/schema.prisma", schema);

  // ── 5. .env file ─────────────────────────────────────────────
  root.file(".env", buildEnvTemplate(websiteName, modules, tier));

  // ── 6. package.json (dynamic) ────────────────────────────────
  root.file("package.json", buildPackageJson(slug, modules));

  // ── 7. README ────────────────────────────────────────────────
  root.file(
    "README.md",
    buildReadme(websiteName, slug, modules, rawModules, tier),
  );

  // ── 8. nav.config.ts (tier + module specific) ────────────────
  root.file(
    "src/components/sidebar/nav.config.ts",
    buildNavConfig(modules, tier),
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

// ─── Copy entire public/ folder ──────────────────────────────
function copyPublicFolder(
  root: JSZip,
  vars: ReturnType<typeof buildVars>,
  copiedFiles: Set<string>,
  templateRoot: string,
) {
  const publicSrc = path.join(templateRoot, "public");

  if (!fs.existsSync(publicSrc)) {
    console.warn("[generator] public/ folder not found — skipping");
    return;
  }

  let count = 0;

  function walk(srcDir: string, destPrefix: string) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = `${destPrefix}/${entry.name}`;

      if (entry.isDirectory()) {
        walk(srcPath, destPath);
        continue;
      }

      if (copiedFiles.has(destPath)) continue;

      if (isBinaryFile(entry.name)) {
        const buf = fs.readFileSync(srcPath);
        root.file(destPath, buf, { binary: true });
      } else {
        let text = fs.readFileSync(srcPath, "utf-8");
        if (text.includes("{{#if")) {
          // Public folder files mein bhi module blocks support
          text = processModuleBlocks(text, [], ""); // public files mein modules nahi hote
        }
        if (text.includes("{{")) {
          text = processTemplate(text, vars);
        }
        root.file(destPath, text);
      }

      copiedFiles.add(destPath);
      count++;
    }
  }

  walk(publicSrc, "public");
  console.log(`[generator] public/ copied — ${count} files`);
}

// ─── .env template ────────────────────────────────────────────
function buildEnvTemplate(
  websiteName: string,
  modules: ModuleId[],
  tier: TierId,
): string {
  const needsCloudinary = modules.includes("rooms");
  const needsEmail = modules.includes("authentication");
  const needsStaff = modules.includes("staff");

  return `# ${websiteName} — Environment Variables
# Generated by HotelGen · ${new Date().toLocaleDateString()}
# Tier: ${tier}

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
}
${
  needsCloudinary
    ? `
# ── Cloudinary (image uploads) ────────────────────────────────
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
`
    : ""
}
${
  needsStaff
    ? `
# ── Staff Features ────────────────────────────────────────────
# Additional staff-related configurations
`
    : ""
}
# ── App ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="${websiteName}"
`;
}

// ─── package.json ─────────────────────────────────────────────
function buildPackageJson(slug: string, modules: ModuleId[]): string {
  const deps: Record<string, string> = {};
  const devDeps: Record<string, string> = {};

  const versions: Record<string, string> = {
    next: "16.2.6",
    react: "19.2.4",
    "react-dom": "19.2.4",
    "next-auth": "^4.24.14",
    "@prisma/adapter-neon": "^7.8.0",
    "@prisma/client": "^7.8.0",
    "@tanstack/react-query": "^5.100.11",
    axios: "^1.16.1",
    bcryptjs: "^3.0.3",
    clsx: "^2.1.1",
    "lucide-react": "^1.16.0",
    sonner: "^2.0.7",
    "framer-motion": "^11.0.0",
    "class-variance-authority": "^0.7.0",
    "tailwind-merge": "^3.6.0",
    "tw-animate-css": "^1.0.0",
    yup: "^1.7.1",
    "radix-ui": "^1.4.3",
    recharts: "^2.12.0",
    cloudinary: "^2.10.0",
    nodemailer: "^7.0.13",
    jspdf: "^2.5.1",
    "jspdf-autotable": "^3.8.0",
    xlsx: "^0.18.5",
    prisma: "^7.8.0",
    typescript: "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/bcryptjs": "^2.4.6",
    "@types/nodemailer": "^6.4.0",
    "@types/recharts": "^1.8.0",
    tailwindcss: "^3.4.19",
    "@tailwindcss/postcss": "^4.0.0",
    autoprefixer: "^10.5.0",
    postcss: "^8.5.15",
    eslint: "^9",
    "eslint-config-next": "16.2.6",
    tsx: "^4.22.3",
  };

  BASE_PACKAGES.forEach((pkg) => {
    deps[pkg] = versions[pkg] ?? "latest";
  });

  modules.forEach((moduleId) => {
    const modulePackages = MODULE_PACKAGES[moduleId] ?? [];
    modulePackages.forEach((pkg) => {
      if (!deps[pkg]) {
        deps[pkg] = versions[pkg] ?? "latest";
      }
    });
  });

  DEV_PACKAGES.forEach((pkg) => {
    devDeps[pkg] = versions[pkg] ?? "latest";
  });

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
      devDependencies: devDeps,
    },
    null,
    2,
  );
}

// ─── README.md ────────────────────────────────────────────────
function buildReadme(
  websiteName: string,
  slug: string,
  resolvedModules: ModuleId[],
  rawModules: ModuleId[],
  tier: TierId,
): string {
  const autoAdded = resolvedModules.filter(
    (m) => !rawModules.includes(m) && m !== "authentication",
  );

  const tierGuide = {
    basic: `## Basic Tier
- No staff management
- Simple role system (Admin only)
- Basic booking flow`,
    intermediate: `## Intermediate Tier
- Full staff management
- Housekeeping operations
- Billing system
- Role-based access control`,
    advanced: `## Advanced Tier
- All modules included
- Inventory management
- Kitchen operations
- Advanced analytics and reports`,
  };

  return `# ${websiteName}

Generated by HotelGen · ${new Date().toLocaleDateString()}
**Tier:** ${tier.toUpperCase()}

${tierGuide[tier]}

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
After seeding (\`npm run seed\`):
- **Admin:** admin@hotel.com / admin123
${tier !== "basic" ? "- **Staff:** staff@hotel.com / staff123" : ""}
- **Customer:** Sign up via /signup
`;
}

// ─── nav.config.ts ────────────────────────────────────────────
function buildNavConfig(modules: ModuleId[], tier: TierId): string {
  if (tier === "basic") {
    return buildBasicNavConfig(modules);
  }
  return buildFullNavConfig(modules, tier);
}

function buildBasicNavConfig(modules: ModuleId[]): string {
  const adminItems: string[] = [
    `  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },`,
  ];

  const adminMap: Partial<Record<ModuleId, string>> = {
    rooms:    `  { label: "Rooms", href: "/admin/rooms", icon: BedDouble },`,
    booking:  `  { label: "Booking", href: "/admin/booking", icon: CalendarCheck },`,
    customer: `  { label: "Customer", href: "/admin/customer", icon: UserRound },`,
  };

  const ORDER: ModuleId[] = ["booking", "rooms", "customer"];
  for (const mod of ORDER) {
    if (!modules.includes(mod)) continue;
    if (adminMap[mod]) adminItems.push(adminMap[mod]!);
  }

  return `// src/config/nav.ts — Auto-generated by HotelGen (BASIC tier)

import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  children?: NavItem[];
};

export const adminNav: NavItem[] = [
${adminItems.join("\n")}
];

export const staffNav: NavItem[] = [];

export const customerNav: NavItem[] = [];
`;
}

function buildFullNavConfig(modules: ModuleId[], tier: TierId): string {
  const adminItems: string[] = [
    `  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },`,
  ];
  const staffItems: string[] = [
    `  { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },`,
    `  { label: "Attendance", href: "/staff/attendance", icon: ClipboardCheck },`,
  ];
  const customerItems: string[] = [
    `  { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },`,
  ];

  type AdminEntry = {
    label: string;
    href: string;
    icon: string;
    children?: Array<{ label: string; href: string; icon: string }>;
  };

  type StaffEntry = {
    label: string;
    href: string;
    icon: string;
    permission: string;
    children?: Array<{ label: string; href: string; icon: string; permission: string }>;
  };

  const adminMap: Partial<Record<ModuleId, AdminEntry>> = {
    rooms:    { label: "Rooms", href: "/admin/rooms", icon: "BedDouble" },
    booking:  { label: "Booking", href: "/admin/booking", icon: "CalendarCheck" },
    customer: { label: "Customer", href: "/admin/customer", icon: "UserRound" },
    staff:    { label: "Staff Management", href: "/admin/staff", icon: "Users" },
    housekeeping: { label: "House Keeping", href: "/admin/housekeeping", icon: "Brush" },
    billing:  { label: "Billing", href: "/admin/billing", icon: "CreditCard" },
    kitchen: {
      label: "Kitchen Management",
      href: "/admin/kitchen",
      icon: "ChefHat",
      children: [
        { label: "Dashboard", href: "/admin/kitchen/dashboard", icon: "LayoutDashboard" },
        { label: "Orders", href: "/admin/kitchen/orders", icon: "Utensils" },
        { label: "Menu Management", href: "/admin/kitchen/menu", icon: "MenuSquare" },
        { label: "Categories", href: "/admin/kitchen/categories", icon: "Tags" },
        { label: "Kitchen Staff", href: "/admin/kitchen/staff", icon: "UsersRound" },
        { label: "Delivery Assignments", href: "/admin/kitchen/deliveries", icon: "Bike" },
        { label: "Reports", href: "/admin/kitchen/reports", icon: "TrendingUp" },
      ],
    },
    inventory: {
      label: "Inventory",
      href: "/admin/inventory",
      icon: "Package",
      children: [
        { label: "Dashboard", href: "/admin/inventory", icon: "LayoutDashboard" },
        { label: "Stock Items", href: "/admin/inventory/items", icon: "Package" },
        { label: "Categories", href: "/admin/inventory/categories", icon: "Tags" },
        { label: "Vendors", href: "/admin/inventory/vendors", icon: "Truck" },
        { label: "Purchase Orders", href: "/admin/inventory/purchase-orders", icon: "ShoppingCart" },
        { label: "Stock Receiving", href: "/admin/inventory/stock-receiving", icon: "ClipboardCheck" },
        { label: "Wastage", href: "/admin/inventory/wastage", icon: "Brush" },
        { label: "Reports", href: "/admin/inventory/reports", icon: "BarChart3" },
      ],
    },
    reports: {
      label: "Reports",
      href: "/admin/reports",
      icon: "BarChart3",
      children: [
        { label: "KPI Dashboard", href: "/admin/reports", icon: "LayoutDashboard" },
        { label: "Revenue", href: "/admin/reports/revenue", icon: "DollarSign" },
        { label: "Occupancy", href: "/admin/reports/occupancy", icon: "BedDouble" },
        { label: "Staff Performance", href: "/admin/reports/staff-performance", icon: "Users" },
        { label: "Inventory", href: "/admin/reports/inventory", icon: "Package" },
        { label: "Bookings", href: "/admin/reports/bookings", icon: "CalendarCheck" },
        { label: "Guests", href: "/admin/reports/guests", icon: "UserPlus" },
        { label: "Scheduled Reports", href: "/admin/reports/scheduled", icon: "Clock" },
      ],
    },
  };

  const staffMap: Partial<Record<ModuleId, StaffEntry>> = {
    booking:      { label: "Booking", href: "/staff/booking", icon: "CalendarCheck", permission: "booking" },
    rooms:        { label: "Rooms", href: "/staff/rooms", icon: "BedDouble", permission: "rooms" },
    customer:     { label: "Customer", href: "/staff/customer", icon: "UserRound", permission: "customer" },
    housekeeping: { label: "House Keeping", href: "/staff/housekeeping", icon: "Brush", permission: "housekeeping" },
    billing:      { label: "Billing", href: "/staff/billing", icon: "CreditCard", permission: "billing" },
    reports:      { label: "Reports", href: "/staff/reports", icon: "BarChart3", permission: "reports" },
    inventory:    { label: "Inventory", href: "/staff/inventory", icon: "Package", permission: "inventory" },
    
    kitchen: {
      label: "Kitchen",
      href: "/staff/kitchen",
      icon: "ChefHat",
      permission: "KITCHEN_ACCESS",
      children: [
        { label: "Dashboard", href: "/staff/kitchen/dashboard", icon: "LayoutDashboard", permission: "KITCHEN_ACCESS" },
        { label: "Orders", href: "/staff/kitchen/orders", icon: "Utensils", permission: "KITCHEN_ORDER_PROCESS" },
        { label: "Menu Management", href: "/staff/kitchen/menu", icon: "MenuSquare", permission: "KITCHEN_MENU_MANAGE" },
        { label: "Categories", href: "/staff/kitchen/categories", icon: "Tags", permission: "KITCHEN_CATEGORIES_MANAGE" },
        { label: "Kitchen Staff", href: "/staff/kitchen/staff", icon: "UsersRound", permission: "KITCHEN_STAFF_MANAGE" },
        { label: "Delivery Assignments", href: "/staff/kitchen/deliveries", icon: "Bike", permission: "DELIVERY_ASSIGN" },
        { label: "My Deliveries", href: "/staff/kitchen/my-deliveries", icon: "Truck", permission: "DELIVERY_ACCESS" },
        { label: "Reports", href: "/staff/kitchen/reports", icon: "TrendingUp", permission: "KITCHEN_REPORTS" },
      ],
    },
  };

  const customerMap: Partial<Record<ModuleId, string>> = {
    booking:      `  { label: "My Bookings", href: "/customer/booking", icon: CalendarCheck },`,
    kitchen:      `  { label: "Order Food", href: "/customer/kitchen", icon: ShoppingCart },`,
    billing:      `  { label: "Billing", href: "/customer/billing", icon: CreditCard },`,
    housekeeping: `  { label: "Room Service", href: "/customer/housekeeping", icon: Brush },`,
  };

  const ORDER: ModuleId[] = [
    "booking", "rooms", "customer", "staff", "kitchen",
    "inventory", "housekeeping", "billing", "reports",
  ];

  // Build admin nav
  for (const mod of ORDER) {
    if (!modules.includes(mod)) continue;
    const item = adminMap[mod];
    if (!item) continue;

    if (item.children && item.children.length > 0) {
      const childrenStr = item.children
        .map((c) => `      { label: "${c.label}", href: "${c.href}", icon: ${c.icon} }`)
        .join(",\n");
      adminItems.push(
        `  {\n    label: "${item.label}",\n    href: "${item.href}",\n    icon: ${item.icon},\n    children: [\n${childrenStr}\n    ]\n  },`,
      );
    } else {
      adminItems.push(`  { label: "${item.label}", href: "${item.href}", icon: ${item.icon} },`);
    }
  }

  // Build staff nav
  for (const mod of ORDER) {
    if (!modules.includes(mod)) continue;
    const item = staffMap[mod];
    if (!item) continue;

    if (item.children && item.children.length > 0) {
      const childrenStr = item.children
        .map((c) => `      { label: "${c.label}", href: "${c.href}", icon: ${c.icon}, permission: "${c.permission}" }`)
        .join(",\n");
      staffItems.push(
        `  {\n    label: "${item.label}",\n    href: "${item.href}",\n    icon: ${item.icon},\n    permission: "${item.permission}",\n    children: [\n${childrenStr}\n    ]\n  },`,
      );
    } else {
      staffItems.push(`  { label: "${item.label}", href: "${item.href}", icon: ${item.icon}, permission: "${item.permission}" },`);
    }
  }

  // Build customer nav
  for (const mod of ORDER) {
    if (!modules.includes(mod)) continue;
    if (customerMap[mod]) customerItems.push(customerMap[mod]!);
  }

  return `// src/config/nav.ts — Auto-generated by HotelGen (${tier.toUpperCase()} tier)

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
  Utensils,
  MenuSquare,
  Tags,
  UsersRound,
  Bike,
  Truck,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  UserPlus,
  Clock,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  children?: NavItem[];
};

export const adminNav: NavItem[] = [
${adminItems.join("\n")}
];

export const staffNav: NavItem[] = [
${staffItems.join("\n")}
];

export const customerNav: NavItem[] = [
${customerItems.join("\n")}
];

export function filterStaffNavByPermissions(userPermissions: string[]): NavItem[] {
 
  function hasAccess(item: NavItem): boolean {
    // Agar item ki apni permission check karo
    if (item.permission && !userPermissions.includes(item.permission)) {
      // Permission match nahi hui — lekin dekho kya koi child accessible hai
      if (item.children) {
        const accessibleChildren = item.children.filter(child => hasAccess(child));
        return accessibleChildren.length > 0; // Child accessible hai toh parent bhi show karo
      }
      return false; // Na apni permission, na children
    }
    return true; // Permission hai ya required nahi
  }

  function filter(items: NavItem[]): NavItem[] {
    return items
      .map((item) => {
        if (!hasAccess(item)) return null;

        if (item.children) {
          const filteredChildren = filter(item.children);
          return {
            ...item,
            children: filteredChildren.length ? filteredChildren : undefined,
          };
        }
        return item;
      })
      .filter(Boolean) as NavItem[];
  }

  return filter(staffNav);
}
`;
}