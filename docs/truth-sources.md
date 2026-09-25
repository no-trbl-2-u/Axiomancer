# Truth sources — full protocols

> Condensed table + when-to-reach-for-what lives in root `AGENTS.md`
> § "Truth sources". This file carries the complete protocols moved
> out of the always-loaded guide (2026-07-16). The complete
> external-system register (ownership, credentials, recovery) is
> [`external-architecture.md`](./external-architecture.md).

## Source-of-truth hierarchy — decision authority

The one copy of the Nexus hierarchy for the whole monorepo (merged here
2026-09-25, trim T5, from the per-package `docs/source-of-truth-hierarchy.md`
files and the `docs/adr/README.md` lists; every other place points here).
It governs state reconciliation for autonomous workers in every package:
when two layers contradict each other, stop and surface the drift rather
than execute stale information.

1. **T's latest explicit decision** — highest authority.
2. **CDRs / ADRs** (`~/Workspace/decisions/`, each package's `docs/adr/`) —
   durable decision records.
3. **Central SomberSoft ledger** (`~/Workspace/SOMBERSOFT_COMMAND_LEDGER.md`) —
   company-wide doctrine and operating law.
4. **Active build plan** (`plan/steps/01_build_plan.md`) — current execution
   queue and shipped phase ledger.
5. **Phase candidates** (`plan/PHASE_CANDIDATES.md`) — promotable work, not
   marching authority until accepted.
6. **Critique/audit logs** (`plan/CRITIQUE.md`, `plan/AUDIT.md`) — findings
   queues and evidence of known rot.
7. **Historical reports** (`plan/archive/`, `docs/reports/`, dated devlog
   entries) — archived evidence, subordinate to current law.

If a lower layer contradicts a higher one, a worker must:

1. **Stop execution** — do not proceed with stale information.
2. **Surface the drift** — report the specific contradiction and the files
   involved.
3. **Request reconciliation** — surface to T and reconcile before resuming.

Examples:

- A phase row says a feature is pending, but an ADR or build-plan row says it
  shipped → stop and reconcile.
- A candidate proposes a rule that conflicts with a CDR/ADR → stop; the
  decision record wins until amended.
- A critique finding references shipped work as still open → surface it as
  drift and drain or annotate the row.
- A historical report contradicts the central ledger or an ADR → treat the
  report as stale evidence, not marching law.

Phase shipping drains or annotates matching critique/audit/candidate rows.
CDRs/ADRs are not optional commentary; they sit above the central ledger in
repo execution disputes.

## Game knowledge base — external prior art

`no-trbl-2-u/game-knowledge-base` is the OKF corpus of board-game rules
and reception research (source-backed claims, per-claim confidence). It
deploys itself as a live MCP server, which is the only way this repo
reads it — there is no local snapshot of the corpus here. Consumers: the
`brainstorm-mechanics`, `world-spec`, and `story-spec` skills and the
`mechanics-expert` and `card-expert` agents pull it for prior art and
cite `kb:<game-slug>/<doc> (src-NNN)` instead of citing reception from
memory (`card-expert` leans on the `DigitalCardGames/dawncaster`
corpus — 1,692 card records, 141 keywords; `world-spec` and
`story-spec` lean on the board-game mechanics/better-if taxonomy for
region-hazard and campaign/unlock-structure shapes respectively —
`character-spec` is deliberately not a consumer, since personhood/voice
has no board-game-mechanic analog in the corpus). The server is
read-only, so coverage misses are filed as GitHub issues on the KB repo:
`gh issue create --repo no-trbl-2-u/game-knowledge-base --label wishlist
--title "<game or topic>" --body "<why it would help>"`. The KB's daily
scout consumes that wishlist label.

One consumption surface, metadata-first (see the `kb-query` design skill
in `.claude/skills/kb-query/`):

- **MCP (only)**: `kb-query` resolves over HTTP against the Worker
  the KB repo deploys (`.mcp.json` → `kb-mcp.no-trbl-2-u.workers.dev`),
  exposing `kb_overview` / `kb_find_games` / `kb_search` /
  `kb_read_doc` / `kb_cards` / `kb_keyword`. No sync involved: the
  corpus is whatever that repo last shipped. Auth is
  `Bearer ${KB_MCP_TOKEN}` out of the process environment — Claude Code
  does not read `.env` — and the server is fail-closed, so a missing
  token means `401` on every call rather than a silent stale answer.
  There is no second surface: if the Worker is unreachable, prior-art
  grounding is unavailable for that run, and anything answered from
  model memory is labeled UNGROUNDED rather than passed off as corpus
  fact.

The `mechanics-expert` and `card-expert` sub-agents carry the MCP tools
in their frontmatter and prefer them. Cloud ticks now grant the `kb_*`
tools too (`.github/workflows/_claude-skill.yml`, 2026-08-31), passing
`KB_MCP_TOKEN` through as step env — unattended runs cite receipts
instead of memory. A preflight step probes the endpoint and warns
without failing: a dead or rotated KB must not sink an unrelated tick.

## Live engine data (`axio-query`) — the repo's own facts

The engine's OWN generated truth (card/effect/keyword facts) is
queryable the same way the external KB corpus is, via the sibling
`axio-query` stdio server (`scripts/axio-mcp-server.mjs`, registered in
`.mcp.json`): `axio_cards` / `axio_effects` / `axio_keywords` /
`axio_overview`. It reads `devlog/data/{cards,enemies,effects}.json`
(regenerating via `npm run catalog:export` when stale) and
`axiomancer-mechanics/docs/keyword-atlas.md` — always exactly as
current as the working tree, never hand-written prose. Unlike
`kb-query`, this one is a true accelerator-never-dependency: it reads
files that live in this repo, so when the tools are absent you Grep/Read
the libraries directly (`src/Cards/cards.library.ts`,
`src/Effects/effects.library.ts`) and lose nothing but speed.

`axio-query` vs `kb-query`: ours is the repo's own card/effect/keyword
facts (never stale, and never a dependency — the source files are right
here); `kb-query` is the genre's external prior art (community sourced,
cite with `src-NNN` receipts) and has NO local fallback — the Worker is
the corpus's only route into this repo. The `card-expert` and
`mechanics-expert` sub-agents carry both tool sets.

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
   reading it into card/deck changes stays with `/adjust-cards`, and
   engine constants stay manual.
