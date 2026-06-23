import DashboardShell from "@/components/layout/DashboardShell";
// {{#if kitchen}}
import { CartProvider } from "@/context/CartContext";
// {{/if}}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // {{#if kitchen}}
    <CartProvider>
      {/* {{/if}} */}
      <DashboardShell>{children}</DashboardShell>
      {/* {{#if kitchen}} */}
    </CartProvider>
    // {{/if}}
  );
}
