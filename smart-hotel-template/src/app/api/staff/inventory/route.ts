import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";
import { getAlerts, getAllItems, getUsageLogs, logUsage } from "@/services/inventoryService";
import { INVENTORY_DEPARTMENTS, type InventoryDepartment } from "@/types/inventory";

function hasInventoryAccess(session: any) {
  const role = session?.user?.role;
  const permissions: string[] = session?.user?.permissions ?? [];

  return (
    role === "ADMIN" ||
    (role === "STAFF" &&
      (permissions.includes("inventory") ||
        permissions.includes("INVENTORY_VIEW") ||
        permissions.includes("INVENTORY_LOG_USE")))
  );
}

function normalizeDepartment(value?: string | null): InventoryDepartment {
  const match = INVENTORY_DEPARTMENTS.find(
    (department) => department.toLowerCase() === (value ?? "").toLowerCase(),
  );

  return match ?? "General";
}

async function getStaffDepartment(userId: string) {
  const staff = await prisma.staff.findUnique({
    where: { user_id: userId },
    include: { department: true },
  });

  return normalizeDepartment(staff?.department?.name);
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
    const search = searchParams.get("search") ?? undefined;
    const department =
      searchParams.get("department") ??
      (await getStaffDepartment(session.user.id));

    const [items, usageLogs, alerts] = await Promise.all([
      getAllItems({ isActive: true, search }),
      getUsageLogs({ department: normalizeDepartment(department) }),
      getAlerts("Active"),
    ]);

    const lowStockItems = items.filter(
      (item) => item.quantity <= item.low_stock_threshold,
    );
    const expiringItems = items.filter((item: any) => item.is_expiring_soon);
    const totalStockValue = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_cost,
      0,
    );

    return NextResponse.json({
      department: normalizeDepartment(department),
      items,
      usageLogs: usageLogs.slice(0, 50),
      alerts,
      stats: {
        totalItems: items.length,
        lowStockCount: lowStockItems.length,
        expiringCount: expiringItems.length,
        totalStockValue,
      },
    });
  } catch (err) {
    console.error("[GET /api/staff/inventory]", err);
    return NextResponse.json(
      { error: "Failed to load staff inventory" },
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
    const quantityUsed = Number(body.quantity_used);

    if (!itemId || !quantityUsed || quantityUsed <= 0) {
      return NextResponse.json(
        { error: "item_id and quantity_used are required" },
        { status: 422 },
      );
    }

    const department = normalizeDepartment(
      body.department ?? (await getStaffDepartment(session.user.id)),
    );

    const log = await logUsage({
      item_id: itemId,
      quantity_used: quantityUsed,
      department,
      used_by: session.user.id,
      reference_id: body.reference_id || undefined,
      notes: body.notes || undefined,
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/staff/inventory]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to log usage" },
      { status: 500 },
    );
  }
}
