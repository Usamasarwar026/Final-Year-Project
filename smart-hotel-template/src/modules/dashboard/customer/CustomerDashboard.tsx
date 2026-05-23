"use client";
import { Button } from "@/components/button/Button";
import { signOut, useSession } from "next-auth/react";

export default function CustomerDashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
    });
  };
  return (
    <>
      <div>Cutomer Dashboard</div>
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
