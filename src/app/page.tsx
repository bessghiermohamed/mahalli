import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  MapPinned,
  MessageCircle,
  Package,
  Store,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { DEMO_STORE_SLUG } from "@/lib/demo";

export const metadata = {
  title: "Mahalli — أنشئ متجرك الإلكتروني في دقائق",
  alternates: { canonical: "/" },
};

const features = [
  {
    icon: Timer,
    title: "متجر جاهز في دقائق",
    body: "سجّل، أدخل اسم متجرك ورابطه، أضف أول منتج، ثم شارك الرابط مع متابعيك مباشرة.",
  },
  {
    icon: Banknote,
    title: "الدفع عند الاستلام",
    body: "لا حاجة لبطاقة بنكية أو بوابة دفع. الزبون يطلب ويشترى عند وصول الطلب إلى باب البيت.",
  },
  {
    icon: MapPinned,
    title: "58 ولاية مع أسعار التوصيل",
    body: "حدد سعر توصيل لكل ولاية أو استعمل السعر الافتراضي، مع الدعم الكامل لجميع ولايات الوطن.",
  },
  {
    icon: MessageCircle,
    title: "تأكيد الطلبات عبر واتساب",
    body: "كل طلب يأتي مع رسالة واتساب جاهزة بتفاصيل المنتجات والعنوان، أرسلها بضغطة واحدة.",
  },
  {
    icon: Store,
    title: "رابط أنيق لكل متجر",
    body: "متجرك على رابط خاص سهل المشاركة في إنستغرام وفيسبوك مثل mahalli.app/your-shop",
  },
  {
    icon: BadgeCheck,
    title: "عربي بالكامل وبسعرات واضحة",
    body: "واجهة عربية RTL سريعة تعمل على الهاتف، والأسعار بالدينار الجزائري بدون أي التباس.",
  },
];

const steps = [
  {
    n: "1",
    title: "أنشئ متجرك",
    body: "سجّل بالبريد الإلكتروني أو بحساب Google، ثم أدخل اسم المتجر والرابط وشعارك ورقم واتساب.",
  },
  {
    n: "2",
    title: "أضف منتجاتك",
    body: "صورة، اسم، سعر بالدينار ووصف قصير. يمكنك إخفاء أو إظهار أي منتج بضغطة واحدة.",
  },
  {
    n: "3",
    title: "شارك الرابط واستقبل الطلبات",
    body: "الزبائن يطلبون بدون حساب، وأنت تتابع وتؤكد الطلبات من لوحة التحكم ثم ترسلها عبر واتساب.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-lg">محلي</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">ابدأ مجانًا</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-5xl px-4 pb-14 pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Package className="size-3.5" aria-hidden="true" />
            منصة المتاجر للبائعين الجزائريين
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold leading-[1.25] sm:text-5xl sm:leading-tight">
            أنشئ متجرك الإلكتروني في دقائق، واستقبل طلبات من كل ولايات الجزائر
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            محلي منصة عربية بسيطة للبائعين على إنستغرام وفيسبوك: رابط واحد لمتجرك، سلة تسوق،
            والدفع عند الاستلام — بدون أي خبرة تقنية.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">
                أنشئ متجرك مجانًا
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href={`/${DEMO_STORE_SLUG}`}>شاهد متجرًا تجريبيًا</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 py-14">
          <div className="mx-auto w-full max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">
              كل ما تحتاجه للبيع أونلاين، ولا شيء أكثر
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title} className="gap-3">
                  <CardHeader className="pb-0">
                    <span className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {f.body}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14">
          <div className="mx-auto w-full max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">كيف يعمل؟</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="rounded-xl border p-5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {s.n}
                  </span>
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-16">
          <div className="mx-auto w-full max-w-3xl px-4">
            <div className="rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground">
              <h2 className="text-2xl font-bold sm:text-3xl">متجرك ينتظرك</h2>
              <p className="mx-auto mt-2 max-w-md text-sm opacity-90 sm:text-base">
                سجّل الآن مجانًا، أضف أول منتجك اليوم، وابدأ باستقبال الطلبات هذا الأسبوع.
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-6">
                <Link href="/signup">ابدأ الآن — مجانًا</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t py-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Mahalli — محلي</p>
          <p>صُنع للبائعين الجزائريين</p>
        </div>
      </footer>
    </div>
  );
}
