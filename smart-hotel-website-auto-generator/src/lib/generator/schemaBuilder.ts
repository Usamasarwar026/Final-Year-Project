// src/lib/generator/schemaBuilder.ts
// Dynamically builds prisma/schema.prisma based on selected modules.

import { ModuleId } from "./moduleFiles";

type TierId = "basic" | "intermediate" | "advanced";

// ─── PRISMA HEADER ────────────────────────────────────────────
const SCHEMA_HEADER = `generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
`;

// ─── BASE ENUMS (always) ───────────────────────────────────────
// const BASE_ENUMS = `
// enum Role {
//   ADMIN
//   STAFF
//   CUSTOMER
// }
// `;

function getBaseEnums(tier: TierId): string {
  if (tier === "basic") {
    return `
enum Role {
  ADMIN
}
`;
  }
  
  return `
enum Role {
  ADMIN
  STAFF
  CUSTOMER
}
`;
}


// ─── NOTIFICATION (always included) ────────────────────────────
const NOTIFICATION_MODEL = `
model Notification {
  notification_id                Int      @id @default(autoincrement())
  title             String
  message           String   @db.Text
  type              String
  priority          String   @default("Medium")
  module            String
  reference_id      String?
  recipient_user_id String
  sender_user_id    String?
  role_target       String?
  is_read           Boolean  @default(false)
  created_at        DateTime @default(now())

  @@index([recipient_user_id])
  @@index([is_read])
  @@index([created_at])
  @@map("notifications")
}
`;

// ─── BASE: User model ──────────────────────────────────────────
function buildUserModel(modules: Set<ModuleId>, tier: TierId): string {
  const hasStaff = modules.has("staff") && tier !== "basic";
  const hasBooking = modules.has("booking");
  const hasKitchen = modules.has("kitchen") && tier !== "basic";
  const hasBilling = modules.has("billing");

  if (tier === "basic") {
    return `
    model User {
  id             String          @id @default(cuid())
  email          String          @unique
  phoneNumber    String?
  password       String
  profileImage   String?
  address        String?
  city           String?
  country        String?
  role           Role            
  isVerified     Boolean         @default(false)
  isActive       Boolean         @default(true)
  lastLogin      DateTime?
  resetToken     String?
  resetTokenExp  DateTime?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  name           String
  cnic           String?
  dateOfBirth    DateTime?
  ${hasBooking ? "bookings       Booking[]" : ""}
}
`;
  }
  return `
model User {
  id             String          @id @default(cuid())
  email          String          @unique
  phoneNumber    String?
  password       String
  profileImage   String?
  address        String?
  city           String?
  country        String?
  role           Role            @default(CUSTOMER)
  employeeId     String?         @unique
  designation    String?
  salary         Float?
  isVerified     Boolean         @default(false)
  isActive       Boolean         @default(true)
  lastLogin      DateTime?
  resetToken     String?
  resetTokenExp  DateTime?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  name           String
  permissions    String[]        @default([])
  cnic           String?
  createdByAdmin Boolean         @default(false)
  dateOfBirth    DateTime?
  ${hasStaff ? "attendance     AttendanceLog[]" : ""}
  ${hasBooking ? "bookings       Booking[]" : ""}
  ${hasKitchen ? "foodOrders     FoodOrder[]" : ""}
  ${hasStaff ? "staffProfile   Staff?" : ""}
  ${hasBilling ? "BillingInvoice       BillingInvoice[]" : ""}
}
`;
}

