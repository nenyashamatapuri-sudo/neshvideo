"use client";

import Image from "next/image";
import { contactSheet, frameSrc } from "@/lib/spreads";
import { jumpToSpread } from "@/lib/scroll";
import { useActiveSpread } from "./useActiveSpread";

const SHEET = contactSheet();

/**
 * The contact strip along the foot of the page — a row of frame grabs that
 * doubles as the navigation, the way a filmstrip runs under a magazine spread.
 */
export function ContactStrip() {
  const active = useActiveSpread();

  return (
    <div className="strip">
      <p className="strip__label">
        Contact sheet
        <span>{SHEET.length} frames</span>
      </p>

      <ul className="strip__row">
        {SHEET.map((frame, i) => {
          const isActive = frame.spread === active;
          return (
            <li
              key={frame.id}
              className={`strip__cell${isActive ? " is-active" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => jumpToSpread(frame.spread)}
                aria-label={`Go to spread ${frame.spread}, ${frame.side} page`}
                aria-current={isActive ? "true" : undefined}
              >
                <Image
                  src={frameSrc(frame.id)}
                  alt=""
                  width={160}
                  height={112}
                  sizes="120px"
                  priority={i < 3}
                />
                <span className="strip__cell-no">{String(i + 1).padStart(2, "0")}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
