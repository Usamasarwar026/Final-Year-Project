"use client";
// src/modules/inventory/components/WastageModal.tsx
import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { InventoryItem, CreateWastagePayload, WastageReason } from "@/types/inventory";
import { WASTAGE_REASONS } from "@/types/inventory";

interface Props {
  items: InventoryItem[];
  onClose: () => void;
  onSave: (payload: CreateWastagePayload) => Promise<{ ok: boolean; error?: string }>;
}

export function WastageModal({ items, onClose, onSave }: Props) {
  const activeItems = items.filter((i) => i.is_active);
  const [form, setForm] = useState<CreateWastagePayload>({
    item_id: activeItems[0]?.id ?? 0,
    quantity: 1,
    reason: "Expired",
    reported_by: "", // 👈 Added required field initialization
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const selected = activeItems.find((i) => i.id === form.item_id);
  const estimatedCost = form.quantity * (selected?.unit_cost ?? 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_id || !form.quantity || !form.reason || !form.reported_by) {
      toast.error("All required fields must be filled");
      return;
    }
    if (selected && form.quantity > selected.quantity) {
      toast.error(`Only ${selected.quantity} ${selected.unit} available`);
      return;
    }
    setSaving(true);
    const res = await onSave({ ...form, notes: form.notes || undefined });
    setSaving(false);
    if (res.ok) {
      toast.success("Wastage recorded");
      onClose();
    } else {
      toast.error(res.error ?? "Failed to record wastage");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 size={16} className="text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Record Wastage</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Item */}
          <div>
            <label className={labelCls}>Select Item *</label>
            <select
              className={inputCls}
              value={form.item_id}
              onChange={(e) => setForm((p) => ({ ...p, item_id: parseInt(e.target.value) }))}
              required
            >
              {activeItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.quantity} {i.unit} available)
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className={labelCls}>Quantity *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={selected?.quantity}
              className={inputCls}
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: parseFloat(e.target.value) }))}
              required
            />
            {selected && (
              <p className="text-xs text-gray-400 mt-1">
                Max: {selected.quantity} {selected.unit}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className={labelCls}>Reason *</label>
            <select
              className={inputCls}
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value as WastageReason }))}
              required
            >
              {WASTAGE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Reported By */}
          <div>
            <label className={labelCls}>Reported By *</label>
            <input
              type="text"
              className={inputCls}
              value={form.reported_by}
              onChange={(e) => setForm((p) => ({ ...p, reported_by: e.target.value }))}
              placeholder="e.g. Ahmed"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              rows={2}
              className={inputCls}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Optional details..."
            />
          </div>

          {/* Estimated cost */}
          {estimatedCost > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2">
              <p className="text-xs text-red-600 font-medium">
                Estimated Loss: PKR {estimatedCost.toFixed(2)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors">
              {saving ? "Saving…" : "Record Wastage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}