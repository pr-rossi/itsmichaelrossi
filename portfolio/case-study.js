/**
 * Case Study Renderer
 * Loads project data from projects.json and renders the case study page
 */

(function() {
    'use strict';

    // Get the project slug from the current URL path
    function getSlugFromPath() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        // Expected format: /p/{slug}/ or /p/{slug}
        if (segments.length >= 2 && segments[0] === 'portfolio') {
            return segments[1];
        }
        return null;
    }

    // Fetch the projects data
    async function fetchProjects() {
        try {
            const response = await fetch('/portfolio/projects.json');
            if (!response.ok) {
                throw new Error('Failed to load projects');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading projects:', error);
            return null;
        }
    }

    // Build a single figure block
    function figure(img) {
        if (!img) return '';
        return `
            <figure class="cs-figure">
                <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" loading="lazy">
                ${img.alt ? `<figcaption class="image-caption">${escapeHtml(img.alt)}</figcaption>` : ''}
            </figure>
        `;
    }

    // Build a numbered, two-column content section
    function section(num, title, body, extraClass) {
        return `
            <section class="case-study-section ${extraClass || ''}">
                <div class="section-num">${num}</div>
                <div class="section-main">
                    <h2 class="section-title">${escapeHtml(title)}</h2>
                    ${body}
                </div>
            </section>
        `;
    }

    function paragraph(text) {
        return `<div class="section-content"><p>${escapeHtml(text)}</p></div>`;
    }

    function list(items) {
        return `<ul class="section-list">${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    }

    // Render the case study content
    function renderCaseStudy(project) {
        const container = document.getElementById('case-study-content');
        if (!container) return;

        // First image becomes the hero; remaining images interleave through the story.
        const images = Array.isArray(project.images) ? project.images : [];
        const hero = images[0];
        const inline = images.slice(1);

        const metaItems = [
            { label: 'Role', value: escapeHtml(project.role) },
            { label: 'Timeline', value: escapeHtml(project.timeframe) },
        ];
        if (project.tech) metaItems.push({ label: 'Tech', value: escapeHtml(project.tech) });
        if (project.url) {
            metaItems.push({
                label: 'Website',
                value: `<a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer" class="meta-link">${escapeHtml(project.url.replace(/^https?:\/\//, ''))}</a>`,
            });
        }

        const html = `
            <a href="/portfolio/" class="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                All Projects
            </a>

            <header class="case-study-header">
                <div class="cs-eyebrow">${escapeHtml(project.client)}</div>
                <h1 class="project-title">${escapeHtml(project.title)}</h1>
                <div class="project-meta">
                    ${metaItems.map(m => `
                        <div class="meta-item">
                            <span class="meta-label">${m.label}</span>
                            <span class="meta-value">${m.value}</span>
                        </div>
                    `).join('')}
                </div>
            </header>

            ${hero ? `<div class="cs-hero"><img src="${escapeHtml(hero.src)}" alt="${escapeHtml(hero.alt)}"></div>` : ''}

            <div class="case-study-body">
                ${section('01', 'Context', paragraph(project.context))}
                ${section('02', 'My Role', list(project.responsibilities))}
                ${inline[0] ? figure(inline[0]) : ''}
                ${section('03', 'The Problem', paragraph(project.problem))}
                ${section('04', 'Key Decisions', list(project.decisions))}
                ${inline.slice(1).map(figure).join('')}
                ${section('05', 'Outcome', paragraph(project.outcome), 'section-outcome')}
            </div>

            <footer class="cs-footer">
                <span class="cs-footer-label">Selected Work · Michael Rossi</span>
                <a href="/portfolio/" class="cs-footer-link">
                    All projects
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </footer>
        `;

        container.innerHTML = html;

        // Update page title
        document.title = `${project.title} · Michael Rossi`;

        // Initialize lightbox
        initLightbox();
    }

    // Lightbox functionality
    function initLightbox() {
        // Create lightbox element if it doesn't exist
        if (!document.querySelector('.lightbox')) {
            const lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.innerHTML = `
                <button class="lightbox-close" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="lightbox-content">
                    <img src="" alt="">
                    <div class="lightbox-caption"></div>
                </div>
            `;
            document.body.appendChild(lightbox);
            
            // Close on backdrop click
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox || e.target.closest('.lightbox-close')) {
                    closeLightbox();
                }
            });
            
            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeLightbox();
                }
            });
        }
        
        // Add click handlers to images
        document.querySelectorAll('.cs-hero img, .cs-figure img').forEach(img => {
            img.addEventListener('click', () => {
                openLightbox(img.src, img.alt);
            });
        });
    }

    function openLightbox(src, alt) {
        const lightbox = document.querySelector('.lightbox');
        const img = lightbox.querySelector('.lightbox-content img');
        const caption = lightbox.querySelector('.lightbox-caption');
        
        img.src = src;
        img.alt = alt;
        caption.textContent = alt || '';
        caption.style.display = alt ? 'block' : 'none';
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        const lightbox = document.querySelector('.lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Render error state
    function renderError(message) {
        const container = document.getElementById('case-study-content');
        if (!container) return;

        container.innerHTML = `
            <div class="error-message">
                <h1>Project Not Found</h1>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }

    // Simple HTML escape function
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize
    async function init() {
        const slug = getSlugFromPath();
        
        if (!slug) {
            renderError('No project specified.');
            document.querySelector('.case-study').classList.add('loaded');
            return;
        }

        const projects = await fetchProjects();
        
        if (!projects) {
            renderError('Unable to load project data.');
            document.querySelector('.case-study').classList.add('loaded');
            return;
        }

        const project = projects[slug];
        
        if (!project) {
            renderError('This project does not exist or has been removed.');
            document.querySelector('.case-study').classList.add('loaded');
            return;
        }

        renderCaseStudy(project);
        
        // Fade in
        requestAnimationFrame(() => {
            document.querySelector('.case-study').classList.add('loaded');
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

