"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import { PAGE_MASK_SRC, type Sheet as SheetData } from "@/lib/spreads";

export const PAGE_W = 1;
export const PAGE_H = 1.414;
const SEGMENTS_X = 44;
const STACK_GAP = 0.0022; // z spacing between resting sheets

/**
 * Injects the page-curl into a material's vertex stage.
 *
 * Doing it on the GPU (rather than morphing geometry on the CPU) means the
 * standard material keeps its lighting, and the same snippet can be dropped
 * into the depth material so shadows curl with the paper.
 */
function bendMaterial(material: THREE.Material, uniforms: Record<string, THREE.IUniform>) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      `
      uniform float uTurn;
      uniform float uWidth;
      uniform float uCurl;

      // z displacement of the sheet at normalized distance x from the spine,
      // and its slope, which is all we need for an exact normal.
      void curl(in float xn, out float z, out float dz) {
        float s = sin(uTurn * 3.14159265);
        float amp  = s * uCurl * uWidth * 0.2;
        float rest = (1.0 - s) * uWidth * 0.018;   // paper never lies truly flat
        z  = sin(xn * 3.14159265) * amp + sin(xn * 1.57079633) * rest;
        dz = (3.14159265 * cos(xn * 3.14159265) * amp
           +  1.57079633 * cos(xn * 1.57079633) * rest) / uWidth;
      }
    ` + shader.vertexShader;

    // Normals must be fixed up before three builds its view-space normal.
    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      `#include <beginnormal_vertex>
       {
         float z, dz;
         curl(clamp(position.x / uWidth, 0.0, 1.0), z, dz);
         objectNormal = normalize(vec3(-dz, 0.0, 1.0) * sign(objectNormal.z));
       }`
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       {
         float z, dz;
         curl(clamp(position.x / uWidth, 0.0, 1.0), z, dz);
         transformed.z += z;
       }`
    );

  };
  material.needsUpdate = true;
}

interface SheetProps {
  data: SheetData;
  index: number;
  /** Live turn amount, 0 (right, untouched) to 1 (fully turned to the left). */
  turnRef: React.RefObject<number[]>;
  activeRef: React.RefObject<number>;
  /** Page art, drawn from the catalogue. Keyed by face id. */
  pages: Map<string, HTMLCanvasElement>;
}

/**
 * One physical sheet of paper: two single-sided meshes back to back, hinged at
 * the spine (x = 0) and rotated about Y to turn.
 *
 * The back texture is mirrored at generation time and its UVs flipped here, so
 * the artwork reads the right way round. The ring holes come from one shared
 * greyscale mask rather than from alpha baked into each page, which is what
 * lets the artwork be opaque JPEG — and lets real photographs drop in untouched.
 */
export function Sheet({ data, index, turnRef, activeRef, pages }: SheetProps) {
  const group = useRef<THREE.Group>(null);
  const holeMask = useTexture(PAGE_MASK_SRC);

  // The art is a canvas drawn from the CMS rather than a file on disk, so the
  // binder shows the work as it is now instead of as it was when somebody last
  // ran a generator.
  const { frontMap, backMap } = useMemo(() => {
    const make = (id: string) => {
      const canvas = pages.get(id);
      if (!canvas) return null;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      return texture;
    };
    return { frontMap: make(data.front.id), backMap: make(data.back.id) };
  }, [pages, data.front.id, data.back.id]);

  // Canvas textures hold a GPU allocation that nothing else will free.
  useEffect(() => {
    return () => {
      frontMap?.dispose();
      backMap?.dispose();
    };
  }, [frontMap, backMap]);

  const uniforms = useMemo(
    () => ({
      uTurn: { value: 0 },
      uWidth: { value: PAGE_W },
      uCurl: { value: 1 },
    }),
    []
  );

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(PAGE_W, PAGE_H, SEGMENTS_X, 2);
    g.translate(PAGE_W / 2, 0, 0); // hinge on the spine, not the centre
    return g;
  }, []);

  const { frontMat, backMat, depthMat } = useMemo(() => {
    // The back face is seen through the sheet, so its UVs run the other way.
    // Flipping here puts the image the right way round with the gutter still
    // on the spine.
    const mirror = (t: THREE.Texture | null) => {
      if (!t) return null;
      const m = t.clone();
      m.wrapS = THREE.RepeatWrapping;
      m.repeat.x = -1;
      m.offset.x = 1;
      m.needsUpdate = true;
      return m;
    };
    // Only the art is mirrored. The mask is not: its holes already sit at u=0,
    // which is the spine on both faces, so flipping it would punch the holes
    // through the outer edge of every left-hand page.
    const backArt = mirror(backMap);

    const common = {
      roughness: 0.96,
      metalness: 0,
      alphaTest: 0.5, // with the mask, this is what opens the ring holes
      side: THREE.FrontSide as THREE.Side,
    };
    const frontMat = new THREE.MeshStandardMaterial({
      ...common,
      map: frontMap ?? undefined,
      color: frontMap ? 0xffffff : 0x1a1614,
      alphaMap: holeMask,
    });
    const backMat = new THREE.MeshStandardMaterial({
      ...common,
      map: backArt ?? undefined,
      color: backArt ? 0xffffff : 0x1a1614,
      alphaMap: holeMask,
      side: THREE.BackSide,
    });
    const depthMat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      alphaMap: holeMask,
      alphaTest: 0.5,
    });

    bendMaterial(frontMat, uniforms);
    bendMaterial(backMat, uniforms);
    bendMaterial(depthMat, uniforms);
    return { frontMat, backMat, depthMat };
  }, [frontMap, backMap, holeMask, uniforms]);

  useFrame(() => {
    const turn = turnRef.current?.[index] ?? 0;
    const active = activeRef.current ?? 0;
    uniforms.uTurn.value = turn;

    if (!group.current) return;
    group.current.rotation.y = -turn * Math.PI;

    // Both stacks recede from whichever spread is open, and the sheet in flight
    // lifts clear of them so it never z-fights the pages it passes over.
    const lift = Math.sin(turn * Math.PI);
    const rest = -Math.abs(index + turn - active) * STACK_GAP * 6;
    group.current.position.z = rest + lift * 0.05;
  });

  return (
    <group ref={group}>
      <mesh
        geometry={geometry}
        material={frontMat}
        customDepthMaterial={depthMat}
        castShadow
        receiveShadow
        position-z={0.0009}
      />
      <mesh geometry={geometry} material={backMat} receiveShadow position-z={-0.0009} />
    </group>
  );
}
