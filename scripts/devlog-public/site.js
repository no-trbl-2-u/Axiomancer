// site.js — the public DevLog's ENHANCEMENT layer.
//
// Nothing in this file may carry meaning. Every page reads, prints and indexes
// with scripting off (devlog/DESIGN.md §7, design prompt §3.4): the
// before/after pair is plain markup, the marginalia are <details>, and the
// default theme is correct from CSS alone. What lives here is the part that
// makes the page pleasant once script is available:
//
//   1. the theme switcher      — five palettes, no reload
//   2. the hero parallax       — one passive scroll listener, two transforms
//   3. the category filter     — client-side, over rows already in the DOM
//   4. tap-to-swap             — the small-difference alternate
//   5. the wipe                — the whole-screen-retheme alternate
//
// Controls that cannot work without script ship `hidden` in the markup and are
// revealed here, so a scriptless reader never meets a dead button.
//
// Zero dependencies, no build step, no framework.
(function () {
  'use strict';

  var THEMES = ['ashen-gold', 'coastal-verdant', 'ember-depths', 'frost-marrow', 'plague-bloom'];
  var STORE_KEY = 'axiomancer-devlog-theme';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ── 1. theme ─────────────────────────────────────────────────────────────
  // The switcher writes `data-theme` on <html>; tokens.css defines one block
  // per theme, so the repaint is a single attribute write. A first visit with
  // no stored choice is left alone: the CSS already answers
  // `prefers-color-scheme` on its own.
  function readStoredTheme() {
    try {
      var v = window.localStorage.getItem(STORE_KEY);
      return THEMES.indexOf(v) >= 0 ? v : null;
    } catch (e) { return null; }
  }

  function applyTheme(id) {
    if (THEMES.indexOf(id) < 0) return;
    document.documentElement.setAttribute('data-theme', id);
    try { window.localStorage.setItem(STORE_KEY, id); } catch (e) { /* private mode */ }
  }

  function wireTheme() {
    var form = document.querySelector('[data-theme-pick]');
    if (!form) return;
    var select = form.querySelector('select');
    var stored = readStoredTheme();
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
      select.value = stored;
    }
    form.hidden = false;
    select.addEventListener('change', function () { applyTheme(select.value); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }

  // ── 2. hero ──────────────────────────────────────────────────────────────
  // The plate behind travels slower than the holed sheet in front, so the
  // world moves inside the holes as you scroll. Reduced motion removes every
  // transform and cross-fades the sheet instead — the title never rides the
  // animation, so the reduced answer loses spectacle, never information.
  function wireHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var plate = hero.querySelector('.hero-plate');
    var sheet = hero.querySelector('.hero-sheet');
    var title = hero.querySelector('.hero-title');
    var cue = hero.querySelector('.hero-cue');
    if (!plate || !sheet) return;

    var paint = function () {
      var height = hero.offsetHeight || 1;
      var p = Math.max(0, Math.min(1, window.scrollY / (height * 0.8)));
      if (reduced.matches) {
        plate.style.transform = 'none';
        sheet.style.transform = 'none';
        sheet.style.opacity = String(1 - p);
      } else {
        plate.style.transform = 'translateY(' + (p * 120).toFixed(1) + 'px) scale(' + (1 + p * 0.06).toFixed(3) + ')';
        sheet.style.transform = 'translateY(' + (-p * 30).toFixed(1) + 'px)';
        sheet.style.opacity = String(1 - p * 0.72);
      }
      plate.style.opacity = String(0.62 + p * 0.3);
      if (title) {
        title.style.opacity = String(Math.max(0, 1 - p * 1.8));
        title.style.transform = reduced.matches ? 'none' : 'translateY(' + (-p * 40).toFixed(1) + 'px)';
      }
      if (cue) cue.style.opacity = String(Math.max(0, 1 - p * 3));
    };

    window.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', paint);
    reduced.addEventListener('change', paint);
    paint();
  }

  // ── 3. the index filter ──────────────────────────────────────────────────
  // Filtering happens over rows already in the DOM — never a refetch, so the
  // index's payload budget is unaffected by how the reader filters it.
  function wireFilters() {
    var bar = document.querySelector('[data-filters]');
    if (!bar) return;
    var rows = Array.prototype.slice.call(document.querySelectorAll('[data-cats]'));
    var empty = document.querySelector('[data-empty]');
    bar.hidden = false;

    bar.addEventListener('click', function (e) {
      var button = e.target.closest('button[data-filter]');
      if (!button) return;
      var want = button.getAttribute('data-filter');
      Array.prototype.forEach.call(bar.querySelectorAll('button[data-filter]'), function (b) {
        b.setAttribute('aria-pressed', String(b === button));
      });
      var shown = 0;
      rows.forEach(function (row) {
        var hit = want === 'all' || row.getAttribute('data-cats').split(' ').indexOf(want) >= 0;
        row.hidden = !hit;
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  }

  // ── 4. tap to swap ───────────────────────────────────────────────────────
  // Same frame, both states, one hit target (never under 44px). Better than
  // the pair for a SMALL difference, because the eye compares in place instead
  // of across a gutter. Keyboard: the control is a <button>, so space and
  // enter already work; `aria-pressed` carries the state and the visible label
  // changes with it.
  function wireSwaps() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ba="swap"]'), function (fig) {
      var sides = fig.querySelectorAll('.ba-side');
      if (sides.length !== 2) return;
      var beforeImg = sides[0].querySelector('img');
      var afterImg = sides[1].querySelector('img');
      if (!beforeImg || !afterImg) return;

      var grid = fig.querySelector('.ba-grid');
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'ba-swap-btn';
      button.setAttribute('aria-pressed', 'true');

      var under = beforeImg.cloneNode(true);
      under.className = 'is-under';
      under.style.opacity = '0';
      var over = afterImg.cloneNode(true);

      var tag = document.createElement('span');
      tag.className = 'ba-swap-tag';
      tag.textContent = 'AFTER';

      button.appendChild(over);
      button.appendChild(under);
      button.appendChild(tag);
      fig.classList.add('ba-swap');
      grid.innerHTML = '';
      grid.appendChild(button);

      var showingAfter = true;
      var set = function (next) {
        showingAfter = next;
        over.style.opacity = next ? '1' : '0';
        under.style.opacity = next ? '0' : '1';
        tag.textContent = next ? 'AFTER' : 'BEFORE';
        tag.style.color = next ? 'var(--sulfur)' : 'var(--bone)';
        tag.style.borderColor = next ? 'var(--sulfur)' : 'var(--ash)';
        button.style.borderColor = next ? 'var(--sulfur)' : 'var(--ash)';
        button.setAttribute('aria-pressed', String(next));
      };
      button.addEventListener('click', function () { set(!showingAfter); });
      set(true);
    });
  }

  // ── 5. the wipe ──────────────────────────────────────────────────────────
  // A dragged rule, pointer events with capture, arrow keys at 5% steps plus
  // Home/End, `role="slider"` with a live `aria-valuenow`. The most satisfying
  // treatment and the least honest — half of each image at all times — so it
  // is reserved for pairs that differ everywhere at once.
  function wireWipes() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ba="wipe"]'), function (fig) {
      var sides = fig.querySelectorAll('.ba-side');
      if (sides.length !== 2) return;
      var beforeImg = sides[0].querySelector('img');
      var afterImg = sides[1].querySelector('img');
      if (!beforeImg || !afterImg) return;

      var grid = fig.querySelector('.ba-grid');
      var box = document.createElement('div');
      box.className = 'ba-wipe-box';
      var base = beforeImg.cloneNode(true);
      var clip = document.createElement('div');
      clip.className = 'ba-wipe-clip';
      var top = afterImg.cloneNode(true);
      clip.appendChild(top);
      var handle = document.createElement('div');
      handle.className = 'ba-wipe-handle';
      handle.setAttribute('role', 'slider');
      handle.setAttribute('tabindex', '0');
      handle.setAttribute('aria-label', 'Reveal the newer capture');
      handle.setAttribute('aria-valuemin', '0');
      handle.setAttribute('aria-valuemax', '100');
      handle.setAttribute('aria-valuenow', '50');
      handle.textContent = '◂▸';

      box.appendChild(base);
      box.appendChild(clip);
      box.appendChild(handle);
      grid.innerHTML = '';
      grid.appendChild(box);

      var set = function (pct) {
        var p = Math.max(0, Math.min(100, pct));
        clip.style.width = p + '%';
        var width = box.getBoundingClientRect().width || box.offsetWidth;
        if (width > 0) top.style.width = width + 'px';
        handle.style.left = p + '%';
        handle.setAttribute('aria-valuenow', String(Math.round(p)));
      };
      var fromEvent = function (e) {
        var rect = box.getBoundingClientRect();
        set(((e.clientX - rect.left) / rect.width) * 100);
      };
      var dragging = false;
      box.addEventListener('pointerdown', function (e) {
        dragging = true;
        box.setPointerCapture(e.pointerId);
        fromEvent(e);
      });
      box.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
      box.addEventListener('pointerup', function () { dragging = false; });
      handle.addEventListener('keydown', function (e) {
        var now = Number(handle.getAttribute('aria-valuenow'));
        if (e.key === 'ArrowLeft') { set(now - 5); e.preventDefault(); }
        if (e.key === 'ArrowRight') { set(now + 5); e.preventDefault(); }
        if (e.key === 'Home') { set(0); e.preventDefault(); }
        if (e.key === 'End') { set(100); e.preventDefault(); }
      });
      if (window.ResizeObserver) {
        new window.ResizeObserver(function () {
          set(Number(handle.getAttribute('aria-valuenow')) || 50);
        }).observe(box);
      }
      set(50);
    });
  }

  function boot() {
    wireTheme();
    wireHero();
    wireFilters();
    wireSwaps();
    wireWipes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
