/* ============================================================
   OLMAK LUXURY CARS — Main Script (frontend only, no backend)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- 1. Preloader ---------- */
  const preloader = $('#preloader');
  const hidePreloader = () => {
    if (preloader) preloader.classList.add('hidden');
    document.body.classList.add('loaded'); // triggers the hero entrance sequence
  };
  window.addEventListener('load', () => setTimeout(hidePreloader, 500));
  setTimeout(hidePreloader, 3500); // safety fallback

  /* ---------- 1b. Theme toggle (light / dark) ---------- */
  const THEME_KEY = 'olmak-theme';
  const themeToggle = $('#themeToggle');
  const themeMeta = $('meta[name="theme-color"]');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

  const applyTheme = (theme, persist) => {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#0D0E12' : '#F1F2F4');
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* private mode etc. */ }
    }
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(isDark ? 'light' : 'dark', true);
    });
    /* Keep the toggle's state in sync with the theme applied by the pre-paint script */
    themeToggle.setAttribute('aria-pressed', String(document.documentElement.getAttribute('data-theme') === 'dark'));
  }

  /* When the user has no saved choice, follow the OS light/dark preference */
  try {
    if (!localStorage.getItem(THEME_KEY)) {
      systemTheme.addEventListener('change', (e) => applyTheme(e.matches ? 'dark' : 'light', false));
    }
  } catch (e) { /* ignore */ }

  /* ---------- 2. Sticky Navigation + Back-to-Top state ---------- */
  const navbar = $('#navbar');
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  const backToTop = $('#backToTop');

  const progressBar = $('#scrollProgress');
  let lastScrollY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    backToTop.classList.toggle('show', y > 600);

    /* Hide the navbar while scrolling down, reveal it on scroll up */
    const scrollingDown = y > lastScrollY && y > 240;
    const holdingNav = navbar.classList.contains('nav-hold');
    navbar.classList.toggle('nav-hide', scrollingDown && !holdingNav && !mobileMenu.classList.contains('open'));
    lastScrollY = y;

    /* Reading progress bar */
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggleMenu = (force) => {
    const open = force !== undefined ? force : !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', open);
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  hamburger.addEventListener('click', () => toggleMenu());
  $$('a', mobileMenu).forEach((a) => a.addEventListener('click', () => toggleMenu(false)));

  /* Keep the navbar visible during anchor-link smooth scrolling */
  const holdNav = (ms) => {
    navbar.classList.add('nav-hold');
    clearTimeout(holdNav._t);
    holdNav._t = setTimeout(() => navbar.classList.remove('nav-hold'), ms);
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', () => holdNav(1600)));

  /* ---------- 3. Scrollspy ---------- */
  const navLinks = $$('.nav-link');
  const spySections = navLinks
    .map((l) => $(l.getAttribute('href')))
    .filter(Boolean);

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id);
        });
      });
    },
    { rootMargin: '-38% 0px -55% 0px' }
  );
  spySections.forEach((s) => spy.observe(s));

  /* ---------- 4. Scroll Reveal ---------- */
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  const observeReveals = (root = document) => {
    $$('.reveal', root).forEach((el, i) => {
      if (el.dataset.revealSet) return;
      el.dataset.revealSet = '1';
      el.style.setProperty('--reveal-delay', (i % 8) * 70 + 'ms');
      revealObserver.observe(el);
    });
  };
  observeReveals();

  /* ---------- 5. Animated Counters ---------- */
  const counters = $$('.counter');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        /* Pop only once the number has finished counting */
        const card = el.closest('.counter-card');
        if (card) card.classList.add('counted');
      }
    };
    requestAnimationFrame(tick);
  };
  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((c) => counterObserver.observe(c));

  /* ---------- 6. Back to Top ---------- */
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- 7. Escape closes the mobile menu ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) toggleMenu(false);
  });

  /* ---------- 8. FAQ Accordion ---------- */
  $$('.faq-item').forEach((item) => {
    const btn = $('.faq-q', item);
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      $$('.faq-item.open').forEach((o) => {
        o.classList.remove('open');
        $('.faq-q', o).setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- 9. Contact Form (frontend validation only) ---------- */
  const form = $('#contactForm');
  if (form) {
    const fields = {
      fName: { validate: (v) => v.trim().length >= 2 || 'Please enter your full name (min 2 characters).' },
      fEmail: { validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.' },
      fPhone: { validate: (v) => v.trim().replace(/\D/g, '').length >= 8 || 'Please enter a valid phone number.' },
      fMessage: { validate: (v) => v.trim().length >= 10 || 'Please enter a message (min 10 characters).' }
    };

    const setError = (id, msg) => {
      const input = $('#' + id);
      const err = $('[data-error-for="' + id + '"]');
      input.classList.toggle('invalid', !!msg);
      if (err) {
        err.textContent = msg || '';
        err.classList.toggle('show', !!msg);
      }
    };

    const validateField = (id) => {
      const input = $('#' + id);
      const msg = fields[id].validate(input.value);
      setError(id, msg);
      return !msg;
    };

    Object.keys(fields).forEach((id) => {
      const input = $('#' + id);
      input.addEventListener('blur', () => validateField(id));
      input.addEventListener('input', () => {
        if (input.classList.contains('invalid')) validateField(id);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const results = Object.keys(fields).map(validateField);
      if (results.every(Boolean)) {
        /* Simulated sending state — strictly frontend, no backend */
        const submitBtn = $('#submitBtn');
        const success = $('#formSuccess');
        const original = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('loading');
          submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending…';
        }
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = original;
          }
          success.classList.add('show');
          form.reset();
          success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setTimeout(() => success.classList.remove('show'), 8000);
        }, 1400);
      } else {
        const firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) firstInvalid.focus();
      }
    });
  }

  /* ---------- 10. Footer Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 11. Interactive animations (pointer devices, reduced-motion aware) ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    /* 11a. 3D tilt on cards */
    $$('.tilt').forEach((el) => {
      let tiltRaf = null;
      el.addEventListener('mousemove', (e) => {
        if (tiltRaf) return;
        tiltRaf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          const strength = parseFloat(el.dataset.tilt || '4');
          el.style.transform =
            'perspective(900px) rotateX(' + (-py * strength).toFixed(2) + 'deg) rotateY(' + (px * strength).toFixed(2) + 'deg)';
          tiltRaf = null;
        });
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
      });
    });

    /* 11b. Magnetic buttons */
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * 0.16;
        const dy = (e.clientY - r.top - r.height / 2) * 0.28 - 2;
        btn.style.transform = 'translate3d(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px, 0)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });

    /* 11c. Hero background parallax */
    const hero = $('#home');
    const heroBgWrap = $('.hero-bg-wrap', hero);
    if (hero && heroBgWrap) {
      const onHeroScroll = () => {
        const y = window.scrollY;
        if (y < hero.offsetHeight) {
          heroBgWrap.style.transform = 'translate3d(0, ' + (y * 0.35).toFixed(1) + 'px, 0)';
        }
      };
      window.addEventListener('scroll', onHeroScroll, { passive: true });
    }
  }
})();
