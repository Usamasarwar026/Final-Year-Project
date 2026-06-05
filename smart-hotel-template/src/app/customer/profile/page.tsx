// src/app/admin/profile/page.tsx
// Server component — session check only, UI is ProfileClient

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOption";
import type { Metadata } from "next";
import ProfileClient from "@/modules/profile/ProfileClient";

export const metadata: Metadata = {
  title: "My Profile",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Same component, teeno roles ke liye
  return <ProfileClient />;
}