import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  if (role === "STAFF") {
    redirect("/staff/dashboard");
  }

  if (role === "CUSTOMER") {
    redirect("/customer/dashboard");
  }

  redirect("/unauthorized");
}
