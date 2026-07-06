#!/usr/bin/env node
// Build the DevLog catalog pages from devlog/data/*.json:
//   - devlog/cards.html     name · image · card text
//   - devlog/enemies.html   image · name · stats · attacks (skills + how it fights)
//   - devlog/effects.html   name · glyph · what it does
//
// The JSON is produced by `npm run catalog:export` (ts-node, reads the mechanics
// libraries + mobile art registries). This renderer is zero-dependency and only
// reads the committed JSON + copied art, so it can run on any host.
//
// Usage: node scripts/build-catalog.mjs   (or: npm run catalog:build)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { escapeHtml, inline, page } from "./devlog-shell.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEVLOG = join(ROOT, "devlog");
const DATA = join(DEVLOG, "data");

const BACK = { href: "./index.html", label: "← Axiomancer" };

function load(name) {
  const path = join(DATA, `${name}.json`);
  if (!existsSync(path)) {
    console.warn(`catalog: missing ${name}.json — run "npm run catalog:export" first.`);
    return [];
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

// A live client-side filter box shared by the cards/enemies pages. Filters
// direct children of `#grid` by their data-search attribute.
const FILTER_JS = `
<script>
(function () {
  var box = document.getElementById('filter');
  var grid = document.getElementById('grid');
  var note = document.getElementById('count');
  if (!box || !grid) return;
  var items = Array.prototype.slice.call(grid.children);
  var total = items.length;
  box.addEventListener('input', function () {
    var q = box.value.trim().toLowerCase();
    var shown = 0;
    items.forEach(function (el) {
      var hit = !q || (el.getAttribute('data-search') || '').indexOf(q) !== -1;
      el.style.display = hit ? '' : 'none';
      if (hit) shown++;
    });
    if (note) note.textContent = q ? shown + ' of ' + total + ' shown' : total + ' total';
  });
})();
</script>`;

function searchbar(placeholder, total, noun) {
  return (
    `<div class="searchbar"><input id="filter" type="search" autocomplete="off" ` +
    `placeholder="${escapeHtml(placeholder)}"></div>` +
    `<p class="count-note" id="count">${total} ${noun}</p>`
  );
}

function artOrPlaceholder(image, cls, glyph, alt) {
  if (image) {
    return `<div class="${cls}"><img loading="lazy" src="${escapeHtml(image)}" alt="${escapeHtml(alt)}"></div>`;
  }
  return `<div class="${cls} none" role="img" aria-label="${escapeHtml(alt)} (no art)">${glyph}</div>`;
}

// ---------------------------------------------------------------------------
// Cards — name · image · card text
// ---------------------------------------------------------------------------
function buildCards() {
  const cards = load("cards");
  const grid = cards
    .map((c) => {
      const search = escapeHtml((c.name + " " + (c.text || "")).toLowerCase());
      const art = artOrPlaceholder(c.image, "art", "🂠", c.name);
      return (
        `  <article class="gcard" data-search="${search}">${art}` +
        `<div class="body"><div class="name">${inline(c.name)}</div>` +
        `<div class="text">${inline(c.text || "")}</div></div></article>`
      );
    })
    .join("\n");

  const body =
    `<h1>Cards</h1>\n` +
    searchbar("Filter cards by name or text…", cards.length, "cards") +
    `\n<div class="grid-cards" id="grid">\n${grid}\n</div>\n${FILTER_JS}`;

  writeFileSync(
    join(DEVLOG, "cards.html"),
    page({ title: "Axiomancer — Cards", home: BACK, crumb: "Cards", body, footerNote: FOOTER })
  );
  return cards.length;
}

// ---------------------------------------------------------------------------
// Enemies — image · name · stats · attacks (skills + how it fights)
// ---------------------------------------------------------------------------
function buildEnemies() {
  const enemies = load("enemies");
  const grid = enemies
    .map((e) => {
      const search = escapeHtml((e.name + " " + (e.difficulty || "") + " " + (e.logic || "")).toLowerCase());
      const portrait = artOrPlaceholder(e.image, "portrait", "☠", e.name);

      const stats =
        `<div class="statrow">` +
        `<span class="stat hp"><span class="k">HP</span>${e.maxHealth}</span>` +
        `<span class="stat body"><span class="k">Body</span>${e.stats.body}</span>` +
        `<span class="stat mind"><span class="k">Mind</span>${e.stats.mind}</span>` +
        `<span class="stat heart"><span class="k">Heart</span>${e.stats.heart}</span>` +
        `</div>`;

      const skills = (e.skills || []).length
        ? e.skills
            .map(
              (s) =>
                `<div class="skill"><div class="sk-name">${inline(s.name)}</div>` +
                `<div class="sk-text">${inline(s.text || "")}</div></div>`
            )
            .join("")
        : `<p class="no-skills">No signature skills — fights with basic stance moves.</p>`;

      const hint = e.stanceHint ? `<p class="hint">“${inline(e.stanceHint)}”</p>` : "";

      return (
        `  <article class="ecard" data-search="${search}">${portrait}` +
        `<div class="body">` +
        `<h2 class="name">${inline(e.name)}</h2>` +
        `<p class="sub">Level ${e.level} · ${escapeHtml(e.difficulty || "")}</p>` +
        stats +
        `<div class="sec-label">Attacks</div>` +
        `<p class="fights">${inline(e.logicBlurb || e.logic || "")}</p>` +
        hint +
        skills +
        `</div></article>`
      );
    })
    .join("\n");

  const body =
    `<h1>Enemies</h1>\n` +
    searchbar("Filter enemies by name, difficulty, behaviour…", enemies.length, "foes") +
    `\n<div class="grid-enemies" id="grid">\n${grid}\n</div>\n${FILTER_JS}`;

  writeFileSync(
    join(DEVLOG, "enemies.html"),
    page({ title: "Axiomancer — Enemies", home: BACK, crumb: "Enemies", body, footerNote: FOOTER })
  );
  return enemies.length;
}

// ---------------------------------------------------------------------------
// Effects — name · glyph · what it does (grouped buffs / debuffs)
// ---------------------------------------------------------------------------
function buildEffects() {
  const effects = load("effects");
  const row = (e) =>
    `  <div class="eff"><div class="glyph" style="--gc:${escapeHtml(e.color)}" role="img" ` +
    `aria-label="${escapeHtml(e.name)} glyph">${escapeHtml(e.glyph)}</div>` +
    `<div><div class="name">${inline(e.name)}</div>` +
    `<div class="text">${inline(e.text || "")}</div></div></div>`;

  const section = (label, list) =>
    list.length
      ? `<div class="sec-label">${label} · ${list.length}</div>\n<div class="eff-list">\n${list
          .map(row)
          .join("\n")}\n</div>`
      : "";

  const buffs = effects.filter((e) => e.type === "buff");
  const debuffs = effects.filter((e) => e.type === "debuff");

  const body =
    `<h1>Effects</h1>\n` +
    `<p class="count-note">${effects.length} status effects — the glyph is how each one reads on the combat board.</p>\n` +
    section("Buffs", buffs) +
    "\n" +
    section("Debuffs", debuffs);

  writeFileSync(
    join(DEVLOG, "effects.html"),
    page({ title: "Axiomancer — Effects", home: BACK, crumb: "Effects", body, footerNote: FOOTER })
  );
  return effects.length;
}

const FOOTER = "generated by <code>scripts/build-catalog.mjs</code>";

const nc = buildCards();
const ne = buildEnemies();
const nf = buildEffects();
console.log(`catalog: built cards (${nc}), enemies (${ne}), effects (${nf})`);
