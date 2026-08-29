"use client";

/**
 * The binder's pages, drawn in the browser from whatever is in the CMS.
 *
 * They used to be JPEGs generated on a laptop and committed, which meant the
 * binder showed whatever the work looked like the last time somebody
 * remembered to run a script. Drawing them at runtime makes the book the
 * catalogue: add a piece and it is in the binder on the next load, remove one
 * and it is gone.
 *
 * The canvases go straight into `THREE.CanvasTexture`, so nothing is fetched
 * twice and no page art ships in the repo. Supabase serves the stills with
 * `access-control-allow-origin: *`, which is what lets a canvas holding them
 * be uploaded to WebGL at all — without it the texture would be tainted and
 * the draw would fail.
 */

import type { PortfolioPiece } from "./supabase";
import { CHAPTERS, PAPER, SHEETS, type Face, type LayoutKind } from "./spreads";

/** Matches the sheet geometry: PAGE_W 1 by PAGE_H 1.414. */
export const ART_W = 900;
export const ART_H = 1274;

/** The gutter tenth is kept clear of art — it is where the ring holes bite. */
const GUTTER = 0.1;

type Ground = "paper" | "red";

export interface PageSpec {
  id: string;
  kind: LayoutKind;
  ground: Ground;
  index: string;
  title: string;
  tail: string;
  /** The one line the section gets. */
  intro: string;
  /** Section slug, or "" for the cover. */
  slug: string;
  urls: string[];
}

// ------------------------------------------------------------------ loading --

const cache = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(url: string): Promise<HTMLImageElement | null> {
  const hit = cache.get(url);
  if (hit) return hit;

  const job = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    // Required: a canvas holding a cross-origin image cannot become a WebGL
    // texture unless the image was fetched with CORS.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

  cache.set(url, job);
  return job;
}

// ----------------------------------------------------------------- drawing --

function cover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

/** A thin black rebate — the film edge the whole site puts around a frame. */
function rebate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = "#0a0908";
  ctx.lineWidth = 6;
  ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
}

/**
 * A plain rule.
 *
 * This was a band of chevrons — the dentelle course from Great Zimbabwe — but
 * at the size a page actually renders it read as a row of triangles sitting on
 * top of the work rather than as part of the printing. A single hairline does
 * the same structural job and lets the photography be the only pattern on the
 * page.
 */
function rule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Solid disc with tapered rays — the device from the collage reference. */
function sunDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";

  const rays = 24;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const outer = r * (i % 3 === 0 ? 1.72 : i % 2 === 0 ? 1.46 : 1.3);
    ctx.lineWidth = r * 0.075;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 1.12, cy + Math.sin(a) * r * 1.12);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Print grain.
 *
 * Flat colour on a page reads as a screen rather than as paper, and the whole
 * conceit is that this is a printed book. A little noise is the difference.
 */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const patch = document.createElement("canvas");
  patch.width = 160;
  patch.height = 160;
  const pctx = patch.getContext("2d");
  if (!pctx) return;

  const data = pctx.createImageData(160, 160);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 255;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  pctx.putImageData(data, 0, 0);

  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = "overlay";
  const pattern = ctx.createPattern(patch, "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

function setType(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: number,
  mono = false,
  tracking = 0
) {
  const family = mono
    ? "ui-monospace, SFMono-Regular, Menlo, monospace"
    : "system-ui, -apple-system, 'Helvetica Neue', sans-serif";
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.letterSpacing = `${tracking}px`;
}

/** Wraps to the given width and returns how far down the text ran. */
function paragraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = "";
  let cursor = y;

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      cursor += lineHeight;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursor);
    cursor += lineHeight;
  }
  return cursor;
}

// ------------------------------------------------------------------- pages --

