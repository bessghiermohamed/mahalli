# Mahalli — محلي

منصة **Mahalli (محلي)** لإنشاء المتاجر الإلكترونية الصغيرة: منصة عربية أولًا موجّهة للبائعين الجزائريين الصغار والبائعين على إنستغرام وفيسبوك.

**الفكرة:** أن يستطيع البائع الانتقال من التسجيل إلى متجر إلكتروني عامل خلال دقائق وبدون أي خبرة تقنية.

```
رابط كل متجر: mahalli.app/[slug]
مثال:         mahalli.app/flower-shop
```

---

## 1. ما هي Mahalli؟

Mahalli منصة «ميني-ستور» (mini-store builder): كل بائع ينشئ واجهة متجر عامة تحتوي الشعار، اسم المتجر، نبذة، روابط واتساب وإنستغرام وفيسبوك، كتالوج منتجات، سلة تسوق، وطلب بالدفع عند الاستلام (COD) بدون أي دفع إلكتروني. جميع الأسعار بالدينار الجزائري (DZD).

رحلتا الاستخدام الأساسيتان:

- **البائع:** تسجيل → إنشاء متجر → إضافة منتج → مشاركة الرابط → استقبال الطلبات.
- **الزبون:** فتح الرابط → اختيار منتج → إضافة للسلة → إدخال الهاتف والعنوان → تأكيد الطلب (بدون حساب).

## 2. الميزات

- واجهة متجر عامة سريعة على `/[slug]` مع دعم RTL كامل ووضع ليلي/نهاري
- لوحة تحكم عربية: نظرة عامة، منتجات، طلبات، توصيل، إحصائيات، إعدادات، حساب
- إدارة منتجات كاملة: صور متعددة (ضغط تلقائي قبل الرفع)، مخزون، تفعيل/إخفاء، أسعار DZD
- سلة تسوق محفوظة محليًا لكل متجر (localStorage)
- طلب بالدفع عند الاستلام: اسم، هاتف جزائري (مع تحقق وتوحيد الصيغة)، الـ58 ولاية، بلدية، عنوان، ملاحظات
- رسالة واتساب جاهزة لكل طلب: رقم الطلب، المنتجات، الكميات، الإجمالي، العنوان
- أسعار توصيل لكل ولاية (تجاوز لكل متجر + سعر افتراضي + سعر افتراضي لكل ولاية)
- إحصائيات: إجمالي الطلبات، طلبات وإيرادات الشهر، المنتجات الأكثر مبيعًا (الطلبات الملغاة لا تُحسب كإيراد)
- SEO ديناميكي: عنوان ووصف وصورة OpenGraph ورابط canonical لكل متجر ومنتج
- مصادقة: بريد/كلمة مرور، Google OAuth، استعادة كلمة المرور، جلسات آمنة بكوكيز SSR

## 3. التقنيات المستخدمة

| الطبقة | التقنية |
|---|---|
| الإطار | Next.js 16 (App Router) + TypeScript |
| الواجهة | Tailwind CSS 4 + shadcn/ui + خط Cairo + next-themes |
| قاعدة البيانات | Supabase (PostgreSQL + RLS) |
| المصادقة | Supabase Auth عبر `@supabase/ssr` (جلسات كوكيز SSR) |
| التخزين | Supabase Storage (شعارات، صور منتجات، صور حسابات) |
| التحقق | Zod + React Hook Form |
| الاختبارات | Vitest |
| النشر | Vercel |

قاعدة عامة: **Server Components افتراضيًا**، و`use client` فقط حيث تتطلب التفاعلية.

## 4. المتطلبات

- Node.js 20+ أو Bun 1.1+
- مشروع Supabase مجاني
- حساب Vercel للنشر (اختياري)

## 5. التشغيل المحلي

```bash
# 1) تثبيت الحزم
bun install          # أو: npm install

# 2) إعداد متغيرات البيئة
cp .env.example .env.local
# ثم عدّل القيم (انظر القسم 7)

# 3) تشغيل خادم التطوير
bun run dev          # أو: npm run dev
# http://localhost:3000
```

## 6. إعداد Supabase

