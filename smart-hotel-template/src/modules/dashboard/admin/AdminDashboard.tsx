"use client";
import { Button } from "@/components/button/Button";
import { signOut, useSession } from "next-auth/react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
    });
  };
  return (
    <>
      <div>Admin Dashboard</div>
      <div>{user?.name}</div>
      <Button
        onClick={handleSignOut}
        className="w-full bg-primary hover:bg-primary/90"
      >
        Sign Out
      </Button>
    </>
  );
}
