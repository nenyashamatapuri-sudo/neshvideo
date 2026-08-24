"use client";

import { useEffect } from "react";
import { advance, useThree } from "@react-three/fiber";
import { scroll } from "@/lib/scroll";

/**
 * Development-only hook for driving the binder from the console:
 *
 *   __nesh.seek(2.5)   // park halfway through sheet 2 and render it
 *
 * Needed because headless/hidden browser panes suspend requestAnimationFrame,
 * which stops R3F's loop dead. `advance` runs a frame on demand instead.
 */
export function DevBridge() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const w = window as unknown as Record<string, unknown>;
    w.__nesh = {
      scroll,
      gl,
      scene,
      camera,
      /**
       * Park the binder at turn position `p` and render it. Sets the eased
       * value too, so the result doesn't depend on damping catching up in
       * wall-clock time the stepper doesn't actually have.
       */
      seek(p: number, steps = 4) {
        scroll.target = p;
        scroll.eased = p;
        let t = performance.now();
        for (let i = 0; i < steps; i++) {
          scroll.eased = p;
          t += 16.7;
          advance(t);
        }
        return { target: scroll.target, eased: scroll.eased };
      },
    };
    return () => {
      delete w.__nesh;
    };
  }, [gl, scene, camera]);

  return null;
}
