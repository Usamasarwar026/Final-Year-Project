-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Special');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('RoomService', 'Restaurant');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Placed', 'Accepted', 'Preparing', 'Ready', 'OutForDelivery', 'Delivered', 'Cancelled');

-- CreateEnum
CREATE TYPE "OrderPriority" AS ENUM ('Normal', 'High', 'VIP');

-- CreateTable
CREATE TABLE "menu_items" (
    "menu_item_id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "category" "FoodCategory" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "prep_time_minutes" INTEGER NOT NULL DEFAULT 15,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_vip_special" BOOLEAN NOT NULL DEFAULT false,
    "is_halal" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "calories" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("menu_item_id")
);

-- CreateTable
CREATE TABLE "food_orders" (
    "order_id" SERIAL NOT NULL,
    "booking_id" INTEGER,
    "user_id" TEXT NOT NULL,
    "order_type" "OrderType" NOT NULL,
    "table_number" VARCHAR(10),
    "status" "OrderStatus" NOT NULL DEFAULT 'Placed',
    "priority" "OrderPriority" NOT NULL DEFAULT 'Normal',
    "total_amount" DECIMAL(10,2) NOT NULL,
    "is_billed" BOOLEAN NOT NULL DEFAULT false,
    "special_instructions" TEXT,
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "preparing_at" TIMESTAMP(3),
    "ready_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "menu_item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "special_note" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_items_category_idx" ON "menu_items"("category");

-- CreateIndex
CREATE INDEX "menu_items_is_available_idx" ON "menu_items"("is_available");

-- CreateIndex
CREATE INDEX "food_orders_status_idx" ON "food_orders"("status");

-- CreateIndex
CREATE INDEX "food_orders_order_type_idx" ON "food_orders"("order_type");

-- CreateIndex
CREATE INDEX "food_orders_booking_id_idx" ON "food_orders"("booking_id");

-- CreateIndex
CREATE INDEX "food_orders_placed_at_idx" ON "food_orders"("placed_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- AddForeignKey
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking_reservation"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "food_orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("menu_item_id") ON DELETE RESTRICT ON UPDATE CASCADE;
