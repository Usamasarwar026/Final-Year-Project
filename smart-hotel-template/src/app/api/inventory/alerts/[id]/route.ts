// src/app/api/inventory/alerts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { resolveAlert } from "@/services/inventoryService";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess =
      session.user.role === "ADMIN" ||
      (session.user.permissions ?? []).includes("INVENTORY_MANAGE");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const dismiss = body.action === "dismiss";

    const alert = await resolveAlert(parseInt(id), session.user.id, dismiss);
    return NextResponse.json({ alert });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    console.error("[PATCH /api/inventory/alerts/[id]]", err);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
