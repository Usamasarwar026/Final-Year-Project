import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.foodOrder.count();
    console.log("Total Food Orders in DB:", count);
    const orders = await prisma.foodOrder.findMany({
      take: 10,
      orderBy: { placed_at: 'desc' },
      include: {
        items: true,
      }
    });
    console.log("Latest Food Orders:", JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error("Error checking food orders:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
