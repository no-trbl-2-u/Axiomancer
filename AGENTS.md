# Miserere Mei, Deus monorepo — agent guide

<!-- lexicon-ok: pressure-tracks -->

**Miserere Mei, Deus** is a turn-based, single-player dark fantasy
deckbuilding RPG campaign for mobile: a deterministic TypeScript
rules engine where what the player owes, and to whom, is a mechanical
input, not flavor. Combat may use direct damage, statuses, Conviction,
Surge, and Dice without requiring status dominance; morally charged
choices carry lasting world consequences. Full product spec: `spec.md`.

**Reading order:** loop/plan work → `plan/bearings.md` first; package
work → that package's `AGENTS.md`; design/balance/content work →
`axiomancer-mechanics/VISION.md` + `spec.md`.

npm-workspaces monorepo. Three packages, flat at the root:

| Package | Role |
|---|---|
| `axiomancer-mechanics` | TypeScript game engine + CLI. Owns rules, state transitions, deterministic RNG, content libraries, balance/tuning, hermetic engine tests. |
| `axiomancer-mobile` | Expo / React Native app. Consumes mechanics as **local source** via the `@mechanics` alias (`→ ../axiomancer-mechanics/src`). Owns screens, navigation, theming, presenters. |
| `axiomancer-card-editor` | Local dev tool. Reads/writes mechanics' `src/Cards/cards.library.ts` in place via the `@mechanics` alias. |

## Hard rules

- The pre-monorepo per-package **nexus** harness (old loop verbs + accumulated
  `plan/` memory + nexus CI) formerly lived in `/archive`. It was mined for its
  durable findings and **removed at the 2026-07-03 re-onboard**; its live
  successor is the unified root harness (see "Nexus — the autonomous loop"
  below). Do not resurrect its stale pre-monorepo assumptions (npm-publish /
  engine-pin model, Pressure Tracks) from git history.
- Mobile and card-editor consume mechanics via `@mechanics` — a mechanics
  rename/removal can break them. When changing mechanics' public surface, verify
  the dependent package.
- Rules/state/RNG belong in `axiomancer-mechanics`, never duplicated in mobile
  presenters.
- **Asking the user questions.** In attended sessions, every question
  to the user goes through the `AskUserQuestion` tool — never bare
  prose — shaped per [`docs/asking-well.md`](docs/asking-well.md)
  (the canonical question-writing doctrine; `skills/oversight.md` §5
  is its worked example). The six rules in short: 1-4 questions per
  batch; recommended option first and marked; descriptions name the
  trade-off; lead with prose; every question states its defer path;
  answers are policy — file them durably and never re-ask. Autonomous
  loop skills never ask at all — `AskUserQuestion` is reserved for
  `/oversight` there (standing rule 6 below); they decide, document
  the call, and log genuine user decisions as `[needs-user-call]`.

### Cross-package impact checklist

Any diff touching one of these mechanics paths can break `axiomancer-mobile`
(consumed via `@mechanics` as local source, not a published package) and must
be verified against it before a PR lands:

- `src/Combat/**`
- `src/Cards/**`
- `src/Effects/**`
- `src/Enemy/**` (mobile renders `portraitAsset` in the event + combat
  presenters and imports `EnemiesByMap`)
