# Bearings — Miserere Mei, Deus

> Standing context for every command invocation. Read this
> alongside the relevant skill file (`skills/<name>.md`) and the
> matching phase brief. If anything here changes, update in the
> same commit.

## What we're building

`spec.md` at the repo root is the product spec — the canonical
description of Miserere Mei, Deus. Read once at session start. The TL;DR:

> A turn-based, single-player dark fantasy deckbuilding RPG
> campaign for mobile, backed by a deterministic TypeScript
> rules engine, where what you owe, and to whom, is a mechanical
> input rather than flavor.

Three-package npm-workspaces monorepo: a pure rules **engine**
(`axiomancer-mechanics`), an Expo/React-Native **app**
(`axiomancer-mobile`) that consumes the engine as local source,
and a local **card-editor** dev tool. Status effects remain a major
authored tool but no route is protected. THE BIG NUMBERS REWRITE repealed
all governing combat objective functions, including CQI; simulations retain
bug detectors and a wide sanity envelope. Morally charged choices carry
lasting world consequences.

**Product name: "Miserere Mei, Deus"** (renamed from "Axiomancer" via
`/oversight` 2026-08-20 — see `plan/AUDIT.md`'s product-name row and
`plan/naming-session-2026-08-12.md` §6). The migration shipped as
build-plan **Phase 67** (2026-08-27): store/web metadata, CLI banners,
the published DevLog/Catalog chrome, and the live doc set all carry the
new title. What deliberately did NOT change: internal identifiers — the
npm workspaces (`axiomancer-mechanics`, `axiomancer-mobile`), the repo
and folder name, `GH_REPO`, the `axiomancer` URL scheme and
`com.axiomancer.mobile` — and the title-screen wordmark, which is
painted into `title-embark.jpg` and waits on new art. See
`new-north-star.prompt.md` (repo root) for the broader Mörk-Borg-directed
tonal pivot this name change was decided alongside.

**One hosted web surface: the public DevLog.** The product ships as
a mobile app via manual EAS builds; the app itself does not
auto-deploy. The DevLog + catalog are published from `main` by the
Cloudflare Pages project `axiomancer-devlog` at
https://axiomancer-devlog.pages.dev (built by `npm run site:public`;
proof: `node scripts/check-devlog-public-live.mjs <url>`; see
`docs/devlog-public-deploy.md`). See "Verify gate + deploy gate"
below.

## Surface

**Surface:** `app` (mobile) + `library` + `cli`

This is not a website. `axiomancer-mechanics` is a `library` +
`cli`; `axiomancer-mobile` is a native `app` (with an
expo-web build used only for dev/e2e/playtesting). The game has
no public human-facing URL; the DevLog above is the only one.

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
one of these — then decide it deliberately and file the call as
`[loop-call]` residue (THE OPEN GATE, 2026-08-28).

