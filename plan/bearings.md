# Bearings — Axiomancer

> Standing context for every command invocation. Read this
> alongside the relevant skill file (`skills/<name>.md`) and the
> matching phase brief. If anything here changes, update in the
> same commit.

## What we're building

`spec.md` at the repo root is the product spec — the canonical
description of Axiomancer. Read once at session start. The TL;DR:

> A turn-based, single-player dark fantasy deckbuilding RPG
> campaign for mobile, backed by a deterministic TypeScript
> rules engine, where what you owe, and to whom, is a mechanical
> input rather than flavor.

Three-package npm-workspaces monorepo: a pure rules **engine**
(`axiomancer-mechanics`), an Expo/React-Native **app**
(`axiomancer-mobile`) that consumes the engine as local source,
and a local **card-editor** dev tool. Status-effect combat is the
core fun; morally charged choices carry lasting world
consequences.

**Name is capitalized: Axiomancer, always.**

**No hosted web surface.** The product ships as a mobile app via
manual EAS builds; `main` does not auto-deploy. See "Verify gate
+ deploy gate" below.

## Surface

**Surface:** `app` (mobile) + `library` + `cli`

This is not a website. `axiomancer-mechanics` is a `library` +
`cli`; `axiomancer-mobile` is a native `app` (with an
expo-web build used only for dev/e2e/playtesting). There is no
public human-facing URL.

Consequences for the loop:
- The opt-in branding capability (`/ship-asset` + `brander`) is
  **not adopted** — there is no site to render assets for.
- `/critique`'s "visit the live site as a stranger" maps to
  **driving the local expo-web build (or a running dev server)
  with the `playtester` agent**, not fetching a hosted URL. See
  "Sub-agents" below.

## Auth

**Auth:** `none`

Single-player local app; no login wall, no server, no accounts.
`/critique` and `reader`/`playtester` run against the local build
with no session handshake.

## Stack (locked — do not re-litigate)

Decided across the two source projects and the monorepo merge.
Revisit only if a phase genuinely cannot ship without changing
one of these — then stop and surface it as `[needs-user-call]`.

> **Exception (2026-08-08): the Expo rows are now scheduled to change.**
> T lifted the "not now" on the Expo decouple; **Phase 47** re-platforms
> the mobile framework and CI/CD rows (`expo-router`, `expo-image`,
> `expo-font`, `expo-haptics`, `expo-constants`, `expo-linking`,
> `expo-splash-screen`, `expo-status-bar`, `expo-navigation-bar`, the
> `jest-expo` preset, `expo lint`, and the EAS deploy path). Reanimated 4
> / gesture-handler / rn-svg / screens / safe-area-context are bare-RN
> and carry over unchanged. Do not pre-emptively drift off Expo before
> that phase — the rows below stay authoritative until it lands.

| Layer | Choice | Notes |
|---|---|---|
| Repo | npm workspaces monorepo (3 flat packages) | **npm, never pnpm/yarn** |
| Engines | Node ≥20, npm ≥10 | root `package.json` `engines` |
| React | 19.1.0 (pinned via root `overrides`) | react / react-dom / react-test-renderer |
| **mechanics** language | TypeScript strict, CommonJS | `type-check` = `tsc --noEmit` |
| mechanics runtime | ts-node (CLI) | no build needed to run CLIs |
| mechanics build | `tsc && tsc-alias` → `dist/` | consumed as source, but build is a gate leg |
| mechanics test | **Vitest** (`vitest run`) | hermetic; RNG stubbed |
| mechanics lint | ESLint 9 flat config, `@typescript-eslint` | |
| mechanics state | zustand (`createGameStore`) | |
| **mobile** framework | Expo ~54 + expo-router 6, RN 0.81, TS 5.9 strict | |
| mobile test | **Jest** (jest-expo) | no build leg — Metro bundles at runtime |
| mobile lint | `expo lint` | |
| mobile e2e | Playwright (expo-web) + per-minigame scripts | `scripts/*-e2e.mjs` |
| **card-editor** | Vite + React (local dev tool) | `type-check` only; not published |
| Structured data | **none** — content is in-repo TS libraries | no gh-as-db; `/ship-data` not adopted; no `data/BACKLOG.md` |
| Design layer | **none** — no `design/` export dir | design happens via the `.claude/skills/` design skills into `axiomancer-mechanics/specs/` |
| Deploy (mobile) | EAS Build (manual, release-time) | not per-push |
| CI / deploy gate | **GitHub Actions** — `verify-*` workflows | see deploy gate below |

