// src/app/api/staff/my-tasks/route.ts
// Staff apni assigned housekeeping tasks dekhe
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";

// ─── GET /api/staff/my-tasks ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staffProfile = await prisma.staff.findUnique({
      where: { user_id: session.user.id },
    });
    if (!staffProfile) return NextResponse.json({ tasks: [], stats: null });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86_400_000);

    const [tasks, todayCompleted, totalDone, pendingCount, inProgressCount] = await Promise.all([
      prisma.housekeepingTask.findMany({
        where: {
          assigned_to: staffProfile.staff_id,
          ...(status ? { status } : { status: { notIn: [] } }),
        },
        include: {
          room:    { select: { room_number: true, floor: true, room_type: true, cleaning_status: true } },
          booking: { select: { booking_id: true } },
        },
        orderBy: [{ priority: "desc" }, { created_at: "desc" }],
        take: 50,
      }),
      prisma.housekeepingTask.count({
        where: {
          assigned_to: staffProfile.staff_id,
          status:      "Done",
          completed_at: { gte: today, lt: tomorrow },
        },
      }),
      prisma.housekeepingTask.count({ where: { assigned_to: staffProfile.staff_id, status: "Done" } }),
      prisma.housekeepingTask.count({ where: { assigned_to: staffProfile.staff_id, status: "Pending" } }),
      prisma.housekeepingTask.count({ where: { assigned_to: staffProfile.staff_id, status: "InProgress" } }),
    ]);

    const serialized = tasks.map((t) => ({
      ...t,
      charge_amount: t.charge_amount ? Number(t.charge_amount) : null,
    }));

    return NextResponse.json({
      tasks: serialized,
      stats: { todayCompleted, totalDone, pendingCount, inProgressCount },
    });
  } catch (err) {
    console.error("[GET /api/staff/my-tasks]", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}