// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// GET — fetch current user profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      address: true,
      city: true,
      country: true,
      role: true,
      designation: true,
      employeeId: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PATCH — update profile fields
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Only allow safe fields to be updated
  const allowedFields = ["name", "phoneNumber", "address", "city", "country", "profileImage"];
  const updateData: Record<string, unknown> = {};

  for (const key of allowedFields) {
    if (key in body) updateData[key] = body[key];
  }

  const updated = await prisma.user.update({
    where: { id: (session.user as any).id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      address: true,
      city: true,
      country: true,
      role: true,
      designation: true,
      employeeId: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}