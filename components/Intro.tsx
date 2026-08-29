"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { ArriflexSR3, MamiyaRZ67 } from "./Ornament";

/**
 * The two cameras the work is made on: stills, then motion.
 *
 * Unlabelled on purpose. The marks carry it — anyone who recognises an RZ67
 * needed no caption, and anyone who does not was only being handed two model
 * numbers on the way into a portfolio.
 */
const RIG = [
  { key: "rz67", label: "Mamiya RZ67", Art: MamiyaRZ67 },
  { key: "sr3", label: "Arriflex SR3", Art: ArriflexSR3 },
];
const RUN_MS = 2200;
const LIFT_MS = 900;
const KEY = "nesh:intro-seen";

/*
 * "Has the curtain already been raised this session?" is state that lives
 * outside React — in sessionStorage — so it is read through an external store
 * rather than copied into state inside an effect. That keeps the very first
 * render correct on both server and client: the server always says "not yet",
 * and a returning visitor's browser says "already", before anything paints.
 */
const listeners = new Set<() => void>();

function hasSeen() {
  try {
    return sessionStorage.getItem(KEY) !== null;
  } catch {
    return false; // private mode, or storage disabled
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* nothing to do — it just plays again next time */
  }
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * The opening: the two cameras set down side by side, then the curtain lifts
 * on the binder.
 *
 * Three rules it follows, because an intro that ignores them is a liability
 * rather than a flourish:
 *
 *  - It plays **once a session**. Nobody should sit through it every visit.
 *  - It is **skippable** by click, key or scroll — the moment someone signals
 *    they want to get on with it, it gets out of the way.
 *  - It **honours reduced motion**, collapsing to a brief hold and a fade.
 */
export function Intro() {
  const seen = useSyncExternalStore(subscribe, hasSeen, () => false);
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => setLeaving(true), []);

  useEffect(() => {
    if (seen) return;

    // Second phase: the curtain is lifting; retire it once it is clear.
    if (leaving) {
      const timer = window.setTimeout(markSeen, LIFT_MS);
      return () => window.clearTimeout(timer);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(finish, reduced ? 700 : RUN_MS);

    // Any signal that the visitor wants to move on ends it early.
    const opts = { passive: true } as const;
    window.addEventListener("pointerdown", finish, opts);
    window.addEventListener("keydown", finish);
    window.addEventListener("wheel", finish, opts);
    window.addEventListener("touchstart", finish, opts);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
      window.removeEventListener("wheel", finish);
      window.removeEventListener("touchstart", finish);
    };
  }, [seen, leaving, finish]);

  if (seen) return null;

  return (
    <div className={`intro${leaving ? " is-leaving" : ""}`} aria-hidden="true">
      <div className="intro__rig">
        {RIG.map(({ key, label, Art }) => (
          <figure className="intro__camera" key={key}>
            {/* The name stays as the accessible name and nowhere else. */}
            <Art className="intro__art" />
            <figcaption className="sr-only">{label}</figcaption>
          </figure>
        ))}
      </div>
      <div className="intro__rule flag-rule" />
    </div>
  );
}
