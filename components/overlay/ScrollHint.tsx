"use client";

import { useActiveSpread } from "./useActiveSpread";

/** Fades out for good once the reader has turned the first page. */
export function ScrollHint() {
  const active = useActiveSpread();

  return (
    <p className={`hint${active > 0 ? " is-gone" : ""}`} aria-hidden={active > 0}>
      <span className="hint__rule" />
      Scroll to turn
    </p>
  );
}
