---
description: World map/event balance loop — seeded policy probes over the pure engine to analyse MapEvent kind spread, hazard/rest payload economy, and encounter difficulty scaling per map against the authored per-map doctrine; numeric changes + report via PR.
---

> **⚙️ Runs against the `axiomancer-mechanics` package.** Repo-relative paths below
> (`src/…`, `automation/…`, `scripts/…`) are relative to that package — run from it (`cd axiomancer-mechanics`) or via
> `npm run <script> -w axiomancer-mechanics`.

# Skill: world-tuning

> **High autonomy within hard guardrails.** Analyse `axiomancer-mechanics`'s
> World layer map/event balance — MapEvent pool weights and kind spread,
> hazard/rest/gathering payload magnitudes, and encounter difficulty scaling
> — against the shipped per-map doctrine. Deliver findings and any numeric
> changes on ONE new branch + PR. Nothing auto-lands on `main`.

## North star — every map earns its shape on purpose

Each map's authored `MapEventPool` spread (`src/World/MapEvents/content.ts`)
is a deliberate curve, not a random mix: the fishing-village new-player map
is combat-focused but varied (encounters/interaction/rest tied for largest
at 4 apiece, recovery and texture nodes filling the rest, exactly one boss —
Phase 61 retired the quest-board kind entirely, so no map authors it any
more); later maps and continents lean the spread differently as the doctrine
dictates. Two contracts are LOCKED — never tune against them:

1. **Encounters never scale below the source enemy's own level.** An
   authored `enemySlug` with no explicit `level` scales up to the player,
   never down (`resolveEncounter` in `handlers.ts`) — a tuning change may
   never invert this floor.
2. **The dispatcher owns node lifecycle, handlers own state deltas only.**
   Handlers stay pure `(state, payload, rng) → { state, event }`; tuning
   here changes payload NUMBERS in `content.ts`, never dispatcher or
   handler control flow.

The tunable doctrine on top:

> **A map's event-kind spread should read as intentional pacing, not noise.**

The witness is a player who can feel a map's personality (a boss-forward
combat map, a recovery-heavy waypoint, a quest-dense hub) from the kind
distribution alone. If every map reads as the same random grab-bag, the
per-map authoring — the whole point of weighted pools — is dead weight.

## 1. Purpose

`/world-tuning` is the World map/event balance loop. It reads the shipped
per-map pools and payload content (`src/World/MapEvents/content.ts`),
exercises the dispatcher with seeded pool draws, interprets results against
the targets below, and delivers a report — with any applied numeric changes
and any applied structural fixes — on one branch and PR (THE OPEN GATE ¶5,
2026-08-28: structural findings may ship, not just get proposed).

The empirical witnesses, in order of preference:

