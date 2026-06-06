import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding inventory...");

  const cat1 = await prisma.inventoryCategory.create({
    data: { name: "Kitchen Supplies", icon: "🍳", description: "Cooking ingredients" },
  });
  const cat2 = await prisma.inventoryCategory.create({
    data: { name: "Housekeeping", icon: "🧹", description: "Cleaning supplies" },
  });
  const cat3 = await prisma.inventoryCategory.create({
    data: { name: "Bar & Beverages", icon: "🍹", description: "Drinks and bar items" },
  });

  await prisma.inventoryVendor.create({
    data: {
      name: "Metro Cash & Carry",
      contact_name: "Ahmed Ali",
      email: "ahmed@metro.pk",
      phone: "0300-1234567",
      address: "Karachi, Pakistan",
      is_active: true,
    },
  });

  await prisma.inventoryItem.createMany({
    data: [
      { name: "Basmati Rice", sku: "KIT-001", category_id: cat1.id, unit: "kg", quantity: 50, low_stock_threshold: 10, unit_cost: 250 },
      { name: "Cooking Oil", sku: "KIT-002", category_id: cat1.id, unit: "liter", quantity: 20, low_stock_threshold: 5, unit_cost: 400 },
      { name: "White Sugar", sku: "KIT-003", category_id: cat1.id, unit: "kg", quantity: 8, low_stock_threshold: 10, unit_cost: 150 },
      { name: "Floor Cleaner", sku: "HK-001", category_id: cat2.id, unit: "liter", quantity: 15, low_stock_threshold: 5, unit_cost: 200 },
      { name: "Toilet Paper", sku: "HK-002", category_id: cat2.id, unit: "pack", quantity: 100, low_stock_threshold: 20, unit_cost: 350 },
      { name: "Mineral Water", sku: "BAR-001", category_id: cat3.id, unit: "bottle", quantity: 200, low_stock_threshold: 50, unit_cost: 50 },
      { name: "Coca Cola Can", sku: "BAR-002", category_id: cat3.id, unit: "can", quantity: 3, low_stock_threshold: 24, unit_cost: 80 },
    ],
  });

  console.log("✅ Done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });