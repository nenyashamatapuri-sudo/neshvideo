/**
 * Single source of truth for the binder's contents.
 *
 * The homepage, the section pages and the placeholder generator all read this
 * file, so editing a section here changes the 3D pages, the contact strip, the
 * masthead and the navigation at once.
 *
 * ── Putting your own work in ───────────────────────────────────────────────
 * Every face points at two images by `id`:
 *   public/media/pages/<id>.jpg   the printed page seen on the binder (900×1274)
 *   public/media/frames/<id>.jpg  the bare photo, used everywhere else
 * Drop your own files at those paths using the same names and they take over.
 * Page art needs no alpha — the ring holes are cut by a shared mask — but keep
 * the gutter tenth clear: the right edge on left-hand pages, the left edge on
 * right-hand ones.
 */

import { MEDIA_EXT } from "./media-ext.ts";
import { mediaUrl } from "./media.ts";

/**
 * Red, black, paper — and gold.
 *
 * Gold is the fourth and last colour, and it is rationed: ornament, folios and
 * the chevron bands only, never photography and never body copy. It is here
 * because the work has Zimbabwean roots, and red-black-gold is the palette
 * that language is actually built in.
 */
export const PAPER = {
  /** Warm uncoated stock, as in the reference programme. */
  stock: "#F2EDE3",
  ink: "#111111",
  red: "#E3251B",
  gold: "#E9A733",
  goldDeep: "#B8791C",
  green: "#0E7A3C",
  white: "#FFFFFF",
} as const;

/**
 * How a section's photography is graded. Three stops, the way a film stock
 * behaves: shadows, midtones and highlights each carry their own hue.
 *
 * The design system stays red, white and black — this is the photography, and
 * photographs are allowed to be in colour.
 */
export interface Tone {
  shadow: string;
  mid: string;
  highlight: string;
  /** The saturated mass dropped into frame so the eye has somewhere to go. */
  prop: string;
  contrast?: number;
  mix?: number;
}

/**
 * How a page is printed.
 *  title   — the opening statement page: flat red, rules, the section index
 *  hero    — one wide still under a credit block
 *  grid    — a six-up of stills with a standfirst, as on the reference spread
 *  plate   — a single medium-format frame, rebate and all
 *  contact — a proof sheet of 6×6 frames off the light box
 *  poster  — a halftone screen of one frame on flat red, and almost nothing else
 */
export type LayoutKind = "title" | "hero" | "grid" | "plate" | "contact" | "poster";

export interface Layout {
  kind: LayoutKind;
  /** Ground colour behind the image. Defaults to paper stock. */
  ground?: "paper" | "red" | "ink";
}

/** What the placeholder generator draws. Ignored once real photos are in. */
export type Scene = "figure" | "arch" | "land" | "detail";

/** One side of one physical sheet of paper. */
export interface Face {
  id: string;
  seed: number;
  tone: Tone;
  scene: Scene;
  layout: Layout;
}

export interface Sheet {
  front: Face;
  back: Face;
}

/** A discipline. One spread of the binder, one page of the site. */
export interface Chapter {
  index: string;
  slug: string;
  kicker: string;
  /** The masthead is split so it can break across two lines. */
  title: string;
  tail: string;
  /** One short line, all the homepage says. Keep it under about ten words. */
  intro: string;
  /** The longer version, used on the section page where there is room. */
  blurb: string;
  /** The overview line — what is actually in this section. */
  stats: string[];
  /** Label on the button into the section. */
  cta: string;
  href: string;
}

/** Cool shadows, warm skin, cream highlights — a daylight negative. */
const PLATE: Tone = {
  shadow: "#12202B",
  mid: "#8A6350",
  highlight: "#F5E9DA",
  prop: "#D2321F",
  contrast: 1.24,
  mix: 0.9,
};
/** Flatter and cooler, for stills that sit under type. */
const SOFT: Tone = {
  shadow: "#16232E",
  mid: "#7C6A62",
  highlight: "#EDE6DA",
  prop: "#C4402A",
  contrast: 1.12,
  mix: 0.82,
};
/** Warmer, for the tungsten-lit interiors. */
const WARM: Tone = {
  shadow: "#1C1410",
  mid: "#9A6A44",
  highlight: "#FBEAD2",
  prop: "#E3251B",
  contrast: 1.2,
  mix: 0.88,
};

/**
 * Sheets are physical: turning sheet *k* lifts its front away and lays its back
 * down as the next spread's left page. So spread *k* reads
 * `SHEETS[k-1].back` on the left and `SHEETS[k].front` on the right.
 */
