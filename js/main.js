/* ============================================================
   SEPIA — editorial one-page interactions
   Reverse-engineered feel from rblln.fr (Rébellion):
   pixel-wipe intro · image-trail hero · Lenis smooth scroll ·
   bottom-docked pill nav + reveal handle · crop marks · parallax.
   Vanilla JS + Web Animations API. Lenis loaded from CDN (optional).
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var lenis = null;

  /* ---------------------------------------------------------
     1. CROP MARKS — inject 4 corner registration brackets
     --------------------------------------------------------- */
  var CM = {
    tl: 'M0 7 V0 H7', tr: 'M9 0 H16 V7',
    bl: 'M0 9 V16 H7', br: 'M9 16 H16 V9'
  };
  document.querySelectorAll('.crop').forEach(function (box) {
    Object.keys(CM).forEach(function (c) {
      var s = document.createElement('span');
      s.className = 'cm ' + c;
      s.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + CM[c] + '"/></svg>';
      box.appendChild(s);
    });
  });

  /* ---------------------------------------------------------
     2. INTRO — pixel-grid wipe (20 x 10 = 200 tiles)
     --------------------------------------------------------- */
  function shuffled(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = a.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  function runIntro(done) {
    var grid = document.getElementById('pixels');
    if (!grid || reduce) { document.body.classList.add('intro-done'); done(); return; }
    var N = 200, tiles = [], i;
    for (i = 0; i < N; i++) {
      var t = document.createElement('i');
      t.style.transition = 'opacity .22s linear';
      grid.appendChild(t);
      tiles.push(t);
    }
    document.documentElement.style.overflow = 'hidden';

    var SPREAD = 360; // ms stagger window
    function stagger(toOpacity, after) {
      var order = shuffled(N);
      tiles.forEach(function (tile, idx) {
        tile.style.transitionDelay = (order[idx] / N * SPREAD) + 'ms';
        tile.style.opacity = toOpacity;
      });
      setTimeout(after, SPREAD + 240);
    }

    setTimeout(function () {                 // hold on wordmark, then fill in
      stagger('1', function () {
        var intro = document.querySelector('.intro');
        if (intro) intro.style.opacity = '0';
        stagger('0', function () {           // dissolve out, reveal page
          document.body.classList.add('intro-done');
          document.documentElement.style.overflow = '';
          done();
        });
      });
    }, 760);
  }

  /* ---------------------------------------------------------
     3. LENIS smooth scroll (CDN, optional) + anchor scrolling
     --------------------------------------------------------- */
  function gotoAnchor(hash) {
    var target = hash && hash.length > 1 ? document.querySelector(hash) : null;
    if (hash === '#top') target = document.body;
    if (!target) return false;
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.1 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (hash.length < 2) return;
    if (gotoAnchor(hash)) {
      e.preventDefault();
      // close mobile menu if open
      var dl = document.querySelector('.dock-links');
      if (dl) dl.classList.remove('open');
      var bg = document.querySelector('.dock-burger');
      if (bg) { bg.classList.remove('open'); bg.setAttribute('aria-expanded', 'false'); }
    }
  });

  function initLenis() {
    if (reduce || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    lenis.on('scroll', onScroll);
  }
  function loadLenis() {
    if (reduce) return;
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/lenis@1.1.20/dist/lenis.min.js';
    s.onload = initLenis;
    document.head.appendChild(s);
  }

  /* ---------------------------------------------------------
     4. HERO IMAGE TRAIL (Web Animations API)
        sweep the cursor -> stream of images fling, settle, drift, fade
     --------------------------------------------------------- */
  function initTrail() {
    var trail = document.querySelector('.trail');
    var hero = document.getElementById('top');
    if (!trail || !hero || reduce || !fine) return;
    var imgs = Array.prototype.slice.call(trail.querySelectorAll('img'));
    if (!imgs.length) return;

    var idx = 0, z = 1;
    var last = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
    var m = { x: last.x, y: last.y };

    window.addEventListener('pointermove', function (e) {
      m.x = e.clientX; m.y = e.clientY;
    }, { passive: true });

    function heroInView() {
      var r = hero.getBoundingClientRect();
      return r.bottom > window.innerHeight * 0.35 && r.top < window.innerHeight * 0.55;
    }

    function showNext() {
      var el = imgs[idx];
      idx = (idx + 1) % imgs.length;
      var hr = hero.getBoundingClientRect();
      var w = el.offsetWidth || 150, h = el.offsetHeight || 220;
      var sx = m.x - hr.left - w / 2, sy = m.y - hr.top - h / 2;
      var ex = last.x - hr.left - w / 2, ey = last.y - hr.top - h / 2;
      var drift = hero.offsetHeight * 0.4 + h / 2;
      var rot = (Math.random() * 10 - 5).toFixed(2);

      el.style.zIndex = ++z;
      el.style.opacity = '1';
      el.getAnimations && el.getAnimations().forEach(function (a) { a.cancel(); });
      el.animate([
        { transform: 'translate(' + sx + 'px,' + sy + 'px) rotate(' + rot + 'deg)', opacity: 1, offset: 0 },
        { transform: 'translate(' + ex + 'px,' + ey + 'px) rotate(' + rot + 'deg)', opacity: 1, offset: 0.42, easing: 'cubic-bezier(.16,1,.3,1)' },
        { transform: 'translate(' + ex + 'px,' + (ey + drift) + 'px) rotate(' + rot + 'deg)', opacity: 0, offset: 1, easing: 'cubic-bezier(.83,0,.17,1)' }
      ], { duration: 2200, fill: 'forwards' });
    }

    function tick() {
      if (Math.hypot(m.x - last.x, m.y - last.y) > 55 && heroInView()) {
        showNext();
        last.x = m.x; last.y = m.y;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     5. NAV — bottom-docked pill + reveal handle
     --------------------------------------------------------- */
  var dock = document.querySelector('.dock');
  var handle = document.querySelector('.handle');

  function atPageBottom() {
    return window.innerHeight + window.scrollY >= document.body.scrollHeight - 6;
  }
  function setDock(on) {
    if (!dock) return;
    dock.classList.toggle('on', on);
    if (handle) handle.classList.toggle('on', fine && !on);
  }
  function initNav() {
    if (!dock) return;
    if (!fine) { dock.classList.add('on'); }   // touch: always show pill
    else if (handle) handle.classList.add('on'); // desktop: show handle, pill on demand

    if (fine) {
      window.addEventListener('mousemove', function (e) {
        if (atPageBottom()) { setDock(false); return; }
        setDock(e.clientY > window.innerHeight - 200);
      }, { passive: true });
    }

    // burger (mobile)
    var burger = document.querySelector('.dock-burger');
    var links = document.querySelector('.dock-links');
    if (burger && links) {
      burger.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  /* ---------------------------------------------------------
     6. PARALLAX on .par images
     --------------------------------------------------------- */
  var pars = Array.prototype.slice.call(document.querySelectorAll('.par'));
  function parallax() {
    if (reduce) return;
    var vh = window.innerHeight;
    for (var i = 0; i < pars.length; i++) {
      var im = pars[i], fig = im.parentElement;
      var r = fig.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) continue;
      var prog = (vh - r.top) / (vh + r.height); // 0..1
      im.style.transform = 'translateY(' + (-(prog * 16)).toFixed(2) + '%)';
    }
  }

  /* ---------------------------------------------------------
     scroll dispatcher (used by Lenis + native fallback)
     --------------------------------------------------------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      parallax();
      if (dock) {
        if (atPageBottom()) setDock(false);
        else if (!fine) setDock(true);
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', parallax, { passive: true });

  /* ---------------------------------------------------------
     7. SCROLL REVEAL
     --------------------------------------------------------- */
  function initReveal() {
    var reveals = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     8. TAG STRIP rotation
     --------------------------------------------------------- */
  function initTags() {
    var tags = document.querySelectorAll('.tagrow .tag');
    if (!tags.length || reduce) return;
    var i = 0;
    tags[0].classList.add('is-on');
    setInterval(function () {
      tags[i].classList.remove('is-on');
      i = (i + 1) % tags.length;
      tags[i].classList.add('is-on');
    }, 1600);
  }

  /* ---------------------------------------------------------
     9. FAQ accordions
     --------------------------------------------------------- */
  function initFaq() {
    document.querySelectorAll('.faq-item').forEach(function (item) {
      var q = item.querySelector('.faq-q');
      var a = item.querySelector('.faq-a');
      if (!q || !a) return;
      q.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        var group = item.closest('.faq');
        if (group) {
          group.querySelectorAll('.faq-item.open').forEach(function (o) {
            if (o !== item) {
              o.classList.remove('open');
              o.querySelector('.faq-a').style.maxHeight = null;
              o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
            }
          });
        }
        if (isOpen) {
          item.classList.remove('open');
          a.style.maxHeight = null;
          q.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          a.style.maxHeight = a.scrollHeight + 'px';
          q.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------------------------------------------------------
     10. PRICING participant selector
     --------------------------------------------------------- */
  function detectCurrency() {
    try {
      var lang = navigator.language || '';
      var region = '';
      if (typeof Intl !== 'undefined' && Intl.Locale) region = new Intl.Locale(lang).region || '';
      if (!region && lang.indexOf('-') > -1) region = lang.split('-')[1];
      if (region.toUpperCase() === 'IN') return 'INR';
      var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
      if (tz.indexOf('Kolkata') > -1 || tz.indexOf('Calcutta') > -1) return 'INR';
    } catch (e) {}
    return 'USD';
  }
  function initPricer() {
    var pricer = document.querySelector('[data-pricer]');
    if (!pricer) return;
    var CURRENCIES = {
      USD: { base: [0, 1.99, 4.99, 14.99, 29.99, 49.99, 69.99, 99.99], addon: 9.99, fmt: function (n) { return '$' + n.toFixed(2); } },
      INR: { base: [0, 179, 449, 1300, 2900, 4900, 6900, 8900], addon: 899, fmt: function (n) { return '₹' + n.toLocaleString('en-IN'); } }
    };
    var money = CURRENCIES[detectCurrency()] || CURRENCIES.USD;
    var priceAt = function (i, withAddon) {
      var n = money.base[i] + (withAddon ? money.addon : 0);
      return n === 0 ? 'Free' : money.fmt(n);
    };
    var faqMin = document.querySelector('[data-price-min]');
    var faqMax = document.querySelector('[data-price-max]');
    if (faqMin) faqMin.textContent = priceAt(1, false);
    if (faqMax) faqMax.textContent = priceAt(money.base.length - 1, false);
    var TIERS = [
      { head: 'Up to 5 Participants', max: 'Maximum of <b>5</b> guests can join your event', free: true },
      { head: 'Up to 10 Participants', max: 'Up to <b>10</b> guests can join your event' },
      { head: 'Up to 25 Participants', max: 'Up to <b>25</b> guests can join your event' },
      { head: 'Up to 50 Participants', max: 'Up to <b>50</b> guests can join your event' },
      { head: 'Up to 100 Participants', max: 'Up to <b>100</b> guests can join your event' },
      { head: 'Up to 150 Participants', max: 'Up to <b>150</b> guests can join your event' },
      { head: 'Up to 200 Participants', max: 'Up to <b>200</b> guests can join your event' },
      { head: 'Unlimited Participants', max: '<b>Unlimited</b> guests can join your event' }
    ];
    var range = pricer.querySelector('.pricer-range');
    var elHead = pricer.querySelector('[data-pricer-head]');
    var elPrice = pricer.querySelector('[data-pricer-price]');
    var elMax = pricer.querySelector('[data-pricer-max]');
    var elBadge = pricer.querySelector('[data-pricer-badge]');
    var stops = pricer.querySelectorAll('.pricer-stop');
    var addonCheck = pricer.querySelector('[data-addon-check]');
    var addonPrice = pricer.querySelector('[data-addon-price]');
    var last = TIERS.length - 1;
    if (addonPrice) addonPrice.textContent = '+' + money.fmt(money.addon);

    var render = function (i) {
      i = Math.max(0, Math.min(last, i | 0));
      var t = TIERS[i];
      var withAddon = !!(addonCheck && addonCheck.checked);
      elHead.textContent = t.head;
      elPrice.textContent = priceAt(i, withAddon);
      elMax.innerHTML = t.max;
      pricer.classList.toggle('is-free', !!t.free && !withAddon);
      if (elBadge) elBadge.textContent = (t.free && !withAddon) ? 'Included' : 'One-time purchase';
      if (range) range.style.setProperty('--pct', (i / last * 100) + '%');
      stops.forEach(function (s, si) {
        s.classList.toggle('on', si === i);
        s.setAttribute('aria-current', si === i ? 'true' : 'false');
      });
    };
    if (range) range.addEventListener('input', function () { render(+range.value); });
    stops.forEach(function (s, si) {
      s.addEventListener('click', function () { if (range) range.value = si; render(si); });
    });
    if (addonCheck) addonCheck.addEventListener('change', function () { render(range ? +range.value : 0); });
    render(range ? +range.value : 0);
  }

  /* ---------------------------------------------------------
     boot
     --------------------------------------------------------- */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();

  initReveal();
  initFaq();
  initPricer();
  initTags();
  parallax();

  runIntro(function () {
    initNav();
    initTrail();
    loadLenis();
  });
})();
