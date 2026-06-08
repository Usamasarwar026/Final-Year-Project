// app/api/rooms/public/route.ts
import { NextResponse } from "next/server";
import { getAllRooms } from "@/services/roomService";

export async function GET() {
  try {
    const rooms = await getAllRooms();
    return NextResponse.json({ rooms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
