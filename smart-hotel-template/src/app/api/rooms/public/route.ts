import { NextResponse } from "next/server";
import { prisma } from "@/database/db";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        is_active: true,
        status: "Available",
      },
      orderBy: [
        { floor: "asc" },
        { room_number: "asc" },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        rooms,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PUBLIC_ROOMS]", error);

    return NextResponse.json(
      {
        success: false,
        rooms: [],
        message: "Failed to fetch rooms",
      },
      { status: 500 }
    );
  }
}