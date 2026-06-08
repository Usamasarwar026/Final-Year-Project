// // src/lib/generator/moduleFiles.ts
// // Each file path is RELATIVE to hotel-template/ root
// // buildProject.ts reads: hotel-template/{filePath}
// // ZIP output gets:       {slug}/{filePath}
// //
// // NEW: MODULE_FILES is now split into:
// //   - MODULE_FILES[module].always  → copy whenever module is selected
// //   - MODULE_FILES[module].withCustomer → copy only when "customer" module is ALSO selected
// //   - MODULE_FILES[module].withBooking  → copy only when "booking" module is ALSO selected
// // This avoids shipping dead code for roles the user didn't select.

// export type ModuleId =
//   | "authentication"
//   | "rooms"
//   | "booking"
//   | "customer"
//   | "billing"
//   | "housekeeping"
//   | "inventory"
//   | "staff"
//   | "kitchen"
//   | "reports";

// // ─── BASE FILES ──────────────────────────────────────────────
// // Always included regardless of modules
// export const BASE_FILES: string[] = [
//   // Config
//   "next.config.ts",
//   "tailwind.config.js",
//   "tsconfig.json",
//   "postcss.config.js",
//   ".gitignore",
//   "eslint.config.mjs",
//   "prisma/schema.prisma", // overwritten by schemaBuilder — this is just a placeholder
//   "src/app/globals.css",
//   "src/app/layout.tsx",
//   "src/app/page.tsx",
//   "src/app/dashboard/page.tsx",
//   "src/app/unauthorized/page.tsx",
//   "src/app/not-found.tsx",
//   "src/app/api/auth/[...nextauth]/route.ts",
//   "src/lib/authOption.ts",
//   "src/lib/axios.ts",
//   "src/database/db.ts",
//   "src/types/next-auth.d.ts",
//   "src/proxy.ts",
//   "src/providers/provider.tsx",
//   "src/providers/authProvider.tsx",
//   "src/utils/tailwindUtils.ts",
//   "src/constant/constant.ts",

//   // Landing / error pages
//   "src/components/landingPage/LandingPage.tsx",
//   "src/components/pageNotFound/PageNotFound.tsx",
//   "src/components/unauthorized/Unauthorized.tsx",

//   // Shared UI atoms
//   "src/components/button/Button.tsx",
//   "src/components/input/Input.tsx",
//   "src/components/label/Label.tsx",
//   "src/components/card/Card.tsx",
//   "src/components/footer/Footer.tsx",

//   // Layout shell
//   "src/components/layout/DashboardShell.tsx",
//   "src/components/sidebar/Sidebar.tsx",
//   "src/components/sidebar/CollapsedNavItem.tsx",
//   "src/components/sidebar/ExpandedNavItem.tsx",
//   "src/components/sidebar/SidebarFooter.tsx",
//   "src/components/sidebar/SidebarHeader.tsx",
//   "src/components/sidebar/SidebarInner.tsx",
//   "src/components/topbar/Topbar.tsx",

//   // Profile (always needed for any authenticated user)
//   "src/hooks/useProfile.ts",
//   "src/types/profile.type.ts",
//   "src/services/profileService.ts",
//   "src/app/api/profile/upload-image/route.ts",
//   "src/app/api/profile/route.ts",
//   "src/app/admin/profile/page.tsx",
//   "src/modules/profile/ProfileClient.tsx",

//   // Role layouts + dashboards
//   "src/app/admin/layout.tsx",
//   "src/app/admin/dashboard/page.tsx",
//   "src/app/staff/layout.tsx",
//   "src/app/staff/dashboard/page.tsx",
//   "src/app/customer/layout.tsx",
//   "src/app/customer/dashboard/page.tsx",
//   "src/modules/dashboard/admin/AdminDashboard.tsx",
//   "src/modules/dashboard/customer/CustomerDashboard.tsx",
//   "src/modules/dashboard/staff/StaffDashboard.tsx",
//   "src/app/api/admin/dashboard/route.ts",

//   // Notifications (always included)
//   "src/app/admin/notifications/page.tsx",
//   "src/app/customer/notifications/page.tsx",
//   "src/app/staff/notifications/page.tsx",
//   "src/modules/notifications/NotificationsPage.tsx",
//   "src/hooks/useNotifications.ts",
//   "src/services/notificationService.ts",
//   "src/app/api/debug/notifications/route.ts",
//   "src/app/api/notifications/route.ts",
//   "src/app/api/notifications/[id]/route.ts",
// ];

// // ─── CONDITIONAL FILE SETS ─────────────────────────────────────
// // Per-module file groups with optional conditions.
// // `condition` = array of OTHER modules that must ALL be present for this group to copy.
// // No `condition` = always copy when module is selected.

