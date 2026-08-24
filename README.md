# Nesh — portfolio

Homepage for a director / cinematographer / photographer. The centrepiece is a
3D ring binder: scrolling turns its pages, and each spread is one discipline.
The editorial layer — masthead, standfirst, contact strip — sits in HTML over
the canvas, so the type stays sharp, selectable and indexable.

Four colours: red, black, paper — and gold, rationed to ornament and folios. Display type is set in a heavy grotesque
on a 9° oblique, the way a film programme sets a title across the gutter. The
photography carries medium-format film borders: 6×6 plates with their rebate
showing, proof sheets, and the small technical print off a real contact sheet.

Everything is put through an emulsion pass — halation, a light leak, dust,
hairs, base scratches and grain — so the work reads as film rather than as
clean digital. The photographs are graded in colour on three stops; the
*design* stays red, white and black.

Four sections — **Directing, Photography, Videography, Production** — each with a
spread in the binder that previews the work and a page of its own that shows it.

```bash
npm run dev     # http://localhost:3000
npm run build
npm run media   # regenerate the placeholder imagery
```

## Serving the media from Bunny CDN

Optional. With no CDN configured the site serves everything out of `public/`
and works exactly as before — this is purely a production switch.

**1. On bunny.net**, create a **storage zone** and a **pull zone** pointed at
it. In the pull zone, turn on **CORS** (Security → CORS headers). This is not
optional: the 3D binder loads its page textures into WebGL, and a canvas
texture fetched cross-origin without `Access-Control-Allow-Origin` fails.

**2. Locally**, copy the template and fill it in:

```bash
cp .env.example .env.local
```

**3. Upload:**

```bash
npm run cdn            # only what is new or changed
npm run cdn -- --all   # re-upload everything
```

It lists the zone first and skips files already there at the same size, so
re-running after adding a few photographs sends only those. With
`BUNNY_API_KEY` set it purges the edge cache when it finishes.

**4. In Vercel**, add `NEXT_PUBLIC_CDN_URL` (Settings → Environment Variables)
and redeploy.

### How it hangs together

Every media path is stored **root-relative** — `/media/work/directing/x.jpg` —
and resolved through `mediaUrl()` in `lib/media.ts` on the way out. So the
catalogue never contains a CDN address, and switching Bunny on or off is one
environment variable and a redeploy: no re-import, no rewriting data, and local
development needs no CDN at all.

Paths are preserved on upload, so `public/media/pages/x.jpg` is served at
`<pull-zone>/media/pages/x.jpg` — the same path either way.

`NEXT_PUBLIC_CDN_URL` has to be public because the binder loads its textures in
the browser. The storage key and API key are read only by the upload script and
never reach the client. If the URL is malformed the build fails immediately
with a readable message rather than shipping broken image tags.

## Adding your work in bulk

```bash
npm run import -- ~/Desktop/nesh-work
```

One folder per section; the **filename is the metadata**, split on ` -- `:

```
nesh-work/
  directing/
    01_Nightshift -- Corona -- Wieden + Kennedy.jpg
    02_Hold Still -- Trainline.jpg          # no agency
    03_Blue Hour.jpg                        # client falls back to "Personal"
  photography/
  videography/
  production/
```

Files sort alphabetically, so prefix with `01_`, `02_` … to set the order — the
numbers are stripped from the title. Anything sips can read works as input
(JPEG, PNG, HEIC, TIFF).

The script resizes everything to a 2400px longest edge, re-encodes to JPEG,
writes it into `public/media/work/<section>/`, and regenerates
`lib/work.generated.ts`. **It reads each picture's real proportions off the
file**, so nothing is cropped to a shape it was never framed for — the gallery
supplies the width and the drop, the photograph supplies its own aspect.

Rerun it as often as you like. It rebuilds **only the sections it finds**, and
carries the others over untouched, so you can fill the four in over several
passes without the earlier ones disappearing.

If you point it at a folder with no section folders inside, it stops and tells
you the shape it wants rather than quietly importing nothing and emptying the
catalogue.

Any section you haven't imported yet keeps showing placeholders, so the site is
never broken halfway through.

macOS only — it leans on `sips`. Elsewhere, resize the files yourself into
`public/media/work/<section>/` and edit `lib/work.generated.ts` by hand.

## Putting your own work in

Everything the homepage says and shows comes from **`lib/spreads.ts`**. Nothing
else needs editing to change the content.

### 1. The sections

`CHAPTERS` holds the title spread plus one entry per section. `title` and `tail`
are the two halves of one word, split only so the masthead can break across two
lines — `PHOTO` + `GRAPHY` sets as `PHOTOGRAPHY` on the section page and stacks
on the homepage.

```ts
{
  index: "02",
  slug: "photography",             // becomes /work/photography
  kicker: "Section 02",
  title: "PHOTO", tail: "GRAPHY",
  blurb: "…",
  stats: ["40+ shoots", "35mm · 6×6 · Digital", "Editorial · Portrait"],
  cta: "See the photography",
  href: "/work/photography",
}
```

