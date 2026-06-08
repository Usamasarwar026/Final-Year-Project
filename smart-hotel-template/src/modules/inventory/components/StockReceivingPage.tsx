"use client";

import { useState } from "react";
import { usePurchaseOrders } from "@/hooks/useInventory";
import { PurchaseOrder, PO_STATUS_CONFIG } from "@/types/inventory";
import { X, PackageCheck } from "lucide-react";

export default function StockReceivingPage() {
  const { orders, loading, receiveStock } = usePurchaseOrders();

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pendingOrders = orders.filter(
    (po: PurchaseOrder) => po.status === "Pending" || po.status === "Sent" || po.status === "PartiallyReceived"
  );

  const openReceive = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initial: Record<number, string> = {};
    po.items?.forEach((item: any) => { initial[item.id] = ""; });
    setReceivedQtys(initial);
    setError("");
  };

  const handleReceive = async () => {
    if (!selectedPO) return;
    const receivedItems = (selectedPO.items ?? [])
      .filter((item: any) => receivedQtys[item.id] && parseFloat(receivedQtys[item.id]) > 0)
      .map((item: any) => ({
        po_item_id: item.id,
        received_quantity: parseFloat(receivedQtys[item.id]),
      }));

    if (receivedItems.length === 0) {
      setError("Kam az kam ek item ki quantity daalo!"); return;
    }

    setSaving(true); setError("");
    // FIX: Wrapped receivedItems array inside an object under 'items' key
    const result = await receiveStock(selectedPO.id, { items: receivedItems });
    setSaving(false);
    if (result.ok) {
      setSelectedPO(null);
    } else {
      setError(result.error ?? "Failed to receive stock");
    }
  };

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
                <th className="px-4 py-3">Actions</th>
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
                    <td className="px-4 py-3">PKR {po.total_cost}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(po.ordered_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openReceive(po)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                        <PackageCheck className="w-3.5 h-3.5" /> Receive
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Receive Stock Modal */}
      {selectedPO && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Receive Stock — {selectedPO.po_number}</h2>
              <button onClick={() => setSelectedPO(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="space-y-3">
              {(selectedPO.items ?? []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.item?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">Ordered: {item.ordered_quantity} | Received: {item.received_quantity}</p>
                  </div>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={receivedQtys[item.id] ?? ""}
                    onChange={(e) => setReceivedQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                    max={item.ordered_quantity - item.received_quantity}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSelectedPO(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleReceive} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {saving ? "Saving..." : "Confirm Receive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}