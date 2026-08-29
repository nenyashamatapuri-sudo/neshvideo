import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { chapterBySlug, SECTIONS } from "@/lib/spreads";
import { Stamp, Star } from "@/components/Ornament";
import { getPortfolioPiecesByCategory } from "@/lib/portfolio-client";
import SectionGallery from "@/components/SectionGallery";

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
        <Link href="/contact" className="gallery__aside">
          Contact
        </Link>
      </header>

      <div className="flag-rule gallery__rule" aria-hidden="true" />

      {pieces.length === 0 ? (
        <p className="gallery__empty">This section is being hung. Check back shortly.</p>
      ) : (
        <SectionGallery pieces={pieces} section={slug} />
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