// ─── STAFF MODELS ──────────────────────────────────────────────
function buildStaffModels(modules: Set<ModuleId>, tier: TierId): string {
   if (tier === "basic") return "";
  const hasHousekeeping = modules.has("housekeeping");
  const hasKitchen = modules.has("kitchen");

  return `
model DepartmentConfig {
  id         Int      @id @default(autoincrement())
  name       String   @unique
  icon       String   @default("👤")
  color      String   @default("text-gray-700")
  bg         String   @default("bg-gray-100")
  is_active  Boolean  @default(true)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  staff      Staff[]

  @@map("department_configs")
}

model ShiftConfig {
  id         Int      @id @default(autoincrement())
  name       String   @unique
  start_time String
  end_time   String
  color      String   @default("text-gray-700")
  bg         String   @default("bg-gray-50 border-gray-200")
  is_active  Boolean  @default(true)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  staff      Staff[]

  @@map("shift_configs")
}

model Staff {
  staff_id                Int                @id @default(autoincrement())
  user_id           String             @unique
  cnic              String?            @unique
  designation       String
  joining_date      DateTime?          @db.Date
  basic_salary      Decimal?           @db.Decimal(10, 2)
  attendance_status AttendanceStatus?
  performance_notes String?
  is_on_duty        Boolean            @default(false)
  is_active         Boolean            @default(true)
  created_at        DateTime           @default(now())
  updated_at        DateTime           @updatedAt
  department_id     Int?
  shift_id          Int?
  attendance        AttendanceLog[]
  ${hasHousekeeping ? "assignedTasks HousekeepingTask[]" : ""}
  ${hasKitchen ? "kitchenTasks  KitchenTask[]" : ""}
  department        DepartmentConfig?        @relation(fields: [department_id], references: [id])
  shift             ShiftConfig?             @relation(fields: [shift_id], references: [id])
  user              User               @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([department_id])
  @@index([is_active])
  @@index([is_on_duty])
  @@map("staff")
}

model AttendanceLog {
  id         Int              @id @default(autoincrement())
  staff_id   Int
  user_id    String
  date       DateTime         @db.Date
  status     AttendanceStatus
  check_in   DateTime?
  check_out  DateTime?
  hours      Float?
  notes      String?
  created_at DateTime         @default(now())
  updated_at DateTime         @updatedAt
  staff      Staff            @relation(fields: [staff_id], references: [staff_id], onDelete: Cascade)
  user       User             @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([staff_id, date])
  @@index([date])
  @@index([staff_id])
  @@map("attendance_logs")
}

enum AttendanceStatus {
  Present
  Absent
  HalfDay
  Leave
}
`;
}

// ─── ROOMS MODELS ──────────────────────────────────────────────
function buildRoomsModels(modules: Set<ModuleId>, tier: TierId): string {
  const hasHousekeeping = modules.has("housekeeping") && tier !== "basic";
  const hasBooking = modules.has("booking");

   
  return `
model Room {
  room_id                Int                @id @default(autoincrement())
  room_number       String             @unique
  floor             Int
  room_type         RoomType           @default(Single)
  status            RoomStatus         @default(Available)
  price_per_night   Decimal            @db.Decimal(10, 2)
  capacity          Int                @default(2)
  bed_type          BedType            @default(Double)
  size_sqft         Int?
  amenities         Json?
  photos            Json?
  description       String?
  is_active         Boolean            @default(true)
  created_at        DateTime           @default(now())
  updated_at        DateTime           @updatedAt
  cleaning_status   CleaningStatus     @default(Clean)
  ${hasHousekeeping ? "housekeepingTasks HousekeepingTask[]" : ""}
  ${hasHousekeeping ? "laundryRecords    LaundryRecord[]" : ""}
  ${hasHousekeeping ? "serviceRequests   ServiceRequest[]" : ""}
  ${hasBooking ? "bookings          Booking[]" : ""}

  @@index([status])
  @@index([room_type])
  @@index([is_active])
  @@map("rooms")
}

enum RoomType {
   Single
  Double
  Suite
  Deluxe
  Presidential
}

enum RoomStatus {
  Available
  Reserved
  Occupied
  Maintenance
}

enum BedType {
 Single
  Double
  Queen
  King
  Twin
}

enum CleaningStatus {
   Clean
  Dirty
  InProgress
}
`;
}

