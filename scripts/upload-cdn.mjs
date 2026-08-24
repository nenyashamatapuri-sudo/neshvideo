/**
 * Push public/media to a Bunny storage zone.
 *
 *   npm run cdn          upload anything new or changed
 *   npm run cdn -- --all re-upload everything
 *
 * Reads BUNNY_STORAGE_ZONE, BUNNY_STORAGE_KEY, BUNNY_STORAGE_HOST and the
 * optional BUNNY_API_KEY from .env.local. Nothing here runs at build or
 * request time — it is a deploy step you run by hand.
 *
 * Paths are preserved: public/media/pages/x.jpg becomes media/pages/x.jpg on
 * the zone, so it is served at <pull-zone>/media/pages/x.jpg and matches the
 * paths already stored in the catalogue.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL = path.join(ROOT, "public", "media");
const PREFIX = "media";
const CONCURRENCY = 6;

/* ------------------------------------------------------------------- env -- */

/** Minimal .env reader — enough for KEY=value, ignoring comments and quotes. */
function loadEnv(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}
loadEnv(".env.local");
loadEnv(".env");

const ZONE = process.env.BUNNY_STORAGE_ZONE?.trim();
const KEY = process.env.BUNNY_STORAGE_KEY?.trim();
const HOST = (process.env.BUNNY_STORAGE_HOST ?? "storage.bunnycdn.com").trim();
const API_KEY = process.env.BUNNY_API_KEY?.trim();
const PULL = (process.env.NEXT_PUBLIC_CDN_URL ?? "").trim().replace(/\/+$/, "");
const FORCE = process.argv.includes("--all");

if (!ZONE || !KEY) {
  console.error("Missing Bunny credentials.\n");
  console.error("Copy .env.example to .env.local and fill in:");
  console.error("  BUNNY_STORAGE_ZONE   your storage zone name");
  console.error("  BUNNY_STORAGE_KEY    that zone's password");
  console.error("\nNothing was uploaded.");
  process.exit(1);
}
if (!fs.existsSync(LOCAL)) {
  console.error(`No such folder: ${LOCAL}\nRun \`npm run media\` first.`);
  process.exit(1);
}

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

/* ---------------------------------------------------------------- local -- */

/** Every file under `dir`, as paths relative to it. */
function walk(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (!entry.name.startsWith(".")) {
      out.push({ rel: path.relative(base, full), size: fs.statSync(full).size, full });
    }
  }
  return out;
}

/* ---------------------------------------------------------------- bunny -- */

const storage = (p = "") => `https://${HOST}/${ZONE}/${p}`;

/**
 * Everything already on the zone, as path → byte length.
 *
 * Listing first means a re-run only sends what actually changed, which matters
 * once the folder holds a real photo library rather than 2MB of placeholders.
 */
async function remoteIndex(dir = PREFIX, into = new Map()) {
  const res = await fetch(storage(`${dir}/`), { headers: { AccessKey: KEY } });
  if (res.status === 404) return into;
  if (!res.ok) throw new Error(`List ${dir} failed: ${res.status} ${res.statusText}`);

  for (const item of await res.json()) {
    const rel = `${dir}/${item.ObjectName}`;
    if (item.IsDirectory) await remoteIndex(rel, into);
    else into.set(rel, item.Length);
  }
  return into;
}

async function put(file, key) {
  const res = await fetch(storage(key), {
    method: "PUT",
    headers: {
      AccessKey: KEY,
      "Content-Type": MIME[path.extname(key).toLowerCase()] ?? "application/octet-stream",
    },
    body: fs.readFileSync(file),
  });
  if (!res.ok) throw new Error(`Upload ${key} failed: ${res.status} ${res.statusText}`);
}

/** Run `worker` over `items`, a few at a time. */
async function pool(items, worker) {
  let i = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (i < items.length) await worker(items[i++]);
  });
  await Promise.all(runners);
}

/* ----------------------------------------------------------------- main -- */

const files = walk(LOCAL);
if (files.length === 0) {
  console.error(`${LOCAL} is empty. Run \`npm run media\` first.`);
  process.exit(1);
}

console.log(`Zone ${ZONE} at ${HOST}`);
const remote = FORCE ? new Map() : await remoteIndex();
if (!FORCE) console.log(`${remote.size} file${remote.size === 1 ? "" : "s"} already on the zone`);

const queue = [];
let skipped = 0;
for (const f of files) {
  const key = `${PREFIX}/${f.rel.split(path.sep).join("/")}`;
  // Byte length is enough: these files are written whole, never patched.
  if (remote.get(key) === f.size) skipped += 1;
  else queue.push({ ...f, key });
}

if (queue.length === 0) {
  console.log(`\nNothing to do — all ${files.length} files are already up to date.`);
  process.exit(0);
}

console.log(`Uploading ${queue.length}, skipping ${skipped} unchanged.\n`);

let done = 0;
let failed = 0;
await pool(queue, async (f) => {
  try {
    await put(f.full, f.key);
    done += 1;
    process.stdout.write(`  ${String(done).padStart(4)}/${queue.length}  ${f.key}\n`);
  } catch (err) {
    failed += 1;
    console.error(`  FAILED  ${f.key}\n          ${err.message}`);
  }
});

// Purge, so the edge picks up files that changed under an existing name.
if (API_KEY && PULL && done > 0) {
  const res = await fetch(`https://api.bunny.net/purge?url=${encodeURIComponent(`${PULL}/${PREFIX}/*`)}`, {
    method: "POST",
    headers: { AccessKey: API_KEY },
  });
  console.log(res.ok ? "\nCache purged." : `\nPurge failed: ${res.status} (files are uploaded)`);
} else if (done > 0 && !API_KEY) {
  console.log("\nSet BUNNY_API_KEY to purge the cache automatically.");
}

console.log(`\n${done} uploaded${failed ? `, ${failed} failed` : ""}.`);
if (PULL) console.log(`Serving from ${PULL}/${PREFIX}/`);
process.exit(failed ? 1 : 0);
