/**
 * case-study.js — Renders a single case study from projects.json.
 *
 * The URL slug (…/portfolio/<slug>/) selects the project. All content is
 * edited in projects.json — this file only lays it out. Sections render only
 * when their data exists, so shorter projects stay clean.
 */
(function () {
    'use strict';

    function esc(text) {
        if (text == null) return '';
        var div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    function getSlugFromPath() {
        var segments = window.location.pathname.split('/').filter(Boolean);
        if (segments.length >= 2 && segments[0] === 'portfolio') {
            return segments[1];
        }
        return null;
    }

    async function fetchProjects() {
        try {
            var res = await fetch('/portfolio/projects.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (err) {
            console.error('Error loading projects:', err);
            return null;
        }
    }

    /* ---------- Content builders ---------- */

    function figure(img) {
        if (!img) return '';
        var webp = img.src.replace(/\.jpe?g$/i, '.webp');
        var caption = img.caption || img.alt || '';
        var alt = img.alt || '';
        var label = alt ? 'Enlarge image: ' + alt : 'Enlarge image';
        return '' +
            '<figure class="cs-figure">' +
            '<button type="button" class="cs-zoom" aria-label="' + esc(label) + '" data-full="' + esc(img.src) + '" data-caption="' + esc(caption) + '">' +
            '<picture>' +
            '<source type="image/webp" srcset="' + esc(webp) + '">' +
            '<img src="' + esc(img.src) + '" alt="' + esc(img.alt || '') + '" loading="lazy" decoding="async">' +
            '</picture>' +
            '</button>' +
            (caption ? '<figcaption class="image-caption">' + esc(caption) + '</figcaption>' : '') +
            '</figure>';
    }

    function heroFigure(img) {
        if (!img) return '';
        var webp = img.src.replace(/\.jpe?g$/i, '.webp');
        var alt = img.alt || '';
        var caption = img.caption || img.alt || '';
        var label = alt ? 'Enlarge image: ' + alt : 'Enlarge image';
        return '' +
            '<div class="cs-hero">' +
            '<button type="button" class="cs-zoom" aria-label="' + esc(label) + '" data-full="' + esc(img.src) + '" data-caption="' + esc(caption) + '">' +
            '<picture>' +
            '<source type="image/webp" srcset="' + esc(webp) + '">' +
            '<img src="' + esc(img.src) + '" alt="' + esc(img.alt || '') + '" loading="eager" decoding="async">' +
            '</picture>' +
            '</button>' +
            '</div>';
    }

    function section(num, title, body, extraClass) {
        return '' +
            '<section class="case-study-section ' + (extraClass || '') + '">' +
            '<div class="section-num" aria-hidden="true">' + num + '</div>' +
            '<div class="section-main">' +
            '<h2 class="section-title">' + esc(title) + '</h2>' +
            body +
            '</div>' +
            '</section>';
    }

    function paragraphs(text) {
        var parts = String(text || '').split(/\n\n+/);
        return '<div class="section-content">' + parts.map(function (p) {
            return '<p>' + esc(p) + '</p>';
        }).join('') + '</div>';
    }

    function list(items) {
        if (!items || !items.length) return '';
        return '<ul class="section-list">' + items.map(function (i) {
            return '<li>' + esc(i) + '</li>';
        }).join('') + '</ul>';
    }

    function metaItem(label, valueHtml) {
        return '<div class="meta-item"><span class="meta-label">' + esc(label) + '</span><span class="meta-value">' + valueHtml + '</span></div>';
    }

    /* ---------- Prev / next ---------- */

    function pagination(projects, slug) {
        var ordered = Object.keys(projects)
            .map(function (k) { return projects[k]; })
            .sort(function (a, b) { return (a.order || 99) - (b.order || 99); });
        var idx = ordered.findIndex(function (p) { return p.slug === slug; });
        var prev = idx > 0 ? ordered[idx - 1] : null;
        var next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;

        var prevHtml = prev
            ? '<a class="cs-page cs-page--prev" href="/portfolio/' + esc(prev.slug) + '/" data-event="casestudy_open" data-event-label="' + esc(prev.slug) + '"><span class="cs-page__label">Previous</span><span class="cs-page__title">' + esc(prev.title) + '</span></a>'
            : '<span class="cs-page cs-page--empty"></span>';
        var nextHtml = next
            ? '<a class="cs-page cs-page--next" href="/portfolio/' + esc(next.slug) + '/" data-event="casestudy_open" data-event-label="' + esc(next.slug) + '"><span class="cs-page__label">Next</span><span class="cs-page__title">' + esc(next.title) + '</span></a>'
            : '<span class="cs-page cs-page--empty"></span>';

        return '' +
            '<nav class="cs-pagination" aria-label="Case study navigation">' +
            prevHtml +
            '<a class="cs-page cs-page--all" href="/portfolio/#work">All work</a>' +
            nextHtml +
            '</nav>';
    }

    /* ---------- Main render ---------- */

    function renderCaseStudy(project, projects) {
        var container = document.getElementById('case-study-content');
        if (!container) return;

        var images = Array.isArray(project.images) ? project.images : [];
        var hero = images[0];
        var inline = images.slice(1);
        var f = 0; // inline figure cursor
        var nextFig = function () { return inline[f] ? figure(inline[f++]) : ''; };

        var meta = '';
        meta += metaItem('Role', esc(project.role));
        if (project.industry) meta += metaItem('Industry', esc(project.industry));
        meta += metaItem('Timeline', esc(project.timeframe));
        if (project.tech) meta += metaItem('Tech', esc(project.tech));
        if (project.url) {
            meta += metaItem('Website',
                '<a href="' + esc(project.url) + '" target="_blank" rel="noopener noreferrer" class="meta-link" data-event="external_project_link" data-event-label="' + esc(project.slug) + '">' +
                esc(project.url.replace(/^https?:\/\//, '').replace(/\/$/, '')) +
                '</a>');
        }

        // Contiguous numbering: only counts sections that actually render.
        var n = 0;
        var num = function () { return String(++n).padStart(2, '0'); };

        var body = '';
        if (project.context) body += section(num(), 'Context', paragraphs(project.context));
        if (project.problem) body += section(num(), 'The problem', paragraphs(project.problem));
        body += nextFig();
        if (project.responsibilities) body += section(num(), 'My role', list(project.responsibilities));
        if (project.approach) body += section(num(), 'Approach', list(project.approach));
        body += nextFig();
        if (project.decisions) body += section(num(), 'Key decisions', list(project.decisions));
        body += nextFig();
        if (project.designSystem) body += section(num(), 'Systems & patterns', list(project.designSystem));
        // any remaining figures before the outcome
        while (inline[f]) { body += nextFig(); }
        if (project.outcome) body += section(num(), 'Outcome', paragraphs(project.outcome), 'section-outcome');
        if (project.reflection) body += section(num(), 'Reflection', paragraphs(project.reflection), 'section-reflection');

        container.innerHTML = '' +
            '<a href="/portfolio/#work" class="back-link">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
            'All work' +
            '</a>' +
            '<header class="case-study-header">' +
            '<p class="cs-eyebrow">' + esc(project.client) + '</p>' +
            '<h1 class="project-title">' + esc(project.title) + '</h1>' +
            (project.summary ? '<p class="cs-summary">' + esc(project.summary) + '</p>' : '') +
            '<div class="project-meta">' + meta + '</div>' +
            '</header>' +
            heroFigure(hero) +
            '<div class="case-study-body">' + body + '</div>' +
            pagination(projects, project.slug);

        document.title = project.title + ' — Michael Rossi';
        initLightbox();
    }

    /* ---------- Accessible lightbox ---------- */

    var lastFocused = null;
    var inertEls = [];

    function ensureLightbox() {
        var lb = document.querySelector('.lightbox');
        if (lb) return lb;
        lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.setAttribute('role', 'dialog');
        lb.setAttribute('aria-modal', 'true');
        lb.setAttribute('aria-label', 'Enlarged image');
        lb.hidden = true;
        lb.innerHTML =
            '<button class="lightbox-close" type="button" aria-label="Close image">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</button>' +
            '<div class="lightbox-content"><img src="" alt=""><p class="lightbox-caption"></p></div>';
        document.body.appendChild(lb);

        lb.addEventListener('click', function (e) {
            if (e.target === lb || e.target.closest('.lightbox-close')) closeLightbox();
        });
        document.addEventListener('keydown', function (e) {
            if (lb.hidden) return;
            if (e.key === 'Escape') { closeLightbox(); }
            if (e.key === 'Tab') { e.preventDefault(); lb.querySelector('.lightbox-close').focus(); }
        });
        return lb;
    }

    function openLightbox(trigger) {
        var lb = ensureLightbox();
        var img = lb.querySelector('.lightbox-content img');
        var cap = lb.querySelector('.lightbox-caption');
        var full = trigger.getAttribute('data-full');
        var caption = trigger.getAttribute('data-caption') || '';
        var innerImg = trigger.querySelector('img');

        lastFocused = trigger;
        img.src = full;
        img.alt = innerImg ? innerImg.alt : '';
        cap.textContent = caption;
        cap.style.display = caption ? 'block' : 'none';

        // Make everything except the lightbox inert so screen-reader users
        // can't reach background controls (complements aria-modal).
        inertEls = Array.prototype.filter.call(document.body.children, function (el) {
            return el !== lb && !el.classList.contains('skip-link');
        });
        inertEls.forEach(function (el) { el.setAttribute('inert', ''); });

        lb.hidden = false;
        // force reflow so the transition runs
        void lb.offsetWidth;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
        lb.querySelector('.lightbox-close').focus();
    }

    function closeLightbox() {
        var lb = document.querySelector('.lightbox');
        if (!lb || lb.hidden) return;
        lb.classList.remove('active');
        document.body.style.overflow = '';
        var done = function () {
            lb.hidden = true;
            lb.removeEventListener('transitionend', done);
            inertEls.forEach(function (el) { el.removeAttribute('inert'); });
            inertEls = [];
            if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
        };
        // fall back if no transitionend (reduced motion)
        lb.addEventListener('transitionend', done);
        setTimeout(done, 350);
    }

    function initLightbox() {
        ensureLightbox();
        document.querySelectorAll('.cs-zoom').forEach(function (btn) {
            btn.addEventListener('click', function () { openLightbox(btn); });
        });
    }

    /* ---------- Error state ---------- */

    function renderError(message) {
        var container = document.getElementById('case-study-content');
        if (!container) return;
        container.innerHTML =
            '<a href="/portfolio/#work" class="back-link">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>All work</a>' +
            '<div class="error-message"><h1>Project not found</h1><p>' + esc(message) + '</p></div>';
    }

    /* ---------- Init ---------- */

    async function init() {
        var loaded = function () { document.querySelector('.case-study').classList.add('loaded'); };
        var slug = getSlugFromPath();
        if (!slug) { renderError('No project specified.'); loaded(); return; }

        var projects = await fetchProjects();
        if (!projects) { renderError('Unable to load project data.'); loaded(); return; }

        var project = projects[slug];
        if (!project) { renderError('This project does not exist or has been moved.'); loaded(); return; }

        renderCaseStudy(project, projects);
        requestAnimationFrame(loaded);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
