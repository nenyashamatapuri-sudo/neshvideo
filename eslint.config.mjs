import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber's render loop is imperative by design: `useFrame` runs
    // outside React's render and is *meant* to mutate the camera, materials and
    // shader uniforms in place. The immutability rule reads that as unsafe
    // post-render mutation, which it is not — the alternative, driving the
    // scene from state, would re-render it sixty times a second.
    files: ["components/binder/**/*.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
