import { NextResponse } from "next/server";
import { prisma } from "@/database/db";

function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key in obj) {
      res[key] = serializeBigInt(obj[key]);
    }
    return res;
  }
  return obj;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const test = searchParams.get("test");

    if (test === "1") {
      const { createNotification } = await import("@/services/notificationService");
      
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN", isActive: true },
        select: { id: true, name: true },
      });

      let testDirect = null;
      let testBroadcast: any = 0;
      let errorDirect = null;
      let errorBroadcast = null;

      if (admin) {
        try {
          testDirect = await createNotification({
            title: "🔔 Test Notification",
            message: "This is a test notification to verify the system works end-to-end.",
            type: "system",
            priority: "Medium",
            module: "system",
            reference_id: "test-001",
            recipient_user_id: admin.id,
          });
        } catch (e: any) {
          errorDirect = { message: e.message, stack: e.stack };
        }
      }

      try {
        testBroadcast = await createNotification({
          title: "📢 Broadcast Test",
          message: "This is a broadcast test notification sent to all ADMINs.",
          type: "system",
          priority: "Low",
          module: "system",
          role_target: "ADMIN",
        });
      } catch (e: any) {
        errorBroadcast = { message: e.message, stack: e.stack };
      }

      // Count total notifications in DB
      let totalCount = 0;
      try {
        const countRes: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "notifications"`);
        totalCount = Number(countRes[0]?.count ?? 0);
      } catch (e) {
        // ignore
      }

      return NextResponse.json(serializeBigInt({ 
        success: true,
        admin,
        testDirect, 
        testBroadcast,
        errorDirect,
        errorBroadcast,
        totalNotificationsInDB: totalCount,
      }));
    }

    // Default: list notifications
    const countRes: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "notifications"`);
    const count = Number(countRes[0]?.count ?? 0);
    const notifications: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "notifications" ORDER BY "created_at" DESC LIMIT 20`
    );
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return NextResponse.json(serializeBigInt({ count, notifications, users }));
  } catch (error: any) {
    console.error("[DEBUG /api/debug/notifications]", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
