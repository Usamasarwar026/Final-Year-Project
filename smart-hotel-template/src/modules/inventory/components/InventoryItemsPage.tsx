"use client";

import { useInventoryItems } from "@/hooks/useInventory";

export default function InventoryItemsPage() {
  const { items, loading } = useInventoryItems();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Stock Items</h1>

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
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}