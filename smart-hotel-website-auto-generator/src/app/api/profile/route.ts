import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/lib/prisma";

// GET — current user's profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      country: true,
      city: true,
      isVerified: true,
      lastLogin: true,
      createdAt: true,
      _count: { select: { projects: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PATCH — update editable fields only
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body = await req.json();

  const { name, phoneNumber, country, city } = body as {
    name?: string;
    phoneNumber?: string;
    country?: string;
    city?: string;
  };

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Name is required", field: "name" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name.trim(),
      phoneNumber: phoneNumber?.trim() || null,
      country: country?.trim() || null,
      city: city?.trim() || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      country: true,
      city: true,
      isVerified: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}