// export type FileGroup = {
//   condition?: ModuleId[]; // all of these must be in final selected set
//   files: string[];
// };

// export const MODULE_FILE_GROUPS: Record<ModuleId, FileGroup[]> = {
//   // ── AUTH ─────────────────────────────────────────────────────
//   authentication: [
//     {
//       files: [
//         "src/app/(auth)/login/page.tsx",
//         "src/app/(auth)/signup/page.tsx",
//         "src/app/(auth)/forgetPassword/page.tsx",
//         "src/app/(auth)/resetPassword/page.tsx",
//         "src/modules/auth/loginForm/LoginForm.tsx",
//         "src/modules/auth/signupForm/SignupForm.tsx",
//         "src/modules/auth/ForgetForm/ForgetForm.tsx",
//         "src/modules/auth/resetForm/ResetForm.tsx",
//         "src/app/api/forget/route.ts",
//         "src/app/api/forget/reset/route.ts",
//         "src/app/api/signup/route.ts",
//         "src/services/authService.ts",
//         "src/lib/sendEmail.ts",
//       ],
//     },
//   ],

//   // ── ROOMS ────────────────────────────────────────────────────
//   rooms: [
//     {
//       // Admin room management — always when rooms selected
//       files: [
//         "src/app/admin/rooms/page.tsx",
//         "src/modules/rooms/Rooms.tsx",
//         "src/hooks/useRooms.ts",
//         "src/modules/rooms/components/ConfirmDialog.tsx",
//         "src/modules/rooms/components/RoomModal.tsx",
//         "src/modules/rooms/components/ViewRoomModal.tsx",
//         "src/app/api/rooms/route.ts",
//         "src/app/api/rooms/[id]/route.ts",
//         "src/app/api/rooms/upload/route.ts",
//         "src/services/roomService.ts",
//       ],
//     },
//   ],

//   // ── BOOKING ──────────────────────────────────────────────────
//   booking: [
//     {
//       // Admin booking — always when booking selected
//       files: [
//         "src/app/admin/booking/page.tsx",
//         "src/app/api/bookings/route.ts",
//         "src/app/api/bookings/[id]/route.ts",
//         "src/app/api/bookings/available-rooms/route.ts",
//         "src/modules/bookings/AdminBookings.tsx",
//         "src/hooks/useBookings.ts",
//         "src/types/bookings.ts",
//         "src/services/bookingService.ts",
//       ],
//     },
//     {
//       // Customer booking page — only when customer module is ALSO selected
//       condition: ["customer"],
//       files: [
//         "src/app/customer/booking/page.tsx",
//         "src/modules/bookings/CustomerBookings.tsx",
//         "src/hooks/useCustomers.ts", // needed for customer booking form
//       ],
//     },
//     {
//       // Staff booking view — only when staff module is ALSO selected
//       condition: ["staff"],
//       files: [
//         // staff can view bookings from staff/booking page
//         // add if template has this file
//       ],
//     },
//   ],

//   // ── CUSTOMER ─────────────────────────────────────────────────
//   customer: [
//     {
//       // Admin customer management — always when customer selected
//       files: [
//         "src/app/admin/customer/page.tsx",
//         "src/modules/customers/Customer.tsx",
//         "src/app/api/customers/route.ts",
//         "src/app/api/customers/[id]/route.ts",
//         "src/app/api/customers/service-requests/route.ts",
//         "src/app/api/customers/active-booking/route.ts",
//         "src/hooks/useCustomerModule.ts",
//         "src/hooks/useCustomers.ts",
//         "src/services/customers.service.ts",
//         "src/types/customers.ts",
//       ],
//     },
//   ],

//   // ── STAFF ────────────────────────────────────────────────────
//   staff: [
//     {
//       files: [
//         "src/app/admin/staff/page.tsx",
//         "src/app/admin/staff/dashboard/page.tsx",
//         "src/app/admin/staff/profile/page.tsx",
//         "src/app/staff/attendance/page.tsx",
//         "src/app/admin/staff/dashboard/page.tsx",
//         "src/app/admin/staff/profile/page.tsx",
//         "src/modules/staff/Staff.tsx",
//         "src/modules/staff/SettingStaffTab.tsx",
//         "src/modules/dashboard/staff/StaffDashboard.tsx",
//         "src/modules/dashboard/staff/StaffDetails.tsx",
//         "src/modules/attandance/Attandance.tsx",
//         "src/app/api/staff/route.ts",
//         "src/app/api/staff/attendance/route.ts",
//         "src/app/api/staff/me/route.ts",
//         "src/app/api/staff/me/checkin/route.ts",
//         "src/app/api/staff/departments/route.ts",
//         "src/app/api/staff/my-task/route.ts",
//         "src/app/api/staff/shifts/route.ts",
//         "src/app/api/staff/[id]/route.ts",
//         "src/app/api/staff/[id]/activate/route.ts",
//         "src/hooks/useStaff.ts",
//         "src/types/staff.ts",
//       ],
//     },
//     {
//       // Staff housekeeping hooks — only when housekeeping also selected
//       condition: ["housekeeping"],
//       files: [
//         "src/hooks/useCustomerHousekeeping.ts",
//         "src/types/housekeeping.ts",
//       ],
//     },
//   ],

