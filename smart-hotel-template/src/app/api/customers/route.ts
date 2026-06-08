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
    const search = searchParams.get("q")?.toLowerCase();

    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phoneNumber: { contains: search, mode: "insensitive" } },
                { cnic: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        profileImage: true,
        cnic: true,
        city: true,
        country: true,
        isActive: true,
        createdByAdmin: true,
        createdAt: true,
        bookings: {
          select: { booking_id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customers });
  } catch (err) {
    console.error("[GET /api/customers]", err);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}

// ─── POST /api/customers ───────────────────────────────────────────────────
// Admin creates a new customer account + sends credentials via email
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phoneNumber, cnic, city, country, password } = body;

    if (!name?.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 422 });
    if (!email?.trim())
      return NextResponse.json({ error: "Email is required" }, { status: 422 });

    // Check duplicate
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // Auto-generate password if not provided
    const rawPassword = password?.trim() || generatePassword();
    console.log("RAW PASSWORD:", rawPassword);
    const hashed = await bcrypt.hash(rawPassword, 12);

    const customer = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashed,
        phoneNumber: phoneNumber?.trim() || null,
        cnic: cnic?.trim() || null,
        city: city?.trim() || null,
        country: country?.trim() || null,
        role: "CUSTOMER",
        isActive: true,
        isVerified: false,
        createdByAdmin: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        cnic: true,
        city: true,
        country: true,
        isActive: true,
        createdAt: true,
      },
    });

    // ── TODO: Send welcome email with credentials ──────────────────
    await sendEmail({
      to: customer.email,
      subject: "Your Hotel Account Credentials",
      html: `
    <h2>Welcome ${customer.name}</h2>

    <p>Your account has been created.</p>

    <p>Email: ${customer.email}</p>

    <p>Password: ${rawPassword}</p>

    <a href="${process.env.NEXTAUTH_URL}/login">
      Login
    </a>
  `,
    });
    // For now we return the temp password so admin can share it manually
    console.log(
      `[New Customer] ${customer.email} / temp password: ${rawPassword}`,
    );

    // Trigger Notifications for Customer & Admin
    try {
      const { createNotification } = await import("@/services/notificationService");
      
      // Notify guest
      await createNotification({
        title: "Welcome to Smart Hotel!",
        message: `Your guest account has been successfully created. We look forward to hosting you!`,
        type: "customer",
        priority: "Medium",
        module: "customer",
        reference_id: customer.id,
        recipient_user_id: customer.id,
      });

      // Notify Admin
      await createNotification({
        title: "Guest Registered",
        message: `New customer ${customer.name} has been registered.`,
        type: "customer",
        priority: "Low",
        module: "customer",
        reference_id: customer.id,
        role_target: "ADMIN",
      });
    } catch (notifErr) {
      console.error("[POST /api/customers] Notification trigger failed:", notifErr);
    }

    return NextResponse.json(
      {
        customer,
        tempPassword: rawPassword,
        message: "Customer created. Credentials logged to console.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/customers]", err);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 },
    );
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
