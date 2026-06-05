// src/app/api/inventory/usage-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getUsageLogs, logUsage } from "@/services/inventoryService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const logs = await getUsageLogs({
      department: searchParams.get("department") ?? undefined,
      itemId: searchParams.get("itemId") ? parseInt(searchParams.get("itemId")!) : undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    return NextResponse.json({ logs });
  } catch (err) {
    console.error("[GET /api/inventory/usage-logs]", err);
    return NextResponse.json({ error: "Failed to fetch usage logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess =
      session.user.role === "ADMIN" ||
      (session.user.permissions ?? []).includes("INVENTORY_LOG_USE");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { item_id, quantity_used, department } = body;
    if (!item_id || !quantity_used || !department) {
      return NextResponse.json(
        { error: "item_id, quantity_used, department are required" },
        { status: 422 }
      );
    }

    const log = await logUsage({ ...body, used_by: session.user.id });
    return NextResponse.json({ log }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/inventory/usage-logs]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to log usage" },
      { status: 500 }
    );
  }
}
