"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import { SECTIONS, SPREAD_COUNT } from "@/lib/spreads";
import { jumpToSpread } from "@/lib/scroll";
import { useActiveSpread } from "./useActiveSpread";

/** Long enough for the sheets to settle on the spread before the page changes. */
const FLIP_MS = 900;

export function Nav() {
  const active = useActiveSpread();
  const router = useRouter();
  const pending = useRef<number | null>(null);

  /**
   * Turn the binder to the section, then go there.
   *
   * Clicking a section name and being thrown straight into it wastes the one
   * piece of navigation the homepage actually has: the reader never sees which
   * spread they asked for. So the binder flips first and the route follows.
   * Modified clicks and reduced-motion users skip the flourish entirely.
   */
  const openSection = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, spread: number, href: string) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      e.preventDefault();
      if (pending.current !== null) return;

      jumpToSpread(spread);
      router.prefetch(href);
      pending.current = window.setTimeout(() => {
        pending.current = null;
        router.push(href);
      }, FLIP_MS);
    },
    [router]
  );

  return (
    <header className="nav">
      <Link className="nav__mark" href="/">
        NESH<span>.</span>
      </Link>

      <nav className="nav__links" aria-label="Sections">
        {SECTIONS.map((s, i) => (
          // The spread index, so the bar and the binder are numbered alike.
          <Link
            key={s.slug}
            href={s.href}
            data-active={active === i + 1 || undefined}
            onClick={(e) => openSection(e, i + 1, s.href)}
            // Turning the binder on hover would fight the reader's scroll, so
            // the invitation is in the type: it lifts, and the rule fills.
            onMouseEnter={() => router.prefetch(s.href)}
          >
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
        <Link className="nav__aside" href="/contact">
          Contact
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
