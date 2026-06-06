/*
  Warnings:

  - The primary key for the `food_orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `is_billed` on the `food_orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `food_orders` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `food_orders` table. All the data in the column will be lost.
  - The `status` column on the `food_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `menu_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `customer_name` to the `food_orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FoodOrderStatus" AS ENUM ('Pending', 'Accepted', 'Preparing', 'Ready', 'Assigned', 'OutForDelivery', 'Delivered', 'Cancelled');

-- CreateEnum
CREATE TYPE "KitchenTaskStatus" AS ENUM ('Assigned', 'Accepted', 'InProgress', 'Completed');

-- DropForeignKey
ALTER TABLE "food_orders" DROP CONSTRAINT "food_orders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_menu_item_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropIndex
DROP INDEX "food_orders_order_type_idx";

-- DropIndex
DROP INDEX "food_orders_placed_at_idx";

-- AlterTable
ALTER TABLE "food_orders" DROP CONSTRAINT "food_orders_pkey",
DROP COLUMN "is_billed",
DROP COLUMN "order_id",
DROP COLUMN "priority",
ADD COLUMN     "customer_name" TEXT NOT NULL,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "room_number" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL,
ALTER COLUMN "table_number" SET DATA TYPE TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "FoodOrderStatus" NOT NULL DEFAULT 'Pending',
ADD CONSTRAINT "food_orders_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "menu_items";

-- DropTable
DROP TABLE "order_items";

-- DropEnum
DROP TYPE "FoodCategory";

-- CreateTable
CREATE TABLE "food_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "preparation_time_minutes" INTEGER NOT NULL DEFAULT 15,
    "ingredients_text" TEXT,
    "availability_status" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_order_items" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "food_item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "special_note" TEXT,

    CONSTRAINT "food_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_order_timelines" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "status" "FoodOrderStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_order_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitchen_tasks" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "assigned_to" INTEGER,
    "status" "KitchenTaskStatus" NOT NULL DEFAULT 'Assigned',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "food_categories_name_key" ON "food_categories"("name");

-- CreateIndex
CREATE INDEX "food_items_category_id_idx" ON "food_items"("category_id");

-- CreateIndex
CREATE INDEX "food_items_active_idx" ON "food_items"("active");

-- CreateIndex
CREATE INDEX "food_items_availability_status_idx" ON "food_items"("availability_status");

-- CreateIndex
CREATE INDEX "food_order_items_order_id_idx" ON "food_order_items"("order_id");

-- CreateIndex
CREATE INDEX "food_order_timelines_order_id_idx" ON "food_order_timelines"("order_id");

-- CreateIndex
CREATE INDEX "kitchen_tasks_assigned_to_idx" ON "kitchen_tasks"("assigned_to");

-- CreateIndex
CREATE INDEX "food_orders_status_idx" ON "food_orders"("status");

-- CreateIndex
CREATE INDEX "food_orders_user_id_idx" ON "food_orders"("user_id");

-- AddForeignKey
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "food_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "food_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_timelines" ADD CONSTRAINT "food_order_timelines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitchen_tasks" ADD CONSTRAINT "kitchen_tasks_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitchen_tasks" ADD CONSTRAINT "kitchen_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "staff"("staff_id") ON DELETE SET NULL ON UPDATE CASCADE;
