// src/app/api/reports/guests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getGuestReport } from "@/services/reportService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to query params are required" },
        { status: 400 }
      );
    }

    const report = await getGuestReport(from, to);
    return NextResponse.json({ report });
  } catch (err: any) {
    console.error("[GET /api/reports/guests]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load guest report" },
      { status: 500 }
    );
  }
}
