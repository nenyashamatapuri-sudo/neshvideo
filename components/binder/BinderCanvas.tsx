"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { buildPages } from "@/lib/page-art";
import type { PortfolioPiece } from "@/lib/supabase";
import { Binder } from "./Binder";
import { DevBridge } from "./DevBridge";
import { StudioEnvironment } from "./Environment";

/**
 * The 3D layer.
 *
 * Holds one piece of state and no more: the drawn pages. Everything it
 * animates is read from the scroll store inside the render loop, so once the
 * art is in, this subtree stops re-rendering.
 *
 * `onOpen` is the one thing that goes back out — the spread the reader
 * clicked, which the shell turns into a route.
 */
export function BinderCanvas({
  pieces,
  onOpen,
}: {
  pieces: PortfolioPiece[];
  onOpen?: (spread: number) => void;
}) {
  const [pages, setPages] = useState<Map<string, HTMLCanvasElement> | null>(null);

  useEffect(() => {
    let live = true;
    buildPages(pieces)
      .then((drawn) => {
        if (live) setPages(drawn);
      })
      .catch((err: unknown) => {
        // A binder with no art is still a binder; the boards and rings render
        // and the rest of the page works.
        console.error("Could not draw the binder pages:", err);
        if (live) setPages(new Map());
      });

    return () => {
      live = false;
    };
  }, [pieces]);

  return (
    <div className="canvas-layer" aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          // Paper stock is near-white; without pulling exposure down it blows
          // out and the printed detail disappears.
          toneMappingExposure: 1.15,
        }}
        camera={{ fov: 32, position: [0, 0.06, 3.05], near: 0.1, far: 40 }}
      >
        <color attach="background" args={["#0d0708"]} />
        <StudioEnvironment intensity={0.3} />
        <fog attach="fog" args={["#0d0708", 3.6, 8]} />

        {/* Key light, high and camera-left, as if a softbox were on a stand. */}
        <directionalLight
          position={[-2.6, 3.4, 3.2]}
          intensity={2.15}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0009}
        >
          <orthographicCamera attach="shadow-camera" args={[-2.2, 2.2, 2.2, -2.2, 0.5, 12]} />
        </directionalLight>
        {/* Cool fill from the opposite side keeps the shadow side readable. */}
        <directionalLight position={[3.4, -1.2, 2]} intensity={0.28} color="#ffffff" />
        <ambientLight intensity={0.3} />

        <Suspense fallback={null}>
          {pages && <Binder onOpen={onOpen} pages={pages} />}
        </Suspense>
        <DevBridge />
      </Canvas>
    </div>
  );
}
