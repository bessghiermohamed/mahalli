import { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const supabaseHost = supabaseHostFromEnv();
const remotePatterns: RemotePattern[] = [
  { protocol: "https", hostname: "*.supabase.co" },
];
if (supabaseHost) {
  remotePatterns.push({ protocol: "https", hostname: supabaseHost });
}

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow builds with an isolated dist dir (used for production-build checks
  // while the dev server keeps its own .next directory).
  distDir: process.env.NEXT_BUILD_DIST_DIR || ".next",
  images: {
    remotePatterns,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
};

function supabaseHostFromEnv(): string {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return "";
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export default nextConfig;
