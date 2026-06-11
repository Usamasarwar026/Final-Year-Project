// src/app/api/notifications/[id]/route.ts
// PATCH — Mark a single notification as read
// DELETE — Delete a notification

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { markAsRead, deleteNotification } from "@/services/notificationService";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const notification = await markAsRead(notificationId);
    return NextResponse.json({ notification });
  } catch (err: any) {
    console.error("[PATCH /api/notifications/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await deleteNotification(notificationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/notifications/[id]]", err);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
