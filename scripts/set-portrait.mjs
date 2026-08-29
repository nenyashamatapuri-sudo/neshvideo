/**
 * Installs the binder's cover portrait.
 *
 * The cover looks for public/media/portrait.jpg. Copying a file there by hand
 * works, but a 12MB original out of a camera is a poor thing to put in front of
 * a first-time visitor — the cover is the first texture the binder needs, and
 * everything waits on it. This sizes it down and strips it on the way in.
 *
 *   node scripts/set-portrait.mjs ~/Downloads/whatever.jpg
 */

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(ROOT, 'public', 'media', 'portrait.jpg');
/** Long edge. The cover draws it at roughly 900px wide; twice that is plenty. */
const MAX_EDGE = 1800;

const input = process.argv[2];

if (!input) {
  console.error('usage: node scripts/set-portrait.mjs <path-to-image>');
  console.error('\nDrag the file into the terminal after the command to get its path.');
  process.exit(2);
}

const src = resolve(input.replace(/^~/, process.env.HOME ?? '~'));

if (!existsSync(src)) {
  console.error(`No file at ${src}`);
  process.exit(1);
}

mkdirSync(dirname(DEST), { recursive: true });

try {
  // sips reads everything the Mac can preview — HEIC off a phone included.
  execFileSync(
    'sips',
    ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', '-Z', String(MAX_EDGE), src, '--out', DEST],
    { stdio: 'pipe' }
  );
} catch {
  // No sips, or a format it cannot read — take the file as it stands rather
  // than leaving the cover with nothing.
  copyFileSync(src, DEST);
}

const { size } = statSync(DEST);
const dims = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', DEST], {
  encoding: 'utf8',
})
  .match(/pixel(?:Width|Height): (\d+)/g)
  ?.map((s) => s.split(': ')[1])
  .join(' × ');

console.log(`Cover portrait installed — ${dims}, ${(size / 1024).toFixed(0)}KB`);
console.log('public/media/portrait.jpg');
console.log('\nReload the homepage; commit it when you are happy with how it sits.');
