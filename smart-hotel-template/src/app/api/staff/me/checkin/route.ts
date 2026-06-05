// src/app/api/staff/me/checkin/route.ts
// Staff khud check-in aur check-out karta hai
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// POST /api/staff/me/checkin
// Body: { action: "checkin" | "checkout" }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const role   = (session.user as any).role as string;

    if (role !== "STAFF") {
      return NextResponse.json({ error: "Staff only" }, { status: 403 });
    }

    const { action } = await req.json(); // "checkin" | "checkout"

    // Get staff profile
    const staffProfile = await prisma.staff.findUnique({
      where: { user_id: userId },
    });

    if (!staffProfile) {
      return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Find or create today's log
    let log = await prisma.attendanceLog.findUnique({
      where: {
        staff_id_date: {
          staff_id: staffProfile.staff_id,
          date:     todayStart,
        },
      },
    });

    if (action === "checkin") {
      if (log?.check_in) {
        return NextResponse.json({ error: "Already checked in today" }, { status: 409 });
      }

      log = await prisma.attendanceLog.upsert({
        where:  { staff_id_date: { staff_id: staffProfile.staff_id, date: todayStart } },
        update: { check_in: now, status: "Present" as any },
        create: {
          staff_id: staffProfile.staff_id,
          user_id:  userId,
          date:     todayStart,
          status:   "Present" as any,
          check_in: now,
        },
      });

      // Mark on duty
      await prisma.staff.update({
        where: { staff_id: staffProfile.staff_id },
        data:  { is_on_duty: true, attendance_status: "Present" as any },
      });
    } else if (action === "checkout") {
      if (!log) {
        return NextResponse.json({ error: "No check-in found for today" }, { status: 400 });
      }
      if (log.check_out) {
        return NextResponse.json({ error: "Already checked out today" }, { status: 409 });
      }

      // Calculate hours
      let hours: number | null = null;
      if (log.check_in) {
        hours = Math.round(((now.getTime() - new Date(log.check_in).getTime()) / 3_600_000) * 10) / 10;
      }

      log = await prisma.attendanceLog.update({
        where: { id: log.id },
        data:  { check_out: now, hours },
      });

      // Mark off duty
      await prisma.staff.update({
        where: { staff_id: staffProfile.staff_id },
        data:  { is_on_duty: false },
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'checkin' or 'checkout'" }, { status: 400 });
    }

    const serialized = {
      id:        log.id,
      staff_id:  log.staff_id,
      date:      log.date instanceof Date ? log.date.toISOString().split("T")[0] : log.date,
      status:    log.status,
      check_in:  log.check_in  ? new Date(log.check_in).toISOString()  : null,
      check_out: log.check_out ? new Date(log.check_out).toISOString() : null,
      hours:     log.hours ? Number(log.hours) : null,
      notes:     log.notes ?? null,
    };

    return NextResponse.json({ log: serialized, action });
  } catch (err) {
    console.error("[POST /api/staff/me/checkin]", err);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}