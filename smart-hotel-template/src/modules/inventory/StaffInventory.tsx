"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import {
  INVENTORY_DEPARTMENTS,
  type InventoryDepartment,
  type InventoryItem,
  type LogUsagePayload,
} from "@/types/inventory";
import { useStaffInventory } from "@/hooks/useStaffInventory";
import { ExpiryAlertBadge } from "./components/ExpiryAlertBadge";
import { WastageModal } from "./components/WastageModal";

function guessDepartment(name?: string | null): InventoryDepartment {
  const match = INVENTORY_DEPARTMENTS.find(
    (dept) => dept.toLowerCase() === (name ?? "").toLowerCase(),
  );
  return match ?? "General";
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function stockState(item: InventoryItem) {
  if (item.quantity <= 0) {
    return {
      label: "Out of stock",
      className: "bg-red-50 text-red-700 border-red-200",
    };
  }
  if (item.is_low_stock || item.quantity <= item.low_stock_threshold) {
    return {
      label: "Low stock",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }
  return {
    label: "In stock",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

export default function StaffInventory() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "low_stock" | "expiring">("all");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [department, setDepartment] = useState<InventoryDepartment>("General");
  const [showWastage, setShowWastage] = useState(false);
  const [savingUsage, setSavingUsage] = useState(false);

  const inventory = useStaffInventory({
    department,
    search: search.trim() || undefined,
  });
  const { items, alerts, loading, error, refresh } = inventory;

  const selectedItem = items.find((item) => item.id === selectedItemId);
  const lowStockItems = items.filter(
    (item) => item.quantity <= item.low_stock_threshold,
  );
  const expiringItems = items.filter((item) => item.is_expiring_soon);
  const totalStockValue = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0,
  );

  // Filtered items based on active status card
  const filteredItems = items.filter((item) => {
    if (activeFilter === "low_stock") return item.quantity <= item.low_stock_threshold;
    if (activeFilter === "expiring") return item.is_expiring_soon;
    return true;
  });

  const submitUsage = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(quantity);

    if (!selectedItemId || !selectedItem) {
      toast.error("Select an item first");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (amount > selectedItem.quantity) {
      toast.error(`Only ${selectedItem.quantity} ${selectedItem.unit} available`);
      return;
    }

    const payload: LogUsagePayload = {
      item_id: selectedItemId,
      quantity_used: amount,
      department,
      notes: notes.trim() || undefined,
    };

    setSavingUsage(true);
    const result = await inventory.logUsage(payload);
    setSavingUsage(false);

    if (result.ok) {
      toast.success("Usage logged");
      setQuantity("1");
      setNotes("");
      setSelectedItemId(null);
      await refresh();
    } else {
      toast.error(result.error ?? "Failed to log usage");
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Staff Inventory
          </p>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            Stock Usage & Wastage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View available stock, log consumed items, and report wastage for
            your department.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={department}
            onChange={(event) =>
              setDepartment(guessDepartment(event.target.value))
            }
            className="h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground"
          >
            {INVENTORY_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <button
            onClick={() => refresh()}
            className="h-10 inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Available Items"
          value={items.length}
          icon={Package}
          color="bg-blue-500"
          onClick={() => setActiveFilter("all")}
          active={activeFilter === "all"}
        />
        <StatCard
          label="Low Stock"
          value={Math.max(lowStockItems.length, alerts.length)}
          icon={AlertTriangle}
          color="bg-amber-500"
          onClick={() => setActiveFilter("low_stock")}
          active={activeFilter === "low_stock"}
        />
        <StatCard
          label="Expiring Soon"
          value={expiringItems.length}
          icon={ClipboardList}
          color="bg-violet-500"
          onClick={() => setActiveFilter("expiring")}
          active={activeFilter === "expiring"}
        />
        <StatCard
          label="Stock Value"
          value={`Rs. ${Math.round(totalStockValue).toLocaleString()}`}
          icon={Package}
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Stock Items</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select an item to log usage from the panel on the right.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stock..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              Loading stock...
            </div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center text-sm text-red-500">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              No stock items found for the selected view.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Item</th>
                    <th className="text-left font-semibold px-4 py-3">
                      Category
                    </th>
                    <th className="text-left font-semibold px-4 py-3">
                      Quantity
                    </th>
                    <th className="text-left font-semibold px-4 py-3">
                      Status
                    </th>
                    <th className="text-left font-semibold px-4 py-3">
                      Expiry
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.map((item) => {
                    const state = stockState(item);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={clsx(
                          "cursor-pointer hover:bg-muted/30 transition-colors",
                          selectedItemId === item.id && "bg-primary/5",
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.sku ?? "No SKU"}{" "}
                            {item.location ? `- ${item.location}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.category?.name ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              "inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold",
                              state.className,
                            )}
                          >
                            {state.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ExpiryAlertBadge expiryDate={item.expiry_date} />
                          {!item.expiry_date && (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <form
            onSubmit={submitUsage}
            className="bg-background border border-border rounded-2xl p-5 space-y-4"
          >
            <div>
              <p className="font-semibold text-foreground">Log Item Usage</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Deduct stock when your department consumes inventory.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Item
              </label>
              <select
                value={selectedItemId ?? ""}
                onChange={(event) => setSelectedItemId(Number(event.target.value))}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background text-sm"
                required
              >
                <option value="" disabled>
                  Select item
                </option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Quantity Used
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={selectedItem?.quantity}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Task, room, order, or reason..."
                className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingUsage}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {savingUsage ? "Saving..." : "Log Usage"}
            </button>
          </form>

          <button
            onClick={() => setShowWastage(true)}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            <Trash2 size={16} />
            Report Wastage
          </button>

          <div className="bg-background border border-border rounded-2xl p-5">
            <p className="font-semibold text-foreground">Recent Usage</p>
            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
              {inventory.loading ? (
                <p className="text-sm text-muted-foreground">Loading logs...</p>
              ) : inventory.usageLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No usage logs for {department} yet.
                </p>
              ) : (
                inventory.usageLogs.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-border px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {log.item?.name ?? `Item #${log.item_id}`}
                      </p>
                      <span className="text-xs font-semibold text-primary">
                        {log.quantity_used} {log.item?.unit}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtDate(log.used_at)}
                      {log.notes ? ` - ${log.notes}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showWastage && (
        <WastageModal
          items={items}
          onClose={() => setShowWastage(false)}
          onSave={async (payload) => {
            return inventory.reportWastage(payload);
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  onClick,
  active,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-background border border-border rounded-2xl p-4 flex items-center gap-3.5 transition-all",
        onClick && "cursor-pointer hover:shadow-md",
        active && "ring-2 ring-primary border-primary"
      )}
    >
      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          color,
        )}
      >
        <Icon size={17} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-none truncate">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}