-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('CUSTOMER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cnic" TEXT,
ADD COLUMN     "createdByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "booking_reservation" ADD COLUMN     "source" "BookingSource" NOT NULL DEFAULT 'CUSTOMER';
