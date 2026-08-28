import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { chapterBySlug, SECTIONS } from "@/lib/spreads";
import { Stamp } from "@/components/Ornament";
import { getAllPortfolioPieces, getPortfolioPiecesByCategory, getPortfolioPiece } from "@/lib/portfolio-client";
import PieceViewer from "@/components/PieceViewer";

export const revalidate = 60;

export async function generateStaticParams() {
  const pieces = await getAllPortfolioPieces();
  return pieces
    .filter((p) => !p.coming_soon)
    .map((p) => ({ slug: p.category, piece: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; piece: string }>;
}): Promise<Metadata> {
  const { slug, piece } = await params;
  const found = await getPortfolioPiece(slug, piece);
  if (!found) return {};
  return {
    title: `${found.title} — Nesh`,
    description: found.description ?? undefined,
    openGraph: found.image_url ? { images: [found.image_url] } : undefined,
  };
}

/**
 * One piece of work.
 *
 * The page is the work and a credit block, nothing else. Film plays where the
 * frame sits; stills open into a lightbox you can walk with the arrow keys.
 */
export default async function PiecePage({
  params,
}: {
  params: Promise<{ slug: string; piece: string }>;
}) {
  const { slug, piece } = await params;
  const chapter = chapterBySlug(slug);
  if (!chapter) notFound();

  const found = await getPortfolioPiece(slug, piece);
  if (!found || found.coming_soon) notFound();

  // Next and previous within the section, so the reader can walk the whole
  // body of work without going back up to the index each time.
  const siblings = (await getPortfolioPiecesByCategory(slug)).filter((p) => !p.coming_soon);
  const at = siblings.findIndex((p) => p.id === found.id);
  const prev = at > 0 ? siblings[at - 1] : null;
  const next = at >= 0 && at < siblings.length - 1 ? siblings[at + 1] : null;

  const credits: [string, string][] = [
    ["Section", `${chapter.title}${chapter.tail}`],
    ...(found.client ? ([["Client", found.client]] as [string, string][]) : []),
    ...(found.agency ? ([["Agency", found.agency]] as [string, string][]) : []),
  ];

  return (
    <main className="piece">
      <header className="gallery__head">
        <Link href={`/work/${slug}`} className="gallery__home">
          ← {chapter.title}
          {chapter.tail}
        </Link>
        <h1 className="gallery__title">{found.title}</h1>
        <Link href="/about" className="gallery__aside">
          About
        </Link>
      </header>

      <div className="flag-rule gallery__rule" aria-hidden="true" />

      <PieceViewer piece={found} />

      <section className="piece__credits">
        <dl className="piece__meta">
          {credits.map(([term, value]) => (
            <div className="piece__meta-row" key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {found.description && <p className="piece__blurb">{found.description}</p>}
      </section>

      <nav className="piece__walk" aria-label="Other work in this section">
        {prev ? (
          <Link href={`/work/${slug}/${prev.slug}`} className="piece__walk-prev">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/work/${slug}/${next.slug}`} className="piece__walk-next">
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <nav className="gallery__foot" aria-label="Sections">
        {SECTIONS.map((s) => (
          <span className="gallery__foot-item" key={s.slug}>
            <Link href={`/work/${s.slug}`}>
              {s.title}
              {s.tail}
            </Link>
          </span>
        ))}
      </nav>

      <Stamp className="gallery__stamp" lines={["Nesh", found.title, "Vol 01"]} />
    </main>
  );
}
