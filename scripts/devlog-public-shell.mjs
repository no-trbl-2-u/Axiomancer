#!/usr/bin/env node
// scripts/devlog-public-shell.mjs — the public DevLog's chrome.
//
// This module is `devlog/DESIGN.md` turned into code: the woodcut identity
// (§1-§6), the signature before/after component (§7), the page scaffold (§8)
// and the rules that hold the payload budget (§9). `build-devlog-public.mjs`
// composes pages out of the functions here; nothing else styles anything.
//
// THREE RULES THIS FILE ENFORCES, BECAUSE THEY ARE EASY TO LOSE
// -------------------------------------------------------------
// 1. TOKENS, NEVER HEX. Every colour is `var(--token)`, named exactly as the
//    app names it. The token values arrive from `scripts/devlog-tokens.mjs`,
//    which reads the app's `palette.ts`. There is not one hex literal below.
// 2. JAVASCRIPT ENHANCES, IT NEVER GATEKEEPS. Every page reads, prints and
//    indexes with scripting off: the before/after pair is plain markup, the
//    marginalia are <details>, the theme is correct from CSS alone. Controls
//    that only work with script (the category filter, the swap, the wipe) ship
//    `hidden` and are revealed by site.js — a dead control is worse than none.
// 3. NO EMOJI, NO NEW MARKS. The register is woodcut and chronicle. Where a
//    mark is needed the site uses type: the dagger for an eyebrow, a lozenge
//    for the free-effect pip, the arrows on the wipe handle (DESIGN.md §5).
//
// Zero dependencies; pure string functions.

import { escapeHtml } from "./devlog-shell.mjs";

// ---------------------------------------------------------------------------
// The marks the site uses in place of drawn icons (DESIGN.md §5)
// ---------------------------------------------------------------------------
export const MARKS = {
  dagger: "✠",   // the standing eyebrow prefix
  lozenge: "◇",  // the free-effect pip on a card plate
  wipe: "◂▸", // the wipe handle
  dot: "·",      // the separator in a roman date
};

