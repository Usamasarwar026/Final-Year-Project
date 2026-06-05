-- CreateEnum
CREATE TYPE "CleaningStatus" AS ENUM ('Clean', 'Dirty', 'InProgress');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('Cleaning', 'LaundryPickup', 'ServiceRequest', 'Maintenance');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('Normal', 'High', 'VIP');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('Pending', 'InProgress', 'Done', 'Cancelled');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('Towels', 'Laundry', 'RoomService', 'Water', 'Other');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('Pending', 'Assigned', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "LaundryStatus" AS ENUM ('Pending', 'Sent', 'Returned');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "cleaning_status" "CleaningStatus" NOT NULL DEFAULT 'Clean';

-- CreateTable
CREATE TABLE "HousekeepingTask" (
    "task_id" SERIAL NOT NULL,
    "room_id" INTEGER,
    "assigned_to" INTEGER,
    "booking_id" INTEGER,
    "task_type" "TaskType" NOT NULL,
    "priority" "TaskPriority" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'Pending',
    "request_description" TEXT,
    "is_billable" BOOLEAN NOT NULL DEFAULT false,
    "charge_amount" DECIMAL(10,2),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousekeepingTask_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "request_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "request_type" "RequestType" NOT NULL,
    "description" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "LaundryRecord" (
    "laundry_id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "booking_id" INTEGER,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returned_at" TIMESTAMP(3),
    "charge_amount" DECIMAL(10,2),
    "status" "LaundryStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "LaundryRecord_pkey" PRIMARY KEY ("laundry_id")
);

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "staff"("staff_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking_reservation"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking_reservation"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaundryRecord" ADD CONSTRAINT "LaundryRecord_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaundryRecord" ADD CONSTRAINT "LaundryRecord_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking_reservation"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;
