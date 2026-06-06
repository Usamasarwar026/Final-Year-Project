// src/services/inventoryService.ts
import { prisma } from "@/database/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generatePONumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${ts}-${rand}`;
}

async function checkAndCreateLowStockAlert(itemId: number) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  if (item.quantity <= item.low_stock_threshold) {
    const existing = await prisma.lowStockAlert.findFirst({
      where: { item_id: itemId, status: "Active" },
    });
    if (!existing) {
      await prisma.lowStockAlert.create({
        data: {
          item_id: itemId,
          current_quantity: item.quantity,
          threshold: item.low_stock_threshold,
          status: "Active",
        },
      });
    } else {
      await prisma.lowStockAlert.update({
        where: { id: existing.id },
        data: { current_quantity: item.quantity },
      });
    }
  } else {
    await prisma.lowStockAlert.updateMany({
      where: { item_id: itemId, status: "Active" },
      data: { status: "Resolved", resolved_at: new Date() },
    });
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getAllCategories() {
  return prisma.inventoryCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function createCategory(data: {
  name: string;
  description?: string;
  icon?: string;
}) {
  return prisma.inventoryCategory.create({ data });
}

export async function updateCategory(
  id: number,
  data: { name?: string; description?: string; icon?: string; is_active?: boolean }
) {
  return prisma.inventoryCategory.update({ where: { id }, data });
}

// ─── Vendors ──────────────────────────────────────────────────────────────────
export async function getAllVendors() {
  return prisma.inventoryVendor.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { purchaseOrders: true, itemVendors: true } } },
  });
}

export async function createVendor(data: {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  return prisma.inventoryVendor.create({ data });
}

export async function updateVendor(
  id: number,
  data: {
    name?: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    is_active?: boolean;
  }
) {
  return prisma.inventoryVendor.update({ where: { id }, data });
}

// ─── Items ────────────────────────────────────────────────────────────────────
export async function getAllItems(filters?: {
  categoryId?: number;
  isActive?: boolean;
  search?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.isActive !== undefined) where.is_active = filters.isActive;
  if (filters?.categoryId) where.category_id = filters.categoryId;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      category: true,
      itemVendors: { include: { vendor: true } },
    },
    orderBy: { name: "asc" },
  });

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  return items.map((item) => ({
    ...item,
    is_low_stock: item.quantity <= item.low_stock_threshold,
    is_expiring_soon: item.expiry_date
      ? item.expiry_date <= sevenDaysFromNow && item.expiry_date >= new Date()
      : false,
    is_expired: item.expiry_date ? item.expiry_date < new Date() : false,
    total_value: item.quantity * item.unit_cost,
  }));
}

export async function getItemById(id: number) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      category: true,
      itemVendors: { include: { vendor: true } },
    },
  });
}

export async function createItem(data: {
  name: string;
  sku?: string;
  category_id: number;
  unit: string;
  quantity?: number;
  low_stock_threshold?: number;
  unit_cost?: number;
  expiry_date?: string;
  location?: string;
  notes?: string;
}) {
  const item = await prisma.inventoryItem.create({
    data: {
      name: data.name,
      sku: data.sku ?? null,
      category_id: data.category_id,
      unit: data.unit,
      quantity: data.quantity ?? 0,
      low_stock_threshold: data.low_stock_threshold ?? 10,
      unit_cost: data.unit_cost ?? 0,
      expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
      location: data.location ?? null,
      notes: data.notes ?? null,
    },
    include: { category: true },
  });
  await checkAndCreateLowStockAlert(item.id);
  return item;
}

export async function updateItem(
  id: number,
  data: {
    name?: string;
    sku?: string;
    category_id?: number;
    unit?: string;
    quantity?: number;
    low_stock_threshold?: number;
    unit_cost?: number;
    expiry_date?: string | null;
    location?: string;
    notes?: string;
    is_active?: boolean;
  }
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.expiry_date !== undefined) {
    updateData.expiry_date = data.expiry_date ? new Date(data.expiry_date) : null;
  }
  const item = await prisma.inventoryItem.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });
  await checkAndCreateLowStockAlert(id);
  return item;
}

export async function deactivateItem(id: number) {
  return prisma.inventoryItem.update({
    where: { id },
    data: { is_active: false },
  });
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export async function getAllPurchaseOrders(filters?: { status?: string; vendorId?: number }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.vendorId) where.vendor_id = filters.vendorId;

  return prisma.purchaseOrder.findMany({
    where,
    include: {
      vendor: true,
      items: { include: { item: { select: { id: true, name: true, unit: true, sku: true } } } },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function getPurchaseOrderById(id: number) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      items: { include: { item: { select: { id: true, name: true, unit: true, sku: true } } } },
    },
  });
}

