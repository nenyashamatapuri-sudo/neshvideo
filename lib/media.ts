/**
 * Where the pictures live.
 *
 * Everything stored under `public/media/` is addressed by a root-relative path
 * — `/media/pages/title.jpg` — and passed through `mediaUrl()` on the way out.
 * With `NEXT_PUBLIC_CDN_URL` set, those become absolute URLs on the CDN; with
 * it unset they stay local and are served by Next out of `public/`.
 *
 * The important consequence: **paths stored in data never change.** The
 * importer writes `/media/work/...` whether or not a CDN exists, so turning
 * Bunny on or off is one environment variable and a redeploy — no re-import,
 * no rewriting the catalogue, and local development works with no CDN at all.
 */

/** e.g. https://nesh.b-cdn.net — no trailing slash. */
const BASE = (process.env.NEXT_PUBLIC_CDN_URL ?? "").trim().replace(/\/+$/, "");

export const CDN_ENABLED = BASE.length > 0;

/** Resolve a stored media path to the URL the browser should actually fetch. */
export function mediaUrl(path: string): string {
  // Already absolute (someone pasted a full URL into the catalogue) — leave it.
  if (/^https?:\/\//i.test(path)) return path;
  const rooted = path.startsWith("/") ? path : `/${path}`;
  return BASE ? `${BASE}${rooted}` : rooted;
}

/** The CDN's hostname, for `next.config.ts` image patterns. Empty when local. */
export function cdnHost(): string {
  if (!BASE) return "";
  try {
    return new URL(BASE).hostname;
  } catch {
    return "";
  }
}