//   // ── BILLING ──────────────────────────────────────────────────
//   billing: [
//     {
//       // Admin billing — always when billing selected
//       files: [
//         "src/app/admin/billing/page.tsx",
//         "src/app/admin/billing/[id]/page.tsx",
//         "src/app/admin/billing/[id]/print/page.tsx",
//         "src/app/api/billing/reset/route.ts",
//         "src/app/api/billing/[id]/route.ts",
//         "src/app/api/billing/[id]/payments/route.ts",
//         "src/modules/billing/Billing.tsx",
//         "src/modules/billing/InvoiceDetails.tsx",
//         "src/services/billingService.ts",
//       ],
//     },
//     {
//       // Customer billing — only when customer module is ALSO selected
//       condition: ["customer"],
//       files: [
//         "src/app/customer/billing/page.tsx",
//         "src/app/customer/billing/[id]/page.tsx",
//       ],
//     },
//     {
//       // Staff billing — only when staff module is ALSO selected
//       condition: ["staff"],
//       files: [
//         "src/app/staff/billing/page.tsx",
//         "src/app/staff/billing/[id]/page.tsx",
//       ],
//     },
//   ],

//   // ── HOUSEKEEPING ─────────────────────────────────────────────
//   housekeeping: [
//     {
//       // Admin housekeeping — always when housekeeping selected
//       files: [
//         "src/app/admin/housekeeping/page.tsx",
//         "src/app/api/housekeeping/laundry/route.ts",
//         "src/app/api/housekeeping/service-requests/route.ts",
//         "src/app/api/housekeeping/stats/route.ts",
//         "src/app/api/housekeeping/tasks/route.ts",
//         "src/app/api/housekeeping/laundry/[id]/route.ts",
//         "src/app/api/housekeeping/service-requests/[id]/route.ts",
//         "src/app/api/housekeeping/tasks/[id]/route.ts",
//         "src/hooks/useHousekeeping.ts",
//         "src/modules/houseKeeping/HouseKeeping.tsx",
//         "src/types/housekeeping.ts",
//       ],
//     },
//     {
//       // Customer housekeeping — only when customer module is ALSO selected
//       condition: ["customer"],
//       files: [
//         "src/app/customer/housekeeping/page.tsx",
//         "src/hooks/useCustomerHousekeeping.ts",
//         "src/modules/houseKeeping/CustomerHousekeeping.tsx",
//       ],
//     },
//     {
//       // Staff housekeeping — only when staff module is ALSO selected
//       condition: ["staff"],
//       files: [
//         "src/app/staff/housekeeping/page.tsx",
//         "src/modules/houseKeeping/StaffHousekeeping.tsx",
//       ],
//     },
//   ],

