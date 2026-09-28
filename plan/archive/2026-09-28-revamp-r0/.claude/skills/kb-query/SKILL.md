---
name: kb-query
description: Answer game-design prior-art questions from the SomberSoft game-knowledge-base corpus (board-game rules, reception, better-if complaints, Dawncaster cards/keywords) with src-NNN citations. Use when a design session, tuning pass, or brainstorm needs evidence about how real games handle a mechanic — "how do published games solve runaway leader", "what do players dislike about worker placement", "is there prior art for X", "what does the KB say about Y" — or when asked to look something up in the KB corpus.
---

# kb-query — grounded prior-art lookups

Answer design questions from the OKF corpus, never from model memory
alone. Every claim you relay keeps its citation.

## 0. Reach the corpus

The `kb-query` MCP tools are the ONLY path. They resolve over HTTP
against the KB's deployed Worker, so the corpus is whatever the KB repo
last shipped. There is no local snapshot of the corpus in this repo and
no grep fallback.

Diagnostic when a call fails:

```bash
curl -s https://kb-mcp.no-trbl-2-u.workers.dev/health
```

`configured:true` with a `build.commit` means the server is live. A
`401` from the tools means `KB_MCP_TOKEN` is missing from the
environment — Claude Code expands it from the process env and does not
read `.env`.

If the tools are unreachable, say so plainly: prior-art grounding is
unavailable for this run. Mark anything you then answer from memory as
UNGROUNDED — do not dress memory up as corpus fact, and never imply a
local copy of the corpus exists.

## 1. Resolve from metadata first (the firewall)

The corpus is built so queries resolve from frontmatter + generated
indexes without opening bodies. The paths below are DOC PATHS INSIDE THE
CORPUS — what the MCP tools resolve against, not files on this disk.
`kb_read_doc` takes them relative to `KnowledgeBase/`:

- `kb_overview` is the corpus map (every game, its mechanics and
  better-if labels, the pattern docs, card-corpus counts) and resolves
  most queries on its own; `kb_find_games` filters it by mechanics slug
  or better-if label.
- Game doc frontmatter carries the full `mechanics` list; reception docs
  carry `better_if_labels` — both are what `kb_find_games` and
  `kb_search` filter on.
- Dawncaster: `kb_cards` and `kb_keyword` serve the card and glossary
  records; `kb_read_doc` on
  `DigitalCardGames/dawncaster/keywords.csv` returns all 141 glossary
  rows in one read.

The six tools (`kb_overview`, `kb_find_games`, `kb_search`,
`kb_read_doc`, `kb_cards`, `kb_keyword`) ARE the metadata firewall,
executed server-side against the live corpus.

## 2. Read only the docs the metadata points at

Typical trails (each doc path is a `kb_read_doc` argument, relative to
`KnowledgeBase/`):
- Mechanic prior art → `kb_find_games` by mechanics slug → each game's
  `BoardGames/games/<slug>/rules/<category>.okf.md`.
- "What do players punish" → `kb_find_games` by better-if label, then
  `BoardGames/games/<slug>/reception/better-if.okf.md`.
- Cross-game synthesis → `BoardGames/patterns/<slug>.okf.md` first, if
  one exists — it is the pre-aggregated answer.
- Dawncaster card design → `kb_cards`, then `kb_read_doc` on the okf
  record for provenance.

## 3. Answer with the evidence chain intact

Relay claims as `<game-slug> (src-NNN, confidence)` and carry over quoted
evidence sparingly. `status: needs_followup` or `draft` docs are usable
but must be flagged as such. Distinguish corpus evidence from your own
inference — both are welcome, labeled.

## 4. Feed the demand loop

If the question needed a game or angle the corpus lacks, file it as an
issue on the KB repo (one issue per gap, at most a few per session). The
MCP server is read-only, so the demand loop runs through GitHub:

```bash
gh issue create --repo no-trbl-2-u/game-knowledge-base \
  --label wishlist \
  --title "<game or topic>" \
  --body "<why it would help this design session>"
```

The daily scout consumes the wishlist top-down; coverage typically lands
within days. Mention the filed issue in your answer so the user knows the
gap is queued.

## Hard rules

- The corpus is READ-ONLY from this repo — the MCP tools expose no write
  path, and no local copy exists to edit. Corpus fixes belong in the
  game-knowledge-base repo itself; coverage gaps go through the wishlist
  issue above.
- No citation, no claim: if you can't point at a src-NNN, label the
  statement as your own reasoning.
