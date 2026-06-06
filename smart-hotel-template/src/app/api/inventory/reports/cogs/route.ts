// src/app/api/inventory/reports/cogs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getCOGSReport } from "@/services/inventoryService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess =
      session.user.role === "ADMIN" ||
      (session.user.permissions ?? []).includes("INVENTORY_REPORTS");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ?? new Date(Date.now() - 30 * 86400000).toISOString();
    const to = searchParams.get("to") ?? new Date().toISOString();

    const report = await getCOGSReport(from, to);
    return NextResponse.json({ report });
  } catch (err) {
    console.error("[GET /api/inventory/reports/cogs]", err);
    return NextResponse.json({ error: "Failed to generate COGS report" }, { status: 500 });
  }
}