//   // ── INVENTORY ────────────────────────────────────────────────
//   inventory: [
//     {
//       // Admin inventory — always when inventory selected
//       files: [
//         "src/app/admin/inventory/page.tsx",
//         "src/app/admin/inventory/categories/page.tsx",
//         "src/app/admin/inventory/items/page.tsx",
//         "src/app/admin/inventory/purchase-orders/page.tsx",
//         "src/app/admin/inventory/reports/page.tsx",
//         "src/app/admin/inventory/stock-receiving/page.tsx",
//         "src/app/admin/inventory/vendors/page.tsx",
//         "src/app/admin/inventory/wastage/page.tsx",
//         "src/app/api/inventory/alerts/route.ts",
//         "src/app/api/inventory/categories/route.ts",
//         "src/app/api/inventory/dashboard/route.ts",
//         "src/app/api/inventory/items/route.ts",
//         "src/app/api/inventory/purchase-orders/route.ts",
//         "src/app/api/inventory/reports/route.ts",
//         "src/app/api/inventory/stock-receive/route.ts",
//         "src/app/api/inventory/units/route.ts",
//         "src/app/api/inventory/usage-logs/route.ts",
//         "src/app/api/inventory/vendors/route.ts",
//         "src/app/api/inventory/wastage/route.ts",
//         "src/app/api/inventory/alerts/[id]/route.ts",
//         "src/app/api/inventory/categories/[id]/route.ts",
//         "src/app/api/inventory/items/[id]/route.ts",
//         "src/app/api/inventory/purchase-orders/[id]/route.ts",
//         "src/app/api/inventory/reports/cogs/route.ts",
//         "src/app/api/inventory/reports/consumption/route.ts",
//         "src/app/api/inventory/reports/wastage/route.ts",
//         "src/app/api/inventory/stock-receive/[poId]/route.ts",
//         "src/app/api/inventory/vendors/[id]/route.ts",
//         "src/app/api/inventory/wastage/[id]/route.ts",
//         "src/hooks/useInventory.ts",
//         "src/modules/inventory/Inventory.tsx",
//         "src/modules/inventory/components/AddItemModal.tsx",
//         "src/modules/inventory/components/CategoriesPage.tsx",
//         "src/modules/inventory/components/CreatePOModal.tsx",
//         "src/modules/inventory/components/ExpiryAlertBadge.tsx",
//         "src/modules/inventory/components/InventoryItemsPage.tsx",
//         "src/modules/inventory/components/LowStockAlertBanner.tsx",
//         "src/modules/inventory/components/POStatusBadge.tsx",
//         "src/modules/inventory/components/PurchaseOrdersPage.tsx",
//         "src/modules/inventory/components/ReportsPage.tsx",
//         "src/modules/inventory/components/StockReceiveModal.tsx",
//         "src/modules/inventory/components/StockReceivingPage.tsx",
//         "src/modules/inventory/components/VendorsPage.tsx",
//         "src/modules/inventory/components/WastageModal.tsx",
//         "src/modules/inventory/components/WastagePage.tsx",
//         "src/services/inventoryService.ts",
//         "src/types/inventory.ts",
//       ],
//     },
//     {
//       // Staff inventory — only when staff module is ALSO selected
//       condition: ["staff"],
//       files: [
//         "src/app/staff/inventory/page.tsx",
//         "src/app/api/staff/inventory/route.ts",
//         "src/app/api/staff/inventory/wastage/route.ts",
//         "src/hooks/useStaffInventory.ts",
//         "src/modules/inventory/StaffInventory.tsx",
//       ],
//     },
//   ],

//   // ── KITCHEN ──────────────────────────────────────────────────
//   kitchen: [
//     {
//       // Admin kitchen — always when kitchen selected
//       files: [
//         "src/app/admin/kitchen/categories/page.tsx",
//         "src/app/admin/kitchen/dashboard/page.tsx",
//         "src/app/admin/kitchen/deliveries/page.tsx",
//         "src/app/admin/kitchen/deliverystaff/page.tsx",
//         "src/app/admin/kitchen/menu/page.tsx",
//         "src/app/admin/kitchen/orders/page.tsx",
//         "src/app/admin/kitchen/reports/page.tsx",
//         "src/app/admin/kitchen/staff/page.tsx",
//         "src/app/api/kitchen/categories/route.ts",
//         "src/app/api/kitchen/delivery/route.ts",
//         "src/app/api/kitchen/delivery-staff/route.ts",
//         "src/app/api/kitchen/delivery-stats/route.ts",
//         "src/app/api/kitchen/menu/route.ts",
//         "src/app/api/kitchen/orders/route.ts",
//         "src/app/api/kitchen/staff/route.ts",
//         "src/app/api/kitchen/staff-by-user/route.ts",
//         "src/app/api/kitchen/staff-stats/route.ts",
//         "src/app/api/kitchen/stats/route.ts",
//         "src/app/api/kitchen/tasks/route.ts",
//         "src/app/api/kitchen/upload/route.ts",
//         "src/app/api/kitchen/categories/[id]/route.ts",
//         "src/app/api/kitchen/menu/[id]/route.ts",
//         "src/app/api/kitchen/orders/[id]/route.ts",
//         "src/app/api/kitchen/staff-by-user/[userId]/route.ts",
//         "src/app/api/kitchen/tasks/[id]/route.ts",
//         "src/modules/kitchen/KitchenCategories.tsx",
//         "src/modules/kitchen/KitchenDashboard.tsx",
//         "src/modules/kitchen/KitchenMenu.tsx",
//         "src/modules/kitchen/KitchenOrders.tsx",
//         "src/modules/kitchen/KitchenReports.tsx",
//         "src/modules/kitchen/KitchenStaff.tsx",
//         "src/modules/kitchen/DeliveryAssignments.tsx",
//         "src/modules/kitchen/DeliveryStaff.tsx",
//         "src/types/kitchen.ts",
//         "src/services/kitchenService.ts",
//         "src/hooks/useKitchen.ts",
//       ],
//     },
//     {
//       // Staff kitchen — only when staff module is ALSO selected
//       condition: ["staff"],
//       files: [
//         "src/app/staff/kitchen/categories/page.tsx",
//         "src/app/staff/kitchen/dashboard/page.tsx",
//         "src/app/staff/kitchen/deliveries/page.tsx",
//         "src/app/staff/kitchen/deliverystaff/page.tsx",
//         "src/app/staff/kitchen/menu/page.tsx",
//         "src/app/staff/kitchen/orders/page.tsx",
//         "src/app/staff/kitchen/reports/page.tsx",
//         "src/app/staff/kitchen/staff/page.tsx",
//       ],
//     },
//     {
//       // Customer food ordering — only when customer module is ALSO selected
//       condition: ["customer"],
//       files: [
//         "src/context/CartContext.tsx",
//         "src/modules/kitchen/CustomerFoodOrdering.tsx",
//       ],
//     },
//   ],

