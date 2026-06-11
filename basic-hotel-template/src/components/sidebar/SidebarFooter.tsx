"use client"
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SidebarFooter({
  collapsed,
  email,
  name,
}: {
  collapsed: boolean;
  email?: string | null;
  name?: string | null;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (email?.[0]?.toUpperCase() ?? "U");

  if (collapsed) {
    return (
      <div className="shrink-0 border-t border-white/10 pt-3 pb-4 px-2 flex flex-col items-center gap-2">
        {/* Avatar */}
        <div
          title={email ?? ""}
          className="w-9 h-9 rounded-full border-2 border-gold/40 flex items-center justify-center
                     text-gold text-xs font-semibold cursor-default bg-gold/10"
        >
          {initials}
        </div>
        {/* Logout icon */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center justify-center w-9 h-9 rounded-xl
                     text-white/40 hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-white/10 pt-3 pb-4 px-3 space-y-1.5">
      {/* User card */}
      <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-white/5">
        <div
          className="w-8 h-8 rounded-full border-2 border-gold/40 flex items-center justify-center
                        text-gold text-xs font-semibold shrink-0 bg-gold/10"
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          {name && (
            <p className="text-white text-[13px] font-medium leading-tight truncate">
              {name}
            </p>
          )}
          <p className="text-white/40 text-[11px] leading-tight truncate mt-0.5">
            {email}
          </p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm
                   text-white/50 hover:text-red-400 transition-all duration-150 group"
      >
        <LogOut
          size={15}
          className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
        />
        <span>Logout</span>
      </button>
    </div>
  );
}
