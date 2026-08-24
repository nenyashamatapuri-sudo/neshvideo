/**
 * Everything the About page says.
 *
 * The story here is real. Double-check the camera names and client list before
 * this goes live — those are the details people notice.
 */

export const ABOUT = {
  name: "NESH",
  role: "Director, photographer & videographer",
  current: "Videographer at Wieden + Kennedy",

  /** The two halves of the big figure, set either side of a slash. */
  figure: ["20", "23"] as const,
  figureCaption: "The year I left finance for film",

  facts: [
    ["From", "Zimbabwe"],
    ["Based", "Amsterdam, NL"],
    ["Staff", "Wieden + Kennedy"],
    ["Freelance", "Directing & stills"],
  ] as const,

  /** Set as a justified monospace column, like the reference spread. */
  bio: [
    "I was born in Zimbabwe and moved to the Netherlands in 2020. Amsterdam has been home since.",
    "In 2023 I left a career in finance to make films. I had no training and no contacts — I taught myself to shoot, taught myself to edit, and took every job that would have me until the work was good enough to do full time.",
    "That run ended up at Wieden + Kennedy, where I'm now a videographer. Alongside it I freelance as a director and photographer, and I've made work with Nike, Zalando, Corona, Triumph, Trainline and Philips.",
    "I work across disciplines rather than in one lane — shooting, editing, agency and line producing. Coming to this late is the reason why: I learned every part of it because I had to, and I've never wanted to give any of it back.",
  ],

  /** Short and unfussy — the story matters more than the spec. */
  cameras: "Mamiya RZ67 · Sony FX3 · Arri SR3",

  skills: [
    "Directing",
    "Photography",
    "Shooting",
    "Editing",
    "Agency producing",
    "Line producing",
  ],

  clients: ["Nike", "Zalando", "Corona", "Triumph", "Trainline", "Philips"],

  /** The three stills in the collage, with their handwritten captions. */
  collage: [
    { id: "about-1", caption: "Amsterdam, 2026" },
    { id: "about-2", caption: "On location" },
    { id: "about-3", caption: "Contact sheet, 6×7" },
  ],
} as const;
