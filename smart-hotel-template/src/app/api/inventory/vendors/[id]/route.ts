// src/app/api/inventory/vendors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { updateVendor } from "@/services/inventoryService";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const vendor = await updateVendor(parseInt(id), body);
    return NextResponse.json({ vendor });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    console.error("[PATCH /api/inventory/vendors/[id]]", err);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}
