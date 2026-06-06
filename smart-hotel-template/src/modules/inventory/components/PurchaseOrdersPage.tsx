"use client";

import { usePurchaseOrders } from "@/hooks/useInventory";
import { PO_STATUS_CONFIG, PurchaseOrder } from "@/types/inventory";

export default function PurchaseOrdersPage() {
  const { orders, loading } = usePurchaseOrders();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
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
              </tr>
            </thead>
            <tbody>
              {orders.map((po: PurchaseOrder) => {
                const config = PO_STATUS_CONFIG[po.status];
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
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(po.ordered_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}