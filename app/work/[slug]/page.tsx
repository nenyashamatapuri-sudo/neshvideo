import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { chapterBySlug, SECTIONS } from "@/lib/spreads";
import { projectsFor } from "@/lib/projects";
import { Stamp, Star } from "@/components/Ornament";

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

  const projects = projectsFor(slug);
  const others = SECTIONS.filter((s) => s.slug !== slug);

  return (
    <main className="gallery">
      <header className="gallery__head">
        <Link className="gallery__home" href="/">
          Nesh
        </Link>
        <h1 className="gallery__title">
          {chapter.title}
          {chapter.tail}
        </h1>
        <Link className="gallery__aside" href="/about">
          About
        </Link>
      </header>

      {/* The palette on one line, between the header and the work. */}
      <div className="flag-rule gallery__rule" aria-hidden="true" />

      <ul className="gallery__grid">
        {projects.map((p, i) => (
          <li
            key={p.slug}
            className="shot"
            style={
              {
                "--span": p.span,
                "--drop": p.drop,
                "--aspect": p.aspect,
              } as React.CSSProperties
            }
          >
            <figure>
              <span className="shot__frame">
                <Image
                  src={p.cover}
                  alt={`${p.title} — ${p.client}`}
                  width={1000}
                  height={700}
                  sizes="(max-width: 720px) 50vw, 25vw"
                  priority={i < 3}
                />
              </span>
              <figcaption>
                <span className="shot__title">{p.title}</span>
                <span className="shot__client">{p.client}</span>
                {p.agency ? <span className="shot__agency">{p.agency}</span> : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <nav className="gallery__foot" aria-label="Other sections">
        {others.map((s, i) => (
          <span className="gallery__foot-item" key={s.slug}>
            {i > 0 ? <Star className="gallery__star" /> : null}
            <Link href={s.href}>
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
