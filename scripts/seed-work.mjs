/**
 * Seeds the CMS from the work folders on disk.
 *
 * Reads ~/Documents/My work, converts anything that is not web-ready, uploads
 * the stills to Supabase Storage and writes one row per project. Video is not
 * uploaded — the files run to a gigabyte each, far past the bucket's 50MB cap,
 * so film lives on Vimeo and only the link is stored. Where a filename carries
 * a Vimeo id in brackets the link is filled in automatically; the rest are left
 * for the CMS.
 *
 * Idempotent: rows are matched on (category, slug) and updated in place, so
 * running it twice does not duplicate the catalogue.
 *
 *   node scripts/seed-work.mjs            # everything
 *   node scripts/seed-work.mjs --dry      # report only, no uploads or writes
 *   node scripts/seed-work.mjs directing  # one section
 */

import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, extname, basename } from 'node:path';

const ROOT = join(homedir(), 'Documents', 'My work');
const BUCKET = 'portfolio';
/** Long edge, in pixels. Big enough for a full-bleed plate, small enough to send. */
const MAX_EDGE = 2400;

const WEB = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const CONVERTIBLE = new Set(['.tif', '.tiff', '.heic', '.arw', '.cr2', '.nef', '.dng']);
const VIDEO = new Set(['.mp4', '.mov', '.m4v']);

/**
 * The catalogue, as it should read on the site. Folder names carry typos and
 * shorthand ("Coorona", "Audemar Piquet"); the titles here are what visitors
 * see, and every one of them stays editable in the CMS afterwards.
 */
const MANIFEST = [
  // ---------------------------------------------------------- directing --
  { folder: 'Directing/A breath of fresh air', category: 'directing', title: 'A Breath of Fresh Air' },
  { folder: 'Directing/Embodied Zimbabwe', category: 'directing', title: 'Embodied Zimbabwe', client: 'Self-initiated' },
  { folder: 'Directing/Filmmaking is a collborative process', category: 'directing', title: 'Filmmaking Is a Collaborative Process', client: 'Self-initiated' },
  { folder: 'Directing/J8de ft Toluwa Abide by the Law', category: 'directing', title: 'Abide by the Law', client: 'J8de ft. Toluwa' },
  { folder: 'Directing/Nike School to Swoosh', category: 'directing', title: 'School to Swoosh', client: 'Nike' },
  { folder: 'Directing/Routes in Documentary-Soho House', category: 'directing', title: 'Routes in Documentary', client: 'Soho House' },
  { folder: 'Directing/Sanslimite', category: 'directing', title: 'Sanslimite', client: 'Sanslimite' },

  // -------------------------------------------------------- photography --
  { folder: 'Photography/FAVE- Patta', category: 'photography', title: 'FAVE', client: 'Patta' },
  { folder: 'Photography/J8de -Sxy', category: 'photography', title: 'Sxy', client: 'J8de' },
  { folder: 'Photography/Kinfolk- Wieden Kennedy', category: 'photography', title: 'Kinfolk', client: 'Kinfolk', agency: 'Wieden + Kennedy' },
  { folder: 'Photography/Skate Zimbabwe', category: 'photography', title: 'Skate Zimbabwe', client: 'Self-initiated' },
  { folder: 'Photography/Triumph Bts- Wieden + Kennedy', category: 'photography', title: 'Triumph BTS', client: 'Triumph', agency: 'Wieden + Kennedy' },
  { folder: 'Photography/Heritage and Horizons- coming soon', category: 'photography', title: 'Heritage and Horizons', comingSoon: true },
  { folder: 'Photography/Royal Streetwear- coming soon', category: 'photography', title: 'Royal Streetwear', comingSoon: true },

  // --------------------------------------------------------- production --
  { folder: 'Production/Coorona Cero- Wieden _ Kennedy', category: 'production', title: 'Corona Cero', client: 'Corona', agency: 'Wieden + Kennedy' },
  { folder: 'Production/Trainline The way to train- Wieden + Kennedy', category: 'production', title: 'The Way to Train', client: 'Trainline', agency: 'Wieden + Kennedy' },
  { folder: 'Production/Triumph Stills- Wieden + Kennedy', category: 'production', title: 'Triumph Stills', client: 'Triumph', agency: 'Wieden + Kennedy' },
  { folder: 'Production/Zalando AW 26- Coming soon', category: 'production', title: 'Zalando AW26', client: 'Zalando', comingSoon: true },

  // -------------------------------------------------------- videography --
  { folder: 'Videography/Betano -Czech -Wieden + Kennedy', category: 'videography', title: 'Betano Czech', client: 'Betano', agency: 'Wieden + Kennedy' },
  { folder: 'Videography/Dan3', category: 'videography', title: 'Dan3' },
  { folder: 'Videography/Fete dela musique 2026- Dam side', category: 'videography', title: 'Fête de la Musique 2026', client: 'Dam Side' },
  { folder: 'Videography/Guess Jeans- Spice Pr', category: 'videography', title: 'Guess Jeans Watch Party', client: 'Guess', agency: 'Spice PR' },
  { folder: 'Videography/Hennessy Africa - Wieden + Kennedy', category: 'videography', title: 'Hennessy Africa', client: 'Hennessy', agency: 'Wieden + Kennedy' },
  { folder: 'Videography/Le Club- Audemar Piquet', category: 'videography', title: 'Le Club', client: 'Audemars Piguet' },
  { folder: 'Videography/Nozomey', category: 'videography', title: 'Love by Nozomey', client: 'Nozomey' },
  { folder: 'Videography/Phillips -UPR', category: 'videography', title: 'Baristina Launch', client: 'Philips', agency: 'UPR' },
  { folder: 'Videography/Rema Amsterdam 2025-Bon Bon entertainment', category: 'videography', title: 'Rema Amsterdam 2025', client: 'Bon Bon Entertainment' },
  { folder: 'Videography/We are in Amsterdam baby- Personal', category: 'videography', title: 'We Are in Amsterdam Baby', client: 'Self-initiated' },
];