- `src/NPCs/**` (dialogue trees drive mobile's dialogue route)
- `src/World/**` — ALL of it, including `MapEvents/`, `Continents/`
  (mobile's `layout-engine-parity` test breaks on any engine map-node
  change), `Labyrinth/`, `Blacksmith/`, `RestChoice/` (the successor of
  the retired `Rest/`), and the world core modules (`map.registry.ts`,
  `map.library.ts`, `encounter.ts`, `quest.*.ts`, `dialogue.runtime.ts`)
- `src/index.ts`

If a diff matches any of the above, run
`npm run verify -w axiomancer-mobile` and block the PR on failure.

`axiomancer-card-editor` couples to a subset of the same paths
(`src/Cards/**`, `src/Effects/**`, `src/Combat/**`, `src/index.ts` — it
imports the card/effect libraries, their type unions, and the combat card
projections). A diff touching any of those must ALSO run
`npm run type-check -w axiomancer-card-editor` and block on failure.
Witness: edba726 shipped mechanics + mobile green but broke the
editor's `SpecialMechanicKind` union, leaving `verify-card-editor` red
on `main` for half a day.

This checklist is also mechanized in CI: the owning job in
`.github/workflows/verify-mechanics.yml` diffs the pushed range against
the impact paths above and runs the mobile verify / editor type-check
in the same installed environment. Browser evidence is routed by subsystem:
Combat/Cards/Effects → Combat; Enemy → Combat + Encounter; Hazard →
Hazard; every other `World/**` path and
`NPCs/**` → Encounter routing. Shared, lockfile, workflow,
classifier, or unknown-history changes fail closed to every journey. Run the
consumer gates locally anyway — CI catching a break means it already reached
`main`.

The
mechanics-only tuning command (`combat-playtest`) carries a closing step
that references this checklist rather than re-deriving it — update it here
first if the mechanics subsystem list changes. `rest-tuning` was
retired in Phase 52e, `quest-board-tuning` in Phase 61,
`gathering-tuning` in Phase 76, and `loot-cache-tuning` in Phase 63,
each along with the minigame it tuned. `deck-tuning`, `hazard-tuning`,
`world-tuning`, `combat-ux-tuning`, `critic-loop`, `deep-playtest`,
`hermes-playtest` and `dep-upgrades` were retired in trim T5 (2026-09-25,
decision D10) with zero invocations in six weeks; they are to be rebuilt
once the mechanics settle (after the D4 stat hooks and the card rework).
The playtest matrix stays as `npm run combat-playtest -w axiomancer-mechanics`.

## Root `.claude/`

Live, at the repo root:
- `.claude/commands/` — domain **slash commands**: mechanics
  `combat-playtest` (the stage matrix plus `playtester` agents). Each is
  self-contained and carries a header naming the package it runs against (paths
  are package-relative — `cd` there or use `-w`). `combat-tuning`,
  `legacy-combat-tuning`, `playtest`, `resolve-playtest`, and `bump-engine`
  (npm-pin-era engine bumps, retired with the monorepo merge) were trimmed,
  and the eight tuning/playtest commands above went in trim T5 (D10).
- `.claude/skills/` — design skills: `brainstorm-mechanics`, `character-spec`,
  `story-spec`, `world-spec`; plus the `kb-query` lookup skill.
- `.claude/agents/` — `scout`, `reader`, `mechanics-expert`, `playtester`,
  `card-expert` (card/keyword design AND implementation — the working
  agent behind `/adjust-cards` and `/adjust-keywords`; grounded in the Dawncaster corpus — see
  "Truth sources" below), `content-curator` (narrative
  writer-shipper — dialogue trees, event prose, flavor — `/iterate`'s
  content-gap worker).

Commands write their reports to `<package>/docs/reports/` (created on
demand). Each domain command is self-contained — it does not read
`plan/` loop state (the loop verbs in root `skills/` do; see "Nexus"
below).

## Truth sources

Three kinds of truth answer game questions. For any non-deterministic
question or open-ended task, reach for the two MCP servers below —
any agent may use them, not just the design sub-agents. `axio-query`
is an accelerator, never a dependency — it reads this repo's own files,
so the Grep/Read path always works. `kb-query` is the ONLY route to the
external corpus: if it is down, prior-art grounding is unavailable that
run and any claim from memory is marked UNGROUNDED.

| Source | Answers | Freshness |
|---|---|---|
| **`axio-query` MCP** (`axio_overview` / `axio_cards` / `axio_effects` / `axio_keywords`) | The engine's OWN card/enemy/effect/keyword facts, generated from the live libraries | As current as the working tree — never stale |
| **`kb-query` MCP** (`kb_overview` / `kb_find_games` / `kb_search` / `kb_read_doc` / `kb_cards` / `kb_keyword`) | External prior art: board-game rules + reception, Dawncaster corpus (1,692 cards / 141 keywords) — cite `kb:<game-slug>/<doc> (src-NNN)` | Live — served over HTTP by the KB's deployed Worker, current as of that repo's last deploy |
| **Measured baselines** (`deck-matrix-baseline.json`) | Win-rate curves, status engagement, preset spreads | Only as fresh as the last sim — run `npm run baseline:check` and NAME the stamp before citing numbers |

Measuring is not tuning: regenerating a baseline is briefing; acting
on it belongs to `/adjust-cards` (cards and decks). Engine constants are open to the
tuning loops with measured evidence (THE OPEN GATE ¶4, 2026-08-28).
Full protocols (consumption surfaces, wishlist, regen/confidence
rules): [`docs/truth-sources.md`](docs/truth-sources.md). The complete
external-system register (ownership, credentials, recovery):
[`docs/external-architecture.md`](docs/external-architecture.md) —
update it whenever the product gains a hosted service, sibling repo,
MCP server, or external datastore.

## Pull requests

(Applies repo-wide — the tuning/report skills deliver via PR; the loop
verbs push to `main` directly.) Open PRs ready for review, not drafts.
Enable auto-merge (repository default merge method) so they land once
CI passes: in CI use `mcp__github__enable_pr_auto_merge`; in a local
session use `gh pr merge <number> --auto`. If the call reports
auto-merge disabled for the repo, surface that to the user rather than
silently skipping.

## Per-package guides

Each package keeps its own `AGENTS.md` / `CLAUDE.md` with domain specifics
(engine doctrine, mobile presenter boundaries). Read the relevant one before
working in a package.

## Testing at a known state

`docs/state-fixtures.md` — one declarative **state fixture** (preset, map,
node, flags, seed) boots the mechanics CLI (`--fixture <id>`), seeds a Jest
store, and deep-links the web build (`?fixture=<id>` /
`__AXM_FIXTURE__`). Registry: `axiomancer-mechanics/src/Game/fixtures`.

## Verify

- `npm run verify --workspace axiomancer-mechanics` — type-check + lint + tests + build
- `npm run verify --workspace axiomancer-mobile` — lint + typecheck + jest +
  asset-provenance / art / critique-drive tests
- `npm run verify --workspace axiomancer-card-editor` — type-check (incl. the
  `mechanics.contract.ts` drift assertions) + lint + tests + build
  (`type-check` alone remains the fast cross-package gate)
- **Fresh `.claude/worktrees/*` checkouts**: run `npm install` at the
  worktree root before verifying. A worktree has no per-workspace
  `node_modules`, so `tsc` resolves the hoisted root TypeScript instead
  of a package's pinned version (mismatched `module`/`moduleResolution`
  options between them can fail with e.g. `TS5095`) — installing first
  avoids the detour.

