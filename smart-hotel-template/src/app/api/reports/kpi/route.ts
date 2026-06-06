// src/app/api/reports/kpi/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getKpiData } from "@/services/reportService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const kpi = await getKpiData();
    return NextResponse.json({ kpi });
  } catch (err: any) {
    console.error("[GET /api/reports/kpi]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load KPI data" },
      { status: 500 }
    );
  }
}
