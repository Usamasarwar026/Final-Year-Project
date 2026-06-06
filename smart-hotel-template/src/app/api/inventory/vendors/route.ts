// src/app/api/inventory/vendors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getAllVendors, createVendor } from "@/services/inventoryService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vendors = await getAllVendors();
    return NextResponse.json({ vendors });
  } catch (err) {
    console.error("[GET /api/inventory/vendors]", err);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 422 });

    const vendor = await createVendor(body);
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/inventory/vendors]", err);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}
