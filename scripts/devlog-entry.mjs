#!/usr/bin/env node
// scripts/devlog-entry.mjs — THE ENTRY GRAMMAR, in one place.
//
// The nightly `/digest` skill authors one structured Markdown file per day
// into `devlog/entries/DIGEST_<date>.md`. Two sites render those files: the
// private local index (`scripts/build-devlog.mjs`) and the public DevLog
// (`scripts/build-devlog-public.mjs`). The publish prompt is explicit that
// there must be ONE grammar — "Extend that grammar; do not invent a second
// one" — so the parse and the block-Markdown renderer live here and both
// builders import them. A divergence between the two sites is then impossible
// by construction rather than by diligence.
//
// THE GRAMMAR
// -----------
//   # <YYYY-MM-DD>
//   > one-line headline
//
//   ## [mechanics] Title of a change        <- a work-item CARD (bracketed category)
//   **What:** what changed
//   **Why:** why it changed
//   **Commits:** 16e1386, 09faf57
//   **Shot:** combat-encounter — caption    <- a UI screen pair (devlog-shots.mjs)
//   **Evidence:** card frostbitten-palisade — caption   <- a non-screen pair
//   **No capture:** why this change has no picture
//   ```diff
//   @@ ... @@
//   - old
//   + new
//   ```
//
//   ## Pulse                                <- an un-bracketed PANEL, rendered as-is
//   | Tick | Verb | Outcome |
//
// `**Shot:**`, `**Evidence:**` and `**No capture:**` are the evidence fields.
// The first two name a capture the pipeline produced; the third states, in the
// author's own words, that no capture exists. DESIGN.md §7: "Missing evidence
// is stated, never faked" — an item with neither an evidence field nor a
// no-capture line simply prints no picture, and the public builder says so.
//
// Zero dependencies, pure functions, no disk access: everything here takes a
// string and returns a string or a plain object, so both builders and the
// tests can drive it without a fixture tree.

// ---------------------------------------------------------------------------
// Categories — the five kinds of work a card may carry
// ---------------------------------------------------------------------------
export const CATEGORIES = ["mechanics", "ui", "content", "infra", "balance"];

export const CAT_LABEL = {
  mechanics: "mechanics",
  ui: "UI",
  content: "content",
  infra: "infra",
  balance: "balance",
};

/**
 * Categories older entries used before the vocabulary settled on five.
 *
 * Fifty-four nights of ledger predate the public site, and they carry
 * `[docs]`, `[combat]`, `[mobile]`, `[tests]`, `[world]` and friends. Those
 * sections are work items — they have a What and a Why — so they must render
 * as work items, not fall through to the panel branch and be mistaken for
 * marginalia. The alias table maps each one onto the five that ship; anything
 * still unknown becomes `infra`, the "it was plumbing" bucket, because a
 * bracketed heading is a work item by construction whatever it is called.
 */
export const CATEGORY_ALIASES = {
  docs: "infra", doc: "infra", tests: "infra", test: "infra", ci: "infra",
  refactor: "infra", perf: "infra", chore: "infra", build: "infra", deps: "infra",
  mobile: "ui", ux: "ui", visual: "ui", art: "ui",
  combat: "mechanics", engine: "mechanics", rules: "mechanics",
  world: "content", story: "content", narrative: "content", npcs: "content",
  tuning: "balance", cards: "balance",
};

/**
 * Resolve a bracketed heading's category to one of the five.
 * A comma list (`[mechanics,mobile]`) resolves on its first known member.
 */
export function normaliseCategory(raw) {
  const parts = String(raw || "").toLowerCase().split(/[,/|+]/).map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (CATEGORIES.includes(part)) return part;
    if (CATEGORY_ALIASES[part]) return CATEGORY_ALIASES[part];
  }
  return parts.length ? "infra" : null;
}

/**
 * The evidence kinds `**Evidence:**` may name, and the capture files each
 * resolves to under `devlog/assets/<date>/`. The pipeline scripts write these
 * names; the builders read them. Keeping the map here means a new kind is one
 * edit, not four.
 */
export const EVIDENCE_KINDS = {
  // A card plate, drawn as the game draws it (scripts/devlog-catalog-shots.mjs).
  card: { prefix: "card", ext: "svg", shape: "card", noun: "card" },
  // An enemy plate, same plumbing as the card plate.
  foe: { prefix: "foe", ext: "svg", shape: "card", noun: "foe" },
  // A world/arena plate: the engraving itself changed (devlog-plate-shots.mjs).
  plate: { prefix: "plate", ext: "webp", shape: "wide", noun: "plate" },
  // An affliction's rules text: a text pair, not an image (DESIGN.md §7).
  rule: { prefix: "rule", ext: "json", shape: "text", noun: "affliction" },
};

// ---------------------------------------------------------------------------
// Escaping / inline Markdown. Re-exported from the private shell so there is
// still exactly one implementation of each.
// ---------------------------------------------------------------------------
export { escapeHtml, slug, inline } from "./devlog-shell.mjs";
import { escapeHtml, slug, inline } from "./devlog-shell.mjs";

// ---------------------------------------------------------------------------
// Status is colour + text, never colour alone (format contract): tag known
// outcome words with a coloured dot while keeping the word. Applied to table
// cells only, where the pulse/queue outcomes live.
// ---------------------------------------------------------------------------
const STATUS = [
  { re: /\b(shipped|landed|merged|done|pass(?:ed)?|green|clean)\b/gi, cls: "ok" },
  { re: /\b(no-?op|quiet|skip(?:ped)?|idle|none)\b/gi, cls: "neutral" },
  { re: /\b(blocked|needs[- ]user|waiting|pending)\b/gi, cls: "warn" },
  { re: /\b(crashed|failed|failure|error|broke(?:n)?|red)\b/gi, cls: "bad" },
];