## Nexus — the autonomous loop (live)

The unified **nexus** harness was re-onboarded onto the monorepo on
2026-07-03 (`chore: adopt nexus methodology`). It is now live at the repo root:

- `skills/` — the loop verbs: `ship-a-phase`, `plan-a-phase`, `iterate`,
  `critique`, `triage`, `expand`, `forge` (the content foundry — ships
  new maps/continents/events/art every growth tick; THE OPEN GATE
  ¶8's world/spatial engine), the `adjust-*` family (`adjust-cards`,
  `adjust-equipment`, `adjust-enemies`, `adjust-keywords`,
  `adjust-npcs` — per-item content lifecycle stewards, split out of
  forge 2026-09-02: each audits its surface on a rate-limited cadence
  and creates/updates/retires whatever the audit finds, with a
  mandatory `kb-query` research run before any create/update is
  written), `march`, `oversight`, `jot`, `digest`, `consolidate`.
  (Heavyweight source-of-truth files; the `.claude/commands/<verb>.md`
  pointers are the doorways.)
- `plan/` — the loop's durable memory: `bearings.md` (standing context —
  **read this first**), `steps/01_build_plan.md` (the phase queue),
  `AUDIT.md` + `CRITIQUE.md` (the drain queues), `PHASE_CANDIDATES.md`,
  `CONTENT_LEDGER.md` (per-category `adjust-*` last-pass metadata),
  `reflexes.md`, `lessons.md`, `phases/` (open + recent briefs), and
  `archive/` (rotated history, verbatim).
