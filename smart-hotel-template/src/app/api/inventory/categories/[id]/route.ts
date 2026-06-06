import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { updateCategory } from "@/services/inventoryService";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 422 });

    const body = await req.json();
    const category = await updateCategory(id, body);
    return NextResponse.json({ category });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }
    console.error("[PATCH /api/inventory/categories/[id]]", err);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}