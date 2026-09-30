import { Suspense } from "react";
import { cookies } from "next/headers";
import { SuccessView } from "@/components/storefront/success-view";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "تم استلام طلبك" };

export default async function CheckoutSuccessPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10">
      <Suspense
        fallback={<div className="mx-auto h-72 max-w-lg animate-pulse rounded-xl bg-muted" aria-hidden="true" />}
      >
        <SuccessView locale={locale} />
      </Suspense>
    </div>
  );
}
