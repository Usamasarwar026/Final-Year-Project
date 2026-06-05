// src/app/api/customer/service-requests/route.ts
// Customer apni active booking ke liye service request submit karta hai
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";

// ─── GET /api/customer/service-requests ───────────────────────────────────────
// Customer apni saari requests dekhe
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.serviceRequest.findMany({
      where: {
        booking: { user_id: session.user.id },
      },
      include: {
        room:    { select: { room_number: true, floor: true } },
        booking: { select: { booking_id: true, check_in_date: true, check_out_date: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("[GET /api/customer/service-requests]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ─── POST /api/customer/service-requests ──────────────────────────────────────
// Customer new request submit karta hai
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { booking_id, request_type, description } = await req.json();

    if (!booking_id)   return NextResponse.json({ error: "booking_id required" },   { status: 422 });
    if (!request_type) return NextResponse.json({ error: "request_type required" }, { status: 422 });

    // Verify booking belongs to this customer and is active
    const booking = await prisma.booking.findFirst({
      where: {
        booking_id: parseInt(booking_id),
        user_id:    session.user.id,
        status:     "CheckedIn",
      },
      include: { room: { select: { room_id: true, room_number: true } } },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "No active booking found. You must be checked in to make requests." },
        { status: 403 }
      );
    }

    // Create service request
    const sr = await prisma.serviceRequest.create({
      data: {
        booking_id:   parseInt(booking_id),
        room_id:      booking.room_id,
        request_type,
        description:  description?.trim() || null,
        status:       "Pending",
      },
      include: {
        room:    { select: { room_number: true, floor: true } },
        booking: { select: { booking_id: true } },
      },
    });

    // Auto-create housekeeping task
    await prisma.housekeepingTask.create({
      data: {
        room_id:             booking.room_id,
        booking_id:          parseInt(booking_id),
        task_type:           "ServiceRequest",
        priority:            "Normal",
        status:              "Pending",
        request_description: `${request_type}${description ? `: ${description}` : ""} — Room ${booking.room.room_number}`,
        is_billable:         false,
      },
    });

    return NextResponse.json({ request: sr }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/customer/service-requests]", err);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}