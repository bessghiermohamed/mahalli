"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { storeSchema } from "@/lib/validations/store";
import { productSchema, productImagesSchema } from "@/lib/validations/product";
import { accountSchema } from "@/lib/validations/account";
import { sanitizeText } from "@/lib/validations/checkout";
import { ORDER_STATUSES } from "@/lib/constants";
import { z } from "zod";
import type { OrderStatus } from "@/types/database";

export interface ActionError {
  error: string;
}

async function requireStore() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const, supabase, store: null };
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!store) return { error: "no_store" as const, supabase, store: null };
  return { error: null, supabase, store };
}

// ---------------------------------------------------------------------------
// Store settings
// ---------------------------------------------------------------------------
export async function updateStoreAction(values: unknown) {
  const ctx = await requireStore();
  if (ctx.error === "unauthorized")
    return { error: "انتهت الجلسة، سجّل الدخول من جديد" } satisfies ActionError;
  if (!ctx.store)
    return { error: "لم يتم إنشاء المتجر بعد" } satisfies ActionError;

  const parsed = storeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "تحقق من البيانات المدخلة",
    } satisfies ActionError;
  }

  // Slug conflict (excluding own store)
  if (parsed.data.slug !== ctx.store.slug) {
    const { data: existing } = await ctx.supabase
      .from("stores")
      .select("id")
      .eq("slug", parsed.data.slug)
      .neq("id", ctx.store.id)
      .maybeSingle();
    if (existing) {
      return { error: "هذا الرابط مستعمل بالفعل، اختر رابطًا آخر" } satisfies ActionError;
    }
  }

  const d = parsed.data;
  const { error } = await ctx.supabase
    .from("stores")
    .update({
      name: sanitizeText(d.name),
      slug: d.slug,
      logo_url: d.logoUrl || null,
      bio: d.bio ? sanitizeText(d.bio) : null,
      whatsapp: d.whatsapp,
      instagram: d.instagram || null,
      facebook: d.facebook || null,
    })
    .eq("id", ctx.store.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "هذا الرابط مستعمل بالفعل، اختر رابطًا آخر" } satisfies ActionError;
    }
    return { error: "تعذّر حفظ الإعدادات، حاول مرة أخرى" } satisfies ActionError;
  }

  revalidatePath("/dashboard/settings");
  revalidatePath(`/${d.slug}`);
  revalidatePath(`/${ctx.store.slug}`);
  return { ok: true } as const;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
const saveProductInput = z.object({
  id: z.uuid().optional(),
  product: productSchema,
  images: productImagesSchema,
});

export async function saveProductAction(values: unknown) {
  const ctx = await requireStore();
  if (ctx.error === "unauthorized")
    return { error: "انتهت الجلسة، سجّل الدخول من جديد" } satisfies ActionError;
  if (!ctx.store)
    return { error: "لم يتم إنشاء المتجر بعد" } satisfies ActionError;

  const parsed = saveProductInput.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "تحقق من بيانات المنتج",
    } satisfies ActionError;
  }

  const { id, product, images } = parsed.data;

  // Resolve slug: auto from name when left empty
  let slug = product.slug;
  if (!slug) {
    const { slugify } = await import("@/lib/slug");
    slug = slugify(product.name);
    if (!slug) slug = `p-${Date.now().toString(36)}`;
  }

  // Slug conflict within the same store
  const { data: existingSlug } = await ctx.supabase
    .from("products")
    .select("id")
    .eq("store_id", ctx.store.id)
    .eq("slug", slug)
    .neq(id || "", "id")
    .maybeSingle();
  if (existingSlug) {
    slug = `${slug.slice(0, 50)}-${Date.now().toString(36).slice(-4)}`;
  }

  const payload = {
    store_id: ctx.store.id,
    name: sanitizeText(product.name),
    slug,
    description: product.description ? sanitizeText(product.description) : null,
    price: product.price,
    stock: product.stock ?? null,
    active: product.active,
  };

  let productId = id;

  if (id) {
    const { error } = await ctx.supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .eq("store_id", ctx.store.id);
    if (error) return { error: "تعذّر حفظ المنتج، حاول مرة أخرى" } satisfies ActionError;
  } else {
    const { data: created, error } = await ctx.supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error || !created) {
      return { error: "تعذّر إضافة المنتج، حاول مرة أخرى" } satisfies ActionError;
    }
    productId = created.id;
  }

  // --- images diff -----------------------------------------------------------
  // Existing DB rows for this product
  const { data: existingRows } = await ctx.supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("product_id", productId!);

  const existingPaths = new Set((existingRows || []).map((r) => r.storage_path));
  const keepPaths = new Set(images.map((i) => i.storage_path));

  // Delete removed rows + their storage objects
  const removed = (existingRows || []).filter((r) => !keepPaths.has(r.storage_path));
  if (removed.length > 0) {
    await ctx.supabase
      .from("product_images")
      .delete()
      .in(
        "id",
        removed.map((r) => r.id)
      );
    await ctx.supabase.storage
      .from("product-images")
      .remove(removed.map((r) => r.storage_path));
  }

  // Insert newly uploaded images with their sort order
  const fresh = images.filter((i) => !existingPaths.has(i.storage_path));
  if (fresh.length > 0) {
    const { error: imgError } = await ctx.supabase.from("product_images").insert(
      fresh.map((i) => ({
        product_id: productId,
        storage_path: i.storage_path,
        public_url: i.public_url,
        sort_order: i.sort_order,
      }))
    );
    if (imgError) {
      return { error: "تعذّر حفظ صور المنتج" } satisfies ActionError;
    }
  }

  // Refresh sort order for kept images
  for (const img of images) {
    if (existingPaths.has(img.storage_path)) {
      await ctx.supabase
        .from("product_images")
        .update({ sort_order: img.sort_order })
        .eq("product_id", productId!)
        .eq("storage_path", img.storage_path);
    }
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/${ctx.store.slug}`);
  return { ok: true, id: productId } as const;
}

export async function deleteProductAction(productId: string) {
  const ctx = await requireStore();
  if (ctx.error === "unauthorized")
    return { error: "انتهت الجلسة، سجّل الدخول من جديد" } satisfies ActionError;
  if (!ctx.store) return { error: "لم يتم إنشاء المتجر بعد" } satisfies ActionError;

  // Fetch image paths first for storage cleanup
  const { data: rows } = await ctx.supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId);

  const { error } = await ctx.supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("store_id", ctx.store.id);

  if (error) return { error: "تعذّر حذف المنتج، حاول مرة أخرى" } satisfies ActionError;

  if (rows && rows.length > 0) {
    await ctx.supabase.storage
      .from("product-images")
      .remove(rows.map((r) => r.storage_path));
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/${ctx.store.slug}`);
  return { ok: true } as const;
}

