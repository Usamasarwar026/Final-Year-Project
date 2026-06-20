// providers/provider.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthProvider from "./authProvider";
import { useState } from "react";
import { Session } from "next-auth";

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider session={session}>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
