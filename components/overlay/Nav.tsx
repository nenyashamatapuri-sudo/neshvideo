"use client";

import Link from "next/link";
import { SECTIONS, SPREAD_COUNT } from "@/lib/spreads";
import { useActiveSpread } from "./useActiveSpread";

export function Nav() {
  const active = useActiveSpread();

  return (
    <header className="nav">
      <Link className="nav__mark" href="/">
        NESH<span>.</span>
      </Link>

      <nav className="nav__links" aria-label="Sections">
        {SECTIONS.map((s, i) => (
          // The spread index, so the bar and the binder are numbered alike.
          <Link key={s.slug} href={s.href} data-active={active === i + 1 || undefined}>
            <span className="nav__no">{String(i + 1).padStart(2, "0")}</span>
            <span className="nav__name">
              {s.title}
              {s.tail}
            </span>
          </Link>
        ))}
      </nav>

      <div className="nav__end">
        <Link className="nav__aside" href="/about">
          About
        </Link>
        <p className="nav__counter" aria-live="polite">
          <span className="nav__counter-now">{String(active).padStart(2, "0")}</span>
          <span className="nav__counter-rule" />
          <span className="nav__counter-all">{String(SPREAD_COUNT - 1).padStart(2, "0")}</span>
        </p>
      </div>
    </header>
  );
}
