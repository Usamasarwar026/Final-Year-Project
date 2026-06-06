"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useInventoryItems, useCategories, useUnits, useUsageLogs } from "@/hooks/useInventory";
import { Plus, X, ClipboardList, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import type { InventoryDepartment, InventoryItem } from "@/types/inventory";

const DEPARTMENTS = ["Kitchen", "Housekeeping", "Bar", "Maintenance", "Reception", "General"];

const EMPTY_FORM = {
  name: "", sku: "", category_id: "", unit_id: "",
  quantity: "", low_stock_threshold: "", unit_cost: "", location: "", notes: "",
};

export default function InventoryItemsPage() {
  const { data: session } = useSession();
  const { items, loading, createItem, updateItem } = useInventoryItems();
  const { categories } = useCategories();
  const { units, createUnit } = useUnits();
  const { logUsage } = useUsageLogs();

  const [showModal, setShowModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
  const [newUnitName, setNewUnitName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const [logForm, setLogForm] = useState({
    item_id: "", quantity_used: "", department: "", notes: "",
  });

  const activeItems = items.filter((i) => i.is_active !== false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setLogForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return;
    const result = await createUnit(newUnitName.trim());
    if (result.ok && result.data) {
      setForm((prev) => ({ ...prev, unit_id: String(result.data!.id) }));
      setNewUnitName("");
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditTarget(item);
    setForm({
      name: item.name,
      sku: item.sku ?? "",
      category_id: item.category_id ? String(item.category_id) : "",
      unit_id: item.unit_id ? String(item.unit_id) : "",
      quantity: String(item.quantity ?? 0),
      low_stock_threshold: String(item.low_stock_threshold ?? 10),
      unit_cost: String(item.unit_cost ?? 0),
      location: item.location ?? "",
      notes: item.notes ?? "",
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category_id || !form.unit_id) {
      setError("Name, Category aur Unit required hain!"); return;
    }
    setSaving(true); setError("");

    const payload = {
      name: form.name,
      sku: form.sku || undefined,
      category_id: parseInt(form.category_id),
      unit_id: parseInt(form.unit_id),
      unit: units.find((u) => u.id === parseInt(form.unit_id))?.name ?? "",
      quantity: parseFloat(form.quantity) || 0,
      low_stock_threshold: parseFloat(form.low_stock_threshold) || 10,
      unit_cost: parseFloat(form.unit_cost) || 0,
      location: form.location || undefined,
      notes: form.notes || undefined,
    };

    const result = editTarget
      ? await updateItem(editTarget.id, payload)
      : await createItem(payload);

    setSaving(false);
    if (result.ok) {
      closeModal();
    } else {
      setError(result.error ?? "Failed to save item");
    }
  };

  const toggleStatus = async (item: InventoryItem) => {
    await updateItem(item.id, { is_active: !(item.is_active !== false) });
  };

  const handleLogSubmit = async () => {
    if (!logForm.item_id || !logForm.quantity_used || !logForm.department) {
      setError("Item, Quantity aur Department required hain!"); return;
    }
    setSaving(true); setError("");
    const result = await logUsage({
      item_id: parseInt(logForm.item_id),
      quantity_used: parseFloat(logForm.quantity_used),
      department: logForm.department as InventoryDepartment,
      used_by: session?.user?.name ?? session?.user?.email ?? "Unknown",
      notes: logForm.notes || undefined,
    });
    setSaving(false);
    if (result.ok) {
      setShowLogModal(false);
      setLogForm({ item_id: "", quantity_used: "", department: "", notes: "" });
    } else {
      setError(result.error ?? "Failed to log usage");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stock Items</h1>
        <div className="flex gap-2">
          <button onClick={() => { setError(""); setShowLogModal(true); }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            <ClipboardList className="w-4 h-4" /> Log Usage
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Stock Status</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={`border-t border-gray-100 ${item.is_active === false ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{item.unit}</td>
                  <td className="px-4 py-3">
                    {item.quantity <= item.low_stock_threshold ? (
                      <span className="text-red-600 font-semibold">Low Stock</span>
                    ) : (
                      <span className="text-green-600">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.is_active !== false
                      ? <span className="text-green-600 font-semibold">Active</span>
                      : <span className="text-red-500">Inactive</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleStatus(item)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition" title={item.is_active !== false ? "Deactivate" : "Activate"}>
                        {item.is_active !== false
                          ? <ToggleRight className="w-4 h-4 text-green-600" />
                          : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editTarget ? "Edit Stock Item" : "Add Stock Item"}</h2>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Item Name *</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. Basmati Rice" />
              </div>
              <div>
                <label className="text-xs text-gray-500">SKU</label>
                <input name="sku" value={form.sku} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. KIT-001" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Category *</label>
                <select name="category_id" value={form.category_id} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1">
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Unit *</label>
                <div className="flex gap-2 mt-1">
                  <select name="unit_id" value={form.unit_id} onChange={handleChange} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select Unit</option>
                    {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <input value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="New unit" className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={handleAddUnit} className="bg-gray-100 px-3 py-2 rounded-lg text-sm hover:bg-gray-200">Add</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Quantity</label>
                <input name="quantity" type="number" value={form.quantity} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Low Stock Threshold</label>
                <input name="low_stock_threshold" type="number" value={form.low_stock_threshold} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="10" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Unit Cost (Rs.)</label>
                <input name="unit_cost" type="number" value={form.unit_cost} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Location</label>
                <input name="location" value={form.location} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. Shelf A" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : editTarget ? "Update" : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Usage Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Log Item Usage</h2>
              <button onClick={() => setShowLogModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Item *</label>
                <select name="item_id" value={logForm.item_id} onChange={handleLogChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1">
                  <option value="">Select Item</option>
                  {activeItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Quantity Used *</label>
                <input name="quantity_used" type="number" value={logForm.quantity_used} onChange={handleLogChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. 2" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Department *</label>
                <select name="department" value={logForm.department} onChange={handleLogChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1">
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Notes</label>
                <textarea name="notes" value={logForm.notes} onChange={handleLogChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" rows={2} placeholder="Optional notes" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowLogModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleLogSubmit} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {saving ? "Saving..." : "Log Usage"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}