"use client";

import { useEffect, useRef } from "react";

import { damp, scroll } from "@/lib/scroll";

/**
 * The wall the binder is photographed against.
 *
 * Flat black made the book look like it was floating in a void. This puts
 * something behind it — a sun and its halo, a cold field under it, and enough
 * grain that the whole frame reads as printed rather than rendered. It is
 * deliberately dim: the work is the subject, and a backdrop that competes with
 * a photograph is a backdrop that has failed.
 *
 * Everything here is drawn in CSS from the site's own four colours. It moves,
 * slowly, against the scroll and the pointer — enough parallax to sit at a
 * different depth from the binder, not enough to notice as an effect.
 */
export function Backdrop() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !root.current) return;

    let raf = 0;
    let last = performance.now();
    // Damped rather than tracking directly, so the wall lags the book slightly
    // the way a far plane does.
    let x = 0;
    let y = 0;
    let turn = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      x = damp(x, scroll.pointerX, 1.6, dt);
      y = damp(y, scroll.pointerY, 1.6, dt);
      turn = damp(turn, scroll.eased, 2.2, dt);

      const el = root.current;
      if (el) {
        el.style.setProperty("--bx", `${x * -2.4}%`);
        el.style.setProperty("--by", `${y * -1.8 - turn * 2.6}%`);
        el.style.setProperty("--spin", `${turn * 9}deg`);
        // The sun burns down as the reader gets further into the book.
        el.style.setProperty("--heat", String(Math.max(0.35, 1 - turn * 0.16)));
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="backdrop" ref={root} aria-hidden="true">
      <div className="backdrop__field" />
      <div className="backdrop__rays" />
      <div className="backdrop__sun" />
      <div className="backdrop__grain" />
    </div>
  );
}
