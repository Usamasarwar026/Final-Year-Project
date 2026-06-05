-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled');

-- CreateTable
CREATE TABLE "booking_reservation" (
    "booking_id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "room_id" INTEGER NOT NULL,
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

    CONSTRAINT "booking_reservation_pkey" PRIMARY KEY ("booking_id")
);

-- CreateIndex
CREATE INDEX "booking_reservation_user_id_idx" ON "booking_reservation"("user_id");

-- CreateIndex
CREATE INDEX "booking_reservation_room_id_idx" ON "booking_reservation"("room_id");

-- CreateIndex
CREATE INDEX "booking_reservation_status_idx" ON "booking_reservation"("status");

-- CreateIndex
CREATE INDEX "booking_reservation_check_in_date_idx" ON "booking_reservation"("check_in_date");

-- AddForeignKey
ALTER TABLE "booking_reservation" ADD CONSTRAINT "booking_reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reservation" ADD CONSTRAINT "booking_reservation_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE RESTRICT ON UPDATE CASCADE;
