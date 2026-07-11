# Portfolio — how it works & how to edit it

The portfolio at `/portfolio/` is a **static site generated from data**. You edit
JSON, run one build command, and commit the generated HTML. All content ships in
the HTML — the pages work with JavaScript disabled and are fully crawlable.

Positioning: **Michael Rossi — Principal Product Design Leader**, open to Staff
and Principal Product Design roles (still an individual contributor, not only a
manager). The pages are public and indexable.

---

## How it's built

```
data/
  site.json          # homepage + about + footer + SEO copy  (edit me)
  projects.json      # every project's content               (edit me)
scripts/
  build.mjs          # the generator — turns data into HTML
portfolio/           # OUTPUT (generated) + assets
  index.html         · about/index.html · <slug>/index.html   (generated)
  site.css · home.css · about.css · case-study.css            (styles — edit by hand)
  enhance.js         # progressive enhancement only (menu, lightbox, analytics)
  images/            # project images (.jpg + optimized .webp)
  Rossi-Resume-2026.pdf
sitemap.xml · robots.txt   (generated, at repo root)
```

**The rule:** never hand-edit the generated `*.html` files. Edit the data or the
CSS, then rebuild.

### Build

```bash
npm run build        # or: node scripts/build.mjs
```

This regenerates every page, the sitemap, and robots.txt. Then commit and push —
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
| How-I-work statement & examples | `data/site.json` → `howIWork` |
| Experience / client lists | `data/site.json` → `experience` |
| About-page copy & expertise | `data/site.json` → `about` |
| Closing statement | `data/site.json` → `closing` |
| Email, résumé path, LinkedIn, base URL | `data/site.json` → `meta` |
| Page titles / descriptions (SEO) | `data/site.json` → `seo` |
| A project's title, lead, facts, case-study text, images | `data/projects.json` |
| Which projects are featured / their order | `data/projects.json` → `tier` + `order` |

Then run `npm run build`.

### Project tiers (controls the homepage rhythm)

Each project has a `tier`:

- `feature` — the large project at the top (big image + full write-up).
- `standard` — a medium project (two distinct layouts: split, then stacked).
- `index` — a compact row in the "Also" archive at the bottom.

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
  the image lightbox, and analytics `data-event` hooks. Nothing essential needs it.
- **Analytics:** no vendor is wired up. Interactions carry `data-event`
  attributes and push to `window.dataLayer`; connect a tool later by editing
  `window.trackEvent` in `enhance.js`.
- **Fonts:** Editor's Note (serif) and Graphik (sans) are self-hosted in `/font/`
  as woff2 with fallbacks.
- **`.nojekyll`** at the repo root tells GitHub Pages to serve files as-is.
- **Do not fabricate.** Every claim in the data should be true. The Lowe's Pro
  Supply project is not on the résumé; keep its framing honest or remove it.