// ------------------------------------------------------------------ setup --

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const only = args.find((a) => !a.startsWith('--'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing Supabase env. Run with:  node --env-file=.env.local scripts/seed-work.mjs');
  process.exit(1);
}
const db = createClient(url, key);

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Folder names in the manifest are written loosely; on disk they may have
 *  trailing spaces or a different year. Match forgivingly. */
function resolveFolder(rel) {
  const direct = join(ROOT, rel);
  if (existsSync(direct)) return direct;

  const [cat, name] = rel.split('/');
  const dir = join(ROOT, cat);
  if (!existsSync(dir)) return null;

  const want = slugify(name);
  const hit = readdirSync(dir).find((d) => slugify(d) === want)
    ?? readdirSync(dir).find((d) => slugify(d).startsWith(want.slice(0, 18)));
  return hit ? join(dir, hit) : null;
}

function filesIn(dir) {
  return readdirSync(dir)
    .filter((f) => !f.startsWith('.'))
    .map((f) => join(dir, f))
    .filter((f) => statSync(f).isFile())
    .sort();
}

/** Vimeo puts the id in brackets when you download your own upload. */
function vimeoFrom(files) {
  for (const f of files) {
    const m = basename(f).match(/\[(\d{6,})\]/);
    if (m) return `https://vimeo.com/${m[1]}`;
  }
  return null;
}

/** Vimeo's poster frame, so a film-only piece still has a tile. */
async function vimeoPoster(link) {
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(link)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail_url?.replace(/-d_\d+x\d+$/, '-d_1280x720') ?? null;
  } catch {
    return null;
  }
}

/** Normalise anything to a sensibly-sized JPEG via macOS's sips. */
function toJpeg(src, workdir) {
  const out = join(workdir, `${slugify(basename(src, extname(src)))}.jpg`);
  execFileSync('sips', [
    '-s', 'format', 'jpeg',
    '-s', 'formatOptions', '80',
    '-Z', String(MAX_EDGE),
    src, '--out', out,
  ], { stdio: 'pipe' });
  return out;
}