- `scripts/` — `deploy-check.mjs` (CI-green deploy gate),
  `notify.mjs` (pager), `loop-issue.mjs` (GitHub issue mirror).
- `spec.md` — the product spec the loop builds against.

Two gates wrap every shipping tick: the **verify gate**
(`npm run verify`, per-workspace, pre-commit) and the **deploy gate**
(`npm run deploy:check` = GitHub Actions CI-green, post-push). The loop
pushes to **`main`** directly. Start at intervention level 0
(`/ship-a-phase` by hand); ratchet up via `/march` then `/loop /march`.
Full context lives in `plan/bearings.md` and the nexus kit
(`../nexus/`).

**GitHub Actions layer.** Every zero-input skill/command also runs in CI
via `.github/workflows/` (scheduled `/march` ticks, nightly `/digest`,
weekly tuning loops, `/fix-ci` on red main, `@claude` mentions, auto PR
review). See `.github/workflows/README.md` for the full map, cadences,
and required secrets (`CLAUDE_CODE_OAUTH_TOKEN`, recommended `GH_PAT`).

**Enforcement layer (always on).** `.claude/settings.json` is committed
and active in every session, attended or not: permission allowlist (so
unattended `/loop` ticks never stall on a prompt), deny walls for
force-push / `--no-verify` / destructive resets / `.env` reads, and the
`.claude/hooks/guard.mjs` hooks that block forbidden commands at the
harness and warn on unclean turn-ends. Personal overrides go in
`.claude/settings.local.json` (gitignored), never in the shared file.
Self-test the guard any time with
`node .claude/hooks/guard.mjs self-test`.

Distinct from the domain **design** skills in `.claude/skills/`
(brainstorm/character/story/world-spec) and the domain tuning/playtest
commands in `.claude/commands/` — the loop verbs are a separate layer.
Do not merge the two.

## Nexus standing rules (canonical)

These apply to every loop skill and session. `plan/bearings.md` echoes
them; update here first.

1. **Commit and push as a single atomic act** to `main`. No unpushed
   commits between ticks; no dirty tree left behind. The session's
   `telemetry/` shard is part of every commit that changes it: the tracked
   `.githooks/pre-commit` auto-stages `telemetry/`, and `.githooks/pre-push`
   blocks if newer rows remain uncommitted. One shard per session, so the
   log never conflicts on merge. Session startup installs the hooks through `core.hooksPath`.
2. **No `Co-Authored-By:` trailers, no emojis** — in commits, code, or
   content.
3. **The verify gate is non-negotiable.** No `--no-verify`, no
   force-push, no destructive resets. Run the gate **foreground**,
   never backgrounded.
4. **Tests alongside code** — hermetic e2e at the highest public entry
   point; never "add tests later".
5. **The deploy gate runs after every push.** A red `verify-*` workflow
   is a blocked tick: read the log, patch, push again (≤3
   same-root-cause iterations, then stop cleanly).
6. **`AskUserQuestion` only in `/oversight`.** Every other skill
   decides, documents the call in the commit body, and ships. Since
   THE OPEN GATE (T direct, 2026-08-28 — see `plan/bearings.md`)
   there are no owner-blocked decisions: the loop answers every open
   question itself and files owner-flavored calls to `plan/AUDIT.md`
   as `[loop-call]` residue for after-the-fact review. The retired
   `[needs-user-call]` tag survives only in historical rows.
7. **File the residue.** Any session or tick tasked with substantial
   work that produces direction beyond what it ships — decisions made,
   work discovered, design conclusions, side-findings — files that
   residue into the loop's queues before ending: buildable ideas to
   `plan/PHASE_CANDIDATES.md`, findings and `[needs-user-call]`
   decisions to `plan/AUDIT.md`, committed work as build-plan phase
   rows, observable defects to `plan/CRITIQUE.md` (jot-row format).
   Direction that lives only in a conversation is invisible to the
   loop. File only unshipped direction — not routine work the tick
   already committed, and not chit-chat.
