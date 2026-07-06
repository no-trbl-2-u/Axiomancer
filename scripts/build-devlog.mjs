#!/usr/bin/env node
// Build the DevLog site:
//   - devlog/index.html         the HUB — four links: Cards, Enemies, Effects, DevLog
//   - devlog/log.html           the DevLog entry list (newest first)
//   - devlog/DIGEST_<date>.html one page per structured markdown entry
//
// The Cards / Enemies / Effects pages are built by scripts/build-catalog.mjs
// from devlog/data/*.json (produced by `npm run catalog:export`). This script
// only reads those JSON files (if present) to show live counts on the hub.
//
// Zero dependencies (matches the dep-free root). Entries are Markdown with a
// light structure the /digest skill authors (see skills/digest.md §3.4):
//
//   # <YYYY-MM-DD>
//   > one-line headline
//
//   ## [mechanics] Title of a change      <- a work-item CARD (bracketed category)
//   **What:** what changed
//   **Why:** why it changed
//   **Commits:** 16e1386, 09faf57
//   ```diff
//   @@ ... @@
//   - old
//   + new
//   ```
//
//   ## [ui] Title of a UI change
//   **What:** ...
//   **Why:** ...
//   **Shot:** combat-encounter — caption   <- pulls devlog/assets/<date>/combat-encounter.{before,after,diff}.png
//
//   ## Pulse                              <- an un-bracketed PANEL (rendered as-is)
//   | Tick | Verb | Outcome |
//   ...
//
// Usage: node scripts/build-devlog.mjs   (or: npm run devlog:build)

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { escapeHtml, slug, inline, page } from "./devlog-shell.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEVLOG = join(ROOT, "devlog");
const ENTRIES = join(DEVLOG, "entries");
const ASSETS = join(DEVLOG, "assets");
const DATA = join(DEVLOG, "data");

const ENTRY_RE = /^DIGEST_(\d{4}-\d{2}-\d{2})\.md$/;

const CATEGORIES = ["mechanics", "ui", "content", "infra", "balance"];
const CAT_LABEL = {
  mechanics: "mechanics",
  ui: "UI",
  content: "content",
  infra: "infra",
  balance: "balance",
};

// ---------------------------------------------------------------------------
// Status is color + text, never color alone (format contract): tag known
// outcome words with a colored dot while keeping the word. Applied to table
// cells only, where the pulse/queue outcomes live.
// ---------------------------------------------------------------------------
const STATUS = [
  { re: /\b(shipped|landed|merged|done|pass(?:ed)?|green|clean)\b/gi, cls: "ok" },
  { re: /\b(no-?op|quiet|skip(?:ped)?|idle|none)\b/gi, cls: "neutral" },
  { re: /\b(blocked|needs[- ]user|waiting|pending)\b/gi, cls: "warn" },
  { re: /\b(crashed|failed|failure|error|broke(?:n)?|red)\b/gi, cls: "bad" },
];
function statusize(html) {
  // Skip cells that contain markup (links/code) to avoid matching inside tags.
  if (/[<]/.test(html)) return html;
  for (const { re, cls } of STATUS) {
    html = html.replace(re, (m) => `<span class="st st-${cls}">${m}</span>`);
  }
  return html;
}

// ---------------------------------------------------------------------------
// Diff rendering — a fenced ```diff block becomes a colored +/- view
// ---------------------------------------------------------------------------
function renderDiff(text) {
  const rows = text
    .split("\n")
    .map((l) => {
      let cls = "ctx";
      if (l.startsWith("@@")) cls = "hunk";
      else if (/^(\+\+\+|---|diff |index )/.test(l)) cls = "meta";
      else if (l.startsWith("+")) cls = "add";
      else if (l.startsWith("-")) cls = "del";
      const body = escapeHtml(l) || "&nbsp;";
      return `<div class="dl ${cls}">${body}</div>`;
    })
    .join("");
  return `<div class="diff" role="img" aria-label="code diff">${rows}</div>`;
}

