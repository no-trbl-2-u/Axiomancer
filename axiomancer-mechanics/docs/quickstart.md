# Quickstart — what's shipped + how to test it

> A single-page tour of `axiomancer-mechanics`: what runs today, how
> to drive the CLI through every major surface, and where to look
> when you want more depth. Audience: someone landing on the repo
> without context.
>
> For the public API reference see [`docs/api.md`](./api.md).
> For test layers see [`docs/testing.md`](./testing.md).

---

## 1. What's shipped (module by module)

The engine ships ten modules; each exports a small set of
canonical entry points. Cross-link to the per-module doc for depth.

| Module | Marquee surface | Phases | Doc |
|---|---|---|---|
| **Character** | `createCharacter`, presets (`apprentice`/`wanderer`/`sage`), equipment + stat allocation, `Character.id` auto-gen | 18, 29, 35 | [character.md](./character.md) |
| **Combat** | Hazard-Pattern Combat (`initializeCombatEncounter` / `playCombatCard` / `resolveThreatPhase` / `simulateHazardPatternCombat`), the stance read / friendship | 9, 15, 32, 36, 38, 165+ | [combat.md](./combat.md) |
| **Effects** | `applyEffect`, Tier 1-3 application rules, intensity scaling | 1, 3, 38, 48 | [effects.md](./effects.md) |
| **Enemy** | `createEnemy`, AI strategies, enemy-card caster path (Phase 49), per-enemy `friendshipReward` + Phase 68 `BefriendabilityConfig` | 7, 49, 57, 60, 62, 68 | [enemy.md](./enemy.md) |
| **Game** | `createGameStore`, save/load + migrators (`GAME_STATE_VERSION` 26), event surface, autosave throttling, persistence adapters, run-loop semantics (`resetRun` + `runId`), Codex slice | 9, 11, 12, 21, 35, 38, 50, 51, 55, 72, 73 | [gameloop.md](./gameloop.md) |
| **Items** | `addItem` / shop reducers (`buyItem`/`sellItem`/`defaultSellPrice` — Phase 37), set items engine (Phase 54), `previewTemplateAtRarity` UI-tier preview helper (Phase 75 — closes the user-jot for mobile item-library mod-visibility), `previewTemplateAtAllRarities` batch wrapper (Phase 76 — UI tooltip / item-detail rarity-strip views in a single call) | 5, 5b, 37, 54, 75, 76 | [items.md](./items.md), [equipment.md](./equipment.md) |
| **NPCs** | `getDialogueNode` + `visibleChoices`, quest / flag gates | 14, 22 | [npcs.md](./npcs.md) |
| **Cards** | `executeCard` caster-agnostic (Phase 49), `learnCard` + runtime learning (Phase 30), Tier 1-3 card library + combat-state synergy clauses | 4, 4b, 30, 33, 44, 49, 66 | cards.md |
| **World** | `createStartingWorld` + per-continent maps, MapEvents engine (`resolveMapEvent`, eleven-kind pool taxonomy — Phase 23/24; the Phase 137 'quest' kind was later retired), the four Act 1 maps (Breakwater → Lantern Deep; fishing-village purged in R3b) | 8, 23, 24, 25, 31, 65 | [world.md](./world.md) |
| **Utils** | RNG harness, max VITAE, dice / type guards | 11 | — |

Marquee mechanics shipped end-to-end: set
bonuses (Phase 54), befriendable enemies with per-enemy reward
content + flag-gated dialogue (Phase 60 / 62).

---

## 2. Running the CLI

The repo ships an interactive demo CLI at `src/CLI/game.cli.ts`.

```bash
npm install
npm run game
```

The CLI presents a tab interface (`inquirer`-driven). The canonical
tabs:

| Tab | Surface |
|---|---|
| **Character** | View items, allocate stat points (Phase 29), learn cards (Phase 30) |
| **Map** | Walk available nodes, resolve MapEvents (`resolveMapEvent`), see discovered / consumed nodes |
| **Combat** | Hazard-Pattern Combat via the `combat` subcommand (`npm run combat`): power cards with the round's four dice, resolve the threat phase |
| **Save / Load** | Persistence via the configured `PersistenceAdapter` (default: file slot via `--save-file`) |
| **DEV** | Spawn arbitrary enemies for testing (`debugSpawn`); useful for combat / loot validation |
| **Quit** | Exit cleanly; the engine emits a final `cli:exit` event |