// ---------------------------------------------------------------------------
// Dates — lowercase roman numerals, with the machine date in the markup
// ---------------------------------------------------------------------------
const ROMAN = [
  [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"],
  [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
];

/** 29 -> "xxix". Lowercase, because the page is a chronicle, not a monument. */
export function roman(n) {
  let out = "";
  let left = Math.max(0, Math.floor(Number(n) || 0));
  for (const [value, numeral] of ROMAN) {
    while (left >= value) { out += numeral; left -= value; }
  }
  return out;
}

/** "2026-08-29" -> "xxix · viii · mmxxvi" — the in-world numeral convention. */
export function romanDate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return [roman(d), roman(m), roman(y)].join(` ${MARKS.dot} `);
}

/**
 * The date as a reader sees it AND as a machine reads it.
 * DESIGN.md §10 residue item 4: the machine-readable date rides alongside the
 * numerals, for the feed and for search.
 */
export function dateStamp(iso, className = "stamp") {
  return `<time class="${className}" datetime="${escapeHtml(iso)}">${romanDate(iso)}</time>`;
}

/** "29 AUG" — the short form the before/after caption chips carry. */
export function shortDate(iso) {
  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const [, m, d] = String(iso).split("-").map(Number);
  return `${d} ${MONTHS[(m || 1) - 1]}`;
}

// ---------------------------------------------------------------------------
// The alt-text rule (DESIGN.md §7) — implemented once, used by every capture
// ---------------------------------------------------------------------------
/**
 * Per image, never per pair:
 *
 *   The <screen> screen <before|after> the change: <one visible difference>.
 *
 * The difference clause is the work item's own `**What:**` line trimmed to its
 * first clause. It is never generated freshly (no model call runs in the
 * nightly) and never identical between the two images of a pair.
 *
 * Returns "" when there is no usable what-line — the caller must then publish
 * the sentence saying no capture exists rather than an unlabelled image.
 *
 * @param {string} subject  the screen/card/plate name, in plain words
 * @param {'before'|'after'} role
 * @param {string} what     the work item's `**What:**` line
 * @param {string} [noun]   "screen" by default; "card" / "plate" as fitting
 */
export function altText(subject, role, what, noun = "screen") {
  const clause = firstClause(what);
  if (!clause) return "";
  const name = String(subject || "").replace(/[-_]+/g, " ").trim();
  return `The ${name} ${noun} ${role} the change: ${sentenceCase(clause)}.`;
}

/**
 * The clause sits mid-sentence, so its leading capital is dropped — unless the
 * first word is an all-caps keyword (GUARD, BLEED), which keeps its shape.
 */
function sentenceCase(clause) {
  const first = clause.split(/\s+/)[0] || "";
  if (first === first.toUpperCase()) return clause;
  return clause.charAt(0).toLowerCase() + clause.slice(1);
}

/** The first clause of a sentence — up to the first comma, colon, em-dash or full stop. */
export function firstClause(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  const cut = s.split(/(?:[,;:.]|\s+—\s+)\s*/)[0].trim();
  return cut.replace(/\s+/g, " ").replace(/[.]$/, "");
}

// ---------------------------------------------------------------------------
// THE SIGNATURE COMPONENT (DESIGN.md §7)
// ---------------------------------------------------------------------------
/**
 * The labelled pair — the primary treatment, and the base state of all three.
 *
 * Why the pair and not the slider: it answers "which one is new?" before any
 * interaction, it works with no script, it prints, and a drag rail on a phone
 * puts a thumb over the interesting part of the image at exactly the moment of
 * comparison. The newer plate is framed in `--sulfur`; that frame plus the two
 * caption chips ARE the labelling system.
 *
 * @param {object} p
 * @param {{src:string,alt:string,width?:number,height?:number,date?:string}} p.before
 *        omit for a change that had no capturable before
 * @param {{src:string,alt:string,width?:number,height?:number,date?:string}} p.after
 * @param {string} p.caption      the figcaption, already escaped-safe text
 * @param {'phone'|'card'|'wide'} [p.shape]  drives the grid (DESIGN.md §7)
 * @param {'pair'|'swap'|'wipe'} [p.mode]    the interaction; pair is primary
 */
export function beforeAfter({ before, after, caption, shape = "phone", mode = "pair" }) {
  const cap = caption ? `<figcaption class="ba-cap">${escapeHtml(caption)}</figcaption>` : "";

  // No before: an honest single plate. Never show the after twice.
  if (!before) {
    return `<figure class="ba ba-${shape} ba-solo">
  <div class="ba-grid">${plate(after, "after", "NEW")}</div>
  ${cap}
</figure>`;
  }

  if (mode === "swap" || mode === "wipe") {
    // Both enhancements render as the labelled pair until site.js upgrades
    // them in place, so the meaning never sits behind a script.
    return `<figure class="ba ba-${shape}" data-ba="${mode}">
  <div class="ba-grid">${plate(before, "before")}${plate(after, "after")}</div>
  ${cap}
</figure>`;
  }

  return `<figure class="ba ba-${shape}">
  <div class="ba-grid">${plate(before, "before")}${plate(after, "after")}</div>
  ${cap}
</figure>`;
}

/**
 * One framed plate with its caption chip.
 *
 * The box is reserved at the capture's own ratio and filled with a 45 degree
 * hatch, so the page does not move when the image arrives (DESIGN.md §7,
 * "Loading"). Every image is lazy below the fold and carries its own alt text.
 */
function plate(img, role, labelOverride) {
  const label = labelOverride || role.toUpperCase();
  const stamp = img.date ? ` ${MARKS.dot} ${escapeHtml(shortDate(img.date))}` : "";
  const ratio = img.width && img.height ? ` style="aspect-ratio:${img.width}/${img.height}"` : "";
  const dims = img.width && img.height ? ` width="${img.width}" height="${img.height}"` : "";
  return `<div class="ba-side ba-${role}">
      <p class="ba-chip"><span class="ba-pip"></span>${escapeHtml(label)}${stamp}</p>
      <div class="ba-box"${ratio}><img loading="lazy" decoding="async" src="${escapeHtml(img.src)}"${dims} alt="${escapeHtml(img.alt)}"></div>
    </div>`;
}

/**
 * A rules-text pair — the honest answer for a change with no picture
 * (DESIGN.md §7, publish prompt §3.4: an affliction's before/after is its
 * rules text, and a rendered text pair beats an invented image).
 */
export function beforeAfterText({ before, after, caption, label = "" }) {
  const side = (text, role) => `<div class="ba-side ba-${role}">
      <p class="ba-chip"><span class="ba-pip"></span>${role.toUpperCase()}</p>
      <p class="ba-rule">${escapeHtml(text)}</p>
    </div>`;
  return `<figure class="ba ba-text">
  ${label ? `<p class="ba-label">${escapeHtml(label)}</p>` : ""}
  <div class="ba-grid">${before ? side(before, "before") : ""}${side(after, "after")}</div>
  ${caption ? `<figcaption class="ba-cap">${escapeHtml(caption)}</figcaption>` : ""}
</figure>`;
}

/**
 * The sentence a work item publishes INSTEAD of a picture.
 * "Missing evidence is stated, never faked" — publish prompt §3, DESIGN.md §7.
 */
export function noCapture(sentence) {
  return `<aside class="nocap">
  <p class="nocap-label">No picture of this one</p>
  <p>${escapeHtml(sentence)}</p>
</aside>`;
}

// ---------------------------------------------------------------------------
// Page furniture
// ---------------------------------------------------------------------------
/** The standing header convention: a dagger eyebrow over a hairline rule. */
export function eyebrow(label) {
  return `<p class="eyebrow">${MARKS.dagger} ${escapeHtml(label)}</p><hr class="rule">`;
}

/** A collapsed marginalia panel. <details> so it opens with no script. */
export function panel(title, bodyHtml) {
  return `<details class="marg">
  <summary><span>${escapeHtml(title)}</span><span class="chev" aria-hidden="true"></span></summary>
  <div class="marg-body">${bodyHtml}</div>
</details>`;
}

/** A category chip, optionally with a count ("UI x2"). */
export function chip(category, count = 0, { current = false } = {}) {
  const label = count > 1 ? `${category.toUpperCase()} ×${count}` : category.toUpperCase();
  return `<span class="chip chip-${escapeHtml(category)}${current ? " is-on" : ""}">${escapeHtml(label)}</span>`;
}

// ---------------------------------------------------------------------------
// The stylesheet (DESIGN.md §1-§9, in one place)
// ---------------------------------------------------------------------------
export const SITE_CSS = `
/* The type scale is fluid: the app's fixed sizes are the floor, not the
   ceiling, because a browser is not a 375pt phone (DESIGN.md §2). */
:root {
  --f-display: 'Pirata One', 'Palatino Linotype', Palatino, serif;
  --f-body: 'IM Fell English', Georgia, 'Times New Roman', serif;
  --f-label: 'Bebas Neue', 'Haettenschweiler', 'Arial Narrow', sans-serif;
  --f-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  /* The app's SPACING scale, plus two page-level bands (DESIGN.md §3). */
  --s1: 4px; --s2: 8px; --s3: 16px; --s4: 24px; --s5: 32px; --s6: 54px; --s7: 90px;
  --col-narrow: 700px; --col-read: 760px; --col-wide: 880px; --col-full: 1080px;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--parchment);
  font-family: var(--f-body); font-size: 17px; line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--sulfur); text-decoration: none; }
a:hover, a:focus-visible { color: var(--parchment); }
:focus-visible { outline: 2px solid var(--sulfur); outline-offset: 2px; }
img { max-width: 100%; }
hr.rule { border: 0; border-top: 1px solid var(--divider); margin: var(--s2) 0 var(--s4); }

/* ── bands and measure ─────────────────────────────────────────────────── */
.band { margin: 0 auto; padding: var(--s6) var(--s3) var(--s5); }
.band-read { max-width: var(--col-read); }
.band-wide { max-width: var(--col-wide); }
.band-full { max-width: var(--col-full); }
.band-narrow { max-width: var(--col-narrow); }
p, li { text-wrap: pretty; }
.band p, .band li { max-width: 62ch; }
.lede { font-size: clamp(18px, 2.3vw, 21px); line-height: 1.55; border-left: 2px solid var(--sulfur); padding-left: var(--s3); }
.dim { color: var(--parchmentDim); }
.mono { font-family: var(--f-mono); font-size: 12px; color: var(--bone); }

h1, h2, h3 { font-family: var(--f-display); font-weight: 400; letter-spacing: .01em; }
h1 { font-size: clamp(32px, 6vw, 52px); line-height: 1.05; margin: 0 0 var(--s3); text-wrap: balance; }
h2 { font-size: clamp(25px, 4vw, 34px); line-height: 1.12; margin: 0 0 var(--s3); }
h3 { font-size: clamp(22px, 3.4vw, 30px); line-height: 1.12; margin: 0 0 var(--s2); }
.eyebrow {
  font-family: var(--f-label); font-size: 11px; letter-spacing: .28em;
  color: var(--sulfur); margin: 0; text-transform: uppercase;
}
.stamp, time { font-family: var(--f-mono); font-size: 12px; color: var(--bone); }

/* ── header ────────────────────────────────────────────────────────────── */
.top {
  position: sticky; top: 0; z-index: 40; background: var(--overlay);
  backdrop-filter: blur(6px); border-bottom: 1px solid var(--divider);
}
.top-in {
  max-width: var(--col-full); margin: 0 auto; padding: 10px var(--s3);
  display: flex; align-items: center; gap: var(--s3); flex-wrap: wrap;
}
.brand { font-family: var(--f-label); font-size: 14px; letter-spacing: .2em; color: var(--sulfur); }
/* The nav wraps to a second row at 375px. It is flex with gap, never a
   scroller: a scroller hides items (DESIGN.md §4). */
.nav { display: flex; gap: var(--s1); margin-left: auto; flex-wrap: wrap; }
.nav a {
  font-family: var(--f-label); font-size: 13px; letter-spacing: .14em;
  padding: 6px 10px; border: 1px solid transparent; color: var(--parchmentDim);
}
.nav a[aria-current="page"] { color: var(--sulfur); border-color: var(--ash); }
.theme-pick { display: flex; align-items: center; gap: var(--s2); }
.theme-pick select {
  font-family: var(--f-mono); font-size: 11px; background: var(--panelBg);
  color: var(--bone); border: 1px solid var(--ash); padding: 6px var(--s2);
}

/* ── hero (DESIGN.md §6) ───────────────────────────────────────────────── */
.hero { position: relative; height: 88vh; min-height: 520px; overflow: hidden; background: var(--deepBg); }
.hero-plate {
  position: absolute; left: -8%; top: -12%; width: 116%; height: 124%; object-fit: cover;
  filter: grayscale(1) contrast(1.15) brightness(.85); opacity: .62; will-change: transform;
}
.hero-sheet { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; will-change: transform, opacity; }
.hero-vignette { position: absolute; inset: 0; box-shadow: inset 0 0 160px 70px var(--bg); pointer-events: none; }
.hero-title {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  padding: 0 var(--s4); text-align: center; will-change: opacity, transform;
}
.hero-title h1 {
  margin: 0; font-size: clamp(46px, 11vw, 110px); line-height: .98;
  color: var(--parchment); text-shadow: 0 2px 30px var(--bg), 0 0 80px var(--bg);
}
.hero-cue {
  position: absolute; left: 0; right: 0; bottom: 26px; text-align: center;
  font-family: var(--f-label); font-size: 12px; letter-spacing: .34em; color: var(--bone);
}

/* ── the before/after component (DESIGN.md §7) ─────────────────────────── */
.ba { margin: var(--s4) 0; }
/* Shapes taller than 1:1 sit side by side and fall to one column, before
   first, below 560px. A wide plate is stacked so it keeps its width. */
.ba-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.ba-card .ba-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
.ba-wide .ba-grid, .ba-text .ba-grid { grid-template-columns: 1fr; }
.ba-side { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.ba-chip {
  display: flex; align-items: center; gap: 7px; margin: 0;
  font-family: var(--f-label); font-size: 12px; letter-spacing: .2em; color: var(--bone);
}
.ba-pip { width: 6px; height: 6px; border-radius: 3px; background: var(--bone); flex: none; }
.ba-after .ba-chip { color: var(--sulfur); }
.ba-after .ba-pip { background: var(--sulfur); }
/* The box is reserved at the capture's ratio and hatched while it loads —
   no spinner, no shimmer, and the page never jumps. */
.ba-box {
  border: 1px solid var(--ash); background: var(--deepBg);
  background-image: repeating-linear-gradient(135deg, var(--panelBg) 0 6px, var(--deepBg) 6px 12px);
  overflow: hidden;
}
.ba-after .ba-box { border-color: var(--sulfur); }
.ba-box img { width: 100%; height: auto; display: block; }
.ba-cap { margin: 10px 0 0; font-family: var(--f-mono); font-size: 12px; line-height: 1.5; color: var(--bone); }
.ba-label { margin: 0 0 var(--s2); font-family: var(--f-label); font-size: 12px; letter-spacing: .2em; color: var(--parchment); }
.ba-rule { margin: 0; padding: 12px 14px; border: 1px solid var(--ash); background: var(--panelBg); font-size: 15.5px; color: var(--parchmentDim); }
.ba-after .ba-rule { border-color: var(--sulfur); color: var(--parchment); }
/* The two enhancements, once site.js has upgraded them. */
.ba-swap .ba-grid { grid-template-columns: 1fr; max-width: 360px; }
.ba-swap-btn { display: block; width: 100%; padding: 0; border: 1px solid var(--sulfur); background: var(--deepBg); position: relative; cursor: pointer; min-height: 44px; }
.ba-swap-btn img { display: block; width: 100%; transition: opacity .16s; }
.ba-swap-btn img.is-under { position: absolute; inset: 0; height: 100%; object-fit: cover; }
.ba-swap-tag {
  position: absolute; left: 8px; top: 8px; font-family: var(--f-label); font-size: 12px;
  letter-spacing: .2em; padding: 4px 8px; background: var(--bg); color: var(--sulfur); border: 1px solid var(--sulfur);
}
.ba-wipe-box { position: relative; max-width: 360px; border: 1px solid var(--ash); background: var(--deepBg); overflow: hidden; touch-action: none; cursor: ew-resize; }
.ba-wipe-box > img { width: 100%; display: block; }
.ba-wipe-clip { position: absolute; inset: 0; width: 50%; overflow: hidden; border-right: 1px solid var(--sulfur); }
.ba-wipe-clip img { height: 100%; display: block; max-width: none; }
.ba-wipe-handle {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 44px; height: 44px; border-radius: 22px; border: 1px solid var(--sulfur);
  background: var(--bg); color: var(--sulfur); display: flex; align-items: center;
  justify-content: center; font-family: var(--f-mono); font-size: 13px;
}
.nocap { border: 1px solid var(--ash); background: var(--panelBg); padding: 14px 16px; margin: var(--s3) 0; }
.nocap p { margin: 0; color: var(--parchmentDim); font-size: 15.5px; }
.nocap-label { font-family: var(--f-label); font-size: 11px; letter-spacing: .2em; color: var(--bone); text-transform: uppercase; margin: 0 0 7px !important; }

/* ── work items and chips ──────────────────────────────────────────────── */
.item { border-top: 1px solid var(--divider); padding-top: var(--s4); margin-bottom: var(--s5); }
.item-head { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; flex-wrap: wrap; }
.field-label { font-family: var(--f-label); font-size: 11px; letter-spacing: .2em; color: var(--bone); margin: 0 0 var(--s1); text-transform: uppercase; }
.field-why .field-label { color: var(--sulfur); }
.field p { margin: 0; }
.field-why p { color: var(--parchmentDim); }
.field + .field { margin-top: var(--s3); }
.chip {
  font-family: var(--f-label); font-size: 11px; letter-spacing: .18em;
  padding: 3px 8px; border: 1px solid var(--ash); color: var(--bone); white-space: nowrap;
}
.chip-ui { border-color: var(--sulfur); color: var(--sulfur); }
.chip-content { border-color: var(--heal); color: var(--heal); }
.chip-mechanics { border-color: var(--rust); color: var(--rust); }
.chip-balance { border-color: var(--blood); color: var(--blood); }
.chip-infra { border-color: var(--ash); color: var(--bone); }
.commits { font-family: var(--f-mono); font-size: 11px; color: var(--bone); margin: var(--s3) 0 0; }

/* ── marginalia (collapsed, and collapsible with no script) ────────────── */
.marg { border: 1px solid var(--ash); margin-bottom: var(--s2); background: var(--panelBg); }
.marg summary {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  padding: 13px 15px; cursor: pointer; list-style: none;
  font-family: var(--f-label); font-size: 13px; letter-spacing: .14em; color: var(--parchment);
}
.marg summary::-webkit-details-marker { display: none; }
.marg .chev { font-family: var(--f-mono); color: var(--bone); }
.marg .chev::after { content: "+"; }
.marg[open] .chev::after { content: "\\2212"; }
.marg-body { padding: 14px 15px; border-top: 1px solid var(--divider); color: var(--parchmentDim); }
.marg-body p, .marg-body li { max-width: none; }

/* ── the log index ─────────────────────────────────────────────────────── */
.filters { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: var(--s4); }
.filters button {
  font: inherit; font-family: var(--f-label); font-size: 12px; letter-spacing: .14em;
  padding: 7px 12px; border: 1px solid var(--ash); background: none; color: var(--parchmentDim); cursor: pointer;
}
.filters button[aria-pressed="true"] { border-color: var(--sulfur); color: var(--sulfur); }
.entries { list-style: none; margin: 0; padding: 0; }
.entries li { border-top: 1px solid var(--divider); padding: 20px 0; }
.entry-row { display: grid; grid-template-columns: minmax(0, 1fr) 148px; gap: 18px; align-items: start; }
.entry-row img { width: 100%; border: 1px solid var(--ash); background: var(--deepBg); display: block; }
.entry-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
.pager { display: flex; gap: var(--s3); margin-top: var(--s5); font-family: var(--f-label); letter-spacing: .14em; }

/* ── catalog (DESIGN.md §8) ────────────────────────────────────────────── */
.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: var(--s3); }
.foe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: var(--s3); }
.eff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
/* THE PRINTED PLATE — the card face as the game draws it: a blackletter name
   band, a framed plate behind a hairline rule, a ledger at the foot. */
.plate { display: block; border: 1.5px solid var(--ash); border-radius: 4px; background: var(--deepBg); overflow: hidden; box-shadow: 0 3px 6px var(--shadow); }
.plate-body { border-color: var(--blood); } .plate-mind { border-color: var(--sulfur); } .plate-heart { border-color: var(--rust); }
.plate-name { display: flex; align-items: center; gap: 5px; padding: 4px 6px; border-bottom: 1px solid var(--divider); min-height: 30px; font-family: var(--f-display); font-size: 14px; line-height: 1.14; color: var(--parchment); }
.plate-art { padding: 4px; background: var(--panelBg); }
.plate-art > div { aspect-ratio: 1/1; border: 1px solid var(--ash); background: var(--deepBg); overflow: hidden; }
.plate-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
.plate-paid {
  margin: 0; padding: 0 6px 8px; font-size: 13px; line-height: 1.45; color: var(--parchmentDim);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
/* The art a licence will not let this site republish. Hatched like a loading
   plate, labelled like a policy — never a silent black box. */
.plate-art .withheld {
  display: flex; align-items: center; justify-content: center; text-align: center;
  background-image: repeating-linear-gradient(135deg, var(--panelBg) 0 6px, var(--deepBg) 6px 12px);
  font-family: var(--f-mono); font-size: 10px; line-height: 1.5; color: var(--bone); padding: 6px;
}
.plate-ledger { display: flex; align-items: center; gap: 6px; padding: 6px; border-top: 1px solid var(--divider); min-height: 42px; font-family: var(--f-mono); font-size: 11px; color: var(--parchment); }
.plate-free { font-family: var(--f-mono); font-size: 12px; color: var(--parchment); }
.plate-key { font-family: var(--f-label); font-size: 12px; letter-spacing: .06em; }
.foe { border: 1px solid var(--ash); background: var(--panelBg); }
.foe .portrait { aspect-ratio: 1/1; background: var(--deepBg); overflow: hidden; }
.foe .portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }
.foe-body { padding: 12px 13px; }
.eff { border: 1px solid var(--ash); background: var(--panelBg); padding: 13px 14px; }
.eff-name { font-family: var(--f-label); font-size: 14px; letter-spacing: .14em; margin: 0 0 6px; }

/* ── shared body markup emitted by devlog-entry.mjs ────────────────────── */
.tablewrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-family: var(--f-mono); font-size: 12px; color: var(--parchmentDim); }
th, td { text-align: left; padding: 6px 10px 6px 0; vertical-align: top; }
th { color: var(--bone); font-weight: 400; }
.st { white-space: nowrap; }
.st-ok { color: var(--heal); } .st-neutral { color: var(--bone); }
.st-warn { color: var(--sulfur); } .st-bad { color: var(--blood); }
.diff { border: 1px solid var(--ash); background: var(--panelBg); overflow-x: auto; margin: var(--s3) 0; font-family: var(--f-mono); font-size: 12.5px; line-height: 1.6; color: var(--parchmentDim); }
.dl { padding: 0 12px; white-space: pre; }
.dl.add { color: var(--heal); } .dl.del { color: var(--blood); }
.dl.hunk { color: var(--sulfur); } .dl.meta { color: var(--bone); }
code, pre { font-family: var(--f-mono); font-size: .9em; }
pre { border: 1px solid var(--ash); background: var(--panelBg); padding: 12px 14px; overflow-x: auto; }

/* ── footer ────────────────────────────────────────────────────────────── */
.foot { border-top: 1px solid var(--divider); margin-top: var(--s6); padding: var(--s4) var(--s3) var(--s7); }
.foot-in { max-width: var(--col-full); margin: 0 auto; font-family: var(--f-mono); font-size: 11.5px; line-height: 1.7; color: var(--bone); }
.foot a { color: var(--bone); text-decoration: underline; }

/* ── 375px: the majority case (DESIGN.md §4) ───────────────────────────── */
@media (max-width: 560px) {
  /* Three header rows is a phone's whole first screen. The theme label goes
     to assistive tech only and the picker rides the nav's row. */
  .theme-pick label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .top-in { gap: var(--s2); padding: 8px var(--s3); }
  .nav a { padding: 5px 8px; }
  .entry-row { grid-template-columns: 1fr; }
  .entry-row img { max-width: 220px; }
  .band { padding-left: var(--s3); padding-right: var(--s3); }
}
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
[hidden] { display: none !important; }
`;

// ---------------------------------------------------------------------------
// The document scaffold
// ---------------------------------------------------------------------------
const NAV = [
  { href: "/log/", label: "The Log", key: "log" },
  { href: "/catalog/", label: "Catalog", key: "catalog" },
  { href: "/tuning-lab/", label: "Tuning Lab", key: "lab" },
  { href: "/about/", label: "About", key: "about" },
];

/** The theme switcher: a real <select>, enhanced by site.js, harmless without it. */
function themePicker(themes) {
  const options = themes.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
  return `<form class="theme-pick" hidden data-theme-pick>
        <label class="mono" for="theme">Theme</label>
        <select id="theme" name="theme">${options}</select>
      </form>`;
}

/**
 * A whole page.
 *
 * `root` is the relative path back to the site root ("" at the root,
 * "../" one level down, …) so the build works from a file:// open as well as
 * from the deployed origin.
 */
export function page({ title, description, body, current = "", root = "", themes = [], date = "" }) {
  const nav = NAV.map((n) => {
    const href = root + n.href.replace(/^\//, "");
    const mark = n.key === current ? ' aria-current="page"' : "";
    return `<a href="${href}"${mark}>${escapeHtml(n.label)}</a>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description || "")}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description || "")}">
<meta property="og:type" content="${date ? "article" : "website"}">
${date ? `<meta property="article:published_time" content="${escapeHtml(date)}">` : ""}
<link rel="alternate" type="application/atom+xml" title="Miserere Mei, Deus DevLog" href="${root}feed.xml">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pirata+One&family=IM+Fell+English:ital@0;1&family=Bebas+Neue&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${root}assets/tokens.css">
<link rel="stylesheet" href="${root}assets/site.css">
</head>
<body>
<header class="top">
  <div class="top-in">
    <a class="brand" href="${root || './'}">${MARKS.dagger} The Chronicle</a>
    <nav class="nav" aria-label="Sections">${nav}</nav>
    ${themePicker(themes)}
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="foot-in">
    <p>Miserere Mei, Deus &mdash; a development log, written the night the work was done.</p>
    <p>Plates: 19th-century wood engravings, public domain. Marks: game-icons.net. Type: Pirata One, IM Fell English, Bebas Neue, JetBrains Mono &mdash; open licence. <a href="${root}about/">Full attribution</a>.</p>
  </div>
</footer>
<script src="${root}assets/site.js" defer></script>
</body>
</html>
`;
}
