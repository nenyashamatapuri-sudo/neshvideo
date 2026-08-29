"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { RHYTHM } from "@/lib/rhythm";
import { vimeoId, type PortfolioPiece } from "@/lib/supabase";

/** One thing the viewer can look at: the film, or one of the stills. */
type Slide =
  | { kind: "film"; id: string; poster: string | null }
  | { kind: "still"; url: string; caption?: string };

/**
 * Everything a piece contains, in the order it should be walked: the film
 * first when there is one, then the stills. Treating both as slides means the
 * viewer has one set of controls rather than two different behaviours.
 */
function slidesFor(piece: PortfolioPiece): Slide[] {
  const film = vimeoId(piece.vimeo_url);
  const stills = piece.images.length
    ? piece.images
    : piece.image_url && !film
      ? [{ url: piece.image_url, sort_order: 0 }]
      : [];

  return [
    ...(film ? ([{ kind: "film", id: film, poster: piece.image_url }] as Slide[]) : []),
    ...stills.map((s): Slide => ({ kind: "still", url: s.url, caption: s.caption })),
  ];
}

/**
 * A section of work, and the viewer it opens into.
 *
 * The work is one click away and stays that way: opening a piece does not
 * navigate anywhere, so closing it puts the reader back exactly where they
 * were, at the scroll position they left. The per-piece pages still exist and
 * still work as links — they are just not the way through the section.
 */
export default function SectionGallery({
  pieces,
  section,
}: {
  pieces: PortfolioPiece[];
  section: string;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const returnFocus = useRef<HTMLButtonElement | null>(null);

  const piece = openAt === null ? null : pieces[openAt];
  const slides = piece ? slidesFor(piece) : [];

  const close = useCallback(() => {
    setOpenAt(null);
    setPlaying(false);
    returnFocus.current?.focus();
  }, []);

  const open = (i: number, from: HTMLButtonElement) => {
    returnFocus.current = from;
    setOpenAt(i);
    setSlide(0);
    setPlaying(false);
  };

  const step = useCallback(
    (by: number) => {
      setPlaying(false);
      setSlide((n) => (slides.length ? (n + by + slides.length) % slides.length : 0));
    },
    [slides.length]
  );

  /** Straight from one piece to the next without going back to the grid. */
  const stepPiece = useCallback(
    (by: number) => {
      setOpenAt((n) => {
        if (n === null) return n;
        let next = n;
        // Skip anything announced but not yet published.
        for (let i = 0; i < pieces.length; i++) {
          next = (next + by + pieces.length) % pieces.length;
          if (!pieces[next].coming_soon) break;
        }
        return next;
      });
      setSlide(0);
      setPlaying(false);
    },
    [pieces]
  );

  useEffect(() => {
    if (openAt === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowDown") stepPiece(1);
      else if (e.key === "ArrowUp") stepPiece(-1);
    };

    document.addEventListener("keydown", onKey);
    // The viewer is the page while it is up; nothing behind it should scroll.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [openAt, close, step, stepPiece]);

  const current = slides[slide];

  return (
    <>
      <ul className="gallery__grid">
        {pieces.map((p, i) => {
          const beat = RHYTHM[i % RHYTHM.length];
          const style = {
            "--span": beat.span,
            "--drop": beat.drop,
            "--aspect": beat.aspect,
          } as React.CSSProperties;

          const frame = (
            <span className="shot__frame">
              {p.image_url ? (
                <Image
                  src={p.image_url}
                  alt=""
                  fill
                  sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span className="shot__blank" aria-hidden="true" />
              )}
              {vimeoId(p.vimeo_url) && <span className="shot__play" aria-hidden="true" />}
              {p.images.length > 1 && (
                <span className="shot__count" aria-hidden="true">
                  {p.images.length}
                </span>
              )}
            </span>
          );

          const caption = (
            <span className="shot__cap">
              <span className="shot__title">{p.title}</span>
              {p.client && <span className="shot__client">{p.client}</span>}
              {p.agency && <span className="shot__agency">{p.agency}</span>}
            </span>
          );

          if (p.coming_soon) {
            return (
              <li className="shot shot--soon" key={p.id} style={style}>
                {frame}
                <span className="shot__cap">
                  <span className="shot__title">{p.title}</span>
                  <span className="shot__client">Coming soon</span>
                </span>
              </li>
            );
          }

          return (
            <li className="shot" key={p.id} style={style}>
              <button
                type="button"
                className="shot__open"
                onClick={(e) => open(i, e.currentTarget)}
                aria-label={`Open ${p.title}`}
              >
                {frame}
                {caption}
              </button>
            </li>
          );
        })}
      </ul>

      {piece && (
        <div
          className="viewer"
          role="dialog"
          aria-modal="true"
          aria-label={piece.title}
          onClick={close}
        >
          <header className="viewer__bar" onClick={(e) => e.stopPropagation()}>
            <p className="viewer__id">
              <span className="viewer__title">{piece.title}</span>
              {piece.client && <span className="viewer__client">{piece.client}</span>}
              {piece.agency && <span className="viewer__agency">{piece.agency}</span>}
            </p>
            <button type="button" className="viewer__close" onClick={close} aria-label="Close">
              ×
            </button>
          </header>

          {slides.length > 1 && (
            <button
              type="button"
              className="viewer__prev"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous"
            >
              ‹
            </button>
          )}

          <div className="viewer__stage" onClick={(e) => e.stopPropagation()}>
            {current?.kind === "film" ? (
              playing ? (
                <iframe
                  className="viewer__player"
                  src={`https://player.vimeo.com/video/${current.id}?autoplay=1&title=0&byline=0&portrait=0`}
                  title={piece.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  className="viewer__poster"
                  onClick={() => setPlaying(true)}
                  aria-label={`Play ${piece.title}`}
                >
                  {current.poster && (
                    <Image
                      src={current.poster}
                      alt=""
                      fill
                      sizes="90vw"
                      style={{ objectFit: "cover" }}
                    />
                  )}
                  <span className="piece__play" aria-hidden="true" />
                </button>
              )
            ) : current?.kind === "still" ? (
              <Image
                src={current.url}
                alt={current.caption || piece.title}
                width={2000}
                height={1500}
                sizes="90vw"
                className="viewer__still"
              />
            ) : (
              <p className="viewer__empty">This piece is still being hung.</p>
            )}
          </div>

          {slides.length > 1 && (
            <button
              type="button"
              className="viewer__next"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next"
            >
              ›
            </button>
          )}

          <footer className="viewer__foot" onClick={(e) => e.stopPropagation()}>
            <span className="viewer__caption">
              {current?.kind === "still" ? current.caption || "" : piece.description || ""}
            </span>
            {slides.length > 1 && (
              <span className="viewer__count">
                {slide + 1} / {slides.length}
              </span>
            )}
            <a className="viewer__link" href={`/work/${section}/${piece.slug}`}>
              Open page →
            </a>
          </footer>
        </div>
      )}
    </>
  );
}
