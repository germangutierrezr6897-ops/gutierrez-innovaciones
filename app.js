/* ==========================================================================
   GUTIÉRREZ INNOVACIONES CL - INTERACTIVE WEB LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. INTRO SCREEN
    const introScreen = document.getElementById('intro-screen');
    const introBtn    = document.getElementById('intro-enter-btn');
    document.body.classList.add('intro-open');

    function closeIntro() {
        if (!introScreen || introScreen.classList.contains('intro-closing')) return;
        introScreen.classList.add('intro-closing');
        setTimeout(() => {
            introScreen.remove();
            document.body.classList.remove('intro-open');
        }, 500);
    }

    if (introBtn) {
        introBtn.addEventListener('click', closeIntro);
    }

    // Splash is a brief brand moment, not a gate — dismiss itself automatically
    if (introScreen) {
        setTimeout(closeIntro, 2200);
    }

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

    // 2.1 PORTFOLIO CARDS: 3D tilt on hover + scroll-linked parallax drift,
    // unified into one transform per card so they don't fight each other
    // (both would otherwise write to the same `transform` property).
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const portfolioCardStates = Array.from(document.querySelectorAll('.portfolio-grid .portfolio-card')).map((el, i) => ({
        el,
        factor: (i % 2 === 0) ? -0.04 : 0.06,
        rotateX: 0,
        rotateY: 0,
        liftY: 0,
        parallaxY: 0,
    }));

    function applyCardTransform(state) {
        state.el.style.transform = `perspective(900px) rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg) translateY(${(state.liftY + state.parallaxY).toFixed(1)}px)`;
    }

    if (!prefersReducedMotion) {
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
            portfolioCardStates.forEach(state => {
                const rect = state.el.getBoundingClientRect();
                const centerDelta = (rect.top + rect.height / 2) - vh / 2;
                state.parallaxY = centerDelta * state.factor;
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
                }, 300);
            }
        });
    });

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
});
