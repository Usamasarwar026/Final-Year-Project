"use client";

import { useState } from "react";
import { usePurchaseOrders, useVendors, useInventoryItems } from "@/hooks/useInventory";
import { PurchaseOrder, PO_STATUS_CONFIG } from "@/types/inventory";
import { Plus, X, Trash2, ChevronDown } from "lucide-react";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  Pending: ["Sent", "Cancelled"],
  Sent: ["PartiallyReceived", "Received", "Cancelled"],
  PartiallyReceived: ["Received", "Cancelled"],
  Received: [],
  Cancelled: [],
};

export default function PurchaseOrdersPage() {
  const { orders, loading, createOrder, updateStatus } = usePurchaseOrders();
  const { vendors } = useVendors();
  const { items } = useInventoryItems();

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ vendor_id: "", notes: "" });
  const [poItems, setPoItems] = useState([
    { item_id: "", ordered_quantity: "", unit_price: "" }
  ]);

  const addRow = () => setPoItems((prev) => [...prev, { item_id: "", ordered_quantity: "", unit_price: "" }]);
  const removeRow = (i: number) => setPoItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: string) => {
    setPoItems((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

  const handleSubmit = async () => {
    if (!form.vendor_id) { setError("Vendor select karo!"); return; }
    if (poItems.some((r) => !r.item_id || !r.ordered_quantity || !r.unit_price)) {
      setError("Sab items complete karo!"); return;
    }
    setSaving(true); setError("");
    const result = await createOrder({
      vendor_id: parseInt(form.vendor_id),
      notes: form.notes || undefined,
      items: poItems.map((r) => ({
        item_id: parseInt(r.item_id),
        ordered_quantity: parseFloat(r.ordered_quantity),
        unit_price: parseFloat(r.unit_price),
      })),
    });
    setSaving(false);
    if (result.ok) {
      setShowModal(false);
      setForm({ vendor_id: "", notes: "" });
      setPoItems([{ item_id: "", ordered_quantity: "", unit_price: "" }]);
    } else {
      setError(result.error ?? "Failed to create PO");
    }
  };

  const handleStatusChange = async (po: PurchaseOrder, newStatus: string) => {
    setUpdatingId(po.id);
    await updateStatus(po.id, newStatus);
    setUpdatingId(null);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <button onClick={() => { setError(""); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">No purchase orders yet</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total Cost</th>
                <th className="px-4 py-3">Ordered At</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po: PurchaseOrder) => {
                const config = PO_STATUS_CONFIG[po.status];
                const transitions = STATUS_TRANSITIONS[po.status] ?? [];
                return (
                  <tr key={po.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{po.po_number}</td>
                    <td className="px-4 py-3 text-gray-500">{po.vendor?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">Rs. {po.total_cost}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(po.ordered_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {transitions.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {transitions.map((s) => (
                            <button
                              key={s}
                              disabled={updatingId === po.id}
                              onClick={() => handleStatusChange(po, s)}
                              className={`px-2 py-1 rounded text-xs font-medium border transition disabled:opacity-50 ${
                                s === "Cancelled"
                                  ? "border-red-300 text-red-600 hover:bg-red-50"
                                  : "border-blue-300 text-blue-600 hover:bg-blue-50"
                              }`}
                            >
                              {updatingId === po.id ? "..." : s === "Cancelled" ? "Cancel" : `→ ${s}`}
                            </button>
                          ))}
                        </div>
                      )}
                      {transitions.length === 0 && (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Create Purchase Order</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Vendor *</label>
                <select value={form.vendor_id} onChange={(e) => setForm((p) => ({ ...p, vendor_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1">
                  <option value="">Select Vendor</option>
                  {vendors.filter((v) => v.is_active !== false).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" rows={2} placeholder="Optional notes" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Items *</label>
                <div className="space-y-2">
                  {poItems.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select value={row.item_id} onChange={(e) => updateRow(i, "item_id", e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        <option value="">Select Item</option>
                        {items.filter((item) => item.is_active !== false).map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" value={row.ordered_quantity}
                        onChange={(e) => updateRow(i, "ordered_quantity", e.target.value)}
                        className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                      <input type="number" placeholder="Price" value={row.unit_price}
                        onChange={(e) => updateRow(i, "unit_price", e.target.value)}
                        className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                      {poItems.length > 1 && (
                        <button onClick={() => removeRow(i)}><Trash2 className="w-4 h-4 text-red-400" /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addRow} className="mt-2 text-sm text-blue-600 hover:underline">+ Add Row</button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Create PO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}