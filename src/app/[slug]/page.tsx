import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { PackageSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DEFAULT_LOCALE, getDict, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import type { ProductWithImages, Store } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StorefrontPage({
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
    .select("id")
    .eq("slug", decodedSlug)
    .maybeSingle();
  if (!store) notFound();

  // RLS allows public reads of active products only
  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("store_id", (store as unknown as Store).id)
    .eq("active", true)
    .order("created_at", { ascending: false });

  const list = (products as unknown as ProductWithImages[]) || [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-extrabold">{t.products}</h2>
        <span className="text-sm text-muted-foreground">{t.productsCount(list.length)}</span>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={locale === "ar" ? "لا توجد منتجات متوفرة حاليًا" : "Aucun produit pour le moment"}
          description={
            locale === "ar"
              ? "يتوسع المتجر قريبًا، تابعنا للاطلاع على الجديد."
              : "De nouveaux produits arrivent bientôt."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} storeSlug={decodedSlug} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
