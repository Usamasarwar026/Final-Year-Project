/*
  Warnings:

  - You are about to drop the column `user_id` on the `booking_reservation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "booking_reservation" DROP CONSTRAINT "booking_reservation_user_id_fkey";

-- DropIndex
DROP INDEX "booking_reservation_user_id_idx";

-- AlterTable
ALTER TABLE "booking_reservation" DROP COLUMN "user_id";