export function drawPage(
  canvas: HTMLCanvasElement,
  spec: PageSpec,
  images: (HTMLImageElement | null)[]
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = ART_W;
  canvas.height = ART_H;

  const onDark = spec.ground === "red";
  const ground = onDark ? PAPER.red : PAPER.stock;
  const type = onDark ? PAPER.stock : PAPER.ink;
  const dim = onDark ? "rgba(242,237,227,0.62)" : "rgba(17,17,17,0.55)";

  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, ART_W, ART_H);

  const gutter = ART_W * GUTTER;
  const m = ART_W * 0.072;
  const left = gutter + m;
  const right = ART_W - m;
  const width = right - left;

  const shots = images.filter(Boolean) as HTMLImageElement[];
  ctx.textBaseline = "alphabetic";

  if (spec.kind === "title") {
    // The cover.
    //
    // It was flat red with type on it, which is a colour swatch rather than a
    // cover. The portrait now fills the lower two thirds, screened hard into
    // the red so it reads as one printed surface instead of a photograph
    // pasted on — the ink is the same ink, and the grain runs across both.
    const portrait = shots[0];
    if (portrait) {
      const py = ART_H * 0.3;
      const ph = ART_H - py;

      ctx.save();
      // Multiply drops the photograph's own colour and lets the ground burn
      // through it, which is what a two-colour press would do with it.
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.92;
      cover(ctx, portrait, 0, py, ART_W, ph);
      ctx.restore();

      // Screened back in on top, so the highlights come back and the face does
      // not disappear into the red.
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.5;
      cover(ctx, portrait, 0, py, ART_W, ph);
      ctx.restore();

      // The photograph is torn into the page rather than cropped to a box: a
      // ragged edge across the top of it, drawn as one path.
      ctx.save();
      ctx.fillStyle = ground;
      ctx.beginPath();
      ctx.moveTo(0, py);
      let tear = py;
      for (let x = 0; x <= ART_W; x += 26) {
        // Deterministic wobble — the same tear on every load.
        tear = py + Math.sin(x * 0.031) * 14 + Math.cos(x * 0.0117) * 9;
        ctx.lineTo(x, tear);
      }
      ctx.lineTo(ART_W, py - 120);
      ctx.lineTo(0, py - 120);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    sunDisc(ctx, right - 78, m + 210, 46, "rgba(242,237,227,0.82)");

    // The name sits over the top of the picture, which is what gives the cover
    // its depth — type in front, portrait behind, one ground under both.
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = PAPER.stock;
    setType(ctx, 152, 900, false, -4);
    ctx.fillText("NESH", left, ART_H * 0.5);
    ctx.fillText("VIDEO", left, ART_H * 0.5 + 142);
    ctx.restore();

    // Knocked back so the second word reads as a shadow of the first.
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(227,37,27,0.9)";
    setType(ctx, 152, 900, false, -4);
    ctx.fillText("VIDEO", left, ART_H * 0.5 + 142);
    ctx.restore();

    rule(ctx, left, ART_H * 0.5 + 186, width * 0.42, 4, PAPER.gold);

    ctx.fillStyle = "rgba(242,237,227,0.95)";
    setType(ctx, 29, 600);
    paragraph(ctx, spec.intro, left, ART_H * 0.5 + 248, width * 0.8, 40);
  } else if (spec.kind === "poster") {
    if (shots[0]) {
      const ph = ART_H * 0.52;
      const py = ART_H * 0.26;
      ctx.save();
      ctx.globalAlpha = 0.66;
      cover(ctx, shots[0], left, py, width, ph);
      ctx.restore();
      rebate(ctx, left, py, width, ph);
    }

    ctx.fillStyle = PAPER.stock;
    setType(ctx, 116, 900, false, -3);
    ctx.fillText(spec.index, left, m + 118);

    setType(ctx, 66, 900, false, -1.5);
    ctx.fillText(`${spec.title}${spec.tail}`, left, ART_H - m - 92);

    ctx.fillStyle = "rgba(242,237,227,0.78)";
    setType(ctx, 25, 500);
    paragraph(ctx, spec.intro, left, ART_H - m - 44, width * 0.9, 34);

    rule(ctx, left, ART_H - m - 20, width, 3, onDark ? "rgba(242,237,227,0.5)" : PAPER.red);
  } else if (spec.kind === "plate") {
    if (shots[0]) {
      const side = Math.min(width, ART_H * 0.6);
      const px = left + (width - side) / 2;
      const py = m + 40;
      cover(ctx, shots[0], px, py, side, side);
      rebate(ctx, px, py, side, side);
    }

    rule(ctx, left, ART_H - m - 190, width, 3, onDark ? "rgba(242,237,227,0.5)" : PAPER.red);

    ctx.fillStyle = type;
    setType(ctx, 54, 900, false, -1.2);
    ctx.fillText(`${spec.title}${spec.tail}`, left, ART_H - m - 118);

    ctx.fillStyle = dim;
    setType(ctx, 23, 500);
    paragraph(ctx, spec.intro, left, ART_H - m - 74, width * 0.92, 32);
  } else if (spec.kind === "contact") {
    // A proof sheet off the light box.
    const cols = 3;
    const rows = 4;
    const gap = 14;
    const cw = (width - gap * (cols - 1)) / cols;
    const ch = (ART_H * 0.68 - gap * (rows - 1)) / rows;
    const top = m + 18;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n = r * cols + c;
        const x = left + c * (cw + gap);
        const y = top + r * (ch + gap);

        if (shots[n]) {
          cover(ctx, shots[n], x, y, cw, ch);
          ctx.strokeStyle = "rgba(10,9,8,0.9)";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, cw, ch);
        } else {
          ctx.fillStyle = onDark ? "rgba(242,237,227,0.06)" : "rgba(17,17,17,0.05)";
          ctx.fillRect(x, y, cw, ch);
        }

        ctx.fillStyle = "rgba(10,9,8,0.62)";
        ctx.fillRect(x + 4, y + ch - 20, 28, 16);
        ctx.fillStyle = "rgba(242,237,227,0.95)";
        setType(ctx, 11, 700, true, 1);
        ctx.fillText(String(n + 1).padStart(2, "0"), x + 8, y + ch - 8);
      }
    }

    rule(ctx, left, ART_H - m - 128, width, 3, onDark ? "rgba(242,237,227,0.5)" : PAPER.red);

    ctx.fillStyle = type;
    setType(ctx, 46, 900, false, -1);
    ctx.fillText(`${spec.title}${spec.tail}`, left, ART_H - m - 62);

    ctx.fillStyle = dim;
    setType(ctx, 22, 500);
    paragraph(ctx, spec.intro, left, ART_H - m - 26, width * 0.92, 30);
  } else if (spec.kind === "hero") {
    if (shots[0]) {
      const hh = ART_H * 0.6;
      const hy = m + 30;
      cover(ctx, shots[0], left, hy, width, hh);
      rebate(ctx, left, hy, width, hh);
    }

    rule(ctx, left, ART_H - m - 200, width, 3, onDark ? "rgba(242,237,227,0.5)" : PAPER.red);

    ctx.fillStyle = type;
    setType(ctx, 58, 900, false, -1.3);
    ctx.fillText(`${spec.title}${spec.tail}`, left, ART_H - m - 126);

    ctx.fillStyle = dim;
    setType(ctx, 24, 500);
    paragraph(ctx, spec.intro, left, ART_H - m - 82, width * 0.92, 33);
  } else {
    // "grid" — the six-up from the reference spread.
    const cols = 2;
    const rows = 3;
    const gap = 18;
    const cw = (width - gap) / cols;
    const ch = (ART_H * 0.7 - gap * (rows - 1)) / rows;
    const top = m + 16;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n = r * cols + c;
        const x = left + c * (cw + gap);
        const y = top + r * (ch + gap);

        if (shots[n]) {
          cover(ctx, shots[n], x, y, cw, ch);
          rebate(ctx, x, y, cw, ch);
        } else {
          ctx.fillStyle = onDark ? "rgba(242,237,227,0.06)" : "rgba(17,17,17,0.05)";
          ctx.fillRect(x, y, cw, ch);
        }
      }
    }

    rule(ctx, left, ART_H - m - 170, width, 3, onDark ? "rgba(242,237,227,0.5)" : PAPER.red);

    ctx.fillStyle = type;
    setType(ctx, 52, 900, false, -1.2);
    ctx.fillText(`${spec.title}${spec.tail}`, left, ART_H - m - 96);

    ctx.fillStyle = dim;
    setType(ctx, 23, 500);
    paragraph(ctx, spec.intro, left, ART_H - m - 54, width * 0.92, 32);
  }

  // Folio, bottom of the gutter side, the way a printed book numbers itself.
  if (spec.kind !== "title") {
    ctx.fillStyle = onDark ? "rgba(242,237,227,0.5)" : "rgba(17,17,17,0.42)";
    setType(ctx, 18, 700, true, 2);
    ctx.fillText(spec.index, gutter * 0.42, ART_H - m);
  }

  grain(ctx, ART_W, ART_H, onDark ? 0.05 : 0.085);
}

