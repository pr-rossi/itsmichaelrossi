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

    // Render the case study content
    function renderCaseStudy(project) {
        const container = document.getElementById('case-study-content');
        if (!container) return;

        const html = `
            <a href="/portfolio/" class="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                All Projects
            </a>
            
            <header class="case-study-header">
                <h1 class="project-title">${escapeHtml(project.title)}</h1>
                <div class="project-meta">
                    <div class="meta-item">
                        <span class="meta-label">Client</span>
                        <span class="meta-value">${escapeHtml(project.client)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Role</span>
                        <span class="meta-value">${escapeHtml(project.role)}</span>
                    </div>
                    ${project.tech ? `
                    <div class="meta-item">
                        <span class="meta-label">Tech</span>
                        <span class="meta-value">${escapeHtml(project.tech)}</span>
                    </div>
                    ` : ''}
                    <div class="meta-item">
                        <span class="meta-label">Timeline</span>
                        <span class="meta-value">${escapeHtml(project.timeframe)}</span>
                    </div>
                    ${project.url ? `
                    <div class="meta-item">
                        <span class="meta-label">Website</span>
                        <span class="meta-value"><a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer" class="meta-link">${escapeHtml(project.url.replace(/^https?:\/\//, ''))}</a></span>
                    </div>
                    ` : ''}
                </div>
            </header>

            <section class="case-study-section">
                <h2 class="section-title">Context</h2>
                <div class="section-content">
                    <p>${escapeHtml(project.context)}</p>
                </div>
            </section>

            <section class="case-study-section">
                <h2 class="section-title">My Role</h2>
                <ul class="section-list">
                    ${project.responsibilities.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
                </ul>
            </section>

            <section class="case-study-section">
                <h2 class="section-title">The Problem</h2>
                <div class="section-content">
                    <p>${escapeHtml(project.problem)}</p>
                </div>
            </section>

            <section class="case-study-section">
                <h2 class="section-title">Key Decisions</h2>
                <ul class="section-list">
                    ${project.decisions.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
                </ul>
            </section>

            <section class="case-study-section">
                <h2 class="section-title">Outcome</h2>
                <div class="section-content">
                    <p>${escapeHtml(project.outcome)}</p>
                </div>
            </section>

            ${project.images && project.images.length > 0 ? `
                <section class="case-study-images">
                    <h2 class="images-title">Visuals</h2>
                    <div class="image-grid">
                        ${project.images.map(img => `
                            <figure class="image-item">
                                <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" loading="lazy">
                                ${img.alt ? `<figcaption class="image-caption">${escapeHtml(img.alt)}</figcaption>` : ''}
                            </figure>
                        `).join('')}
                    </div>
                </section>
            ` : ''}
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
        document.querySelectorAll('.image-item img').forEach(img => {
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

