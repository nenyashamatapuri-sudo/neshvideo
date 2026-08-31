"use client";

import Link from "next/link";

import { CHAPTERS, SPREAD_COUNT } from "@/lib/spreads";
import { jumpToSpread } from "@/lib/scroll";
import { useActiveSpread } from "./useActiveSpread";

/**
 * Section rail down the right edge — position, and a way to skip ahead.
 *
 * It carries About and Contact as well now. The bar across the top of the
 * homepage is gone on a wide screen, and those two were the only things in it
 * that the rail did not already say; without them here they would have no way
 * in at all.
 */
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

      <div className="rail__aside">
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </div>
    </nav>
  );
}