### The `@mechanics` alias (load-bearing)

Mobile and card-editor consume mechanics as **local TypeScript
source** via `@mechanics` / `@mechanics/*` → `../axiomancer-mechanics/src`.
Mobile's Metro transpiles mechanics TS directly; card-editor
reads/writes `src/Cards/cards.library.ts` in place. **A mechanics
rename/removal can silently break both consumers** — when
changing mechanics' public surface, verify the dependent package
(`npm run verify --workspace axiomancer-mobile` and
`npm run type-check --workspace axiomancer-card-editor`).

## URL / API / CLI contract (locked)

Add new surfaces via new phases; do not change existing shapes.

### Mechanics CLI (`src/CLI/game.cli.ts`)

```
npm run game -- <sub>          # sub in combat | hazard | gathering | rest | loot-cache | quest-board
npm run hazard | gathering | rest | loot-cache | quest-board | combat   # named shortcuts
npm run combat-sim             # Monte-Carlo balance witness
npm run combat-playtest        # stage x policy matrix
# agent flags: --script <path> | --stdin | --json-events | --state-log
```

### `@mechanics` public export barrel (`src/index.ts`)

The barrel is the **locked public contract** for mobile +
card-editor. Additive exports are fine; a rename/removal is a
deliberate, semver-major phase that migrates the consumers in the
same change. Deprecated-but-live aliases kept for mobile (do not
remove until mobile migrates): `skillLibrary`->`cardLibrary`,
`getSkillById`->`getCardById`, `Skill*` type family -> `Card*`.

### Mobile routes (expo-router `app/`)

`(tabs)/`: character, exploration, inventory, memoir. Plus
`index`, `combat-encounter`, `hazard`, `hazard-deck`, `gathering`,
`rest`, `cache`, `quest`, `dialogue`, `event`, `cutscene`,
`village`, and dev routes (`dev`, `devaftermath`, `devart`).
Canon combat copy: **VITAE** (not HEALTH), **STANCE / CHOOSE A
STANCE** (not GUARD) — copy regressions are rejected.

### Deterministic seeded-RNG invariants

RNG lives in mechanics only (`setRng`/`getRng`/`setSeed`, `Rng`
type; `seedInputToUint32`, `minigameRunSeed`, `branchMinigameSeed`,
per-minigame aliased seed helpers). Tests stub via
`src/test-utils/rng.ts` (`mockFixedRng`/`mockAlternatingRng`/
`mockSequentialRng`) — never hand-roll `vi.spyOn(Math,'random')`.
`GAME_STATE_VERSION` + `migrate` gate persistence compatibility.

## Repository shape

```
Axiomancer/
├── spec.md                     # product spec
├── AGENTS.md                   # monorepo guide + nexus standing rules
├── CLAUDE.md                   # pointer at AGENTS.md
├── package.json                # workspaces + root verify/deploy:check
├── axiomancer-mechanics/       # engine + CLI (has its own AGENTS/CLAUDE)
├── axiomancer-mobile/          # Expo app (has its own AGENTS/CLAUDE)
├── axiomancer-card-editor/     # local dev tool
├── skills/                     # nexus LOOP verbs (this harness)
├── plan/                       # nexus state files (this dir)
│   ├── bearings.md             # this file
│   ├── AUDIT.md · CRITIQUE.md · PHASE_CANDIDATES.md
│   ├── CURRENT-STATE.md · reflexes.md · lessons.md
│   ├── steps/01_build_plan.md
│   └── phases/phase_<N>_<topic>.md
├── scripts/                    # deploy-check · notify · loop-issue
├── .claude/
│   ├── commands/               # loop-verb pointers + domain tuning cmds
│   ├── agents/                 # scout · reader · mechanics-expert · playtester
│   ├── skills/                 # domain DESIGN skills (brainstorm/character/story/world-spec)
│   ├── hooks/guard.mjs · settings.json (enforcement, always on)
```

Note the deliberate split: **nexus loop verbs live in root
`skills/`**; **domain design skills live in `.claude/skills/`**.
Two different things in two locations — do not merge them.

## Sub-agents

Defined under `.claude/agents/`. Spawn aggressively.

| Agent | When to spawn | Returns |
|---|---|---|
| `scout` | External fact, prior-art, spec, date, signal | Structured findings with citations |
| `reader` | Fresh-eyes observation of the local build | Findings array |
| `playtester` | Play the game via the running expo-web build (Playwright) — the real `/critique` observer for this project | Structured playtest report |
| `mechanics-expert` | Second opinion on a mechanic design / balance call | Structured analysis (never code) |

