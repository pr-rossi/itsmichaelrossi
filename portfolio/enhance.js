/**
 * enhance.js: progressive enhancement only. All content is in the HTML;
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

    /* ---- Transparent masthead while the hero is under it ----
       Only on pages that open with a full-bleed hero. Without JS the bar just
       stays solid, which is still legible over the scrimmed top of the photo. */
    (function () {
        var header = document.querySelector('.masthead');
        if (!header || !document.querySelector('.hero')) return;

        var ticking = false;
        function sync() {
            ticking = false;
            header.classList.toggle('is-top', window.scrollY < 40);
        }
        sync();
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(sync); }
        }, { passive: true });
    })();

    /* ---- Work index: a "View" cursor over the project rows ----
       Pure enhancement, fine pointers only. With no JS (or reduced motion) the
       rows keep the ordinary pointer and lose nothing. */
    (function () {
        var work = document.querySelector('.work');
        if (!work || !window.matchMedia) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (!work.querySelector('.band')) return;

        var el = document.createElement('div');
        el.className = 'work-cursor';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = '<span>View</span>';
        document.body.appendChild(el);
        work.classList.add('has-cursor'); // only now is it safe to hide the real cursor

        var tx = 0, ty = 0, x = 0, y = 0, raf = null, shown = false;

        function frame() {
            raf = null;
            // Tighter easing than a decorative follower: this stands in for the
            // real pointer, so it must not lag behind where you actually click.
            x += (tx - x) * 0.24;
            y += (ty - y) * 0.24;
            el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-50%)';
            if (shown || Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4) raf = requestAnimationFrame(frame);
        }
        function loop() { if (!raf) raf = requestAnimationFrame(frame); }

        function show(on) {
            if (on === shown) return;
            shown = on;
            el.classList.toggle('is-visible', on);
        }

        work.addEventListener('pointermove', function (e) {
            tx = e.clientX; ty = e.clientY;
            // Hit-test every move rather than per-row enter/leave: this also covers
            // the gaps between rows and the section head, with one listener.
            var band = e.target.closest ? e.target.closest('.band') : null;
            // The external "Live" link leaves the site, so it keeps a real pointer.
            if (band && e.target.closest('.band__facts a')) band = null;
            if (band && !shown) { x = tx; y = ty; } // open in place, don't fly across
            show(!!band);
            loop();
        }, { passive: true });

        work.addEventListener('pointerleave', function () { show(false); loop(); });

        // Belt and braces for the one link that leaves the site: enter/leave fire
        // on the element itself, so the swap never depends on a move event's
        // hit-target being up to date.
        Array.prototype.forEach.call(work.querySelectorAll('.band__facts a'), function (a) {
            a.addEventListener('pointerenter', function () { show(false); });
            a.addEventListener('pointerleave', function () { show(true); loop(); });
        });
    })();

    /* ---- Contents rail: mark the section you're currently reading ----
       The index is a plain anchor list in the HTML and navigates fine without
       this; all this adds is the "you are here" state. */
    (function () {
        var links = document.querySelectorAll('.toc a');
        if (!links.length) return;

        var items = [];
        Array.prototype.forEach.call(links, function (a) {
            var target = document.getElementById(a.getAttribute('href').slice(1));
            if (target) items.push({ link: a, target: target });
        });
        if (!items.length) return;

        var current = null, ticking = false;

        function sync() {
            ticking = false;
            // The section that most recently crossed the reading line wins; before
            // any of them do, the first stays marked.
            var line = window.innerHeight * 0.35;
            var found = items[0];
            for (var i = 0; i < items.length; i++) {
                if (items[i].target.getBoundingClientRect().top <= line) found = items[i];
                else break;
            }
            if (found === current) return;
            if (current) current.link.removeAttribute('aria-current');
            found.link.setAttribute('aria-current', 'location');
            current = found;
        }

        sync();
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(sync); }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(sync); }
        }, { passive: true });
    })();

    /* ---- Motion: scroll reveals (off under reduced motion) ---- */
    (function () {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;
        document.documentElement.classList.add('anim');

        var targets = document.querySelectorAll('.reveal');
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
    })();
})();
