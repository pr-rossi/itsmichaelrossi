# Portfolio: how it works, and how to edit it

The portfolio at `/portfolio/` is a **static site generated from data**. You edit
JSON, run one build command, and commit the generated HTML. All content ships in
the HTML, so the pages work with JavaScript disabled and are fully crawlable.

Positioning: **Michael Rossi, Principal Product Design Leader**, open to Staff
and Principal Product Design roles (still an individual contributor, not only a
manager). The pages are public and indexable.

---

## How it's built

```
data/
  site.json          # homepage + footer + SEO copy          (edit me)
  projects.json      # every project's content               (edit me)
scripts/
  build.mjs          # the generator: turns data into HTML
portfolio/           # OUTPUT (generated) + assets
  index.html         · <slug>/index.html                      (generated)
  site.css · home.css · case-study.css                        (styles: edit by hand)
  enhance.js         # progressive enhancement only (menu, lightbox, analytics)
  images/            # project images (.jpg + optimized .webp)
  Rossi-Resume-2026.pdf
font/                # Graphik woff2: the only typeface the site loads
sitemap.xml · robots.txt   (generated, at repo root)
```

**The rule:** never hand-edit the generated `*.html` files. Edit the data or the
CSS, then rebuild.

### Build

```bash
npm run build        # or: node scripts/build.mjs
```

This regenerates every page, the sitemap, and robots.txt. Then commit and push.
GitHub Pages serves the committed HTML.

### Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/portfolio/
```

---

## Common edits

| Want to change… | Edit |
|---|---|
| Hero copy, career facts, availability | `data/site.json` → `hero` |
| Where the intro headline turns | a newline in `hero.headline`, which the build renders as a `<br>` |
| How-I-work statement & examples | `data/site.json` → `howIWork` |
| Experience / client lists | `data/site.json` → `experience` |
| Closing statement | `data/site.json` → `closing` |
| Email, résumé path, LinkedIn, base URL | `data/site.json` → `meta` |
| Page titles / descriptions (SEO) | `data/site.json` → `seo` |
| A project's title, lead, facts, case-study text, images | `data/projects.json` |
| Which projects are featured / their order | `data/projects.json` → `tier` + `order` |

Then run `npm run build`.

### Project tiers (controls the homepage rhythm)

Each project has a `tier`:

- `feature`: the large project at the top (big image + full write-up).
- `standard`: a medium project (two distinct layouts: split, then stacked).
- `index`: a compact row in the "Also" archive at the bottom.

`order` controls sequence everywhere (homepage + prev/next). To reorder or
re-tier a project, change those two fields and rebuild.

### Add a project

1. Add an entry to `data/projects.json` (copy an existing one; keep the fields).
2. Add its images to `portfolio/images/`, then make WebP versions:
   ```bash
   cd portfolio/images
   cwebp -q 82 -resize 2000 0 your-image.jpg -o your-image.webp
   ```
   Reference the `.jpg` in the data; the build serves WebP with a JPG fallback.
3. `npm run build`. The folder, case study, sitemap entry, and homepage card are
   all generated for you.

---

## Notes

- **Rendering:** content is static HTML. `enhance.js` only adds the mobile menu,
  the image lightbox, the transparent-at-top masthead, and analytics `data-event`
  hooks. Nothing essential needs it.
- **Contents rail (`.toc`):** shared by the case studies and the about page, so
  it lives in `site.css`, not either page's stylesheet. Both build their index
  from the sections that actually rendered, so it can't drift; both ship as plain
  anchor lists that work with no JS; `enhance.js` adds only the "you are here"
  state, to `.toc a` on either page.
- **Case-study rail:** each case study carries a sticky right column with the
  project facts and a contents index. The index is generated from the sections
  that actually rendered (a section registers itself as it's written, so the
  list can't drift), ships as a plain anchor list, and `enhance.js` only adds
  the "you are here" highlight. Below 1000px the rail unsticks and moves above
  the article, and the index hides.
- **Work index:** the rows are type only, by design. On a fine pointer
  `enhance.js` swaps the cursor for a filled circle reading "View" (it adds
  `.has-cursor` to the section first, so the native cursor is only ever hidden
  once the replacement actually exists), and hovering a row recedes the others
  via `:has()`. The external "Live" link keeps a real pointer and suppresses the
  circle, since it leaves the site. Touch, no-JS, and reduced-motion all just get
  the plain index and an ordinary pointer.
- **Cache busting:** `build.mjs` stamps every stylesheet and script URL with a
  hash of its own contents (`site.css?v=94e82e79`). Edit a CSS file, rebuild, and
  visitors get the new one immediately instead of a cached copy. The hash only
  moves when the file does, so rebuilds stay byte-identical.
- **Analytics:** no vendor is wired up. Interactions carry `data-event`
  attributes and push to `window.dataLayer`; connect a tool later by editing
  `window.trackEvent` in `enhance.js`.
- **Type:** one family, Graphik, self-hosted from `/font/` as woff2 at four
  weights (400/500/600/800). No serif and no webfont CDN. Hierarchy comes from
  weight, size, and tracking. Regular and Black are `<link rel=preload>`ed.
  `GraphikSemibold.woff2` and `GraphikBlack.woff2` were converted from the
  licensed OTFs (`fonttools`: load the .otf, set `flavor='woff2'`, save); redo
  that if you ever need another weight.
- **Colour:** monochromatic by rule: neutral greys only, no hue anywhere in the
  chrome. The tokens at the top of `site.css` carry their contrast ratios; every
  text colour clears WCAG AA on the page black. Project screenshots keep their
  real colour, since that's the work itself.
- **The hero name** is sized to fill its container exactly rather than to a
  guessed `vw`: `MICHAEL ROSSI` set in Graphik Black at -0.035em tracking
  measures **7.652em** of ink end to end (just `MICHAEL`, used for the two-line
  mobile break, is **4.539em**), so `container ÷ 7.652` is the fit, and
  `margin-left: -0.065em` backs out the M's side bearing so the *ink* touches
  the gutter. **If the name string, weight, or tracking changes, remeasure those
  divisors**. There's a canvas `measureText` recipe in the `home.css` comment.
- **`.nojekyll`** at the repo root tells GitHub Pages to serve files as-is.
- **There is no about page.** It was removed; the homepage intro carries the
  positioning instead. `site.json` still holds the copy that fed it (`about`,
  `seo.about`, and the older `aboutPreview`). Nothing reads those keys now, but
  the writing is kept there rather than thrown away. Delete them if you're sure.
- **Do not fabricate.** Every claim in the data should be true. The Lowe's Pro
  Supply project is not on the résumé; keep its framing honest or remove it.