export function statusize(html) {
  // Skip cells that contain markup (links/code) to avoid matching inside tags.
  if (/[<]/.test(html)) return html;
  for (const { re, cls } of STATUS) {
    html = html.replace(re, (m) => `<span class="st st-${cls}">${m}</span>`);
  }
  return html;
}

// ---------------------------------------------------------------------------
// Diff rendering — a fenced ```diff block becomes a coloured +/- view.
// Publish prompt §3.7: engine behaviour with no picture keeps the rendered
// diff as its evidence. Do not manufacture an image where a diff is honest.
// ---------------------------------------------------------------------------
export function renderDiff(text) {
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
// Block Markdown → HTML (card bodies and panels). Emits class names only —
// each site styles them its own way, so the same body renders in the private
// index's sans-serif chrome and the public site's woodcut chrome unchanged.
// ---------------------------------------------------------------------------
function isTableSep(line) {
  return /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes("-");
}

function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

export function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }

    // Fenced code — ```diff gets the coloured diff view, everything else <pre>.
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
/**
 * @param {string} md the entry's Markdown source
 * @returns {{headline: string, sections: Array<
 *   {kind:'card', category:string, title:string, bodyLines:string[]} |
 *   {kind:'panel', title:string, bodyLines:string[]}>}}
 */
export function parseEntry(md) {
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
      const cat = title.match(/^\[([a-z0-9,\-/|+\s]+)\]\s*(.*)$/i);
      const category = cat ? normaliseCategory(cat[1]) : null;
      if (category) {
        cur = { kind: "card", category, title: cat[2].trim() || cat[1], bodyLines: [] };
      } else {
        cur = { kind: "panel", title, bodyLines: [] };
      }
      continue;
    }
    if (!cur) {
      // Preamble: the blockquote is the headline, and it RUNS ON. Entries
      // hand-wrap it over as many lines as the day needs, so reading only the
      // first line truncates the day's summary mid-sentence — which is what
      // both sites did until 2026-09-20.
      const q = line.match(/^>\s?(.*)$/);
      if (q) {
        const text = q[1].trim();
        if (text) headline = headline ? `${headline} ${text}` : text;
      }
      continue;
    }
    cur.bodyLines.push(line);
  }
  push();

  return { headline, sections };
}

/**
 * Pull the labelled fields out of a work-item card body.
 *
 * Returns the fields plus the remaining free-form body Markdown, so an author
 * can still write prose, a table, or a ```diff block under the fields.
 *
 * @returns {{fields: {what:string, why:string, commits:string[],
 *   shots:{screen:string,caption:string}[],
 *   evidence:{kind:string,id:string,caption:string}[],
 *   noCapture:string}, body:string}}
 */
export function extractFields(bodyLines) {
  const fields = { what: "", why: "", commits: [], shots: [], evidence: [], noCapture: "" };
  const rest = [];
  // "screen — caption" / "screen - caption": split on the first em- or en-dash.
  const splitCaption = (s) => {
    const [head, ...tail] = String(s).split(/\s+—\s+|\s+-\s+/);
    return { head: (head || "").trim(), caption: tail.join(" — ").trim() };
  };

  // A field's value RUNS ON. Entries are hand-wrapped prose, so a What or a
  // Why is routinely three or four wrapped lines; reading only the first line
  // truncates it mid-sentence and dumps the remainder into the free-form body.
  // The value therefore continues until a blank line, the next `**Field:**`,
  // a fence, a heading or a list — the same boundaries a reader sees.
  const FIELD_RE = /^\*\*(What|Why|Commits?|Shot|Evidence|No capture):\*\*\s*(.*)$/i;
  const isBoundary = (line) =>
    line.trim() === "" || FIELD_RE.test(line) || /^```/.test(line.trim())
    || /^#{1,6}\s+/.test(line) || /^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)
    || /^\|/.test(line.trim());

  for (let i = 0; i < bodyLines.length; i++) {
    const match = bodyLines[i].match(FIELD_RE);
    if (!match) { rest.push(bodyLines[i]); continue; }

    const parts = [match[2].trim()];
    while (i + 1 < bodyLines.length && !isBoundary(bodyLines[i + 1])) {
      parts.push(bodyLines[i + 1].trim());
      i++;
    }
    const value = parts.filter(Boolean).join(" ").trim();
    const label = match[1].toLowerCase();

    if (label === "what") { fields.what = value; continue; }
    if (label === "why") { fields.why = value; continue; }
    if (label.startsWith("commit")) {
      fields.commits = value.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
      continue;
    }
    if (label === "shot") {
      const { head, caption } = splitCaption(value);
      fields.shots.push({ screen: head, caption });
      continue;
    }
    if (label === "evidence") {
      const { head, caption } = splitCaption(value);
      // "<kind> <id>" — an unknown kind is dropped rather than half-rendered.
      const [kind, ...idParts] = head.split(/\s+/);
      const id = idParts.join(" ").trim();
      if (EVIDENCE_KINDS[kind] && id) fields.evidence.push({ kind, id, caption });
      continue;
    }
    if (label === "no capture") fields.noCapture = value;
  }

  return { fields, body: rest.join("\n").trim() };
}

/**
 * Count the work-item cards per category for one parsed entry.
 * The public index's chips ("UI x2", "CONTENT x3") are derived from this —
 * DESIGN.md §10 residue item 5: derivable from the parsed entry, never authored.
 */
export function categoryCounts(sections) {
  const counts = {};
  for (const s of sections) {
    if (s.kind !== "card") continue;
    counts[s.category] = (counts[s.category] || 0) + 1;
  }
  return counts;
}
