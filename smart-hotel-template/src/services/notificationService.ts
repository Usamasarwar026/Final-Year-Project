// src/services/notificationService.ts
// Centralized notification service — server-side only (used by API routes)
//
// IMPORTANT: Uses raw SQL ($queryRawUnsafe / $executeRawUnsafe) because the
// generated Prisma Client is stale and does not include the Notification model.
// Once you run `npx prisma generate`, you can switch back to prisma.notification.*

import { prisma } from "@/database/db";

/**
 * Notification types aligning with hotel management modules.
 */
export type NotificationType =
  | "booking"
  | "room"
  | "customer"
  | "staff"
  | "housekeeping"
  | "laundry"
  | "kitchen"
  | "inventory"
  | "billing"
  | "reports"
  | "maintenance"
  | "system";

export type NotificationPriority = "High" | "Medium" | "Low";

export interface NotificationRow {
  notification_id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  module: string;
  reference_id: string | null;
  recipient_user_id: string;
  sender_user_id: string | null;
  role_target: string | null;
  is_read: boolean;
  created_at: Date;
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Create a notification. Accepts both camelCase and snake_case parameter names.
 *
 * If `recipientUserId` is provided, creates a notification for that single user.
 * If `roleTarget` is provided WITHOUT a `recipientUserId`, automatically
 * broadcasts to ALL active users with that role.
 */
export async function createNotification(params: {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  module: string;
  // Accept both camelCase and snake_case
  referenceId?: string;
  reference_id?: string;
  recipientUserId?: string;
  recipient_user_id?: string;
  senderUserId?: string;
  sender_user_id?: string;
  roleTarget?: string;
  role_target?: string;
}) {
  const {
    title,
    message,
    type,
    priority = "Medium",
    module: moduleName,
  } = params;

  // Normalize: accept both camelCase and snake_case
  const referenceId = params.referenceId ?? params.reference_id ?? null;
  const recipientUserId = params.recipientUserId ?? params.recipient_user_id;
  const senderUserId = params.senderUserId ?? params.sender_user_id ?? null;
  const roleTarget = params.roleTarget ?? params.role_target ?? null;

  // If we have a specific recipient, create a single notification
  if (recipientUserId) {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `INSERT INTO "notifications" ("title", "message", "type", "priority", "module", "reference_id", "recipient_user_id", "sender_user_id", "role_target", "is_read", "created_at")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW())
         RETURNING "notification_id", "title", "message", "type", "priority", "module", "reference_id", "recipient_user_id", "sender_user_id", "role_target", "is_read", "created_at"`,
        title,
        message,
        type,
        priority,
        moduleName,
        referenceId,
        recipientUserId,
        senderUserId,
        roleTarget
      );
      const result = rows[0] ?? null;
      if (result?.notification_id) {
        result.notification_id = Number(result.notification_id);
      }
      console.log("[createNotification] Created for user", recipientUserId, result?.notification_id);
      return result;
    } catch (err: any) {
      console.error("[createNotification] Failed to create for user", recipientUserId, err?.message || err);
      return null;
    }
  }

  // If no recipientUserId but we have a roleTarget, broadcast to all users of that role
  if (roleTarget) {
    return broadcastNotification({
      title,
      message,
      type,
      priority,
      module: moduleName,
      referenceId: referenceId ?? undefined,
      senderUserId: senderUserId ?? undefined,
      roleTarget,
    });
  }

  // Fallback: no recipient and no role → nothing to do
  console.warn("[createNotification] No recipientUserId or roleTarget provided — skipping.", { title, type });
  return null;
}

// ── Broadcast to all users of a role ──────────────────────────────────────────

export async function broadcastNotification(params: {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  module: string;
  referenceId?: string;
  reference_id?: string;
  senderUserId?: string;
  sender_user_id?: string;
  roleTarget: string; // "ADMIN" | "STAFF" | "CUSTOMER"
}) {
  const { roleTarget, ...rest } = params;
  const referenceId = rest.referenceId ?? rest.reference_id ?? null;
  const senderUserId = rest.senderUserId ?? rest.sender_user_id ?? null;

  try {
    // Find all active users with the target role
    const users = await prisma.user.findMany({
      where: { role: roleTarget as any, isActive: true },
      select: { id: true },
    });

    if (users.length === 0) {
      console.warn(`[broadcastNotification] No active users found with role: ${roleTarget}`);
      return 0;
    }

    // Insert one notification per user using raw SQL
    let insertedCount = 0;
    for (const u of users) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "notifications" ("title", "message", "type", "priority", "module", "reference_id", "recipient_user_id", "sender_user_id", "role_target", "is_read", "created_at")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW())`,
          rest.title,
          rest.message,
          rest.type,
          rest.priority ?? "Medium",
          rest.module,
          referenceId,
          u.id,
          senderUserId,
          roleTarget
        );
        insertedCount++;
      } catch (innerErr: any) {
        console.error(`[broadcastNotification] Failed for user ${u.id}:`, innerErr?.message || innerErr);
      }
    }

    console.log(`[broadcastNotification] Created ${insertedCount} notifications for role ${roleTarget}`);
    return insertedCount;
  } catch (err: any) {
    console.error("[broadcastNotification] Failed:", err?.message || err);
    return 0;
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getNotifications(params: {
  userId: string;
  skip?: number;
  take?: number;
  type?: string;
  unreadOnly?: boolean;
}) {
  const { userId, skip = 0, take = 20, type, unreadOnly } = params;

  let whereClause = `WHERE "recipient_user_id" = $1`;
  const queryParams: any[] = [userId];
  let paramIndex = 2;

  if (type) {
    whereClause += ` AND "type" = $${paramIndex}`;
    queryParams.push(type);
    paramIndex++;
  }
  if (unreadOnly) {
    whereClause += ` AND "is_read" = false`;
  }

  const notifications: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "notifications" ${whereClause} ORDER BY "created_at" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    ...queryParams,
    take,
    skip
  );

  const countResult: any[] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as total FROM "notifications" ${whereClause}`,
    ...queryParams
  );

  const total = Number(countResult[0]?.total ?? 0);

  // Convert BigInt notification_id to Number
  const sanitized = notifications.map((n) => ({
    ...n,
    notification_id: Number(n.notification_id),
  }));

  return { notifications: sanitized, total };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result: any[] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM "notifications" WHERE "recipient_user_id" = $1 AND "is_read" = false`,
    userId
  );
  return Number(result[0]?.count ?? 0);
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function markAsRead(notificationId: number) {
  await prisma.$executeRawUnsafe(
    `UPDATE "notifications" SET "is_read" = true WHERE "notification_id" = $1`,
    notificationId
  );
  return { notification_id: notificationId, is_read: true };
}

export async function markAllAsRead(userId: string) {
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "notifications" SET "is_read" = true WHERE "recipient_user_id" = $1 AND "is_read" = false`,
    userId
  );
  return { count: result };
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteNotification(notificationId: number) {
  await prisma.$executeRawUnsafe(
    `DELETE FROM "notifications" WHERE "notification_id" = $1`,
    notificationId
  );
  return { notification_id: notificationId, deleted: true };
}
