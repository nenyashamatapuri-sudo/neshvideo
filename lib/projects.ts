/**
 * The work itself, grouped by section.
 *
 * A project carries three pieces of information and no more: what it is, who
 * it was for, and which agency it came through. Everything else the gallery
 * needs — how big the frame is, how far it drops — comes from `RHYTHM`.
 *
 * These entries are placeholders. Replace them with real projects; point
 * `cover` at any file under public/media/.
 */

import { mediaUrl } from "./media";
import { frameSrc } from "./spreads";
import { IMPORTED } from "./work.generated";

/**
 * What the bulk importer writes. Everything else about a frame — how wide it
 * sits, how far it hangs — is applied here from `RHYTHM`, so the importer only
 * has to know about the work itself.
 */
export interface ImportedProject {
  slug: string;
  title: string;
  client: string;
  agency?: string;
  cover: string;
  /** The picture's own proportions, read off the file at import time. */
  aspect: string;
}

export interface Project {
  slug: string;
  title: string;
  client: string;
  /** Omit for work taken directly, without an agency. */
  agency?: string;
  cover: string;
  /** Columns spanned on a twelve-column grid. */
  span: number;
  /** How far the frame hangs below the top of its row. */
  drop: string;
  aspect: string;
  href?: string;
}

const FRAMES = [
  "directing-hero",
  "directing-grid",
  "photography-plate",
  "photography-contact",
  "videography-hero",
  "videography-grid",
  "production-hero",
  "production-grid",
  "about-1",
  "about-2",
  "about-3",
  "title",
];

/**
 * The shape of the gallery, art-directed rather than random.
 *
 * Frames vary in width, proportion and how far they hang, so a row reads as
 * things laid out by hand rather than as a grid. The phrase is twelve long and
 * projects cycle through it, so any number of entries still composes.
 */
const RHYTHM: Pick<Project, "span" | "drop" | "aspect">[] = [
  { span: 3, drop: "0", aspect: "3 / 4" },
  { span: 2, drop: "5rem", aspect: "4 / 3" },
  { span: 3, drop: "1.5rem", aspect: "3 / 4" },
  { span: 2, drop: "9rem", aspect: "1 / 1" },
  { span: 2, drop: "3rem", aspect: "4 / 5" },
  { span: 3, drop: "11rem", aspect: "3 / 2" },
  { span: 2, drop: "0", aspect: "2 / 3" },
  { span: 3, drop: "6rem", aspect: "16 / 9" },
  { span: 2, drop: "2rem", aspect: "3 / 4" },
  { span: 3, drop: "13rem", aspect: "4 / 3" },
  { span: 2, drop: "7rem", aspect: "1 / 1" },
  { span: 3, drop: "2.5rem", aspect: "5 / 4" },
];

type Entry = [title: string, client: string, agency?: string];

function build(section: string, entries: Entry[]): Project[] {
  return entries.map(([title, client, agency], i) => ({
    slug: `${section}-${i + 1}`,
    title,
    client,
    agency,
    cover: frameSrc(FRAMES[(i * 5) % FRAMES.length]),
    ...RHYTHM[i % RHYTHM.length],
  }));
}

export const PROJECTS: Record<string, Project[]> = {
  directing: build("directing", [
    ["Nightshift", "Corona", "Wieden + Kennedy"],
    ["Hold Still", "Trainline"],
    ["The Long Way Round", "Zalando"],
    ["Paper Houses", "Self-initiated"],
    ["Signal", "Philips"],
    ["Overtime", "Triumph"],
    ["Feverpitch", "Nike", "Wieden + Kennedy"],
    ["Blue Hour", "Self-initiated"],
  ]),
  photography: build("photography", [
    ["Terrace Portraits", "Zalando"],
    ["Studio Sessions", "Triumph"],
    ["Market Days", "Personal"],
    ["Lookbook AW25", "Zalando"],
    ["Backstage", "Nike", "Wieden + Kennedy"],
    ["Cold Open", "Corona"],
    ["Residents", "Personal"],
    ["First Light", "Personal"],
  ]),
  videography: build("videography", [
    ["Founders Series", "Philips", "Wieden + Kennedy"],
    ["Live at the Dock", "Corona", "Wieden + Kennedy"],
    ["Field Notes", "Trainline"],
    ["Product Launch", "Philips", "Wieden + Kennedy"],
    ["Season Opener", "Nike", "Wieden + Kennedy"],
    ["Two Rooms", "Personal"],
    ["Assembly", "Zalando"],
    ["Closing Night", "Triumph"],
  ]),
  production: build("production", [
    ["Spring Campaign", "Nike", "Wieden + Kennedy"],
    ["Brand Film", "Corona", "Wieden + Kennedy"],
    ["Series Launch", "Zalando"],
    ["Live Broadcast", "Trainline"],
    ["Product Story", "Philips", "Wieden + Kennedy"],
    ["Lookbook Shoot", "Triumph"],
    ["Festival Unit", "Corona"],
    ["Studio Build", "Nike", "Wieden + Kennedy"],
  ]),
};

/**
 * Real work wins.
 *
 * If `npm run import` has put anything in a section, that is what the gallery
 * shows; the placeholders below stay only for sections still waiting on files,
 * so the site is never broken halfway through a migration.
 *
 * Span and drop come from `RHYTHM` — the layout rhythm is the site's, not the
 * importer's — but the aspect ratio is the photograph's own, so nothing gets
 * cropped to a shape it was never framed for.
 */
export function projectsFor(slug: string): Project[] {
  const imported = IMPORTED[slug] ?? [];
  if (imported.length > 0) {
    return imported.map((p, i) => ({
      ...p,
      // Stored relative, resolved here — so the catalogue is unaffected by
      // whether a CDN is configured.
      cover: mediaUrl(p.cover),
      span: RHYTHM[i % RHYTHM.length].span,
      drop: RHYTHM[i % RHYTHM.length].drop,
    }));
  }
  return PROJECTS[slug] ?? [];
}
