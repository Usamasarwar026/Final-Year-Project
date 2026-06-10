// src/app/api/staff/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

type Params = { params: Promise<{ id: string }> };

const STAFF_PROFILE_INCLUDE = {
  include: { department: true, shift: true },
} as const;

// ─── GET /api/staff/[id] ──────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monthAgo = new Date(Date.now() - 30 * 86_400_000);
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id: id, role: "STAFF" },
      include: {
        staffProfile: STAFF_PROFILE_INCLUDE,
        attendance: {
          where: { date: { gte: monthAgo } },
          orderBy: { date: "desc" },
          take: 31,
        },
      },
    });

    if (!user)
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    const summary = {
      present: user.attendance.filter((a) => a.status === "Present").length,
      absent: user.attendance.filter((a) => a.status === "Absent").length,
      halfDay: user.attendance.filter((a) => a.status === "HalfDay").length,
      leave: user.attendance.filter((a) => a.status === "Leave").length,
      totalHours: user.attendance.reduce(
        (s, a) => s + (Number(a.hours) || 0),
        0,
      ),
    };

    return NextResponse.json({
      staff: {
        ...user,
        password: undefined,
        staffProfile: user.staffProfile
          ? {
              ...user.staffProfile,
              basic_salary: user.staffProfile.basic_salary
                ? Number(user.staffProfile.basic_salary)
                : null,
            }
          : null,
      },
      attendanceSummary: summary,
    });
  } catch (err) {
    console.error("[GET /api/staff/[id]]", err);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/staff/[id] ────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      // User fields
      name,
      phoneNumber,
      address,
      city,
      country,
      permissions,
      isActive,
      // Staff profile fields — now using IDs not enums
      department_id,
      designation,
      shift_id,
      joining_date,
      basic_salary,
      performance_notes,
      is_on_duty,
    } = body;

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id: id } });
    if (!user)
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // ── User fields ──
      const userUpdate: Record<string, unknown> = {};
      if (name !== undefined) userUpdate.name = name;
      if (phoneNumber !== undefined) userUpdate.phoneNumber = phoneNumber;
      if (address !== undefined) userUpdate.address = address;
      if (city !== undefined) userUpdate.city = city;
      if (country !== undefined) userUpdate.country = country;
      if (permissions !== undefined) userUpdate.permissions = permissions;
      if (isActive !== undefined) userUpdate.isActive = isActive;

      const { id } = await params;
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({ where: { id: id }, data: userUpdate });
      }

      // ── Staff profile fields ──
      const staffUpdate: Record<string, unknown> = {};
      if (department_id !== undefined)
        staffUpdate.department_id = department_id;
      if (designation !== undefined) staffUpdate.designation = designation;
      if (shift_id !== undefined) staffUpdate.shift_id = shift_id;
      if (joining_date !== undefined)
        staffUpdate.joining_date = joining_date ? new Date(joining_date) : null;
      if (basic_salary !== undefined) staffUpdate.basic_salary = basic_salary;
      if (performance_notes !== undefined)
        staffUpdate.performance_notes = performance_notes;
      if (is_on_duty !== undefined) staffUpdate.is_on_duty = is_on_duty;
      if (isActive !== undefined) staffUpdate.is_active = isActive;

      if (Object.keys(staffUpdate).length > 0) {
        await tx.staff.upsert({
          where: { user_id: id },
          update: staffUpdate,
          create: {
            user_id: id,
            designation: designation ?? "Staff",
            department_id: department_id ?? null,
            shift_id: shift_id ?? null,
            ...staffUpdate,
          },
        });
      }
    });

    const updated = await prisma.user.findUnique({
      where: { id: id },
      include: { staffProfile: STAFF_PROFILE_INCLUDE },
    });

    // Trigger Notification for Staff Member on updates
    try {
      const { createNotification } = await import("@/services/notificationService");
      await createNotification({
        title: "Staff Profile Updated",
        message: `Your profile details (designation, shift, or department) have been updated by Admin.`,
        type: "staff",
        priority: "Low",
        module: "staff",
        reference_id: id,
        recipient_user_id: id,
      });
    } catch (notifErr) {
      console.error("[PATCH /api/staff/[id]] Notification trigger failed:", notifErr);
    }

    return NextResponse.json({
      staff: {
        ...updated,
        password: undefined,
        staffProfile: updated?.staffProfile
          ? {
              ...updated.staffProfile,
              basic_salary: updated.staffProfile.basic_salary
                ? Number(updated.staffProfile.basic_salary)
                : null,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/staff/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update staff" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/staff/[id] — soft delete ─────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: id },
        data: { isActive: false },
      }),
      prisma.staff.updateMany({
        where: { user_id: id },
        data: { is_active: false, is_on_duty: false },
      }),
    ]);

    // Trigger Notification for Staff Member
    try {
      const { createNotification } = await import("@/services/notificationService");
      await createNotification({
        title: "Account Deactivated",
        message: "Your staff account has been deactivated by Admin.",
        type: "staff",
        priority: "High",
        module: "staff",
        reference_id: id,
        recipient_user_id: id,
      });
    } catch (notifErr) {
      console.error("[DELETE /api/staff/[id]] Notification trigger failed:", notifErr);
    }

    return NextResponse.json({ ok: true, message: "Staff deactivated" });
  } catch (err) {
    console.error("[DELETE /api/staff/[id]]", err);
    return NextResponse.json(
      { error: "Failed to deactivate staff" },
      { status: 500 },
    );
  }
}