### Scripted CLI mode (Phase 20)

For automation, the CLI accepts a JSON script + optional stdin
agent flag:

```bash
# Replay a scripted walkthrough hermetically.
npm run game -- --script automation/scripts/walkthroughs/boss-encounter.json --save-file /tmp/save.json

# Drive interactively from an external agent via stdin events.
npm run game -- --stdin
```

The scripted mode is what the agent-graded harness drives at
`automation/agent-e2e.mjs <name>`.

---

## 3. Walkthrough catalog — exercise each surface

Sixteen authored walkthroughs at `automation/scripts/walkthroughs/`; each
ships a `<name>.json` script + `<name>.goal.md` test spec. Run via:

```bash
node automation/agent-e2e.mjs <name>     # agent-graded; needs ANTHROPIC_API_KEY
npm run game -- --script automation/scripts/walkthroughs/<name>.json  # direct replay
```

| Walkthrough | What it exercises | Preset | Enemy |
|---|---|---|---|
| `boss-encounter` | Long combat loop driving a boss-tier enemy through `debugSpawn` + body attacks | sage | coastal-tyrant |
| `character-sheet` | Character tab rendering (Phase 26 unit 3) | apprentice | — |
| `endgame-loadout` | **Phase 64** — Tier 3 card (`bootstrap-paradox`) + boss combat | sage | coastal-tyrant |
| `item-use` | In-combat `item` action consuming a `healing-potion` | wanderer | sandbag (debug) |
| `map-events` | Map tab + `resolveMapEvent` dispatcher firing on `bw-4` (a gathering) | apprentice | — |
| `save-load` | Save / Load tabs + `--save-file` slot + bw-1 → bw-4 → bw-5 rollback | apprentice | — |
| `skill-learning` | Character-tab Learn prompt (Phase 30 unit 3) | wanderer | — |
| `skills-in-combat` | In-combat `card` action with `ad-hominem-strike` | wanderer | wet-hound (debug) |
| `stat-allocation` | Phase 29 stat-allocation prompt loop driven by post-combat level-ups | sage | coastal-tyrant |

See [`automation/scripts/walkthroughs/README.md`](../automation/scripts/walkthroughs/README.md) for
the full inventory + exit expectations.

---

## 4. Key in-game flows

### Combat round → friendship path

1. Enter combat: `store.startCombat(enemy)` (or `Encounter` for
   multi-enemy; length-1 today).
