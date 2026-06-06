// src/app/api/staff/delivery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all staff with delivery designation or delivery permissions
    const staff = await prisma.staff.findMany({
      where: {
        is_active: true,
        OR: [
          { designation: { contains: "delivery", mode: "insensitive" } },
          { designation: { contains: "rider", mode: "insensitive" } },
          { user: { permissions: { has: "DELIVERY_ACCESS" } } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
            permissions: true,
          },
        },
        department: true,
        shift: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Get completed deliveries count for each staff
    const staffWithStats = await Promise.all(
      staff.map(async (staffMember) => {
        const completedDeliveries = await prisma.kitchenTask.count({
          where: {
            assigned_to: staffMember.staff_id,
            status: "Completed",
          },
        });

        // Check if staff has current active delivery
        const currentTask = await prisma.kitchenTask.findFirst({
          where: {
            assigned_to: staffMember.staff_id,
            status: { in: ["Assigned", "InProgress"] },
          },
          include: {
            order: true,
          },
        });

        return {
          ...staffMember,
          completedDeliveries,
          currentDelivery: currentTask?.order || null,
        };
      })
    );

    return NextResponse.json({ staff: staffWithStats });
  } catch (error) {
    console.error("[GET /api/staff/delivery]", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery staff" },
      { status: 500 }
    );
  }
}