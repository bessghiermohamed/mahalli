import Image from "next/image";
import Link from "next/link";
import { formatDZD, num, numOrNull } from "@/lib/utils";
import { getDict, type Locale } from "@/lib/i18n";
import type { ProductWithImages } from "@/types/database";

export function ProductCard({
  product,
  storeSlug,
  locale,
}: {
  product: ProductWithImages;
  storeSlug: string;
  locale: Locale;
}) {
  const t = getDict(locale);
  const image = product.product_images?.[0];
  const stock = numOrNull(product.stock);

  return (
    <Link
      href={`/${storeSlug}/p/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-[box-shadow,translate] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
      aria-label={product.name}
    >
      <div className="img-fallback relative aspect-square w-full overflow-hidden">
        {image ? (
          <Image
            src={image.public_url}
            alt={`صورة ${product.name}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-4xl font-extrabold text-muted-foreground/40">
            {product.name.trim().charAt(0)}
          </span>
        )}
        {stock === 0 ? (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-xs font-semibold text-white">
            {t.outOfStock}
          </span>
        ) : stock !== null && stock <= 5 ? (
          <span className="absolute start-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
            {t.lowStock(stock)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug">
          {product.name}
        </h3>
        <p className="mt-auto text-base font-extrabold text-primary">
          {formatDZD(num(product.price), locale)}
        </p>
      </div>
    </Link>
  );
}
