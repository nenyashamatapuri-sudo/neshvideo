/**
 * How to reach Nesh. One place, so the footer, the contact page and any
 * structured data can never drift apart.
 */
export const CONTACT = {
  email: "info@neshvideo.com",
  /** E.164, for the tel: link — the display form is separate on purpose. */
  phone: "+31652061168",
  phoneDisplay: "+31 6 5206 1168",
  city: "Amsterdam",
  country: "Netherlands",
} as const;

/** The lines the contact page prints, in order. */
export const CONTACT_LINES: { label: string; value: string; href?: string }[] = [
  { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: "Phone", value: CONTACT.phoneDisplay, href: `tel:${CONTACT.phone}` },
  { label: "Based", value: `${CONTACT.city}, ${CONTACT.country}` },
];
