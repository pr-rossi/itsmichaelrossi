# Portfolio — How it works & how to edit it

This is the recruiter-facing portfolio at `/portfolio/`. It's a static site (no
build step) served by GitHub Pages. It is **private by design**: every page
carries `noindex, nofollow` and there are no links to it from the public
homepage, so it's only reachable by direct link. You can still share the link
and it will produce a clean preview card (Open Graph tags are set per page).

Positioning: **Michael Rossi — Principal Product Design Leader**. Everything is
written to support Staff / Principal Product Design applications.

---

## URLs

| Page | URL |
|------|-----|
| Home (hero, work, about preview, contact) | `/portfolio/` |
| About | `/portfolio/about/` |
| Case study | `/portfolio/<slug>/` (e.g. `/portfolio/nutrient-website/`) |
| Resume (PDF) | `/portfolio/Rossi-Resume-2026.pdf` |

Current projects: `tiaa-design-system`, `unitedhealth-transportation`,
`nutrient-website`, `lowes-pro-supply`, `synquery-product`.

---

## File map

```
/portfolio/
├── index.html            # Homepage. All homepage copy lives here, in
│                         #   <!-- ===== EDIT: SECTION ===== --> blocks.
├── about/index.html      # About page. Copy is in EDIT blocks too.
├── projects.json         # SINGLE SOURCE OF TRUTH for all project content.
│                         #   Powers both the homepage cards and case studies.
├── site.css              # Shared: fonts, colors, nav, footer, buttons, focus.
├── home.css              # Homepage-only styles.
├── about.css             # About-only styles.
├── case-study.css        # Case-study layout.
├── site.js               # Shared: analytics hooks, footer year, reveal.
├── home.js               # Renders homepage project cards from projects.json.
├── case-study.js         # Renders a case study from projects.json.
├── images/               # Project images (.jpg originals + .webp optimized).
├── Rossi-Resume-2026.pdf # The resume the whole site links to.
└── <slug>/index.html     # One thin shell per case study (title/OG meta only).
```

---

## Common edits

### Change homepage copy (hero, credibility numbers, how-I-work, etc.)
Open `index.html` and find the block labeled `<!-- ===== EDIT: HERO ===== -->`
(and CREDIBILITY BAR, HOW I WORK, EXPERIENCE, ABOUT PREVIEW, CLOSING CTA). Edit
the text directly. Same idea for the About page in `about/index.html`.

### Change the resume
Replace `Rossi-Resume-2026.pdf`. If you rename it, update the `href` everywhere
it appears (search the repo for `Rossi-Resume-2026.pdf`).

### Change contact email
Search for `rossi@pushrefresh.com` and replace it (it's in `mailto:` links and
the footer on every page).

### Change page title / description / share image (SEO & link previews)
Each page's `<title>`, `<meta name="description">`, and `og:` tags are in the
`<head>` of that page's HTML. Case-study shells (`<slug>/index.html`) each have
their own.

---

## Add or edit a project

**1. Edit `projects.json`.** It's one object keyed by slug. Fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `slug` | string | ✓ | Must match the folder name. |
| `title` | string | ✓ | Strategic headline (not just the company name). |
| `client` | string | ✓ | Company / client name. |
| `industry` | string | ✓ | e.g. "Healthcare", "Financial Services". |
| `role` | string | ✓ | Your role on the project. |
| `timeframe` | string | ✓ | e.g. "2023 – 2024". |
| `featured` | boolean | ✓ | `true` to show on the homepage. |
| `order` | number | ✓ | Homepage + prev/next ordering (1 = first). |
| `summary` | string | ✓ | One line for the homepage card + case-study intro. |
| `capabilities` | string[] | ✓ | Up to 5 shown as tags on the card. |
| `context` | string | ✓ | What the product is, who it served, why it mattered. |
| `problem` | string | ✓ | What wasn't working and what made it hard. |
| `responsibilities` | string[] | ✓ | "My role" bullets — what you personally owned. |
| `approach` | string[] | ✓ | What you actually did (discovery, research, etc.). |
| `decisions` | string[] | ✓ | Key decisions **with the reasoning**. |
| `designSystem` | string[] | – | Optional. Systems/patterns work, if relevant. |
| `outcome` | string | ✓ | Honest result. **No invented metrics.** |
| `reflection` | string | ✓ | One or two sentences: what it took, what you learned. |
| `tech` | string | – | Optional, e.g. "React, Astro". |
| `url` | string | – | Optional live link. |
| `images` | array | ✓ | `{ src, alt, caption }`. First image is the hero. |

`images[].alt` describes what's shown (for screen readers). `images[].caption`
explains *why it matters* (shown under the image). Sections only render if their
field exists, so shorter projects still look clean.

**2. Create the folder + shell.** Make `/portfolio/<slug>/index.html`. The
easiest way is to copy an existing shell and change the `<title>`,
`<meta name="description">`, and the three `og:`/`twitter:` image + url tags.
The folder name **must** match the `slug`.

**3. Add images (and their optimized WebP).** Put JPGs in `/portfolio/images/`,
then generate WebP versions (the site serves WebP with a JPG fallback):

```bash
cd portfolio/images
# resize to max 2000px wide and write an optimized .webp next to the .jpg
cwebp -q 82 -resize 2000 0 your-image.jpg -o your-image.webp
```

Reference the `.jpg` in `projects.json`; the code finds the matching `.webp`
automatically.

---

## Fonts

Editor's Note (serif) and Graphik (sans) are self-hosted in `/font/`. The site
loads the `.woff2` versions (smaller/faster) with `.ttf`/`.otf` fallback. If you
add a new weight, convert it: `woff2_compress "font/YourFont.otf"`.

---

## Analytics

No analytics vendor is installed. Interactive elements are already tagged with
`data-event` (resume downloads, contact clicks, case-study opens, external
project links), and `site.js` pushes those to `window.dataLayer`. To turn on
real analytics later, either read `window.dataLayer` or edit `window.trackEvent`
in `site.js` to forward events to your tool. Nothing is sent anywhere today.

---

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000/portfolio/
```

Use a server (not `file://`) so `fetch('/portfolio/projects.json')` works.

---

## Deploy

Commit and push. GitHub Pages redeploys automatically. All portfolio pages stay
`noindex, nofollow`; the site is shared by direct link.
