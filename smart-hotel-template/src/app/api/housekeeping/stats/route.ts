// src/app/api/housekeeping/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";

// ─── GET /api/housekeeping/stats ──────────────────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today     = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow  = new Date(today.getTime() + 86_400_000);

    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedToday,
      vipTasks,
      serviceRequests,
      dirtyRooms,
      cleanRooms,
      inProgressRooms,
    ] = await Promise.all([
      prisma.housekeepingTask.count(),
      prisma.housekeepingTask.count({ where: { status: "Pending" } }),
      prisma.housekeepingTask.count({ where: { status: "InProgress" } }),
      prisma.housekeepingTask.count({ where: { status: "Done", completed_at: { gte: today, lt: tomorrow } } }),
      prisma.housekeepingTask.count({ where: { priority: "VIP", status: { notIn: ["Done", "Cancelled"] } } }),
      prisma.serviceRequest.count({ where:  { status: { in: ["Pending", "Assigned"] } } }),
      prisma.room.count({ where:            { cleaning_status: "Dirty", is_active: true } }),
      prisma.room.count({ where:            { cleaning_status: "Clean", is_active: true } }),
      prisma.room.count({ where:            { cleaning_status: "InProgress", is_active: true } }),
    ]);

    return NextResponse.json({
      stats: {
        totalTasks, pendingTasks, inProgressTasks, completedToday,
        vipTasks, serviceRequests, dirtyRooms, cleanRooms, inProgressRooms,
      },
    });
  } catch (err) {
    console.error("[GET /api/housekeeping/stats]", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}