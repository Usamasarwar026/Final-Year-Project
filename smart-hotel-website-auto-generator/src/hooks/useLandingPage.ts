"use client";
import { Download, Package, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function useLandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const features = [
    {
      icon: Package,
      title: "Prebuilt Modules",
      description: "Choose from rooms, booking, services, gallery, and more.",
    },
    {
      icon: Zap,
      title: "Instant Generation",
      description:
        "Get a complete hotel website with frontend & backend in seconds.",
    },
    {
      icon: Download,
      title: "Download & Deploy",
      description: "Download your project as a ZIP and deploy anywhere.",
    },
  ];
  return { router, user, features };
}
