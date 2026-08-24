/**
 * Bulk import.
 *
 *   npm run import -- ~/Desktop/nesh-work
 *
 * Expects one folder per section, named for the section:
 *
 *   nesh-work/
 *     directing/      Nightshift -- Corona -- Wieden + Kennedy.jpg
 *     photography/    Terrace Portraits -- Zalando.jpg
 *     videography/    Field Notes.jpg
 *     production/     ...
 *
 * The filename is the metadata, split on ` -- `:
 *   Title -- Client -- Agency      all three
 *   Title -- Client                no agency
 *   Title                          client falls back to "Personal"
 *
 * Order inside a folder is alphabetical, so prefix with 01_, 02_ … to control
 * it; the numbers are stripped from the title.
 *
 * Each file is resized and re-encoded into public/media/work/<section>/, and
 * lib/work.generated.ts is rewritten. Nothing else is touched — rerun it as
 * often as you like.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "media", "work");
const SECTIONS = ["directing", "photography", "videography", "production"];
const SOURCE_EXT = new Set([".jpg", ".jpeg", ".png", ".heic", ".tif", ".tiff", ".webp"]);

/** Longest edge in the output. 2400 covers a 2× retina full-bleed frame. */
const MAX_EDGE = 2400;
const QUALITY = 82;

const src = process.argv[2];
if (!src) {
  console.error("Usage: npm run import -- <folder>");
  console.error("The folder should contain: " + SECTIONS.join(", "));
  process.exit(1);
}
const SRC = path.resolve(src.replace(/^~/, process.env.HOME ?? "~"));
if (!fs.existsSync(SRC)) {
  console.error(`No such folder: ${SRC}`);
  process.exit(1);
}

function have(cmd) {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
if (!have("sips")) {
  console.error("This importer uses `sips`, which ships with macOS. On Linux or");
  console.error("Windows, resize the files yourself and drop them in");
  console.error("public/media/work/<section>/, then edit lib/work.generated.ts.");
  process.exit(1);
}

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Pull title, client and agency out of a filename. */
function parseName(file) {
  const base = path.basename(file, path.extname(file));
  // Strip a leading sort prefix: "01_", "02 - ", "3."
  const cleaned = base.replace(/^\d+\s*[_.\-–]\s*/, "");
  const parts = cleaned.split(/\s*--\s*/).map((p) => p.trim()).filter(Boolean);
  return {
    title: parts[0] ?? cleaned,
    client: parts[1] ?? "Personal",
    agency: parts[2],
  };
}

/** Real pixel dimensions, so the gallery uses the picture's own proportions. */
function dimensions(file) {
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file], {
    encoding: "utf8",
  });
  const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1]);
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? { w, h } : null;
}

/** Reduce a ratio so the CSS reads as "3 / 2" rather than "3000 / 2000". */
function ratio(w, h) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const g = gcd(w, h) || 1;
  let rw = w / g;
  let rh = h / g;
  // Keep it short; exact values don't matter past a couple of digits.
  while (rw > 64 || rh > 64) {
    rw = Math.round(rw / 2);
    rh = Math.round(rh / 2);
  }
  return `${rw} / ${rh}`;
}

/* ------------------------------------------------------------------ run -- */

// Note: the output folder is NOT cleared wholesale here. Only the sections
// being re-imported are, further down — wiping everything would delete the
// pictures belonging to sections this run is carrying over, leaving the
// catalogue pointing at files that no longer exist.
fs.mkdirSync(OUT, { recursive: true });
/**
 * What is already in the catalogue. Sections not present in this run are
 * carried over untouched, so the four sections can be filled in over several
 * passes instead of all at once.
 */
let existing = {};
try {
  const mod = await import(`../lib/work.generated.ts?t=${Date.now()}`);
  existing = mod.IMPORTED ?? {};
} catch {
  // No catalogue yet, or it doesn't parse — start clean.
}

