"use client";
// src/modules/inventory/components/ExpiryAlertBadge.tsx
import { AlertTriangle, Clock } from "lucide-react";

interface Props {
  expiryDate?: string | null;
}

function daysUntilExpiry(date: string): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function ExpiryAlertBadge({ expiryDate }: Props) {
  if (!expiryDate) return null;

  const days = daysUntilExpiry(expiryDate);

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <AlertTriangle size={10} />
        Expired
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
        <Clock size={10} />
        {days === 0 ? "Expires today" : `Expires in ${days}d`}
      </span>
    );
  }
  return null;
}
