// src/app/api/notifications/route.ts
// GET  — Fetch paginated notifications for the authenticated user
// PUT  — Mark all notifications as read for the authenticated user

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
} from "@/services/notificationService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const take = parseInt(searchParams.get("take") || "20", 10);
    const type = searchParams.get("type") || undefined;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const { notifications, total } = await getNotifications({
      userId: session.user.id,
      skip,
      take,
      type,
      unreadOnly,
    });

    const unreadCount = await getUnreadCount(session.user.id);

    return NextResponse.json({ notifications, total, unreadCount });
  } catch (err: any) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await markAllAsRead(session.user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[PUT /api/notifications]", err);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
