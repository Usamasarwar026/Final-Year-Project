/*
  Warnings:

  - The primary key for the `LaundryRecord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `laundry_id` on the `LaundryRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LaundryRecord" DROP CONSTRAINT "LaundryRecord_pkey",
DROP COLUMN "laundry_id",
ADD COLUMN     "text_id" SERIAL NOT NULL,
ADD CONSTRAINT "LaundryRecord_pkey" PRIMARY KEY ("text_id");

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "unit_id" INTEGER;

-- CreateTable
CREATE TABLE "inventory_units" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_units_name_key" ON "inventory_units"("name");

-- CreateIndex
CREATE INDEX "inventory_items_unit_id_idx" ON "inventory_items"("unit_id");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "inventory_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
