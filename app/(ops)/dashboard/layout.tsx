import Link from "next/link";
import { redirect } from "next/navigation";
import { createStaffClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createStaffClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Confirm the user is an active staff member (defence in depth alongside RLS).
  const { data: staff } = await supabase
    .from("staff_users")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!staff?.active) {
    return (
      <div className="mx-auto max-w-lg p-10 text-center text-slate-600">
        Your account is not authorised for the operations dashboard. Contact an
        admin.
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-brand-dark">EaseMyOffice</span>
            <span className="text-sm text-slate-400">Operations · KYC</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              Cases
            </Link>
            <span className="text-slate-400">{user.email}</span>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
