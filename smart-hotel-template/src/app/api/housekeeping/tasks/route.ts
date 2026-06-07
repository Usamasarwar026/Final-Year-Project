// src/app/api/housekeeping/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";

const TASK_INCLUDE = {
  room:          { select: { room_number: true, floor: true, room_type: true, cleaning_status: true } },
  assignedStaff: { include: { user: { select: { id: true, name: true, email: true } } } },
  booking:       { select: { booking_id: true, check_in_date: true, check_out_date: true } },
} as const;

// ─── GET /api/housekeeping/tasks ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status      = searchParams.get("status");
    const taskType    = searchParams.get("type");
    const priority    = searchParams.get("priority");
    const assignedTo  = searchParams.get("assignedTo");  // staff_id
    const date        = searchParams.get("date");          // YYYY-MM-DD
    const roomId      = searchParams.get("roomId");

    // Staff only see their own tasks
    let staffFilter: { assigned_to?: number } = {};
    if (session.user.role === "STAFF") {
      const staffProfile = await prisma.staff.findUnique({ where: { user_id: session.user.id } });
      if (!staffProfile) return NextResponse.json({ tasks: [] });
      staffFilter = { assigned_to: staffProfile.staff_id };
    }

    const where: Record<string, unknown> = { ...staffFilter };
    if (status)     where.status    = status;
    if (taskType)   where.task_type = taskType;
    if (priority)   where.priority  = priority;
    if (assignedTo) where.assigned_to = parseInt(assignedTo);
    if (roomId)     where.room_id   = parseInt(roomId);
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d.getTime() + 86_400_000);
      where.created_at = { gte: d, lt: next };
    }

    const tasks = await prisma.housekeepingTask.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: [{ priority: "desc" }, { created_at: "desc" }],
    });

    const serialized = tasks.map((t) => ({
      ...t,
      charge_amount: t.charge_amount ? Number(t.charge_amount) : null,
    }));

    return NextResponse.json({ tasks: serialized });
  } catch (err) {
    console.error("[GET /api/housekeeping/tasks]", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// ─── POST /api/housekeeping/tasks ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      room_id, assigned_to, booking_id,
      task_type, priority = "Normal",
      request_description, is_billable = false, charge_amount,
    } = body;

    if (!task_type) return NextResponse.json({ error: "task_type is required" }, { status: 422 });

    const task = await prisma.housekeepingTask.create({
      data: {
        room_id:             room_id    ? parseInt(room_id)    : null,
        assigned_to:         assigned_to ? parseInt(assigned_to) : null,
        booking_id:          booking_id ? parseInt(booking_id) : null,
        task_type,
        priority,
        status:              "Pending",
        request_description: request_description || null,
        is_billable,
        charge_amount:       charge_amount ? Number(charge_amount) : null,
      },
      include: TASK_INCLUDE,
    });

    // If task is Cleaning → mark room as Dirty
    if (task_type === "Cleaning" && room_id) {
      await prisma.room.update({
        where: { room_id: parseInt(room_id) },
        data:  { cleaning_status: "Dirty" },
      });
    }

    // Trigger Notification for Assigned Staff Member
    if (task.assignedStaff?.user?.id) {
      try {
        const { createNotification } = await import("@/services/notificationService");
        await createNotification({
          title: "New Housekeeping Task Assigned",
          message: `You have been assigned a new "${task_type}" task for Room ${task.room?.room_number || "N/A"}. Priority: ${priority}.`,
          type: "housekeeping",
          priority: priority === "High" ? "High" : priority === "Normal" ? "Medium" : "Low",
          module: "housekeeping",
          reference_id: String(task.task_id),
          recipient_user_id: task.assignedStaff.user.id,
          sender_user_id: session.user.id,
        });
      } catch (notifErr) {
        console.error("[POST /api/housekeeping/tasks] Notification trigger failed:", notifErr);
      }
    }

    // Always notify ADMIN role for dashboard tracking
    try {
      const { createNotification } = await import("@/services/notificationService");
      await createNotification({
        title: "Housekeeping Task Created",
        message: `A new "${task_type}" task was created for Room ${task.room?.room_number || "N/A"}.`,
        type: "housekeeping",
        priority: priority === "High" ? "High" : priority === "Normal" ? "Medium" : "Low",
        module: "housekeeping",
        reference_id: String(task.task_id),
        role_target: "ADMIN",
        sender_user_id: session.user.id,
      });
    } catch (notifErr) {
      console.error("[POST /api/housekeeping/tasks] Admin Notification trigger failed:", notifErr);
    }

    return NextResponse.json(
      { task: { ...task, charge_amount: task.charge_amount ? Number(task.charge_amount) : null } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/housekeeping/tasks]", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}