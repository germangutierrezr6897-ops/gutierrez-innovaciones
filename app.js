/* ==========================================================================
   GUTIÉRREZ INNOVACIONES CL - INTERACTIVE WEB LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Computed once and reused by every motion-gated effect below (hero tilt, portfolio tilt/parallax, cursor spotlight)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1.1 HERO STAT COUNT-UP (runs on load, not scroll-gated — the hero is always above the fold)
    const heroStat = document.getElementById('hero-stat');
    if (heroStat) {
        const target = parseFloat(heroStat.getAttribute('data-target'));
        const duration = 1400;
        const start = performance.now();
        function tickHeroStat(now) {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            heroStat.textContent = (target * eased).toFixed(1) + '%';
            if (progress < 1) requestAnimationFrame(tickHeroStat);
        }
        requestAnimationFrame(tickHeroStat);
    }

    // 1.2 HERO SCROLL DEPTH + TILT: subtle 3D on the phone-mockup card as you
    // scroll past the hero, plus mouse tilt on desktop. Desktop pointer only —
    // mobile keeps just the existing CSS float/Ken Burns idle animations.
    // Perspective lives in the transform itself (perspective(...)), same
    // pattern as the portfolio card tilt below, so it composes into one write.
    const heroSection = document.getElementById('hero');
    const heroBgImage = document.querySelector('.hero-bg-image');
    const heroVisualCard = document.querySelector('.hero-visual-card');
    const heroDepthLayers = Array.from(document.querySelectorAll('.hero-depth-layer'));
    const supportsHeroTilt = window.matchMedia('(pointer: fine)').matches && window.innerWidth > 900;

    if (heroSection && heroBgImage && heroVisualCard && !prefersReducedMotion && supportsHeroTilt) {
        heroVisualCard.classList.add('hero-tilt-active'); // turns off the cardFloat keyframe so it stops fighting the JS transform

        let heroInView = true;
        const heroObserver = new IntersectionObserver((entries) => {
            heroInView = entries[0].isIntersecting;
        }, { threshold: 0 });
        heroObserver.observe(heroSection);

        let mouseRotateX = 0;
        let mouseRotateY = 0;
        let heroTicking = false;

        function updateHeroDepth() {
            const rect = heroSection.getBoundingClientRect();
            const progress = Math.min(1, Math.max(0, -rect.top / rect.height));
            heroBgImage.style.transform = `translateY(${(progress * 25).toFixed(1)}px)`;
            heroVisualCard.style.transform = `perspective(1200px) rotateX(${(progress * -6 + mouseRotateX).toFixed(2)}deg) rotateY(${mouseRotateY.toFixed(2)}deg) translateY(${(progress * -20).toFixed(1)}px)`;
            heroDepthLayers.forEach((layer, i) => {
                const factor = i % 2 === 0 ? 20 : -16;
                layer.style.transform = `translateY(${(progress * factor).toFixed(1)}px)`;
            });
            heroTicking = false;
        }

        function requestHeroUpdate() {
            if (!heroInView || heroTicking) return;
            heroTicking = true;
            requestAnimationFrame(updateHeroDepth);
        }

        heroVisualCard.addEventListener('mousemove', (e) => {
            const rect = heroVisualCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            mouseRotateX = ((y - rect.height / 2) / (rect.height / 2)) * -4;
            mouseRotateY = ((x - rect.width / 2) / (rect.width / 2)) * 4;
            requestHeroUpdate();
        });
        heroVisualCard.addEventListener('mouseleave', () => {
            mouseRotateX = 0;
            mouseRotateY = 0;
            requestHeroUpdate();
        });
        window.addEventListener('scroll', requestHeroUpdate, { passive: true });
        requestHeroUpdate();
    }

    // 1.3 LETTER-REVEAL: hero H1 staggers in on load, every section H2
    // staggers in each time it scrolls into view — and
    // both replay on re-entry (scroll away, then back). Splits by word first
    // (each word an inline-block span) and only then by character inside
    // each word, so line-wrapping still happens at real spaces and never
    // mid-word. Element children (e.g. the hero's .highlight-text span) are
    // left completely intact — split as one atomic stagger step, not
    // recursed into — so its own photo-clip text effect isn't touched.
    // Skipped entirely under prefers-reduced-motion or if GSAP failed to
    // load: headings just stay as plain, already-readable text.
    if (!prefersReducedMotion && typeof window.gsap !== 'undefined') {
        function splitCharsForStagger(el) {
            const originalNodes = Array.from(el.childNodes);
            el.textContent = '';
            const chars = [];

            function appendWord(word) {
                const wordSpan = document.createElement('span');
                wordSpan.style.display = 'inline-block';
                Array.from(word).forEach(ch => {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'char';
                    charSpan.textContent = ch;
                    wordSpan.appendChild(charSpan);
                    chars.push(charSpan);
                });
                el.appendChild(wordSpan);
            }

            originalNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const words = node.textContent.split(' ');
                    words.forEach((word, i) => {
                        if (word.length > 0) appendWord(word);
                        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
                    });
                } else {
                    el.appendChild(node);
                    chars.push(node);
                }
            });

            return chars;
        }

        // Re-playable, not one-shot: every char set replays each time its
        // heading re-enters the viewport (scrolling back up included), and
        // resets to hidden the moment it leaves — so it's ready to play again.
        function playChars(chars, y, duration, stagger, delay) {
            gsap.killTweensOf(chars);
            gsap.to(chars, { opacity: 1, y: 0, duration, stagger, ease: 'power3.out', delay: delay || 0 });
        }
        function hideChars(chars, y) {
            gsap.killTweensOf(chars);
            gsap.set(chars, { opacity: 0, y });
        }

        const heroTitleEl = document.querySelector('.hero-title');
        if (heroTitleEl) {
            const heroChars = splitCharsForStagger(heroTitleEl);
            gsap.set(heroChars, { opacity: 0, y: 24 });
            let heroPlayedOnce = false;
            const heroTitleObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        playChars(heroChars, 24, 0.9, 0.045, heroPlayedOnce ? 0 : 0.3);
                        heroPlayedOnce = true;
                    } else {
                        hideChars(heroChars, 24);
                    }
                });
            }, { threshold: 0.3 });
            heroTitleObserver.observe(heroTitleEl);
        }

        const sectionTitleEls = Array.from(document.querySelectorAll('.section-title'));
        if (sectionTitleEls.length > 0) {
            sectionTitleEls.forEach(titleEl => {
                const chars = splitCharsForStagger(titleEl);
                gsap.set(chars, { opacity: 0, y: 18 });
                const titleObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            playChars(chars, 18, 0.7, 0.035);
                        } else {
                            hideChars(chars, 18);
                        }
                    });
                }, { threshold: 0.35 });
                titleObserver.observe(titleEl);
            });
        }
    }

    // 2. HEADER SCROLL & MOBILE NAVIGATION MENU
    const header = document.getElementById('site-header');
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2.0 SCROLLSPY: highlight the nav link of the section currently in view
    const scrollspyLinks = Array.from(document.querySelectorAll('.nav-links > li > a:not(.btn-primary)'));
    const scrollspySections = scrollspyLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if (scrollspySections.length > 0) {
        const scrollspyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const id = '#' + entry.target.id;
                scrollspyLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === id);
                });
            });
        }, {
            rootMargin: '-45% 0px -50% 0px',
            threshold: 0,
        });

        scrollspySections.forEach(section => scrollspyObserver.observe(section));
    }

    // 2.1 PORTFOLIO: either the cinematic horizontal fly-by (desktop pointer,
    // wide viewport, motion allowed, GSAP loaded from CDN) or the original
    // hover-tilt + scroll-parallax on the static grid — never both, they'd
    // fight over the same `transform` property on the same cards.
    // Everywhere else (mobile, touch, narrow window, reduced motion, or if
    // the CDN script ever fails to load) the section is just the plain grid
    // already in index.html/style.css — pure progressive enhancement.
    //
    // The whole row (.portfolio-grid, laid out as a flex filmstrip by CSS
    // under .cinematic-active) is dragged right-to-left by one scrubbed
    // tween. Each card's own scale/opacity is recomputed every tick from
    // its distance to the viewport's horizontal center — largest and most
    // opaque exactly as it passes in front of the user, easing back down
    // toward the edges. Card position is derived analytically (offsetLeft +
    // the row's live x) instead of getBoundingClientRect() in the loop, so
    // this never forces a layout read on scroll.
    const portfolioScene = document.querySelector('.portfolio-scene');
    const portfolioGrid = document.querySelector('.portfolio-grid');
    const portfolioCardEls = Array.from(document.querySelectorAll('.portfolio-grid .portfolio-card'));
    const supportsCinematicPortfolio = window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 1024;
    const useCinematicPortfolio = !prefersReducedMotion && supportsCinematicPortfolio &&
        portfolioScene && portfolioGrid && portfolioCardEls.length > 0 &&
        typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

    if (useCinematicPortfolio) {
        gsap.registerPlugin(ScrollTrigger);
        // Unifies how mouse-wheel/trackpad scroll deltas get read across browsers —
        // without it, chunky wheel input can make a scrubbed animation feel like
        // it's stepping instead of flowing. This is the standard GSAP fix for that.
        ScrollTrigger.normalizeScroll(true);
        portfolioScene.classList.add('cinematic-active');
        portfolioCardEls.forEach(card => card.classList.remove('reveal')); // GSAP owns opacity/transform now, not the IntersectionObserver reveal system

        const viewportW = window.innerWidth;
        const rowWidth = portfolioGrid.scrollWidth; // read once, after the flex layout from .cinematic-active has applied
        const maxDist = viewportW * 0.28; // narrower reach = the grow/shrink happens over less horizontal travel, so the arc reads as an actual curve instead of a long flat plateau
        const cardMetrics = portfolioCardEls.map(el => ({
            el,
            center: el.offsetLeft + el.offsetWidth / 2,
        }));

        function updateCardScales() {
            const rowX = gsap.getProperty(portfolioGrid, 'x');
            const viewportCenter = viewportW / 2;
            cardMetrics.forEach(({ el, center }) => {
                const xNorm = Math.max(-1, Math.min(1, ((center + rowX) - viewportCenter) / maxDist));
                // Upper-semicircle equation (y = sqrt(1 - x^2)): 1 dead-center, 0 at
                // the edges, with genuine circular curvature — not a straight taper —
                // driving size, opacity AND a vertical rise, for the "planet arcing
                // past the viewer" path instead of a flat horizontal slide.
                const arc = Math.sqrt(Math.max(0, 1 - xNorm * xNorm));
                gsap.set(el, {
                    scale: 0.6 + arc * 0.45,     // born small, swells to its largest dead-center (max 1.05x — kept modest on purpose, with real margin to spare even on shorter/laptop-height viewports)
                    opacity: 0.3 + arc * 0.7,
                    y: -arc * 65,                  // rises into the arc as it crosses, settles back down at the edges — big enough to actually read as a curved path, not just a size change
                    zIndex: Math.round(arc * 100), // whichever card is closest/biggest always renders on top of its neighbors
                    force3D: true,                 // keeps this on the GPU compositor instead of falling back to a CPU-painted transform
                });
            });
        }

        const startX = viewportW * 0.45; // first card starts just off-screen right, not a full viewport away — less dead scroll before it appears
        gsap.set(portfolioGrid, { x: startX });
        updateCardScales();

        // Deferred to the next tick on purpose: the services-grid stack below
        // also pins (with its own pin-spacer), and a pinned trigger's 'top top'
        // is measured once at creation — if this runs first, it captures the
        // page's height *before* that other pin-spacer exists and permanently
        // under-measures by however much space that spacer reserves (confirmed
        // by hand: a fresh trigger created after both pins exist lands on the
        // correct position; ScrollTrigger.refresh() on the already-wrong one
        // does not self-correct it). Letting the rest of this synchronous
        // handler — including the services pin — finish first avoids the bad
        // measurement entirely, which is what was letting the pinned, opaque
        // portfolio scene engage early and cover the capability band above it.
        setTimeout(() => {
            gsap.to(portfolioGrid, {
                x: -rowWidth, // last card ends fully past the left edge
                ease: 'none',
                onUpdate: updateCardScales,
                scrollTrigger: {
                    trigger: portfolioScene,
                    start: 'top top',
                    end: () => '+=' + Math.round((startX + rowWidth) * 0.5), // matches the actual travel distance (startX to -rowWidth) now that startX is smaller
                    pin: true,
                    scrub: 0.7, // more inertia/lag than before — reads as a smooth drift instead of tracking the wheel 1:1
                    anticipatePin: 1,
                },
            });
        }, 0);

        // Browser zoom changes the effective CSS viewport size, which can leave
        // ScrollTrigger's pin measurements stale (it measures once at setup).
        // Force a recompute after full load and on resize/zoom so the pin
        // position and boundaries stay correct instead of drifting.
        window.addEventListener('load', () => ScrollTrigger.refresh());
        let resizeRefreshTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeRefreshTimer);
            resizeRefreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
        });
    } else if (!prefersReducedMotion) {
        // No pointer-fine + wide-viewport here, so this is also what mobile/touch
        // gets. Mouse tilt only ever fires from real mousemove events (never on
        // touch), but the scroll-linked piece below runs everywhere — so it
        // carries the "grows as it passes you" arc feeling onto the single-column
        // mobile grid too, just vertical (center of viewport) instead of
        // horizontal, using the same semicircle falloff as the desktop version.
        const portfolioCardStates = portfolioCardEls.map((el, i) => ({
            el,
            factor: (i % 2 === 0) ? -0.04 : 0.06,
            rotateX: 0,
            rotateY: 0,
            liftY: 0,
            parallaxY: 0,
            arcScale: 1,
        }));

        function applyCardTransform(state) {
            state.el.style.transform = `perspective(900px) rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg) translateY(${(state.liftY + state.parallaxY).toFixed(1)}px) scale(${state.arcScale.toFixed(3)})`;
        }

        portfolioCardStates.forEach(state => {
            state.el.addEventListener('mousemove', (e) => {
                const rect = state.el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                state.rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -5;
                state.rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 5;
                state.liftY = -4;
                applyCardTransform(state);
            });
            state.el.addEventListener('mouseleave', () => {
                state.rotateX = 0;
                state.rotateY = 0;
                state.liftY = 0;
                applyCardTransform(state);
            });
        });

        let parallaxTicking = false;
        function updateParallax() {
            const vh = window.innerHeight;
            const maxDist = vh * 0.7;
            portfolioCardStates.forEach(state => {
                const rect = state.el.getBoundingClientRect();
                const centerDelta = (rect.top + rect.height / 2) - vh / 2;
                state.parallaxY = centerDelta * state.factor;
                const xNorm = Math.max(-1, Math.min(1, centerDelta / maxDist));
                const arc = Math.sqrt(Math.max(0, 1 - xNorm * xNorm)); // same semicircle falloff as the desktop carousel, applied vertically here
                state.arcScale = 0.94 + arc * 0.1; // gentler than desktop (0.94–1.04) — cards stay fully legible in a single mobile column, this is a pulse, not a size swing
                applyCardTransform(state);
            });
            parallaxTicking = false;
        }
        window.addEventListener('scroll', () => {
            if (!parallaxTicking) {
                requestAnimationFrame(updateParallax);
                parallaxTicking = true;
            }
        });
        updateParallax();
    }

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('nav-active');
            menuToggle.classList.toggle('toggle');

            const burgerLines = menuToggle.querySelectorAll('div');
            if (navMenu.classList.contains('nav-active')) {
                burgerLines[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                burgerLines[1].style.opacity = '0';
                burgerLines[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
            } else {
                burgerLines[0].style.transform = 'none';
                burgerLines[1].style.opacity = '1';
                burgerLines[2].style.transform = 'none';
            }
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('nav-active');
                const burgerLines = menuToggle.querySelectorAll('div');
                burgerLines[0].style.transform = 'none';
                burgerLines[1].style.opacity = '1';
                burgerLines[2].style.transform = 'none';
            });
        });
    }

    // 2.2 CURSOR SPOTLIGHT ON CARDS
    if (!prefersReducedMotion) {
        document.querySelectorAll('.service-card, .stat-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--spot-x', ((e.clientX - rect.left) / rect.width) * 100 + '%');
                card.style.setProperty('--spot-y', ((e.clientY - rect.top) / rect.height) * 100 + '%');
                card.style.setProperty('--spotlight-opacity', '1');
            });
            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--spotlight-opacity', '0');
            });
        });
    }

    // 3. SERVICES TABS FILTER SYSTEM
    const tabButtons = document.querySelectorAll('.tab-btn');
    const serviceCards = document.querySelectorAll('.service-card');
    const servicesGrid = document.getElementById('services-grid');
    let rebuildServicesStack = null; // assigned below in "4. SERVICES CINEMATIC STACK" when GSAP is driving the section

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-tab');

            if (servicesGrid) {
                servicesGrid.style.opacity = '0';

                setTimeout(() => {
                    serviceCards.forEach(card => {
                        const cardCat = card.getAttribute('data-category');
                        if (category === 'all' || cardCat === category) {
                            card.style.display = 'flex';
                        } else {
                            card.style.display = 'none';
                        }
                    });

                    servicesGrid.style.opacity = '1';

                    if (rebuildServicesStack) rebuildServicesStack();
                }, 300);
            }
        });
    });

    // 4. SERVICES CINEMATIC STACK — cards fade in and drop into place one at
    // a time, on top of the previous one, while the section stays pinned in
    // the viewport (instead of scrolling past as a tall column of cards).
    // Progressive enhancement: the plain overlapping column defined in CSS
    // (the negative-margin .service-card rules) is what's on screen already
    // and stays as the fallback when GSAP/ScrollTrigger aren't available or
    // the user prefers reduced motion.
    const serviceCardEls = Array.from(document.querySelectorAll('.services-grid .service-card'));
    const useCinematicServices = !prefersReducedMotion && servicesGrid && serviceCardEls.length > 0 &&
        typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

    if (useCinematicServices) {
        gsap.registerPlugin(ScrollTrigger);
        servicesGrid.classList.add('stack-active');
        serviceCardEls.forEach(card => card.classList.remove('reveal')); // GSAP owns opacity/transform now, not the IntersectionObserver reveal system

        let servicesStackTl = null;
        const headerEl = document.querySelector('header');

        rebuildServicesStack = () => {
            if (servicesStackTl) {
                servicesStackTl.scrollTrigger.kill();
                servicesStackTl.kill();
                servicesStackTl = null;
            }

            const visibleCards = serviceCardEls.filter(card => getComputedStyle(card).display !== 'none');
            if (visibleCards.length === 0) return;

            gsap.set(visibleCards, {
                opacity: 0,
                y: -130,
                scale: 0.94,
                rotation: i => (i % 2 === 0 ? -2.4 : 2), // matches the odd/even --tilt values in CSS
            });
            gsap.set(visibleCards[0], { opacity: 1, y: 0, scale: 1 });

            const headerOffset = (headerEl ? headerEl.offsetHeight : 84) + 16;
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: servicesGrid,
                    start: 'top top+=' + headerOffset,
                    end: () => '+=' + Math.max(1, visibleCards.length - 1) * 320,
                    pin: true,
                    scrub: 0.15,
                    anticipatePin: 1,
                    // Safety net, independent of whatever the scrub progress
                    // says: the moment we've scrolled fully past this section,
                    // force every card invisible, and only let the scrubbed
                    // opacity take back over once we've scrolled back into
                    // range. Without this, any pin-boundary drift (a stale
                    // ScrollTrigger measurement, a resize mid-scroll) can
                    // leave the last opaque card rendering into whatever
                    // section comes after — reported as the stack bleeding
                    // through on top of the Proyectos section.
                    onLeave: () => gsap.set(visibleCards, { opacity: 0 }),
                    onEnterBack: () => ScrollTrigger.update(),
                },
            });

            // Each card gets a full timeline "unit" of scroll (320px, see the
            // scrollTrigger end above). It spends the first 0.35 of that unit
            // dropping in from above (-130px) and fading to opaque with a
            // slight bounce on landing — the remaining ~0.65 is scroll dwell
            // time where it just sits fully opaque and readable before the
            // next card starts falling on top of it. Paired with the low
            // scrub value above (0.15, was 0.6) so the fall tracks the
            // scroll tightly instead of visibly lagging/catching up behind
            // it — that lag was reading as the card sitting "out of place"
            // for a couple of seconds after the user stopped scrolling.
            visibleCards.slice(1).forEach((card, i) => {
                tl.to(card, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.5)' }, i);
            });

            servicesStackTl = tl;
        };

        rebuildServicesStack();

        window.addEventListener('load', () => ScrollTrigger.refresh());

        // Only a WIDTH change (rotation, real window resize) needs a full
        // rebuild — card size and stage height depend on it. Mobile browsers
        // fire plain `resize` for the URL bar showing/hiding on scroll,
        // which only changes height; rebuilding then kills and recreates the
        // ScrollTrigger while the user may already be scrolled well past the
        // section, and briefly removing its pin-spacer shrinks the page
        // enough that the browser clamps scroll position — which can land
        // back inside the (now recreated) trigger's range and pin it again
        // on top of whatever section the user has actually scrolled to.
        let servicesResizeTimer = null;
        let lastServicesWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            clearTimeout(servicesResizeTimer);
            servicesResizeTimer = setTimeout(() => {
                if (window.innerWidth !== lastServicesWidth) {
                    lastServicesWidth = window.innerWidth;
                    rebuildServicesStack();
                }
                ScrollTrigger.refresh();
            }, 200);
        });
    }

    // 5. INTERSECTION OBSERVER FOR SCROLL REVEALS
    const revealElements = document.querySelectorAll('.reveal');

    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');

                    const targetStats = entry.target.querySelectorAll('.stat-number');
                    if (targetStats.length > 0) {
                        animateStats(targetStats);
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    }

    // 6. STATISTICS COUNTER ANIMATION
    function animateStats(stats) {
        stats.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            let current = 0;
            const duration = 2000;
            const stepTime = Math.abs(Math.floor(duration / target));

            const timer = setInterval(() => {
                current += 1;
                if (stat.getAttribute('data-target') === '4') {
                    stat.textContent = current + " sem";
                } else if (stat.getAttribute('data-target') === '50') {
                    stat.textContent = current + "+";
                } else {
                    stat.textContent = current + "%";
                }

                if (current >= target) {
                    clearInterval(timer);
                    if (stat.getAttribute('data-target') === '4') {
                        stat.textContent = target + " sem";
                    } else if (stat.getAttribute('data-target') === '50') {
                        stat.textContent = target + "+";
                    } else {
                        stat.textContent = target + "%";
                    }
                }
            }, Math.max(stepTime, 20));
        });
    }

    // 7. FORM SUBMISSION VALIDATION & DECORATION
    const contactForm = document.getElementById('main-contact-form');
    const formStatus = document.getElementById('form-status-msg');

    if (contactForm && formStatus) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('form-name').value;
            const email = document.getElementById('form-email').value;
            const service = document.getElementById('form-service').value;

            console.log(`[Gutiérrez Innovaciones CL] Formulario Recibido: ${name} (${email}) - Servicio: ${service}`);

            formStatus.classList.add('success');
            formStatus.textContent = `¡Gracias, ${name}! Hemos recibido tu requerimiento de ${service}. Un asesor comercial te contactará al correo ${email} a la brevedad.`;

            contactForm.reset();

            setTimeout(() => {
                formStatus.classList.remove('success');
                formStatus.style.display = 'none';
            }, 8000);
        });
    }

    // 8. VIRTUAL ASSISTANT WIDGET: not a real chatbot — it hands the visitor's
    // message off to WhatsApp (opens wa.me pre-filled with their text, they
    // just tap send there) and shows a canned confirmation bubble in the
    // widget itself, since a static site has no backend to send messages for real.
    const assistantLauncher = document.getElementById('assistant-launcher');
    const assistantPanel = document.getElementById('assistant-panel');
    const assistantClose = document.getElementById('assistant-close');
    const assistantForm = document.getElementById('assistant-form');
    const assistantInput = document.getElementById('assistant-input');
    const assistantMessages = document.getElementById('assistant-messages');
    const ASSISTANT_WHATSAPP_NUMBER = '56931335507';

    if (assistantLauncher && assistantPanel && assistantClose && assistantForm && assistantInput && assistantMessages) {
        function addAssistantMessage(text, from) {
            const msg = document.createElement('div');
            msg.className = `assistant-msg assistant-msg--${from}`;
            msg.textContent = text;
            assistantMessages.appendChild(msg);
            assistantMessages.scrollTop = assistantMessages.scrollHeight;
        }

        function openAssistant() {
            assistantPanel.classList.add('active');
            assistantPanel.setAttribute('aria-hidden', 'false');
            assistantLauncher.classList.add('active');
            assistantInput.focus();
        }

        function closeAssistant() {
            assistantPanel.classList.remove('active');
            assistantPanel.setAttribute('aria-hidden', 'true');
            assistantLauncher.classList.remove('active');
        }

        assistantLauncher.addEventListener('click', () => {
            if (assistantPanel.classList.contains('active')) {
                closeAssistant();
            } else {
                openAssistant();
            }
        });

        assistantClose.addEventListener('click', closeAssistant);

        assistantForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = assistantInput.value.trim();
            if (!text) return;

            addAssistantMessage(text, 'user');
            assistantInput.value = '';

            const waMessage = `Hola Germán, te escribo desde el sitio web:\n\n${text}`;
            window.open(`https://wa.me/${ASSISTANT_WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`, '_blank', 'noopener');

            setTimeout(() => {
                addAssistantMessage('¡Gracias! Tu mensaje se abrió en WhatsApp, solo dale enviar. En breve nos comunicamos contigo. 😊', 'bot');
            }, 500);
        });
    }
});
