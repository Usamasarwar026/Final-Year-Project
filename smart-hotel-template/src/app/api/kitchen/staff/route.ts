// src/app/api/kitchen/staff/route.ts (NEW - Kitchen specific staff endpoint)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const active = searchParams.get("active");

    const whereClause: any = {
      role: "STAFF",
    };

    if (active === "true") {
      whereClause.isActive = true;
    } else if (active === "false") {
      whereClause.isActive = false;
    }

    // Get all staff users
    const staffUsers = await prisma.user.findMany({
      where: whereClause,
      include: {
        staffProfile: {
          include: {
            department: true,
            shift: true,
            kitchenTasks: {
              take: 20,
              orderBy: { created_at: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by role (kitchen/delivery) based on permissions or designation
    let filteredStaff = staffUsers;
    if (role === "kitchen") {
      filteredStaff = staffUsers.filter(user => 
        user.staffProfile?.designation?.toLowerCase().includes("kitchen") ||
        user.permissions?.includes("KITCHEN_ACCESS")
      );
    } else if (role === "delivery") {
      filteredStaff = staffUsers.filter(user => 
        user.staffProfile?.designation?.toLowerCase().includes("delivery") ||
        user.permissions?.includes("DELIVERY_ACCESS")
      );
    }

    // Transform to match KitchenStaff interface
    const transformedStaff = filteredStaff.map(user => ({
      staff_id: user.staffProfile?.staff_id,
      user_id: user.id,
      designation: user.staffProfile?.designation || "Staff",
      is_active: user.isActive,
      is_on_duty: user.staffProfile?.is_on_duty || false,
      created_at: user.staffProfile?.created_at,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
        permissions: user.permissions,
      },
      department: user.staffProfile?.department,
      shift: user.staffProfile?.shift,
      kitchenTasks: user.staffProfile?.kitchenTasks,
    }));

    return NextResponse.json({ staff: transformedStaff });
  } catch (error) {
    console.error("[GET /api/kitchen/staff]", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}