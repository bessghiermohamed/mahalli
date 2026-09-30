"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * CSS-driven toggle: both icons are rendered and visibility is controlled by
 * the `dark` class, so no client state or hydration synchronization is needed.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label="تبديل الوضع الفاتح والداكن"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun
        className="size-5 dark:hidden"
        aria-hidden="true"
      />
      <Moon
        className="hidden size-5 dark:block"
        aria-hidden="true"
      />
    </Button>
  );
}
