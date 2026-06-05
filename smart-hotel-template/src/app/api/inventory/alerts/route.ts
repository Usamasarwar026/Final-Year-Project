// src/app/api/inventory/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getAlerts } from "@/services/inventoryService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "Active";
    const alerts = await getAlerts(status);
    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("[GET /api/inventory/alerts]", err);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
