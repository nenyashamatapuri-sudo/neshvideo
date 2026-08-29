import { HomeExperience } from "@/components/HomeExperience";
import { getAllPortfolioPieces } from "@/lib/portfolio-client";
import { CHAPTERS } from "@/lib/spreads";

/** The binder is drawn from the catalogue, so the homepage follows the work. */
export const revalidate = 60;

export default async function Home() {
  const pieces = await getAllPortfolioPieces();

  return (
    <main>
      <HomeExperience pieces={pieces} />

      {/* Readable without JavaScript or WebGL — and what crawlers index. */}
      <noscript>
        <div className="noscript">
          <h1>Nesh — director, photographer, videographer, based in Amsterdam</h1>
          <ul>
            {CHAPTERS.map((c) => (
              <li key={c.index}>
                <a href={c.href}>
                  <strong>
                    {c.title} {c.tail}
                  </strong>
                  <span>{c.blurb}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </noscript>
    </main>
  );
}
