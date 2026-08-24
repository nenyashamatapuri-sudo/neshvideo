"use client";

import Link from "next/link";
import { CHAPTERS, chapterFrameSrc } from "@/lib/spreads";
import { useActiveSpread } from "./useActiveSpread";

/**
 * The editorial layer: section number, oblique masthead, one line, one number,
 * and the way in.
 *
 * Deliberately spare. The homepage's job is to say what this is and what the
 * work covers — the arguing is done on the section pages, which have room for
 * it.
 *
 * Kept in HTML rather than baked into the 3D pages so the type stays vector
 * sharp at any zoom and remains real, selectable, indexable text.
 */
export function Masthead() {
  const active = useActiveSpread();
  const chapter = CHAPTERS[active];

  return (
    // key forces a remount so the reveal animation replays on every spread.
    <div
      className="masthead"
      key={chapter.index}
      // The photograph the masthead is cut out of. Falls back to flat red
      // wherever background-clip: text isn't supported.
      style={{ "--fill": `url(${chapterFrameSrc(active)})` } as React.CSSProperties}
    >
      <p className="masthead__kicker">
        <span className="masthead__index">{chapter.index}</span>
        {chapter.kicker}
      </p>

      <h1 className="masthead__title">
        <span className="masthead__word">{chapter.title}</span>
        <span className="masthead__word">{chapter.tail}</span>
      </h1>

      <div className="masthead__foot">
        <p className="masthead__blurb">
          {chapter.intro}
          {/* One number, so the reader knows the section has depth. */}
          <span className="masthead__count">{chapter.stats[0]}</span>
        </p>

        <Link className="cta" href={chapter.href}>
          <span>{chapter.cta}</span>
          <svg viewBox="0 0 24 12" aria-hidden="true">
            <path d="M0 6h21M16 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
