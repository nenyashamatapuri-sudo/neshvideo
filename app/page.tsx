import { HomeExperience } from "@/components/HomeExperience";
import { CHAPTERS } from "@/lib/spreads";

export default function Home() {
  return (
    <main>
      <HomeExperience />

      {/* Readable without JavaScript or WebGL — and what crawlers index. */}
      <noscript>
        <div className="noscript">
          <h1>Nesh — director, cinematographer, photographer</h1>
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
