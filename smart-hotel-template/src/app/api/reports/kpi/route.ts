// src/app/api/reports/kpi/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getKpiData } from "@/services/reportService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
     const isAdmin = session?.user?.role === "ADMIN";
    const isStaffWithBillingPermission = 
      session?.user?.role === "STAFF" && 
      (session?.user as any)?.permissions?.includes("billing");
    
    if (!session || (!isAdmin && !isStaffWithBillingPermission)) {
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
