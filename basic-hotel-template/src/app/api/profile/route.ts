import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// Shared select — ek jagah define, dono endpoints use karein
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
  profileImage: true,
  address: true,
  cnic: true,
  dateOfBirth: true,
  city: true,
  country: true,
  role: true,
  isVerified: true,
  isActive: true,
  createdAt: true,
} as const;

// Fields jo user update kar sakta hai — strict whitelist
const ALLOWED_PATCH_FIELDS = [
  "name",
  "phoneNumber",
  "address",
  "city",
  "country",
  "cnic",
  "dateOfBirth",
  "profileImage",
] as const;

type AllowedField = (typeof ALLOWED_PATCH_FIELDS)[number];

// ── GET /api/profile ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: USER_SELECT,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, {
      headers: {
        // Browser/CDN mein 30s cache, stale data 5min tak serve kar sakta hai background revalidate ke saath
        "Cache-Control": "private, max-age=30, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[GET /api/profile]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── PATCH /api/profile ────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Whitelist filter — sirf allowed fields, empty string → null
    const data: Partial<Record<AllowedField, unknown>> = {};
    for (const key of ALLOWED_PATCH_FIELDS) {
      if (key in body) {
        data[key] = body[key] === "" ? null : body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 },
      );
    }

    // dateOfBirth string → Date object
    if (typeof data.dateOfBirth === "string") {
      const parsed = new Date(data.dateOfBirth);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "Invalid dateOfBirth format" },
          { status: 400 },
        );
      }
      data.dateOfBirth = parsed;
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: USER_SELECT,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    // Prisma unique constraint violation (e.g. duplicate cnic/phone)
    if (err?.code === "P2002") {
      const field = err.meta?.target?.[0] ?? "field";
      return NextResponse.json(
        { error: `${field} already in use` },
        { status: 409 },
      );
    }
    // Record not found
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("[PATCH /api/profile]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
