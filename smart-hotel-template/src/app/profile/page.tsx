// app/(dashboard)/profile/page.tsx
// Server component — session guard + metadata

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOption";
import type { Metadata } from "next";
import ProfileClient from "@/modules/profile/ProfileClient";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your profile and account settings",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // ProfileClient fetches its own data via TanStack Query
  // Server just ensures user is authenticated
  return <ProfileClient />;
}