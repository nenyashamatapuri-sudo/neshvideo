"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { SHEETS } from "@/lib/spreads";
import { damp, scroll } from "@/lib/scroll";
import { PAGE_H, PAGE_W, Sheet } from "./Sheet";

const RING_YS = [0.28, 0, -0.28].map((t) => t * PAGE_H);
const HOLE_X = 0.045 * PAGE_W; // must match the generator's hole position
/** Lifts the spread clear of the masthead, which sits across its lower third. */
const BINDER_Y = 0.1;
/** Vertical extent the camera must always fit: a page plus breathing room. */
const FRAME_H = PAGE_H * 1.2;
/** Horizontal extent, closed (one page) and fully open (two). */
const FRAME_W_CLOSED = PAGE_W * 1.06;
const FRAME_W_OPEN = PAGE_W * 2.24;
/**
 * Below this viewport aspect a two-page spread can only be fitted by pushing
 * the camera so far back the pages become thumbnails. Portrait phones instead
 * stay locked on the single right-hand page, which turns away to reveal the
 * next — the same story, framed for the device.
 */
const SINGLE_PAGE_ASPECT = 1.05;

/** The three steel rings the pages hang from. */
function Rings() {
  // Kept tight to the punch holes: viewed face-on a wide ring reads as a hook
  // arcing over the page rather than as hardware.
  const geometry = useMemo(() => new THREE.TorusGeometry(HOLE_X + 0.026, 0.0072, 12, 56), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c2c6cc",
        roughness: 0.22,
        metalness: 1,
      }),
    []
  );

  return (
    <group>
      {RING_YS.map((y) => (
        <mesh
          key={y}
          geometry={geometry}
          material={material}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        />
      ))}
    </group>
  );
}

/** Board covers and the spine plate the whole thing is bolted to. */
function Boards() {
  const board = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#191919",
        roughness: 0.78,
        metalness: 0.08,
      }),
    []
  );
  const w = PAGE_W * 1.045;
  const h = PAGE_H * 1.035;

  return (
    <group position-z={-0.075}>
      <mesh material={board} position={[-w / 2 - 0.012, 0, 0]} receiveShadow>
        <boxGeometry args={[w, h, 0.018]} />
      </mesh>
      <mesh material={board} position={[w / 2 + 0.012, 0, 0]} receiveShadow>
        <boxGeometry args={[w, h, 0.018]} />
      </mesh>
      {/* Spine plate, sitting just behind the rings. */}
      <mesh material={board} position={[0, 0, 0.012]} castShadow receiveShadow>
        <boxGeometry args={[0.145, h, 0.014]} />
      </mesh>
    </group>
  );
}

export function Binder({ onOpen }: { onOpen?: (spread: number) => void }) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const viewport = useThree((s) => s.size);
  const canvas = useThree((s) => s.gl.domElement);
  // Per-sheet turn amounts, written once per frame and read by every Sheet.
  const turns = useRef<number[]>(SHEETS.map(() => 0));
  const active = useRef(0);
  // Hover lives in a ref rather than state: the render loop reads it every
  // frame, and a re-render here would rebuild every sheet's material.
  const hovered = useRef(false);

  const setHover = (on: boolean) => {
    hovered.current = on;
    // The 3D layer has no affordances of its own, so the cursor carries the
    // whole message that the spread can be opened.
    canvas.style.cursor = on ? "pointer" : "";
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30); // survive tab-out without a lurch
    scroll.eased = damp(scroll.eased, scroll.target, 6.5, dt);
    active.current = scroll.eased;

    for (let i = 0; i < SHEETS.length; i++) {
      // Sheets turn one after another, each overlapping the next slightly so
      // the binder is never completely still mid-scroll.
      turns.current[i] = Math.min(1, Math.max(0, scroll.eased - i));
    }

    if (!group.current) return;

    const aspect = viewport.width / Math.max(1, viewport.height);
    const singlePage = aspect < SINGLE_PAGE_ASPECT;

    // Closed, only the right-hand page exists, so slide the binder over to put
    // that single page in the middle of frame. It settles back as it opens —
    // except on portrait screens, where it stays centred throughout.
    const opened = singlePage ? 0 : Math.min(1, scroll.eased);
    group.current.position.x = damp(
      group.current.position.x,
      -PAGE_W * 0.5 * (1 - opened),
      6.5,
      dt
    );
    // On a phone the masthead owns the bottom third, so lift the page clear.
    group.current.position.y = damp(
      group.current.position.y,
      singlePage ? BINDER_Y + 0.14 : BINDER_Y,
      5,
      dt
    );

    // Dolly so the spread always fits, whatever the viewport. The camera eases
    // back as the binder opens out from one page to two.
    const halfFov = (camera.fov * Math.PI) / 360;
    const frameW = FRAME_W_CLOSED + (FRAME_W_OPEN - FRAME_W_CLOSED) * opened;
    const distance = Math.max(
      FRAME_H / (2 * Math.tan(halfFov)),
      frameW / (2 * Math.tan(halfFov) * aspect)
    );
    camera.position.z = damp(camera.position.z, distance, 5, dt);

    // The whole binder drifts with the pointer — a few degrees, no more.
    group.current.rotation.y = damp(group.current.rotation.y, scroll.pointerX * 0.055, 3, dt);
    group.current.rotation.x = damp(
      group.current.rotation.x,
      -0.14 + scroll.pointerY * 0.035,
      3,
      dt
    );

    // Under the pointer the spread comes forward and squares up to the reader,
    // the way you would pull a book toward you before opening it.
    const lift = hovered.current ? 1 : 0;
    group.current.position.z = damp(group.current.position.z, lift * 0.085, 6, dt);
    group.current.scale.setScalar(
      damp(group.current.scale.x, 1 + lift * 0.018, 6, dt)
    );
  });

  return (
    <group ref={group} position-y={BINDER_Y}>
      <Boards />
      <Rings />
      {SHEETS.map((sheet, i) => (
        <Sheet key={sheet.front.id} data={sheet} index={i} turnRef={turns} activeRef={active} />
      ))}

      {/*
       * The hit target. The sheets themselves are turning, curling and
       * alpha-tested, which makes them poor things to raycast against — a
       * pointer would flicker between them mid-turn and drop through the ring
       * holes. One invisible plane across the whole spread is steady, and the
       * reader cannot tell the difference.
       */}
      <mesh
        position={[0, 0, 0.12]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          onOpen?.(Math.round(active.current));
        }}
      >
        <planeGeometry args={[PAGE_W * 2.05, PAGE_H * 1.02]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
