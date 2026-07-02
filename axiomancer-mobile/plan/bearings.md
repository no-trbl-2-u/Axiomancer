# Bearings — Axiomancer Mobile

> Standing context for every command invocation. Read this
> alongside the relevant skill file (`skills/<name>.md`) and
> the matching phase brief. If anything here changes, update in
> the same commit.

## What we're building

`specs/README.md` + `README.md` together are the de-facto product
spec. The TL;DR:

> **Axiomancer Mobile** is the React Native / Expo client for the
> Axiomancer TTRPG — a thin presentation layer on top of the
> [`axiomancer-mechanics`](https://www.npmjs.com/package/axiomancer-mechanics)
> npm engine.

All rules, state shape, and randomness live in the engine. This
repo owns five tab screens (combat / character / exploration /
inventory / event), navigation, theming, fonts, SVG/asset
placeholders, and the **presenter** glue that maps engine state
to view-models.

**Distributed via EAS Build.** No public URL — the artifact is
an iOS/Android binary delivered to TestFlight + Play Internal
Track.

## Surface

**Surface:** `service`

> Mobile native apps don't fit the canonical `site / service /
> library / cli / hybrid` matrix cleanly. We pick `service` so
> that the opt-in branding capability (`/ship-asset` + `brander`
> sub-agent) is disabled — the app surface is a binary, not a
> walkable URL, so the asset pipeline used by web nexus projects
> doesn't apply. Asset swaps for in-app SVGs follow the
> pre-existing `.cursor/skills/swap-asset-placeholder/SKILL.md`
> flow, not `/ship-asset`.

`/critique` is correspondingly limited: there is no live URL for
`reader` to walk. Until a web target ships (low priority — see
phase candidates), `/critique` operates against
`docs/`, `specs/`, and built artifacts only, treating "how a
fresh maintainer would experience this repo" as the proxy.

## Auth

**Auth:** `none` — there is no critique URL to authenticate
against. The game has no online accounts; everything is local.

## Stack (locked — do not re-litigate)

| Layer | Choice | Why |
|---|---|---|
| Repo | single repo (npm) | Small surface; engine lives in separate npm package. |
| Framework | Expo SDK 54 + expo-router 6 | File-based routing; native + web targets. |
| Language | TypeScript 5.9, strict | Catches presenter / view-model contract mismatches early. |
| Runtime | React 19.1, React Native 0.81 | Pinned by Expo 54. |
| Routing | expo-router (file-based) | Standard Expo idiom. |
| State (UI) | `zustand` store wrapping `createGameStore` from `axiomancer-mechanics` (see spec 02) | Engine is the source of truth; the store is a thin reactive wrapper. |
| Engine | `axiomancer-mechanics` npm package (pinned ^0.33.0) | Rules, RNG, reducers. **Never reimplemented in this repo.** |
| Persistence | none yet → `AsyncStorage` adapter (spec 09) | Game state survives app restart. |
| Test runner | Jest 29 + `jest-expo` + `@testing-library/react-native` | Already wired; canonical hermetic-e2e harness. |
| Lint | `expo lint` (ESLint 9, `eslint-config-expo`) | Bundled with Expo. |
| Typecheck | `tsc --noEmit` | Most reliable static check in this repo. |
| Styling | Inline `StyleSheet` + tokens from `theme/axm.ts` | No Tailwind / no CSS-in-JS. |
| Fonts | `@expo-google-fonts/{pirata-one,im-fell-english,bebas-neue,jetbrains-mono}` via `useFonts` in `app/_layout.tsx` | Loaded before splash hides. |
| SVG | `react-native-svg` 15.x; every glyph is a coded placeholder (see `SVG_ASSET_SPEC.md`). | Real artwork ships via the asset-swap workflow. |
| Build / distribution | EAS Build (`eas.json`: preview = APK; production = all) | The mobile equivalent of "deploy". |
| Pkg manager | npm (lockfile committed) | Matches existing scripts. |

## External services

| # | Service | Runbook | Status | Notes |
|---|---|---|---|---|
| 01 | GitHub | `GH_TOKEN` in `.env` (sourced from `gh auth token`; scopes `repo`, `read:org`, `gist`, `workflow`) | OK | Repo at `no-trbl-2-u/axiomancer-mobile`. Used by `/triage` and `ship-a-phase` Step 2.5 (phase mirror). |
| 02 | EAS Build (Expo) | _(not wired — see `[needs-user-call]` below)_ | STUB | `eas.json` exists with preview / production profiles. `EXPO_TOKEN` needed when the deploy gate stops being a stub. |
| 03 | npm (engine package) | n/a | OK | `axiomancer-mechanics` consumed via `npm install`. Pinned **exact** (currently `^0.21.0`) after the 0.6 → 0.7 drift incident (`/oversight` 2026-05-15); bumps require an explicit edit + migration phase. **Lockfile workflow (locked 2026-05-23 after PR #153 EAS-build failure):** when bumping the pin, edit `package.json` AND run `npm install --package-lock-only` (NOT `pnpm install` — that produces `pnpm-lock.yaml` which `.gitignore` drops; `package-lock.json` would stay on the prior pin). Commit BOTH `package.json` + `package-lock.json` in the same bump commit so EAS's `npm ci --include=dev` doesn't abort with EUSAGE before any native build step runs. |
| 04 | Claude Design | <https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384> | OK | Upstream design source for product features the user ships from. Examples: Token Crucible (commit `261a238`, retroactive Phase 17). When a `feat: … — port from design handoff` commit shows up, the design source is here. `/plan-a-phase` reads this URL when a design handoff is referenced. |

The `setup/NN_*.md` runbooks are not yet authored — they're
queued in phase candidates. Until then, treat `agents.md`
"Operational secrets" as the canonical config doc.

## Identity tiers / auth provider / anti-abuse / moderation / AI usage map

**Not applicable.** Single-player offline mobile game. No
accounts, no UGC, no AI in the product itself. (The build loop
uses AI; the game does not.)

## URL / API / CLI contract (locked)

This project has no URL / API / CLI surface. The contracts that
**are** locked:

- **expo-router file routes** under `app/(tabs)/`:
  `combat`, `character`, `exploration`, `inventory`, `event`.
  Tab order may change; route names do not without a deliberate
  navigation-phase commit.
- **Presenter contract**: every screen has a colocated pure
  function `select<Screen>ViewModel(state) → ViewModel` in
  `app/<screen>/<screen>.engine.ts`. The screen consumes the
  view-model; never reads engine state directly. See
  [`docs/presenters.md`](../docs/presenters.md).
- **Theme tokens**: `theme/axm.ts` exports `AXM.{bg, parchment,
  blood, sulfur, rust, bone, ash}` and `FONTS.{pirata, fell,
  fellItalic, bebas, mono}`. New screens consume these tokens;
  no hex literals in components.
- **`axiomancer-mechanics` API**: pinned semver; engine bumps
  are an explicit phase, not background.

## Repository shape

```
axiomancer-mobile/
├── README.md                            (project overview)
├── AGENTS.md                            (pre-nexus orientation — preserved)
├── agents.md                            (nexus rule book)
├── package.json
├── tsconfig.json
├── jest.config.js / jest.setup.ts
├── eslint.config.js
├── metro.config.js
├── app.json / eas.json
├── app/                                 expo-router routes
├── components/                          presentational components
├── state/                               engine store + presenters + e2e
├── theme/                               tokens
├── assets/                              fonts + images
├── test-utils/                          hermetic-test helpers
├── docs/                                testing standard + prompts
├── specs/                               12 spec-driven planning docs
├── plan/                                nexus build plan + briefs + queues
│   ├── README.md
│   ├── bearings.md                      (this file)
│   ├── AUDIT.md
│   ├── CRITIQUE.md
│   ├── PHASE_CANDIDATES.md
│   ├── AUDIT_BRIEF.md / [needs-user-call] log
│   ├── steps/01_build_plan.md
│   └── phases/phase_<N>_<topic>.md
├── skills/                              nexus skill source-of-truth
├── .claude/
│   ├── commands/                        slash-command pointers
│   └── agents/                          sub-agent definitions
├── scripts/                             deploy-check.mjs (stub) + helpers
└── SVG_ASSET_SPEC.md                    SVG-swap contract
```

## The `design/` folder

This project does not currently use a `design/` export folder
(no Figma source / no claude-design pipeline). Visual decisions
live in `theme/axm.ts`, `SVG_ASSET_SPEC.md`, and the per-screen
specs. If a design system is ever commissioned (see
`nexus/customization/visual-system.md`), drop exports under
`design/` and update this section.

## Sub-agents

| Agent | When to spawn | Returns |
|---|---|---|
| `scout` | External fact, spec link, API reference, RN/Expo doc | Structured findings with citations |
| `reader` | Doc-tree / repo-as-cold-reader observation (no live URL) | JSON findings array |
| `generic-specialist` | Clone when a domain specialist is justified (e.g., `engine-bridge`, `a11y-auditor`) | Per-specialist |

## Visual & tonal defaults

Authoritative file: [`theme/axm.ts`](../theme/axm.ts).

- **Mode:** dark-only by design (Axiomancer is a gothic TTRPG).
- **Palette:** `bg` near-black, `parchment` ivory, `blood` red,
  `sulfur` yellow, `rust` orange, `bone` muted, `ash` borders.
- **Type families:**
  - **Pirata One** — gothic display headers.
  - **IM Fell English** — body serif (regular + italic).
  - **Bebas Neue** — sans labels (buttons, section labels).
  - **JetBrains Mono** — numerics (HP / damage / rolls).
- **Voice:** terse, archaic, ritual. Avoid modern fluff in
  in-game copy. **No second-person archaic pronouns** (thee /
  thou / thy / thine / ye) — those tip into Renaissance-fair
  territory. Keep the register *cold and old*, not theatrical.
  Set via oversight 2026-05-15.
- **Verb-as-chrome exception (set via oversight 2026-05-16):**
  uppercase chrome labels are usually nouns (`ENCOUNTER`,
  `STRIFE`, `MEMOIR`, `WILDS`). One deliberate exception:
  the encounter-modal diagonal sash on combat-prelude events
  carries the in-world omen `STRIFE STIRS` — subject + verb
  — because the sash reads as a diegetic flag struck onto
  the encounter card rather than as plain UI chrome. Future
  critique passes should treat this and similar
  sash-as-omen patterns as design, not as fluff. New
  exceptions land here via `/oversight`.

## Plan expansion posture

`/expand` reads accumulated signals (audit findings, critique
findings, GH issues, spec drift, design landings, data growth,
and — when posture is aggressive — code "smells") and proposes
new phase candidates.

- **Mode: aggressive** (set via `/oversight` 2026-05-24, 37th
  call). `/expand` runs at a tighter cadence (≥ 8-commit cascade
  gate, ≥ 12-commit / 24h march gate), files up to 5 candidates
  per pass at score ≥ 2.5, and accepts derived "smells"
  (TODO/FIXME clusters, `as any` clusters, hex-literal leakage,
  bare `useState` in presented screens, file-length outliers,
  stale `[paused]` rows, engine-bump cliffs, etc.) as primary
  signals — a smell alone, with no AUDIT row backing it, may
  produce a candidate. `/oversight` still promotes; aggressive
  changes only what `/expand` proposes, not what ships. See
  `skills/expand.md` §3 + §4.I for the full definition.

## Decisions standing for the autonomous loop

(These exist so the loop never asks the user. Add to this list
any time you encounter a recurring class of ambiguity.)

- **State source of truth:** the `axiomancer-mechanics` engine.
  Anything that looks like a rule or RNG belongs there, not here.
- **Combat keyword vocabulary is presentation (mobile-side).** The
  player-facing keywords (BLEED / STUN / GUARD / BARRIER …) live in
  `state/combat/keywords.ts` and map engine effect *ids* → terse labels +
  glossary defs. The engine keeps its thematic effect names as lore — do
  NOT rename engine effects for player-facing text; add to the mobile
  registry instead. Starter bundles + the hidden archetype reward skew are
  also mobile-side (`state/combat/store-actions.ts`). The mechanics-side
  id-prefix-strip and engine reward-pool biasing remain deferred (they need
  an `npm login` to publish. **UPDATE 2026-06-27:** npm gate resolved; mechanics
  **0.33.0 published** (de-inert soft-controls — `resolveThreatPhase` reads the
  enemy roll penalty so confusion/fear/etc. weaken & a variety denies the turn)
  and consumed here (`^0.33.0`, app 1.4.0). The card VM now carries honest,
  real-unit `face` + `detail` (helpers `engineHonestKind`/`resolvePrimary`/
  `faceStats`/`detailStats`/`armedReadValue` read the skill's AUTHORED
  intensity/duration via `getSkillById` — never the abstract "+N impact").
  Honesty rule: real-units-or-no-number. See [[card-system-audit-and-npm-gate]].
  Shipped: 7fc7ba4 keywords+faces+glossary, 6e792aa bundles+skew, cc84d2e audit
  fixes, 37e5321 honest-units card rework.
- **Presenter purity:** presenters are pure
  `(state) → ViewModel`. No side effects, no I/O. Tests assert
  on the view-model.
- **Hard-coded fixtures are debt:** screens still holding their
  own `useState` mock data are flagged in `AUDIT.md` for
  presenter migration.
- **Asset placeholders ship:** the loop does not block on real
  artwork. Placeholders satisfy verify; real assets are a
  separate per-asset phase (`spec 11`).
- **No analytics in v1.** Privacy-by-default; no third-party
  SDKs.
- **No accounts, no online play, no AI-in-product in v1.**
- **Test scope:** every commit ships hermetic tests against the
  presenter / store. Component snapshot tests are optional and
  not part of verify.
- **Loop pushes directly to `main`.** Brownfield retrofit
  option B (the user trusts trunk). PR-based work happens
  outside the loop.
- **Empty state copy template:** `"<verb> nothing here yet — <next-action>."`
  (terse, archaic).
- **Loading state:** parchment-on-bg skeleton via existing
  components; no spinners.
- **Error state:** blood-coloured `IM Fell English` italic with a
  retry call-to-action; never expose stack traces.
- **Top-N count for any list:** 8 (matches existing inventory
  view density).
- **Top-priority unknowns surface as `[needs-user-call]` rows
  in `plan/AUDIT.md`**, not blocking questions.

## Hard rules

(Mirrors `agents.md` Standing Rules. Update there first; this
echoes.)

1. **Commit and push as a single atomic act.**
2. **No `Co-Authored-By:` trailers, no emojis.**
3. **No `--no-verify`, no force-push, no destructive resets.**
4. **The verify gate is non-negotiable** — see "Verify gate"
   below.
5. **Tests alongside code** — hermetic e2e for every change.
6. **Engine logic stays in `axiomancer-mechanics`.** No
   reimplementation here.
7. **SVGs in `components/` are placeholders.** Swap via
   `.cursor/skills/swap-asset-placeholder/SKILL.md`.
8. **No hardcoded copy in components.** Strings live in the
   presenter or a per-screen `<screen>.copy.ts` module.
9. **Never commit secrets.**
10. **The verify gate is GREEN; the loop commits autonomously.**
    The Phase 2 engine-API-drift migration shipped in commit
    `527f021` (gate restored to 185/185), and ~96 phases have
    shipped autonomously since. The historical RED-gate hold —
    a pre-existing typecheck failure from the
    `Consumable.effect → effectId` rename plus required
    `rarity`/`requiredLevel` on `Equipment` — is resolved and no
    longer constrains the loop. (Corrected via `/oversight`
    2026-06-01, 51st call, from a stale-doctrine critique finding.)

## Verify gate (hermetic, mandatory) + deploy gate

### Pre-commit: `npm run verify`

```
npm run lint            # expo lint (ESLint 9, eslint-config-expo)
npx tsc --noEmit        # strict TypeScript check
npm test                # jest (jest-expo preset, hermetic by AGENTS.md §"Hermetic E2E testing")
```

Each leg is a hard gate. **Hermetic Jest tests** are the
load-bearing piece — every implementation must land with at
least one presenter / store e2e per
[`docs/testing.md`](../docs/testing.md).

There is no separate "build" leg for the verify gate. Metro
bundles at runtime; a true native build is what EAS Build does
post-push (the deploy gate's responsibility). If a typecheck or
test failure correlates with a Metro-only edge case, file an
`AUDIT.md` row to add a `metro:bundle` smoke step.

### Post-push: `npm run deploy:check`

Currently a **stub** that exits `0` with a notice. When the EAS
Build wiring lands (see phase candidates), it polls
`https://api.expo.dev/v2/projects/<id>/builds` for the build
matching HEAD's commit SHA and exits per the standard contract:

```
0 → build ready (artifact uploaded)
1 → build errored / failed
2 → timeout
3 → config / auth (EXPO_TOKEN missing or rejected)
```

Implementation: `scripts/deploy-check.mjs`.

**Red build = blocked tick.** Read log via `eas build:view`,
patch root cause, push again. Up to 3 same-root-cause
iterations; otherwise stop per the skill's failure modes.

## Operational notes

- **No auto-deploy from `main`.** EAS Build runs are triggered
  manually via `npm run deploy:preview` / `npm run deploy:production`.
  The deploy gate, once real, polls the most-recent build's
  status against the just-pushed commit.
- **Operational secrets** in `.env` (gitignored). See
  [`agents.md`](../agents.md) "Operational secrets" section.

## Useful commands

```bash
npm install
npm start                    # Metro dev server
npm run ios                  # iOS simulator
npm run android              # Android emulator
npm run web                  # web target

npm run lint                 # expo lint
npx tsc --noEmit             # typecheck
npm test                     # jest

npm run verify               # the full gate (lint + typecheck + test)
npm run deploy:check         # post-push deploy gate (stub today)

npm run deploy:preview       # EAS preview build (Android APK)
npm run deploy:production    # EAS production build (all platforms)
```
