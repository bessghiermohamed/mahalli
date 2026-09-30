import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CartProvider } from "@/components/storefront/cart-provider";
import { StoreHeader, StoreFooter } from "@/components/storefront/store-header";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/constants";
import { storeUrl } from "@/lib/utils";
import type { Store } from "@/types/database";

export const dynamic = "force-dynamic";

async function getStore(slug: string): Promise<Store | null> {
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", decodeURIComponent(slug))
    .maybeSingle();
  return (store as unknown as Store) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);

  if (!store) {
    return { title: "المتجر غير موجود" };
  }

  const title = `${store.name} — متجر إلكتروني`;
  const description =
    store.bio ||
    `تسوّق من متجر ${store.name} على ${SITE_NAME}: منتجات أصلية، أسعار بالدينار، والدفع عند الاستلام مع التوصيل إلى جميع ولايات الجزائر.`;
  const url = storeUrl(store.slug);
  const ogImage = store.logo_url || undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      ...(ogImage ? { images: [{ url: ogImage, width: 512, height: 512, alt: store.name }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) notFound();

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const dir = locale === "fr" ? "ltr" : "rtl";

  return (
    <CartProvider storeSlug={store.slug}>
      <div dir={dir} className="flex min-h-screen flex-col bg-background">
        <StoreHeader store={store} locale={locale} storeUrl={storeUrl(store.slug)} />
        <main className="flex-1 pb-16">{children}</main>
        <StoreFooter locale={locale} />
      </div>
    </CartProvider>
  );
}
