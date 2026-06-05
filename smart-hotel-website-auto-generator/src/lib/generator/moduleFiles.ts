// src/lib/generator/moduleFiles.ts
// Each file path is RELATIVE to hotel-template/ root
// buildProject.ts reads: hotel-template/{filePath}
// ZIP output gets:       {slug}/{filePath}

export type ModuleId =
  | "authentication" | "rooms"    | "booking"
  | "customer"       | "billing"  | "housekeeping"
  | "inventory"      | "staff"    | "kitchen"
  | "reports";

// ─── BASE FILES ──────────────────────────────────────────────
// Always included. Paths are relative to hotel-template/
export const BASE_FILES: string[] = [
  // Config
  "next.config.ts",
  "tailwind.config.js",
  "tsconfig.json",
  "postcss.config.js",
  ".gitignore",

  // Prisma — base schema (User model only, module models appended later)
  "prisma/schema.prisma",

  // Global styles
  "src/app/globals.css",

  // Root app
  "src/app/layout.tsx",
  "src/app/page.tsx",

  // Dashboard redirect (role check)
  "src/app/dashboard/page.tsx",

  // Unauthorized page
  "src/app/unauthorized/page.tsx",

  // Auth pages (login/signup always needed)
  "src/app/(auth)/layout.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/signup/page.tsx",

  // Role layouts + dashboards
  "src/app/admin/layout.tsx",
  "src/app/admin/dashboard/page.tsx",
  "src/app/staff/layout.tsx",
  "src/app/staff/dashboard/page.tsx",
  "src/app/customer/layout.tsx",
  "src/app/customer/dashboard/page.tsx",

  // NextAuth API route
  "src/app/api/auth/[...nextauth]/route.ts",

  // Shared layout components
  "src/components/layout/Sidebar.tsx",
  "src/components/layout/Topbar.tsx",
  "src/components/layout/DashboardShell.tsx",

  // Lib
  "src/lib/prisma.ts",
  "src/lib/authOption.ts",

  // Types
  "src/types/next-auth.d.ts",

  // Middleware
  "src/middleware.ts",
];

// ─── MODULE FILES ─────────────────────────────────────────────
// Only copied when that module is selected
// Paths relative to hotel-template/
export const MODULE_FILES: Record<ModuleId, string[]> = {

  authentication: [
    // Password reset pages
    "src/app/(auth)/forgetPassword/page.tsx",
    "src/app/(auth)/resetPassword/page.tsx",

    // Profile pages (one per role, all import same ProfileClient)
    "src/app/admin/profile/page.tsx",
    "src/app/staff/profile/page.tsx",
    "src/app/customer/profile/page.tsx",

    // Profile API routes
    "src/app/api/profile/route.ts",
    "src/app/api/profile/upload-image/route.ts",

    // Password reset API
    "src/app/api/auth/forget-password/route.ts",
    "src/app/api/auth/reset-password/route.ts",

    // Profile UI module
    "src/modules/profile/ProfileClient.tsx",
    "src/modules/profile/ProfileForm.tsx",
    "src/modules/profile/AvatarUpload.tsx",

    // Hook + service + types
    "src/hooks/useProfile.ts",
    "src/services/profile.service.ts",
    "src/types/profile.ts",
  ],

  rooms: [
    "src/app/admin/rooms/page.tsx",
    "src/app/api/rooms/route.ts",
    "src/app/api/rooms/[id]/route.ts",
    "src/app/api/rooms/[id]/upload-image/route.ts",
    "src/modules/rooms/RoomsClient.tsx",
    "src/modules/rooms/RoomCard.tsx",
    "src/modules/rooms/RoomFormModal.tsx",
    "src/hooks/useRooms.ts",
    "src/services/rooms.service.ts",
    "src/types/rooms.ts",
  ],

  booking: [
    "src/app/admin/bookings/page.tsx",
    "src/app/staff/bookings/page.tsx",
    "src/app/customer/bookings/page.tsx",
    "src/app/api/bookings/route.ts",
    "src/app/api/bookings/[id]/route.ts",
    "src/modules/booking/BookingsClient.tsx",
    "src/hooks/useBookings.ts",
    "src/services/bookings.service.ts",
    "src/types/booking.ts",
  ],

  customer: [
    "src/app/admin/customers/page.tsx",
    "src/app/api/customers/route.ts",
    "src/app/api/customers/[id]/route.ts",
    "src/modules/customers/CustomersClient.tsx",
    "src/hooks/useCustomers.ts",
    "src/services/customers.service.ts",
    "src/types/customer.ts",
  ],

  billing: [
    "src/app/admin/billing/page.tsx",
    "src/app/staff/billing/page.tsx",
    "src/app/customer/billing/page.tsx",
    "src/app/api/billing/route.ts",
    "src/app/api/billing/[id]/route.ts",
    "src/modules/billing/BillingClient.tsx",
    "src/hooks/useBilling.ts",
    "src/services/billing.service.ts",
    "src/types/billing.ts",
  ],

  housekeeping: [
    "src/app/admin/housekeeping/page.tsx",
    "src/app/staff/housekeeping/page.tsx",
    "src/app/api/housekeeping/route.ts",
    "src/modules/housekeeping/HousekeepingClient.tsx",
    "src/hooks/useHousekeeping.ts",
    "src/services/housekeeping.service.ts",
    "src/types/housekeeping.ts",
  ],

  inventory: [
    "src/app/admin/inventory/page.tsx",
    "src/app/api/inventory/route.ts",
    "src/modules/inventory/InventoryClient.tsx",
    "src/hooks/useInventory.ts",
    "src/services/inventory.service.ts",
    "src/types/inventory.ts",
  ],

  staff: [
    "src/app/admin/staff/page.tsx",
    "src/app/api/staff/route.ts",
    "src/app/api/staff/[id]/route.ts",
    "src/modules/staff/StaffClient.tsx",
    "src/hooks/useStaff.ts",
    "src/services/staff.service.ts",
    "src/types/staff.ts",
  ],

  kitchen: [
    "src/app/admin/kitchen/page.tsx",
    "src/app/staff/kitchen/page.tsx",
    "src/app/customer/order-food/page.tsx",
    "src/app/api/kitchen/route.ts",
    "src/modules/kitchen/KitchenClient.tsx",
    "src/hooks/useKitchen.ts",
    "src/services/kitchen.service.ts",
    "src/types/kitchen.ts",
  ],

  reports: [
    "src/app/admin/reports/page.tsx",
    "src/app/api/reports/route.ts",
    "src/modules/reports/ReportsClient.tsx",
    "src/hooks/useReports.ts",
    "src/services/reports.service.ts",
    "src/types/reports.ts",
  ],
};

