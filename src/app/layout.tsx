import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mahalli — أنشئ متجرك الإلكتروني في دقائق",
    template: "%s | Mahalli",
  },
  description:
    "منصة محلي: أنشئ متجرك الإلكتروني العربي في دقائق، شارك الرابط، واستقبل طلبات الدفع عند الاستلام من جميع ولايات الجزائر.",
  keywords: ["Mahalli", "محلي", "متجر إلكتروني", "الجزائر", "بيع أونلاين", "الدفع عند الاستلام"],
  openGraph: {
    title: "Mahalli — متجرك الإلكتروني في دقائق",
    description:
      "أنشئ متجرك العربي، شارك الرابط على إنستغرام وفيسبوك، واستقبل طلبات الدفع عند الاستلام.",
    type: "website",
    siteName: "Mahalli",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors closeButton dir="rtl" />
        </ThemeProvider>
      </body>
    </html>
  );
}