export async function createPurchaseOrder(
  userId: string,
  data: {
    vendor_id: number;
    notes?: string;
    items: { item_id: number; ordered_quantity: number; unit_price: number }[];
  }
) {
  const poNumber = generatePONumber();
  const totalCost = data.items.reduce(
    (sum, i) => sum + i.ordered_quantity * i.unit_price,
    0
  );

  const po = await prisma.purchaseOrder.create({
    data: {
      po_number: poNumber,
      vendor_id: data.vendor_id,
      ordered_by: userId,
      notes: data.notes ?? null,
      total_cost: totalCost,
      items: {
        create: data.items.map((i) => ({
          item_id: i.item_id,
          ordered_quantity: i.ordered_quantity,
          unit_price: i.unit_price,
          subtotal: i.ordered_quantity * i.unit_price,
        })),
      },
    },
    include: {
      vendor: true,
      items: { include: { item: { select: { id: true, name: true, unit: true, sku: true } } } },
    },
  });

  return po;
}

export async function updatePurchaseOrderStatus(
  id: number,
  status: string,
  userId?: string
) {
  const updateData: Record<string, unknown> = { status };
  if (status === "Sent") updateData.sent_at = new Date();
  if (status === "Received") updateData.received_at = new Date();

  return prisma.purchaseOrder.update({
    where: { id },
    data: updateData,
    include: {
      vendor: true,
      items: { include: { item: { select: { id: true, name: true, unit: true, sku: true } } } },
    },
  });
}

// ─── Stock Receiving ──────────────────────────────────────────────────────────
export async function receiveStock(
  poId: number,
  receivedItems: { po_item_id: number; received_quantity: number }[]
) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: { include: { item: true } } },
  });
  if (!po) throw new Error("Purchase order not found");
  if (po.status === "Cancelled") throw new Error("Cannot receive cancelled PO");
  if (po.status === "Received") throw new Error("PO already fully received");

  for (const received of receivedItems) {
    const poItem = po.items.find((i) => i.id === received.po_item_id);
    if (!poItem) continue;

    const newReceivedQty = poItem.received_quantity + received.received_quantity;

    await prisma.purchaseOrderItem.update({
      where: { id: received.po_item_id },
      data: { received_quantity: newReceivedQty },
    });

    await prisma.inventoryItem.update({
      where: { id: poItem.item_id },
      data: { quantity: { increment: received.received_quantity } },
    });

    await checkAndCreateLowStockAlert(poItem.item_id);
  }

  const updatedPO = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true },
  });

  if (updatedPO) {
    const allReceived = updatedPO.items.every(
      (i) => i.received_quantity >= i.ordered_quantity
    );
    const anyReceived = updatedPO.items.some((i) => i.received_quantity > 0);

    const newStatus = allReceived
      ? "Received"
      : anyReceived
      ? "PartiallyReceived"
      : po.status;

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: newStatus as any,
        received_at: allReceived ? new Date() : po.received_at,
      },
    });
  }

  return prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      vendor: true,
      items: { include: { item: { select: { id: true, name: true, unit: true, sku: true } } } },
    },
  });
}

// ─── Usage Logs ───────────────────────────────────────────────────────────────
export async function getUsageLogs(filters?: {
  department?: string;
  itemId?: number;
  from?: string;
  to?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.department) where.department = filters.department;
  if (filters?.itemId) where.item_id = filters.itemId;
  if (filters?.from || filters?.to) {
    where.used_at = {};
    if (filters.from) (where.used_at as any).gte = new Date(filters.from);
    if (filters.to) (where.used_at as any).lte = new Date(filters.to);
  }

  return prisma.inventoryUsageLog.findMany({
    where,
    include: { item: { select: { id: true, name: true, unit: true } } },
    orderBy: { used_at: "desc" },
    take: 500,
  });
}

