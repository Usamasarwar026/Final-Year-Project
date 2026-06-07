import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: { id: true, email: true }
  });

  console.log("Customers:", users);

  for (const user of users) {
    const notifs = await prisma.notification.findMany({
      where: { recipient_user_id: user.id }
    });
    console.log(`Notifications for ${user.email}:`, notifs.length);
    if (notifs.length > 0) {
      console.log(notifs.slice(0, 2));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
