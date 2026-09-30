import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const metadata = { title: "إنشاء متجرك" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  // Already onboarded → straight to the dashboard
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (store) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold sm:text-3xl">مرحبًا بك في محلي</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          أكمل المعلومات التالية وسيتجه متجرك في أقل من دقيقتين — يمكنك تعديل
          كل شيء لاحقًا.
        </p>
      </header>
      <OnboardingForm initialFullName={profile?.full_name || undefined} />
    </div>
  );
}
