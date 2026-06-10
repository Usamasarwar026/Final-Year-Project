// src/app/api/kitchen/staff-stats/route.ts (NEW)
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

    // Get all staff users
    const staffUsers = await prisma.user.findMany({
      where: { role: "STAFF" },
      include: {
        staffProfile: true,
      },
    });

    const total = staffUsers.length;
    const active = staffUsers.filter(u => u.isActive).length;
    const onDuty = staffUsers.filter(u => u.staffProfile?.is_on_duty && u.isActive).length;
    
    // Kitchen staff (by designation or permission)
    const kitchenStaff = staffUsers.filter(u => 
      u.staffProfile?.designation?.toLowerCase().includes("kitchen") ||
      u.permissions?.includes("KITCHEN_ACCESS")
    ).length;
    
    // Delivery staff
    const deliveryStaff = staffUsers.filter(u => 
      u.staffProfile?.designation?.toLowerCase().includes("delivery") ||
      u.permissions?.includes("DELIVERY_ACCESS")
    ).length;

    return NextResponse.json({
      stats: {
        total,
        active,
        onDuty,
        kitchenStaff,
        deliveryStaff,
      },
    });
  } catch (error) {
    console.error("[GET /api/kitchen/staff-stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch staff stats" },
      { status: 500 }
    );
  }
}