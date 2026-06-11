// src/app/api/customer/active-booking/route.ts
// Returns the customer's currently checked-in booking
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.group("[GET /api/customer/active-booking]");
    console.log("Session:=========>", session);
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findFirst({
      where: { user_id: session.user.id, status: "CheckedIn" },
      include: {
        room: {
          select: {
            room_id: true,
            room_number: true,
            floor: true,
            room_type: true,
            cleaning_status: true,
          },
        },
      },
      orderBy: { check_in_date: "desc" },
    });
    console.log("Active booking found:===>", booking);

    return NextResponse.json({ booking: booking ?? null });
  } catch (err) {
    console.error("[GET /api/customer/active-booking]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
