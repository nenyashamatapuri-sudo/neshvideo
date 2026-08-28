"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { vimeoId, type PortfolioPiece } from "@/lib/supabase";

/**
 * The work itself.
 *
 * Film sits in a 16:9 frame and plays in place — Vimeo's own player, loaded
 * only once the reader asks for it, so the page does not carry an iframe it
 * may never need. Stills run down the page at full width and open into a
 * lightbox you can walk with the arrow keys.
 */
export default function PieceViewer({ piece }: { piece: PortfolioPiece }) {
  const id = vimeoId(piece.vimeo_url);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  // The tile image leads the gallery when it is not already in it, so the
  // frame the reader clicked is the first thing they see on arrival.
  const stills = piece.images.length
    ? piece.images
    : piece.image_url
      ? [{ url: piece.image_url, sort_order: 0 }]
      : [];

  const step = useCallback(
    (by: number) => {
      setOpen((current) => {
        if (current === null) return current;
        return (current + by + stills.length) % stills.length;
      });
    },
    [stills.length]
  );

  useEffect(() => {
    if (open === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };

    document.addEventListener("keydown", onKey);
    // The lightbox is the page while it is up; nothing behind it should scroll.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, step]);

  return (
    <>
      {id && (
        <section className="piece__film">
          {playing ? (
            <iframe
              className="piece__player"
              src={`https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0`}
              title={piece.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              className="piece__poster"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${piece.title}`}
            >
              {piece.image_url && (
                <Image
                  src={piece.image_url}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 100vw, 1100px"
                  style={{ objectFit: "cover" }}
                  priority
                />
              )}
              <span className="piece__play" aria-hidden="true" />
            </button>
          )}
        </section>
      )}

      {stills.length > 0 && !(id && stills.length === 1) && (
        <ul className="piece__plates">
          {stills.map((still, i) => (
            <li className="piece__plate" key={still.url}>
              <button
                type="button"
                className="piece__plate-btn"
                onClick={() => setOpen(i)}
                aria-label={`Open image ${i + 1} of ${stills.length}`}
              >
                <Image
                  src={still.url}
                  alt={still.caption || `${piece.title} — ${i + 1}`}
                  width={1600}
                  height={1200}
                  sizes="(max-width: 900px) 100vw, 1100px"
                  style={{ width: "100%", height: "auto" }}
                  priority={i === 0 && !id}
                />
              </button>
              {still.caption && <p className="piece__caption">{still.caption}</p>}
            </li>
          ))}
        </ul>
      )}

      {open !== null && stills[open] && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${piece.title}, image ${open + 1} of ${stills.length}`}
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            className="lightbox__close"
            onClick={() => setOpen(null)}
            aria-label="Close"
          >
            ×
          </button>

          {stills.length > 1 && (
            <button
              type="button"
              className="lightbox__prev"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
            <Image
              src={stills[open].url}
              alt={stills[open].caption || `${piece.title} — ${open + 1}`}
              width={2000}
              height={1500}
              sizes="90vw"
              style={{ width: "auto", height: "auto", maxWidth: "90vw", maxHeight: "82vh" }}
            />
            <figcaption className="lightbox__caption">
              {/* Captions are optional and arrive as "" from the CMS, so the
                  title has to cover the empty string as well as the absence. */}
              {stills[open].caption || piece.title}
              <span className="lightbox__count">
                {open + 1} / {stills.length}
              </span>
            </figcaption>
          </figure>

          {stills.length > 1 && (
            <button
              type="button"
              className="lightbox__next"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next image"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
