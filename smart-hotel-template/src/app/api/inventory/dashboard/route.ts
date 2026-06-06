// src/app/api/inventory/dashboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { getDashboardStats } from "@/services/inventoryService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stats = await getDashboardStats();
    return NextResponse.json({ stats });
  } catch (err) {
    console.error("[GET /api/inventory/dashboard]", err);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
