// src/app/customer/billing/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CreditCard, Eye, Printer, Loader2, Calendar } from "lucide-react";
import clsx from "clsx";
import api from "@/lib/axios";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

function PaymentStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; dot: string }> = {
    Paid: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
    Partial: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
    Unpaid: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
  };
  const c = configs[status] || configs["Unpaid"];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", c.bg, c.text)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {status}
    </span>
  );
}

export default function CustomerBillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMyInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ invoices: any[] }>("/billing");
      setInvoices(data.invoices);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyInvoices();
  }, [loadMyInvoices]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-serif">My Invoices & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your invoices, tracked room stays, service charges, dining orders, and payment histories.
        </p>
      </div>

      <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Loading your invoices…</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-rose-500">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center">
            <CreditCard size={32} className="mx-auto mb-2.5 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground font-medium">No invoices found</p>
            <p className="text-xs text-muted-foreground mt-1">Invoices are generated upon checkout.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {[
                    "Invoice #",
                    "Room",
                    "Invoice Date",
                    "Subtotal",
                    "Grand Total",
                    "Amount Paid",
                    "Remaining Balance",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoices.map((inv) => (
                  <tr key={inv.invoice_id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-4 font-mono font-semibold text-xs text-foreground">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-foreground text-xs">
                          Room {inv.booking?.room?.room_number || "—"}
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          {inv.booking?.room?.room_type || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(inv.generated_at)}
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-foreground">
                      PKR ${inv.subtotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-foreground">
                      PKR {inv.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      PKR {inv.amount_paid.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={clsx(
                          "text-xs font-semibold",
                          inv.balance_due > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        PKR {inv.balance_due.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <PaymentStatusBadge status={inv.payment_status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/customer/billing/${inv.invoice_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <Eye size={12} /> View Details
                        </Link>
                        <Link
                          href={`/admin/billing/${inv.invoice_id}/print`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Printer size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