For `/critique`, prefer **`playtester`** (it already drives the
app end-to-end) over the generic `reader`; there is no hosted URL
for `reader` to fetch.

## Plan expansion posture

- **Mode: bold** (default) — `/expand` files candidates to
  `plan/PHASE_CANDIDATES.md`; `/oversight` promotes them.

## Decisions standing for the autonomous loop

(So the loop never has to ask. Add to this list any recurring
ambiguity.)

- **Which package a phase touches:** scope the verify gate to that
  workspace (`--workspace <pkg>`); if a change touches mechanics'
  public surface, also verify mobile + card-editor.
- **Which combat engine is canonical:** Hazard-Pattern Combat
  (`simulateHazardPatternCombat` / `initializeCombatEncounter`).
  The legacy `resolveCombatRound` driver was fully removed from
  the engine (2026-06) — never resurrect it for a combat gate or
  playtest.
- **Win condition:** HP is the sole win condition. Never
  reintroduce Pressure Tracks / `CombatPressureTracks`.
  <!-- lexicon-ok: pressure-tracks -->
- **Copy canon:** VITAE, STANCE, GRACE (né MORALE, spec 34 §5.6 / Phase
  44h). Never HEALTH / GUARD / MORALE.
- **Content location:** engine content in mechanics `src/*`
  libraries; player-facing strings in mobile presenters /
  `*.copy.ts`; no hardcoded copy in components; no hex literals
  in components (use AXM tokens).
- **Effect naming:** never rename engine effect ids for player
  text — add to the mobile keyword registry
  (`state/combat/keywords.ts`). Real-units-or-no-number on card
  faces.
- **Voice:** terse, archaic-flavored, "cold and old" — but **no
  thee/thou/thy/thine/ye**. Mercy/exploit language reads as
  morally charged, never neutral.
- **THE UNSHACKLING (T direct, /oversight 2026-08-08) — three locked
  constraints are VOID.** T, verbatim: *"remove constraints across the
  entire application. Normal damage is allowed, deck tuning is allowed to
  change anything about a card, no more philosophy based theme. I want to
  give you full freedom to take this deckbuilder in any direction."*
  Authorised by the source-of-truth hierarchy below (T's latest explicit
  decision outranks every ADR/CDR/spec). What falls:
  1. **The strike is alive.** Cards MAY deal raw enemy-HP damage. Spec 32
     v3 §1/§12's no-strike law and the status-dominance balance doctrine
     are retired for combat. The enforcing witness
     (`Cards/e2e/doctrine-strike-dead.engine.test.ts`) and spec 32's
     FREE-line "never damage" law come down in **Phase 41**.
  2. **`/deck-tuning` has full card authority** — no sandbox-first
     quarantine, no byte-identity law, no recolor-not-repartition rule,
     no per-change owner ballot, no `[needs-user-call]` on recolors or
     new cards. Anything about any card is fair game — **bounded only by
     the LOCKED MECHANICS carve-out below**: cards may do anything to
     Conviction, the Surge meter and the Dice system except make them
     irrelevant.
  3. **Philosophy theming is retired** as the organising fiction.
     **RATIFIED the same day — the replacement is "a Dark Fantasy
     deckbuilding RPG campaign", WHOLE PRODUCT.** T's framing:
     *"It's looser, not that different from what we already have, and
     should be an easy pivot while opening up A LOT of doors for us."*
     Read "looser" as the governing constraint: this is a re-skin plus
     permission, **not** a ground-up redesign — engine mechanics, keyword
     *behavior*, the dice model and the minigame doctrines all survive.
     **Phase 42** authors the bible (`specs/34-dark-fantasy-campaign.md`)
     and **Phases 44a-44i** execute it across cards, keywords, themes,
     enemies, world, story, morality and the product shell. Until 42 is
     ratified, do NOT rename anything and do NOT improvise dark-fantasy
     flavor in passing — the retheme runs off a map and a lint
     (Phase 44a), not opportunistically. Keywords that already read dark
     fantasy (POISON, BLEED, MARK, DOOM, THORNS, GUARD, RIPOSTE) are
     expected to survive unchanged; renaming what already works is churn.
  What does NOT fall (still binding): every hermeticity and determinism
  rule (injected RNG, no disk/network/TTY in engine tests), the verify
  and deploy gates, the nexus hard rules, and `GAME_STATE_VERSION`
  migration discipline. "Remove constraints" was about DESIGN law, not
  engineering rigour.
