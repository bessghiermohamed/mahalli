"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { saveDeliveryFeesAction } from "@/app/actions/dashboard";
import { formatDZD, num } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { StoreDeliveryFee, Wilaya } from "@/types/database";

export function DeliveryTable({
  wilayas,
  fees,
  defaultFee,
}: {
  wilayas: Wilaya[];
  fees: StoreDeliveryFee[];
  defaultFee: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [defaultInput, setDefaultInput] = useState<string>(
    defaultFee === null ? "" : String(defaultFee)
  );
  const [overrides, setOverrides] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const f of fees) map[f.wilaya_id] = String(num(f.fee));
    return map;
  });
  const [search, setSearch] = useState("");

  const effectiveFee = useMemo(
    () => (w: Wilaya) => {
      const override = overrides[w.code];
      if (override !== undefined && override !== "") return Number(override);
      if (defaultInput !== "") return Number(defaultInput);
      return num(w.default_delivery_fee);
    },
    [overrides, defaultInput]
  );

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return wilayas;
    return wilayas.filter(
      (w) => w.name_ar.includes(q) || w.name_fr.toLowerCase().includes(q.toLowerCase()) || String(w.code) === q
    );
  }, [wilayas, search]);

  function onOverrideChange(code: number, value: string) {
    setOverrides((prev) => {
      const next = { ...prev };
      if (value === "") delete next[code];
      else next[code] = value;
      return next;
    });
  }

  function onReset(code: number) {
    onOverrideChange(code, "");
  }

  function onSave() {
    startTransition(async () => {
      const overridesPayload = Object.entries(overrides)
        .map(([code, value]) => ({
          wilayaId: Number(code),
          fee: value === "" ? null : Number(value),
        }))
        .filter((o) => o.fee === null || Number.isFinite(o.fee));

      const invalid = overridesPayload.find(
        (o) => o.fee !== null && (!Number.isFinite(o.fee) || o.fee < 0 || !Number.isInteger(o.fee))
      );
      if (invalid) {
        toast.error("أدخل أسعارًا صحيحة (أرقام موجبة بدون كسور)");
        return;
      }
      if (defaultInput !== "" && (!Number.isInteger(Number(defaultInput)) || Number(defaultInput) < 0)) {
        toast.error("أدخل سعرًا افتراضيًا صحيحًا");
        return;
      }

      const result = await saveDeliveryFeesAction({
        defaultDeliveryFee: defaultInput === "" ? null : Number(defaultInput),
        overrides: overridesPayload,
      });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حفظ أسعار التوصيل");
      router.refresh();
    });
  }

  const dirty = useMemo(() => {
    const feeMap = new Map(fees.map((f) => [f.wilaya_id, num(f.fee)]));
    const defaultDirty =
      (defaultFee === null ? "" : String(defaultFee)) !== defaultInput;
    const overrideDirty = wilayas.some((w) => {
      const current = overrides[w.code];
      const saved = feeMap.get(w.id);
      return (current === undefined ? "" : current) !== (saved === undefined ? "" : String(saved));
    });
    return defaultDirty || overrideDirty;
  }, [fees, wilayas, overrides, defaultInput, defaultFee]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="default-fee" className="text-sm font-medium">
              سعر التوصيل الافتراضي (دينار)
            </label>
            <p className="text-xs text-muted-foreground">
              يُطبَّق على جميع الولايات التي لم تحدد لها سعرًا خاصًا. اتركه فارغًا لاستعمال
              الأسعار الافتراضية للمنصة.
            </p>
            <Input
              id="default-fee"
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              dir="ltr"
              className="w-40 text-start"
              value={defaultInput}
              onChange={(e) => setDefaultInput(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن ولاية..."
              className="w-full sm:w-48"
              aria-label="البحث عن ولاية"
            />
            <Button onClick={onSave} disabled={isPending || !dirty}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              حفظ
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="thin-scroll max-h-[32rem] overflow-y-auto" role="region" aria-label="جدول أسعار الولايات">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b text-start text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-2.5 text-start font-medium">الولاية</th>
                  <th scope="col" className="px-4 py-2.5 text-start font-medium">سعر خاص (دج)</th>
                  <th scope="col" className="px-4 py-2.5 text-start font-medium">السعر المطبَّق</th>
                  <th scope="col" className="px-4 py-2.5" aria-label="إعادة تعيين" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.code} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="font-medium">{w.name_ar}</span>
                      <span className="ms-2 text-xs text-muted-foreground" dir="ltr">
                        {w.name_fr}
                      </span>
                      <span className="ms-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {String(w.code).padStart(2, "0")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        dir="ltr"
                        className="h-8 w-24 text-start"
                        value={overrides[w.code] ?? ""}
                        onChange={(e) => onOverrideChange(w.code, e.target.value)}
                        placeholder="افتراضي"
                        aria-label={`سعر خاص لولاية ${w.name_ar}`}
                      />
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-primary">
                      {formatDZD(effectiveFee(w))}
                    </td>
                    <td className="px-4 py-2.5">
                      {overrides[w.code] !== undefined ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground"
                          onClick={() => onReset(w.code)}
                          aria-label={`إزالة السعر الخاص لولاية ${w.name_ar}`}
                        >
                          <RotateCcw className="size-3.5" aria-hidden="true" />
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
