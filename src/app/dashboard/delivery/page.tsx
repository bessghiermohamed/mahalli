import { createClient } from "@/lib/supabase/server";
import { DeliveryTable } from "@/components/dashboard/delivery-table";
import { num } from "@/lib/utils";
import type { StoreDeliveryFee, Wilaya } from "@/types/database";

export const metadata = { title: "التوصيل" };
export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: store } = await supabase
    .from("stores")
    .select("id, default_delivery_fee")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const [{ data: wilayas }, { data: fees }] = await Promise.all([
    supabase.from("wilayas").select("*").order("code"),
    supabase.from("store_delivery_fees").select("*").eq("store_id", store!.id),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">أسعار التوصيل</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          اضبط سعر التوصيل لكل ولاية. الزبون سيرى السعر المنطبق على ولايته عند إتمام الطلب.
          اترك خانة أي ولاية فارغة لتُطبَّق السعر الافتراضي.
        </p>
      </div>
      <DeliveryTable
        wilayas={(wilayas as unknown as Wilaya[]) || []}
        fees={(fees as unknown as StoreDeliveryFee[]) || []}
        defaultFee={store!.default_delivery_fee === null ? null : num(store!.default_delivery_fee)}
      />
    </div>
  );
}