// ─── BOOKING MODELS ────────────────────────────────────────────
function buildBookingModels(modules: Set<ModuleId>, tier: TierId): string {
  const hasHousekeeping = modules.has("housekeeping");
  const hasKitchen = modules.has("kitchen") && tier !== "basic";
  const hasBilling = modules.has("billing");

  if (tier === "basic") {
    return `
model Booking {
  booking_id                Int                @id @default(autoincrement())
  user_id           String
  room_id           Int
  check_in_date     DateTime           @db.Date
  check_out_date    DateTime           @db.Date
  actual_check_in   DateTime?
  actual_check_out  DateTime?
  status            BookingStatus      @default(Pending)
  total_nights      Int
  total_amount      Decimal            @db.Decimal(10, 2)
  special_requests  String?
  confirmation_sent Boolean            @default(false)
  created_at        DateTime           @default(now())
  updated_at        DateTime           @updatedAt
  source            BookingSource      @default(ADMIN)
  room              Room               @relation(fields: [room_id], references: [room_id])
  user              User               @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([room_id])
  @@index([status])
  @@index([check_in_date])
  @@map("booking_reservation")
}

enum BookingStatus {
  Pending
  Confirmed
  CheckedIn
  CheckedOut
  Cancelled
}

enum BookingSource {
  ADMIN
}
`;
  }


  return `
model Booking {
  booking_id                Int                @id @default(autoincrement())
  user_id           String
  room_id           Int
  check_in_date     DateTime           @db.Date
  check_out_date    DateTime           @db.Date
  actual_check_in   DateTime?
  actual_check_out  DateTime?
  status            BookingStatus      @default(Pending)
  total_nights      Int
  total_amount      Decimal            @db.Decimal(10, 2)
  special_requests  String?
  confirmation_sent Boolean            @default(false)
  created_at        DateTime           @default(now())
  updated_at        DateTime           @updatedAt
  source            BookingSource      @default(CUSTOMER)
  ${hasHousekeeping ? "housekeepingTasks HousekeepingTask[]" : ""}
  ${hasHousekeeping ? "laundryRecords    LaundryRecord[]" : ""}
  ${hasHousekeeping ? "serviceRequests   ServiceRequest[]" : ""}
  ${hasKitchen ? "foodOrders        FoodOrder[]" : ""}
  ${hasBilling ? "BillingInvoice           BillingInvoice?" : ""}
  room              Room               @relation(fields: [room_id], references: [room_id])
  user              User               @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([room_id])
  @@index([status])
  @@index([check_in_date])
  @@map("booking_reservation")
}

enum BookingStatus {
  Pending
  Confirmed
  CheckedIn  @map("Checked-In")
  CheckedOut @map("Checked-Out")
  Cancelled
}

enum BookingSource {
  CUSTOMER
  ADMIN
}
`;
}

// ─── HOUSEKEEPING MODELS ───────────────────────────────────────
function buildHousekeepingModels(modules: Set<ModuleId>, tier: TierId): string {
  if (tier === "basic") return "";
   const hasStaff = modules.has("staff");
  const hasBooking = modules.has("booking");
  const hasRooms = modules.has("rooms");

  return `
model HousekeepingTask {
  task_id                  Int          @id @default(autoincrement())
  ${hasRooms ? "room_id             Int?" : ""}
  ${hasStaff ? "assigned_to         Int?" : ""}
  ${hasBooking ? "booking_id          Int?" : ""}
  task_type           TaskType
  priority            TaskPriority
  status              TaskStatus   @default(Pending)
  request_description String?
  is_billable         Boolean      @default(false)
  charge_amount       Decimal?     @db.Decimal(10, 2)
  started_at          DateTime?
  completed_at        DateTime?
  created_at          DateTime     @default(now())
  updated_at          DateTime     @updatedAt
  ${hasStaff ? "assignedStaff       Staff?       @relation(fields: [assigned_to], references: [staff_id])" : ""}
  ${hasBooking ? "booking             Booking?     @relation(fields: [booking_id], references: [booking_id])" : ""}
  ${hasRooms ? "room                Room?        @relation(fields: [room_id], references: [room_id])" : ""}

}

model ServiceRequest {
  request_id           Int           @id @default(autoincrement())
  ${hasBooking ? "booking_id   Int" : ""}
  ${hasRooms ? "room_id      Int" : ""}
  request_type RequestType
  description  String?
  status       RequestStatus @default(Pending)
  created_at   DateTime      @default(now())
  updated_at   DateTime      @updatedAt
  ${hasBooking ? "booking      Booking       @relation(fields: [booking_id], references: [booking_id])" : ""}
  ${hasRooms ? "room         Room          @relation(fields: [room_id], references: [room_id])" : ""}


}

model LaundryRecord {
  text_id            Int           @id @default(autoincrement())
  ${hasRooms ? "room_id       Int" : ""}
  ${hasBooking ? "booking_id    Int?" : ""}
  item_name     String
  quantity      Int
  sent_at       DateTime      @default(now())
  returned_at   DateTime?
  charge_amount Decimal?      @db.Decimal(10, 2)
  status        LaundryStatus @default(Pending)
  ${hasBooking ? "booking       Booking?      @relation(fields: [booking_id], references: [booking_id])" : ""}
  ${hasRooms ? "room          Room          @relation(fields: [room_id], references: [room_id])" : ""}

}

enum TaskType {
   Cleaning
  LaundryPickup
  ServiceRequest
  Maintenance
}

enum TaskPriority {
  Normal
  High
  VIP
}

enum TaskStatus {
  Pending
  InProgress
  Done
  Cancelled
}

enum RequestType {
   Towels
  Laundry
  RoomService
  Water
  Other
}

enum RequestStatus {
  Pending
  Assigned
  Completed
  Cancelled
}

enum LaundryStatus {
  Pending
  Sent
  Returned
}
`;
}

