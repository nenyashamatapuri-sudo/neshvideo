"use client";

import { SPREAD_COUNT } from "@/lib/spreads";
import { jumpToSpread } from "@/lib/scroll";
import { play } from "@/lib/audio";
import { useActiveSpread } from "./useActiveSpread";

/**
 * The invitation to turn the page.
 *
 * A binder that only responds to scroll is a binder most people will look at
 * once and leave, because nothing on screen says it moves. So the hint says
 * what to do, shows how many spreads there are to get through, and is itself a
 * button — clicking it turns to the next one.
 *
 * It retires once the reader has turned a page under their own steam: by then
 * the point is made, and a permanent prompt is nagging.
 */
export function ScrollHint() {
  const active = useActiveSpread();
  const gone = active > 0;
  const last = SPREAD_COUNT - 1;

  return (
    <button
      type="button"
      className={`hint${gone ? " is-gone" : ""}`}
      onClick={() => {
        play("tick");
        jumpToSpread(Math.min(active + 1, last));
      }}
      tabIndex={gone ? -1 : 0}
      aria-hidden={gone}
    >
      <span className="hint__rule" />
      <span className="hint__say">
        Scroll to turn
        <span className="hint__count">
          {last} spreads
        </span>
      </span>
      <span className="hint__chev" aria-hidden="true" />
    </button>
  );
}
