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

/**
 * Supabase Storage serves the CMS-uploaded stills. next/image refuses any
 * remote host it has not been told about, so the project's own storage bucket
 * has to be named here alongside the CDN.
 */
function supabaseHostname(): string | null {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseHostname();

const nextConfig: NextConfig = {
  turbopack: {
    // There is a stray package-lock.json in the home directory. Without this,
    // Turbopack walks up and infers ~/ as the workspace root, which would pull
    // the entire home directory into the module graph.
    root: path.resolve(import.meta.dirname),
  },

  images: {
    // next/image refuses remote hosts unless they are named here. Only these
    // hosts, and only over https.
    remotePatterns: [
      ...(host
        ? [{ protocol: "https" as const, hostname: host, pathname: "/media/**" }]
        : []),
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // Vimeo's poster frames, fetched by the seeder for video-only pieces.
      { protocol: "https" as const, hostname: "i.vimeocdn.com" },
    ],
  },
};

export default nextConfig;
