/**
 * Ornament drawn from Zimbabwean sources rather than generic "African" motif.
 *
 * The chevron is the dentelle course that runs around the top of the Great
 * Enclosure at Great Zimbabwe — a band of chevrons laid in stone, and the most
 * recognisable piece of Zimbabwean pattern there is. It wants to run in a line,
 * which makes it a natural rule.
 *
 * The sun is the device from the collage reference: a solid disc with tapered
 * rays. The star is the one on the Zimbabwe flag, and the mark the reference
 * covers use over and over. All are drawn, not typed, so they scale cleanly.
 */

/** Solid disc with radiating rays. Sized by its container. */
export function SunDisc({ className, rays = 24 }: { className?: string; rays?: number }) {
  const spokes = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2;
    // Alternate ray lengths so the edge isn't mechanically even.
    const outer = 46 + (i % 3 === 0 ? 12 : i % 2 === 0 ? 6 : 0);
    return {
      x1: 50 + Math.cos(a) * 34,
      y1: 50 + Math.sin(a) * 34,
      x2: 50 + Math.cos(a) * outer,
      y2: 50 + Math.sin(a) * outer,
      key: i,
    };
  });

  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      {spokes.map((s) => (
        <line
          key={s.key}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      ))}
      <circle cx="50" cy="50" r="27" fill="currentColor" />
    </svg>
  );
}

/** Five-pointed star — the one on the flag, and the reference covers' mark. */
export function Star({ className }: { className?: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    // Alternating outer and inner radius makes the five points.
    const r = i % 2 === 0 ? 48 : 19;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
  }).join(" ");

  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <polygon points={pts} fill="currentColor" />
    </svg>
  );
}

/**
 * The stamped label block from the album cover: a hard rectangle of flat
 * colour with the details set small inside it, like a rating mark printed in
 * the corner of a sleeve. Says what the thing is, in the least precious way
 * available.
 */
export function Stamp({
  lines,
  className,
}: {
  lines: [string, string, string];
  className?: string;
}) {
  return (
    <div className={`stamp${className ? ` ${className}` : ""}`}>
      <span className="stamp__top">{lines[0]}</span>
      <span className="stamp__mid">{lines[1]}</span>
      <span className="stamp__bot">{lines[2]}</span>
    </div>
  );
}

/**
 * The two cameras the work is actually made on: a Mamiya RZ67 for the stills
 * and an Arriflex SR3 for the motion. Drawn in side profile, which is the view
 * that makes each unmistakable — the RZ by its waist-level hood and slab body,
 * the SR by the coaxial magazine sitting proud on top.
 *
 * Silhouettes only. At the size these run they are read as shapes, not
 * diagrams, so detail past the outline is wasted.
 */
export function MamiyaRZ67({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" aria-hidden="true">
      <g fill="currentColor">
        <path d="M44 28 L49 7 H79 L84 28 Z" />
        <rect x="32" y="27" width="60" height="53" rx="3" />
        <rect x="92" y="32" width="21" height="42" rx="2" />
        <rect x="12" y="39" width="21" height="28" rx="2" />
        <rect x="5" y="35" width="8" height="36" rx="2" />
        <circle cx="104" cy="28" r="5.5" />
      </g>
    </svg>
  );
}

export function ArriflexSR3({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="72" cy="35" r="26" />
        <rect x="30" y="47" width="64" height="34" rx="6" />
        <rect x="10" y="53" width="21" height="21" rx="2" />
        <rect x="3" y="49" width="8" height="29" rx="2" />
        <path d="M94 56 L115 50 L115 67 L94 71 Z" />
        <rect x="50" y="3" width="38" height="8" rx="4" />
        <rect x="53" y="9" width="6" height="9" />
        <rect x="79" y="9" width="6" height="9" />
      </g>
    </svg>
  );
}
