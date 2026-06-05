// src/app/api/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/sendEmail";

// const STAFF_INCLUDE = {
//   staffProfile: {
//     include: { department: true, shift: true },
//   },
//   attendance: false,
// } as const;

// ─── GET /api/staff ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    // const search = searchParams.get("q")?.toLowerCase();
    // const departmentId = searchParams.get("department_id");
    // const shiftId = searchParams.get("shift_id");
    const isActive = searchParams.get("active");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86_400_000);

    const whereClause: any = {
      role: "STAFF",
    };

    if (isActive === "true") {
      whereClause.isActive = true;
    }

    if (isActive === "false") {
      whereClause.isActive = false;
    }

    const staffUsers = await prisma.user.findMany({
      where: whereClause,
      include: {
        staffProfile: {
          include: {
            department: true,
            shift: true,
          },
        },
        attendance: {
          where: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
          orderBy: {
            created_at: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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
      attendance: undefined,
    }));

    return NextResponse.json({ staff: serialized });
  } catch (err) {
    console.error("[GET /api/staff]", err);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 },
    );
  }
}

// ─── POST /api/staff ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      email,
      phoneNumber,
      cnic,
      dateOfBirth,
      address,
      city,
      country,
      department_id,
      designation,
      shift_id,
      joining_date,
      basic_salary,
      permissions = [],
    } = body;

    // Validation
    if (!name?.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 422 });
    if (!email?.trim())
      return NextResponse.json({ error: "Email is required" }, { status: 422 });
    if (!department_id)
      return NextResponse.json(
        { error: "Department is required" },
        { status: 422 },
      );
    if (!designation?.trim())
      return NextResponse.json(
        { error: "Designation is required" },
        { status: 422 },
      );
    if (!shift_id)
      return NextResponse.json({ error: "Shift is required" }, { status: 422 });

    // Duplicate check
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing)
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );

    if (cnic) {
      const cnicExists = await prisma.staff.findUnique({ where: { cnic } });
      if (cnicExists)
        return NextResponse.json(
          { error: "CNIC already registered" },
          { status: 409 },
        );
    }

    // Validate dept + shift exist
    const dept = await prisma.departmentConfig.findFirst({
      where: { id: department_id, is_active: true },
    });
    if (!dept)
      return NextResponse.json(
        { error: "Invalid department" },
        { status: 422 },
      );

    const shift = await prisma.shiftConfig.findFirst({
      where: { id: shift_id, is_active: true },
    });
    if (!shift)
      return NextResponse.json({ error: "Invalid shift" }, { status: 422 });

    // Generate employee ID
    // const count = await prisma.user.count({ where: { role: "STAFF" } });
    // const employeeId = `EMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    let employeeId = "";
    let exists = true;

    while (exists) {
      const random = Math.floor(1000 + Math.random() * 9000);

      employeeId = `EMP-${new Date().getFullYear()}-${random}`;

      const found = await prisma.user.findUnique({
        where: { employeeId },
      });

      exists = !!found;
    }
    // console.log("Staff Count:", count);
    console.log("Generated Employee ID:", employeeId);
    const tempPassword = generatePassword();
    const hashed = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashed,
          phoneNumber: phoneNumber?.trim() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          country: country?.trim() || null,
          cnic: cnic?.trim() || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          role: "STAFF",
          employeeId,
          permissions,
          isActive: true,
          isVerified: false,
          createdByAdmin: true,
        },
      });

      await tx.staff.create({
        data: {
          user_id: newUser.id,
          cnic: cnic?.trim() || null,
          department_id,
          designation: designation.trim(),
          shift_id,
          joining_date: joining_date ? new Date(joining_date) : new Date(),
          basic_salary: basic_salary ?? null,
          is_on_duty: false,
          is_active: true,
        },
      });

      return newUser;
    });

    await sendEmail({
      to: user.email,
      subject: "Your Hotel Account Credentials",
      html: `
        <h2>Welcome ${user.name}</h2>
    
        <p>Your account has been created.</p>
    
        <p>Email: ${user.email}</p>
    
        <p>Password: ${tempPassword}</p>
    
        <a href="${process.env.NEXTAUTH_URL}/login">
          Login
        </a>
      `,
    });
    // TODO: await sendStaffWelcomeEmail({ to: user.email, name: user.name, employeeId, tempPassword })
    console.log(
      `[New Staff] ${user.email} | ${employeeId} | Temp: ${tempPassword}`,
    );

    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: { staffProfile: { include: { department: true, shift: true } } },
    });

    return NextResponse.json(
      {
        staff: { ...full, password: undefined },
        tempPassword,
        employeeId,
        message: "Staff created. Credentials sent to email.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/staff]==>", err);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 },
    );
  }
}

function generatePassword(len = 12): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#!";
  return Array.from(
    { length: len },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}
