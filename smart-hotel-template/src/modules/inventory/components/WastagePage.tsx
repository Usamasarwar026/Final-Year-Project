"use client";

import { useWastage } from "@/hooks/useInventory";
import { WastageRecord } from "@/types/inventory";

export default function WastagePage() {
  const { records, loading } = useWastage();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Wastage Records</h1>

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
                <th className="px-4 py-3">Date</th>
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
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(record.wasted_at).toLocaleDateString()}
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