// ─── PRISMA MODEL SNIPPETS ────────────────────────────────────
// Appended to base schema when module is selected
export const MODULE_PRISMA_MODELS: Partial<Record<ModuleId, string>> = {
  rooms: `
model Room {
  id            String     @id @default(cuid())
  roomNumber    String     @unique
  floor         Int
  roomType      RoomType
  status        RoomStatus @default(AVAILABLE)
  pricePerNight Decimal    @db.Decimal(10, 2)
  capacity      Int
  description   String?    @db.Text
  amenities     String[]   @default([])
  photos        String[]   @default([])
  isActive      Boolean    @default(true)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}
enum RoomType   { SINGLE DOUBLE SUITE DELUXE FAMILY PRESIDENTIAL }
enum RoomStatus { AVAILABLE RESERVED OCCUPIED MAINTENANCE CLEANING }`,

  booking: `
model Booking {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  roomId      String
  checkIn     DateTime
  checkOut    DateTime
  guests      Int           @default(1)
  totalPrice  Decimal       @db.Decimal(10, 2)
  status      BookingStatus @default(PENDING)
  notes       String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
enum BookingStatus { PENDING CONFIRMED CHECKED_IN CHECKED_OUT CANCELLED }`,

  billing: `
model Invoice {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  amount      Decimal       @db.Decimal(10, 2)
  status      InvoiceStatus @default(PENDING)
  dueDate     DateTime?
  paidAt      DateTime?
  notes       String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
enum InvoiceStatus { PENDING PAID OVERDUE CANCELLED }`,

  staff: `
model StaffProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  department  String?
  shift       String?
  joiningDate DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}`,
};

// ─── SIDEBAR NAV ENTRIES ──────────────────────────────────────
// Injected into dynamic sidebarNav.ts per role
export const MODULE_NAV_ENTRIES: Partial<Record<ModuleId, {
  admin?:    string;
  staff?:    string;
  customer?: string;
}>> = {
  authentication: {
    admin:    `{ label: "Profile", href: "/admin/profile",    icon: UserCircle }`,
    staff:    `{ label: "Profile", href: "/staff/profile",    icon: UserCircle }`,
    customer: `{ label: "Profile", href: "/customer/profile", icon: UserCircle }`,
  },
  rooms: {
    admin: `{ label: "Rooms", href: "/admin/rooms", icon: BedDouble }`,
  },
  booking: {
    admin:    `{ label: "Bookings",    href: "/admin/bookings",    icon: CalendarCheck }`,
    staff:    `{ label: "Bookings",    href: "/staff/bookings",    icon: CalendarCheck }`,
    customer: `{ label: "My Bookings", href: "/customer/bookings", icon: CalendarCheck }`,
  },
  billing: {
    admin:    `{ label: "Billing", href: "/admin/billing",    icon: CreditCard }`,
    staff:    `{ label: "Billing", href: "/staff/billing",    icon: CreditCard }`,
    customer: `{ label: "Billing", href: "/customer/billing", icon: CreditCard }`,
  },
  customer: {
    admin: `{ label: "Customers", href: "/admin/customers", icon: Users }`,
  },
  staff: {
    admin: `{ label: "Staff", href: "/admin/staff", icon: Users }`,
  },
  reports: {
    admin: `{ label: "Reports", href: "/admin/reports", icon: BarChart3 }`,
    staff: `{ label: "Reports", href: "/staff/reports", icon: BarChart3 }`,
  },
  housekeeping: {
    admin: `{ label: "Housekeeping", href: "/admin/housekeeping", icon: LayoutDashboard }`,
    staff: `{ label: "Housekeeping", href: "/staff/housekeeping", icon: LayoutDashboard }`,
  },
  kitchen: {
    admin:    `{ label: "Kitchen",     href: "/admin/kitchen",      icon: LayoutDashboard }`,
    staff:    `{ label: "Kitchen",     href: "/staff/kitchen",      icon: LayoutDashboard }`,
    customer: `{ label: "Order Food",  href: "/customer/order-food", icon: LayoutDashboard }`,
  },
  inventory: {
    admin: `{ label: "Inventory", href: "/admin/inventory", icon: LayoutDashboard }`,
  },
};