"use client";

import { usePurchaseOrders } from "@/hooks/useInventory";
import { PurchaseOrder, PO_STATUS_CONFIG } from "@/types/inventory";

export default function StockReceivingPage() {
  const { orders, loading } = usePurchaseOrders();

  const pendingOrders = orders.filter(
    (po: PurchaseOrder) => po.status === "Pending" || po.status === "Sent" || po.status === "PartiallyReceived"
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Stock Receiving</h1>
      <p className="text-gray-500 text-sm">Pending & partially received purchase orders</p>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : pendingOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          No pending orders to receive
        </div>
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
              {pendingOrders.map((po: PurchaseOrder) => {
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