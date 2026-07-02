# Quickstart — what's shipped + how to test it

> A single-page tour of `axiomancer-mechanics`: what runs today, how
> to drive the CLI through every major surface, and where to look
> when you want more depth. Audience: someone landing on the repo
> without context.
>
> For the public API reference see [`docs/api.md`](./api.md).
> For test layers see [`docs/testing.md`](./testing.md).
> For release / publish flow see [`RELEASING.md`](../RELEASING.md).

---

## 1. What's shipped (module by module)

The engine ships eleven modules; each exports a small set of
canonical entry points. Cross-link to the per-module doc for depth.

| Module | Marquee surface | Phases | Doc |
|---|---|---|---|
| **Character** | `createCharacter`, presets (`apprentice`/`wanderer`/`sage`), equipment + stat allocation, `Character.id` auto-gen | 18, 29, 35 | [character.md](./character.md) |
| **Combat** | `resolveCombatRound`, per-phase split (`Combat/phases/*`), stat accessors, advantage / crit / friendship | 9, 15, 32, 36, 38 | [combat.md](./combat.md) |
| **Effects** | `applyEffect`, Tier 1-3 procs, `statModifiers` + intensity scaling, fallacy payloads | 1, 3, 38, 44, 48 | [effects.md](./effects.md) |
| **Enemy** | `createEnemy`, AI strategies + outlook-bias (Phase 45), enemy-skill caster path (Phase 49), per-enemy alignment + `friendshipReward` (+ Phase 69 `alignmentDelta`) + Phase 68 `BefriendabilityConfig` | 7, 45, 49, 57, 60, 62, 68, 69 | [enemy.md](./enemy.md) |
| **Game** | `createGameStore`, save/load + migrators (`GAME_STATE_VERSION` 7), event surface, autosave throttling, persistence adapters, run-loop semantics (`resetRun` + `runId`), Codex slice | 9, 11, 12, 21, 35, 38, 50, 51, 55, 72, 73 | [gameloop.md](./gameloop.md) |
| **Items** | `addItem` / shop reducers (`buyItem`/`sellItem`/`defaultSellPrice` — Phase 37), set items engine (Phase 54), `previewTemplateAtRarity` UI-tier preview helper (Phase 75 — closes the user-jot for mobile item-library mod-visibility), `previewTemplateAtAllRarities` batch wrapper (Phase 76 — UI tooltip / item-detail rarity-strip views in a single call) | 5, 5b, 37, 54, 75, 76 | [items.md](./items.md), [equipment.md](./equipment.md) |
| **NPCs** | `getDialogueNode` + `visibleChoices`, alignment gates (Phase 46), tree-id observer cache (Phase 63) | 14, 22, 46, 63 | [npcs.md](./npcs.md) |
| **Philosophy** | 3-axis alignment cube + 27-cell library, `alignmentDelta` authoring, fallacies-as-spells (Phase 44), enemy alignment + AI bias (Phase 45), alignment-gated content (Phase 46) | 42-46 | [philosophy.md](./philosophy.md) |
| **Skills** | `executeSkill` caster-agnostic (Phase 49), `learnSkill` + runtime learning (Phase 30), Tier 1-3 skill library + Tier 2 synergy clauses (Phase 66) | 4, 4b, 30, 33, 44, 49, 66 | [skills.md](./skills.md) |
| **World** | `createStartingWorld` + per-continent maps, MapEvents engine (`resolveMapEvent`, nine-kind pool taxonomy — Phase 23/24, 'quest' added Phase 137), expanded fishing-village (Phase 65 — 25 nodes, 3 sub-areas) | 8, 23, 24, 25, 31, 65 | [world.md](./world.md) |
| **Utils** | RNG harness, derived stats, dice / type guards | 11 | — |