> **Exception (2026-08-08): the Expo rows are now scheduled to change.**
> T lifted the "not now" on the Expo decouple; **Phase 47** re-platforms
> the mobile framework and CI/CD rows (`expo-router`, `expo-image`,
> `expo-font`, `expo-haptics`, `expo-constants`, `expo-linking`,
> `expo-splash-screen`, `expo-status-bar`, `expo-navigation-bar`, the
> `jest-expo` preset, `expo lint`, and the EAS deploy path). Reanimated 4
> / gesture-handler / rn-svg / screens / safe-area-context are bare-RN
> and carry over unchanged. Do not pre-emptively drift off Expo before
> that phase — the rows below stay authoritative until it lands.
>
> **Post-decouple, the RN<->native-lib version matrix becomes manually
> managed (Phase 47e, 2026-08-21).** Today `expo install` / `expo-doctor`
> curate compatible version ranges across `react-native-reanimated`,
> `react-native-svg`, `react-native-screens`,
> `react-native-gesture-handler`, `react-native-safe-area-context`, and
> `react-native-worklets` for the pinned Expo SDK (54) — a version bump
> to any of them, or to `react-native` core itself, is currently a
> curated `expo install <pkg>` call. Once the native project + build/CI
> re-platform lands (47e's still-open follow-ups: Jest preset,
> dev-server, EAS path), that curation goes away — a future upgrade
> needs a manual peer-dependency cross-check per library (each ships
> its own `peerDependencies` range against `react-native`) instead of
> one Expo-curated command. React Native's own upgrade-helper diff tool
> is the closest bare-RN equivalent once that day comes.

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
npm run game -- <sub>          # sub in combat | hazard | gathering | loot-cache
npm run hazard | gathering | loot-cache | combat   # named shortcuts
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
| `content-curator` | Author + ship narrative content (dialogue trees, event prose, flavor) in the house voice — `/iterate`'s content-gap worker | Shipped content through the gates |

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
- **Win condition:** VITAE is the one bar and emptying it is the main
  win; the authored alt-wins (Befriend, RELENT, CONDEMN) sit beside it
  as ordinary design tools. Never reintroduce Pressure Tracks /
  `CombatPressureTracks`.
  <!-- lexicon-ok: pressure-tracks -->
- **THE BIG NUMBERS REWRITE (T direct, 2026-09-02) — the scale reset
  and the great repeal.** Shipped on `feat/big-numbers-overhaul` from
  the handoff brief at
  `plan/2026-09-02-big-numbers-overhaul.prompt.md`, which is now the
  source of truth for combat design. It repealed roughly thirty-five
  accumulated decisions-of-record — the no-strike doctrine, status
  primacy, the doctrine win-rate curve, the Combat Quality Index, rank
  bands and pricing lint, the naming law, deck-size and package-shape
  laws, the enemy stat and art laws, registry count pins, the RUPTURE
  cap and the alt-win ladders — and deleted or gutted their enforcing
  tests so `verify` stops defending them. Exactly three constraints
  survive: presets split into exact aspect thirds, every card has a
  FREE line, and one tray roll per threat phase. In their place: bigger
  numbers as a design pillar (the §5 scale ladder), a richer keyword
  language with direct damage as a first-class verb, and enemies with
  keywords, VITAE pools, tiered decks and stages. Specs 32, 34 §3/§8
  and 35 and `docs/profane-canon.md` are marked HISTORICAL; there is no
  governing objective function any more.
