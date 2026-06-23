// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/sendEmail";

// ─── GET /api/customers ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const search  = searchParams.get("q")?.toLowerCase().trim();
    const status  = searchParams.get("status");  // "active" | "suspended"
    const source  = searchParams.get("source");  // "admin" | "self"
    const page    = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));

    const where: any = { role: "CUSTOMER" };

    // Search filter
    if (search) {
      where.OR = [
        { name:        { contains: search, mode: "insensitive" } },
        { email:       { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { cnic:        { contains: search, mode: "insensitive" } },
        { city:        { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status === "active")    where.isActive = true;
    if (status === "suspended") where.isActive = false;

    // Source filter
    if (source === "admin") where.createdByAdmin = true;
    if (source === "self")  where.createdByAdmin = false;

    const [total, customers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        //   id: true,
        //   name: true,
        //   email: true,
        //   phoneNumber: true,
        //   profileImage: true,
        //   cnic: true,
        //   address: true,
        //   city: true,
        //   country: true,
        //   dateOfBirth: true,
        //   isActive: true,
        //   isVerified: true,
        //   createdByAdmin: true,
        //   lastLogin: true,
        //   createdAt: true,
        //   updatedAt: true,
        // },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Serialize dates
    const serialized = customers.map((c) => ({
      ...c,
      dateOfBirth:  c.dateOfBirth  ? (c.dateOfBirth  as Date).toISOString() : null,
      lastLogin:    c.lastLogin    ? (c.lastLogin    as Date).toISOString() : null,
      createdAt:    (c.createdAt   as Date).toISOString(),
      updatedAt:    (c.updatedAt   as Date).toISOString(),
    }));

    return NextResponse.json({
      customers: serialized,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/customers]", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

// ─── POST /api/customers ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phoneNumber, cnic, city, country, password } = body;

    if (!name?.trim())
      return NextResponse.json({ error: "Name is required" },  { status: 422 });
    if (!email?.trim())
      return NextResponse.json({ error: "Email is required" }, { status: 422 });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing)
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const rawPassword = password?.trim() || generatePassword();
    const hashed      = await bcrypt.hash(rawPassword, 12);

    const customer = await prisma.user.create({
      data: {
        name:           name.trim(),
        email:          email.toLowerCase().trim(),
        password:       hashed,
        phoneNumber:    phoneNumber?.trim()  || null,
        cnic:           cnic?.trim()         || null,
        city:           city?.trim()         || null,
        country:        country?.trim()      || null,
        role:           "CUSTOMER",
        isActive:       true,
        isVerified:     false,
        createdByAdmin: true,
      },
      select: {
        id: true, name: true, email: true,
        phoneNumber: true, cnic: true, city: true,
        country: true, isActive: true, createdAt: true,
      },
    });

    await sendEmail({
      to: customer.email,
      subject: "Your Hotel Account Credentials",
      html: `
        <h2>Welcome ${customer.name}</h2>
        <p>Your account has been created.</p>
        <p>Email: ${customer.email}</p>
        <p>Password: ${rawPassword}</p>
        <a href="${process.env.NEXTAUTH_URL}/login">Login</a>
      `,
    });

    try {
      const { createNotification } = await import("@/services/notificationService");
      await createNotification({
        title: "Welcome to Smart Hotel!",
        message: "Your guest account has been successfully created. We look forward to hosting you!",
        type: "customer", priority: "Medium", module: "customer",
        reference_id: customer.id, recipient_user_id: customer.id,
      });
      await createNotification({
        title: "Guest Registered",
        message: `New customer ${customer.name} has been registered.`,
        type: "customer", priority: "Low", module: "customer",
        reference_id: customer.id, role_target: "ADMIN",
      });
    } catch (notifErr) {
      console.error("[POST /api/customers] Notification trigger failed:", notifErr);
    }

    return NextResponse.json(
      { customer, tempPassword: rawPassword, message: "Customer created successfully." },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/customers]", err);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function generatePassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#!";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}