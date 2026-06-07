// src/app/api/kitchen/staff-by-user/[userId]/route.ts (NEW)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId, role: "STAFF" },
      include: {
        staffProfile: {
          include: {
            department: true,
            shift: true,
          },
        },
      },
    });

    if (!user || !user.staffProfile) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const staffData = {
      staff_id: user.staffProfile.staff_id,
      user_id: user.id,
      designation: user.staffProfile.designation,
      is_active: user.isActive,
      is_on_duty: user.staffProfile.is_on_duty,
      created_at: user.staffProfile.created_at,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
        permissions: user.permissions,
      },
      department: user.staffProfile.department,
      shift: user.staffProfile.shift,
    };

    return NextResponse.json({ staff: staffData });
  } catch (error) {
    console.error("[GET /api/kitchen/staff-by-user/[userId]]", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}