// ------------------------------------------------------------------ wiring --

/**
 * The portrait on the cover.
 *
 * A local file rather than a CMS row: it is the one picture on the site that
 * is not a piece of work, so it does not belong in the catalogue. Drop a
 * replacement at this path and the cover takes it. If it is missing the cover
 * falls back to type on flat red, which is what it was before.
 */
const COVER_PORTRAIT = "/media/portrait.jpg";

/** Which page shows which section, and how it is printed. */
const PLAN: Record<string, { slug: string; take: number; skip: number }> = {
  title: { slug: "", take: 0, skip: 0 },
  "directing-hero": { slug: "directing", take: 1, skip: 0 },
  "directing-grid": { slug: "directing", take: 6, skip: 1 },
  "photography-plate": { slug: "photography", take: 1, skip: 0 },
  "photography-contact": { slug: "photography", take: 12, skip: 1 },
  "videography-hero": { slug: "videography", take: 1, skip: 0 },
  "videography-grid": { slug: "videography", take: 6, skip: 1 },
  "production-hero": { slug: "production", take: 1, skip: 0 },
  "production-grid": { slug: "production", take: 6, skip: 1 },
  colophon: { slug: "*", take: 12, skip: 0 },
};

/**
 * Every still a section owns: each piece's thumbnail first, then a round of one
 * gallery frame from each. Concatenating the galleries instead would fill a
 * contact sheet with whichever shoot happened to have the most frames.
 */
