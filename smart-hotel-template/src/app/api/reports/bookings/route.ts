// src/app/api/reports/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getBookingReport } from "@/services/reportService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
     const isAdmin = session?.user?.role === "ADMIN";
    const isStaffWithBillingPermission = 
      session?.user?.role === "STAFF" && 
      (session?.user as any)?.permissions?.includes("billing");
    
    if (!session || (!isAdmin && !isStaffWithBillingPermission)) {
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

    const report = await getBookingReport(from, to);
    return NextResponse.json({ report });
  } catch (err: any) {
    console.error("[GET /api/reports/bookings]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load booking report" },
      { status: 500 }
    );
  }
}
