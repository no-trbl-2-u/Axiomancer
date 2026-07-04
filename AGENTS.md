# Axiomancer monorepo — agent guide

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

### Cross-package impact checklist

Any diff touching one of these mechanics paths can break `axiomancer-mobile`
(consumed via `@mechanics` as local source, not a published package) and must
be verified against it before a PR lands:

- `src/Combat/**`
- `src/Cards/**`
- `src/Effects/**`
- `src/Skills/**`
- `src/index.ts`
- `src/World/LootCache/**`
- `src/World/Gathering/**`
- `src/World/Hazard/**`
- `src/World/Rest/**`
- `src/World/QuestBoard/**`

If a diff matches any of the above, run
`npm run verify -w axiomancer-mobile` and block the PR on failure.

`axiomancer-card-editor` couples to a subset of the same paths
(`src/Cards/**`, `src/Effects/**`, `src/Combat/**`, `src/index.ts` — it
imports the card/effect libraries, their type unions, and the combat card
projections). A diff touching any of those must ALSO run
`npm run type-check -w axiomancer-card-editor` and block on failure.
Witness: the `grant_permanent_wild_die` variant added to `Cards/types.ts`
(edba726) shipped with mechanics + mobile green but broke the editor's
`SpecialMechanicKind` union, leaving `verify-card-editor` red on `main`
for half a day until 3c9bbaf.

The
mechanics-only tuning skills (`combat-playtest`, `deck-tuning`,
`hazard-tuning`, `gathering-tuning`, `rest-tuning`, `loot-cache-tuning`,
`quest-board-tuning`, `world-tuning`) each carry a closing step that
references this checklist rather than re-deriving it — update it here
first if the mechanics subsystem list changes.

## Root `.claude/`

Live, at the repo root:
- `.claude/commands/` — domain **slash commands** (tuning + playtest): mechanics
  `combat-playtest`, `deck-tuning`, `gathering-tuning`, `hazard-tuning`,
  `loot-cache-tuning`, `quest-board-tuning`, `rest-tuning`, `world-tuning`; mobile
  `critic-loop`, `deep-playtest`, `combat-ux-tuning`, `hermes-playtest`. Each is
  self-contained and carries a header naming the package it runs against (paths
  are package-relative — `cd` there or use `-w`). `combat-tuning`,
  `legacy-combat-tuning`, `playtest`, `resolve-playtest`, and `bump-engine`
  (npm-pin-era engine bumps, retired with the monorepo merge) were trimmed.
- `.claude/skills/` — design skills: `brainstorm-mechanics`, `character-spec`,
  `story-spec`, `world-spec`.
- `.claude/agents/` — `scout`, `reader`, `mechanics-expert`, `playtester`.

Commands write their reports to `<package>/docs/reports/` (created on demand).
All `plan/…` / `/march`-era references were scrubbed at the post-merge cleanup;
the commands are fully self-contained.

## Per-package guides

Each package keeps its own `AGENTS.md` / `CLAUDE.md` with domain specifics
(engine doctrine, mobile presenter boundaries). Read the relevant one before
working in a package.

## Verify

- `npm run verify --workspace axiomancer-mechanics` — type-check + tests + build
- `npm run verify --workspace axiomancer-mobile` — lint + typecheck + jest
- `npm run type-check --workspace axiomancer-card-editor`

## Nexus — the autonomous loop (live)

The unified **nexus** harness was re-onboarded onto the monorepo on
2026-07-03 (`chore: adopt nexus methodology`). It is now live at the repo root:

- `skills/` — the loop verbs: `ship-a-phase`, `plan-a-phase`, `iterate`,
  `critique`, `triage`, `expand`, `march`, `oversight`, `jot`, `digest`.
  (Heavyweight source-of-truth files; the `.claude/commands/<verb>.md`
  pointers are the doorways.)
- `plan/` — the loop's durable memory: `bearings.md` (standing context —
  **read this first**), `steps/01_build_plan.md` (the phase queue),
  `AUDIT.md` + `CRITIQUE.md` (the drain queues), `PHASE_CANDIDATES.md`,
  `CURRENT-STATE.md`, `reflexes.md`, `lessons.md`, `phases/`.
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

**Enforcement layer (opt-in).** `.claude/hooks/guard.mjs` (guard hook)
ships dormant. To activate the mechanical hard-rule enforcement +
permission allowlist for unattended runs, copy
`.claude/settings.json.example` → `.claude/settings.json` (and delete
its `__note` key). This widens the agent's own grants, so it is a
deliberate, user-owned step needed only at level 3+; adoption did not
enable it. Self-test the guard any time with
`node .claude/hooks/guard.mjs self-test`.

Distinct from the domain **design** skills in `.claude/skills/`
(brainstorm/character/story/world-spec) and the domain tuning/playtest
commands in `.claude/commands/` — the loop verbs are a separate layer.
Do not merge the two.

## Nexus standing rules (canonical)

These apply to every loop skill and session. `plan/bearings.md` echoes
them; update here first.

1. **Commit and push as a single atomic act** to `main`. No unpushed
   commits between ticks; no dirty tree left behind.
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
   decides, documents the call in the commit body, and ships. Genuine
   user decisions get logged to `plan/AUDIT.md` as `[needs-user-call]`
   and the loop continues with the most-defensible default.