// ─── KITCHEN MODELS ────────────────────────────────────────────
function buildKitchenModels(modules: Set<ModuleId>, tier: TierId): string {
  if (tier === "basic") return "";
  const hasBooking = modules.has("booking");
  const hasStaff = modules.has("staff");

  return `
model FoodOrder {
  id                    Int      @id @default(autoincrement())
  ${hasBooking ? "booking_id            Int?" : ""}
  user_id               String?
  customer_name         String
  order_type            OrderType
  room_number           String?
  table_number          String?
  total_amount          Decimal  @db.Decimal(10,2)
  special_instructions  String?
  status                FoodOrderStatus @default(Pending)
  placed_at             DateTime @default(now())
  accepted_at           DateTime?
  preparing_at          DateTime?
  ready_at              DateTime?
  delivered_at          DateTime?
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  ${hasBooking ? "booking               Booking? @relation(fields:[booking_id], references:[booking_id])" : ""}
  user                  User?    @relation(fields:[user_id], references:[id])
  items                 FoodOrderItem[]
  timelines             FoodOrderTimeline[]
  ${hasStaff ? "tasks                 KitchenTask[]" : ""}

  @@index([status])
  ${hasBooking ? "@@index([booking_id])" : ""}
  @@index([user_id])
  @@map("food_orders")
}

model FoodCategory {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  active      Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  foodItems   FoodItem[]

  @@map("food_categories")
}

model FoodItem {
  id                       Int       @id @default(autoincrement())
  name                     String
  category_id              Int
  description              String?
  image                    String?
  price                    Decimal   @db.Decimal(10,2)
  preparation_time_minutes Int       @default(15)
  ingredients_text         String?
  availability_status      Boolean   @default(true)
  featured                 Boolean   @default(false)
  active                   Boolean   @default(true)
  created_at               DateTime  @default(now())
  updated_at               DateTime  @updatedAt
  category                 FoodCategory @relation(fields:[category_id], references:[id])
  orderItems               FoodOrderItem[]

  @@index([category_id])
  @@index([active])
  @@index([availability_status])
  @@map("food_items")
}

model FoodOrderItem {
  id           Int @id @default(autoincrement())
  order_id     Int
  food_item_id Int
  quantity     Int
  price        Decimal @db.Decimal(10,2)
  subtotal     Decimal @db.Decimal(10,2)
  special_note String?
  order        FoodOrder @relation(fields:[order_id], references:[id], onDelete: Cascade)
  foodItem     FoodItem @relation(fields:[food_item_id], references:[id])

  @@index([order_id])
  @@map("food_order_items")
}

model FoodOrderTimeline {
  id         Int @id @default(autoincrement())
  order_id   Int
  status     FoodOrderStatus
  notes      String?
  created_at DateTime @default(now())
  order      FoodOrder @relation(fields:[order_id], references:[id], onDelete: Cascade)

  @@index([order_id])
  @@map("food_order_timelines")
}

${
  hasStaff
    ? `
model KitchenTask {
  id            Int @id @default(autoincrement())
  order_id      Int
  assigned_to   Int?
  status        KitchenTaskStatus @default(Assigned)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  order         FoodOrder @relation(fields:[order_id], references:[id], onDelete: Cascade)
  assignedStaff Staff? @relation(fields:[assigned_to], references:[staff_id])

  @@index([assigned_to])
  @@map("kitchen_tasks")
}

enum KitchenTaskStatus {
   Assigned
  Accepted
  InProgress
  Completed
}
`
    : ""
}

enum FoodOrderStatus {
  Pending
  Accepted
  Preparing
  Ready
  Assigned
  OutForDelivery
  Delivered
  Cancelled
}

enum OrderStatus {
  Placed
  Accepted
  Preparing
  Ready
  OutForDelivery
  Delivered
  Cancelled
}
enum OrderType {
  RoomService
  Restaurant
}
`;
}

