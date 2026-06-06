"use client";

import { useState } from "react";
import { useReports } from "@/hooks/useInventory";

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split("T")[0];

  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  // FIX: Appended end-of-day timestamp to the end date ('to') to include the entire day's records
  const { consumption, cogs, wastage, loading } = useReports(from, to ? `${to}T23:59:59` : to);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>

      {/* Date Filter */}
      <div className="flex gap-4 items-center">
        <div>
          <label className="text-sm text-gray-500">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="block border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm text-gray-500">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="block border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          {/* Consumption */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Consumption Report</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Total Used</th>
                  </tr>
                </thead>
                <tbody>
                  {consumption.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No data</td></tr>
                  ) : consumption.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-3">{row.department}</td>
                      <td className="px-4 py-3 font-medium">{row.item_name}</td>
                      <td className="px-4 py-3">{row.unit}</td>
                      <td className="px-4 py-3">{row.total_used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* COGS */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">COGS Report</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {cogs.length === 0 ? (
                    <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-400">No data</td></tr>
                  ) : cogs.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-3">{row.department}</td>
                      <td className="px-4 py-3 font-medium">Rs. {row.total_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Wastage */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Wastage Report</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {wastage.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No data</td></tr>
                  ) : wastage.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">{row.item_name}</td>
                      <td className="px-4 py-3">{row.reason}</td>
                      <td className="px-4 py-3">{row.quantity}</td>
                      <td className="px-4 py-3">Rs. {row.total_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}