export async function logUsage(data: {
  item_id: number;
  quantity_used: number;
  department: string;
  used_by: string;
  reference_id?: string;
  notes?: string;
}) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: data.item_id } });
  if (!item) throw new Error("Item not found");
  if (!item.is_active) throw new Error("Item is inactive");

  const log = await prisma.inventoryUsageLog.create({
    data: {
      item_id: data.item_id,
      quantity_used: data.quantity_used,
      department: data.department as any,
      used_by: data.used_by,
      reference_id: data.reference_id ?? null,
      notes: data.notes ?? null,
    },
    include: { item: { select: { id: true, name: true, unit: true } } },
  });

  await prisma.inventoryItem.update({
    where: { id: data.item_id },
    data: { quantity: { decrement: data.quantity_used } },
  });

  await checkAndCreateLowStockAlert(data.item_id);

  return log;
}

// ─── Wastage ──────────────────────────────────────────────────────────────────
export async function getWastageRecords(filters?: { from?: string; to?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.from || filters?.to) {
    where.wasted_at = {};
    if (filters.from) (where.wasted_at as any).gte = new Date(filters.from);
    if (filters.to) (where.wasted_at as any).lte = new Date(filters.to);
  }

  return prisma.wastageRecord.findMany({
    where,
    include: { item: { select: { id: true, name: true, unit: true } } },
    orderBy: { wasted_at: "desc" },
  });
}

export async function createWastage(data: {
  item_id: number;
  quantity: number;
  reason: string;
  reported_by: string;
  notes?: string;
}) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: data.item_id } });
  if (!item) throw new Error("Item not found");

  const totalCost = data.quantity * item.unit_cost;

  const wastage = await prisma.wastageRecord.create({
    data: {
      item_id: data.item_id,
      quantity: data.quantity,
      reason: data.reason as any,
      unit_cost: item.unit_cost,
      total_cost: totalCost,
      reported_by: data.reported_by,
      notes: data.notes ?? null,
    },
    include: { item: { select: { id: true, name: true, unit: true } } },
  });

  const newQty = Math.max(0, item.quantity - data.quantity);
  await prisma.inventoryItem.update({
    where: { id: data.item_id },
    data: { quantity: newQty },
  });

  await checkAndCreateLowStockAlert(data.item_id);

  return wastage;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export async function getAlerts(status?: string) {
  return prisma.lowStockAlert.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      item: {
        select: {
          id: true,
          name: true,
          unit: true,
          category_id: true,
          category: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function resolveAlert(id: number, userId: string, dismiss = false) {
  return prisma.lowStockAlert.update({
    where: { id },
    data: {
      status: dismiss ? "Dismissed" : "Resolved",
      resolved_by: userId,
      resolved_at: new Date(),
    },
  });
}

// ─── Expiry Check (cron / on-demand) ─────────────────────────────────────────
export async function getExpiringSoon(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  return prisma.inventoryItem.findMany({
    where: {
      is_active: true,
      expiry_date: { lte: cutoff, gte: new Date() },
    },
    include: { category: true },
    orderBy: { expiry_date: "asc" },
  });
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function getConsumptionReport(from: string, to: string) {
  const logs = await prisma.inventoryUsageLog.groupBy({
    by: ["department", "item_id"],
    where: {
      used_at: { gte: new Date(from), lte: new Date(to) },
    },
    _sum: { quantity_used: true },
    orderBy: { _sum: { quantity_used: "desc" } },
  });

  const itemIds = [...new Set(logs.map((l) => l.item_id))];
  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, unit: true },
  });
  const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));

  return logs.map((l) => ({
    department: l.department,
    item_id: l.item_id,
    item_name: itemMap[l.item_id]?.name ?? "Unknown",
    unit: itemMap[l.item_id]?.unit ?? "",
    total_used: l._sum.quantity_used ?? 0,
  }));
}

export async function getCOGSReport(from: string, to: string) {
  const logs = await prisma.inventoryUsageLog.findMany({
    where: { used_at: { gte: new Date(from), lte: new Date(to) } },
    include: { item: { select: { unit_cost: true } } },
  });

  const byDept: Record<string, number> = {};
  for (const log of logs) {
    const cost = log.quantity_used * log.item.unit_cost;
    byDept[log.department] = (byDept[log.department] ?? 0) + cost;
  }

  return Object.entries(byDept).map(([department, total_cost]) => ({
    department,
    total_cost,
  }));
}

export async function getWastageReport(from: string, to: string) {
  const records = await prisma.wastageRecord.groupBy({
    by: ["reason", "item_id"],
    where: { wasted_at: { gte: new Date(from), lte: new Date(to) } },
    _sum: { quantity: true, total_cost: true },
  });

  const itemIds = [...new Set(records.map((r) => r.item_id))];
  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, unit: true },
  });
  const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));

  return records.map((r) => ({
    reason: r.reason,
    item_id: r.item_id,
    item_name: itemMap[r.item_id]?.name ?? "Unknown",
    quantity: r._sum.quantity ?? 0,
    total_cost: r._sum.total_cost ?? 0,
  }));
}

