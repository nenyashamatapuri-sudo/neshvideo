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
 * and an Arriflex 16SR3 for the motion.
 *
 * Each is drawn from the view that makes it unmistakable, which is not the same
 * view for both. The RZ is a front elevation — a square slab with the lens
 * throat punched clean through it and a focus knob standing out either side;
 * nothing else is shaped like that. The SR is a side elevation, because the
 * whole character of the camera is the coaxial magazine sitting proud above the
 * body, and face-on you would lose it entirely.
 *
 * They are marks rather than diagrams: the throat and the magazine hub are cut
 * out with `evenodd` so the ground shows through, which keeps both legible at
 * the size these actually run and lets the paper stock read as part of the
 * drawing. Everything is one colour, so they invert cleanly.
 */
export function MamiyaRZ67({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" aria-hidden="true">
      <g fill="currentColor">
        {/* Nameplate across the prism, and the body under it — with the lens
            throat punched through both. */}
        <rect x="37" y="6" width="46" height="11" rx="2.5" />
        <path
          fillRule="evenodd"
          d="M28 19h64a4 4 0 0 1 4 4v58a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4V23a4 4 0 0 1 4-4Zm32 8a25 25 0 1 0 0 50 25 25 0 0 0 0-50Z"
        />
        {/* The bayonet ring, then the glass. */}
        <circle cx="60" cy="52" r="21.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="60" cy="52" r="15" />
        {/* Focus knobs, one either side — the RZ's most obvious tell. */}
        <rect x="6" y="60" width="19" height="22" rx="4" />
        <rect x="95" y="60" width="19" height="22" rx="4" />
        {/* Shutter release. */}
        <circle cx="60" cy="23.5" r="2.6" />
      </g>
    </svg>
  );
}

export function ArriflexSR3({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" aria-hidden="true">
      <g fill="currentColor">
        {/* Carry handle. */}
        <rect x="44" y="4" width="42" height="7" rx="3.5" />
        <rect x="47" y="9" width="6" height="10" />
        <rect x="77" y="9" width="6" height="10" />
        {/* The magazine — the shape that says SR before anything else does.
            Its hub is cut out so the disc reads as a film spool. */}
        <path
          fillRule="evenodd"
          d="M74 15a29 29 0 1 1 0 58 29 29 0 0 1 0-58Zm0 22a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z"
        />
        {/* Body, and the flat run of the electronics panel along its base. */}
        <rect x="30" y="46" width="66" height="32" rx="5" />
        <rect x="38" y="72" width="58" height="12" rx="2" />
        {/* Eyepiece on its arm, swung out to the operator's side. */}
        <rect x="16" y="30" width="12" height="26" rx="5" />
        <rect x="6" y="34" width="12" height="18" rx="4" />
        {/* Lens port. */}
        <rect x="22" y="52" width="10" height="20" rx="2" />
      </g>
    </svg>
  );
}
