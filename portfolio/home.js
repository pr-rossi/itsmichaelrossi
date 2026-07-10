/**
 * home.js — Renders the Selected Work cards on the homepage from projects.json.
 * The single source of truth for project content is /portfolio/projects.json.
 * Only projects with "featured": true are shown here, ordered by "order".
 */
(function () {
    'use strict';

    function esc(text) {
        if (text == null) return '';
        var div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    async function fetchProjects() {
        try {
            var res = await fetch('/portfolio/projects.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (err) {
            console.error('Could not load projects.json:', err);
            return null;
        }
    }

    function cover(project) {
        var img = project.images && project.images[0];
        if (!img) return '';
        var webp = img.src.replace(/\.jpe?g$/i, '.webp');
        var alt = esc(img.alt || project.title);
        return '<div class="card-thumb"><picture>' +
            '<source type="image/webp" srcset="' + esc(webp) + '">' +
            '<img src="' + esc(img.src) + '" alt="' + alt + '" loading="lazy" decoding="async">' +
            '</picture></div>';
    }

    function tags(caps) {
        if (!caps || !caps.length) return '';
        return '<ul class="tag-list" aria-label="Capabilities">' +
            caps.slice(0, 5).map(function (c) { return '<li class="tag">' + esc(c) + '</li>'; }).join('') +
            '</ul>';
    }

    function card(project, i) {
        var featured = i === 0 ? ' is-featured' : '';
        var num = String(i + 1).padStart(2, '0');
        var industry = project.industry ? '<span class="dot">·</span><span>' + esc(project.industry) + '</span>' : '';
        return '' +
            '<li class="work__item' + featured + ' reveal">' +
            '<a class="card-link" href="/portfolio/' + esc(project.slug) + '/" data-event="casestudy_open" data-event-label="' + esc(project.slug) + '">' +
            cover(project) +
            '<p class="card-index"><span>' + num + '</span><span class="dot">·</span><span>' + esc(project.client) + '</span>' + industry + '</p>' +
            '<div class="card-header"><h3 class="card-title">' + esc(project.title) + '</h3><span class="card-arrow" aria-hidden="true">→</span></div>' +
            '<p class="card-summary">' + esc(project.summary || '') + '</p>' +
            '<p class="card-meta"><span class="role">' + esc(project.role) + '</span><span>' + esc(project.timeframe) + '</span></p>' +
            tags(project.capabilities) +
            '</a>' +
            '</li>';
    }

    function render(projects) {
        var list = document.getElementById('project-list');
        if (!list || !projects) return;

        var featured = Object.keys(projects)
            .map(function (k) { return projects[k]; })
            .filter(function (p) { return p.featured !== false; })
            .sort(function (a, b) { return (a.order || 99) - (b.order || 99); });

        list.innerHTML = featured.map(card).join('');

        if (window.registerReveal) {
            window.registerReveal(list.querySelectorAll('.reveal'));
        }
    }

    (async function init() {
        var projects = await fetchProjects();
        if (projects) render(projects);
    })();
})();
