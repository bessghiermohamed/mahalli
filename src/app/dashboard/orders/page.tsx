import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ORDER_STATUSES, ORDER_STATUS_LABELS_AR } from "@/lib/constants";
import type { OrderWithRelations } from "@/types/database";

export const metadata = { title: "الطلبات" };
export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const validStatus = ORDER_STATUSES.includes(status as never) ? status : undefined;
  const search = (q || "").trim().slice(0, 60);

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, commune, subtotal, delivery_fee, total, status, created_at, wilaya_id, wilaya:wilayas(code, name_ar, name_fr), order_items(quantity, subtotal)"
    )
    .eq("store_id", store!.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (validStatus) query = query.eq("status", validStatus);
  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
    );
  }

  const { data: orders } = await query;
  const list = (orders as unknown as OrderWithRelations[]) || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">الطلبات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تابع طلبات الزبائن وأكّدها ثم أرسلها عبر واتساب
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={validStatus || "all"} className="w-full sm:w-auto">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 sm:w-auto">
            <TabsTrigger asChild value="all">
              <Link href="/dashboard/orders" className="px-3 text-xs">
                الكل
              </Link>
            </TabsTrigger>
            {ORDER_STATUSES.map((s) => (
              <TabsTrigger key={s} asChild value={s}>
                <Link
                  href={`/dashboard/orders?status=${s}`}
                  className="px-3 text-xs"
                >
                  {ORDER_STATUS_LABELS_AR[s]}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <form action="/dashboard/orders" className="relative w-full sm:w-64">
          {validStatus ? <input type="hidden" name="status" value={validStatus} /> : null}
          <Search
            className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="q"
            defaultValue={search}
            placeholder="ابحث برقم الطلب أو الاسم أو الهاتف"
            className="pe-9 text-sm"
            aria-label="البحث في الطلبات"
          />
        </form>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={search || validStatus ? "لا توجد نتائج" : "لا توجد طلبات بعد"}
          description={
            search || validStatus
              ? "جرّب تغيير كلمة البحث أو تصفية الحالة."
              : "شارك رابط متجرك على إنستغرام وفيسبوك لتبدأ الطلبات بالوصول."
          }
        />
      ) : (
        <OrdersTable orders={list} />
      )}
    </div>
  );
}