export async function getDashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);

  const [
    totalItems,
    lowStockCount,
    expiringItems,
    pendingPOs,
    monthWastage,
    monthUsage,
    consumptionByDept,
  ] = await Promise.all([
    prisma.inventoryItem.count({ where: { is_active: true } }),
    prisma.inventoryItem.count({
      where: {
        is_active: true,
        quantity: { lte: prisma.inventoryItem.fields.low_stock_threshold as any },
      },
    }),
    prisma.inventoryItem.count({
      where: { is_active: true, expiry_date: { lte: sevenDays, gte: now } },
    }),
    prisma.purchaseOrder.count({ where: { status: { in: ["Pending", "Sent"] as any } } }),
    prisma.wastageRecord.aggregate({
      where: { wasted_at: { gte: monthStart } },
      _sum: { total_cost: true },
    }),
    prisma.inventoryUsageLog.findMany({
      where: { used_at: { gte: monthStart } },
      include: { item: { select: { unit_cost: true } } },
    }),
    prisma.inventoryUsageLog.groupBy({
      by: ["department"],
      where: { used_at: { gte: monthStart } },
      _sum: { quantity_used: true },
    }),
  ]);

  const monthlyCOGS = monthUsage.reduce(
    (sum, l) => sum + l.quantity_used * l.item.unit_cost,
    0
  );

  const allItems = await prisma.inventoryItem.findMany({
    where: { is_active: true },
    select: { quantity: true, low_stock_threshold: true },
  });
  const actualLowStock = allItems.filter((i) => i.quantity <= i.low_stock_threshold).length;

  const top10Raw = await prisma.inventoryUsageLog.groupBy({
    by: ["item_id"],
    where: { used_at: { gte: monthStart } },
    _sum: { quantity_used: true },
    orderBy: { _sum: { quantity_used: "desc" } },
    take: 10,
  });
  const top10ItemIds = top10Raw.map((r) => r.item_id);
  const top10Items = await prisma.inventoryItem.findMany({
    where: { id: { in: top10ItemIds } },
    select: { id: true, name: true },
  });
  const top10ItemMap = Object.fromEntries(top10Items.map((i) => [i.id, i.name]));
  const top10 = top10Raw.map((r) => ({
    name: top10ItemMap[r.item_id] ?? "Unknown",
    total_used: r._sum.quantity_used ?? 0,
  }));

  const catItems = await prisma.inventoryItem.findMany({
    where: { is_active: true },
    select: { quantity: true, unit_cost: true, category: { select: { name: true } } },
  });
  const catMap: Record<string, { count: number; value: number }> = {};
  for (const item of catItems) {
    const cat = item.category?.name ?? "Other";
    if (!catMap[cat]) catMap[cat] = { count: 0, value: 0 };
    catMap[cat].count++;
    catMap[cat].value += item.quantity * item.unit_cost;
  }
  const categoryDistribution = Object.entries(catMap).map(([category, v]) => ({
    category,
    ...v,
  }));

  return {
    totalItems,
    lowStockCount: actualLowStock,
    expiringCount: expiringItems,
    pendingPOs,
    monthlyWastageCost: monthWastage._sum.total_cost ?? 0,
    monthlyCOGS,
    consumptionByDepartment: consumptionByDept.map((d) => ({
      department: d.department,
      total: d._sum.quantity_used ?? 0,
    })),
    top10Items: top10,
    categoryDistribution,
  };
}

// ─── Integration Stubs ────────────────────────────────────────────────────────

export async function deductKitchenIngredients(
  orderId: number,
  items: { inventoryItemId: number; quantity: number }[]
): Promise<void> {
  console.log(`[KITCHEN HOOK STUB] Order ${orderId}`, items);
}

export async function deductHousekeepingSupplies(
  taskId: number,
  items: { inventoryItemId: number; quantity: number }[]
): Promise<void> {
  console.log(`[HOUSEKEEPING HOOK STUB] Task ${taskId}`, items);
}

export async function forwardMinibarCharges(
  roomId: number,
  checkoutId: string,
  items: { inventoryItemId: number; quantity: number; price: number }[]
): Promise<void> {
  console.log(`[BILLING HOOK STUB] Room ${roomId} Checkout ${checkoutId}`, items);
}