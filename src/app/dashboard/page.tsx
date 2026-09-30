import Link from "next/link";
import {
  ArrowLeft,
  BanknoteIcon,
  CheckCircle2,
  Package,
  PartyPopper,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDZD, formatDate, num } from "@/lib/utils";
import type { StoreStats } from "@/types/database";

export const metadata = { title: "نظرة عامة" };
export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("owner_id", (await supabase.auth.getUser()).data.user!.id)
    .maybeSingle();

  if (!store) return null; // layout guards this

  const [{ data: statsRaw, error: statsError }, { data: recentOrders }] =
    await Promise.all([
      supabase.rpc("get_store_stats", { p_store_id: store.id }),
      supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, total, status, created_at, wilaya_id, wilaya:wilayas(name_ar)"
        )
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const stats = (statsRaw as unknown as StoreStats) || null;

  return (
    <div className="space-y-6">
      {welcome ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 size-6 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-bold">متجرك جاهز!</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                متجر <span className="font-semibold text-foreground">{store.name}</span> أصبح
                على الإنترنت. الخطوة التالية: أضف منتجاتك ثم شارك رابط متجرك مع متابعيك.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href={`/${store.slug}`} target="_blank">
                  عرض متجري
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-extrabold">نظرة عامة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ملخص أداء متجرك هذا الشهر
        </p>
      </div>

      {statsError || !stats ? (
        <EmptyState
          icon={ShoppingBag}
          title="تعذّر تحميل الإحصائيات"
          description="حدث خطأ أثناء جلب بيانات المتجر. أعد تحديث الصفحة أو حاول لاحقًا."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ShoppingBag}
              label="إجمالي الطلبات"
              value={String(stats.total_orders)}
              hint={`${stats.new_orders} طلب جديد بانتظار التأكيد`}
            />
            <StatCard
              icon={BanknoteIcon}
              label="إيرادات هذا الشهر"
              value={formatDZD(num(stats.month_revenue))}
              hint={`الإجمالي: ${formatDZD(num(stats.revenue))}`}
              accent
            />
            <StatCard
              icon={CheckCircle2}
              label="طلبات تم توصيلها"
              value={String(stats.delivered)}
            />
            <StatCard
              icon={XCircle}
              label="طلبات ملغاة"
              value={String(stats.cancelled)}
            />
          </div>

          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-bold">أحدث الطلبات</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/orders">كل الطلبات</Link>
              </Button>
            </div>
            {!recentOrders || recentOrders.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Package}
                  title="لا توجد طلبات بعد"
                  description="عند وصول أول طلب ستجده هنا. شارك رابط متجرك على إنستغرام وفيسبوك للبدء."
                  action={
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/${store.slug}`}>عرض المتجر</Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطلب</TableHead>
                    <TableHead>الزبون</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o) => {
                    const wilaya = o.wilaya as { name_ar?: string } | null;
                    return (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/orders/${o.id}`}
                            className="font-mono text-xs font-semibold text-primary hover:underline"
                            dir="ltr"
                          >
                            {o.order_number}
                          </Link>
                          <span className="block text-xs text-muted-foreground lg:hidden">
                            {wilaya?.name_ar}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{o.customer_name}</span>
                          <span className="block text-xs text-muted-foreground hidden lg:block">
                            {wilaya?.name_ar}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatDZD(num(o.total))}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={o.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(o.created_at, "ar", false)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
