// src/app/api/staff/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// ─── GET /api/staff/attendance ─────────────────────────────────────────────────
// ?date=YYYY-MM-DD     → all staff attendance for that date (default: today)
// ?staffId=N           → last 31 days for one staff member
// ?month=YYYY-MM       → full month summary for all staff
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");
    const date    = searchParams.get("date");
    const month   = searchParams.get("month"); // "2025-06"

    // ── Single staff history ─────────────────────────────────
    if (staffId) {
      const monthAgo = new Date(Date.now() - 31 * 86_400_000);
      const logs = await prisma.attendanceLog.findMany({
        where:   { staff_id: parseInt(staffId), date: { gte: monthAgo } },
        orderBy: { date: "desc" },
      });
      const serialized = logs.map((l) => ({
        ...l,
        date:      l.date instanceof Date ? l.date.toISOString().split("T")[0] : l.date,
        check_in:  l.check_in  ? new Date(l.check_in).toISOString()  : null,
        check_out: l.check_out ? new Date(l.check_out).toISOString() : null,
        created_at: l.created_at.toISOString(),
        updated_at: l.updated_at.toISOString(),
      }));
      return NextResponse.json({ logs: serialized });
    }

    // ── Full month for all staff (for calendar/summary view) ─
    if (month) {
      const [y, m] = month.split("-").map(Number);
      const start  = new Date(y, m - 1, 1);
      const end    = new Date(y, m, 1);

      const logs = await prisma.attendanceLog.findMany({
        where:   { date: { gte: start, lt: end } },
        include: {
          staff: {
            include: {
              user:       { select: { id: true, name: true, email: true, profileImage: true } },
              department: true,
            },
          },
        },
        orderBy: [{ date: "asc" }, { staff_id: "asc" }],
      });

      const serialized = logs.map((l) => ({
        ...l,
        date:      l.date instanceof Date ? l.date.toISOString().split("T")[0] : l.date,
        check_in:  l.check_in  ? new Date(l.check_in).toISOString()  : null,
        check_out: l.check_out ? new Date(l.check_out).toISOString() : null,
        created_at: l.created_at.toISOString(),
        updated_at: l.updated_at.toISOString(),
      }));
      return NextResponse.json({ logs: serialized });
    }

    // ── Specific date (default: today) with full staff list ──
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate.getTime() + 86_400_000);

    // Get ALL active staff
    const allStaff = await prisma.user.findMany({
      where:   { role: "STAFF", isActive: true },
      include: {
        staffProfile: { include: { department: true, shift: true } },
        attendance: {
          where:   { date: { gte: targetDate, lt: nextDay } },
          take:    1,
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const staffList = allStaff.map((u) => ({
      id:           u.id,
      name:         u.name,
      email:        u.email,
      employeeId:   u.employeeId,
      profileImage: u.profileImage,
      staffProfile: u.staffProfile
        ? {
            ...u.staffProfile,
            basic_salary: u.staffProfile.basic_salary ? Number(u.staffProfile.basic_salary) : null,
          }
        : null,
      todayLog: u.attendance[0]
        ? {
            ...u.attendance[0],
            date:      u.attendance[0].date instanceof Date ? u.attendance[0].date.toISOString().split("T")[0] : u.attendance[0].date,
            check_in:  u.attendance[0].check_in  ? new Date(u.attendance[0].check_in).toISOString()  : null,
            check_out: u.attendance[0].check_out ? new Date(u.attendance[0].check_out).toISOString() : null,
            created_at: u.attendance[0].created_at.toISOString(),
            updated_at: u.attendance[0].updated_at.toISOString(),
          }
        : null,
    }));

    // Summary counts
    const summary = {
      total:    staffList.length,
      present:  staffList.filter((s) => s.todayLog?.status === "Present").length,
      absent:   staffList.filter((s) => s.todayLog?.status === "Absent").length,
      halfDay:  staffList.filter((s) => s.todayLog?.status === "HalfDay").length,
      leave:    staffList.filter((s) => s.todayLog?.status === "Leave").length,
      onDuty:   staffList.filter((s) => s.staffProfile?.is_on_duty).length,
      unmarked: staffList.filter((s) => !s.todayLog).length,
    };

    return NextResponse.json({ staff: staffList, summary, date: targetDate.toISOString().split("T")[0] });
  } catch (err) {
    console.error("[GET /api/staff/attendance]", err);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// ─── POST /api/staff/attendance — mark single or bulk ────────────────────────
// Single: { staff_id, user_id, status, date?, check_in?, check_out?, notes? }
// Bulk:   { bulk: [{ staff_id, user_id, status }], date?, status? }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // ── Bulk mark ────────────────────────────────────────────
    if (body.bulk && Array.isArray(body.bulk)) {
      const logDate = body.date ? new Date(body.date) : new Date();
      logDate.setHours(0, 0, 0, 0);

      const results = await Promise.all(
        body.bulk.map(async (item: { staff_id: number; user_id: string; status: string }) => {
          const log = await prisma.attendanceLog.upsert({
            where:  { staff_id_date: { staff_id: item.staff_id, date: logDate } },
            update: { status: item.status as any },
            create: {
              staff_id: item.staff_id,
              user_id:  item.user_id,
              date:     logDate,
              status:   item.status as any,
            },
          });
          await prisma.staff.update({
            where: { staff_id: item.staff_id },
            data:  { attendance_status: item.status as any },
          });
          return log;
        })
      );

      return NextResponse.json({ logs: results, count: results.length });
    }

    // ── Single mark ──────────────────────────────────────────
    const { staff_id, user_id, status, date, check_in, check_out, notes } = body;

    if (!staff_id || !user_id || !status) {
      return NextResponse.json({ error: "staff_id, user_id, status are required" }, { status: 422 });
    }

    const logDate = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    let hours: number | null = null;
    if (check_in && check_out) {
      const ci = new Date(check_in);
      const co = new Date(check_out);
      hours    = Math.round(((co.getTime() - ci.getTime()) / 3_600_000) * 10) / 10;
    }

    const log = await prisma.attendanceLog.upsert({
      where:  { staff_id_date: { staff_id: parseInt(staff_id), date: logDate } },
      update: {
        status:    status as any,
        check_in:  check_in  ? new Date(check_in)  : null,
        check_out: check_out ? new Date(check_out) : null,
        hours,
        notes:     notes || null,
      },
      create: {
        staff_id: parseInt(staff_id),
        user_id,
        date:     logDate,
        status:   status as any,
        check_in:  check_in  ? new Date(check_in)  : null,
        check_out: check_out ? new Date(check_out) : null,
        hours,
        notes:     notes || null,
      },
    });

    // Update quick-access field on Staff
    await prisma.staff.update({
      where: { staff_id: parseInt(staff_id) },
      data:  { attendance_status: status as any },
    });

    const serialized = {
      ...log,
      date:      log.date instanceof Date ? log.date.toISOString().split("T")[0] : log.date,
      check_in:  log.check_in  ? new Date(log.check_in).toISOString()  : null,
      check_out: log.check_out ? new Date(log.check_out).toISOString() : null,
      created_at: log.created_at.toISOString(),
      updated_at: log.updated_at.toISOString(),
    };

    return NextResponse.json({ log: serialized });
  } catch (err) {
    console.error("[POST /api/staff/attendance]", err);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}

// ─── PATCH /api/staff/attendance — toggle on-duty ─────────────────────────────
// Body: { staff_id: number, is_on_duty: boolean }
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { staff_id, is_on_duty } = await req.json();
    if (staff_id === undefined || is_on_duty === undefined) {
      return NextResponse.json({ error: "staff_id and is_on_duty required" }, { status: 422 });
    }

    const updated = await prisma.staff.update({
      where: { staff_id: parseInt(staff_id) },
      data:  { is_on_duty },
      include: { department: true, shift: true },
    });

    return NextResponse.json({ staff: { ...updated, basic_salary: updated.basic_salary ? Number(updated.basic_salary) : null } });
  } catch (err) {
    console.error("[PATCH /api/staff/attendance]", err);
    return NextResponse.json({ error: "Failed to update duty status" }, { status: 500 });
  }
}