"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { SPREAD_COUNT } from "@/lib/spreads";
import { SCROLL_TAIL, startScrollTracking } from "@/lib/scroll";
import { Intro } from "./Intro";
import { Nav } from "./overlay/Nav";
import { Masthead } from "./overlay/Masthead";
import { ContactStrip } from "./overlay/ContactStrip";
import { ScrollRail } from "./overlay/ScrollRail";
import { ScrollHint } from "./overlay/ScrollHint";

// WebGL has no business running on the server, and skipping SSR for it keeps
// the first paint to the (fully readable) editorial layer.
const BinderCanvas = dynamic(
  () => import("./binder/BinderCanvas").then((m) => m.BinderCanvas),
  { ssr: false }
);

export function HomeExperience() {
  const [ready, setReady] = useState(false);

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
        <BinderCanvas />
        <div className="rules" aria-hidden="true" />
        <div className="overlay">
          <Nav />
          <Masthead />
          <ScrollRail />
          <ScrollHint />
          <ContactStrip />
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