1. أنشئ مشروعًا جديدًا على [supabase.com](https://supabase.com).
2. من **Project Settings → API** خذ: `Project URL` و`Publishable (anon) key`.
3. فعّل مزود **Google** من `Authentication → Providers` (ضع Client ID وSecret من Google Cloud Console).
4. من `Authentication → URL Configuration` أضف:
   - `Site URL`: `http://localhost:3000` (وأضِف دومين الإنتاج لاحقًا)
   - `Redirect URLs`: `http://localhost:3000/**` و `https://your-domain.com/**`
5. (اختياري للتجربة) أوقف تأكيد البريد من `Authentication → Providers → Email → Confirm email` لتجربة التسجيل فورًا، أو اتركه مفعّلًا وسيظهر للبائع شاشة «فعّل بريدك».

## 7. متغيرات البيئة

| المتغير | الوصف |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | المفتاح العام (publishable/anon) — آمن في المتصفح |
| `NEXT_PUBLIC_SITE_URL` | الرابط العام للموقع (يُستعمل لـ SEO وcanonical وsitemap) |

> ⚠️ **تنبيه أمني:** لا تضع أبدًا مفتاح `service_role` أو `secret key` في أي متغير يبدأ بـ `NEXT_PUBLIC_`، لأنه سيُحزم داخل JavaScript المتصفح. القيم الحالية في `.env.local` خاصة بالتطوير فقط — استبدل المفتاح بمفتاحك العام قبل النشر.

## 8. ترحيلات قاعدة البيانات

ملفات SQL جاهزة في `supabase/`:

```
supabase/migrations/0001_init.sql   # الجداول + الفهارس + RLS + دوال create_order/get_store_stats + Storage buckets
supabase/seed/0002_seed.sql         # 58 ولاية + بائع ومتجر تجريبي + 6 منتجات واقعية
```

**طريقة التطبيق (اختر واحدة):**

- **Supabase CLI (موصى بها):**
  ```bash
  supabase link --project-ref YOUR_PROJECT_REF
  supabase db push
  ```
  ثم شغّل ملف الـ seed من SQL Editor أو:
  ```bash
  psql "YOUR_DB_URL" -f supabase/seed/0002_seed.sql
  ```
- **يدويًا:** افتح `SQL Editor` في لوحة Supabase، الصق محتوى `0001_init.sql` كاملًا وشغّله، ثم الصق محتوى `0002_seed.sql` وشغّله.

**ما تنشئه الترحيلات:** الجداول `profiles, stores, wilayas, store_delivery_fees, products, product_images, orders, order_items` + فهارس + مشغّلات `updated_at` + إنشاء Profile تلقائيًا عند التسجيل + سياسات **RLS** على كل جدول + دالة ذرّية `create_order` (تحسب الأسعار والمخزون داخل قاعدة البيانات) + دالة `get_store_stats` + Buckets للتخزين مع سياسات ملكية.

## 9. البيانات التجريبية

بعد تشغيل `0002_seed.sql` ستجد:

- **بائع تجريبي:** `seller@mahalli.app` / كلمة المرور `Mahalli123!`
- **متجر تجريبي:** `متجر الزهور` على الرابط `/flower-shop` مع 6 منتجات عربية واقعية بأسعار DZD وصور SVG تجريبية مرفقة مع التطبيق (`/public/demo`)
- **تجاوزات أسعار توصيل** للجزائر (400 دج) والبليدة (450 دج) كمثال

## 10. التطوير

```
src/
  app/                # صفحات App Router
    (auth)/           # login / signup / forgot-password / reset-password
    auth/             # callback + confirm (تبادل كود المصادقة)
    onboarding/       # إنشاء المتجر بعد التسجيل
    dashboard/        # لوحة البائع (محمية)
    [slug]/           # الواجهة العامة للمتجر (كتالوج/منتج/سلة/دفع)
    api/orders/       # نقطة إنشاء الطلبات (تحقق + rate limit + RPC)
    actions/          # Server Actions (auth, onboarding, dashboard)
  components/
    ui/               # shadcn/ui
    storefront/       # مكونات المتجر العام
    dashboard/        # مكونات لوحة التحكم
    auth/             # نماذج المصادقة
    shared/           # مكونات مشتركة
  lib/
    supabase/         # عملاء SSR (server / browser / proxy)
    validations/      # مخططات Zod
    phone.ts slug.ts whatsapp.ts i18n.ts rate-limit.ts delivery.ts ...
  types/              # أنواع قاعدة البيانات
supabase/
  migrations/         # SQL
  seed/               # بيانات أولية
```

الطلبات الجديدة تُنشأ **حصريًا** عبر دالة `create_order` داخل قاعدة البيانات (SECURITY DEFINER) — لا يوجد سياسة INSERT للعامة على جدول `orders`، ما يمنع تزوير الأسعار أو الحقول حتى لو استُعمل Data API مباشرة.

## 11. الاختبارات

```bash
bun run test         # vitest run (56 اختبار)
bun run typecheck    # tsc --noEmit
bun run lint         # eslint
```

تغطي الاختبارات: توحيد أرقام الهاتف الجزائرية، قواعد الـ slug والروابط المحجوزة، تنسيق DZD، أولوية أسعار التوصيل، رسالة واتساب، مخططات التحقق (سلة/متجر/منتج)، الـ rate limiter، وواجهة `/api/orders` كاملة مع Supabase مُحاكى (mock).

## 12. بناء الإنتاج

```bash
bun run build        # next build (standalone)
bun run start        # تشغيل نسخة الإنتاج محليًا
```

## 13. النشر على Vercel

1. ارفع المستودع إلى GitHub (رابط المستودع أدناه إن لم ترفعه أنت).
2. على [vercel.com](https://vercel.com): **Add New → Project → Import** مستودع `mahalli`.
3. أضف متغيرات البيئة الثلاثة (القسم 7) بقيم الإنتاج:
   - `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` من لوحة Supabase
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app`
4. أعد تطبيق الترحيلات والـ seed على مشروع Supabase إذا لم تكن مطبقة (القسمان 8 و9).
5. أضف دومين Vercel إلى `Redirect URLs` في إعدادات المصادقة بـ Supabase.
6. اضغط **Deploy**، ثم اختبر رحلة كاملة: تسجيل → إنشاء متجر → منتج → طلب COD → الطلب في اللوحة → رسالة واتساب.

### خطوات ما بقي يتطلب بياناتك (تعذّر تنفيذها آليًا من بيئة التطوير)

- **تشغيل الترحيلات:** مفاتيح Supabase المتوفرة هي مفاتيح Data API فقط (`secret key`/`service_role`) ولا تصلح لتنفيذ DDL عن بُعد (واجهة الإدارة Management API تتطلب Personal Access Token بصيغة `sbp_…`). طبّق `0001_init.sql` و`0002_seed.sql` من SQL Editor كما في القسم 8.
- **مشروع Supabase نفسه:** اختبار DNS العام (2026-10-01) أظهر أن `ntdzvujhujnbazaqzuv.supabase.co` غير موجود إطلاقًا (NXDOMAIN) بينما النطاق الأصل `supabase.co` يعمل — أي أن المشروع إما موقوف مؤقتًا (paused) أو محذوف أو لم يكتمل إنشاؤه. استعده/أنشئه من لوحة Supabase ثم طبّق الترحيلات واستخرج `URL` و`publishable key` الجديدين.
- **استبدال مفتاح `.env.local`:** المفتاح الحالي في `.env.local` سرّي وليس publishable — أنشئ/استعمل المفتاح العام في بيئة الإنتاج.
- **النشر على Vercel:** التوكن المتاح (البادئة `vcp_…`) اختُبر برمجيًا ضد `api.vercel.com` وأعاد `403 invalidToken` — فهو ليس توكن Vercel صالحًا. اربط حسابك على Vercel واستورد المستودع، أو أنشئ توكنًا من [vercel.com/account/tokens](https://vercel.com/account/tokens).

## 14. تكامل شركات التوصيل مستقبلًا

التصميم مهيأ مسبقًا:

- جدول `store_delivery_fees` يفصل منطق الأسعار عن المتاجر، ودالة `resolveDeliveryFee` في `src/lib/delivery.ts` تُوحّد أولوية الأسعار (تجاوز الولاية → افتراضي المتجر → افتراضي الولاية).
- بنية `wilayas` مرجعية بالكود الرسمي (1–58) بأسماء عربية وفرنسية.
- المسار المقترح: إضافة جدول `delivery_providers` + `shipments`، ثم دالة RPC `create_shipment` تستدعي Webhook المزوّد (Yalidine / ZR Express) من Server Action على الخادم فقط، مع إبقاء `create_order` كما هو.

أفكار مستقبلية أخرى مذكورة في مواصفة المنتج (marketplace، طلبات مسبقة، شراء جماعي، كوبونات، تقييمات، استيراد كتالوج من إنستغرام...) غير منفذة في MVP عمدًا.

---

## المستودع

- GitHub: `github.com/<owner>/mahalli` — أنشئ المستودع وارفع الكود بأوامر git المعتادة، أو استعمل الرابط المباشر إن نُشئ آليًا.
- الترخيص: مفتوح للاستخدام الشخصي والتجاري لأصحاب المشاريع.
