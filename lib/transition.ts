"use client";

/**
 * The hand-off from the binder to a section.
 *
 * Like the scroll store, this lives outside React: the render loop reads it
 * every frame, and putting it in state would re-render the whole canvas
 * mid-animation — which is exactly when it can least afford it.
 *
 * The idea is that the reader does not cut from one page to another, they go
 * *through* the book. The camera rushes the open spread until the page fills
 * the frame and the ground goes dark; the section fades up out of that. Two
 * screens, one move.
 */

/** How long the dive runs before the route changes, in milliseconds. */
export const DIVE_MS = 620;

export const dive = {
  /** Counting up from 0 to 1 once a section has been asked for. */
  t: 0,
  running: false,
  /** When the dive began, so progress can be read off the clock. */
  startedAt: 0,
};

/**
 * How far along the dive is, by wall clock rather than by counting frames.
 *
 * The route change happens on a `setTimeout`, so the animation has to be on the
 * same clock as that timer. Accumulating frame deltas instead means one stalled
 * frame — a texture decode, a background tab, a slow machine — stretches the
 * dive past the navigation, and the page swaps while the camera is still out at
 * its resting distance.
 */
export function diveProgress(now: number) {
  if (!dive.running) return 0;
  dive.t = Math.min(1, (now - dive.startedAt) / DIVE_MS);
  return dive.t;
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeDive(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const isDiving = () => dive.running;
/** The server has never dived. */
export const isDivingOnServer = () => false;

export function startDive() {
  if (dive.running) return false;
  dive.running = true;
  dive.t = 0;
  dive.startedAt = performance.now();
  for (const fn of listeners) fn();
  return true;
}

/**
 * Back to rest.
 *
 * Needed because a browser back button returns to a homepage whose canvas was
 * left mid-dive — without this the binder would still be jammed against the
 * lens.
 */
export function endDive() {
  if (!dive.running && dive.t === 0) return;
  dive.running = false;
  dive.t = 0;
  dive.startedAt = 0;
  for (const fn of listeners) fn();
}
