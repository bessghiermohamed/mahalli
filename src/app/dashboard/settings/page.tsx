import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";
import { formatPhoneIntl } from "@/lib/phone";

export const metadata = { title: "إعدادات المتجر" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user!.id)
    .maybeSingle();

  if (!store) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">إعدادات المتجر</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            كل ما يظهر للزبائن في صفحة متجرك
          </p>
        </div>
        <a
          href={`/${store.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          عرض المتجر
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>

      <StoreSettingsForm
        initial={{
          name: store.name,
          slug: store.slug,
          bio: store.bio || "",
          whatsapp: formatPhoneIntl(store.whatsapp),
          instagram: store.instagram || "",
          facebook: store.facebook || "",
          logoUrl: store.logo_url || "",
        }}
      />
    </div>
  );
}
