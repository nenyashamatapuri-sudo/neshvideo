/**
 * The shape of a gallery, art-directed rather than random.
 *
 * Frames vary in width, proportion and how far they hang, so a row reads as
 * things laid out by hand rather than as a grid. The phrase is twelve long and
 * pieces cycle through it, so any number of entries still composes.
 *
 * Lifted out of lib/projects.ts so the Supabase-backed pages can share it
 * without dragging the placeholder catalogue in behind it.
 */
export interface Beat {
  /** Columns spanned on a twelve-column grid. */
  span: number;
  /** How far the frame hangs below the top of its row. */
  drop: string;
  aspect: string;
}

export const RHYTHM: Beat[] = [
  { span: 3, drop: "0", aspect: "3 / 4" },
  { span: 2, drop: "5rem", aspect: "4 / 3" },
  { span: 3, drop: "1.5rem", aspect: "3 / 4" },
  { span: 2, drop: "9rem", aspect: "1 / 1" },
  { span: 2, drop: "3rem", aspect: "4 / 5" },
  { span: 3, drop: "11rem", aspect: "3 / 2" },
  { span: 2, drop: "0", aspect: "2 / 3" },
  { span: 3, drop: "6rem", aspect: "16 / 9" },
  { span: 2, drop: "2rem", aspect: "3 / 4" },
  { span: 3, drop: "13rem", aspect: "4 / 3" },
  { span: 2, drop: "7rem", aspect: "1 / 1" },
  { span: 3, drop: "2.5rem", aspect: "5 / 4" },
];
