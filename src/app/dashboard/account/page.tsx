import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "@/components/dashboard/account-form";

export const metadata = { title: "حسابي" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">حسابي</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          بيانات حسابك الشخصي (تظهر فقط لك، لا تُنشر في متجرك)
        </p>
      </div>
      <AccountForm
        email={user.email || ""}
        initial={{
          fullName: profile?.full_name || "",
          avatarUrl: profile?.avatar_url || "",
        }}
      />
    </div>
  );
}