Marquee mechanics shipped end-to-end: moral meter (Phase 10), set
bonuses (Phase 54), befriendable enemies with per-enemy reward
content + flag-gated dialogue (Phase 60 / 62), and the Tier 2
synergy primitive (Phase 66 — five authored skills covering
duration / intensity amps, buff type-swap, resonance burst, and
the resonance-detonation apex burn).

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
| **Self** | View items, allocate stat points (Phase 29), learn skills (Phase 30) |
| **Map** | Walk available nodes, resolve MapEvents (`resolveMapEvent`), see discovered / consumed nodes |
| **Combat** | When `state.combat !== null`, pick stance + action / skill / item per round (resolved through `resolveCombatRound`) |
| **Save / Load** | Persistence via the configured `PersistenceAdapter` (default: file slot via `--save-file`) |
| **Debug** | Spawn arbitrary enemies for testing (`debugSpawn`); useful for combat / loot validation |
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

Ten authored walkthroughs at `automation/scripts/walkthroughs/`; each
ships a `<name>.json` script + `<name>.goal.md` test spec. Run via:

```bash
node automation/agent-e2e.mjs <name>     # agent-graded; needs ANTHROPIC_API_KEY
npm run game -- --script automation/scripts/walkthroughs/<name>.json  # direct replay
```

| Walkthrough | What it exercises | Preset | Enemy |
|---|---|---|---|
| `boss-encounter` | Long combat loop driving a boss-tier enemy through `debugSpawn` + body attacks | sage | coastal-tyrant |
| `character-sheet` | Character tab rendering (Phase 26 unit 3) | apprentice | — |
| `endgame-loadout` | **Phase 64** — Tier 3 skill (`bootstrap-paradox`) + boss combat + enemy alignment bias | sage | coastal-tyrant |
| `item-use` | In-combat `item` action consuming a `healing-potion` | wanderer | sandbag (debug) |
| `map-events` | Map tab + `resolveMapEvent` dispatcher firing on `fv-2` | apprentice | — |
| `save-load` | Save / Load tabs + `--save-file` slot + Phase 31 fv-1 → fv-2 → fv-3 rollback | apprentice | — |
| `shop` | Phase 37 `buyItem` / `sellItem` round-trip + `defaultSellPrice` invariant | wanderer | — |
| `skill-learning` | Character-tab Learn prompt (Phase 30 unit 3) | wanderer | — |
| `skills-in-combat` | In-combat `skill` action with `ad-hominem-strike` | wanderer | wet-hound (debug) |
| `stat-allocation` | Phase 29 stat-allocation prompt loop driven by post-combat level-ups | sage | coastal-tyrant |

See [`automation/scripts/walkthroughs/README.md`](../automation/scripts/walkthroughs/README.md) for
the full inventory + exit expectations.

---

## 4. Key in-game flows

### Combat round → friendship path

1. Enter combat: `store.startCombat(enemy)` (or `Encounter` for
   multi-enemy; length-1 today).
2. Each round: pick `{ stance, action }` for the player; the resolver
   computes the enemy's basic action (or skill if Phase 49 enemy-
   skill rotation fires) and runs `resolveCombatRound`.
3. **Victory path** — when `enemy.health <= 0`, `endCombat()` reports
   `outcome: 'victory'`, grants full XP + the weighted loot roll.
4. **Friendship path** (Phase 36) — both combatants picking `defend`
   on the same round increments `combat.friendshipCounter`. When it
   reaches `FRIENDSHIP_COUNTER_MAX` (3), `endCombat()` reports
   `outcome: 'friendship'`, grants half-XP + full loot + a +1
   moralMeter shift.
5. **Per-enemy `friendshipReward`** (Phase 60 + 62) — if the
   befriended enemy carries an authored `friendshipReward`, items
   append to `report.loot`, `xpBonus` adds to `report.xpGained`,
   and `narrative` surfaces on `report.friendshipReward.narrative`
   for the CLI to render. `friendshipReward.flagSet` (Phase 62)
   sets a world flag for downstream `requires.flag` dialogue gates.
