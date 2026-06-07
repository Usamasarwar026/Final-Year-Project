// src/app/api/housekeeping/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

type Params = { params: Promise<{ id: string }> };

const TASK_INCLUDE = {
  room: {
    select: {
      room_number: true,
      floor: true,
      room_type: true,
      cleaning_status: true,
    },
  },
  assignedStaff: { include: { user: { select: { id: true, name: true, email: true } } } },
  booking: {
    select: { booking_id: true, check_in_date: true, check_out_date: true },
  },
} as const;

// ─── GET /api/housekeeping/tasks/[id] ─────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const task = await prisma.housekeepingTask.findUnique({
      where: { task_id: parseInt(id) },
      include: TASK_INCLUDE,
    });

    if (!task)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    return NextResponse.json({
      task: {
        ...task,
        charge_amount: task.charge_amount ? Number(task.charge_amount) : null,
      },
    });
  } catch (err) {
    console.error("[GET /api/housekeeping/tasks/[id]]", err);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/housekeeping/tasks/[id] ──────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const taskId = parseInt(id);
    const body = await req.json();

    const existing = await prisma.housekeepingTask.findUnique({
      where: { task_id: taskId },
      include: { room: true, assignedStaff: { include: { user: true } } },
    });
    if (!existing)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const {
      assigned_to,
      status,
      priority,
      request_description,
      is_billable,
      charge_amount,
    } = body;

    const data: Record<string, unknown> = {};
    if (assigned_to !== undefined)
      data.assigned_to = assigned_to ? parseInt(assigned_to) : null;
    if (priority !== undefined) data.priority = priority;
    if (request_description !== undefined)
      data.request_description = request_description;
    if (is_billable !== undefined) data.is_billable = is_billable;
    if (charge_amount !== undefined)
      data.charge_amount = charge_amount ? Number(charge_amount) : null;

    // Status transition logic
    let triggerCompletedNotif = false;
    if (status !== undefined && status !== existing.status) {
      data.status = status;

      if (status === "InProgress" && !existing.started_at) {
        data.started_at = new Date();
      }

      if (status === "Done") {
        if (!existing.completed_at) {
          data.completed_at = new Date();
        }
        triggerCompletedNotif = true;

        // ── Auto: if Cleaning task done → Room Available + Clean ──────────────
        if (existing.task_type === "Cleaning" && existing.room_id) {
          await prisma.room.update({
            where: { room_id: existing.room_id },
            data: { cleaning_status: "Clean", status: "Available" },
          });
        }

        // ── Auto: if LaundryPickup done → update LaundryRecord status ─────────
        if (existing.task_type === "LaundryPickup" && existing.booking_id) {
          await prisma.laundryRecord.updateMany({
            where: { booking_id: existing.booking_id, status: "Pending" },
            data: { status: "Sent" },
          });
        }

        // ── Auto: if ServiceRequest done → update ServiceRequest status ───────
        if (existing.task_type === "ServiceRequest" && existing.booking_id) {
          await prisma.serviceRequest.updateMany({
            where: {
              booking_id: existing.booking_id,
              status: { in: ["Pending", "Assigned"] },
            },
            data: { status: "Completed" },
          });
        }
      }

      // ── Cleaning → InProgress marks room as InProgress ────────────────────
      if (
        status === "InProgress" &&
        existing.task_type === "Cleaning" &&
        existing.room_id
      ) {
        await prisma.room.update({
          where: { room_id: existing.room_id },
          data: { cleaning_status: "InProgress" },
        });
      }

      // ── Cancelled → restore room if was Cleaning ──────────────────────────
      if (
        status === "Cancelled" &&
        existing.task_type === "Cleaning" &&
        existing.room_id
      ) {
        await prisma.room.update({
          where: { room_id: existing.room_id },
          data: { cleaning_status: "Dirty" },
        });
      }
    }

    const updated = await prisma.housekeepingTask.update({
      where: { task_id: taskId },
      data,
      include: TASK_INCLUDE,
    });

    // Handle Notifications
    try {
      const { createNotification } = await import("@/services/notificationService");

      // 1. Task status update -> Notify ADMIN
      if (status !== undefined && status !== existing.status) {
        const staffName = existing.assignedStaff?.user?.name || "Staff";
        await createNotification({
          title: triggerCompletedNotif ? "Housekeeping Task Completed" : "Housekeeping Task Status Updated",
          message: triggerCompletedNotif 
            ? `Housekeeping task "${existing.task_type}" for Room ${existing.room?.room_number || "N/A"} was marked as completed by ${staffName}.`
            : `Housekeeping task "${existing.task_type}" for Room ${existing.room?.room_number || "N/A"} status changed to "${status}" by ${staffName}.`,
          type: "housekeeping",
          priority: triggerCompletedNotif ? "Medium" : "Low",
          module: "housekeeping",
          reference_id: String(taskId),
          role_target: "ADMIN",
          sender_user_id: session.user.id,
        });
      }

      // 2. Reassigned task -> Notify the newly assigned staff member AND Admin
      if (assigned_to !== undefined && assigned_to !== null && parseInt(assigned_to) !== existing.assigned_to) {
        if (updated.assignedStaff?.user?.id) {
          const staffName = updated.assignedStaff.user.name || "Staff";
          await createNotification({
            title: "Housekeeping Task Assigned",
            message: `You have been assigned the "${updated.task_type}" task for Room ${updated.room?.room_number || "N/A"}.`,
            type: "housekeeping",
            priority: updated.priority === "High" ? "High" : updated.priority === "Normal" ? "Medium" : "Low",
            module: "housekeeping",
            reference_id: String(taskId),
            recipient_user_id: updated.assignedStaff.user.id,
            sender_user_id: session.user.id,
          });

          await createNotification({
            title: "Task Reassigned",
            message: `Task "${updated.task_type}" for Room ${updated.room?.room_number || "N/A"} was assigned to ${staffName}.`,
            type: "housekeeping",
            priority: "Low",
            module: "housekeeping",
            reference_id: String(taskId),
            role_target: "ADMIN",
            sender_user_id: session.user.id,
          });
        }
      }
    } catch (notifErr) {
      console.error("[PATCH /api/housekeeping/tasks/[id]] Notification trigger failed:", notifErr);
    }

    return NextResponse.json({
      task: {
        ...updated,
        charge_amount: updated.charge_amount
          ? Number(updated.charge_amount)
          : null,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/housekeeping/tasks/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/housekeeping/tasks/[id] ─────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const taskId = parseInt(id);
    const existing = await prisma.housekeepingTask.findUnique({ where: { task_id: taskId }, include: { room: true } });
    
    if (existing) {
      await prisma.housekeepingTask.delete({ where: { task_id: taskId } });
      
      try {
        const { createNotification } = await import("@/services/notificationService");
        await createNotification({
          title: "Housekeeping Task Deleted",
          message: `Task "${existing.task_type}" for Room ${existing.room?.room_number || "N/A"} was deleted.`,
          type: "housekeeping",
          priority: "Medium",
          module: "housekeeping",
          reference_id: String(taskId),
          role_target: "ADMIN",
          sender_user_id: session.user.id,
        });
      } catch (notifErr) {
        console.error("[DELETE /api/housekeeping/tasks/[id]] Notification trigger failed:", notifErr);
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/housekeeping/tasks/[id]]", err);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
