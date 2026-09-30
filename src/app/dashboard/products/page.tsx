import Link from "next/link";
import { Pencil, Plus, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductsTable } from "@/components/dashboard/products-table";
import { Button } from "@/components/ui/button";
import type { ProductWithImages } from "@/types/database";

export const metadata = { title: "المنتجات" };
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("store_id", store!.id)
    .order("created_at", { ascending: false });

  const list = (products as unknown as ProductWithImages[]) || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">المنتجات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف منتجاتك وتحكم في ظهورها داخل متجرك
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="size-4" aria-hidden="true" />
            منتج جديد
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Package}
          title="لا توجد منتجات بعد"
          description="أضف أول منتج لمتجرك: صورة واضحة، اسم واضح، وسعر بالدينار. منتج واحد يكفي للبدء."
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/products/new">إضافة أول منتج</Link>
            </Button>
          }
        />
      ) : (
        <ProductsTable products={list} />
      )}
    </div>
  );
}