2. Each turn (Hazard-Pattern Combat): play cards from hand
   (`playCombatCard`, each PAID line powered by one of the round's dice), then resolve the enemy's telegraphed
   threat phase (`resolveThreatPhase`).
3. **Victory path** — when `enemy.health <= 0`, `endCombat()` reports
   `outcome: 'victory'`, grants full XP + the weighted loot roll.
4. **Friendship path** (Phase 36) — both combatants picking `defend`
   on the same round increments `combat.friendshipCounter`. When it
   reaches `FRIENDSHIP_COUNTER_MAX` (3), `endCombat()` reports
   `outcome: 'friendship'`, grants half-XP + full loot.
5. **Per-enemy `friendshipReward`** (Phase 60 + 62) — if the
   befriended enemy carries an authored `friendshipReward`, items
   append to `report.loot`, `xpBonus` adds to `report.xpGained`,
   and `narrative` surfaces on `report.friendshipReward.narrative`
   for the CLI to render. `friendshipReward.flagSet` (Phase 62)
   sets a world flag for downstream `requires.flag` dialogue gates.
6. **Per-enemy befriend predicate** (Phase 68) — if the enemy
   carries `Enemy.befriendabilityConfig`, the Phase 36 cap is
   overridden by an AND-composed predicate set (`roundsThreshold`
   / `hpGate { belowPct }` / `requiredStances[]` / `requiredCardUse[]`
   / `defaultFallback`). The internal predicate helper backs
   `isBefriendAttemptEligible` (the legacy `isFriendshipEligible` /
   `determineCombatEnd` / `isCombatOngoing` consumers were removed
   with the legacy driver). Counter still increments freely; friendship triggers
   only when all named predicates pass together — late-resolution
   semantics. First boss-tier authored config: `CoastalTyrant`
   (`hpGate { belowPct: 0.4 }`, `requiredStances: ['heart']`,
   `roundsThreshold: 5`).

The befriendable enemies this section once listed (MournfulGull,
HollowEyedBeggar, on fishing-village nodes) were retired in R2a with the
roster, and their map was purged in R3b. The Open Hand becomes the one real
befriend in R4.

CoastalTyrant ships only the Phase 68 predicate today; the matching
`friendshipReward` content (multi-paragraph narrative + boss-tier
items) is deferred to a follow-up content
phase.

### Map exploration

A new game starts on the Breakwater (`breakwater`, D27), the first of
the four Act 1 maps, and moves between maps through `travel` doors.
Movement is frontier roaming (D1): any unspent node next to explored
ground is a legal move. Each node fires a weighted `MapEventPool` on
entry (encounter / interaction / gathering / rest / village / cutscene /
hazard / loot-cache / narration / blacksmith / travel / labyrinth; the
Phase 137 'quest' kind was retired). See [`world.md` § "Campaign maps"](./world.md#campaign-maps)
for the door chain and [§ "Map shape"](./world.md#map-shape) for how a
map is built.

### Save / load

`store.save()` writes the current `GameState` (Phase 51 throttled to
durable actions only — `COMBAT_ROUND`, `LEVEL_UP`, `END_COMBAT`,
`MOVE_TO_NODE`, `APPLY_DIALOGUE`, `SAVE_GAME`; Phase 72 added
`RESET_RUN`; Phase 73 added `UNLOCK_CODEX_ENTRY`). `store.load()`
restores via the configured `PersistenceAdapter` + `migrate()` ladder
(`GAME_STATE_VERSION = 26`; the ladder in `src/Game/game.migrate.ts`
chains `migrateV11ToV12` … `migrateV25ToV26`, and saves older than v11
are refused).

For Node consumers, `'axiomancer-mechanics/node'` exports
`createNodeAdapter(filePath)` to persist to a JSON file.
For React Native, implement the `PersistenceAdapter` interface (see
[`gameloop.md` § "Extending PersistenceAdapter"](./gameloop.md)).

---

## 5. Verify + deploy gates

```bash
npm run verify       # type-check + type-check:tests + type-check:cli + lint + tests + build
```

The `verify` gate enforces:
- TypeScript strict (`tsc --noEmit`), plus the tests tsconfig (`type-check:tests`) and the CLI tsconfig (`type-check:cli`).
- ESLint (flat config, `@typescript-eslint` plugin; warnings advisory).
- Vitest hermetic suite (`src/**/e2e/*.engine.test.ts`).
- Build (`tsc && tsc-alias` → `dist/`).

The deploy gate (`npm run deploy:check`) lives at the monorepo ROOT — run it
from the repo root, not from this package.

The verify gate runs on every PR + push to `main` via the root CI workflow
(`.github/workflows/verify-mechanics.yml`).

For the agent-friendly reporter variant (Phase 39/40) — emits JSON +
markdown rollups including a prior-run diff:

```bash
npm run verify:agent
```

---

## 6. Per-module quickstarts

Focused guides with runnable code samples for each major module:

| Module | Quickstart | Covers |
|--------|-----------|--------|
| Character | [quickstart-character.md](./quickstart-character.md) | `createCharacter`, presets, stat allocation, card learning |
| Combat | [quickstart-combat.md](./quickstart-combat.md) | `initializeCombatEncounter`, `playCombatCard`, threat phases, outcomes, sim |

---

## 7. Where to look when you want depth

| If you're trying to... | Look at |
|---|---|
| Use a public API surface | [`docs/api.md`](./api.md) |
| Understand a module's design | `docs/<module>.md` (per the table in §1) |
| Add a hermetic test | [`docs/testing.md`](./testing.md) |
| Re-ground stale consumer types after a bump | [`CHANGELOG.md`](../../plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/CHANGELOG.md) (archived) `[unreleased]` Migration notes (Phase 61 — the 9-row consumer-side re-grounding table covers `getCoastalMap` / `WorldMap` / `Encounter.enemy` / `DialogueChoice.id`/`.label` / `DialogueNode.speaker` / `Character.mana`/`.maxMana` / `ActiveEffect.id`/`.name` / `EffectStatTarget` / `GameState` index signature) |
| See the per-phase shipping history | [`CHANGELOG.md`](../../plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/CHANGELOG.md) (archived) |
| File a finding / feature idea | `braindump/BRAINDUMP.md` for half-formed ideas |
