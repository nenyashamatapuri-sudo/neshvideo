import path from "node:path";
import type { NextConfig } from "next";

/**
 * The CDN host, if one is configured. Read directly from the environment
 * rather than through lib/media.ts, because this file is evaluated by the
 * build before any application module graph exists.
 */
function cdnHostname(): string | null {
  const base = (process.env.NEXT_PUBLIC_CDN_URL ?? "").trim();
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    throw new Error(
      `NEXT_PUBLIC_CDN_URL is not a valid URL: ${JSON.stringify(base)}\n` +
        `Expected something like https://nesh.b-cdn.net`
    );
  }
}

const host = cdnHostname();

const nextConfig: NextConfig = {
  turbopack: {
    // There is a stray package-lock.json in the home directory. Without this,
    // Turbopack walks up and infers ~/ as the workspace root, which would pull
    // the entire home directory into the module graph.
    root: path.resolve(import.meta.dirname),
  },

  images: {
    // next/image refuses remote hosts unless they are named here. Only the one
    // host, and only over https.
    remotePatterns: host
      ? [{ protocol: "https", hostname: host, pathname: "/media/**" }]
      : [],
  },
};

export default nextConfig;