6. **Per-enemy befriend predicate** (Phase 68) — if the enemy
   carries `Enemy.befriendabilityConfig`, the Phase 36 cap is
   overridden by an AND-composed predicate set (`roundsThreshold`
   / `hpGate { belowPct }` / `requiredStances[]` / `requiredSkillUse[]`
   / `defaultFallback`). The internal helper `isFriendshipEligible`
   is the single decision point; `determineCombatEnd` and
   `isCombatOngoing` both call it so the two predicates stay in
   lockstep. Counter still increments freely; friendship triggers
   only when all named predicates pass together — late-resolution
   semantics. First boss-tier authored config: `CoastalTyrant`
   (`hpGate { belowPct: 0.4 }`, `requiredStances: ['heart']`,
   `roundsThreshold: 5`).
7. **Per-enemy `alignmentDelta` on friendship** (Phase 69 — closes
   Spec 14 Q4) — if the befriended enemy carries
   `friendshipReward.alignmentDelta?: Partial<PhilosophicalAlignment>`,
   the END_COMBAT reducer applies the delta to
   `state.philosophicalAlignment` via the Phase 42 `applyAlignmentDelta`
   clamp helper (each axis clamps to `[-100, +100]`; missing axes pass
   through). The post-clamp `PhilosophicalAlignment` surfaces on
   `report.friendshipReward.alignmentShift` for the CLI / UI to render.
   Phase 36's +1 `moralMeter` stays on top. Authoring band: ±1..±5 per
   axis.

Two normal-tier befriendable enemies ship authored content today
(Phase 60 + 65 + 69) — both default to the Phase 36 mechanic:

- **MournfulGull** at `fv-15` (gull crag, harbor district dead-end
  via `fv-11` → `fv-14`). Phase 69 `alignmentDelta: { outlook: +3 }`.
- **HollowEyedBeggar** at `fv-18` (back alley, inland streets).
  Phase 69 `alignmentDelta: { scope: -3 }`.

CoastalTyrant ships only the Phase 68 predicate today; the matching
`friendshipReward` content (multi-paragraph narrative + boss-tier
items + Phase 69 `alignmentDelta`) is deferred to a follow-up content
phase.

### Map exploration

