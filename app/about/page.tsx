import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ABOUT } from "@/lib/about";
import { frameSrc } from "@/lib/spreads";
import { Signature } from "@/components/Signature";
import { Stamp, SunDisc } from "@/components/Ornament";

export const metadata: Metadata = {
  title: "About — Nesh",
  description: ABOUT.bio[0],
};

export default function AboutPage() {
  return (
    <main className="about">
      <Link className="about__back" href="/">
        <svg viewBox="0 0 24 12" aria-hidden="true">
          <path d="M24 6H3M8 1 3 6l5 5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        Back to the binder
      </Link>

      {/* ------------------------------------------------------- collage -- */}
      <section className="about__hero">
        <div className="about__intro">
          {/* Sun behind the name, as in the collage reference. */}
          <SunDisc className="about__sun" />
          <p className="about__label">About</p>
          <h1 className="about__name">{ABOUT.name}</h1>
          <p className="about__role">{ABOUT.role}</p>
          <p className="about__current">{ABOUT.current}</p>
          <div className="chevron about__chevron" aria-hidden="true" />
          <dl className="about__facts">
            {ABOUT.facts.map(([term, detail]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
          <Signature className="about__signature" />
          <Stamp className="about__stamp" lines={["Nesh", "Zimbabwe", "Vol 01"]} />
        </div>

        {/* Prints laid down one over another, taped to the page. */}
        <div className="about__collage">
          {ABOUT.collage.map((shot, i) => (
            <figure key={shot.id} className={`snap snap--${i + 1}`}>
              <span className="snap__tape" aria-hidden="true" />
              <span className="snap__frame">
                <Image
                  src={frameSrc(shot.id)}
                  alt={shot.caption}
                  width={1000}
                  height={700}
                  sizes="(max-width: 900px) 90vw, 40vw"
                  priority={i === 0}
                />
              </span>
              <figcaption>{shot.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- bio -- */}
      <section className="about__body">
        <p className="about__figure" aria-hidden="true">
          <span>{ABOUT.figure[0]}</span>
          <em>/</em>
          <span>{ABOUT.figure[1]}</span>
        </p>
        <p className="about__figure-caption">{ABOUT.figureCaption}</p>

        <div className="about__prose">
          {ABOUT.bio.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- kit -- */}
      <div className="flag-rule about__flag" aria-hidden="true" />

      <section className="about__spec">
        <div>
          <p className="about__kicker bar">What I do</p>
          <ul className="clients">
            {ABOUT.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
          <p className="about__cameras">{ABOUT.cameras}</p>
        </div>

        <div>
          <p className="about__kicker bar">Clients</p>
          <ul className="clients clients--named">
            {ABOUT.clients.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="about__cta">
        <p className="about__cta-line">Got something to shoot?</p>
        <Link className="cta" href="/contact">
          <span>Get in touch</span>
          <svg viewBox="0 0 24 12" aria-hidden="true">
            <path d="M0 6h21M16 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </Link>
      </section>
    </main>
  );
}
