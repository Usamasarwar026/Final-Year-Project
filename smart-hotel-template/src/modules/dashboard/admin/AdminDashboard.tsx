"use client";
import { useSession } from "next-auth/react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const user = session?.user;
  return (
    <>
      <div>Admin Dashboard</div>
      <div>{user?.name}</div>
    </>
  );
}
