import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { DEFAULT_LOCALE, getDict, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { numOrNull, num } from "@/lib/utils";
import type { Store, StoreDeliveryFee, Wilaya } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const supabase = await createClient();

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = getDict(locale);

  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, default_delivery_fee")
    .eq("slug", decodedSlug)
    .maybeSingle();
  if (!store) notFound();
  const s = store as unknown as Store;

  const { data: wilayas } = await supabase.from("wilayas").select("*").order("code");
  const { data: fees } = await supabase
    .from("store_delivery_fees")
    .select("wilaya_id, fee")
    .eq("store_id", s.id);

  const overrides: Record<number, number> = {};
  for (const f of (fees as unknown as StoreDeliveryFee[]) || []) {
    overrides[f.wilaya_id] = num(f.fee);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6">
      <h2 className="mb-4 text-xl font-extrabold">{t.checkout}</h2>
      <CheckoutForm
        wilayas={(wilayas as unknown as Wilaya[]) || []}
        feeData={{
          storeSlug: decodedSlug,
          storeDefaultFee:
            s.default_delivery_fee === null ? null : num(s.default_delivery_fee),
          overrides,
        }}
        locale={locale}
      />
    </div>
  );
}
