"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
// CHANGE 1: Added Trash2 to lucide-react imports
import { useWastage, useInventoryItems } from "@/hooks/useInventory";
import { WastageRecord, WastageReason } from "@/types/inventory";
import { Plus, X, Trash2 } from "lucide-react";

const WASTAGE_REASONS: WastageReason[] = ["Expired", "Damaged", "Lost", "Other"];

export default function WastagePage() {
  const { data: session } = useSession();
  // CHANGE 2: Extracted deleteWastage from useWastage hook
  const { records, loading, addWastage, deleteWastage } = useWastage();
  const { items } = useInventoryItems();

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    item_id: "",
    quantity: "",
    reason: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.item_id || !form.quantity || !form.reason) {
      setError("Item, Quantity aur Reason required hain!");
      return;
    }
    setSaving(true);
    setError("");
    const result = await addWastage({
      item_id: parseInt(form.item_id),
      quantity: parseFloat(form.quantity),
      reason: form.reason as WastageReason,
      reported_by: session?.user?.name ?? session?.user?.email ?? "Unknown",
      notes: form.notes || undefined,
    });
    setSaving(false);
    if (result.ok) {
      setShowModal(false);
      setForm({ item_id: "", quantity: "", reason: "", notes: "" });
    } else {
      setError(result.error ?? "Failed to record wastage");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Wastage Records</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
          <Plus className="w-4 h-4" /> Record Wastage
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : records.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          No wastage records found
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Total Cost</th>
                <th className="px-4 py-3">Reported By</th>
                {/* CHANGE 3: Added Actions column header */}
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record: WastageRecord) => (
                <tr key={record.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{record.item?.name ?? "—"}</td>
                  <td className="px-4 py-3">{record.quantity} {record.item?.unit ?? ""}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                      {record.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3">Rs. {record.total_cost}</td>
                  <td className="px-4 py-3 text-gray-500">{record.reported_by}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(record.wasted_at).toLocaleDateString()}</td>
                  {/* CHANGE 4: Added action cell containing the delete button */}
                  <td className="px-4 py-3">
                    <button onClick={() => deleteWastage(record.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Record Wastage</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Item *</label>
                <select name="item_id" value={form.item_id} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1">
                  <option value="">Select Item</option>
                  {items.filter((i) => i.is_active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Quantity *</label>
                <input name="quantity" type="number" value={form.quantity} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. 5" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Reason *</label>
                <select name="reason" value={form.reason} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1">
                  <option value="">Select Reason</option>
                  {WASTAGE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" rows={2} placeholder="Optional notes" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}