"use client";

import { useState } from "react";
import { useVendors } from "@/hooks/useInventory";
import { Plus, X } from "lucide-react";

export default function VendorsPage() {
  const { vendors, loading, createVendor } = useVendors();

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Vendor name required hai!");
      return;
    }
    setSaving(true);
    setError("");
    const result = await createVendor({
      name: form.name.trim(),
      contact_name: form.contact_name || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
    });
    setSaving(false);
    if (result.ok) {
      setShowModal(false);
      setForm({ name: "", contact_name: "", email: "", phone: "", address: "" });
    } else {
      setError(result.error ?? "Failed to create vendor");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : vendors.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          No vendors yet — add one!
        </div>
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
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{vendor.name}</td>
                  <td className="px-4 py-3 text-gray-500">{vendor.contact_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{vendor.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{vendor.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {vendor.is_active ? (
                      <span className="text-green-600 font-semibold">Active</span>
                    ) : (
                      <span className="text-red-500">Inactive</span>
                    )}
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
              <h2 className="text-lg font-bold text-gray-900">Add Vendor</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
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
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}