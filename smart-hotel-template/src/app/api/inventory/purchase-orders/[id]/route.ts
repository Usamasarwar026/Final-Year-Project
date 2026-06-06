// src/app/api/inventory/purchase-orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { updatePurchaseOrderStatus } from "@/services/inventoryService";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) return NextResponse.json({ error: "status is required" }, { status: 422 });

    const validStatuses = ["Pending", "Sent", "PartiallyReceived", "Received", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 422 });
    }

    const order = await updatePurchaseOrderStatus(parseInt(id), status, session.user.id);
    return NextResponse.json({ order });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }
    console.error("[PATCH /api/inventory/purchase-orders/[id]]", err);
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}
