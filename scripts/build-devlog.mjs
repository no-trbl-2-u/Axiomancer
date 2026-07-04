#!/usr/bin/env node
// Build the DevLog: turn each structured markdown entry in devlog/entries/ into
// a self-contained, visually organized HTML page under devlog/, and regenerate
// devlog/index.html.
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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEVLOG = join(ROOT, "devlog");
const ENTRIES = join(DEVLOG, "entries");
const ASSETS = join(DEVLOG, "assets");

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
// Inline markdown → HTML
// ---------------------------------------------------------------------------
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Stable, diffable heading ids ("Today's intent" -> "todays-intent").
function slug(s) {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Status is color + text, never color alone (format contract): tag known
// outcome words with a colored dot while keeping the word. Applied to table
// cells only, where the pulse/queue outcomes live.
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

function inline(text) {
  // Protect code spans with a private-use sentinel (survives escapeHtml, can't
  // occur in real input) so their contents aren't reformatted and bare numbers
  // in the text can't collide with placeholders.
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(`<code>${escapeHtml(code)}</code>`);
    return `\x00${codes.length - 1}\x00`;
  });
  s = escapeHtml(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const safe = href.replace(/"/g, "&quot;");
    return `<a href="${safe}">${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^A-Za-z0-9])_([^_]+)_/g, "$1<em>$2</em>");
  s = s.replace(/\x00(\d+)\x00/g, (_, i) => codes[Number(i)]);
  return s;
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
// Shared page shell — the single source of DevLog styling
// ---------------------------------------------------------------------------
const STYLE = `
:root {
  color-scheme: light dark;
  --bg: #0e1116; --fg: #d7dde5; --fg-strong: #f0f3f7; --muted: #6b7480;
  --accent: #8ab4f8; --panel: #161b22; --card: #12171f; --border: #222833;
  --row: #141a22; --code-bg: #1b212b; --th: #aeb7c2; --list-head: #9aa4b0;
  --add: rgba(80,200,120,.16); --del: rgba(230,90,90,.16);
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #f7f5ef; --fg: #33302a; --fg-strong: #1a160f; --muted: #6f6656;
    --accent: #3a5db0; --panel: #efece3; --card: #fbfaf5; --border: #ddd7c9;
    --row: #efece3; --code-bg: #e9e5d9; --th: #5c5344; --list-head: #6f6656;
    --add: rgba(35,140,75,.16); --del: rgba(190,55,55,.16);
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-text-size-adjust: 100%;
}
.wrap { max-width: 46rem; margin: 0 auto; padding: 20px 18px 80px; }
header.top {
  position: sticky; top: 0; z-index: 5;
  background: var(--bg); border-bottom: 1px solid var(--border); margin: 0 0 20px;
}
header.top .wrap { padding-top: 14px; padding-bottom: 14px; display: flex; align-items: baseline; gap: 14px; }
header.top a.home, header.top .home { color: var(--accent); text-decoration: none; font-weight: 600; }
header.top .crumb { color: var(--muted); font-size: 14px; font-variant-numeric: tabular-nums; }
h1, h2, h3, h4 { line-height: 1.25; color: var(--fg-strong); }
h1 { font-size: 26px; margin: 0 0 6px; }
h2 { font-size: 19px; margin: 0; }
a { color: var(--accent); }
p { margin: 8px 0; }
code { background: var(--code-bg); padding: 1px 6px; border-radius: 5px; font-size: 0.86em; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
pre { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; overflow-x: auto; }
pre code { background: none; padding: 0; }
.tablewrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; }
th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
th { background: var(--panel); color: var(--th); font-weight: 600; white-space: nowrap; }
tr:last-child td { border-bottom: none; }
ul, ol { padding-left: 22px; }
li { margin: 4px 0; }
.muted { color: var(--muted); }

.st { font-weight: 600; white-space: nowrap; }
.st::before { content: ""; display: inline-block; width: .5em; height: .5em; border-radius: 50%; margin-right: .38em; background: currentColor; vertical-align: middle; }
.st-ok { color: #4bb96a; }
.st-neutral { color: var(--muted); }
.st-warn { color: #d0a92b; }
.st-bad { color: #e0574b; }

.headline { font-size: 19px; color: var(--fg-strong); margin: 0 0 12px; }
.counts { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 22px; }

.chip {
  display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: .04em;
  text-transform: uppercase; padding: 2px 9px; border-radius: 999px;
  color: #0b0d10; background: var(--cat, var(--accent)); white-space: nowrap;
}
.cat-mechanics { --cat: #d0a92b; }
.cat-ui { --cat: #5aa9e6; }
.cat-content { --cat: #7fc45a; }
.cat-infra { --cat: #b08bf0; }
.cat-balance { --cat: #e6864b; }

.card {
  background: var(--card); border: 1px solid var(--border);
  border-left: 4px solid var(--cat, var(--accent));
  border-radius: 10px; padding: 14px 18px; margin: 14px 0; scroll-margin-top: 72px;
}
.card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.card-head h2 { font-size: 18px; }
.field { margin: 6px 0; }
.flabel {
  display: inline-block; min-width: 3.2em; margin-right: 4px; color: var(--muted);
  font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .04em;
}
.commits { margin: 8px 0 2px; }
.commit { font-size: 12px; }

.panel { margin: 22px 0; scroll-margin-top: 72px; }
.panel > h2 { padding-bottom: 6px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }

.diff {
  border: 1px solid var(--border); border-radius: 8px; overflow-x: auto; margin: 12px 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; line-height: 1.5;
  background: var(--bg);
}
.dl { padding: 0 12px; white-space: pre; }
.dl.add { background: var(--add); }
.dl.del { background: var(--del); }
.dl.hunk { color: var(--accent); }
.dl.meta { color: var(--muted); }

figure.shotset { margin: 14px 0; }
figure.shotset > figcaption { font-size: 14px; color: var(--fg); margin-bottom: 8px; }
.shots { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.shot { margin: 0; }
.shot .role { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); text-align: center; margin-bottom: 3px; }
.shot img { width: 100%; height: auto; border: 1px solid var(--border); border-radius: 8px; display: block; }

.entry-list { list-style: none; padding: 0; margin: 8px 0 0; }
.entry-list li { margin: 0; border-bottom: 1px solid var(--border); }
.entry-list a { display: block; padding: 14px 4px; text-decoration: none; color: var(--fg); }
.entry-list a:hover { background: var(--row); }
.entry-list .date { color: var(--accent); font-weight: 600; font-variant-numeric: tabular-nums; }
.entry-list .head { color: var(--list-head); font-size: 14px; margin: 2px 0 6px; }
footer.foot { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--border); color: var(--muted); font-size: 13px; }
`;

function page({ title, crumb, body, isIndex }) {
  const home = isIndex
    ? `<span class="home">Axiomancer DevLog</span>`
    : `<a class="home" href="./index.html">&larr; DevLog</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<header class="top"><div class="wrap">${home}${crumb ? `<span class="crumb">${escapeHtml(crumb)}</span>` : ""}</div></header>
<main class="wrap">
${body}
<footer class="foot">Axiomancer DevLog &middot; generated by <code>scripts/build-devlog.mjs</code></footer>
</main>
</body>
</html>
`;
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
      page({ title: `Axiomancer digest — ${date}`, crumb: date, body, isIndex: false })
    );
    meta.push({ date, headline, counts });
  }

  const listBody =
    meta.length === 0
      ? `<h1>Axiomancer DevLog</h1>\n<p class="muted">No entries yet — the next nightly digest will land the first one.</p>`
      : `<h1>Axiomancer DevLog</h1>\n<p class="muted">${meta.length} ${
          meta.length === 1 ? "entry" : "entries"
        }, newest first.</p>\n<ul class="entry-list">\n${meta
          .map(
            (m) =>
              `  <li><a href="./DIGEST_${m.date}.html"><span class="date">${m.date}</span>` +
              `<div class="head">${escapeHtml(m.headline)}</div>${countsBar(m.counts)}</a></li>`
          )
          .join("\n")}\n</ul>`;

  writeFileSync(
    join(DEVLOG, "index.html"),
    page({ title: "Axiomancer DevLog", crumb: "", body: listBody, isIndex: true })
  );

  console.log(`devlog: built ${meta.length} entr${meta.length === 1 ? "y" : "ies"} + index.html`);
}

build();
