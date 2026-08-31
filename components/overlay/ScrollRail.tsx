"use client";

import { CHAPTERS, SPREAD_COUNT } from "@/lib/spreads";
import { jumpToSpread } from "@/lib/scroll";
import { useActiveSpread } from "./useActiveSpread";

/** Section rail down the right edge — position, and a way to skip ahead. */
export function ScrollRail() {
  const active = useActiveSpread();

  return (
    <nav className="rail" aria-label="Sections">
      <ul>
        {Array.from({ length: SPREAD_COUNT }, (_, i) => (
          <li key={i} className={i === active ? "is-active" : undefined}>
            <button type="button" onClick={() => jumpToSpread(i)}>
              <span className="rail__name">
                {CHAPTERS[i].title}
                {CHAPTERS[i].tail}
              </span>
              <span className="rail__tick" />
              <span className="rail__no">{String(i).padStart(2, "0")}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