function poolFor(pieces: PortfolioPiece[], slug: string): string[] {
  const rows = pieces.filter(
    (p) => !p.coming_soon && p.image_url && (slug === "*" || p.category === slug)
  );

  const out = rows.map((p) => p.image_url as string);
  const galleries = rows.map((p) => p.images.map((i) => i.url).filter(Boolean));
  const deepest = Math.max(0, ...galleries.map((g) => g.length));

  for (let round = 0; round < deepest; round++) {
    for (const gallery of galleries) {
      if (gallery[round]) out.push(gallery[round]);
    }
  }

  // A thumbnail is usually also the first frame of its own gallery.
  return [...new Set(out)];
}

function specFor(face: Face, pieces: PortfolioPiece[]): PageSpec {
  const plan = PLAN[face.id] ?? { slug: "*", take: 6, skip: 0 };
  const chapter = CHAPTERS.find((c) => c.slug === plan.slug) ?? CHAPTERS[0];

  const available = plan.slug ? poolFor(pieces, plan.slug) : [];
  const start = available.length ? plan.skip % available.length : 0;
  const rotated = [...available.slice(start), ...available.slice(0, start)];

  return {
    id: face.id,
    kind: face.layout.kind,
    ground: (face.layout.ground ?? "paper") as Ground,
    index: chapter.index,
    title: chapter.title,
    tail: chapter.tail,
    intro: chapter.intro,
    slug: plan.slug,
    urls: face.layout.kind === "title" ? [COVER_PORTRAIT] : rotated.slice(0, plan.take),
  };
}

/**
 * Draws every page the binder needs. Resolves once, with a canvas per face —
 * the caller turns them into textures.
 */
export async function buildPages(
  pieces: PortfolioPiece[]
): Promise<Map<string, HTMLCanvasElement>> {
  const faces: Face[] = SHEETS.flatMap((s) => [s.front, s.back]);

  // Type has to be ready before anything is set, or the first draw lands in a
  // fallback face and the texture keeps it for good.
  try {
    await document.fonts.ready;
  } catch {
    /* older browsers just draw in whatever is loaded */
  }

  const out = new Map<string, HTMLCanvasElement>();

  await Promise.all(
    faces.map(async (face) => {
      const spec = specFor(face, pieces);
      const images = await Promise.all(spec.urls.map(loadImage));
      const canvas = document.createElement("canvas");
      drawPage(canvas, spec, images);
      out.set(face.id, canvas);
    })
  );

  return out;
}
