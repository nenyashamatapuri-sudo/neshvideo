"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { SECTIONS, SPREAD_COUNT } from "@/lib/spreads";
import { SCROLL_TAIL, startScrollTracking } from "@/lib/scroll";
import type { PortfolioPiece } from "@/lib/supabase";
import { Intro } from "./Intro";
import { Nav } from "./overlay/Nav";
import { ScrollRail } from "./overlay/ScrollRail";
import { ScrollHint } from "./overlay/ScrollHint";

// WebGL has no business running on the server, and skipping SSR for it keeps
// the first paint to the (fully readable) editorial layer.
const BinderCanvas = dynamic(
  () => import("./binder/BinderCanvas").then((m) => m.BinderCanvas),
  { ssr: false }
);

/**
 * The homepage.
 *
 * Everything that used to be set in HTML over the top of the binder — the
 * masthead, the standfirst, the section blurb, the contact strip — is now
 * printed on the pages themselves. Two typographic systems arguing across one
 * screen is what made it feel like two websites; there is only the book now,
 * and the bar you steer it with.
 */
export function HomeExperience({ pieces }: { pieces: PortfolioPiece[] }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  /**
   * Clicking the open spread goes to the section it is showing.
   *
   * Spread 0 is the cover, which stands for no section — clicking it turns to
   * the first one instead, which is what somebody prodding the cover of a book
   * is asking for.
   */
  const openSpread = useCallback(
    (spread: number) => {
      const section = SECTIONS[Math.max(0, spread - 1)];
      if (section) router.push(section.href);
    },
    [router]
  );

  useEffect(() => {
    const stop = startScrollTracking();
    // One frame's grace so the accent colour doesn't flash in on load.
    const id = requestAnimationFrame(() => setReady(true));
    return () => {
      stop();
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    <div className={`shell${ready ? " is-ready" : ""}`}>
      <Intro />
      {/* Pinned stage: nothing in here scrolls, it responds to scroll. */}
      <div className="stage">
        <BinderCanvas pieces={pieces} onOpen={openSpread} />
        <div className="rules" aria-hidden="true" />
        <div className="overlay">
          <Nav />
          <ScrollRail />
          <ScrollHint />
        </div>
      </div>

      {/* The tall element that gives the page something to scroll through. */}
      <div
        className="track"
        style={{ height: `calc(${SPREAD_COUNT - 1 + SCROLL_TAIL} * 100svh + 100svh)` }}
        aria-hidden="true"
      />
    </div>
  );
}
