import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, MessageCircle, Store as StoreIcon } from "lucide-react";
import type { Store } from "@/types/database";
import { formatPhoneIntl } from "@/lib/phone";
import { waLink } from "@/lib/whatsapp";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/storefront/locale-toggle";
import { ShareButton } from "@/components/storefront/share-button";
import { CartBadge } from "@/components/storefront/cart-badge";
import { getDict, type Locale } from "@/lib/i18n";

export function StoreHeader({
  store,
  locale,
  storeUrl,
}: {
  store: Store;
  locale: Locale;
  storeUrl: string;
}) {
  const t = getDict(locale);

  return (
    <header className="border-b bg-card">
      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="img-fallback relative size-16 shrink-0 overflow-hidden rounded-xl sm:size-20">
              {store.logo_url ? (
                <Image
                  src={store.logo_url}
                  alt={`شعار ${store.name}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  priority
                />
              ) : (
                <span className="flex size-full items-center justify-center text-2xl font-extrabold text-muted-foreground">
                  {store.name.trim().charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold sm:text-xl">{store.name}</h1>
              {store.bio ? (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {store.bio}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <LocaleToggle current={locale} />
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ShareButton url={storeUrl} title={store.name} label={t.share} />

          {store.whatsapp ? (
            <a
              href={waLink(store.whatsapp, "")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
              aria-label={`مراسلة المتجر على واتساب ${formatPhoneIntl(store.whatsapp)}`}
            >
              <MessageCircle className="size-4 text-[#25D366]" aria-hidden="true" />
              <span dir="ltr">{formatPhoneIntl(store.whatsapp)}</span>
            </a>
          ) : null}

          {store.instagram ? (
            <a
              href={store.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="حساب الإنستغرام"
            >
              <Instagram className="size-4" aria-hidden="true" />
            </a>
          ) : null}
          {store.facebook ? (
            <a
              href={store.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="صفحة الفيسبوك"
            >
              <Facebook className="size-4" aria-hidden="true" />
            </a>
          ) : null}

          <div className="ms-auto">
            <CartBadge storeSlug={store.slug} locale={locale} />
          </div>
        </div>
      </div>
    </header>
  );
}

export function StoreFooter({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <footer className="mt-auto border-t py-5">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center gap-1.5 px-4 text-sm text-muted-foreground">
        <StoreIcon className="size-3.5" aria-hidden="true" />
        <span>
          {t.footerMade.split("Mahalli")[0]}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Mahalli
          </Link>
          {t.footerMade.split("Mahalli")[1]}
        </span>
      </div>
    </footer>
  );
}