// ─── BILLING MODELS ────────────────────────────────────────────
function buildBillingModels(): string {
  return `
model BillingInvoice {
  invoice_id             Int              @id @default(autoincrement())
  invoice_number String           @unique
  booking_id     Int              @unique
  guest_id       String
  room_charges   Decimal          @db.Decimal(10, 2)
  service_charges Decimal          @db.Decimal(10, 2)
  food_charges   Decimal          @db.Decimal(10, 2)
  subtotal       Decimal          @db.Decimal(10, 2)
  tax_percent    Decimal          @db.Decimal(5, 2) @default(10.00)
  tax_amount     Decimal          @db.Decimal(10, 2)
  discount_percent Decimal        @db.Decimal(5, 2) @default(0.00)
  discount_amount Decimal          @db.Decimal(10, 2)
  total_amount   Decimal          @db.Decimal(10, 2)
  amount_paid    Decimal          @db.Decimal(10, 2) @default(0.00)
  balance_due    Decimal          @db.Decimal(10, 2)
  payment_status String           @default("Unpaid")
  generated_at   DateTime         @default(now())
  booking        Booking          @relation(fields: [booking_id], references: [booking_id], onDelete: Cascade)
  guest          User             @relation(fields: [guest_id], references: [id], onDelete: Cascade)
  payments       InvoicePayment[]

  @@index([guest_id])
  @@index([booking_id])
  @@index([payment_status])
  @@map("billing_invoice")
}

model InvoicePayment {
  payment_id             Int            @id @default(autoincrement())
  invoice_id     Int
  amount_paid    Decimal        @db.Decimal(10, 2)
  payment_method String
  recorded_at    DateTime       @default(now())
  notes          String?
  invoice        BillingInvoice        @relation(fields: [invoice_id], references: [invoice_id], onDelete: Cascade)

  @@index([invoice_id])
  @@map("invoice_payments")
}
`;
}

// ─── INVENTORY MODELS ──────────────────────────────────────────
function buildInventoryModels(): string {
  return `
model InventoryUnit {
  id         Int             @id @default(autoincrement())
  name       String          @unique
  is_active  Boolean         @default(true)
  created_at DateTime        @default(now())
  updated_at DateTime        @updatedAt
  items      InventoryItem[]

  @@map("inventory_units")
}

model InventoryCategory {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  icon        String   @default("📦")
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  items       InventoryItem[]

  @@map("inventory_categories")
}

model InventoryVendor {
  id           Int      @id @default(autoincrement())
  name         String
  contact_name String?
  email        String?
  phone        String?
  address      String?
  is_active    Boolean  @default(true)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  itemVendors    InventoryItemVendor[]
  purchaseOrders PurchaseOrder[]

  @@map("inventory_vendors")
}

model InventoryItem {
  id                  Int                   @id @default(autoincrement())
  name                String
  sku                 String?               @unique
  category_id         Int
  unit_id             Int?
  unit                String
  quantity            Float                 @default(0)
  low_stock_threshold Float                 @default(10)
  unit_cost           Float                 @default(0)
  expiry_date         DateTime?
  location            String?
  is_active           Boolean               @default(true)
  notes               String?
  created_at          DateTime              @default(now())
  updated_at          DateTime              @updatedAt
  category            InventoryCategory     @relation(fields: [category_id], references: [id])
  unitConfig          InventoryUnit?        @relation(fields: [unit_id], references: [id])
  itemVendors         InventoryItemVendor[]
  usageLogs           InventoryUsageLog[]
  wastageRecords      WastageRecord[]
  poItems             PurchaseOrderItem[]
  alerts              LowStockAlert[]

  @@index([category_id])
  @@index([unit_id])
  @@index([is_active])
  @@index([expiry_date])
  @@map("inventory_items")
}

model InventoryItemVendor {
  id             Int      @id @default(autoincrement())
  item_id        Int
  vendor_id      Int
  unit_price     Float
  lead_time_days Int      @default(1)
  is_preferred   Boolean  @default(false)
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
  item   InventoryItem   @relation(fields: [item_id], references: [id], onDelete: Cascade)
  vendor InventoryVendor @relation(fields: [vendor_id], references: [id], onDelete: Cascade)

  @@unique([item_id, vendor_id])
  @@map("inventory_item_vendors")
}

model PurchaseOrder {
  id          Int      @id @default(autoincrement())
  po_number   String   @unique
  vendor_id   Int
  status      POStatus @default(Pending)
  ordered_by  String
  notes       String?
  total_cost  Float    @default(0)
  ordered_at  DateTime @default(now())
  sent_at     DateTime?
  received_at DateTime?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  vendor InventoryVendor     @relation(fields: [vendor_id], references: [id])
  items  PurchaseOrderItem[]

  @@index([status])
  @@index([vendor_id])
  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id                Int           @id @default(autoincrement())
  po_id             Int
  item_id           Int
  ordered_quantity  Float
  received_quantity Float         @default(0)
  unit_price        Float
  subtotal          Float
  po   PurchaseOrder @relation(fields: [po_id], references: [id], onDelete: Cascade)
  item InventoryItem @relation(fields: [item_id], references: [id])

  @@index([po_id])
  @@map("purchase_order_items")
}

model InventoryUsageLog {
  id            Int                 @id @default(autoincrement())
  item_id       Int
  quantity_used Float
  department    InventoryDepartment
  used_by       String
  reference_id  String?
  notes         String?
  used_at       DateTime            @default(now())
  created_at    DateTime            @default(now())
  item InventoryItem @relation(fields: [item_id], references: [id])

  @@index([item_id])
  @@index([department])
  @@index([used_at])
  @@map("inventory_usage_logs")
}

model WastageRecord {
  id          Int           @id @default(autoincrement())
  item_id     Int
  quantity    Float
  reason      WastageReason
  unit_cost   Float
  total_cost  Float
  reported_by String
  notes       String?
  wasted_at   DateTime      @default(now())
  created_at  DateTime      @default(now())
  updated_at  DateTime      @updatedAt
  item InventoryItem @relation(fields: [item_id], references: [id])

  @@index([item_id])
  @@index([wasted_at])
  @@map("wastage_records")
}

model LowStockAlert {
  id               Int         @id @default(autoincrement())
  item_id          Int
  current_quantity Float
  threshold        Float
  status           AlertStatus @default(Active)
  resolved_by      String?
  resolved_at      DateTime?
  created_at       DateTime    @default(now())
  updated_at       DateTime    @updatedAt
  item InventoryItem @relation(fields: [item_id], references: [id])

  @@index([status])
  @@index([item_id])
  @@map("low_stock_alerts")
}

enum POStatus {
   Pending
  Sent
  PartiallyReceived
  Received
  Cancelled
}

enum InventoryDepartment {
   Kitchen
  Housekeeping
  Bar
  Maintenance
  Reception
  General
}

enum WastageReason {
  Expired
  Damaged
  Lost
  Other
}

enum AlertStatus {
   Active
  Resolved
  Dismissed
}
`;
}