//   // ── REPORTS ──────────────────────────────────────────────────
//   reports: [
//     {
//       // Admin reports — always when reports selected
//       files: [
//         "src/app/admin/reports/page.tsx",
//         "src/app/api/reports/billing/route.ts",
//         "src/app/api/reports/bookings/route.ts",
//         "src/app/api/reports/guests/route.ts",
//         "src/app/api/reports/inventory/route.ts",
//         "src/app/api/reports/kpi/route.ts",
//         "src/app/api/reports/occupancy/route.ts",
//         "src/app/api/reports/revenue/route.ts",
//         "src/app/api/reports/schedules/route.ts",
//         "src/app/api/reports/staff/route.ts",
//         "src/app/api/reports/schedules/[id]/route.ts",
//         "src/hooks/useReportModule.ts",
//         "src/modules/reports/AdminReports.tsx",
//         "src/modules/reports/Reports.tsx",
//         "src/modules/reports/components/BookingReport.tsx",
//         "src/modules/reports/components/ChartCard.tsx",
//         "src/modules/reports/components/DateRangeFilter.tsx",
//         "src/modules/reports/components/ExportButton.tsx",
//         "src/modules/reports/components/GuestReport.tsx",
//         "src/modules/reports/components/InventoryReport.tsx",
//         "src/modules/reports/components/KpiCards.tsx",
//         "src/modules/reports/components/OccupancyReport.tsx",
//         "src/modules/reports/components/RevenueReport.tsx",
//         "src/modules/reports/components/SchedulesManager.tsx",
//         "src/modules/reports/components/StaffReport.tsx",
//         "src/modules/reports/components/StatCard.tsx",
//         "src/services/reportService.ts",
//         "src/types/reports.ts",
//       ],
//     },
//     {
//       // Staff reports — only when staff module is ALSO selected
//       condition: ["staff"],
//       files: [
//         "src/app/staff/reports/page.tsx",
//       ],
//     },
//   ],
// };



// src/lib/generator/moduleFiles.ts
// Each file path is RELATIVE to hotel-template/ root
// buildProject.ts reads: hotel-template/{filePath}
// ZIP output gets:       {slug}/{filePath}

export type ModuleId =
  | "authentication"
  | "rooms"
  | "booking"
  | "customer"
  | "billing"
  | "housekeeping"
  | "inventory"
  | "staff"
  | "kitchen"
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
  "eslint.config.mjs",
  "src/app/globals.css",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/unauthorized/page.tsx",
  "src/app/not-found.tsx",
  "src/app/api/auth/[...nextauth]/route.ts",
  "src/lib/authOption.ts",
  "src/lib/axios.ts",
  "src/database/db.ts",
  "src/types/next-auth.d.ts",
  "src/proxy.ts",
  "src/providers/provider.tsx",
  "src/providers/authProvider.tsx",
  "src/utils/tailwindUtils.ts",
  "src/constant/constant.ts",

  // Components
  "src/components/landingPage/LandingPage.tsx",
  "src/components/pageNotFound/PageNotFound.tsx",
  "src/components/unauthorized/Unauthorized.tsx",
  "src/components/button/Button.tsx",
  "src/components/input/Input.tsx",
  "src/components/label/Label.tsx",
  "src/components/card/Card.tsx",
  "src/components/footer/Footer.tsx",

  // Layout
  "src/components/layout/DashboardShell.tsx",
  "src/components/sidebar/Sidebar.tsx",
  "src/components/sidebar/CollapsedNavItem.tsx",
  "src/components/sidebar/ExpandedNavItem.tsx",
  "src/components/sidebar/SidebarFooter.tsx",
  "src/components/sidebar/SidebarHeader.tsx",
  "src/components/sidebar/SidebarInner.tsx",
  "src/components/topbar/Topbar.tsx",

  // Profile
  "src/hooks/useProfile.ts",
  "src/types/profile.type.ts",
  "src/services/profileService.ts",
  "src/app/api/profile/upload-image/route.ts",
  "src/app/api/profile/route.ts",
  "src/app/admin/profile/page.tsx",
  "src/modules/profile/ProfileClient.tsx",

  // Role Layouts
  "src/app/dashboard/page.tsx",
  "src/app/admin/layout.tsx",
  "src/app/admin/dashboard/page.tsx",
  "src/app/staff/layout.tsx",
  "src/app/staff/dashboard/page.tsx",
  "src/app/customer/layout.tsx",
  "src/app/customer/dashboard/page.tsx",
  "src/modules/dashboard/admin/AdminDashboard.tsx",
  "src/modules/dashboard/customer/CustomerDashboard.tsx",
  "src/modules/dashboard/staff/StaffDashboard.tsx",
  "src/app/api/admin/dashboard/route.ts",

  // Notifications
  "src/app/admin/notifications/page.tsx",
  "src/app/customer/notifications/page.tsx",
  "src/app/staff/notifications/page.tsx",
  "src/modules/notifications/NotificationsPage.tsx",
  "src/hooks/useNotifications.ts",
  "src/services/notificationService.ts",
  "src/app/api/debug/notifications/route.ts",
  "src/app/api/notifications/route.ts",
  "src/app/api/notifications/[id]/route.ts",
];