`stats` is the overview the reader sees on the spread — the first one is set in
red, so put the headline number there.

### 1b. The work in each section

`lib/projects.ts` holds the catalogue behind each gallery. A project carries
three pieces of information and no more — **what it is, who it was for, and
which agency it came through**:

```ts
["Nightshift", "Corona", "Wieden + Kennedy"]   // title, client, agency
["Hold Still", "Trainline"]                    // agency omitted when direct
```

Point `cover` at any file under `public/media/`; the entries currently reuse
the generated frames so the galleries are browsable before you swap anything.

The gallery pages carry no other copy: no standfirst, no stats, no numbering,
no ornament. A hairline header, the frames, three lines of caption, and a row
of links to the other sections. Anything else on those pages is competing with
a photograph.

Frame size and vertical offset come from `RHYTHM` — a twelve-item phrase of
spans, drops and aspect ratios that projects cycle through, so a row reads as
things laid out by hand rather than as a grid, and any number of entries still
composes.

### 2. The pictures

`SHEETS` describes the physical paper. Each sheet has a `front` and a `back`,
and each face names an `id` that maps to two files:

| File | What it is | Size |
| --- | --- | --- |
| `public/media/pages/<id>.jpg` | the printed page, seen on the binder | 900 × 1274 |
| `public/media/frames/<id>.jpg` | the bare photo, seen in the contact strip | 1000 × 700 |

Drop your own files at those paths, keeping the names, and they take over.

Each face also picks a `layout.kind`, which is what gives the book its rhythm:

| kind | what it prints |
| --- | --- |
| `title` | the opening statement page: flat red, heavy rules, the four sections listed |
| `hero` | one wide still under a credit block |
| `grid` | a six-up of stills beside a standfirst |
| `plate` | a single 6×6 frame with its film rebate, edge printing and frame number |
| `contact` | a proof sheet of six frames, one ringed in grease pencil |
| `poster` | one frame screened as a coarse halftone on flat red, and almost nothing else |

`layout.ground` sets the field behind it — `paper`, `red` or `ink`. Red loses
against red, so on a red page the accent role falls to the paper stock
automatically.

Two things worth knowing when you prepare page art:

- **No transparency needed.** The ring holes are cut by one shared mask,
  `public/media/page-mask.png`, so your photographs go in untouched.
- **Leave the gutter tenth quiet.** That strip is where the rings sit — on the
  right for left-hand pages, the left for right-hand ones.

Sheets are physical, so turning sheet *k* lays its back down as the next
spread's left page. Spread *k* is therefore `SHEETS[k-1].back` on the left and
`SHEETS[k].front` on the right. Add a spread by adding one sheet **and** one
chapter — the counter, the rail and the contact strip all follow automatically.

## The placeholders

`npm run media` synthesises the stand-in imagery — backlit figures, interiors,
landscapes, product stills — with no dependencies at all: it writes PNG by hand
(`zlib` plus an adaptive scanline filter) and converts to JPEG with `sips`.
Off macOS there is no `sips`, so it writes PNG and records that in
`lib/media-ext.ts`; the site follows whichever it finds.

It also sets its own type. `scripts/font5x7.mjs` is a 5×7 bitmap face, which is
what puts real captions, folios, film stocks and frame numbers on the pages —
at that size the pixels read as technical small print rather than as a
compromise. Curly quotes and long dashes fold onto their typewriter
equivalents, so copy pasted from anywhere still sets.

**The emulsion pass** runs in `makeFrame`, in the order the physics happen:
halation while the light is still in the film, a light leak on the negative,
then dust, hairs and scratches at the scanner. Grain is the exception — it is
*not* baked in. Random noise is close to incompressible, and baking it took the
media folder from 2MB to 15MB, so grain is drawn in the page shader instead
(`components/binder/Sheet.tsx`) and as a CSS layer over the stills. It costs
nothing to download and stays a constant size on screen however far the page is
from camera.

**Colour.** `Tone` is a three-stop grade — shadow, mid, highlight — rather than
a duotone: cool shadows into warm mids into a cream highlight is what makes a
frame read as shot rather than rendered. Each frame also gets one saturated
`prop`, a hard-edged red mass, because a graded frame with no accent is all one
family of hue and reads flat.

**The masthead is cut out of the photograph** (`background-clip: text`), red
screened underneath so the shadow areas of a letterform never go black on
black. Two things about that are load-bearing and easy to break:

- The fill sits on **each word**, not on the line that contains them. In
  Chromium anything on a *descendant* that creates a stacking context — a
  transform, a `clip-path`, an `isolation` — silently stops the whole clipped
  background painting. Keeping background and glyphs on the same element
  removes that class of bug.
- For the same reason the words reveal on **opacity alone**. The old wipe used
  `clip-path` and a `translateY`, and either one is enough to blank the
  masthead.

Everywhere `background-clip: text` is unsupported, the type falls back to flat
red — the same design, a step quieter.

