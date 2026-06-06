"use client";
// src/modules/inventory/components/CreatePOModal.tsx
import { useState } from "react";
import { X, ShoppingCart, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { InventoryVendor, InventoryItem, CreatePOPayload } from "@/types/inventory";

interface Props {
  vendors: InventoryVendor[];
  items: InventoryItem[];
  onClose: () => void;
  onSave: (payload: CreatePOPayload) => Promise<{ ok: boolean; error?: string }>;
  prefillItemId?: number;
}

interface POLine {
  item_id: number;
  ordered_quantity: number;
  unit_price: number;
}

export function CreatePOModal({ vendors, items, onClose, onSave, prefillItemId }: Props) {
  const activeItems = items.filter((i) => i.is_active);
  const [vendorId, setVendorId] = useState<number>(vendors[0]?.id ?? 0);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<POLine[]>([
    {
      item_id: prefillItemId ?? activeItems[0]?.id ?? 0,
      ordered_quantity: 1,
      unit_price: activeItems.find((i) => i.id === (prefillItemId ?? activeItems[0]?.id))?.unit_cost ?? 0,
    },
  ]);
  const [saving, setSaving] = useState(false);

  const addLine = () =>
    setLines((p) => [
      ...p,
      { item_id: activeItems[0]?.id ?? 0, ordered_quantity: 1, unit_price: activeItems[0]?.unit_cost ?? 0 },
    ]);

  const removeLine = (idx: number) => setLines((p) => p.filter((_, i) => i !== idx));

  const updateLine = (idx: number, key: keyof POLine, value: number) => {
    setLines((p) => {
      const copy = [...p];
      copy[idx] = { ...copy[idx], [key]: value };
      // Auto-fill unit price when item changes
      if (key === "item_id") {
        const found = activeItems.find((i) => i.id === value);
        if (found) copy[idx].unit_price = found.unit_cost;
      }
      return copy;
    });
  };

  const totalCost = lines.reduce((s, l) => s + l.ordered_quantity * l.unit_price, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) { toast.error("Select a vendor"); return; }
    if (lines.length === 0) { toast.error("Add at least one item"); return; }
    for (const l of lines) {
      if (!l.item_id || l.ordered_quantity <= 0) {
        toast.error("All lines must have a valid item and quantity");
        return;
      }
    }

    setSaving(true);
    const res = await onSave({ vendor_id: vendorId, notes: notes || undefined, items: lines });
    setSaving(false);
    if (res.ok) {
      toast.success("Purchase order created");
      onClose();
    } else {
      toast.error(res.error ?? "Failed to create PO");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Create Purchase Order</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Vendor + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Vendor *</label>
              <select className={inputCls} value={vendorId} onChange={(e) => setVendorId(parseInt(e.target.value))} required>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note…" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 uppercase">Order Lines</p>
              <button type="button" onClick={addLine} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                <Plus size={12} /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium px-1">
                <div className="col-span-5">Item</div>
                <div className="col-span-3 text-center">Qty</div>
                <div className="col-span-3 text-center">Unit Price</div>
                <div className="col-span-1" />
              </div>

              {lines.map((line, idx) => {
                const sel = activeItems.find((i) => i.id === line.item_id);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-2">
                    <div className="col-span-5">
                      <select
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                        value={line.item_id}
                        onChange={(e) => updateLine(idx, "item_id", parseInt(e.target.value))}
                      >
                        {activeItems.map((i) => (
                          <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number" min="0.01" step="0.01"
                        value={line.ordered_quantity}
                        onChange={(e) => updateLine(idx, "ordered_quantity", parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number" min="0" step="0.01"
                        value={line.unit_price}
                        onChange={(e) => updateLine(idx, "unit_price", parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button type="button" onClick={() => removeLine(idx)} disabled={lines.length === 1} className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="bg-indigo-50 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-medium text-indigo-700">Total Cost</span>
            <span className="text-lg font-bold text-indigo-800">PKR {totalCost.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {saving ? "Creating…" : "Create PO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
