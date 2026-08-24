/**
 * A drawn signature, in the spirit of the collage references.
 *
 * Vector rather than an image so it stays crisp and can be recoloured. The
 * capital is drawn to read clearly as an N; the rest is deliberately a scrawl,
 * which is how signatures behave — trying to letter it legibly is what makes a
 * drawn one look fake.
 *
 * This is a stand-in: swap the paths for a scan of your own hand when you have
 * one, keeping the same viewBox.
 */
export function Signature({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 120"
      role="img"
      aria-label="Nesh, signed"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Capital N: up-stroke, diagonal, up-stroke — drawn in one movement. */}
      <path d="M18 100C22 74 30 38 36 20c1-4 3-4 4 1 4 22 14 60 20 74 2 4 4 3 5-3 3-18 9-46 13-58" />

      {/*
        One unbroken run of humps rather than letterforms. A drawn signature
        that spells something almost-legible reads as a mistake; one that
        resolves into nothing reads as a hand moving fast, which is the point.
      */}
      <path d="M82 92c4-16 10-28 16-30 5-2 6 6 3 16-3 11-7 20-3 22 5 3 13-8 18-20 4-9 8-14 11-12 4 2 2 12-1 21-3 8-5 15-1 17 5 2 12-7 17-17 4-8 8-12 11-10 3 2 2 10 0 17-2 8-3 14 1 16 4 2 10-4 15-12" />

      {/* One tall ascender, the way a hand throws a last upstroke. */}
      <path d="M172 98c8-34 18-64 25-74 3-5 6-2 5 8-2 15-9 37-11 47" />

      {/* Flourish: the long underline that closes the name. */}
      <path
        d="M26 108c52 13 126 11 188-3 32-7 51-16 60-25"
        strokeWidth="3.2"
      />
      <path d="M266 82c15 5 27 14 31 23" strokeWidth="3.2" />
    </svg>
  );
}