async function upload(localPath, category, slug, n) {
  const body = readFileSync(localPath);
  const path = `portfolio/${category}/${slug}/${String(n).padStart(2, '0')}.jpg`;
  const { error } = await db.storage.from(BUCKET).upload(path, body, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
    upsert: true,
  });
  if (error) throw new Error(`${path}: ${error.message}`);
  return { url: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, storage_path: path };
}

// ------------------------------------------------------------------- run --

async function main() {
  if (!existsSync(ROOT)) {
    console.error(`No work folder at ${ROOT}`);
    process.exit(1);
  }

  const work = MANIFEST.filter((m) => !only || m.category === only);
  const workdir = mkdtempSync(join(tmpdir(), 'nesh-seed-'));
  const counts = { rows: 0, images: 0, vimeo: 0, skipped: [] };

  console.log(`${dry ? 'DRY RUN — ' : ''}seeding ${work.length} pieces\n`);

  let order = {};

  for (const item of work) {
    const slug = slugify(item.title);
    order[item.category] = (order[item.category] ?? 0) + 1;

    const dir = resolveFolder(item.folder);
    if (!dir) {
      counts.skipped.push(`${item.title} — folder not found`);
      continue;
    }

    const files = filesIn(dir);
    const stills = files.filter((f) => WEB.has(extname(f).toLowerCase()));
    const raw = files.filter((f) => CONVERTIBLE.has(extname(f).toLowerCase()));
    const videos = files.filter((f) => VIDEO.has(extname(f).toLowerCase()));

    const link = vimeoFrom(videos);
    if (link) counts.vimeo++;

    // Convert what is not web-ready, then shrink what is — the originals run
    // to 30MB a frame and no browser needs that.
    const prepared = [];
    for (const f of [...stills, ...raw]) {
      if (dry) { prepared.push(f); continue; }
      try {
        prepared.push(toJpeg(f, workdir));
      } catch {
        counts.skipped.push(`${item.title} — could not read ${basename(f)}`);
      }
    }

    let thumbnail = null;
    const gallery = [];

    if (!dry) {
      for (const [i, f] of prepared.entries()) {
        try {
          const up = await upload(f, item.category, slug, i);
          counts.images++;
          if (i === 0) thumbnail = up;
          gallery.push({ ...up, caption: '', sort_order: i });
        } catch (err) {
          counts.skipped.push(`${item.title} — upload failed: ${err.message}`);
        }
      }

      // A film with no stills still needs a face on the section page.
      if (!thumbnail && link) {
        const poster = await vimeoPoster(link);
        if (poster) thumbnail = { url: poster, storage_path: null };
      }
    }

    const row = {
      slug,
      title: item.title,
      category: item.category,
      client: item.client ?? null,
      agency: item.agency ?? null,
      description: null,
      vimeo_url: link,
      image_url: thumbnail?.url ?? null,
      storage_path: thumbnail?.storage_path ?? null,
      images: gallery,
      coming_soon: Boolean(item.comingSoon),
      sort_order: order[item.category],
    };

    const flags = [
      prepared.length ? `${prepared.length} stills` : null,
      videos.length ? `${videos.length} video` : null,
      link ? 'vimeo ✓' : videos.length ? 'vimeo ✗ needs link' : null,
      item.comingSoon ? 'coming soon' : null,
    ].filter(Boolean).join(', ');

    console.log(`  ${item.category.padEnd(12)} ${item.title.padEnd(38)} ${flags}`);

    if (dry) continue;

    // Match on (category, slug) so a second run updates rather than duplicates.
    const { data: found } = await db
      .from('portfolio_pieces')
      .select('id')
      .eq('category', item.category)
      .eq('slug', slug)
      .maybeSingle();

    const { error } = found
      ? await db.from('portfolio_pieces').update(row).eq('id', found.id)
      : await db.from('portfolio_pieces').insert([row]);

    if (error) {
      counts.skipped.push(`${item.title} — ${error.message}`);
    } else {
      counts.rows++;
    }
  }

  rmSync(workdir, { recursive: true, force: true });

  console.log(`\n${counts.rows} rows, ${counts.images} images uploaded, ${counts.vimeo} Vimeo links found`);
  if (counts.skipped.length) {
    console.log('\nNeeds attention:');
    counts.skipped.forEach((s) => console.log(`  · ${s}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
