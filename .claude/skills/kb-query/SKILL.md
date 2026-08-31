---
name: kb-query
description: Answer game-design prior-art questions from the SomberSoft game-knowledge-base corpus (board-game rules, reception, better-if complaints, Dawncaster cards/keywords) with src-NNN citations. Use when a design session, tuning pass, or brainstorm needs evidence about how real games handle a mechanic — "how do published games solve runaway leader", "what do players dislike about worker placement", "is there prior art for X", "what does the KB say about Y" — or when asked to look something up in the kb/ corpus.
---

# kb-query — grounded prior-art lookups

Answer design questions from the synced OKF corpus in `kb/`, never from
model memory alone. Every claim you relay keeps its citation.

## 0. Ensure the corpus is reachable

If the `mcp__kb-query__*` tools are available they are already reachable
in EVERY environment: the launcher (`scripts/kb-mcp-launcher.mjs`) serves
a synced `kb/` clone when one exists and otherwise bridges to the hosted
kb-live endpoint (corpus at KB HEAD, authenticated with your GH_TOKEN).
For the direct grep/read path, materialize the clone first:

```bash
ls kb/KnowledgeBase || node scripts/kb-sync.mjs
```

If both the tools and sync fail (offline), say so and clearly mark
anything you answer from memory as UNGROUNDED — do not dress memory up
as corpus fact.

## 1. Resolve from metadata first (the firewall)

The corpus is built so queries resolve from frontmatter + generated
indexes without opening bodies:

- `kb/KnowledgeBase/BoardGames/INDEX.okf.md` — one row per game +
  mechanics→games inverted table.
- Game doc frontmatter carries the full `mechanics` list; reception docs
  carry `better_if_labels`.
- Dawncaster: `cards.csv` / `cards.json` / `keywords.json` sidecars.

If the `kb-query` MCP tools are available (`kb_overview`,
`kb_find_games`, `kb_search`, `kb_read_doc`, `kb_cards`, `kb_keyword`),
prefer them — they are exactly this procedure, faster. They are an
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
wishlist (one line per gap, at most a few per session):

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
