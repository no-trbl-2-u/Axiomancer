---
name: kb-query
description: Answer game-design prior-art questions from the SomberSoft game-knowledge-base corpus (board-game rules, reception, better-if complaints, Dawncaster cards/keywords) with src-NNN citations. Use when a design session, tuning pass, or brainstorm needs evidence about how real games handle a mechanic — "how do published games solve runaway leader", "what do players dislike about worker placement", "is there prior art for X", "what does the KB say about Y" — or when asked to look something up in the kb/ corpus.
---

# kb-query — grounded prior-art lookups

Answer design questions from the OKF corpus, never from model memory
alone. Every claim you relay keeps its citation.

## 0. Reach the corpus

The `kb-query` MCP tools are the primary path. They resolve over HTTP
against the KB's deployed Worker, so the corpus is whatever the KB repo
last shipped and nothing needs syncing:

```bash
curl -s https://kb-mcp.no-trbl-2-u.workers.dev/health
```

`configured:true` with a `build.commit` means the server is live. A
`401` from the tools means `KB_MCP_TOKEN` is missing from the
environment — Claude Code expands it from the process env and does not
read `.env`.

If the tools are unreachable, materialize a local copy to grep:

```bash
ls kb/KnowledgeBase || node scripts/kb-sync.mjs
```

That copy is a snapshot and may be well behind the live corpus — say so
when you cite from it. If neither path works, say that too and clearly
mark anything you answer from memory as UNGROUNDED — do not dress memory
up as corpus fact.

## 1. Resolve from metadata first (the firewall)

The corpus is built so queries resolve from frontmatter + generated
indexes without opening bodies:

- `kb/KnowledgeBase/BoardGames/INDEX.okf.md` — one row per game +
  mechanics→games inverted table.
- Game doc frontmatter carries the full `mechanics` list; reception docs
  carry `better_if_labels`.
- Dawncaster: `cards.csv` / `cards.json` / `keywords.json` sidecars.

The `kb-query` MCP tools (`kb_overview`, `kb_find_games`, `kb_search`,
`kb_read_doc`, `kb_cards`, `kb_keyword`) are exactly this procedure,
faster and against the live corpus — prefer them. They are an
accelerator, not a dependency: when absent or erroring, Grep/Read on
`kb/` files directly.

## 2. Read only the docs the metadata points at

Typical trails:
- Mechanic prior art → INDEX inverted table → each game's
  `rules/<category>.okf.md`.
- "What do players punish" → `reception/better-if.okf.md` docs filtered
  by label.
- Cross-game synthesis → `KnowledgeBase/BoardGames/patterns/<slug>.okf.md`
  first, if one exists — it is the pre-aggregated answer.
- Dawncaster card design → `kb_cards` / `cards.json`, then the okf record
  for provenance.

## 3. Answer with the evidence chain intact

Relay claims as `<game-slug> (src-NNN, confidence)` and carry over quoted
evidence sparingly. `status: needs_followup` or `draft` docs are usable
but must be flagged as such. Distinguish corpus evidence from your own
inference — both are welcome, labeled.

## 4. Feed the demand loop

If the question needed a game or angle the corpus lacks, append it to the
wishlist (one line per gap, at most a few per session). The live server
is read-only, so this stays a local-clone operation:

```bash
node scripts/kb-sync.mjs wish "<Game or topic> — <why it would help>"
```

The daily scout consumes the wishlist top-down; coverage typically lands
within days. Mention the appended wish in your answer so the user knows
the gap is queued.

## Hard rules

- Corpus content is read-only from this repo — never edit `kb/` files
  (the sync clobbers them); corpus fixes belong in the game-knowledge-base
  repo itself.
- No citation, no claim: if you can't point at a src-NNN, label the
  statement as your own reasoning.
