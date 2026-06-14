import DashboardShell from "@/components/layout/DashboardShell";
import { CartProvider } from "@/context/CartContext";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <DashboardShell>{children}</DashboardShell>
    </CartProvider>
  );
}
