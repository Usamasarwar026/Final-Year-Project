/*
  Warnings:

  - You are about to drop the column `department` on the `staff` table. All the data in the column will be lost.
  - You are about to drop the column `shift` on the `staff` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "staff_department_idx";

-- AlterTable
ALTER TABLE "staff" DROP COLUMN "department",
DROP COLUMN "shift",
ADD COLUMN     "department_id" INTEGER,
ADD COLUMN     "shift_id" INTEGER;

-- CreateTable
CREATE TABLE "department_configs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '👤',
    "color" TEXT NOT NULL DEFAULT 'text-gray-700',
    "bg" TEXT NOT NULL DEFAULT 'bg-gray-100',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_configs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'text-gray-700',
    "bg" TEXT NOT NULL DEFAULT 'bg-gray-50 border-gray-200',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_configs_name_key" ON "department_configs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "shift_configs_name_key" ON "shift_configs"("name");

-- CreateIndex
CREATE INDEX "staff_department_id_idx" ON "staff"("department_id");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shift_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
