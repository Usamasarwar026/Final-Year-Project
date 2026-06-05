-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('Single', 'Double', 'Suite', 'Deluxe', 'Presidential');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('Available', 'Reserved', 'Occupied', 'Maintenance');

-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('Single', 'Double', 'Queen', 'King', 'Twin');

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

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("room_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_room_number_key" ON "rooms"("room_number");

-- CreateIndex
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- CreateIndex
CREATE INDEX "rooms_room_type_idx" ON "rooms"("room_type");

-- CreateIndex
CREATE INDEX "rooms_is_active_idx" ON "rooms"("is_active");
