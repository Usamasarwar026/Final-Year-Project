// src/app/api/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// ── GET /api/profile ──
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id:           true,
      name:         true,
      email:        true,
      phoneNumber:  true,
      profileImage: true,
      address:      true,
      city:         true,
      country:      true,
      role:         true,
      designation:  true,
      employeeId:   true,
      isVerified:   true,
      isActive:     true,
      createdAt:    true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// ── PATCH /api/profile ──
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Sirf ye fields update ho sakti hain — security ke liye strict list
  const allowed = ["name", "phoneNumber", "address", "city", "country", "profileImage"];
  const data: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) {
      // Empty string ko null mein convert karo
      data[key] = body[key] === "" ? null : body[key];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: (session.user as any).id },
    data,
    select: {
      id:           true,
      name:         true,
      email:        true,
      phoneNumber:  true,
      profileImage: true,
      address:      true,
      city:         true,
      country:      true,
      role:         true,
      designation:  true,
      employeeId:   true,
      isVerified:   true,
      isActive:     true,
      createdAt:    true,
    },
  });

  return NextResponse.json(updated);
}