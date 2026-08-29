import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT, CONTACT_LINES } from "@/lib/contact";
import { SECTIONS } from "@/lib/spreads";
import { Signature } from "@/components/Signature";
import { Stamp, SunDisc } from "@/components/Ornament";

export const metadata: Metadata = {
  title: "Contact — Nesh",
  description: `Get in touch with Nesh — director, photographer and videographer based in ${CONTACT.city}.`,
};

/**
 * The contact page.
 *
 * Two lines of detail and nothing to fill in. A form would mean a mailbox to
 * watch, a spam problem and a server round trip, to arrive at the same email
 * address that is printed here — so the address is printed here.
 */
export default function ContactPage() {
  return (
    <main className="contact">
      <Link className="about__back" href="/">
        <svg viewBox="0 0 24 12" aria-hidden="true">
          <path d="M24 6H3M8 1 3 6l5 5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        Back to the binder
      </Link>

      <section className="contact__head">
        <SunDisc className="contact__sun" />
        <p className="contact__label">Contact</p>
        <h1 className="contact__title">
          Got something
          <span>to shoot?</span>
        </h1>
        <p className="contact__lede">
          Direction, camera, stills and production — commercial, music and documentary.
          Tell me what it is and when it shoots.
        </p>
      </section>

      <div className="flag-rule contact__flag" aria-hidden="true" />

      <section className="contact__lines">
        <dl>
          {CONTACT_LINES.map(({ label, value, href }) => (
            <div className="contact__row" key={label}>
              <dt>{label}</dt>
              <dd>
                {href ? (
                  <a href={href} className="contact__link">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <Signature className="contact__signature" />
      </section>

      <nav className="gallery__foot" aria-label="Sections">
        {SECTIONS.map((s) => (
          <span className="gallery__foot-item" key={s.slug}>
            <Link href={`/work/${s.slug}`}>
              {s.title}
              {s.tail}
            </Link>
          </span>
        ))}
        <span className="gallery__foot-item">
          <Link href="/about">About</Link>
        </span>
      </nav>

      <Stamp className="contact__stamp" lines={["Nesh", CONTACT.city, "Vol 01"]} />
    </main>
  );
}
