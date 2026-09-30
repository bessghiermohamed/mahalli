import { cookies } from "next/headers";
import { CartView } from "@/components/storefront/cart-view";
import { DEFAULT_LOCALE, getDict, isLocale, LOCALE_COOKIE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = getDict(locale);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6">
      <h2 className="mb-4 text-xl font-extrabold">{t.cart}</h2>
      <CartView storeSlug={decodedSlug} locale={locale} />
    </div>
  );
}
