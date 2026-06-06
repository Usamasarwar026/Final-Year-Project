"use client";
// src/modules/inventory/components/LowStockAlertBanner.tsx
import { AlertTriangle, X, ShoppingCart } from "lucide-react";
import type { LowStockAlert } from "@/types/inventory";

interface Props {
  alerts: LowStockAlert[];
  onResolve: (id: number) => void;
  onDismiss: (id: number) => void;
}

export function LowStockAlertBanner({ alerts, onResolve, onDismiss }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <AlertTriangle size={16} className="text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-amber-800 text-sm">
            {alerts.length} Low Stock Alert{alerts.length > 1 ? "s" : ""}
          </p>
          <p className="text-amber-600 text-xs">Items need to be restocked</p>
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-800">
                {alert.item?.name ?? `Item #${alert.item_id}`}
              </span>
              <span className="text-xs text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">
                {alert.current_quantity} / {alert.threshold} {alert.item?.unit}
              </span>
              <span className="text-xs text-gray-400">
                {alert.item?.category?.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onResolve(alert.id)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                <ShoppingCart size={11} />
                Create PO
              </button>
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