// ─── REPORTS MODELS ────────────────────────────────────────────
function buildReportsModels(): string {
  return `
model ReportSchedule {
  id          Int      @id @default(autoincrement())
  report_type String
  frequency   String
  is_active   Boolean  @default(true)
  created_by  String
  last_run_at DateTime?
  next_run_at DateTime?
  parameters  Json?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([is_active])
  @@index([report_type])
  @@map("report_schedules")
}
`;
}

// ─── MAIN BUILDER ──────────────────────────────────────────────
export function buildSchema(modules: ModuleId[], tier: TierId): string {
  const set = new Set<ModuleId>(modules);
  const parts: string[] = [];

  parts.push(SCHEMA_HEADER);
  parts.push(buildUserModel(set, tier));
  parts.push(getBaseEnums(tier));
  parts.push(NOTIFICATION_MODEL);

  const staffModels = buildStaffModels(set, tier)
  if (staffModels) parts.push(staffModels);
  if (set.has("rooms")) {
    parts.push(buildRoomsModels(set, tier));
  }

  if (set.has("booking")) {
    parts.push(buildBookingModels(set, tier));
  }

  // Housekeeping (only for intermediate/advanced)
  if (set.has("housekeeping") && tier !== "basic") {
    parts.push(buildHousekeepingModels(set, tier));
  }

  // Kitchen (only for intermediate/advanced)
  if (set.has("kitchen") && tier !== "basic") {
    parts.push(buildKitchenModels(set, tier));
  }

  // Billing (only for intermediate/advanced)
  if (set.has("billing") && tier !== "basic") {
    parts.push(buildBillingModels());
  }

  // Inventory (only for advanced)
  if (set.has("inventory") && tier === "advanced") {
    parts.push(buildInventoryModels());
  }

  // Reports (only for advanced)
  if (set.has("reports") && tier === "advanced") {
    parts.push(buildReportsModels());
  }

  // Clean up: remove blank lines
  return parts
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