export const SHEETS: Sheet[] = [
  {
    front: { id: "title", seed: 1011, tone: PLATE, scene: "figure", layout: { kind: "title", ground: "red" } },
    back: { id: "directing-hero", seed: 1012, tone: PLATE, scene: "arch", layout: { kind: "poster", ground: "red" } },
  },
  {
    front: { id: "directing-grid", seed: 2021, tone: SOFT, scene: "figure", layout: { kind: "grid" } },
    back: { id: "photography-plate", seed: 2022, tone: WARM, scene: "detail", layout: { kind: "plate" } },
  },
  {
    front: { id: "photography-contact", seed: 3031, tone: PLATE, scene: "figure", layout: { kind: "contact" } },
    back: { id: "videography-hero", seed: 3032, tone: WARM, scene: "arch", layout: { kind: "hero", ground: "ink" } },
  },
  {
    front: { id: "videography-grid", seed: 4041, tone: SOFT, scene: "arch", layout: { kind: "grid" } },
    back: { id: "production-hero", seed: 4042, tone: WARM, scene: "arch", layout: { kind: "poster", ground: "red" } },
  },
  {
    front: { id: "production-grid", seed: 5051, tone: SOFT, scene: "detail", layout: { kind: "grid" } },
    back: { id: "colophon", seed: 5052, tone: PLATE, scene: "land", layout: { kind: "contact", ground: "ink" } },
  },
];

export const CHAPTERS: Chapter[] = [
  {
    index: "00",
    slug: "",
    kicker: "Portfolio — Vol. 01",
    title: "NESH",
    tail: "VIDEO",
    intro: "Director / Photographer / Videographer based in Amsterdam.",
    blurb:
      "Videographer at Wieden + Kennedy, freelance director and photographer. Four sections — directing, photography, videography and production.",
    stats: ["Four sections", "Amsterdam", "Available worldwide"],
    cta: "Start here",
    href: "/work/directing",
  },
  {
    index: "01",
    slug: "directing",
    kicker: "Section 01",
    title: "DIRECT",
    tail: "ING",
    intro: "Narrative, commercial and music video.",
    blurb:
      "Freelance direction across narrative, commercial and music video — from treatment through to the final grade.",
    stats: ["Freelance", "Treatment to grade", "Narrative · Commercial · Music"],
    cta: "View directing",
    href: "/work/directing",
  },
  {
    index: "02",
    slug: "photography",
    kicker: "Section 02",
    title: "PHOTO",
    tail: "GRAPHY",
    intro: "Editorial, portrait and documentary stills.",
    blurb:
      "Editorial, portrait and documentary stills, shot on the Mamiya RZ67 and digital.",
    stats: ["Freelance", "6×7 · Digital", "Editorial · Portrait"],
    cta: "View photography",
    href: "/work/photography",
  },
  {
    index: "03",
    slug: "videography",
    kicker: "Section 03",
    title: "VIDEO",
    tail: "GRAPHY",
    intro: "Camera and edit, in-house and freelance.",
    blurb:
      "Shooting and cutting brand films and campaign work — day to day at Wieden + Kennedy, and freelance alongside it.",
    stats: ["Wieden + Kennedy", "Shoot · Edit", "Brand · Campaign · Doc"],
    cta: "View camera work",
    href: "/work/videography",
  },
  {
    index: "04",
    slug: "production",
    kicker: "Section 04",
    title: "PRODUC",
    tail: "TION",
    intro: "Agency and line producing.",
    blurb:
      "Agency and line producing on commercials and campaigns — keeping shoots on schedule, on budget and on the day.",
    stats: ["Agency & line", "Commercials · Campaigns", "Schedule · Budget · Crew"],
    cta: "View production",
    href: "/work/production",
  },
];

/**
 * Stills that belong to no page — the About collage pulls from these. The
 * generator renders frames for them, but no printed page.
 */
export const EXTRA_FRAMES: Face[] = [
  { id: "about-1", seed: 7011, tone: PLATE, scene: "figure", layout: { kind: "hero" } },
  { id: "about-2", seed: 7022, tone: WARM, scene: "arch", layout: { kind: "hero" } },
  { id: "about-3", seed: 7033, tone: SOFT, scene: "detail", layout: { kind: "hero" } },
];

/** Left / right page art for a given spread. Spread 0 shows only the title. */
export function spreadFaces(index: number): { left: Face | null; right: Face } {
  return {
    left: index > 0 ? SHEETS[index - 1].back : null,
    right: SHEETS[index].front,
  };
}

export const SPREAD_COUNT = CHAPTERS.length;
export const pageSrc = (id: string) => mediaUrl(`/media/pages/${id}.${MEDIA_EXT}`);
export const frameSrc = (id: string) => mediaUrl(`/media/frames/${id}.${MEDIA_EXT}`);

/** Shared greyscale mask that punches the ring holes through every page. */
export const PAGE_MASK_SRC = mediaUrl("/media/page-mask.png");

/**
 * The still that fills a spread's masthead. The right-hand page is the one the
 * reader is looking at, so its photograph is the one the type is cut out of.
 */
export const chapterFrameSrc = (index: number) => frameSrc(spreadFaces(index).right.id);

/** The sections, without the title spread — used for navigation. */
export const SECTIONS = CHAPTERS.filter((c) => c.slug !== "");

export const chapterBySlug = (slug: string) => SECTIONS.find((c) => c.slug === slug);

/** Flat list of every page face in reading order — drives the contact strip. */
export function contactSheet(): { id: string; spread: number; side: "left" | "right" }[] {
  const out: { id: string; spread: number; side: "left" | "right" }[] = [];
  for (let i = 0; i < SPREAD_COUNT; i++) {
    const { left, right } = spreadFaces(i);
    if (left) out.push({ id: left.id, spread: i, side: "left" });
    out.push({ id: right.id, spread: i, side: "right" });
  }
  return out;
}
