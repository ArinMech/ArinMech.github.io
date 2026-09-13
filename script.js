/* Arin Chaudhary — portfolio behaviour
   Nav toggle · footer year · scroll reveal · nav scrollspy */

(function () {
  'use strict';

  /* ---- Footer year ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Mobile nav ---- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('.reveal');

  if (!revealEls.length) {
    /* nothing to do */
  } else if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 80) + 'ms';
      revealObserver.observe(el);
    });
  }

  /* ---- Nav scrollspy (homepage only) ---- */
  var spyLinks = navLinks
    ? Array.prototype.filter.call(
        navLinks.querySelectorAll('a[href^="#"]'),
        function (a) { return a.getAttribute('href').length > 1; }
      )
    : [];

  if (spyLinks.length && 'IntersectionObserver' in window) {
    var sectionMap = {};
    var sections = [];

    spyLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      sectionMap[id] = link;
      sections.push(section);
    });

    if (sections.length) {
      var setActive = function (id) {
        spyLinks.forEach(function (l) { l.classList.remove('active'); });
        if (sectionMap[id]) sectionMap[id].classList.add('active');
      };

      var spyObserver = new IntersectionObserver(function (entries) {
        var visible = entries
          .filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
        if (visible.length) setActive(visible[0].target.id);
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

      sections.forEach(function (s) { spyObserver.observe(s); });
    }
  }
})();
