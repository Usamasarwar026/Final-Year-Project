-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('Single', 'Double', 'Suite', 'Deluxe', 'Presidential');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('Available', 'Reserved', 'Occupied', 'Maintenance');

-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('Single', 'Double', 'Queen', 'King', 'Twin');

-- CreateEnum
CREATE TYPE "CleaningStatus" AS ENUM ('Clean', 'Dirty', 'InProgress');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "password" TEXT NOT NULL,
    "profileImage" TEXT,
    "address" TEXT,
    "name" TEXT NOT NULL,
    "cnic" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "city" TEXT,
    "country" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone_number" TEXT NOT NULL,
    "cnic" TEXT,
    "gender" "Gender",
    "date_of_birth" TIMESTAMP(3),
    "city" TEXT,
    "country" TEXT,
    "emergency_contact" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "room_id" SERIAL NOT NULL,
    "room_number" VARCHAR(10) NOT NULL,
    "floor" INTEGER NOT NULL,
    "room_type" "RoomType" NOT NULL DEFAULT 'Single',
    "status" "RoomStatus" NOT NULL DEFAULT 'Available',
    "price_per_night" DECIMAL(10,2) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "bed_type" "BedType" NOT NULL DEFAULT 'Double',
    "size_sqft" INTEGER,
    "amenities" JSONB,
    "photos" JSONB,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cleaning_status" "CleaningStatus" NOT NULL DEFAULT 'Clean',

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("room_id")
);

-- CreateTable
CREATE TABLE "booking_reservation" (
    "booking_id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "room_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "check_in_date" DATE NOT NULL,
    "check_out_date" DATE NOT NULL,
    "actual_check_in" TIMESTAMP(3),
    "actual_check_out" TIMESTAMP(3),
    "status" "BookingStatus" NOT NULL DEFAULT 'Pending',
    "total_nights" INTEGER NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "special_requests" TEXT,
    "confirmation_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "source" "BookingSource" NOT NULL DEFAULT 'ADMIN',

    CONSTRAINT "booking_reservation_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "module" TEXT NOT NULL,
    "reference_id" TEXT,
    "recipient_user_id" TEXT NOT NULL,
    "sender_user_id" TEXT,
    "role_target" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_number_key" ON "customers"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "customers_cnic_key" ON "customers"("cnic");

-- CreateIndex
CREATE INDEX "customers_phone_number_idx" ON "customers"("phone_number");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_room_number_key" ON "rooms"("room_number");

-- CreateIndex
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- CreateIndex
CREATE INDEX "rooms_room_type_idx" ON "rooms"("room_type");

-- CreateIndex
CREATE INDEX "rooms_is_active_idx" ON "rooms"("is_active");

-- CreateIndex
CREATE INDEX "booking_reservation_user_id_idx" ON "booking_reservation"("user_id");

-- CreateIndex
CREATE INDEX "booking_reservation_room_id_idx" ON "booking_reservation"("room_id");

-- CreateIndex
CREATE INDEX "booking_reservation_customer_id_idx" ON "booking_reservation"("customer_id");

-- CreateIndex
CREATE INDEX "booking_reservation_status_idx" ON "booking_reservation"("status");

-- CreateIndex
CREATE INDEX "booking_reservation_check_in_date_idx" ON "booking_reservation"("check_in_date");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_idx" ON "notifications"("recipient_user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "booking_reservation" ADD CONSTRAINT "booking_reservation_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reservation" ADD CONSTRAINT "booking_reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reservation" ADD CONSTRAINT "booking_reservation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;
