# Private Portfolio — How to Add New Projects

This portfolio section is **private by design**. Pages are only accessible via direct link — there are no navigation elements or SEO that would expose these pages from the public site.

## Portfolio URLs

| Page | URL |
|------|-----|
| **Listing page** | `/p/` |
| Project Atlas | `/p/project-atlas/` |
| Onboarding Reimagined | `/p/fintech-onboarding/` |
| Patient Portal Redesign | `/p/healthcare-portal/` |

---

## Quick Start: Adding a New Project

### Step 1: Add project data to `projects.json`

Open `/p/projects.json` and add a new entry:

```json
{
  "your-project-slug": {
    "slug": "your-project-slug",
    "title": "Project Title",
    "client": "Client or Company Name",
    "role": "Your Role",
    "timeframe": "Q1 2024 – Q3 2024",
    "context": "3-5 sentences explaining what this project was, who it served, and why it mattered.",
    "responsibilities": [
      "First responsibility you owned",
      "Second responsibility",
      "Third responsibility"
    ],
    "problem": "Short paragraph explaining the core challenge and constraints you faced.",
    "decisions": [
      "First key decision and reasoning",
      "Second key decision",
      "Third key decision"
    ],
    "outcome": "Short paragraph describing results or directional impact. Be honest — no fake metrics.",
    "images": [
      {
        "src": "/p/images/your-project-1.png",
        "alt": "Description for accessibility",
        "caption": "Optional caption text"
      },
      {
        "src": "/p/images/your-project-2.png",
        "alt": "Description for accessibility"
      }
    ]
  }
}
```

### Step 2: Create the project folder

Create a new folder at `/p/your-project-slug/` with an `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Project Title · Michael Rossi</title>
    <link rel="icon" type="image/svg+xml" href="/images/favicon-light.svg" media="(prefers-color-scheme: light)">
    <link rel="icon" type="image/svg+xml" href="/images/favicon-dark.svg" media="(prefers-color-scheme: dark)">
    <link rel="icon" type="image/svg+xml" href="/images/favicon-light.svg">
    <link rel="stylesheet" href="/p/case-study.css">
</head>
<body>
    <article class="case-study">
        <div class="case-study-container" id="case-study-content">
            <!-- Content loaded dynamically -->
        </div>
    </article>
    <script src="/p/case-study.js"></script>
</body>
</html>
```

**Important:** The folder name must match the `slug` in `projects.json`.

### Step 3: Add your images

1. Add screenshot images to `/p/images/`
2. Recommended formats: PNG, JPG, or WebP
3. Recommended size: 1200-1600px wide for crisp display
4. Update the `images` array in your project's JSON entry

### Step 4: Test locally

Open the URL in your browser:
```
http://localhost:8000/p/your-project-slug/
```

(Or whatever local server you use)

### Step 5: Deploy

Commit and push. GitHub Pages will automatically deploy.

---

## File Structure

```
/p/
├── README.md                    # This file
├── projects.json                # All project data (single source of truth)
├── case-study.css               # Shared styles
├── case-study.js                # Shared rendering logic
├── images/                      # All project images
│   ├── placeholder-1.svg
│   ├── placeholder-2.svg
│   └── ...
├── project-atlas/
│   └── index.html
├── fintech-onboarding/
│   └── index.html
└── healthcare-portal/
    └── index.html
```

---

## Data Model Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | ✓ | URL-safe identifier (must match folder name) |
| `title` | string | ✓ | Project name displayed as h1 |
| `client` | string | ✓ | Company or client name |
| `role` | string | ✓ | Your role on the project |
| `timeframe` | string | ✓ | When you worked on it |
| `context` | string | ✓ | 3-5 sentences of background |
| `responsibilities` | string[] | ✓ | What you personally owned/led |
| `problem` | string | ✓ | Core challenge explanation |
| `decisions` | string[] | ✓ | 3-5 key decisions with reasoning |
| `outcome` | string | ✓ | Results or directional impact |
| `images` | array | ✓ | Array of image objects |
| `images[].src` | string | ✓ | Path to image file |
| `images[].alt` | string | ✓ | Accessibility description |
| `images[].caption` | string | - | Optional caption below image |

---

## Privacy Features

- `<meta name="robots" content="noindex, nofollow">` on all pages
- No sitemap entries
- No internal links from homepage or any public page
- No navigation menus
- Subtle "Confidential · Private · Do not distribute" label on each page

---

## Removing a Project

1. Delete the project's folder (e.g., `/p/project-atlas/`)
2. Remove the entry from `projects.json`
3. Optionally remove associated images from `/p/images/`

---

## Customizing Styles

Edit `/p/case-study.css` to modify:
- Typography (fonts, sizes)
- Colors (CSS custom properties at top)
- Spacing
- Responsive breakpoints

