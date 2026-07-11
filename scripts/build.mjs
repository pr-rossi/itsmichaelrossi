/**
 * build.mjs — Static site generator for the portfolio.
 *
 * Reads content from /data/*.json and writes fully-rendered static HTML into
 * /portfolio/ (plus /sitemap.xml and /robots.txt at the repo root). All
 * essential content ships in the initial HTML — no client JS required to read
 * the work. JavaScript (portfolio/enhance.js) only adds the mobile menu,
 * image lightbox, and analytics hooks.
 *
 * Run: npm run build   (or: node scripts/build.mjs)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

const site = readJson('data/site.json');
const projectsData = readJson('data/projects.json');
const projects = Object.values(projectsData).sort((a, b) => a.order - b.order);
const YEAR = new Date().getFullYear();

/* ----------------------------- helpers ----------------------------- */

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const MAILTO = `mailto:${site.meta.email}?subject=${encodeURIComponent('Hello Michael')}`;
const RESUME = site.meta.resume;

/** Minimal JPEG dimension reader (SOF markers) so images reserve space (no CLS). */
function jpegSize(absPath) {
  try {
    const buf = readFileSync(absPath);
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  } catch { /* ignore */ }
  return null;
}

/** <picture> with WebP + JPG fallback. `crop` uses an aspect container; else natural. */
function picture(img, { eager = false, crop = null } = {}) {
  if (!img) return '';
  const webp = img.src.replace(/\.jpe?g$/i, '.webp');
  const dims = jpegSize(join(ROOT, img.src.replace(/^\//, '')));
  const wh = dims ? ` width="${dims.w}" height="${dims.h}"` : '';
  const loading = eager ? 'eager' : 'lazy';
  const fetchpriority = eager ? ' fetchpriority="high"' : '';
  return (
    `<picture>` +
    `<source type="image/webp" srcset="${esc(webp)}">` +
    `<img src="${esc(img.src)}" alt="${esc(img.alt || '')}"${wh} loading="${loading}" decoding="async"${fetchpriority}>` +
    `</picture>`
  );
}

const yearOf = (t) => (String(t).match(/\d{4}(?!.*\d{4})/) || [String(t)])[0];

// Split a string into per-letter spans for a staggered reveal (aria-hidden;
// the container carries a real aria-label so screen readers read the word).
function letters(str) {
  return [...str].map((ch, i) =>
    ch === ' '
      ? '<span class="ch ch--space" aria-hidden="true"> </span>'
      : `<span class="ch" aria-hidden="true" style="--i:${i}">${esc(ch)}</span>`
  ).join('');
}

/* ----------------------------- shared chrome ----------------------------- */

function head({ title, description, canonical, ogType = 'website', ogImage, styles = [], jsonLd = null }) {
  const url = site.meta.baseUrl + canonical;
  const img = site.meta.baseUrl + (ogImage || site.meta.ogImage);
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="author" content="${esc(site.meta.name)}">
    <link rel="canonical" href="${esc(url)}">

    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="${esc(site.meta.name)}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${esc(url)}">
    <meta property="og:image" content="${esc(img)}">
    <meta property="og:image:alt" content="Michael Rossi — Principal Product Design Leader">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(img)}">

    <link rel="icon" type="image/svg+xml" href="/images/favicon-light.svg" media="(prefers-color-scheme: light)">
    <link rel="icon" type="image/svg+xml" href="/images/favicon-dark.svg" media="(prefers-color-scheme: dark)">
    <link rel="icon" type="image/svg+xml" href="/images/favicon-light.svg">

    <meta name="theme-color" content="#121212">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:ital,wght@0,300;0,400;0,500;1,300&display=swap">

    <link rel="stylesheet" href="/portfolio/site.css">
${styles.map((s) => `    <link rel="stylesheet" href="/portfolio/${s}">`).join('\n')}
${jsonLd ? `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>`;
}

function header(active) {
  // Only emit aria-current on a nav item that truly points to the current page.
  // "Work" is an in-page anchor (never a distinct page), so it is never current.
  const cur = (page) => (active === page ? ' aria-current="page"' : '');
  return `<a class="skip-link" href="#main">Skip to content</a>
    <header class="masthead">
        <div class="masthead__inner">
            <a href="/portfolio/" class="wordmark">Michael Rossi</a>
            <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primary-nav">
                <span class="nav-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span>
            </button>
            <nav id="primary-nav" class="site-nav" aria-label="Primary">
                <ul class="nav-links">
                    <li><a href="/portfolio/#work">Work</a></li>
                    <li><a href="/portfolio/about/"${cur('about')}>About</a></li>
                    <li><a href="${esc(RESUME)}" target="_blank" rel="noopener" data-event="resume_view" data-event-label="nav">Résumé</a></li>
                    <li><a href="${esc(MAILTO)}" data-event="contact_click" data-event-label="nav">Email</a></li>
                </ul>
            </nav>
        </div>
    </header>`;
}

function footer(extraScripts) {
  return `<footer class="colophon">
        <div class="colophon__inner">
            <div class="colophon__id">
                <p class="colophon__name">Michael Rossi</p>
                <p class="colophon__role">${esc(site.meta.role)} · ${esc(site.meta.location)}</p>
            </div>
            <nav class="colophon__nav" aria-label="Footer">
                <a href="/portfolio/#work">Work</a>
                <a href="/portfolio/about/">About</a>
                <a href="${esc(RESUME)}" target="_blank" rel="noopener" data-event="resume_view" data-event-label="footer">Résumé</a>
                <a href="${esc(MAILTO)}" data-event="contact_click" data-event-label="footer">${esc(site.meta.email)}</a>
            </nav>
            <p class="colophon__note">Designed and built by Michael Rossi in Dallas. ${YEAR}.</p>
        </div>
    </footer>
    <script src="/portfolio/enhance.js" defer></script>${(extraScripts || []).map((s) => `\n    <script src="${esc(s)}" defer></script>`).join('')}
</body>
</html>`;
}

/* ----------------------------- homepage ----------------------------- */

// One project = one big visual band. The work is the hero: the full image
// shown large at its natural aspect, with tight copy and facts beneath.
function projectBand(p, num, tier) {
  const facts = [['Role', p.role], ['Timeline', p.timeframe]];
  if (p.tech) facts.push(['Built with', p.tech]);
  if (p.url) facts.push(['Live', `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" data-event="external_project_link" data-event-label="${esc(p.slug)}">${esc(p.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>`]);
  return `<article class="band band--${tier} reveal">
                <div class="band__info">
                    <div class="band__lede">
                        <p class="band__index"><span class="band__num">${num}</span> ${esc(p.client)} &middot; ${esc(p.industry)}</p>
                        <h3 class="band__title" style="view-transition-name: proj-${esc(p.slug)}"><a href="/portfolio/${esc(p.slug)}/" data-event="casestudy_open" data-event-label="${esc(p.slug)}">${esc(p.title)}</a></h3>
                        <p class="band__lead">${esc(p.lead)}</p>
                        <p class="band__more"><a href="/portfolio/${esc(p.slug)}/" data-event="casestudy_open" data-event-label="${esc(p.slug)}">Read the case study <span aria-hidden="true">&rarr;</span></a></p>
                    </div>
                    <dl class="band__facts">
                        ${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${k === 'Live' ? v : esc(v)}</dd></div>`).join('\n                        ')}
                    </dl>
                </div>
            </article>`;
}

function homePage() {
  const numOf = (p) => String(p.order).padStart(2, '0');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.meta.name,
    jobTitle: site.meta.role,
    url: site.meta.baseUrl + '/portfolio/',
    email: 'mailto:' + site.meta.email,
    address: { '@type': 'PostalAddress', addressLocality: 'Dallas', addressRegion: 'TX', addressCountry: 'US' },
    knowsAbout: ['Product design', 'Design systems', 'UX strategy', 'Front-end development', 'Accessibility'],
  };
  if (site.meta.linkedin) jsonLd.sameAs = [site.meta.linkedin];

  const h = site.hero;

  return (
    head({
      title: site.seo.home.title,
      description: site.seo.home.description,
      canonical: '/portfolio/',
      ogType: 'profile',
      styles: ['home.css'],
      jsonLd,
    }) +
    `
<body>
    ${header('home')}
    <main id="main">
        <section class="hero-intro">
            <h1 class="hero-intro__name">
                <span class="hero-intro__pre">who is</span>
                <span class="hero-intro__you" aria-label="Michael Rossi?">${letters('Michael Rossi?')}</span>
            </h1>
            <p class="hero-intro__links">
                <a href="#about" class="hero-intro__link">let's find out <span class="arrowtrack arrowtrack--down" aria-hidden="true"><span class="arrowtrack__set"><span>&darr;</span><span>&darr;</span></span></span></a>
                <a href="#work" class="hero-intro__link">see some work <span class="arrowtrack arrowtrack--right" aria-hidden="true"><span class="arrowtrack__set"><span>&rarr;</span><span>&rarr;</span></span></span></a>
            </p>
        </section>

        <section class="intro" id="about" aria-labelledby="intro-headline">
            <div class="intro__portrait develop">
                <img src="/images/rossi.jpeg" width="1080" height="1080" alt="Michael Rossi" loading="eager" fetchpriority="high">
            </div>
            <div class="intro__body">
                <h2 class="intro__headline reveal" style="--d:0" id="intro-headline">${esc(h.headline)}</h2>
                <p class="intro__note reveal" style="--d:1">${esc(h.note)}</p>
                <dl class="facts reveal" style="--d:2">
                    ${h.facts.map((f) => `<div class="facts__row"><dt>${esc(f.value)}</dt> <dd>${esc(f.label)}</dd></div>`).join('\n                    ')}
                </dl>
                <p class="intro__availability reveal" style="--d:3">${esc(h.availability)}</p>
                <p class="intro__foot reveal" style="--d:4">
                    <a href="/portfolio/about/">Learn more about Michael <span class="arrowtrack arrowtrack--right" aria-hidden="true"><span class="arrowtrack__set"><span>&rarr;</span><span>&rarr;</span></span></span></a>
                    <a href="#work">See some work <span class="arrowtrack arrowtrack--down" aria-hidden="true"><span class="arrowtrack__set"><span>&darr;</span><span>&darr;</span></span></span></a>
                </p>
            </div>
        </section>

        <section class="work" id="work" aria-labelledby="work-title">
            <div class="section-head reveal">
                <h2 class="section-head__title" id="work-title">${esc(site.work.label)}</h2>
                <p class="section-head__intro">${esc(site.work.intro)}</p>
            </div>
            ${projects.map((p, i) => projectBand(p, numOf(p), i === 0 ? 'feature' : 'standard')).join('\n            ')}
        </section>

        <section class="approach" aria-labelledby="approach-title">
            <div class="approach__lead-wrap reveal">
                <h2 class="section-label" id="approach-title">${esc(site.howIWork.label)}</h2>
                <p class="approach__lead">${esc(site.howIWork.statement)}</p>
            </div>
            <ul class="approach__examples reveal">
                ${site.howIWork.examples.map((e) => `<li><span class="approach__at">${esc(e.at)}</span><span class="approach__did">${esc(e.did)}</span></li>`).join('\n                ')}
            </ul>
        </section>

        <section class="experience reveal" aria-labelledby="experience-title">
            <div class="experience__head">
                <h2 class="section-label" id="experience-title">${esc(site.experience.label)}</h2>
                <p class="experience__note">${esc(site.experience.note)}</p>
            </div>
            <div class="experience__groups">
                ${site.experience.groups.map((g) => `<div class="experience__group">
                    <h3>${esc(g.heading)}</h3>
                    <ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
                </div>`).join('\n                ')}
            </div>
        </section>

        <section class="closing reveal" aria-label="Contact">
            <p class="closing__statement">${esc(site.closing.statement)}</p>
            <p class="closing__note">${esc(site.closing.note)}</p>
            <p class="closing__links">
                <a href="${esc(MAILTO)}" data-event="contact_click" data-event-label="closing">${esc(site.meta.email)}</a>
                <a href="${esc(RESUME)}" target="_blank" rel="noopener" data-event="resume_view" data-event-label="closing">Résumé</a>${site.meta.linkedin ? `\n                <a href="${esc(site.meta.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}
            </p>
        </section>
    </main>
    ` +
    footer(['/portfolio/liquid.js'])
  );
}

/* ----------------------------- about ----------------------------- */

function aboutPage() {
  const a = site.about;
  const sections = a.sections
    .map((s) => {
      // A "lead" block reads as a full-width opening narrative (no side label),
      // so the page isn't five identical label -> heading -> prose slabs.
      if (s.style === 'lead') {
        return `<section class="about-lead">
                <h2>${esc(s.heading)}</h2>
                <div class="about-lead__body">
                    ${(s.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join('\n                    ')}
                </div>
            </section>`;
      }
      return `<section class="about-block">
                <p class="about-block__label">${esc(s.label)}</p>
                <div class="about-block__body">
                    <h2>${esc(s.heading)}</h2>
                    ${(s.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join('\n                    ')}
                    ${s.list ? `<ul class="about-list">${s.list.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
                </div>
            </section>`;
    })
    .join('\n            ');

  const exp = a.expertise;
  const expertise = `<section class="about-block">
                <p class="about-block__label">Expertise</p>
                <div class="about-block__body">
                    <h2>${esc(exp.heading)}.</h2>
                    <dl class="expertise-list">
                        ${exp.groups.map((g) => `<div class="expertise-row"><dt>${esc(g.heading)}</dt><dd>${g.items.map(esc).join(', ')}</dd></div>`).join('\n                        ')}
                    </dl>
                    <div class="about-tools">
                        <h3>Tools &amp; technical</h3>
                        <p>${esc(exp.tools)}</p>
                        <p class="about-certs">${exp.certifications.map((c) => esc(c)).join(' &middot; ')}</p>
                    </div>
                </div>
            </section>`;

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Person',
    name: site.meta.name, jobTitle: site.meta.role,
    url: site.meta.baseUrl + '/portfolio/about/',
    email: 'mailto:' + site.meta.email,
    address: { '@type': 'PostalAddress', addressLocality: 'Dallas', addressRegion: 'TX', addressCountry: 'US' },
  };
  if (site.meta.linkedin) jsonLd.sameAs = [site.meta.linkedin];

  return (
    head({
      title: site.seo.about.title,
      description: site.seo.about.description,
      canonical: '/portfolio/about/',
      ogType: 'profile',
      styles: ['about.css'],
      jsonLd,
    }) +
    `
<body>
    ${header('about')}
    <main id="main">
        <section class="about-hero">
            <div class="about-hero__text">
                <p class="about-hero__eyebrow">About</p>
                <h1 class="about-hero__title">${esc(a.title)}</h1>
                <p class="about-hero__lede">${esc(a.lede)}</p>
            </div>
            <img class="about-hero__portrait" src="/images/rossi.jpeg" width="1080" height="1080" alt="Michael Rossi" loading="eager" fetchpriority="high">
        </section>

        <div class="about-body">
            ${sections}
            ${expertise}
        </div>

        <section class="closing" aria-label="Contact">
            <p class="closing__statement">If you're hiring for a Staff or Principal Product Design role, or you have a knotty product problem, I'd like to hear about it.</p>
            <p class="closing__links">
                <a href="${esc(MAILTO)}" data-event="contact_click" data-event-label="about-closing">${esc(site.meta.email)}</a>
                <a href="${esc(RESUME)}" target="_blank" rel="noopener" data-event="resume_view" data-event-label="about-closing">Résumé</a>
            </p>
        </section>
    </main>
    ` +
    footer()
  );
}

/* ----------------------------- case study ----------------------------- */

function facts(p) {
  const rows = [
    ['Company', p.client],
    ['Role', p.role],
    ['Industry', p.industry],
    ['Timeline', p.timeframe],
  ];
  if (p.tech) rows.push(['Built with', p.tech]);
  if (p.url) rows.push(['Live', `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" data-event="external_project_link" data-event-label="${esc(p.slug)}">${esc(p.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>`]);
  return `<dl class="cs-facts">${rows
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${k === 'Live' ? v : esc(v)}</dd></div>`)
    .join('')}</dl>`;
}

function csFigure(img, eager = false) {
  if (!img) return '';
  return `<figure class="cs-figure">
                <button type="button" class="cs-zoom" aria-label="Enlarge image: ${esc(img.alt || '')}" data-full="${esc(img.src)}" data-caption="${esc(img.caption || '')}">${picture(img, { eager })}</button>
                ${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ''}
            </figure>`;
}

function section(title, bodyHtml, cls = '') {
  return `<section class="cs-section ${cls}">
                <div class="cs-section__body">
                    <h2>${esc(title)}</h2>
                    ${bodyHtml}
                </div>
            </section>`;
}

const paras = (t) => String(t).split(/\n\n+/).map((x) => `<p>${esc(x)}</p>`).join('');
const bullets = (items) => `<ul class="cs-list">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

function caseStudyPage(p) {
  const images = p.images || [];
  const hero = images[0];
  const inline = images.slice(1);
  let fi = 0;
  const nextFig = () => (inline[fi] ? csFigure(inline[fi++]) : '');

  const parts = [];
  if (p.context) parts.push(section('Context', paras(p.context)));
  if (p.problem) parts.push(section('The problem', paras(p.problem)));
  parts.push(nextFig());
  if (p.responsibilities) parts.push(section('What I did', bullets(p.responsibilities)));
  if (p.approach) parts.push(section('How I approached it', bullets(p.approach)));
  parts.push(nextFig());
  if (p.decisions) parts.push(section('Key decisions', bullets(p.decisions)));
  parts.push(nextFig());
  if (p.designSystem) parts.push(section('Systems & patterns', bullets(p.designSystem)));
  while (inline[fi]) parts.push(nextFig());
  if (p.outcome) parts.push(section('What shipped', paras(p.outcome), 'cs-section--outcome'));
  if (p.reflection) parts.push(section('Reflection', paras(p.reflection), 'cs-section--reflection'));

  const ordered = projects;
  const idx = ordered.findIndex((x) => x.slug === p.slug);
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx < ordered.length - 1 ? ordered[idx + 1] : null;
  const pag = `<nav class="cs-pagination" aria-label="Case study navigation">
                ${prev ? `<a class="cs-page cs-page--prev" href="/portfolio/${esc(prev.slug)}/"><span class="cs-page__label">Previous</span><span class="cs-page__title">${esc(prev.title)}</span></a>` : '<span class="cs-page"></span>'}
                <a class="cs-page cs-page--all" href="/portfolio/#work">All work</a>
                ${next ? `<a class="cs-page cs-page--next" href="/portfolio/${esc(next.slug)}/"><span class="cs-page__label">Next</span><span class="cs-page__title">${esc(next.title)}</span></a>` : '<span class="cs-page"></span>'}
            </nav>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    headline: p.title,
    abstract: p.lead,
    about: p.industry,
    url: site.meta.baseUrl + '/portfolio/' + p.slug + '/',
    creator: { '@type': 'Person', name: site.meta.name, jobTitle: site.meta.role },
    image: hero ? site.meta.baseUrl + hero.src : undefined,
  };

  return (
    head({
      title: `${p.title} — Michael Rossi`,
      description: p.lead,
      canonical: `/portfolio/${p.slug}/`,
      ogType: 'article',
      ogImage: hero ? hero.src : null,
      styles: ['case-study.css'],
      jsonLd,
    }) +
    `
<body>
    ${header('work')}
    <main id="main">
        <article class="case-study">
            <a class="back-link" href="/portfolio/#work"><span aria-hidden="true">&larr;</span> All work</a>
            <header class="cs-header">
                <p class="cs-header__client">${esc(p.client)}</p>
                <h1 class="cs-header__title" style="view-transition-name: proj-${esc(p.slug)}">${esc(p.title)}</h1>
                <p class="cs-header__lead">${esc(p.lead)}</p>
                ${facts(p)}
            </header>
            ${hero ? `<div class="cs-hero">${csFigure(hero, true)}</div>` : ''}
            <div class="cs-body">
                ${parts.filter(Boolean).join('\n                ')}
            </div>
            ${pag}
        </article>
    </main>
    ` +
    footer()
  );
}

/* ----------------------------- sitemap / robots ----------------------------- */

function sitemap() {
  const urls = [
    { loc: '/portfolio/', priority: '1.0' },
    { loc: '/portfolio/about/', priority: '0.7' },
    ...projects.map((p) => ({ loc: `/portfolio/${p.slug}/`, priority: '0.8' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${site.meta.baseUrl}${u.loc}</loc>\n    <priority>${u.priority}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`;
}

function robots() {
  return `User-agent: *
Allow: /

Sitemap: ${site.meta.baseUrl}/sitemap.xml
`;
}

/* ----------------------------- write ----------------------------- */

function writeFile(rel, content) {
  const abs = join(ROOT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  console.log('  wrote', rel);
}

console.log('Building portfolio…');
writeFile('portfolio/index.html', homePage());
writeFile('portfolio/about/index.html', aboutPage());
for (const p of projects) writeFile(`portfolio/${p.slug}/index.html`, caseStudyPage(p));
writeFile('sitemap.xml', sitemap());
writeFile('robots.txt', robots());
console.log(`Done. ${projects.length} case studies + home + about + sitemap + robots.`);
