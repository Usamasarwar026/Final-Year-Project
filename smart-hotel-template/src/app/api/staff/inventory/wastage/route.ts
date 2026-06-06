import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { createWastage, getWastageRecords } from "@/services/inventoryService";

function hasInventoryAccess(session: any) {
  const role = session?.user?.role;
  const permissions: string[] = session?.user?.permissions ?? [];

  return (
    role === "ADMIN" ||
    (role === "STAFF" &&
      (permissions.includes("inventory") ||
        permissions.includes("INVENTORY_MANAGE")))
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasInventoryAccess(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const records = await getWastageRecords({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    return NextResponse.json({ records });
  } catch (err) {
    console.error("[GET /api/staff/inventory/wastage]", err);
    return NextResponse.json(
      { error: "Failed to load wastage records" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasInventoryAccess(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const itemId = Number(body.item_id);
    const quantity = Number(body.quantity);

    if (!itemId || !quantity || quantity <= 0 || !body.reason) {
      return NextResponse.json(
        { error: "item_id, quantity, and reason are required" },
        { status: 422 },
      );
    }

    const record = await createWastage({
      item_id: itemId,
      quantity,
      reason: body.reason,
      reported_by: session.user.id,
      notes: body.notes || undefined,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/staff/inventory/wastage]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to record wastage" },
      { status: 500 },
    );
  }
}