1. **The hermetic e2e suite** —
   `src/World/MapEvents/e2e/content.engine.test.ts`. It pins each map's kind
   spread (e.g. fishing-village's encounter plurality + single quest/boss),
   per-node kind resolution, and full-kind coverage across the authored maps.
2. **Seeded policy probes** — no `world.sim.ts` exists yet; building one
   with codified per-map kind-spread bands (mirroring `World/Hazard/hazard.sim.ts`)
   is in scope for this loop to ship directly (THE OPEN GATE ¶5), not just
   a standing suggestion. Until it lands, probe with a scratch driver over
   ≥ 50 seeds per
   map, walking every authored node via `resolveMapEvent` and recording the
   kind-frequency histogram, hazard damage taken, rest heal granted, and
   gathering yield per full walk.

## 2. Invocation

```
/world-tuning
/world-tuning --focus="kind spread"
/world-tuning --focus="hazard payloads"
/world-tuning --focus="rest payloads"
/world-tuning --focus="encounter scaling"
```

## 3. Autonomy contract

- **Numeric and content-level only.** The skill may change pool entry
  `weight`s, hazard `damage`/`effectIds` magnitudes, rest `healFraction`
  values, gathering item quantities, and encounter `level` pins inside
  `src/World/MapEvents/content.ts`. **NEW CONTENT ITEMS are in scope**
  (THE PIPELINE LIBERATION, T direct 2026-08-22 — `plan/bearings.md`):
  new pool entries, new pools, new authored events, new maps/continents
  (registered end-to-end: `map.library.ts` union + `map.registry.ts` +
  a mobile layout with the parity test green), and new `MapEventKind`
  values — a new KIND or persisted field still rides
  `GAME_STATE_VERSION` with a migration hop + pinned migration test.
  Dispatcher/handler CONTROL FLOW may also ship directly, as a proven
  structural fix, through the verify + deploy gates like any other change
  (THE OPEN GATE ¶5, 2026-08-28) — the two locked contracts below still
  bound what a control-flow change may do.
- **The two contracts are locked.** Anything that lets an authored encounter
  scale below its source enemy's level, or that moves node-lifecycle logic
  out of the dispatcher, is rejected outright.
- **Baseline before delta; evidence before edits; same seeds re-run after;
  `npm run verify` after any change; one PR carries everything; unknown is
  acceptable, false certainty is not.** (Identical contract to the sibling
  tuning skills — see `/hazard-tuning` for the long form.)

## 4. Design targets (the objective function)

| Axis | Target |
|---|---|
| Encounter floor | scaled encounter level ≥ `max(source.level, player.level)` on EVERY seed (hard invariant) |
| Kind spread per map | matches the map's authored personality (e.g. fishing-village: encounter/interaction/rest tied for largest, exactly 1 boss node) |
| Kind coverage | every `MapEventKind` value fires at least once across the authored maps |
| Hazard teeth | hazard payload damage is felt but never lethal on its own (bounded well under a fresh player's `maxHealth`) |
| Rest generosity | rest payload `healFraction` meaningfully restores without trivializing the map's hazard/encounter density around it |
| Gathering payoff | gathering payload item counts feel like a real detour reward, not filler |

Doctrine constants (`src/World/MapEvents/content.ts`): fishing-village is the
new-player map (25 nodes, encounter/interaction/rest tied for largest at 4
apiece, 1 boss node `fv-6` — no quest-board kind since Phase 61 retired it);
northern-forest exercises the fuller `MapEventKind`
roster per node. Re-derive exact per-node counts from the current content
file before relying on them — this doc intentionally does not restate the
full node table so it can't drift from `content.ts`.

## 5. The procedure

1. **Sync & sanity** — clean tree; cold-run
   `npx vitest run src/World/MapEvents src/World`.
2. **Read the surfaces** — `content.ts` (every pool + payload), the
   dispatcher (`resolve-map-event.ts`), the handlers (`handlers.ts`, for
   what each payload actually does to state), and the e2e suite (so you
   know what each band actually measures).
3. **Run the evidence matrix** — e2e + the seed × map probe (walk every
   authored node per map, ≥ 50 seeds). Keep raw outputs in `/tmp`.
4. **Map evidence against targets**, explaining mechanisms (e.g. "the
   kind-plurality shifted because a reweighted pool entry pulled draws
   toward `hazard` — the pool weight is the lever, not the dispatcher").
5. **Apply numeric changes** one axis at a time; re-probe the same seeds;
   `npm run verify` after each; band moves are deliberate and documented
   or reverted.
6. **Cross-package verify** — before opening the PR, run
   `git diff --name-only` against the changed paths; if any match the
   cross-package impact checklist in `AGENTS.md`, run
   `npm run verify -w axiomancer-mobile` and block the PR on failure.
7. **Deliver** — one branch, one PR. Write the findings + any applied
   changes to `docs/reports/world-tuning-<ts>.md` (create `docs/reports/`
   if it doesn't exist yet); commit
   `balance(world): <ts> report + suggestions (<n> changes applied)`; push
   and open a PR (ready for review, never draft, never auto-merged).
   Buildable when it earns its place: a `world.sim.ts` with codified
   per-map kind-spread bands, mirroring `World/Hazard/hazard.sim.ts` (THE OPEN GATE
   ¶5 — no longer propose-only).

## 6. Hard rules

- **Never push to `main` automatically. Never auto-merge. T approves.**
- **Never bypass `npm run verify`.**
- **Never edit `resolve-map-event.ts` or `handlers.ts` control flow for
  tuning purposes.** The tuning surface is payload NUMBERS in `content.ts`
  only.
- **New `MapEventKind` values, pools, maps, and continents are legal
  content additions** (THE PIPELINE LIBERATION, 2026-08-22) — shipped
  end-to-end with their registrations, mobile parity, migration
  discipline for persisted shapes, and tests; never half-registered.
- **Never invert the encounter-scaling floor** (locked contract #1 above).
- **No emojis. No `Co-Authored-By:`.**

## 7. Failure modes

1. **A kind-spread deviation traces to the dispatcher, not a pool weight.**
   Flag as an engine gap; do not attempt a numeric workaround in `content.ts`.
2. **An e2e band breaks after a weight change with no deliberate rationale.**
   Revert; record under "Considered but not applied".
3. **Focus matches no map/event axis.** Run the full sweep and note the
   empty filter.

## 8. Quick reference

**Tuning surface:**
- Content: `src/World/MapEvents/content.ts`

**Engine (read-only for this skill):**
- `src/World/MapEvents/resolve-map-event.ts`, `handlers.ts`, `types.ts`
- `src/World/encounter.ts` (`generateEncounter`, `scaleEnemyToLevel`)

**Evidence:**
- Engine e2e: `src/World/MapEvents/e2e/content.engine.test.ts`
- CLI: `npm run game` (walk a map interactively via the game CLI)

**Doctrine:** `docs/world.md` · `CLAUDE.md` (load-bearing doctrine).

**Related loops:** minigame-specific payload economies (hazard content
fired FROM a map node) → its own sibling skill (`/hazard-tuning`); this
skill owns only the map-level pool weights and dispatch-level payload
magnitudes. The rest and loot-cache nodes are both one-shot player
choices now (`World/RestChoice`, `World/LootCacheChoice`), not tuning
loops — Phase 52f owns rest's shilling pricing, not this skill or a
`rest-tuning` sibling (retired in Phase 52e). `quest-board-tuning` was
retired in Phase 61 along with the Quest Board minigame it tuned,
`gathering-tuning` in Phase 76 along with Gathering, and
`loot-cache-tuning` in Phase 63 along with the Pick Pool minigame.
