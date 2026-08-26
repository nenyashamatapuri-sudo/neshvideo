import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { chapterBySlug, SECTIONS } from "@/lib/spreads";
import { projectsFor } from "@/lib/projects";
import { Stamp, Star } from "@/components/Ornament";
import { getPortfolioPiecesByCategory } from "@/lib/portfolio-client";

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

  // Try to fetch from Supabase, fall back to hardcoded projects
  let projects = await getPortfolioPiecesByCategory(slug);
  
  if (projects.length === 0) {
    // Fallback to existing projects if Supabase is empty
    const fallbackProjects = projectsFor(slug);
    projects = fallbackProjects.map((p) => ({
      id: p.cover,
      title: p.title,
      description: p.client,
      category: slug as any,
      image_url: p.cover,
      vimeo_url: undefined,
      storage_path: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  const others = SECTIONS.filter((s) => s.slug !== slug);

  return (
    <main style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: 'clamp(1.5rem, 4vw, 3rem)',
    }}>
      <header className="gallery__head">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.7rem',
            color: '#948b86',
            fontSize: 'clamp(0.6rem, 0.74vw, 0.72rem)',
            letterSpacing: '0.17em',
            textTransform: 'uppercase',
            fontWeight: '700',
            transition: 'color 260ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            ← Nesh
          </span>
        </Link>
        <span style={{
          color: '#f2ede3',
          fontSize: 'clamp(1rem, 2.2vw, 1.5rem)',
          fontWeight: '700',
          letterSpacing: '-0.02em',
        }}>
          {chapter.title}
          {chapter.tail}
        </span>
        <Link href="/about" style={{ textDecoration: 'none' }}>
          <span style={{
            color: '#948b86',
            fontSize: 'clamp(0.6rem, 0.74vw, 0.72rem)',
            letterSpacing: '0.17em',
            textTransform: 'uppercase',
            fontWeight: '700',
            transition: 'color 260ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            About
          </span>
        </Link>
      </header>

      <div className="flag-rule gallery__rule" aria-hidden="true" />

      <ul className="gallery__grid">
        {projects.map((project) => (
          <li key={project.id} className="shot">
            {project.image_url && (
              <figure className="shot__frame">
                <Image
                  src={project.image_url}
                  alt={project.title}
                  width={400}
                  height={300}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </figure>
            )}
            <figcaption>
              <span className="shot__title">{project.title}</span>
              <span className="shot__client">{project.description}</span>
              {project.vimeo_url && (
                <span className="shot__agency">Film</span>
              )}
            </figcaption>
          </li>
        ))}
      </ul>

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
