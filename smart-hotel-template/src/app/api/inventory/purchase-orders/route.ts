// src/app/api/inventory/purchase-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getAllPurchaseOrders, createPurchaseOrder } from "@/services/inventoryService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");

    const orders = await getAllPurchaseOrders({
      status: status ?? undefined,
      vendorId: vendorId ? parseInt(vendorId) : undefined,
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/inventory/purchase-orders]", err);
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { vendor_id, items } = body;

    if (!vendor_id) return NextResponse.json({ error: "vendor_id is required" }, { status: 422 });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 422 });
    }

    const order = await createPurchaseOrder(session.user.id, body);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/inventory/purchase-orders]", err);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}
