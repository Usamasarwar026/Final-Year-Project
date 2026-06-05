"use client";
// src/modules/inventory/components/POStatusBadge.tsx
import type { POStatus } from "@/types/inventory";
import { PO_STATUS_CONFIG } from "@/types/inventory";

interface Props {
  status: POStatus;
  size?: "sm" | "md";
}

export function POStatusBadge({ status, size = "sm" }: Props) {
  const cfg = PO_STATUS_CONFIG[status];
  const px = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${px} ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {status === "Pending" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
      {status === "Sent" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
      {status === "PartiallyReceived" && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
      {status === "Received" && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
      {status === "Cancelled" && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
      {cfg.label}
    </span>
  );
}
