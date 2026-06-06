"use client";
// src/modules/inventory/components/StockReceiveModal.tsx
import { useState } from "react";
import { X, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import type { PurchaseOrder } from "@/types/inventory";

interface Props {
  po: PurchaseOrder;
  onClose: () => void;
  onSave: (poId: number, items: { po_item_id: number; received_quantity: number }[]) => Promise<{ ok: boolean; error?: string }>;
}

export function StockReceiveModal({ po, onClose, onSave }: Props) {
  const pending = (po.items ?? []).filter(
    (i) => i.received_quantity < i.ordered_quantity
  );

  const [received, setReceived] = useState<Record<number, number>>(
    Object.fromEntries(
      pending.map((i) => [i.id, i.ordered_quantity - i.received_quantity])
    )
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = pending
      .map((i) => ({ po_item_id: i.id, received_quantity: received[i.id] ?? 0 }))
      .filter((i) => i.received_quantity > 0);

    if (items.length === 0) {
      toast.error("Enter at least one received quantity");
      return;
    }

    setSaving(true);
    const res = await onSave(po.id, items);
    setSaving(false);

    if (res.ok) {
      toast.success("Stock received and inventory updated");
      onClose();
    } else {
      toast.error(res.error ?? "Failed to receive stock");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <PackageCheck size={16} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Receive Stock</h2>
              <p className="text-xs text-gray-400">{po.po_number} · {po.vendor?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">All items already fully received.</p>
          ) : (
            <div className="space-y-3">
              {/* Table header */}
              <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
                <div className="col-span-2">Item</div>
                <div className="text-center">Ordered</div>
                <div className="text-center">Receiving</div>
              </div>

              {pending.map((item) => {
                const remaining = item.ordered_quantity - item.received_quantity;
                return (
                  <div key={item.id} className="grid grid-cols-4 gap-2 items-center bg-gray-50 rounded-lg px-3 py-2.5">
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-800">{item.item?.name}</p>
                      <p className="text-xs text-gray-400">{item.item?.unit} · {item.item?.sku ?? "—"}</p>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      {remaining} {item.item?.unit}
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        step="0.01"
                        value={received[item.id] ?? 0}
                        onChange={(e) =>
                          setReceived((p) => ({ ...p, [item.id]: parseFloat(e.target.value) || 0 }))
                        }
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300 text-center"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            {pending.length > 0 && (
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-colors">
                {saving ? "Updating…" : "Confirm Receipt"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
