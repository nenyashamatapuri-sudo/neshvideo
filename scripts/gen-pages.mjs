/**
 * Prints the binder's pages from whatever is currently in the CMS.
 *
 * The placeholder generator draws pages out of nothing, which was right while
 * there was no work to show. This replaces its output for the pages that have
 * a section behind them: it reads the catalogue, pulls each piece's thumbnail,
 * and hands the layout to scripts/pages.swift to composite.
 *
 * Run it after seeding, or any time the work changes:
 *
 *   node --env-file=.env.local scripts/gen-pages.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'public', 'media');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing Supabase env. Run with: node --env-file=.env.local scripts/gen-pages.mjs');
  process.exit(1);
}
const db = createClient(url, key);

const { CHAPTERS } = await import('../lib/spreads.ts');
const chapter = (slug) => CHAPTERS.find((c) => c.slug === slug);

/**
 * Which page shows which section, and how it is printed. Mirrors SHEETS in
 * lib/spreads.ts — the ids have to match or the binder loads nothing.
 */
const PAGES = [
  { id: 'title', kind: 'title', ground: 'red', from: null, take: 0 },
  { id: 'directing-hero', kind: 'poster', ground: 'red', from: 'directing', take: 1 },
  { id: 'directing-grid', kind: 'grid', from: 'directing', take: 6, skip: 1 },
  { id: 'photography-plate', kind: 'plate', from: 'photography', take: 1 },
  { id: 'photography-contact', kind: 'contact', from: 'photography', take: 12, skip: 1 },
  { id: 'videography-hero', kind: 'hero', ground: 'ink', from: 'videography', take: 1 },
  { id: 'videography-grid', kind: 'grid', from: 'videography', take: 6, skip: 1 },
  { id: 'production-hero', kind: 'poster', ground: 'red', from: 'production', take: 1 },
  { id: 'production-grid', kind: 'grid', from: 'production', take: 6, skip: 1 },
  { id: 'colophon', kind: 'contact', ground: 'ink', from: '*', take: 12 },
  // Stills that belong to no page; the About collage pulls from these.
  { id: 'about-1', kind: 'hero', from: 'photography', take: 1, skip: 2 },
  { id: 'about-2', kind: 'hero', from: 'directing', take: 1, skip: 3 },
  { id: 'about-3', kind: 'hero', from: 'videography', take: 1, skip: 4 },
];

const work = mkdtempSync(join(tmpdir(), 'nesh-pages-'));

/** Supabase serves the thumbnails; the renderer needs them on disk. */
async function fetchLocal(link, name) {
  try {
    const res = await fetch(link);
    if (!res.ok) return null;
    const file = join(work, `${name}.jpg`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    return file;
  } catch {
    return null;
  }
}

async function main() {
  const { data, error } = await db
    .from('portfolio_pieces')
    .select('category, title, image_url, images, sort_order, coming_soon')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error(`Could not read the catalogue: ${error.message}`);
    process.exit(1);
  }

  const live = (data ?? []).filter((p) => !p.coming_soon && p.image_url);
  if (live.length === 0) {
    console.error('Nothing in the catalogue to print. Run the seed first.');
    process.exit(1);
  }

  console.log(`printing ${PAGES.length} pages from ${live.length} pieces\n`);

  /**
   * Every still a section owns: each piece's thumbnail first, then a round of
   * one gallery frame from each, then the next round. Concatenating the
   * galleries instead would fill a twelve-up contact sheet with whichever
   * shoot happened to have the most frames.
   */
  const pool = (slug) => {
    const rows = slug === '*' ? live : live.filter((p) => p.category === slug);
    const galleries = rows.map((p) =>
      (Array.isArray(p.images) ? p.images.map((i) => i.url) : []).filter(Boolean)
    );

    const out = rows.map((p) => p.image_url).filter(Boolean);
    const deepest = Math.max(0, ...galleries.map((g) => g.length));
    for (let round = 0; round < deepest; round++) {
      for (const gallery of galleries) {
        if (gallery[round]) out.push(gallery[round]);
      }
    }

    // A piece's thumbnail is usually also the first frame of its gallery, so
    // without this a contact sheet prints half its bays twice.
    return [...new Set(out)];
  };

  let n = 0;
  const pages = [];

  for (const page of PAGES) {
    const c = page.from && page.from !== '*' ? chapter(page.from) : chapter('');
    const available = page.from ? pool(page.from) : [];
    // `skip` walks each page onto different frames so two pages of the same
    // section are not the same six photographs.
    const start = (page.skip ?? 0) % Math.max(1, available.length);
    const rotated = [...available.slice(start), ...available.slice(0, start)];

    const images = [];
    for (const link of rotated.slice(0, page.take)) {
      const file = await fetchLocal(link, `img-${n++}`);
      if (file) images.push(file);
    }

    pages.push({
      id: page.id,
      kind: page.kind,
      ground: page.ground ?? 'paper',
      index: c?.index ?? '',
      title: c?.title ?? 'NESH',
      tail: c?.tail ?? 'VIDEO',
      kicker: c?.kicker ?? '',
      blurb: c?.intro ?? '',
      images,
    });
  }

  const bin = join(work, 'pages');
  execFileSync('swiftc', ['-O', join(import.meta.dirname, 'pages.swift'), '-o', bin], {
    stdio: 'pipe',
  });

  const run = spawnSync(bin, {
    input: JSON.stringify({ outDir: OUT, pages }),
    encoding: 'utf8',
  });

  if (run.status !== 0) {
    console.error(run.stderr || 'renderer failed');
    process.exit(1);
  }

  process.stdout.write(run.stdout);
  rmSync(work, { recursive: true, force: true });
  console.log(`\nwrote ${pages.length} pages and frames to public/media/`);
}

main().catch((err) => {
  rmSync(work, { recursive: true, force: true });
  console.error(err);
  process.exit(1);
});
