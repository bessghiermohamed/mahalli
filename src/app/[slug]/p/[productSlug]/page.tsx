import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductGallery, AddToCart } from "@/components/storefront/product-detail";
import { DEFAULT_LOCALE, getDict, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/constants";
import { formatDZD, num, numOrNull, storeUrl } from "@/lib/utils";
import type { Product, ProductWithImages, Store } from "@/types/database";

export const dynamic = "force-dynamic";

async function getData(slug: string, productSlug: string) {
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", decodeURIComponent(slug))
    .maybeSingle();
  if (!store) return { store: null, product: null };

  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("store_id", (store as unknown as Store).id)
    .eq("slug", decodeURIComponent(productSlug))
    .eq("active", true)
    .maybeSingle();

  return {
    store: store as unknown as Store,
    product: (product as unknown as ProductWithImages) || null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const { store, product } = await getData(slug, productSlug);

  if (!store || !product) return { title: "المنتج غير موجود" };

  const title = product.name;
  const description =
    (product.description || "").slice(0, 160) ||
    `اشترِ ${product.name} من متجر ${store.name} بسعر ${formatDZD(num(product.price))} مع الدفع عند الاستلام.`;
  const url = storeUrl(store.slug, `p/${product.slug}`);
  const image = product.product_images?.[0]?.public_url;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — ${store.name}`,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${title} — ${store.name}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { store, product } = await getData(decodedSlug, productSlug);

  if (!store || !product) notFound();

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = getDict(locale);

  const p = product as unknown as Product & { product_images: never[] };
  const stock = numOrNull(p.stock);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4">
      <nav aria-label="مسار التنقل" className="mb-4">
        <Link
          href={`/${decodedSlug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4 flip-x" aria-hidden="true" />
          {t.browseProducts}
        </Link>
      </nav>

      <div className="grid gap-6 sm:grid-cols-2">
        <ProductGallery images={p.product_images} productName={p.name} />

        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-extrabold leading-snug sm:text-2xl">{p.name}</h1>
            <p className="mt-2 text-2xl font-extrabold text-primary">
              {formatDZD(num(p.price), locale)}
            </p>
            <p className="mt-1 text-xs font-medium" aria-live="polite">
              {stock === null ? (
                <span className="text-emerald-600 dark:text-emerald-400">{t.untrackedStock}</span>
              ) : stock === 0 ? (
                <span className="text-destructive">{t.outOfStock}</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">{t.inStock}</span>
              )}
            </p>
          </div>

          <AddToCart product={p} storeSlug={decodedSlug} locale={locale} />

          {p.description ? (
            <div className="rounded-xl border bg-card p-4">
              <h2 className="mb-1.5 text-sm font-bold">{t.description}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </div>
          ) : null}

          <p className="text-xs leading-relaxed text-muted-foreground">{t.codNotice}</p>
        </div>
      </div>
    </div>
  );
}
