// src/app/api/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/sendEmail";

// ─── GET /api/staff ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
    const search = searchParams.get("q")?.trim();
    const dept   = searchParams.get("dept");
    const shift  = searchParams.get("shift");
    const att    = searchParams.get("att");   // attendance_status filter
    const active = searchParams.get("active");

    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86_400_000);

    const where: any = { role: "STAFF" };

    if (active === "true")  where.isActive = true;
    if (active === "false") where.isActive = false;

    if (search) {
      where.OR = [
        { name:       { contains: search, mode: "insensitive" } },
        { email:      { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
        { staffProfile: { designation: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (dept) {
      where.staffProfile = { ...where.staffProfile, department_id: parseInt(dept) };
    }
    if (shift) {
      where.staffProfile = { ...where.staffProfile, shift_id: parseInt(shift) };
    }
    if (att) {
      where.staffProfile = { ...where.staffProfile, attendance_status: att };
    }

    const [total, staffUsers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          staffProfile: {
            include: { department: true, shift: true },
          },
          attendance: {
            where:   { date: { gte: today, lt: tomorrow } },
            orderBy: { created_at: "desc" },
            take:    1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
    ]);

    const serialized = staffUsers.map((u) => ({
      ...u,
      password: undefined,
      staffProfile: u.staffProfile
        ? {
            ...u.staffProfile,
            basic_salary: u.staffProfile.basic_salary
              ? Number(u.staffProfile.basic_salary)
              : null,
          }
        : null,
      todayAttendance: u.attendance[0] ?? null,
      attendance:      undefined,
    }));

    return NextResponse.json({
      staff: serialized,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/staff]", err);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// ─── POST /api/staff ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, email, phoneNumber, cnic, dateOfBirth,
      address, city, country,
      department_id, designation, shift_id,
      joining_date, basic_salary, permissions = [],
    } = body;

    if (!name?.trim())        return NextResponse.json({ error: "Name is required" },        { status: 422 });
    if (!email?.trim())       return NextResponse.json({ error: "Email is required" },       { status: 422 });
    if (!department_id)       return NextResponse.json({ error: "Department is required" },  { status: 422 });
    if (!designation?.trim()) return NextResponse.json({ error: "Designation is required" }, { status: 422 });
    if (!shift_id)            return NextResponse.json({ error: "Shift is required" },       { status: 422 });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    if (cnic) {
      const cnicExists = await prisma.staff.findUnique({ where: { cnic } });
      if (cnicExists) return NextResponse.json({ error: "CNIC already registered" }, { status: 409 });
    }

    const dept = await prisma.departmentConfig.findFirst({ where: { id: department_id, is_active: true } });
    if (!dept) return NextResponse.json({ error: "Invalid department" }, { status: 422 });

    const shift = await prisma.shiftConfig.findFirst({ where: { id: shift_id, is_active: true } });
    if (!shift) return NextResponse.json({ error: "Invalid shift" }, { status: 422 });

    // Generate unique employee ID
    let employeeId = "";
    let exists     = true;
    while (exists) {
      const random = Math.floor(1000 + Math.random() * 9000);
      employeeId   = `EMP-${new Date().getFullYear()}-${random}`;
      const found  = await prisma.user.findUnique({ where: { employeeId } });
      exists       = !!found;
    }

    const tempPassword = generatePassword();
    const hashed       = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name:           name.trim(),
          email:          email.toLowerCase().trim(),
          password:       hashed,
          phoneNumber:    phoneNumber?.trim()  || null,
          address:        address?.trim()      || null,
          city:           city?.trim()         || null,
          country:        country?.trim()      || null,
          cnic:           cnic?.trim()         || null,
          dateOfBirth:    dateOfBirth ? new Date(dateOfBirth) : null,
          role:           "STAFF",
          employeeId,
          permissions,
          isActive:       true,
          isVerified:     false,
          createdByAdmin: true,
        },
      });

      await tx.staff.create({
        data: {
          user_id:       newUser.id,
          cnic:          cnic?.trim() || null,
          department_id,
          designation:   designation.trim(),
          shift_id,
          joining_date:  joining_date ? new Date(joining_date) : new Date(),
          basic_salary:  basic_salary ?? null,
          is_on_duty:    false,
          is_active:     true,
        },
      });

      return newUser;
    });

    await sendEmail({
      to:      user.email,
      subject: "Your Hotel Account Credentials",
      html: `
        <h2>Welcome ${user.name}</h2>
        <p>Your account has been created.</p>
        <p>Email: ${user.email}</p>
        <p>Password: ${tempPassword}</p>
        <a href="${process.env.NEXTAUTH_URL}/login">Login</a>
      `,
    });

    const full = await prisma.user.findUnique({
      where:   { id: user.id },
      include: { staffProfile: { include: { department: true, shift: true } } },
    });

    try {
      const { createNotification } = await import("@/services/notificationService");
      await createNotification({
        title: "New Staff Registered",
        message: `Staff member ${user.name} (${designation}) has been registered with ID ${employeeId}.`,
        type: "staff", priority: "Low", module: "staff",
        reference_id: user.id, role_target: "ADMIN",
      });
      await createNotification({
        title: "Welcome to Smart Hotel!",
        message: `Your staff account is ready. Your Employee ID is ${employeeId}. Welcome to the team!`,
        type: "staff", priority: "Medium", module: "staff",
        reference_id: user.id, recipient_user_id: user.id,
      });
    } catch (notifErr) {
      console.error("[POST /api/staff] Notification trigger failed:", notifErr);
    }

    return NextResponse.json(
      {
        staff:       { ...full, password: undefined },
        tempPassword,
        employeeId,
        message:     "Staff created. Credentials sent to email.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/staff]", err);
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 });
  }
}

function generatePassword(len = 12): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#!";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}