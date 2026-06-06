"use client";

import { useState } from "react";
import { useVendors } from "@/hooks/useInventory";
import { Plus, X, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import type { InventoryVendor } from "@/types/inventory";

const EMPTY_FORM = { name: "", contact_name: "", email: "", phone: "", address: "" };

export default function VendorsPage() {
  const { vendors, loading, createVendor, updateVendor } = useVendors();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryVendor | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (vendor: InventoryVendor) => {
    setEditTarget(vendor);
    setForm({
      name: vendor.name,
      contact_name: vendor.contact_name ?? "",
      email: vendor.email ?? "",
      phone: vendor.phone ?? "",
      address: vendor.address ?? "",
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
    if (!form.name.trim()) { setError("Vendor name required hai!"); return; }
    setSaving(true); setError("");

    const payload = {
      name: form.name.trim(),
      contact_name: form.contact_name || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
    };

    const result = editTarget
      ? await updateVendor(editTarget.id, payload)
      : await createVendor(payload);

    setSaving(false);
    if (result.ok) { closeModal(); }
    else { setError(result.error ?? "Failed to save vendor"); }
  };

  const toggleStatus = async (vendor: InventoryVendor) => {
    await updateVendor(vendor.id, { is_active: !vendor.is_active });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : vendors.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">No vendors yet — add one!</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className={`border-t border-gray-100 ${!vendor.is_active ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-medium">{vendor.name}</td>
                  <td className="px-4 py-3 text-gray-500">{vendor.contact_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{vendor.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{vendor.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {vendor.is_active
                      ? <span className="text-green-600 font-semibold">Active</span>
                      : <span className="text-red-500">Inactive</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(vendor)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleStatus(vendor)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition" title={vendor.is_active ? "Deactivate" : "Activate"}>
                        {vendor.is_active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
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
              <h2 className="text-lg font-bold text-gray-900">{editTarget ? "Edit Vendor" : "Add Vendor"}</h2>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Vendor Name *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. Metro Cash & Carry" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Contact Person</label>
                <input name="contact_name" value={form.contact_name} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. Ahmed Ali" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. vendor@email.com" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. 0300-1234567" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Address</label>
                <textarea name="address" value={form.address} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" rows={2} placeholder="Optional address" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : editTarget ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}