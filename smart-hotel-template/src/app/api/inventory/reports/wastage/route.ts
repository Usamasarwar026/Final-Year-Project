// src/app/api/inventory/reports/wastage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getWastageReport } from "@/services/inventoryService";

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

    const report = await getWastageReport(from, to);
    return NextResponse.json({ report });
  } catch (err) {
    console.error("[GET /api/inventory/reports/wastage]", err);
    return NextResponse.json({ error: "Failed to generate wastage report" }, { status: 500 });
  }
}
