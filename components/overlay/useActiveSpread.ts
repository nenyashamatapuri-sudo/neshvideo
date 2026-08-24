"use client";

import { useSyncExternalStore } from "react";
import { getActiveIndex, getServerActiveIndex, subscribeActiveIndex } from "@/lib/scroll";

/**
 * The current spread, as an integer. Changes six times across the whole page,
 * so the overlay re-renders six times — the smooth motion is all CSS and WebGL.
 */
export function useActiveSpread() {
  return useSyncExternalStore(subscribeActiveIndex, getActiveIndex, getServerActiveIndex);
}
