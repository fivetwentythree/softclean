import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { LogoutButton } from "@/components/logout-button";
import type { Database } from "@/lib/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-40 bg-white border-b border-[#EBEBEB]">
        <div className="flex items-center justify-between px-6 py-3 max-w-lg mx-auto">
          <span className="text-base font-bold text-[#222222] tracking-tight">
            SoftClean
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#222222]">
              {profile?.full_name}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#F7F7F7] flex items-center justify-center">
              <span className="text-xs font-semibold text-[#222222]">
                {initials}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav role={profile?.role ?? "cleaner"} />
    </div>
  );
}