export async function toggleProductActiveAction(productId: string, active: boolean) {
  const ctx = await requireStore();
  if (ctx.error === "unauthorized")
    return { error: "انتهت الجلسة، سجّل الدخول من جديد" } satisfies ActionError;
  if (!ctx.store) return { error: "لم يتم إنشاء المتجر بعد" } satisfies ActionError;

  const { error } = await ctx.supabase
    .from("products")
    .update({ active })
    .eq("id", productId)
    .eq("store_id", ctx.store.id);

  if (error) return { error: "تعذّر تحديث المنتج" } satisfies ActionError;

  revalidatePath("/dashboard/products");
  revalidatePath(`/${ctx.store.slug}`);
  return { ok: true } as const;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus
) {
  const ctx = await requireStore();
  if (ctx.error === "unauthorized")
    return { error: "انتهت الجلسة، سجّل الدخول من جديد" } satisfies ActionError;
  if (!ctx.store) return { error: "لم يتم إنشاء المتجر بعد" } satisfies ActionError;

  if (!ORDER_STATUSES.includes(status)) {
    return { error: "حالة غير صالحة" } satisfies ActionError;
  }

  const { error } = await ctx.supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("store_id", ctx.store.id);

  if (error) return { error: "تعذّر تحديث حالة الطلب" } satisfies ActionError;

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard");
  return { ok: true } as const;
}

// ---------------------------------------------------------------------------
// Delivery fees
// ---------------------------------------------------------------------------
const saveDeliveryInput = z.object({
  defaultDeliveryFee: z.coerce
    .number()
    .int("أدخل سعرًا صحيحًا")
    .min(0, "لا يمكن أن يكون السعر سالبًا")
    .max(10000, "السعر مرتفع جدًا")
    .nullable(),
  overrides: z.array(
    z.object({
      wilayaId: z.number().int().min(1).max(58),
      fee: z.coerce
        .number()
        .int("أدخل سعرًا صحيحًا")
        .min(0, "لا يمكن أن يكون السعر سالبًا")
        .max(10000, "السعر مرتفع جدًا")
        .nullable(), // null = remove override
    })
  ),
});

export async function saveDeliveryFeesAction(values: unknown) {
  const ctx = await requireStore();
  if (ctx.error === "unauthorized")
    return { error: "انتهت الجلسة، سجّل الدخول من جديد" } satisfies ActionError;
  if (!ctx.store) return { error: "لم يتم إنشاء المتجر بعد" } satisfies ActionError;

  const parsed = saveDeliveryInput.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "تحقق من الأسعار المدخلة",
    } satisfies ActionError;
  }

  const { defaultDeliveryFee, overrides } = parsed.data;

  const { error: storeError } = await ctx.supabase
    .from("stores")
    .update({ default_delivery_fee: defaultDeliveryFee })
    .eq("id", ctx.store.id);
  if (storeError) {
    return { error: "تعذّر حفظ سعر التوصيل الافتراضي" } satisfies ActionError;
  }

  const upserts = overrides.filter((o) => o.fee !== null);
  const removals = overrides.filter((o) => o.fee === null);

  if (upserts.length > 0) {
    const { error } = await ctx.supabase.from("store_delivery_fees").upsert(
      upserts.map((o) => ({
        store_id: ctx.store!.id,
        wilaya_id: o.wilayaId,
        fee: o.fee!,
      })),
      { onConflict: "store_id,wilaya_id" }
    );
    if (error) return { error: "تعذّر حفظ أسعار الولايات" } satisfies ActionError;
  }

  if (removals.length > 0) {
    const { error } = await ctx.supabase
      .from("store_delivery_fees")
      .delete()
      .eq("store_id", ctx.store.id)
      .in(
        "wilaya_id",
        removals.map((o) => o.wilayaId)
      );
    if (error) return { error: "تعذّر حذف بعض الأسعار المخصصة" } satisfies ActionError;
  }

  revalidatePath("/dashboard/delivery");
  revalidatePath(`/${ctx.store.slug}`);
  return { ok: true } as const;
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------
export async function updateAccountAction(values: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "انتهت الجلسة، سجّل الدخول من جديد" } satisfies ActionError;
  }

  const parsed = accountSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "تحقق من البيانات المدخلة",
    } satisfies ActionError;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: sanitizeText(parsed.data.fullName),
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) return { error: "تعذّر حفظ الحساب" } satisfies ActionError;

  revalidatePath("/dashboard/account");
  return { ok: true } as const;
}
