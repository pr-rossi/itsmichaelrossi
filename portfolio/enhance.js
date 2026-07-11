/**
 * enhance.js — Progressive enhancement only. All content is in the HTML;
 * this adds the mobile menu, the image lightbox, and analytics hooks.
 * If it never runs, the site still works.
 */
(function () {
    'use strict';

    /* ---- Analytics-ready event shim (sends nothing on its own) ---- */
    window.dataLayer = window.dataLayer || [];
    window.trackEvent = function (name, detail) {
        try { window.dataLayer.push(Object.assign({ event: name }, detail || {})); } catch (e) {}
    };
    document.addEventListener('click', function (e) {
        var el = e.target && e.target.closest ? e.target.closest('[data-event]') : null;
        if (!el) return;
        window.trackEvent(el.getAttribute('data-event'), {
            label: el.getAttribute('data-event-label') || null,
            href: el.getAttribute('href') || null
        });
    });

    /* ---- Mobile navigation ---- */
    (function () {
        var header = document.querySelector('.masthead');
        if (!header) return;
        var toggle = header.querySelector('.nav-toggle');
        var nav = document.getElementById('primary-nav');
        if (!toggle || !nav) return;

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
        function onKeydown(e) { if (e.key === 'Escape') closeNav(true); }

        toggle.addEventListener('click', function () { isOpen() ? closeNav(false) : openNav(); });
        backdrop.addEventListener('click', function () { closeNav(false); });
        nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(false); });

        var mq = window.matchMedia('(min-width: 721px)');
        function onDesktop(e) { if (e.matches) closeNav(false); }
        if (mq.addEventListener) mq.addEventListener('change', onDesktop);
        else if (mq.addListener) mq.addListener(onDesktop);
    })();

    /* ---- Image lightbox (case-study figures) ---- */
    (function () {
        var zooms = document.querySelectorAll('.cs-zoom');
        if (!zooms.length) return;

        var lastFocused = null, inertEls = [], lb = null;

        function build() {
            lb = document.createElement('div');
            lb.className = 'lightbox';
            lb.setAttribute('role', 'dialog');
            lb.setAttribute('aria-modal', 'true');
            lb.setAttribute('aria-label', 'Enlarged image');
            lb.hidden = true;
            lb.innerHTML =
                '<button class="lightbox-close" type="button" aria-label="Close image">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
                '</button><div class="lightbox-content"><img src="" alt=""><p class="lightbox-caption"></p></div>';
            document.body.appendChild(lb);
            lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.lightbox-close')) close(); });
            document.addEventListener('keydown', function (e) {
                if (lb.hidden) return;
                if (e.key === 'Escape') close();
                if (e.key === 'Tab') { e.preventDefault(); lb.querySelector('.lightbox-close').focus(); }
            });
        }

        function open(btn) {
            if (!lb) build();
            var img = lb.querySelector('.lightbox-content img');
            var cap = lb.querySelector('.lightbox-caption');
            var inner = btn.querySelector('img');
            lastFocused = btn;
            img.src = btn.getAttribute('data-full');
            img.alt = inner ? inner.alt : '';
            var caption = btn.getAttribute('data-caption') || '';
            cap.textContent = caption;
            cap.style.display = caption ? 'block' : 'none';
            inertEls = Array.prototype.filter.call(document.body.children, function (el) { return el !== lb; });
            inertEls.forEach(function (el) { el.setAttribute('inert', ''); });
            lb.hidden = false;
            void lb.offsetWidth;
            lb.classList.add('active');
            document.body.style.overflow = 'hidden';
            lb.querySelector('.lightbox-close').focus();
        }
        function close() {
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
            lb.addEventListener('transitionend', done);
            setTimeout(done, 350);
        }

        zooms.forEach(function (btn) { btn.addEventListener('click', function () { open(btn); }); });
    })();

    /* ---- Motion: scroll reveals + hero cursor glow (off under reduced motion) ---- */
    (function () {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;
        document.documentElement.classList.add('anim');

        var targets = document.querySelectorAll('.reveal, .reveal-media, .develop');
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
                });
            }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
            targets.forEach(function (el) { io.observe(el); });
        } else {
            targets.forEach(function (el) { el.classList.add('is-visible'); });
        }

        // Soft glow that follows the cursor on the hero (fine pointers only)
        if (window.matchMedia('(pointer: fine)').matches) {
            var raf = null, mx = 50, my = 42;
            window.addEventListener('mousemove', function (ev) {
                mx = (ev.clientX / window.innerWidth) * 100;
                my = (ev.clientY / window.innerHeight) * 100;
                if (!raf) raf = requestAnimationFrame(function () {
                    document.body.style.setProperty('--mx', mx.toFixed(2) + '%');
                    document.body.style.setProperty('--my', my.toFixed(2) + '%');
                    raf = null;
                });
            }, { passive: true });

            // Magnetic 3D tilt on the work images
            document.querySelectorAll('.band__media').forEach(function (media) {
                var rafT = null, rx = 0, ry = 0;
                media.addEventListener('mousemove', function (ev) {
                    var r = media.getBoundingClientRect();
                    rx = -((ev.clientY - r.top) / r.height - 0.5) * 6;
                    ry = ((ev.clientX - r.left) / r.width - 0.5) * 8;
                    if (!rafT) rafT = requestAnimationFrame(function () {
                        media.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(1.01)';
                        rafT = null;
                    });
                }, { passive: true });
                media.addEventListener('mouseleave', function () { media.style.transform = ''; });
                // reset before navigating so the view-transition snapshot isn't tilted
                media.addEventListener('pointerdown', function () { media.style.transform = ''; });
            });
        }
    })();
})();
