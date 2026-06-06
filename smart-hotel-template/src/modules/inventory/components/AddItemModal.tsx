"use client";
// src/modules/inventory/components/AddItemModal.tsx
import { useState } from "react";
import { X, Package } from "lucide-react";
import { toast } from "sonner";
import type { InventoryCategory, CreateItemPayload } from "@/types/inventory";

interface Props {
  categories: InventoryCategory[];
  onClose: () => void;
  onSave: (payload: CreateItemPayload) => Promise<{ ok: boolean; error?: string }>;
  initial?: Partial<CreateItemPayload> & { id?: number };
}

export function AddItemModal({ categories, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<CreateItemPayload>({
    name: initial?.name ?? "",
    sku: initial?.sku ?? "",
    category_id: initial?.category_id ?? (categories[0]?.id ?? 0),
    unit: initial?.unit ?? "piece",
    quantity: initial?.quantity ?? 0,
    low_stock_threshold: initial?.low_stock_threshold ?? 10,
    unit_cost: initial?.unit_cost ?? 0,
    expiry_date: initial?.expiry_date ?? "",
    location: initial?.location ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handle = (k: keyof CreateItemPayload, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category_id || !form.unit) {
      toast.error("Name, category and unit are required");
      return;
    }
    setSaving(true);
    const res = await onSave({
      ...form,
      expiry_date: form.expiry_date || undefined,
      sku: form.sku || undefined,
      location: form.location || undefined,
      notes: form.notes || undefined,
    });
    setSaving(false);
    if (res.ok) {
      toast.success(initial?.id ? "Item updated" : "Item created");
      onClose();
    } else {
      toast.error(res.error ?? "Something went wrong");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {initial?.id ? "Edit Item" : "Add New Item"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <label className={labelCls}>Item Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => handle("name", e.target.value)} placeholder="e.g. Basmati Rice" required />
          </div>

          {/* SKU */}
          <div>
            <label className={labelCls}>SKU</label>
            <input className={inputCls} value={form.sku} onChange={(e) => handle("sku", e.target.value)} placeholder="e.g. RICE-001" />
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category *</label>
            <select className={inputCls} value={form.category_id} onChange={(e) => handle("category_id", parseInt(e.target.value))} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className={labelCls}>Unit *</label>
            <select className={inputCls} value={form.unit} onChange={(e) => handle("unit", e.target.value)} required>
              {["piece","kg","gram","litre","ml","box","pack","bottle","roll","dozen","bag"].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className={labelCls}>Opening Quantity</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.quantity} onChange={(e) => handle("quantity", parseFloat(e.target.value))} />
          </div>

          {/* Low stock threshold */}
          <div>
            <label className={labelCls}>Low Stock Threshold</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.low_stock_threshold} onChange={(e) => handle("low_stock_threshold", parseFloat(e.target.value))} />
          </div>

          {/* Unit cost */}
          <div>
            <label className={labelCls}>Unit Cost (PKR)</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.unit_cost} onChange={(e) => handle("unit_cost", parseFloat(e.target.value))} />
          </div>

          {/* Expiry */}
          <div>
            <label className={labelCls}>Expiry Date</label>
            <input type="date" className={inputCls} value={form.expiry_date ?? ""} onChange={(e) => handle("expiry_date", e.target.value)} />
          </div>

          {/* Location */}
          <div className="col-span-2">
            <label className={labelCls}>Storage Location</label>
            <input className={inputCls} value={form.location ?? ""} onChange={(e) => handle("location", e.target.value)} placeholder="e.g. Shelf A-3" />
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea rows={2} className={inputCls} value={form.notes ?? ""} onChange={(e) => handle("notes", e.target.value)} placeholder="Optional notes..." />
          </div>

          {/* Actions */}
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {saving ? "Saving…" : initial?.id ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