- **Direct pushes to `main` are sanctioned from ANY session, including
  remote/web ones** (T direct, 2026-08-08: *"Direct pushes to main are
  fine, keep going."*). Settles a standing ambiguity: remote Claude Code
  sessions are told by their harness to develop on a `claude/*` branch
  and open a PR, which conflicted with `skills/oversight.md` §6 and with
  "Loop pushes to trunk (`main`) directly" below. T's ruling is the
  explicit permission that resolves it — **no branch or PR is required**,
  and the AUDIT row that asked for a "remote-session delivery" note in
  the skill is drained as no-change-needed. Branch + PR remains available
  and is still the better choice when a change genuinely wants review
  before landing (large or risky diffs, anything a human should read
  first); it is simply no longer mandatory. Everything else is unchanged:
  the verify gate still runs pre-commit, the deploy gate still runs
  post-push, and no force-push or destructive git op is permitted.
- **THE CURRENT CARD LIBRARY IS TRANSITIONAL — do not spend tuning
  effort on it** (T direct, /oversight 2026-08-08). Asked to rule on
  Phase 39's two open findings, T answered: *"This is fine. We're
  working on a new card redesign anyway."* Standing consequences:
  1. **A card redesign is in flight.** Its scope was not specified to the
     loop, and the loop must NOT assume it is the same thing as Phase
     44c (the retheme, which changes names and faces). "Redesign" reads
     mechanical. If a tick needs to know, ask at the next `/oversight`
     — do not infer, and do not start it.
  2. **Balance findings against the present 86-card library are
     information, not work.** File them; do not promote phases off them,
     do not open `/deck-tuning` passes to chase them, and do not author
     replacement cards to patch measured regressions. Foundry's
     73%→44% early-stage regression is the worked example: real, filed,
     and deliberately not fixed.
  3. **This does not silence measurement.** `/digest` may keep reading
     baselines; it simply must not spawn tuning work off them until the
     redesign lands and **Phase 43** provides a live objective function.
  4. **Not a licence to skip the retheme phases.** 44a-44i still run —
     they are thematic and structural, not balance work.
- **LOCKED MECHANICS — the carve-out from the unshackling (T direct,
  /oversight 2026-08-08).** T, verbatim: *"the Conviction, Surge meter,
  and Dice mechanics system, those are LOCKED into place and will need to
  stay. Cards can effect them, but agents should not remove the
  mechanics."* The unshackling's "full freedom" **stops here**. Three
  systems are permanently in the game:
  1. **Conviction** — the banked combat resource that funds Signature
     Skills. Anchors: `CombatEncounterState.conviction`
     (`Combat/combat.encounter.types.ts`), the `conviction-gained` /
     `special-fired` events, `fate-tapped`'s `'conviction'` choice,
     `die-forged`'s `'conviction'` destination, `SPECIAL_CONVICTION_DEFAULT`,
     and every `SIGNATURE_SKILLS` cost. Spec 26 / 26b.
  2. **The Surge meter** — the global momentum wheel and its surge.
     Anchors: `MOMENTUM_CHAIN_ORDER`, `MOMENTUM_SURGE_LENGTH`,
     `SURGE_DIE_PREFIX`, the `momentum-surged` event, and
     `die-overflowed`'s `'surge'` source. Spec 31.
  3. **The Dice mechanics system** — `Combat/dice.ts`,
     `Combat/combat.dice.ts`, `Combat/combat.upgradeable-dice.ts`,
     `DEFAULT_DIE_GEAR` / `activeDieGear`, the HONE/TEMPER die-gear
     economy, and the Upgradeable-Dice model that D-FLIP made the default
     (legacy dice stays as the explicit comparison mode). Spec 33.
  **What is allowed:** cards, keywords, enemies and content MAY read,
  feed, spend, block, amplify or otherwise interact with all three — that
  is explicitly encouraged, and normal damage does not displace them.
  **What is forbidden without a new T ruling:** removing, replacing,
  no-op'ing, feature-flagging off, or routing around any of the three;
  deleting their tests as "dead doctrine" during Phase 41; or letting a
  balance pass tune them out of relevance. If a phase genuinely cannot
  ship without touching one of these, **stop and surface it as
  `[needs-user-call]`** — do not decide it under the standing
  big-decisions authority, which this carve-out explicitly overrides.
  **On renaming:** the LOCK is on the mechanics, not the words, but all
  three names already read dark fantasy, so the default is **keep the
  names too**. A Phase 42 proposal to rename any of them must say so
  out loud, route through the Phase 44a map, and check
  `GAME_STATE_VERSION` — the mechanic survives either way.
- **Balance doctrines (per encounter):** ~~status-effect play is
  the dominant win path (combat)~~ — **VOID for combat via the
  unshackling above; Phase 43 defines the replacement objective
  function, and until it lands every doctrine-curve reading measures
  a dead law.** Still live for the minigames:
  Gathering greed < restraint <
  skill; Loot-cache informed > blind > coward; Quest Board
  naive-finishes / deliberate-finishes-well; ~~Rest
  meagre-but-never-lethal (posture gradient)~~ — **VOID, Phase 52e
  retired the minigame (the rest-choice node replacing it is a
  one-shot player pick, not a tuned balance curve)**; Hazard -> CDR-0006
  targets.
- **Source-of-truth hierarchy:** T's latest explicit decision >
  ADRs/CDRs > build plan > candidates > critique/audit >
  historical reports. On contradiction, stop and surface drift.
- **Hermes-decided work lands in the queue** (adopted via /oversight
  2026-07-18): every work item decided on the Hermes side files a
  GitHub issue (or a build-plan phase row) before or alongside its
  code change, so both brains drain one queue via `/triage`. If the
  loop finds shipped code with no queue trace, treat it as drift and
  surface it rather than double-shipping.
- **The loop is authorized to make big calls on its own** (adopted via
  /oversight 2026-08-08, T verbatim: *"you are free to make big decisions
  like this"*). Said in response to an oversight batch that asked
  permission to promote phases and unlock gated candidates. Standing
  reading: when the loop can see the decision is right from state it
  already holds, it **decides and ships** rather than parking the item
  for the next attended session — including promoting a candidate to a
  build-plan phase, merging overlapping candidates, unblocking work that
  was gated only on "check with the owner first", and setting scope. The
  question budget is for calls the state genuinely cannot settle. This
  does NOT relax: the `AskUserQuestion`-only-in-`/oversight` rule (the
  autonomous verbs still never ask — they decide), the hard rules
  (no destructive git, no secrets, verify gate), irreversible or
  outward-facing actions, or anything an explicit prior T ruling already
  settled the other way. When the loop uses this authority on something
  load-bearing, it files the call + reasoning as residue (standing rule
  7) so T can audit it after the fact instead of before.
- **Hermes-originated queue mutations get a provenance log entry**
  (adopted via /oversight 2026-07-30, issue #129): any time a
  Hermes-originated instruction changes `plan/steps/01_build_plan.md`'s
  queue (add/remove/reorder/reprioritize/split/merge/skip/block/
  unblock/material scope change to a phase row), the same commit adds
  a row to that file's `## Queue change log` section — date, actor
  (`T via Hermes`), the action + affected phase IDs, confirmation T
  requested it, T's stated reason (or "reason not stated"), and the
  resulting commit/issue/brief. Forward-looking only; do not
  reconstruct pre-2026-07-30 queue history into the log.

## AUDIT category taxonomy (this project)

`/iterate` and `/expand` read `plan/AUDIT.md`. Categories used
here (extends the web-centric template set):

`contract` · `divergence` · `debt` · `gap` · `content` · `docs` ·
`tests` · `a11y` · `perf` · `external-critique`

## Hard rules

Rules 1-5 are the nexus standing rules, **canonical in `AGENTS.md`
§ "Nexus standing rules"** (which now numbers seven — including
`AskUserQuestion` only in `/oversight`, and **file the residue**: a
session that produces direction beyond what it ships files it into
the plan/ queues before ending). Read them there; update them there
first — this file no longer carries a copy. In short: atomic
commit+push to `main`; no trailers/emojis; foreground verify gate,
no `--no-verify`/force-push/destructive resets; tests alongside
code; deploy gate after every push.

Rules 6-9 are project-specific additions that live here (numbering
preserved — phase briefs cite them by number):

6. **Rules/state/RNG live in mechanics, never in mobile
   presenters.**
7. **The `/archive` harness is gone** (consumed + removed at
   re-onboard). Do not resurrect its retired pre-monorepo patterns
   from git history.
8. **Never commit secrets** (`.env` is gitignored).
9. **Never reintroduce Pressure Tracks** or the npm-publish /
   engine-pin model (both deliberately retired).

## Verify gate (hermetic, mandatory) + deploy gate

Every shipping skill runs **two** gates around a commit.

### Pre-commit: `npm run verify`

The gate is **per-workspace** (a phase usually touches one
package). Root `npm run verify` fans out to all three; scope to
the touched workspace when you can.

```bash
# whole monorepo
npm run verify

# scoped (preferred — pick the package the phase touches)
npm run verify --workspace axiomancer-mechanics   # type-check + type-check:tests + lint + vitest + build
npm run verify --workspace axiomancer-mobile      # lint + typecheck + jest
npm run type-check --workspace axiomancer-card-editor
```

Mechanics changes to the public surface must ALSO run the mobile
+ card-editor gates (the `@mechanics` alias couples them).

Each leg is a hard gate. There is **no `data:validate` leg**
(no structured data layer). Mobile has **no build leg** (Metro
bundles at runtime); its `verify:visual` smoke screens and
`e2e:*` scripts are the hermetic UI legs, run as part of
CI (`verify-mobile.yml`) rather than the per-commit local gate.

### Post-push: `npm run deploy:check`

After `git push origin main`:

```bash
npm run deploy:check
```

**Deploy gate = CI-green (GitHub Actions).** There is no
push-to-production; "deploy" for this project means "the
path-filtered `verify-*` workflows for HEAD's SHA went green."
`scripts/deploy-check.mjs` (`DEPLOY_PROVIDER=github-actions`)
polls the Actions API for HEAD's runs:

- exit 0 — all triggered `verify-*` runs concluded success (or
  the commit's paths triggered no gated workflow — nothing to
  check)
- exit 1 — a `verify-*` run failed -> read the run log, patch,
  push again (<=3 same-root-cause iterations)
- exit 2 — timeout (still running; loop re-checks next tick)
- exit 3 — config/auth (`GH_TOKEN` missing/rejected)

Needs `GH_TOKEN` (repo-scoped PAT, Actions:read) in `.env`;
`GH_REPO` defaults to `no-trbl-2-u/Axiomancer`. EAS release
builds (`preview-build.yml`, `npm run deploy:preview/production`)
stay a deliberate manual step — **not** part of the per-tick
gate.

**Cards-only carve-out (CI):** a change confined to
`axiomancer-mechanics/src/Cards/cards.library.ts` (card DATA edits
from the card editor) still runs the full mechanics gate + mobile
lint/typecheck/jest + bundler smoke, but `verify-mobile.yml` skips
its slow Playwright `e2e-minigames` job (the `detect-scope`
job gates it; defaults to running on any uncertainty). Any mobile
change or any *other* mechanics change runs the full e2e. The
deploy gate is unaffected — a skipped job does not fail the run.

## Operational notes

- **Loop pushes to trunk (`main`) directly.** Audit after the
  fact via commit bodies + `/oversight`.
- **Actions-minutes budget (2026-08-14 usage review, PR #205).**
  Half-month spend was ~2,955 min (march 42%, triage 17%, verify
  CI 21%, night 11%) against 3,000 included min/mo. Standing
  consequences for the loop:
  - **Issues are NOT triaged on arrival** — triage's per-issue
    trigger was removed; new issues wait for the next `/march`
    tick (its first gate). `workflow_dispatch` triage remains for
    an immediate manual pass.
  - **`/digest` (night) runs on odd days only**, not daily.
  - Timeouts are budget caps: march 75, night 45. A tick that
    genuinely needs more should be split, not have its cap raised
    silently.
  - T's call: march stays at 4×/6h. If overage still stings,
    the next levers (owner-call, in order) are march 2×/day, then
    a self-hosted runner (only inside a dedicated VM — the loop
    runs `--dangerously-skip-permissions`).
  - The weekly tuning crons stay disabled ("until next billing
    cycle" comments in their workflow files); don't re-enable
    them without an owner call.
- **A red `verify-*` workflow = a blocked tick.** Verify gate is
  pre-flight; the CI-green deploy gate is post-flight.
- **Operational secrets** in `.env` (gitignored): `GH_TOKEN`
  (deploy gate + issue mirror + triage), optional
  `NOTIFY_NTFY_TOPIC`/`NOTIFY_WEBHOOK_URL` (pager), `EXPO_TOKEN`
  (only for manual EAS builds). See `.env.example`.

## Useful commands

```bash
npm run verify --workspace axiomancer-mechanics   # engine gate
npm run verify --workspace axiomancer-mobile      # app gate
npm run verify                                    # whole monorepo
npm run deploy:check                              # post-push CI-green gate
npm run game -- combat                            # play Hazard-Pattern Combat (CLI)
npm run mobile -- start                           # expo dev server
```
