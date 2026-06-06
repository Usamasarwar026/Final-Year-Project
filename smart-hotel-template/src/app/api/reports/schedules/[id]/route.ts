// src/app/api/reports/schedules/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

// PATCH — update (toggle active / change frequency)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    const { frequency, is_active, parameters } = body;

    const existing = await prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (frequency !== undefined) updateData.frequency = frequency;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (parameters !== undefined) updateData.parameters = parameters;

    const schedule = await prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: updateData,
    });

    return NextResponse.json({ schedule });
  } catch (err: any) {
    console.error("[PATCH /api/reports/schedules/[id]]", err);
    return NextResponse.json(
      { error: err.message || "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// DELETE — remove a schedule
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await prisma.reportSchedule.delete({ where: { id: scheduleId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/reports/schedules/[id]]", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
