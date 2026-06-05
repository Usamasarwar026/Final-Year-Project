// src/app/api/staff/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

function serializeLog(l: any) {
  return {
    id:         l.id,
    staff_id:   l.staff_id,
    date:       l.date instanceof Date ? l.date.toISOString().split("T")[0] : String(l.date).split("T")[0],
    status:     l.status,
    check_in:   l.check_in  ? new Date(l.check_in).toISOString()  : null,
    check_out:  l.check_out ? new Date(l.check_out).toISOString() : null,
    hours:      l.hours  != null ? Number(l.hours)  : null,
    notes:      l.notes  ?? null,
    created_at: new Date(l.created_at).toISOString(),
  };
}

export async function GET(_req: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where:   { id: userId },
      include: { staffProfile: { include: { department: true, shift: true } } },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Today log - precise match
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 86_400_000);

    const todayLogRaw = user.staffProfile
      ? await prisma.attendanceLog.findFirst({
          where: {
            staff_id: user.staffProfile.staff_id,
            date: { gte: todayStart, lt: todayEnd },
          },
        })
      : null;

    // Last 31 days
    const monthAgo = new Date(Date.now() - 31 * 86_400_000);
    const logsRaw = user.staffProfile
      ? await prisma.attendanceLog.findMany({
          where:   { staff_id: user.staffProfile.staff_id, date: { gte: monthAgo } },
          orderBy: { date: "desc" },
        })
      : [];

    const present    = logsRaw.filter((l) => l.status === "Present").length;
    const absent     = logsRaw.filter((l) => l.status === "Absent").length;
    const halfDay    = logsRaw.filter((l) => l.status === "HalfDay").length;
    const leave      = logsRaw.filter((l) => l.status === "Leave").length;
    const totalHours = logsRaw.reduce((s, l) => s + (Number(l.hours) || 0), 0);
    const totalDays  = logsRaw.length;
    const attendanceRate = totalDays > 0
      ? Math.round(((present + halfDay * 0.5) / totalDays) * 100) : 0;

    return NextResponse.json({
      profile: {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        phoneNumber:  user.phoneNumber  ?? null,
        profileImage: user.profileImage ?? null,
        address:      user.address      ?? null,
        city:         user.city         ?? null,
        country:      user.country      ?? null,
        employeeId:   user.employeeId   ?? null,
        permissions:  user.permissions,
        cnic:         user.cnic         ?? null,
        dateOfBirth:  user.dateOfBirth  ? user.dateOfBirth.toISOString().split("T")[0] : null,
        isActive:     user.isActive,
        isVerified:   user.isVerified,
        lastLogin:    user.lastLogin    ? user.lastLogin.toISOString() : null,
        createdAt:    user.createdAt.toISOString(),
        staffProfile: user.staffProfile ? {
          staff_id:          user.staffProfile.staff_id,
          designation:       user.staffProfile.designation,
          joining_date:      user.staffProfile.joining_date
            ? user.staffProfile.joining_date.toISOString().split("T")[0] : null,
          basic_salary:      user.staffProfile.basic_salary != null
            ? Number(user.staffProfile.basic_salary) : null,
          is_on_duty:        user.staffProfile.is_on_duty,
          is_active:         user.staffProfile.is_active,
          attendance_status: user.staffProfile.attendance_status ?? null,
          performance_notes: user.staffProfile.performance_notes ?? null,
          department:        user.staffProfile.department ?? null,
          shift:             user.staffProfile.shift      ?? null,
        } : null,
      },
      todayLog:       todayLogRaw ? serializeLog(todayLogRaw) : null,
      attendanceLogs: logsRaw.map(serializeLog),
      stats: { present, absent, halfDay, leave, totalHours, totalDays, attendanceRate },
    }); 
  } catch (err) {
    console.error("[GET /api/staff/me]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}