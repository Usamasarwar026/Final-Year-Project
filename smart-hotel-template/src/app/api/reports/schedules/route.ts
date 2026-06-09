// src/app/api/reports/schedules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// GET — list all schedules
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ADMIN";
    const isStaffWithBillingPermission =
      session?.user?.role === "STAFF" &&
      (session?.user as any)?.permissions?.includes("billing");

    if (!session || (!isAdmin && !isStaffWithBillingPermission)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedules = await prisma.reportSchedule.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ schedules });
  } catch (err: any) {
    console.error("[GET /api/reports/schedules]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load schedules" },
      { status: 500 },
    );
  }
}

// POST — create a new schedule
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { report_type, frequency, parameters } = body;

    if (!report_type || !frequency) {
      return NextResponse.json(
        { error: "report_type and frequency are required" },
        { status: 400 },
      );
    }

    const validTypes = [
      "Revenue",
      "Occupancy",
      "Staff",
      "Inventory",
      "Booking",
      "Guest",
    ];
    const validFreqs = ["Daily", "Weekly", "Monthly"];

    if (!validTypes.includes(report_type)) {
      return NextResponse.json(
        { error: "Invalid report_type" },
        { status: 400 },
      );
    }
    if (!validFreqs.includes(frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
    }

    // Calculate next_run_at
    const now = new Date();
    let next_run_at: Date;
    if (frequency === "Daily") {
      next_run_at = new Date(now);
      next_run_at.setDate(next_run_at.getDate() + 1);
      next_run_at.setHours(8, 0, 0, 0);
    } else if (frequency === "Weekly") {
      next_run_at = new Date(now);
      next_run_at.setDate(next_run_at.getDate() + 7);
      next_run_at.setHours(8, 0, 0, 0);
    } else {
      next_run_at = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8);
    }

    const schedule = await prisma.reportSchedule.create({
      data: {
        report_type,
        frequency,
        is_active: true,
        created_by: session.user.id,
        next_run_at,
        parameters: parameters ?? null,
      },
    });

    // Trigger Notification for Admin
    try {
      const { createNotification } =
        await import("@/services/notificationService");
      await createNotification({
        title: "Report Schedule Created",
        message: `A new scheduled "${report_type}" report (${frequency}) has been configured successfully.`,
        type: "reports",
        priority: "Low",
        module: "reports",
        reference_id: String(schedule.id),
        role_target: "ADMIN",
      });
    } catch (notifErr) {
      console.error(
        "[POST /api/reports/schedules] Notification trigger failed:",
        notifErr,
      );
    }

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/reports/schedules]", err);
    return NextResponse.json(
      { error: err.message || "Failed to create schedule" },
      { status: 500 },
    );
  }
}
