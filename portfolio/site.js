/**
 * site.js — Shared behavior across all portfolio pages.
 *  - Analytics-ready event shim (no vendor; pushes to window.dataLayer)
 *  - Reveal-on-scroll (respects prefers-reduced-motion)
 *  - Footer year
 *
 * To connect real analytics later: read from window.dataLayer, or replace
 * window.trackEvent() with a call into your analytics tool. Elements opt in
 * with data-event="..." and optional data-event-label="...".
 */
(function () {
    'use strict';

    /* ---- Analytics-ready event shim (sends nothing on its own) ---- */
    window.dataLayer = window.dataLayer || [];
    window.trackEvent = function (name, detail) {
        try {
            window.dataLayer.push(Object.assign({ event: name }, detail || {}));
        } catch (e) { /* no-op */ }
    };

    document.addEventListener('click', function (e) {
        var el = e.target && e.target.closest ? e.target.closest('[data-event]') : null;
        if (!el) return;
        window.trackEvent(el.getAttribute('data-event'), {
            label: el.getAttribute('data-event-label') || null,
            href: el.getAttribute('href') || null
        });
    });

    /* ---- Footer year ---- */
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
        el.textContent = String(new Date().getFullYear());
    });

    /* ---- Reveal-on-scroll ---- */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var supported = 'IntersectionObserver' in window;
    var observer = null;

    if (supported && !reduce) {
        observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('is-visible');
                    observer.unobserve(en.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }

    // Register nodes for reveal. Falls back to showing immediately.
    window.registerReveal = function (nodes) {
        if (!nodes) return;
        var list = nodes.forEach ? nodes : [nodes];
        list.forEach(function (el) {
            if (observer) {
                observer.observe(el);
            } else {
                el.classList.add('is-visible');
            }
        });
    };

    // Register any reveal elements already in the DOM.
    window.registerReveal(document.querySelectorAll('.reveal'));

    /* ---- Mobile nav toggle (disclosure with a blurred scrim behind it) ---- */
    (function () {
        var header = document.querySelector('.site-header');
        if (!header) return;
        var toggle = header.querySelector('.nav-toggle');
        var nav = document.getElementById('primary-nav');
        if (!toggle || !nav) return;

        // Scrim: dims + blurs the page content behind the open menu.
        var backdrop = document.createElement('div');
        backdrop.className = 'nav-backdrop';
        document.body.appendChild(backdrop);

        var inertEls = [];

        function isOpen() { return header.classList.contains('nav-open'); }

        function openNav() {
            header.classList.add('nav-open');
            backdrop.classList.add('is-open');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Close menu');
            document.body.style.overflow = 'hidden';
            // Take the background out of the tab order / AT while the menu is open
            inertEls = Array.prototype.filter.call(document.body.children, function (el) {
                return el !== header && el !== backdrop && !el.classList.contains('skip-link');
            });
            inertEls.forEach(function (el) { el.setAttribute('inert', ''); });
            document.addEventListener('keydown', onKeydown);
        }

        function closeNav(returnFocus) {
            if (!isOpen()) return;
            header.classList.remove('nav-open');
            backdrop.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open menu');
            document.body.style.overflow = '';
            inertEls.forEach(function (el) { el.removeAttribute('inert'); });
            inertEls = [];
            document.removeEventListener('keydown', onKeydown);
            if (returnFocus) toggle.focus();
        }

        function onKeydown(e) {
            if (e.key === 'Escape') closeNav(true);
        }

        toggle.addEventListener('click', function () {
            isOpen() ? closeNav(false) : openNav();
        });

        // Tapping the scrim closes the menu
        backdrop.addEventListener('click', function () { closeNav(false); });

        // Close after choosing a link (navigating or jumping to an anchor)
        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) closeNav(false);
        });

        // Reset when the viewport grows back to the desktop nav
        var mq = window.matchMedia('(min-width: 601px)');
        function onDesktop(e) { if (e.matches) closeNav(false); }
        if (mq.addEventListener) { mq.addEventListener('change', onDesktop); }
        else if (mq.addListener) { mq.addListener(onDesktop); }
    })();
})();
