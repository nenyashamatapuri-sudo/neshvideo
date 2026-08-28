import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { chapterBySlug, SECTIONS } from "@/lib/spreads";
import { Stamp, Star } from "@/components/Ornament";
import { getPortfolioPiecesByCategory } from "@/lib/portfolio-client";
import { RHYTHM } from "@/lib/rhythm";
import { vimeoId } from "@/lib/supabase";

/** Revalidate every 60 seconds to pick up new portfolio pieces */
export const revalidate = 60;

/** Every section is known at build time, so all four pages are static. */
export function generateStaticParams() {
  return SECTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const chapter = chapterBySlug(slug);
  if (!chapter) return {};
  const name = `${chapter.title}${chapter.tail}`;
  return { title: `${name} — Nesh`, description: chapter.blurb };
}

/**
 * A section of work.
 *
 * Deliberately almost empty: a thin header rule, the frames, and a caption of
 * three lines at most. No standfirst, no numbers, no ornament. The page exists
 * to be looked through, and anything else on it is competing with the work.
 */
export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapter = chapterBySlug(slug);
  if (!chapter) notFound();

  const pieces = await getPortfolioPiecesByCategory(slug);
  const others = SECTIONS.filter((s) => s.slug !== slug);

  return (
    <main className="gallery">
      <header className="gallery__head">
        <Link href="/" className="gallery__home">
          ← Nesh
        </Link>
        <h1 className="gallery__title">
          {chapter.title}
          {chapter.tail}
        </h1>
        <Link href="/about" className="gallery__aside">
          About
        </Link>
      </header>

      <div className="flag-rule gallery__rule" aria-hidden="true" />

      {pieces.length === 0 ? (
        <p className="gallery__empty">This section is being hung. Check back shortly.</p>
      ) : (
        <ul className="gallery__grid">
          {pieces.map((piece, i) => {
            // The layout rhythm is the site's, not the database's: frames vary
            // in width and hang at different heights so a row never reads as a
            // grid. Without these the tiles collapse to one column each.
            const beat = RHYTHM[i % RHYTHM.length];
            const style = {
              "--span": beat.span,
              "--drop": beat.drop,
              "--aspect": beat.aspect,
            } as React.CSSProperties;

            const caption = (
              <figcaption>
                <span className="shot__title">{piece.title}</span>
                {piece.client && <span className="shot__client">{piece.client}</span>}
                {piece.agency && <span className="shot__agency">{piece.agency}</span>}
              </figcaption>
            );

            const frame = (
              <figure className="shot__frame">
                {piece.image_url ? (
                  <Image
                    src={piece.image_url}
                    alt={piece.title}
                    fill
                    sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span className="shot__blank" aria-hidden="true" />
                )}
                {vimeoId(piece.vimeo_url) && (
                  <span className="shot__play" aria-hidden="true" />
                )}
              </figure>
            );

            // A piece with nothing behind it yet is announced, not linked.
            if (piece.coming_soon) {
              return (
                <li className="shot shot--soon" key={piece.id} style={style}>
                  {frame}
                  <figcaption>
                    <span className="shot__title">{piece.title}</span>
                    <span className="shot__client">Coming soon</span>
                  </figcaption>
                </li>
              );
            }

            return (
              <li className="shot" key={piece.id} style={style}>
                <Link href={`/work/${slug}/${piece.slug}`} className="shot__link">
                  {frame}
                  {caption}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <nav className="gallery__foot" aria-label="Other sections">
        {others.map((s, i) => (
          <span className="gallery__foot-item" key={s.slug}>
            {i > 0 ? <Star className="gallery__star" /> : null}
            <Link href={`/work/${s.slug}`}>
              {s.title}
              {s.tail}
            </Link>
          </span>
        ))}
      </nav>

      <Stamp className="gallery__stamp" lines={["Nesh", `${chapter.title}${chapter.tail}`, "Vol 01"]} />
    </main>
  );
}