// ---------------------------------------------------------------------------
// Block markdown → HTML (used for card bodies and panels)
// ---------------------------------------------------------------------------
function isTableSep(line) {
  return /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes("-");
}
function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }

    // Fenced code — ```diff gets the colored diff view, everything else <pre>.
    if (/^```/.test(line.trim())) {
      const lang = line.trim().replace(/^```/, "").trim().toLowerCase();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
      i++; // closing fence
      out.push(lang === "diff" ? renderDiff(buf.join("\n")) : `<pre><code>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    // Heading (inside a body — rare; keep it working)
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(6, h[1].length + 1);
      const text = h[2].trim();
      out.push(`<h${level} id="${slug(text)}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${statusize(inline(c))}</td>`).join("")}</tr>`).join("")}</tbody>`;
      out.push(`<div class="tablewrap"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Paragraph
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^```/.test(lines[i].trim()) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Parse a structured entry into a headline + ordered sections
// ---------------------------------------------------------------------------
function parseEntry(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let headline = "";
  const sections = [];
  let cur = null; // { kind, category, title, bodyLines }

  const push = () => { if (cur) sections.push(cur); cur = null; };

  for (const raw of lines) {
    const line = raw;
    const sec = line.match(/^##\s+(.*)$/);
    if (sec) {
      push();
      const title = sec[1].trim();
      const cat = title.match(/^\[([a-z-]+)\]\s*(.*)$/i);
      if (cat && CATEGORIES.includes(cat[1].toLowerCase())) {
        cur = { kind: "card", category: cat[1].toLowerCase(), title: cat[2].trim() || cat[1], bodyLines: [] };
      } else {
        cur = { kind: "panel", title, bodyLines: [] };
      }
      continue;
    }
    if (!cur) {
      // Preamble: the first blockquote line is the headline.
      if (!headline) {
        const q = line.match(/^>\s?(.*)$/);
        if (q && q[1].trim()) headline = q[1].trim();
      }
      continue;
    }
    cur.bodyLines.push(line);
  }
  push();

  return { headline, sections };
}

// Pull labelled fields (**What:** ...) out of a card body; return fields + the
// remaining free-form body markdown.
function extractFields(bodyLines) {
  const fields = { what: "", why: "", commits: [], shots: [] };
  const rest = [];
  for (const line of bodyLines) {
    let m;
    if ((m = line.match(/^\*\*What:\*\*\s*(.*)$/i))) { fields.what = m[1].trim(); continue; }
    if ((m = line.match(/^\*\*Why:\*\*\s*(.*)$/i))) { fields.why = m[1].trim(); continue; }
    if ((m = line.match(/^\*\*Commits:\*\*\s*(.*)$/i))) {
      fields.commits = m[1].split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
      continue;
    }
    if ((m = line.match(/^\*\*Shot:\*\*\s*(.*)$/i))) {
      const [screen, ...cap] = m[1].split(/\s+—\s+|\s+-\s+/);
      fields.shots.push({ screen: (screen || "").trim(), caption: cap.join(" — ").trim() });
      continue;
    }
    rest.push(line);
  }
  return { fields, body: rest.join("\n").trim() };
}

// ---------------------------------------------------------------------------
// Render a UI screenshot set (before / after / diff) if the assets exist
// ---------------------------------------------------------------------------
function renderShots(shots, date) {
  const dir = join(ASSETS, date);
  const out = [];
  for (const { screen, caption } of shots) {
    if (!screen) continue;
    const roles = [
      ["before", "Before"],
      ["after", "After"],
      ["diff", "Changes"],
    ];
    const figs = roles
      .filter(([r]) => existsSync(join(dir, `${screen}.${r}.png`)))
      .map(
        ([r, label]) =>
          `<figure class="shot"><div class="role">${label}</div>` +
          `<img loading="lazy" src="./assets/${date}/${screen}.${r}.png" alt="${escapeHtml(screen)} ${label}"></figure>`
      );
    if (figs.length === 0) continue;
    out.push(
      `<figure class="shotset"><figcaption><code>${escapeHtml(screen)}</code>${
        caption ? " — " + inline(caption) : ""
      }</figcaption><div class="shots">${figs.join("")}</div></figure>`
    );
  }
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Render a whole entry body
// ---------------------------------------------------------------------------
function renderSections(sections, date) {
  const counts = {};
  const html = sections
    .map((s) => {
      if (s.kind === "panel") {
        return `<section class="panel" id="${slug(s.title)}"><h2>${inline(s.title)}</h2>\n${mdToHtml(
          s.bodyLines.join("\n")
        )}</section>`;
      }
      counts[s.category] = (counts[s.category] || 0) + 1;
      const { fields, body } = extractFields(s.bodyLines);
      const parts = [];
      parts.push(
        `<div class="card-head"><span class="chip cat-${s.category}">${CAT_LABEL[s.category] || s.category}</span><h2>${inline(
          s.title
        )}</h2></div>`
      );
      if (fields.what) parts.push(`<p class="field"><span class="flabel">What</span> ${inline(fields.what)}</p>`);
      if (fields.why) parts.push(`<p class="field"><span class="flabel">Why</span> ${inline(fields.why)}</p>`);
      if (fields.commits.length)
        parts.push(
          `<p class="commits">${fields.commits
            .map((c) => `<code class="commit">${escapeHtml(c)}</code>`)
            .join(" ")}</p>`
        );
      if (body) parts.push(mdToHtml(body));
      if (fields.shots.length) parts.push(renderShots(fields.shots, date));
      return `<section class="card cat-${s.category}" id="${slug(s.title)}">${parts.join("\n")}</section>`;
    })
    .join("\n");
  return { html, counts };
}

function countsBar(counts) {
  const chips = CATEGORIES.filter((c) => counts[c]).map(
    (c) => `<span class="chip cat-${c}">${counts[c]} ${CAT_LABEL[c] || c}</span>`
  );
  return chips.length ? `<div class="counts">${chips.join("")}</div>` : "";
}

// ---------------------------------------------------------------------------
// The hub (devlog/index.html) — four links into the site
// ---------------------------------------------------------------------------
function dataCount(name) {
  try {
    const arr = JSON.parse(readFileSync(join(DATA, `${name}.json`), "utf8"));
    return Array.isArray(arr) ? arr.length : null;
  } catch {
    return null;
  }
}

function buildHub(entryCount) {
  const cards = dataCount("cards");
  const enemies = dataCount("enemies");
  const effects = dataCount("effects");
  const sub = (n, noun) => (n == null ? "browse the catalog" : `${n} ${noun}`);

  const tiles = [
    { href: "./cards.html", hue: "cards", glyph: "🂠", title: "Cards", sub: sub(cards, "cards") },
    { href: "./enemies.html", hue: "enemies", glyph: "☠", title: "Enemies", sub: sub(enemies, "foes") },
    { href: "./effects.html", hue: "effects", glyph: "✷", title: "Effects", sub: sub(effects, "statuses") },
    {
      href: "./log.html",
      hue: "log",
      glyph: "❯",
      title: "DevLog",
      sub: entryCount === 0 ? "no entries yet" : `${entryCount} ${entryCount === 1 ? "entry" : "entries"}`,
    },
  ];

  const grid = tiles
    .map(
      (t) =>
        `  <a class="hue-${t.hue}" href="${t.href}"><span class="h-glyph">${t.glyph}</span>` +
        `<div class="h-title">${escapeHtml(t.title)}</div><div class="h-sub">${escapeHtml(t.sub)}</div></a>`
    )
    .join("\n");

  return (
    `<h1>Axiomancer</h1>\n` +
    `<p class="muted">A private index of the game's content and the nightly development log.</p>\n` +
    `<div class="hub">\n${grid}\n</div>`
  );
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
function build() {
  if (!existsSync(ENTRIES)) mkdirSync(ENTRIES, { recursive: true });

  const files = readdirSync(ENTRIES).filter((f) => ENTRY_RE.test(f)).sort().reverse();

  const meta = [];
  for (const file of files) {
    const date = file.match(ENTRY_RE)[1];
    const md = readFileSync(join(ENTRIES, file), "utf8");
    const { headline, sections } = parseEntry(md);
    const { html, counts } = renderSections(sections, date);

    const body = `<h1 id="headline">${date}</h1>\n${
      headline ? `<p class="headline">${inline(headline)}</p>` : ""
    }\n${countsBar(counts)}\n${html}`;

    writeFileSync(
      join(DEVLOG, `DIGEST_${date}.html`),
      page({
        title: `Axiomancer digest — ${date}`,
        home: { href: "./log.html", label: "← DevLog" },
        crumb: date,
        body,
      })
    );
    meta.push({ date, headline, counts });
  }

  // DevLog entry list → log.html
  const listBody =
    meta.length === 0
      ? `<h1>DevLog</h1>\n<p class="muted">No entries yet — the next nightly digest will land the first one.</p>`
      : `<h1>DevLog</h1>\n<p class="muted">${meta.length} ${
          meta.length === 1 ? "entry" : "entries"
        }, newest first.</p>\n<ul class="entry-list">\n${meta
          .map(
            (m) =>
              `  <li><a href="./DIGEST_${m.date}.html"><span class="date">${m.date}</span>` +
              `<div class="head">${escapeHtml(m.headline)}</div>${countsBar(m.counts)}</a></li>`
          )
          .join("\n")}\n</ul>`;

  writeFileSync(
    join(DEVLOG, "log.html"),
    page({
      title: "Axiomancer DevLog",
      home: { href: "./index.html", label: "← Axiomancer" },
      crumb: "DevLog",
      body: listBody,
    })
  );

  // Hub → index.html
  writeFileSync(
    join(DEVLOG, "index.html"),
    page({ title: "Axiomancer", home: null, crumb: "", body: buildHub(meta.length) })
  );

  console.log(`devlog: built hub + log + ${meta.length} entr${meta.length === 1 ? "y" : "ies"}`);
}

build();
