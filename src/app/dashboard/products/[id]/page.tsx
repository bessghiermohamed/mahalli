import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/dashboard/product-form";
import { Button } from "@/components/ui/button";
import { num, numOrNull } from "@/lib/utils";
import type { ProductWithImages } from "@/types/database";

export const metadata = { title: "تعديل المنتج" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user!.id)
    .maybeSingle();

  // RLS restricts to the seller's own products (active or not)
  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", id)
    .eq("store_id", store!.id)
    .maybeSingle();

  if (!product) notFound();

  const p = product as unknown as ProductWithImages;

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ms-2 mb-2 text-muted-foreground">
          <Link href="/dashboard/products">
            <ArrowRight className="size-4" aria-hidden="true" />
            رجوع إلى المنتجات
          </Link>
        </Button>
        <h1 className="text-2xl font-extrabold">تعديل المنتج</h1>
        <p className="mt-1 text-sm text-muted-foreground">{p.name}</p>
      </div>
      <ProductForm
        productId={p.id}
        defaultValues={{
          name: p.name,
          slug: p.slug,
          description: p.description || "",
          price: num(p.price),
          stock: numOrNull(p.stock) ?? undefined,
          active: p.active,
        }}
        initialImages={p.product_images.map((img) => ({
          id: img.id,
          storage_path: img.storage_path,
          public_url: img.public_url,
          sort_order: img.sort_order,
        }))}
      />
    </div>
  );
}
