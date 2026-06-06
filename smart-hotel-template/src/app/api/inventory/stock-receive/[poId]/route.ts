// src/app/api/inventory/stock-receive/[poId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { receiveStock } from "@/services/inventoryService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ poId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Allow ADMIN and staff with INVENTORY_RECEIVE permission
    const hasAccess =
      session.user.role === "ADMIN" ||
      (session.user.permissions ?? []).includes("INVENTORY_RECEIVE");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { poId } = await params;
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 422 });
    }

    const order = await receiveStock(parseInt(poId), items);
    return NextResponse.json({ order });
  } catch (err: any) {
    console.error("[POST /api/inventory/stock-receive/[poId]]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to receive stock" },
      { status: 500 }
    );
  }
}
