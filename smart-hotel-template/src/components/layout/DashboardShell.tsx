// components/layout/DashboardShell.tsx
import Sidebar from "../sidebar/Sidebar";
import Topbar from "../topbar/Topbar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        {/*
          pt-16 on mobile so content clears the fixed hamburger button.
          lg:pt-0 removes it on desktop where hamburger is hidden.
        */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 pt-16 lg:pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}