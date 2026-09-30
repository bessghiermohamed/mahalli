"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/app/actions/auth";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/products", label: "المنتجات", icon: Package },
  { href: "/dashboard/orders", label: "الطلبات", icon: ShoppingBag },
  { href: "/dashboard/delivery", label: "التوصيل", icon: Truck },
  { href: "/dashboard/statistics", label: "الإحصائيات", icon: BarChart3 },
  { href: "/dashboard/settings", label: "إعدادات المتجر", icon: Settings },
  { href: "/dashboard/account", label: "حسابي", icon: UserRound },
];

function NavLink({
  item,
  onNavigate,
  badge,
}: {
  item: NavItem;
  onNavigate?: () => void;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {badge && badge > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
          {badge > 99 ? "+99" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function NavContent({
  storeSlug,
  storeName,
  newOrders,
  onNavigate,
}: {
  storeSlug: string;
  storeName: string;
  newOrders: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-4 pt-1">
        <p className="text-xs text-muted-foreground">متجرك</p>
        <p className="truncate text-sm font-bold">{storeName}</p>
        <a
          href={`/${storeSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          عرض المتجر
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>
      <nav className="flex-1 space-y-1" aria-label="تنقل لوحة التحكم">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} badge={item.href === "/dashboard/orders" ? newOrders : undefined} />
        ))}
      </nav>
      <form action={logoutAction} className="border-t pt-3">
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
        >
          <LogOut className="size-4.5" aria-hidden="true" />
          تسجيل الخروج
        </Button>
      </form>
    </div>
  );
}

export function DashboardShell({
  storeSlug,
  storeName,
  newOrders,
  children,
}: {
  storeSlug: string;
  storeName: string;
  newOrders: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="فتح القائمة">
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-4">
              <SheetTitle className="sr-only">قائمة لوحة التحكم</SheetTitle>
              <NavContent
                storeSlug={storeSlug}
                storeName={storeName}
                newOrders={newOrders}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <span className="flex items-center gap-1.5 font-bold">
            <Store className="size-4 text-primary" aria-hidden="true" />
            {storeName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" aria-label="عرض المتجر">
            <a href={`/${storeSlug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4.5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e bg-muted/30 p-4 lg:block">
        <div className="mb-2 flex items-center gap-2 px-2 font-extrabold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-4.5" aria-hidden="true" />
          </span>
          محلي
        </div>
        <NavContent storeSlug={storeSlug} storeName={storeName} newOrders={newOrders} />
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