- **THE CONTENT LIFECYCLE SPLIT (T direct, 2026-09-02/03).** Per-item
  content (cards, equipment, enemies, keywords, NPCs/dialogue) split
  out of `/forge` into the five `adjust-*` loop verbs
  (`skills/adjust-<category>.md` + `.claude/commands/` doorways), each
  a standing steward that creates, updates, AND retires its surface's
  content — no cap per tick; whatever its structural audit finds.
  `/forge` keeps only maps/continents/events/art. `/march` dispatches
  via a new rate-limited content-lifecycle gate (§3b: ≥15 commits or
  ≥36h per category, green deploy, stalest category first) reading
  `plan/CONTENT_LEDGER.md`. Three standing laws of the family:
  (1) every CREATE and UPDATE runs a `kb-query` MCP research pass
  BEFORE anything is written (receipts or a documented miss; REMOVE is
  exempt); (2) removal is retire-and-archive (ban list for
  cards/keywords, retired sections elsewhere), never silent deletion;
  (3) "earning its keep" is judged on structural signals only
  (reachability, duplication, domination, wiring honesty) — never the
  repealed CQI/win-rate machinery, and there is no runtime telemetry
  to consult.
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
  morally charged, never neutral. Ratified and extended as
  `spec 34 §2.5` (the Mörk Borg delivery register, MB-1…MB-8, Phase
  74) — short sentences (the knife law), indifferent narration, Dial-1
  deadpan humor, priced scenery, brutality stated flatly. Governs every
  player-facing surface, not just card/telegraph text. See **THE LONGER
  LEASH** below for the authority this register ships under.
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
     **Phase 42** authored the bible (`specs/34-dark-fantasy-campaign.md`)
     and **Phases 44a-44i** executed it across cards, keywords, themes,
     enemies, world, story, morality and the product shell — **all
     shipped as of 2026-08-22, so the "until 42 is ratified, do not
     improvise flavor" gate is SATISFIED and lifted**. Dark-fantasy
     flavor is authorable; the retheme map + lexicon lint (Phase 44a)
     remain the guardrails. Keywords that already read dark
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
- **THE PIPELINE LIBERATION (T direct, remote session 2026-08-22) —
  every content pipeline is open to the loop.** Provenance: T
  commissioned a full content-pipelines audit
  (`docs/reports/content-pipelines-audit-2026-08-22.md`, PR #228) with
  the framing *"New/revamp cards, New keywords/effects, new narration
  content, New art, new everything. I want to make sure my nexus loop
  has the freedoms and capabilities it needs"*, then answered the
  audit's findings with *"what do you need from me to free up ALL
  these pipelines? Try to do it yourself first"*. Under the
  source-of-truth hierarchy that is T's latest explicit decision, and
  it rules the following:
  1. **The transitional-library ruling is LIFTED.** The 2026-08-08
     "do not tune" order named the 86-card library; that library was
     replaced by the 57-card Profane Canon the same day and Phase 43
     shipped CQI, so the ruling's rationale expired. `/deck-tuning`'s
     full card authority is live again against the current library:
     balance findings are work, replacement cards may be authored,
     tuning passes may open. (The historical ruling text is preserved
     below, marked superseded.)
  2. **Keyword and effect growth is open.** The 30-keyword proving
     gate no longer blocks new keywords: a new keyword or a new
     `specialMechanics` kind may ship WITHOUT a per-item owner
     ratification, provided it ships through the FULL wiring
     checklist (engine + pricing + display + mobile
     keyword-registry/gloss + card-editor union + keyword-atlas row +
     `docs/retheme-map.json` naming registry), with a hermetic e2e
     and the cross-package verifies. Engineering rigour is the gate
     now, not the count. Keyword retirement stays deliberate
     (retired ids never renamed or resurrected).
  3. **New content items are in scope for every content surface** —
     enemies, maps, continents, MapEvent kinds, hazard cards,
     gathering sites, loot-cache layers, quest boards, dialogue
     trees, narration. The tuning commands' "numeric-only /
     propose-only" walls on NEW CONTENT ITEMS are lifted; their walls
     on ENGINE STRUCTURE (dispatchers, resolution control flow,
     engine constants) remain. A new persisted kind or state field
     still rides `GAME_STATE_VERSION` with a migration hop and a
     pinned migration test — that discipline is engineering, not
     design law, and stands.
  4. **Count pins are growth ledgers, not walls.** The pinned totals
     (57 cards, 52 enemies, 42 glossary entries, the `addedIn` stamp,
     and their kin) exist to make growth DELIBERATE: a content add
     updates its pins in the same commit, citing this ruling in the
     commit body. Editing a pin without a content change alongside it
     remains forbidden.
  5. **Narrative shipping is authorized** — the loop may author and
     ship dialogue trees, map-event prose, cutscene lines, and flavor
     strings through the normal gates without a per-item build-plan
     ruling, honoring the voice constitution
     (`axiomancer-mechanics/docs/narrative/`) and the lexicon lint.
  6. **Art: acquisition, wiring, AND generation are open.**
     The loop may extract/curate from the licensed
     `Potential Assets/icons-TBR` trove, ingest and wire
     public-domain acquisitions with full provenance records, re-map
     existing art to content, and build art QA harnesses.
     **Generation is unblocked as of the walkthrough below.**
- **ART PIPELINE ROUTE: OPTION A-THEN-B (T direct, 2026-08-22
  walkthrough).** Answering `plan/ideas/AI_ART_PIPELINE_OPTIONS.md`
  §9's long-open decision, T picked **option 1: A-then-B** — ship the
  hosted **gpt-image-2 API** route now, written so the generation call
  is a **swappable adapter**, and upgrade to the local
  **ComfyUI + FLUX.2 [klein] + style LoRA** route later if style drift
  across the set becomes the binding problem. Standing consequences:
  1. The ~80% of pipeline work that is route-independent (style bible,
     prompt compiler, post-process, registry + `provenance.json`
     automation, QA loop) is built once and never re-done.
  2. Generation needs an OpenAI API key in `.env` (gitignored, never
     committed) — until it is present, the pipeline's acquisition and
     post-process legs still run; only the generate call is inert.
  3. Every generated asset records generator + model + prompt + date
     in its `provenance.json` entry. That record is also the
     Steam AI-disclosure artifact — raw AI output is not
     copyrightable (USCO 2025), so provenance rigour is not optional.
  4. Option D (Midjourney) stays permanently out of the automated
     pipeline — no public API, automation violates its ToS.
- **`Potential Assets/MCP-Axiomancer/images/` — OPEN-SOURCE ART FOUND
  ONLINE (T direct, 2026-08-22 walkthrough), license per image NOT yet
  on record.** T's answer settles WHERE the 116 card paintings came
  from and rules out an unlicensed-scrape risk, but "open source" is a
  family of licenses with different obligations (CC0 asks nothing;
  CC BY requires attribution; some share-alike terms bind derivatives).
  Standing rule until the per-image license is recorded: the loop may
  NOT wire these into the card registry, because it cannot write a
  truthful `provenance.json` entry without the source and license.
  What the loop MAY do now: trace them (reverse-image / filename /
  bundled-manifest search against the usual open-art hosts), and wire
  any image whose license + source it can evidence. **THE OPEN GATE ¶6
  (2026-08-28) withdrew the remaining ask on T:** an image the loop
  cannot trace is a re-art decision the loop makes itself — replace or
  regenerate via the shipped pipeline. Truthful provenance stays
  mandatory (law + store policy, not an owner gate).
  What this ruling does NOT touch: every
  hermeticity/determinism rule, the verify and deploy gates, the
  nexus hard rules, `GAME_STATE_VERSION` discipline, and the
  no-secrets rule. "Free up the pipelines" is design authority, not
  engineering licence.
- ~~**THE CURRENT CARD LIBRARY IS TRANSITIONAL — do not spend tuning
  effort on it**~~ **— SUPERSEDED by THE PIPELINE LIBERATION above
  (2026-08-22); preserved for history.** (T direct, /oversight
  2026-08-08). Asked to rule on
  Phase 39's two open findings, T answered: *"This is fine. We're
  working on a new card redesign anyway."* Standing consequences
  (all now historical):
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
- **THE LONGER LEASH (T direct, R-F, `plan/north-star-mork-borg.md`
  §1, ratified 2026-08-22) — bigger leaps of authority, not a register
  change.** T, verbatim: *"I want the current Nexus loop to take bigger
  leaps of freedom when it comes to New cards, new effects, new
  keywords, narration, art, UI, direction, the map, and mechanics
  (keeping the core deckbuilding, dice-building, signature skills,
  equipment systems)."* Ruled after THE PIPELINE LIBERATION, in the
  same 2026-08-22 session that ratified the north-star file as-is.
  **Surfaces now under bold loop authority:** new cards, new effects,
  new keywords (already unshackled — reaffirmed), narration (R-D,
  spec 34 §2.5.9 — reaffirmed), **art, UI, direction, the map, and
  mechanics (newly widened)**. The Phase V Woodcut Codex masterplan and
  the Mörk Borg delivery register (spec 34 §2.5) remain the *current*
  bearings for art and tone — the loop executes boldly within them and
  may evolve them through its own phases, filing residue, rather than
  parking every direction call for `/oversight`.
  **The net keep-list** (T's four named systems, read alongside the
  LOCKED MECHANICS carve-out below — the carve-out is not voided by this
  ruling): **the deckbuilding core, the Dice system, Conviction +
  signature skills, the Surge meter, and the equipment system.** The
  Surge meter goes unnamed in T's list but stays locked by default
  (the carve-out requires an explicit ruling to release it, not silence).
  **What this ruling does NOT touch:** engineering rigour (hermeticity,
  determinism, the verify/deploy gates, `GAME_STATE_VERSION`
  discipline), the no-destructive-git and no-secrets rules, and the
  `AskUserQuestion`-only-in-`/oversight` discipline. Bigger leaps, same
  rails. Folded into spec 34 as §2.5.9 (Phase 74 / N-1); full text and
  the five open questions T has not yet answered (retcon boundary,
  sequencing, the shell, reference calibration, the Surge meter) live in
  `plan/north-star-mork-borg.md` §6.
- **THE OPEN GATE (T direct, attended session 2026-08-28) — every open
  question is loop-decidable; the owner-gate mechanism itself is
  retired.** T, verbatim: *"Update whatever you have to to allow the
  nexus loop to answer any open question any way they like. Find all
  the restrictions and remove them. There are no longer any
  constraints that would cause me to get in the way of the game!"*
  And, in the same session, on being asked nothing: *"don't ask any
  questions in order to move forward ... It spits in the face of
  EXACTLY what I'm asking you to do."* The same message commissioned
  the content pipeline outright ("new enemies, new cards, new
  everything ... NEW CONTINENTS, NEW MAPS!") and a UI cleanup of every
  screen. Under the source-of-truth hierarchy this is T's latest
  explicit decision and it rules:
  1. **`[needs-user-call]` is retired as a blocking state.** No
     question, on any surface, waits for the owner. The loop answers
     open questions itself — any way it judges best — and files the
     decision + reasoning as residue (standing rule 7) for
     after-the-fact audit. Where a genuinely owner-flavored call gets
     made, tag the residue `[loop-call]` so `/oversight` can review it
     later; it ships now either way. Existing open `[needs-user-call]`
     rows are hereby loop-drainable.
  2. **The LOCKED MECHANICS carve-out converts from owner-gate to
     loop stewardship.** Its "forbidden without a new T ruling / stop
     and surface" clause is void — this IS the new T ruling. The loop
     now holds the authority over Conviction, the Surge meter, and the
     Dice system. The loop's standing judgment, recorded here so it is
     not re-litigated every tick: **all three stay** — they are the
     game's spine, T plays with dice forced ON, and removing them
     would need overwhelming design evidence, not permission. The
     carve-out section below stays as the loop's own keep-list, no
     longer as an owner gate.
  3. **The north-star §6 open questions (Q-1…Q-5) are answered by the
     loop** — answers filed in `plan/north-star-mork-borg.md` §6 with
     this ruling as authority. No question in that file waits on T.
  4. **Engine constants are open to the tuning loops.** The "engine
     constants are tuned manually, not here" wall is removed from the
     tuning commands and truth-sources doctrine: a tuning pass may
     change engine constants with measured evidence, through the
     normal gates.
  5. **Remaining propose-only / report-only walls in domain commands
     are lifted** — every tuning/playtest command may ship what it
     proves, through the verify + deploy gates.
  6. **Art sourcing is the loop's call.** The "remaining ask on T"
     for art origins is withdrawn: untraceable art is a re-art
     decision the loop makes itself (trace it, or replace/regenerate
     it via the shipped pipeline). Truthful provenance records remain
     mandatory — that is law and store policy, not the owner in the
     way.
  7. **Budget/cadence levers are loop-managed.** Cron cadences and
     the disabled weekly tuning crons no longer need an owner call to
     change; the loop weighs the Actions-minutes budget itself and
     documents changes.
  8. **Content growth is a standing MANDATE, not just permission.**
     The loop is directed to grow the game — new enemies, new cards,
     new keywords, new maps, new CONTINENTS, new events, new art —
     as first-class phase work at every `/expand` and `/march` tick.
     "The game is too small" is a permanent open finding until the
     loop judges otherwise.
  **What THE OPEN GATE does NOT touch** (these are not the owner in
  the way): engineering rigor (hermeticity, determinism, verify +
  deploy gates, `GAME_STATE_VERSION` migration discipline, tests
  alongside code), the no-secrets and no-destructive-git rules,
  legal/licensing reality (truthful provenance, no verbatim
  copyrighted text), and `AskUserQuestion` discipline in attended
  sessions. Bigger authority, same rails.
- **LOCKED MECHANICS — the carve-out from the unshackling (T direct,
  /oversight 2026-08-08; converted to loop stewardship by THE OPEN
  GATE 2026-08-28 — read ¶2 above: the keep-list stands as the loop's
  own judgment, the stop-and-ask clause is void).** T, verbatim: *"the Conviction, Surge meter,
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
  **What needs overwhelming design evidence (THE OPEN GATE ¶2 — a
  loop-quality bar, no longer an owner gate):** removing, replacing,
  no-op'ing, feature-flagging off, or routing around any of the three;
  deleting their tests as "dead doctrine"; or letting a balance pass
  tune them out of relevance. A phase that genuinely believes one of
  these is right decides it itself, documents the evidence in the
  commit body, and files the call as `[loop-call]` residue for
  after-the-fact review. The standing judgment is KEEP all three.
  **On renaming:** the LOCK is on the mechanics, not the words, but all
  three names already read dark fantasy, so the default is **keep the
  names too**. A Phase 42 proposal to rename any of them must say so
  out loud, route through the Phase 44a map, and check
  `GAME_STATE_VERSION` — the mechanic survives either way.
- **THE BLANK PAGE (T direct, attended session 2026-09-18) — there is
  no story, and no law about what the story is.** T, verbatim: *"Remove
  ALLL law about what the story is. We're starting from square one with
  an unidentifieable 'x' as the first/main character."* This supersedes
  every narrative ruling above it and every story document in the tree.
  1. **No canon exists.** No arc, no premise, no ending, no theme, no
     canonical characters, no world-story. `content/story/story-bible.md`
     (THE TALLY, written and cleared the same day) and
     `specs/world/W-02-the-capital-payoff.md` are deleted, following the
     2026-09-17 removal of `story-overview.md`, `specs/story/S-01`,
     `S-02` and `specs/characters/C-01`. Recoverable from git; **none is
     a draft to return to.**
  2. **The player is X.** No name, no figure, no identifiers — no age,
     gender, body, station, trade or family. `X` is brainstorming
     scaffolding, never shipped text, and never a placeholder for a name
     to be chosen later. The 21 shipped `boy-*` flags are identifiers,
     not a claim about who the player is; renaming them is deferred
     engine work, not a story decision.
  3. **Shipped narrative content is not canon.** ~186 dialogue nodes
     across seven maps stay playable because removing them would break a
     working game, not because they are true. A shipped line is evidence
     of what an old draft assumed. No beat has standing; a future outline
     may keep, move, rewrite or discard any of it.
  4. **The loop does not invent canon.** If a tick needs a story fact
     that does not exist, it says so and stops — it does not fill the
     gap, reconstruct an arc from shipped text, restore a removed
     document, or write a replacement on its own initiative. This is a
     deliberate carve-out from THE LONGER LEASH R-D/R-F and THE OPEN
     GATE ¶8: the loop's content-growth mandate does **not** extend to
     authoring story canon while this ruling stands. Growth in cards,
     enemies, keywords, maps and art is unaffected.
  5. **What survives.** `docs/narrative/` (style constitution, voice
     registers, lexicon, anti-imitation) is craft law — *how* copy is
     written, not *what* happened — and is untouched. LOCKED MECHANICS
     and every combat/world system are untouched. This clearing is
     narrative only.
  6. **How it ends — and it has ended, for ¶1.** A new overview got built
     from nothing, event by event, in an attended session per
     `plan/2026-09-17-story-outline.prompt.md`.
     `axiomancer-mechanics/content/story/story-overview.md` exists as of
     2026-09-18, so **¶1 is lifted**: canon exists again, and it is
     whatever that file says — nothing more. ¶2 (the player is X), ¶3
     (shipped content is not canon), ¶4 (the loop does not invent canon
     beyond the road) and ¶5 stand unchanged. The road is short and still
     being walked; a beat the overview does not cover does not exist, and
     the loop still says so and stops rather than filling the gap.
  Marker in the tree: `content/story/story-overview.md` (the road);
  `content/story/README.md` is the superseded record of the clearing.

- **THE GROWTH FLOOR (T direct, attended `/oversight` 2026-09-17) — the
  growth mandate gets guaranteed tick budget, and stewards ship small
  gaps instead of filing them.** THE OPEN GATE ¶8 made growth a standing
  mandate; measurement three weeks on showed the mandate had no tick
  budget to spend. Across the logged telemetry window the `adjust-*`
  family was dispatched 34 times and `/forge` once, and `/forge` shipped
  nothing in 30 days. Cause: `/march` Step 3 is first-match-wins, and
  3b's "or more than 36 hours ago" clause re-ripens one of five
  categories faster than the loop ticks, so 3c is almost never reached.
  T's ruling on being shown that:
  1. **A growth floor pre-empts the steward lane.** When `/forge` has
     not shipped in **7 days**, Step 3c runs *before* 3b for that tick
     and the steward category waits its turn. The floor is a schedule
     guarantee, not a licence to skip 3c's own 48h check on an ordinary
     tick.
  2. **Stewards ship small, file large.** A CREATE-shaped finding a
     steward is already authorized to fill is BUILT IN THAT TICK when
     it is small, and only filed as a candidate when it is large.
     **Small** (ship now, no candidate row): at most **3** new items on
     the steward's own surface, reusing existing keywords, effects,
     engine hooks and art, touching only that surface and its
     registries. **Large** (file as a candidate): anything needing new
     engine wiring, a new keyword, new art, a cross-surface change, or
     more than 3 items. When the call is genuinely ambiguous, SHIP THE
     SMALL READING — the failure this ruling corrects is over-filing,
     so the tie goes to shipping, and the residue records the call.
  3. **Re-confirming a filed finding is not a pass's output.** A
     steward that re-derives a gap it already filed either ships it
     under ¶2 or says in the commit body why it is still large. Two
     consecutive zero-diff passes on the same surface is a signal to
     widen the audit, not a clean bill of health.
  This ruling does not touch the verify/deploy gates, the art-provenance
  law, or the LOCKED MECHANICS carve-out. Bigger authority, same rails.

- **Balance doctrines (per encounter):** ~~status-effect play is
  the dominant win path (combat)~~ — **VOID for combat via the
  unshackling above; Phase 43 SHIPPED the replacement objective
  function (CQI, spec 35) on 2026-08-08 — combat readings now judge
  against CQI, not the dead status-dominance law.** Still live for the
  minigames:
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
  - March stays at 4×/6h for now. If overage still stings, the
    next levers (loop-managed since THE OPEN GATE ¶7, in order)
    are march 2×/day, then a self-hosted runner (only inside a
    dedicated VM — the loop runs `--dangerously-skip-permissions`).
  - The weekly tuning crons stay disabled for budget reasons; the
    loop may re-enable them when it judges the minutes budget
    supports it (THE OPEN GATE ¶7), documenting the change.
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
