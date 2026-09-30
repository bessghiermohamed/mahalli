"use server";

import { createClient } from "@/lib/supabase/server";
import { storeSchema } from "@/lib/validations/store";
import { sanitizeText } from "@/lib/validations/checkout";

export interface ActionError {
  error: string;
}

export async function createStoreAction(values: unknown) {
  const parsed = storeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "تحقق من البيانات المدخلة",
    } satisfies ActionError;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "انتهت الجلسة، سجّل الدخول من جديد" } satisfies ActionError;
  }

  // Friendly slug conflict check (DB unique constraint remains the authority)
  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existing) {
    return { error: "هذا الرابط مستعمل بالفعل، اختر رابطًا آخر" } satisfies ActionError;
  }

  const d = parsed.data;
  const { error } = await supabase.from("stores").insert({
    owner_id: user.id,
    name: sanitizeText(d.name),
    slug: d.slug,
    logo_url: d.logoUrl || null,
    bio: d.bio ? sanitizeText(d.bio) : null,
    whatsapp: d.whatsapp,
    instagram: d.instagram || null,
    facebook: d.facebook || null,
    default_delivery_fee: d.defaultDeliveryFee ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "هذا الرابط مستعمل بالفعل، اختر رابطًا آخر" } satisfies ActionError;
    }
    if (error.message.includes("row-level security")) {
      return {
        error: "لديك متجر بالفعل، لا يمكن إنشاء متجر آخر",
      } satisfies ActionError;
    }
    return { error: "تعذّر إنشاء المتجر، حاول مرة أخرى" } satisfies ActionError;
  }

  return { ok: true } as const;
}
