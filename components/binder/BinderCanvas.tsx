"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { Binder } from "./Binder";
import { DevBridge } from "./DevBridge";
import { StudioEnvironment } from "./Environment";

/**
 * The 3D layer. Deliberately holds no React state — everything it animates is
 * read from the scroll store inside the render loop, so this subtree mounts
 * once and never re-renders.
 */
export function BinderCanvas() {
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
          <Binder />
        </Suspense>
        <DevBridge />
      </Canvas>
    </div>
  );
}
