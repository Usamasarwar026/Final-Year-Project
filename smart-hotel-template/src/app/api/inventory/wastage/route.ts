// src/app/api/inventory/wastage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getWastageRecords, createWastage } from "@/services/inventoryService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const records = await getWastageRecords({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    return NextResponse.json({ records });
  } catch (err) {
    console.error("[GET /api/inventory/wastage]", err);
    return NextResponse.json({ error: "Failed to fetch wastage records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess =
      session.user.role === "ADMIN" ||
      (session.user.permissions ?? []).includes("INVENTORY_MANAGE");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { item_id, quantity, reason } = body;
    if (!item_id || !quantity || !reason) {
      return NextResponse.json(
        { error: "item_id, quantity, reason are required" },
        { status: 422 }
      );
    }

    const record = await createWastage({ ...body, reported_by: session.user.id });
    return NextResponse.json({ record }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/inventory/wastage]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to record wastage" },
      { status: 500 }
    );
  }
}