const catalogue = {};
/**
 * Refuse to run against a folder that has no section subfolders in it.
 *
 * Without this the script cheerfully imports nothing, overwrites the catalogue
 * with four empty arrays, and the galleries silently fall back to placeholders
 * — destroying a good import because of a typo in a path. Far better to stop
 * and say what shape the folder should be.
 */
const present = SECTIONS.filter((s) => fs.existsSync(path.join(SRC, s)));
if (present.length === 0) {
  const loose = fs
    .readdirSync(SRC)
    .filter((f) => SOURCE_EXT.has(path.extname(f).toLowerCase())).length;

  console.error(`\nNothing to import from ${SRC}`);
  console.error(
    loose
      ? `\nFound ${loose} image${loose === 1 ? "" : "s"} loose in that folder, but no section folders.`
      : `\nThat folder has none of the section folders in it.`
  );
  console.error(`\nPut the pictures in one folder per section:\n`);
  console.error(`  ${path.basename(SRC)}/`);
  for (const section of SECTIONS) {
    console.error(`    ${section}/`);
  }
  console.error(`\nNaming each file:  Title -- Client -- Agency.jpg`);
  console.error(`Client and agency are both optional.\n`);
  console.error(`Nothing was changed.`);
  process.exit(1);
}

let total = 0;

for (const section of SECTIONS) {
  const dir = path.join(SRC, section);
  if (!fs.existsSync(dir)) {
    // Left alone rather than emptied: importing one section shouldn't wipe the
    // other three, so sections can be filled in over several passes.
    const kept = existing[section]?.length ?? 0;
    console.warn(
      `  ${section.padEnd(13)} — no folder, ` +
        (kept ? `kept ${kept} already imported` : "skipped")
    );
    catalogue[section] = existing[section] ?? [];
    continue;
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => SOURCE_EXT.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // Rebuild just this section's folder, so re-importing one section can't
  // strand the images belonging to the other three.
  fs.rmSync(path.join(OUT, section), { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, section), { recursive: true });
  catalogue[section] = [];

  for (const [i, file] of files.entries()) {
    const from = path.join(dir, file);
    const meta = parseName(file);
    const slug = `${slugify(meta.title) || "untitled"}-${i + 1}`;
    const to = path.join(OUT, section, `${slug}.jpg`);

    execFileSync("sips", [
      "-s", "format", "jpeg",
      "-s", "formatOptions", String(QUALITY),
      "-Z", String(MAX_EDGE),
      from,
      "--out", to,
    ], { stdio: "ignore" });

    const dim = dimensions(to);
    catalogue[section].push({
      slug,
      title: meta.title,
      client: meta.client,
      agency: meta.agency,
      cover: `/media/work/${section}/${slug}.jpg`,
      aspect: dim ? ratio(dim.w, dim.h) : "3 / 2",
    });
    total += 1;
  }

  console.log(`  ${section.padEnd(13)} ${files.length} file${files.length === 1 ? "" : "s"}`);
}

const body = SECTIONS.map((section) => {
  const rows = catalogue[section]
    .map(
      (p) =>
        `    {\n` +
        `      slug: ${JSON.stringify(p.slug)},\n` +
        `      title: ${JSON.stringify(p.title)},\n` +
        `      client: ${JSON.stringify(p.client)},\n` +
        (p.agency ? `      agency: ${JSON.stringify(p.agency)},\n` : "") +
        `      cover: ${JSON.stringify(p.cover)},\n` +
        `      aspect: ${JSON.stringify(p.aspect)},\n` +
        `    },`
    )
    .join("\n");
  return `  ${section}: [\n${rows}\n  ],`;
}).join("\n");

fs.writeFileSync(
  path.join(ROOT, "lib", "work.generated.ts"),
  `// Generated by scripts/import-work.mjs — do not edit by hand.\n` +
    `// Rerun: npm run import -- <folder>\n\n` +
    `import type { ImportedProject } from "./projects";\n\n` +
    `export const IMPORTED: Record<string, ImportedProject[]> = {\n${body}\n};\n`
);

console.log(`\n${total} image${total === 1 ? "" : "s"} imported.`);
console.log("Wrote lib/work.generated.ts — the galleries now read from it.");
