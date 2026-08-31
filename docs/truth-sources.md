# Truth sources — full protocols

> Condensed table + when-to-reach-for-what lives in root `AGENTS.md`
> § "Truth sources". This file carries the complete protocols moved
> out of the always-loaded guide (2026-07-16). The complete
> external-system register (ownership, credentials, recovery) is
> [`external-architecture.md`](./external-architecture.md).

## Game knowledge base (`kb/`) — external prior art

`no-trbl-2-u/game-knowledge-base` is the OKF corpus of board-game rules
and reception research (source-backed claims, per-claim confidence).
`node scripts/kb-sync.mjs` shallow-clones/refreshes it into `kb/`
(gitignored — never committed here). Consumers: the
`brainstorm-mechanics` skill and the `mechanics-expert` and
`card-expert` agents grep it for prior art and cite
`kb:<game-slug>/<doc> (src-NNN)` instead of citing reception from
memory (`card-expert` leans on the `DigitalCardGames/dawncaster`
corpus — 1,692 card records, 141 keywords). Coverage misses are filed
with `node scripts/kb-sync.mjs wish "..."` — the KB's daily scout
consumes that wishlist.

Two consumption surfaces (both grep-first; see the `kb-query` design
skill in `.claude/skills/kb-query/`):

- **Direct**: Grep/Read `kb/` frontmatter + generated indexes (the
  metadata firewall), then only the docs they point at.
- **MCP**: the `kb-query` server (`.mcp.json` →
  `scripts/kb-query-launcher.mjs`, spawned per session) exposes
  `kb_overview` / `kb_find_games` / `kb_search` / `kb_read_doc` /
  `kb_cards` / `kb_keyword`. The committed launcher always starts and
  picks its backend: the hosted corpus snapshot when `KB_MCP_URL` is
  configured (`kb-mcp-host/` on Vercel — `kb_overview` names the
  snapshot's commit), the synced `kb/` stdio server otherwise, and
  recovery guidance when neither exists. Still an accelerator, never a
  dependency — the grep path always works. The `mechanics-expert` and
  `card-expert` sub-agents carry these tools in their frontmatter and
  prefer them when present; CI ticks sync `kb/` when no hosted URL is
  configured (`_claude-skill.yml`).

## Live engine data (`axio-query`) — the repo's own facts

The engine's OWN generated truth (card/effect/keyword facts) is
queryable the same way the external KB corpus is, via the sibling
`axio-query` stdio server (`scripts/axio-mcp-server.mjs`, registered in
`.mcp.json`): `axio_cards` / `axio_effects` / `axio_keywords` /
`axio_overview`. It reads `devlog/data/{cards,enemies,effects}.json`
(regenerating via `npm run catalog:export` when stale) and
`axiomancer-mechanics/docs/keyword-atlas.md` — always exactly as
current as the working tree, never hand-written prose. Same
accelerator-never-dependency posture as `kb-query`: Grep/Read the
libraries directly (`src/Cards/cards.library.ts`,
`src/Effects/effects.library.ts`) when the tools are absent.

`axio-query` vs `kb-query`: ours is the repo's own card/effect/keyword
facts (never stale, never a dependency); `kb-query` is the genre's
external prior art (community sourced, cite with `src-NNN` receipts).
The `card-expert` and `mechanics-expert` sub-agents carry both tool
sets.

## Measured truth (baselines) — freshness discipline

Two kinds of truth answer game questions, and they go stale
differently:

- **Source-derived truth** (what a card does, how it prices, what a
  keyword means) regenerates from the tree — the libraries,
  `axio-query`, and the catalog are as fresh as their last export, and
  the guard tests pin every player-facing surface to the payloads. The
  catalog page carries a stamp (`from engine source <commit>`) so a
  stale render is visible on sight.
- **Measured truth** (win-rate curves, status engagement, preset
  spreads) is only as fresh as the last sim run. The canonical
  measurement is
  `axiomancer-mechanics/docs/reports/baselines/deck-matrix-baseline.json`,
  meta-stamped with the commit it measured.

Rules when citing measured numbers:

1. Run `npm run baseline:check` first (soft alarm: compares the
   baseline's stamp against `axiomancer-mechanics/src` history). CI
   runs the same check as a warning on mechanics pushes; the nightly
   digest re-measures with a reduced pass when stale
   (`npm run baseline:regen -- --runs=30 --confidence=reduced-nightly`).
2. Every balance claim NAMES its baseline stamp ("as of `<commit>`,
   `<date>`"). A claim citing a stale baseline must say the tree has
   moved since — mechanics changes after the stamp make the numbers
   historical, not current.
3. `npm run baseline:regen` (full: runs=60) re-measures and re-stamps.
   A `confidence: reduced-nightly` baseline is directionally honest,
   never confirmation-grade — close calls need the full multi-seed
   pass before anyone acts on them.
4. Measuring is not tuning: regenerating the baseline is briefing;
   reading it into card/deck changes stays with `/deck-tuning`, and
   engine constants stay manual.
