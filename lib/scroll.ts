"use client";

import { SPREAD_COUNT } from "./spreads";

/**
 * Scroll state lives outside React on purpose.
 *
 * The binder reads `eased` every frame inside `useFrame`, which would be a
 * disaster as React state — it would re-render the whole canvas 60 times a
 * second. Instead the DOM scroll handler writes `target` here, the render loop
 * damps `eased` toward it, and React only ever hears about the *integer*
 * spread index changing, which happens six times in the whole page.
 */

/** How far the binder has turned, in spreads. 2.5 = halfway through sheet 2. */
export const scroll = {
  target: 0,
  eased: 0,
  /** Pointer in normalized device coords, for the parallax tilt. */
  pointerX: 0,
  pointerY: 0,
};

export const MAX_TURN = SPREAD_COUNT - 1;

/** Scroll distance allotted per spread, plus a tail so the last one can rest. */
export const SCROLL_SPREADS = SPREAD_COUNT;
export const SCROLL_TAIL = 0.6;

type Listener = () => void;
const listeners = new Set<Listener>();
let activeIndex = 0;

export function subscribeActiveIndex(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getActiveIndex = () => activeIndex;
/** Server render always starts on the cover. */
export const getServerActiveIndex = () => 0;

function setActiveIndex(next: number) {
  if (next === activeIndex) return;
  activeIndex = next;
  for (const fn of listeners) fn();
}

/** Scroll position that puts spread `i` front and centre. */
export function scrollTopForSpread(i: number) {
  return i * window.innerHeight;
}

export function jumpToSpread(i: number, behavior: ScrollBehavior = "smooth") {
  window.scrollTo({ top: scrollTopForSpread(i), behavior });
}

/** Wire the window scroll + pointer to the store. Returns a cleanup function. */
export function startScrollTracking() {
  const read = () => {
    const vh = window.innerHeight || 1;
    scroll.target = Math.min(MAX_TURN, Math.max(0, window.scrollY / vh));
    setActiveIndex(Math.round(scroll.target));
  };

  const onPointer = (e: PointerEvent) => {
    scroll.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    scroll.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
  };

  read();
  scroll.eased = scroll.target;

  window.addEventListener("scroll", read, { passive: true });
  window.addEventListener("resize", read);
  window.addEventListener("pointermove", onPointer, { passive: true });

  return () => {
    window.removeEventListener("scroll", read);
    window.removeEventListener("resize", read);
    window.removeEventListener("pointermove", onPointer);
  };
}

/** Frame-rate independent damping — the same curve the canvas uses. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
