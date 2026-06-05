// src/app/api/housekeeping/service-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth";
import { authOptions }              from "@/lib/authOption";
import { prisma }                   from "@/database/db";

const SR_INCLUDE = {
  room:    { select: { room_number: true, floor: true } },
  booking: { include: { user: { select: { name: true, email: true } } } },
} as const;

// ─── GET /api/housekeeping/service-requests ───────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status      = searchParams.get("status");
    const requestType = searchParams.get("type");

    const requests = await prisma.serviceRequest.findMany({
      where: {
        ...(status      ? { status:       status      } : {}),
        ...(requestType ? { request_type: requestType } : {}),
      },
      include: SR_INCLUDE,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("[GET /api/housekeeping/service-requests]", err);
    return NextResponse.json({ error: "Failed to fetch service requests" }, { status: 500 });
  }
}

// ─── POST /api/housekeeping/service-requests ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { booking_id, room_id, request_type, description } = await req.json();

    if (!booking_id)    return NextResponse.json({ error: "booking_id required" },    { status: 422 });
    if (!room_id)       return NextResponse.json({ error: "room_id required" },       { status: 422 });
    if (!request_type)  return NextResponse.json({ error: "request_type required" },  { status: 422 });

    const sr = await prisma.serviceRequest.create({
      data: {
        booking_id:   parseInt(booking_id),
        room_id:      parseInt(room_id),
        request_type,
        description:  description || null,
        status:       "Pending",
      },
      include: SR_INCLUDE,
    });

    // Auto-create a housekeeping task for service request
    await prisma.housekeepingTask.create({
      data: {
        room_id:             parseInt(room_id),
        booking_id:          parseInt(booking_id),
        task_type:           "ServiceRequest",
        priority:            "Normal",
        status:              "Pending",
        request_description: `${request_type}: ${description || ""}`.trim(),
        is_billable:         false,
      },
    });

    return NextResponse.json({ request: sr }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/housekeeping/service-requests]", err);
    return NextResponse.json({ error: "Failed to create service request" }, { status: 500 });
  }
}