**Frame shapes are art-directed, not random.** `GRID_TEMPLATES` holds three
compositions on a 12 × 14 unit block; each has a wide establishing frame, two
or three landscape frames and exactly one upright. Which template a page gets
is seeded, so pages differ but none can come out badly composed. The section
pages use the same idea in `RHYTHM` (`lib/projects.ts`) — a twelve-item phrase
of spans and aspect ratios that projects cycle through.

One thing to know if you edit the layouts: left-hand pages are composed
mirrored (`meta.mirror`), with the gutter on the right. That has to happen in
the layout rather than by flipping pixels, because the shader already flips the
UVs of back faces — flipping the art too would put the gutter in the right
place but run every line of type backwards.

Once your own photographs are in place you can delete `scripts/` entirely.

## The opening

`components/Intro.tsx` plays a short title card before the binder: the two
cameras the work is actually made on — a Mamiya RZ67 for stills, an Arriflex
SR3 for motion — set down side by side on a flag band, then the curtain lifts.

It follows three rules, because an intro that ignores them is a liability
rather than a flourish:

- **Once a session.** Nobody should sit through it on every visit. Whether it
  has already played is read through `useSyncExternalStore`, not copied into
  state in an effect, so the very first render is right on both server and
  client and a returning visitor never sees a frame of it.
- **Skippable** by click, key, scroll or touch. The moment someone signals they
  want to get on with it, it gets out of the way.
- **Honours reduced motion**, collapsing to a brief hold and a fade.

To see it again after it has played, clear the session key:
`sessionStorage.removeItem("nesh:intro-seen")`.

## Ornament

Four devices carry the Zimbabwean roots. All are drawn rather than typed, so
they scale cleanly and appear identically on screen and on the printed pages:

- **The chevron band** is the dentelle course that runs around the top of the
  Great Enclosure at Great Zimbabwe — chevrons laid in stone. It is used as a
  rule, which is what it wants to be: it runs in a line and reads at any size.
  `Surface.chevron()` prints it onto the pages; `.chevron` draws the same band
  in CSS.
- **The sun** — a solid disc with tapered rays — is the device from the collage
  reference. `components/Ornament.tsx` for the web, `Surface.sunDisc()` for the
  pages.
- **The flag band** stacks green, gold, red and black into a single rule. It is
  the most economical way to put the whole palette on a page at once, and it
  reads at any width: a divider that says where the work comes from without
  needing a word of explanation. `.flag-rule` / `Surface.flagBand()`.
- **The star** is the one on the flag, and the mark the reference covers use
  over and over. It separates rather than decorates — it only appears *between*
  things. `<Star />` / `Surface.star()`.
- **The stamp** is the rating-mark block from the album sleeve: a hard
  rectangle of flat colour with the details set small inside it, middle line
  knocked out in reverse. `<Stamp />`, and printed onto the poster pages.

This is deliberately Zimbabwean rather than pan-African wallpaper. Adinkra
symbols are the obvious reach for "African pattern", but they are Akan, from
Ghana, and borrowing them here would say something untrue about where the work
comes from. Great Zimbabwe is the right well to draw from.

Green and gold are accent colours only — ornament, folios, marks and ledger
values. Never photography, never body copy. Red still carries the site; the
other two give it a home.

## The About page

`app/about/page.tsx`, with all its copy in `lib/about.ts`. Deep red ground,
prints taped down and rotated over each other, a drawn signature, and the big
figure with a justified monospace column beside it.

The signature (`components/Signature.tsx`) is vector, drawn so the capital
reads clearly as an N and the rest resolves into nothing — a drawn signature
that spells something *almost* legible reads as a mistake, while one that
resolves into nothing reads as a hand moving fast. Swap the paths for a scan of
your own hand, keeping the viewBox.

## How it fits together

```
app/page.tsx                    server-rendered shell + a no-JS fallback
app/work/[slug]/page.tsx        the four section pages, prerendered at build
components/HomeExperience.tsx   pins the stage
components/binder/              the WebGL layer
  Sheet.tsx                     one sheet; the page-curl lives in its shader
  Binder.tsx                    stacking, turning, responsive framing
  Environment.tsx               image-based lighting, so the rings read as metal
components/overlay/             masthead, contact strip, rail, nav
lib/spreads.ts                  ← sections, page art, all the words
lib/projects.ts                 ← the work shown on each section page
lib/about.ts                    ← the About page's story and details
lib/scroll.ts                   scroll state, deliberately outside React
```

Two decisions are load-bearing:

**Scroll never becomes React state.** The render loop reads it from a plain
module object sixty times a second; React only hears about the integer spread
index, which changes six times in the whole page. Everything smooth is CSS or
WebGL.

**The curl is a vertex shader**, injected into a standard material rather than
replacing it, so the paper keeps real lighting and shadow. The same snippet
goes into the depth material, which is what makes a turning page cast a curled
shadow instead of a flat one.

## Accessibility

The whole page is readable without WebGL, the chapters are real links, and
`prefers-reduced-motion` disables the grain, the pulse and every transition.
