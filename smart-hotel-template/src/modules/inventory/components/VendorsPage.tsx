"use client";

import { useVendors } from "@/hooks/useInventory";

export default function VendorsPage() {
  const { vendors, loading } = useVendors();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
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
    </div>
  );
}