The starting map `fishing-village` is a 25-node branching grid since
Phase 65 (preserved spine `fv-1` → `fv-10` along `y=0` plus three
sub-areas: Harbor District `fv-11..fv-15`, Inland Streets
`fv-16..fv-20`, Cliff Path `fv-21..fv-25`). Each node fires a
weighted `MapEventPool` on entry per the Phase 23 taxonomy
(encounter / interaction / gathering / rest / village / cutscene /
hazard / loot-cache, plus 'quest' since Phase 137). See [`world.md` § "Demo Content"](./world.md#demo-content-fishing-village)
for the full layout.

### Save / load

`store.save()` writes the current `GameState` (Phase 51 throttled to
durable actions only — `COMBAT_ROUND`, `LEVEL_UP`, `END_COMBAT`,
`MOVE_TO_NODE`, `APPLY_DIALOGUE`, `SAVE_GAME`; Phase 72 added
`RESET_RUN`; Phase 73 added `UNLOCK_CODEX_ENTRY`). `store.load()`
restores via the configured `PersistenceAdapter` + `migrate()` ladder
(`GAME_STATE_VERSION = 7`; `migrateV4toV5` defaults
`philosophicalAlignment` to `{0,0,0}`; `migrateV5toV6` defaults
`runId` via `generateRunId(() => getRng().random())`; `migrateV6toV7`
defaults `codex` to `{ unlockedEntries: [] }`).

For Node consumers, `'axiomancer-mechanics/node'` exports
`createNodeAdapter(filePath)` to persist to a JSON file.
For React Native, implement the `PersistenceAdapter` interface (see
[`gameloop.md` § "Extending PersistenceAdapter"](./gameloop.md)).

### Alignment-gated content (Phase 46 + 63)

Player position on the 3-axis Philosophy cube
(`epistemology × outlook × scope`) drives dialogue + skill-learning
gates:

- `DialogueChoice.requires.requiresAlignment?` — gate a choice on an
  axis threshold (e.g. `{ axis: 'scope', op: 'gte', value: 34 }`).
- `SkillLearningRequirement.requiresAlignment?` — same shape; gates
  whether the skill is learnable.
- `DialogueChoice.requires.playerAlignmentCellChangedSince?: true`
  (Phase 63) — surfaces the choice only when the player's cell has
  shifted since the last visit; requires an identified tree
  (`DialogueTree.id?: string`). First authored use: Old Marrow's
  tree gains an observer branch.

Authoring side: `DialogueChoice.effect.alignmentDelta` + `MapEventPoolEntry.alignmentDelta`
shift the cube on resolution (Phase 43).

---

## 5. Verify + deploy gates

```bash
npm run verify       # type-check + lint + tests + build
npm run deploy:check # 4 structural assertions + npm pack --dry-run
```

The `verify` gate enforces:
- TypeScript strict (`tsc --noEmit`).
- ESLint (flat config, `@typescript-eslint` plugin; warnings advisory).
- Vitest hermetic suite (`src/**/e2e/*.engine.test.ts`).
- Build (`tsc && tsc-alias` → `dist/`).

The `deploy:check` gate adds:
- `dist/` presence + types.d.ts count matches `src/` count.
- Latest git tag matches the top tagged CHANGELOG heading (Phase 52).
- Public-surface snapshot matches `scripts/public-surface.expected.json` (Phase 53).

Both gates run on every PR + push to `main` via the Phase 56 CI workflow
(`.github/workflows/verify.yml`).

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
| Character | [quickstart-character.md](./quickstart-character.md) | `createCharacter`, presets, stat allocation, skill learning |
| Combat | [quickstart-combat.md](./quickstart-combat.md) | `initializeCombat`, `resolveCombatRound`, event stream, friendship path |
| Items | [quickstart-items.md](./quickstart-items.md) | `dropItem`, `previewTemplateAtRarity`, equip, shop, set bonuses |
| Skills | [quickstart-skills.md](./quickstart-skills.md) | `executeSkill`, resource generation, synergy events, Tier 1/2/3 |
| World | [quickstart-world.md](./quickstart-world.md) | `resolveMapEvent`, MapEventPool authoring, `alignmentDelta` |

---

## 7. Where to look when you want depth

| If you're trying to... | Look at |
|---|---|
| Use a public API surface | [`docs/api.md`](./api.md) |
| Understand a module's design | `docs/<module>.md` (per the table in §1) |
| Add a hermetic test | [`docs/testing.md`](./testing.md) |
| Cut a release | [`RELEASING.md`](../RELEASING.md) |
| Re-ground stale consumer types after a bump | [`CHANGELOG.md`](../CHANGELOG.md) `[unreleased]` Migration notes (Phase 61 — the 9-row consumer-side re-grounding table covers `getCoastalMap` / `WorldMap` / `Encounter.enemy` / `DialogueChoice.id`/`.label` / `DialogueNode.speaker` / `Character.mana`/`.maxMana` / `ActiveEffect.id`/`.name` / `EffectStatTarget` / `GameState` index signature) |
| Read about the autonomous-loop workflow | [`agents.md`](../agents.md), [`skills/march.md`](../skills/march.md), [`plan/bearings.md`](../plan/bearings.md) |
| See the per-phase shipping history | [`plan/steps/01_build_plan.md`](../plan/steps/01_build_plan.md), `plan/phases/phase_<N>_*.md` |
| File a finding / feature idea | [`plan/CRITIQUE.md`](../plan/CRITIQUE.md), [`plan/AUDIT.md`](../plan/AUDIT.md), or `braindump/BRAINDUMP.md` for half-formed ideas |
