import {
  BanknoteIcon,
  CheckCircle2,
  Package,
  ShoppingBag,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDZD, num } from "@/lib/utils";
import type { StoreStats } from "@/types/database";

export const metadata = { title: "الإحصائيات" };
export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const { data: statsRaw, error } = await supabase.rpc("get_store_stats", {
    p_store_id: store!.id,
  });
  const stats = (statsRaw as unknown as StoreStats) || null;

  if (error || !stats) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold">الإحصائيات</h1>
        <EmptyState
          icon={TrendingUp}
          title="تعذّر تحميل الإحصائيات"
          description="حدث خطأ أثناء جلب بيانات المتجر. أعد تحديث الصفحة أو حاول لاحقًا."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">الإحصائيات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أرقام متجرك حتى اليوم. الطلبات الملغاة لا تُحسب ضمن الإيرادات.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={ShoppingBag}
          label="إجمالي الطلبات"
          value={String(stats.total_orders)}
          hint={`${stats.month_orders} طلب هذا الشهر`}
        />
        <StatCard
          icon={BanknoteIcon}
          label="الإيرادات الإجمالية"
          value={formatDZD(num(stats.revenue))}
          accent
        />
        <StatCard
          icon={BanknoteIcon}
          label="إيرادات هذا الشهر"
          value={formatDZD(num(stats.month_revenue))}
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
        <StatCard
          icon={Package}
          label="طلبات جديدة بانتظار التأكيد"
          value={String(stats.new_orders)}
        />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-bold">المنتجات الأكثر مبيعًا</h2>
          <p className="text-xs text-muted-foreground">
            حسب عدد القطع المبيعة (بدون الطلبات الملغاة)
          </p>
        </div>
        {stats.top_products.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            لا توجد مبيعات بعد — أول طلب سيثبّت المنتجات الأكثر رواجًا هنا.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>المنتج</TableHead>
                <TableHead>الكمية المبيعة</TableHead>
                <TableHead className="text-end">الإيراد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.top_products.map((p, i) => (
                <TableRow key={p.name}>
                  <TableCell className="w-8 font-bold text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.qty} قطعة</TableCell>
                  <TableCell className="text-end font-semibold">
                    {formatDZD(num(p.revenue))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