// ─── MODULE FILES ─────────────────────────────────────────────
// Only copied when that module is selected
// Note: Dependencies (like customer booking) are handled by user selection,
// not by automatic file conditions
export const MODULE_FILES: Record<ModuleId, string[]> = {
  authentication: [
    "src/app/(auth)/login/page.tsx",
    "src/app/(auth)/signup/page.tsx",
    "src/app/(auth)/forgetPassword/page.tsx",
    "src/app/(auth)/resetPassword/page.tsx",
    "src/modules/auth/loginForm/LoginForm.tsx",
    "src/modules/auth/signupForm/SignupForm.tsx",
    "src/modules/auth/ForgetForm/ForgetForm.tsx",
    "src/modules/auth/resetForm/ResetForm.tsx",
    "src/app/api/forget/route.ts",
    "src/app/api/forget/reset/route.ts",
    "src/app/api/signup/route.ts",
    "src/services/authService.ts",
    "src/lib/sendEmail.ts",
  ],

  rooms: [
    "src/app/admin/rooms/page.tsx",
    "src/modules/rooms/Rooms.tsx",
    "src/hooks/useRooms.ts",
    "src/modules/rooms/components/ConfirmDialog.tsx",
    "src/modules/rooms/components/RoomModal.tsx",
    "src/modules/rooms/components/ViewRoomModal.tsx",
    "src/app/api/rooms/route.ts",
    "src/app/api/rooms/[id]/route.ts",
    "src/app/api/rooms/upload/route.ts",
    "src/services/roomService.ts",
  ],

  booking: [
    "src/app/admin/booking/page.tsx",
    "src/app/api/bookings/route.ts",
    "src/app/api/bookings/[id]/route.ts",
    "src/app/api/bookings/available-rooms/route.ts",
    "src/modules/bookings/AdminBookings.tsx",
    "src/hooks/useBookings.ts",
    "src/types/bookings.ts",
    "src/services/bookingService.ts",
    // Customer booking page - only if customer also selected (user must select both)
    "src/app/customer/booking/page.tsx",
    "src/modules/bookings/CustomerBookings.tsx",
  ],

  customer: [
    "src/app/admin/customer/page.tsx",
    "src/modules/customers/Customer.tsx",
    "src/app/api/customers/route.ts",
    "src/app/api/customers/[id]/route.ts",
    "src/app/api/customers/service-requests/route.ts",
    "src/app/api/customers/active-booking/route.ts",
    "src/hooks/useCustomerModule.ts",
    "src/hooks/useCustomers.ts",
    "src/services/customers.service.ts",
    "src/types/customers.ts",
  ],

  staff: [
    "src/app/admin/staff/page.tsx",
    "src/app/staff/booking/page.tsx",
    "src/app/staff/attendance/page.tsx",
    "src/app/admin/staff/dashboard/page.tsx",
    "src/app/admin/staff/profile/page.tsx",
    "src/modules/staff/Staff.tsx",
    "src/modules/staff/SettingStaffTab.tsx",
    "src/modules/dashboard/staff/StaffDashboard.tsx",
    "src/modules/dashboard/staff/StaffDetails.tsx",
    "src/modules/attandance/Attandance.tsx",
    "src/app/api/staff/route.ts",
    "src/app/api/staff/attendance/route.ts",
    "src/app/api/staff/me/route.ts",
    "src/app/api/staff/me/checkin/route.ts",
    "src/app/api/staff/departments/route.ts",
    "src/app/api/staff/my-task/route.ts",
    "src/app/api/staff/shifts/route.ts",
    "src/app/api/staff/[id]/route.ts",
    "src/app/api/staff/[id]/activate/route.ts",
    "src/hooks/useStaff.ts",
    "src/types/staff.ts",
  ],

  billing: [
    "src/app/admin/billing/page.tsx",
    "src/app/admin/billing/[id]/page.tsx",
    "src/app/admin/billing/[id]/print/page.tsx",
    "src/app/api/billing/reset/route.ts",
    "src/app/api/billing/[id]/route.ts",
    "src/app/api/billing/[id]/payments/route.ts",
    "src/modules/billing/Billing.tsx",
    "src/modules/billing/InvoiceDetails.tsx",
    "src/services/billingService.ts",
    // Customer billing - requires customer module
    "src/app/customer/billing/page.tsx",
    "src/app/customer/billing/[id]/page.tsx",
    // Staff billing - requires staff module
    "src/app/staff/billing/page.tsx",
    "src/app/staff/billing/[id]/page.tsx",
  ],

  housekeeping: [
    "src/app/admin/housekeeping/page.tsx",
    "src/app/api/housekeeping/laundry/route.ts",
    "src/app/api/housekeeping/service-requests/route.ts",
    "src/app/api/housekeeping/stats/route.ts",
    "src/app/api/housekeeping/tasks/route.ts",
    "src/app/api/housekeeping/laundry/[id]/route.ts",
    "src/app/api/housekeeping/service-requests/[id]/route.ts",
    "src/app/api/housekeeping/tasks/[id]/route.ts",
    "src/hooks/useHousekeeping.ts",
    "src/modules/houseKeeping/HouseKeeping.tsx",
    "src/types/housekeeping.ts",
    // Customer housekeeping - requires customer module
    "src/app/customer/housekeeping/page.tsx",
    "src/modules/houseKeeping/CustomerHousekeeping.tsx",
    "src/hooks/useCustomerHousekeeping",
        // Staff housekeeping - requires staff module
    "src/app/staff/housekeeping/page.tsx",
    "src/modules/houseKeeping/StaffHousekeeping.tsx",
  ],

  inventory: [
    "src/app/admin/inventory/page.tsx",
    "src/app/admin/inventory/categories/page.tsx",
    "src/app/admin/inventory/items/page.tsx",
    "src/app/admin/inventory/purchase-orders/page.tsx",
    "src/app/admin/inventory/reports/page.tsx",
    "src/app/admin/inventory/stock-receiving/page.tsx",
    "src/app/admin/inventory/vendors/page.tsx",
    "src/app/admin/inventory/wastage/page.tsx",
    "src/app/api/inventory/alerts/route.ts",
    "src/app/api/inventory/categories/route.ts",
    "src/app/api/inventory/dashboard/route.ts",
    "src/app/api/inventory/items/route.ts",
    "src/app/api/inventory/purchase-orders/route.ts",
    "src/app/api/inventory/reports/route.ts",
    "src/app/api/inventory/stock-receive/route.ts",
    "src/app/api/inventory/units/route.ts",
    "src/app/api/inventory/usage-logs/route.ts",
    "src/app/api/inventory/vendors/route.ts",
    "src/app/api/inventory/wastage/route.ts",
    "src/app/api/inventory/alerts/[id]/route.ts",
    "src/app/api/inventory/categories/[id]/route.ts",
    "src/app/api/inventory/items/[id]/route.ts",
    "src/app/api/inventory/purchase-orders/[id]/route.ts",
    "src/app/api/inventory/reports/cogs/route.ts",
    "src/app/api/inventory/reports/consumption/route.ts",
    "src/app/api/inventory/reports/wastage/route.ts",
    "src/app/api/inventory/stock-receive/[poId]/route.ts",
    "src/app/api/inventory/vendors/[id]/route.ts",
    "src/app/api/inventory/wastage/[id]/route.ts",
    "src/hooks/useInventory.ts",
    "src/modules/inventory/Inventory.tsx",
    "src/modules/inventory/components/AddItemModal.tsx",
    "src/modules/inventory/components/CategoriesPage.tsx",
    "src/modules/inventory/components/CreatePOModal.tsx",
    "src/modules/inventory/components/ExpiryAlertBadge.tsx",
    "src/modules/inventory/components/InventoryItemsPage.tsx",
    "src/modules/inventory/components/LowStockAlertBanner.tsx",
    "src/modules/inventory/components/POStatusBadge.tsx",
    "src/modules/inventory/components/PurchaseOrdersPage.tsx",
    "src/modules/inventory/components/ReportsPage.tsx",
    "src/modules/inventory/components/StockReceiveModal.tsx",
    "src/modules/inventory/components/StockReceivingPage.tsx",
    "src/modules/inventory/components/VendorsPage.tsx",
    "src/modules/inventory/components/WastageModal.tsx",
    "src/modules/inventory/components/WastagePage.tsx",
    "src/services/inventoryService.ts",
    "src/types/inventory.ts",
    // Staff inventory - requires staff module
    "src/app/staff/inventory/page.tsx",
    "src/hooks/useStaffInventory.ts",
    "src/modules/inventory/StaffInventory.tsx",
  ],

  kitchen: [
    "src/app/admin/kitchen/categories/page.tsx",
    "src/app/admin/kitchen/dashboard/page.tsx",
    "src/app/admin/kitchen/deliveries/page.tsx",
    "src/app/admin/kitchen/deliverystaff/page.tsx",
    "src/app/admin/kitchen/menu/page.tsx",
    "src/app/admin/kitchen/orders/page.tsx",
    "src/app/admin/kitchen/reports/page.tsx",
    "src/app/admin/kitchen/staff/page.tsx",
    "src/app/api/kitchen/categories/route.ts",
    "src/app/api/kitchen/delivery/route.ts",
    "src/app/api/kitchen/delivery-staff/route.ts",
    "src/app/api/kitchen/delivery-stats/route.ts",
    "src/app/api/kitchen/menu/route.ts",
    "src/app/api/kitchen/orders/route.ts",
    "src/app/api/kitchen/staff/route.ts",
    "src/app/api/kitchen/staff-by-user/route.ts",
    "src/app/api/kitchen/staff-stats/route.ts",
    "src/app/api/kitchen/stats/route.ts",
    "src/app/api/kitchen/tasks/route.ts",
    "src/app/api/kitchen/upload/route.ts",
    "src/app/api/kitchen/categories/[id]/route.ts",
    "src/app/api/kitchen/menu/[id]/route.ts",
    "src/app/api/kitchen/orders/[id]/route.ts",
    "src/app/api/kitchen/staff-by-user/[userId]/route.ts",
    "src/app/api/kitchen/tasks/[id]/route.ts",
    "src/modules/kitchen/KitchenCategories.tsx",
    "src/modules/kitchen/KitchenDashboard.tsx",
    "src/modules/kitchen/KitchenMenu.tsx",
    "src/modules/kitchen/KitchenOrders.tsx",
    "src/modules/kitchen/KitchenReports.tsx",
    "src/modules/kitchen/KitchenStaff.tsx",
    "src/modules/kitchen/DeliveryAssignments.tsx",
    "src/modules/kitchen/DeliveryStaff.tsx",
    "src/types/kitchen.ts",
    "src/services/kitchenService.ts",
    "src/hooks/useKitchen.ts",
    // Staff kitchen - requires staff module
    "src/app/staff/kitchen/categories/page.tsx",
    "src/app/staff/kitchen/dashboard/page.tsx",
    "src/app/staff/kitchen/deliveries/page.tsx",
    "src/app/staff/kitchen/deliverystaff/page.tsx",
    "src/app/staff/kitchen/menu/page.tsx",
    "src/app/staff/kitchen/orders/page.tsx",
    "src/app/staff/kitchen/reports/page.tsx",
    "src/app/staff/kitchen/staff/page.tsx",
    // Customer kitchen - requires customer module
    "src/context/CartContext.tsx",
    "src/modules/kitchen/CustomerFoodOrdering.tsx",
  ],

  reports: [
    "src/app/admin/reports/page.tsx",
    "src/app/api/reports/billing/route.ts",
    "src/app/api/reports/bookings/route.ts",
    "src/app/api/reports/guests/route.ts",
    "src/app/api/reports/inventory/route.ts",
    "src/app/api/reports/kpi/route.ts",
    "src/app/api/reports/occupancy/route.ts",
    "src/app/api/reports/revenue/route.ts",
    "src/app/api/reports/schedules/route.ts",
    "src/app/api/reports/staff/route.ts",
    "src/app/api/reports/schedules/[id]/route.ts",
    "src/hooks/useReportModule.ts",
    "src/modules/reports/AdminReports.tsx",
    "src/modules/reports/Reports.tsx",
    "src/modules/reports/components/BookingReport.tsx",
    "src/modules/reports/components/ChartCard.tsx",
    "src/modules/reports/components/DateRangeFilter.tsx",
    "src/modules/reports/components/ExportButton.tsx",
    "src/modules/reports/components/GuestReport.tsx",
    "src/modules/reports/components/InventoryReport.tsx",
    "src/modules/reports/components/KpiCards.tsx",
    "src/modules/reports/components/OccupancyReport.tsx",
    "src/modules/reports/components/RevenueReport.tsx",
    "src/modules/reports/components/SchedulesManager.tsx",
    "src/modules/reports/components/StaffReport.tsx",
    "src/modules/reports/components/StatCard.tsx",
    "src/services/reportService.ts",
    "src/types/reports.ts",
    // Staff reports - requires staff module
    "src/app/staff/reports/page.tsx",
  ],
};