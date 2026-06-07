// src/app/api/kitchen/delivery-staff/route.ts (NEW)
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

    // Get delivery staff users
    const staffUsers = await prisma.user.findMany({
      where: {
        role: "STAFF",
        isActive: true,
        OR: [
          { staffProfile: { designation: { contains: "delivery", mode: "insensitive" } } },
          { permissions: { has: "DELIVERY_ACCESS" } },
        ],
      },
      include: {
        staffProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    // Get completed deliveries count for each staff
    const staffWithStats = await Promise.all(
      staffUsers.map(async (user) => {
        const completedDeliveries = await prisma.kitchenTask.count({
          where: {
            assigned_to: user.staffProfile?.staff_id,
            status: "Completed",
          },
        });

        // Check if staff has current active delivery
        const currentTask = await prisma.kitchenTask.findFirst({
          where: {
            assigned_to: user.staffProfile?.staff_id,
            status: { in: ["Assigned", "InProgress"] },
          },
          include: {
            order: {
              include: {
                items: {
                  include: {
                    foodItem: true,
                  },
                },
              },
            },
          },
        });

        return {
          staff_id: user.staffProfile?.staff_id,
          user_id: user.id,
          designation: user.staffProfile?.designation || "Delivery Staff",
          is_on_duty: user.staffProfile?.is_on_duty || false,
          is_active: user.isActive,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            profileImage: user.profileImage,
          },
          completedDeliveries,
          currentDelivery: currentTask?.order || null,
        };
      })
    );

    return NextResponse.json({ staff: staffWithStats });
  } catch (error) {
    console.error("[GET /api/kitchen/delivery-staff]", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery staff" },
      { status: 500 }
    );
  }
}