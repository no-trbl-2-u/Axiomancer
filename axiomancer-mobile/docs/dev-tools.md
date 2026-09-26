# Dev tools — the `/dev` route

> Reference for the developer surface rebuilt in the 2026-09 dev-tools
> audit. Reached from the SELF tab's **DEV TOOLS** link
> (`self-dev-tools-link`) in dev builds; production renders an inert
> placeholder. Gate: `isDevToolsEnabled()` in `lib/buildProfile.ts`
> (browser harnesses opt in with `globalThis.__AXM_FORCE_DEV_TOOLS__`).

## Boot from a state fixture (2026-09-07)

A dev build (or a `BUILD_PROFILE=preview` export, or any export with
`globalThis.__AXM_FORCE_DEV_TOOLS__ = true`) can boot straight into a
known game state instead of the persisted save:

| Channel | Example | Notes |
|---|---|---|
| URL deep link (web) | `/exploration?fixture=sage-fv-boss-gate` | Hand-typable; any route works, the fixture applies before the store mounts |
| Init-script global | `globalThis.__AXM_FIXTURE__ = 'wanderer-nf-village'` or an inline fixture object | `scripts/fixture-injector.mjs` → `injectStateFixture(context, …)` |

Ids come from the engine registry (`STATE_FIXTURES`;
`npm run game -w axiomancer-mechanics -- --fixture list`). The run is
**ephemeral** — the AsyncStorage save slot is never read into the store
nor written — and a fixture with `arrive: true` fires the current node's
event once navigation is ready (`components/FixtureBoot.tsx`), so
`/dialogue`, `/village`, `/cutscene`, `/event` open cold.
The title menu is skipped on a fixture boot. Production ignores both
channels (`persistence/fixture-boot-ignored`); an unknown id or invalid
document falls back to a normal boot (`persistence/fixture-boot-failed`
carries the field-path problems). Code: `state/fixtures.ts`,
`state/persistence/fixtureBootAdapter.ts`; proof: `npm run e2e:fixture`.
In Jest, `test-utils/fixtureStore.ts` boots the same documents.
Guide: `docs/state-fixtures.md` at the monorepo root.

## Skip the current event (2026-09-26)

A playtest escape hatch for AI drivers stuck on a node they cannot finish.
`skipCurrentEvent(store, actions)` (`state/dev/skip-event.ts`) resolves
whatever the player is in with a plausible outcome and leaves the state
consistent — node consumed, rewards applied, session cleared, checkpoint
taken — by driving the same store actions the screens use:

| In | Resolves as |
|---|---|
| live fight, or a pending combat prelude | VICTORY through the engine's real `endCombat` (XP, loot, quest objectives, level-ups). The engine combat sim (`runOneEncounter`, greedy witness) plays it first; its outcome rides the log and its HP toll (capped at half max VITAE, never fatal) is taken. No card draft. |
| hazard | median crossing: `complete` tier, ceil(rounds/2) cleared, engine outcome path, first offered card claimed |
| rest | the free REST offer, claimed |
| loot-cache | the ITEM offer, claimed |
| blacksmith | leave unchanged, claimed |
| interaction / narration / village / cutscene / gathering | dismissed (the screen pops itself) |
| queued item reward | every item confirmed |
| nothing active, arrival owed on the node under the player | the node's event fires, then resolves as above; a travel door reports the crossing |

Two ways in, both dev-tools-gated (production: logged no-op, nothing
loaded — the module and the sim it imports are only reached by lazy
imports behind `isDevToolsEnabled()`):

| Channel | Where | Returns |
|---|---|---|
| `/dev` → ENCOUNTERS → SKIP EVENT (`debug-skip-event-button`) | `components/DebugSkipEvent.tsx` | feedback line, then jumps to WILDS |
| `globalThis.__AXM_SKIP_EVENT__()` | installed by `components/DevSkipBridge.tsx` (mounted lazily from `app/_layout.tsx`) | `{ kind, nodeId, outcome, detail? }` — `kind` is the map-event kind (`encounter`, `hazard`, …, `item-reward`, or `none`), `outcome` a short token (`victory`, `complete:2/3`, `rest:healed=9`, `dismissed`, `nothing-to-skip`, `ignored:dev-tools-disabled`) |

Every call writes `action/dev-skip-event` to the AXM log
(`__AXM_LOG__.entries({ kind: 'dev-skip-event' })`), so captured logs show
each skip. The in-place combat overlay tears down via `_devSkipSeq` on the
store (watched by the exploration screen). Not covered: a fight hosted by
`/labyrinth`, and the `/combat-encounter` sandbox (its state is panel-local
and persists nothing). Tests: `state/dev/__tests__/skip-event.test.ts`.

## Layout

| File | Role |
|---|---|
| `app/dev/index.tsx` | Route shell: header + back + `<DevToolsSections>` |
| `components/dev/DevToolsSections.tsx` | Section grouping; every leaf is `React.lazy` so prod bundles never import `Debug*` |
| `components/dev/DevControls.tsx` | Shared primitives: `DevRow`, `DevButton`, `DevChip(s)`, `DevButtons`, `DevKv` |
| `components/Debug*.tsx` | One leaf per control group (behaviour only; styling comes from the primitives) |
| `state/dev/*.ts` | Pure, React-free helpers the leaves call (each with a hermetic test) |

Sections read top-down in the order a tester thinks: **see state → shape
the player → shape the deck → stand somewhere → fight / play a minigame →
collect rewards → drive the story → tweak the UI → manage the run and
read the log.** Section container ids are `dev-section-<key>`.

## Sections and controls

### STATE — `dev-section-state`

| Leaf | Helper | What it does |
|---|---|---|
| `DebugStateInspector` | `state/dev/inspector.ts` → `selectInspectorSections` | Live read-only key/value view. Groups: RUN (run id, save version, rng, open session), PLAYER (level/xp/points, vitae, stats, shillings, souls, effects, moral, alignment), DECK & GEAR (known/reward cards, removals, hazard deck, dice, die gear, worn relics, inventory), WORLD (continent/map/node, node counts, maps done/open/locked, goodwill, exploited/spared), STORY (quests, journal, flags), THE APORIA (act, acts done, completed, pocket, gates, debt, waystones, boss outcomes). Tap a chip to expand a group. |

### PLAYER — `dev-section-player`

| Leaf | What it does | Test ids |
|---|---|---|
| `DebugPresetPicker` | Rebuild the player from an engine archetype (apprentice / wanderer / sage) | `debug-preset-<id>` |
| `DebugPlayerTierPresets` | Rebuild at L1 / L15 / L30 / L50 via `levelLadderPresets` | `debug-player-tier-<id>` |
| `DebugXpGrant` | +100 XP, +1000 XP, or force a LEVELUP through the engine dispatch (`state/dev/rewards.ts`) | `debug-xp-grant-button`, `debug-xp-grant-large-button`, `debug-xp-levelup-button` |
| `DebugCurrencyControl` | +50S, +500S, BROKE (wallet to zero) | `debug-currency-{small-grant,large-grant,broke}` |
| `DebugAlignmentShift` | ±10 on epistemology / outlook / scope; ±25 on the moral meter | `debug-align-<axis>-{plus,minus}`, `debug-moral-{plus,minus}` |
| `DebugEffectApply` | One chip per buff/debuff in `effectsLibrary` (engine `applyEffect`); CLEAR | `debug-effect-<id>`, `debug-effect-clear` |

### DECKS & ITEMS — `dev-section-decks`

| Leaf | What it does | Test ids |
|---|---|---|
| `DebugHazardDeckRandomize` | Hazard deck presets and a random deck | `debug-hazard-deck-preset-<id>`, `debug-hazard-deck-randomize` |
| `DebugPopulateAllItems` | One of every relic + consumable into the satchel | `debug-populate-all-items` |
| `DebugItemPicker` | One chip per relic (red) and consumable → `actions.addItemById` | `debug-item-<id>` |

### WORLD — `dev-section-world`

| Leaf | Helper | What it does | Test ids |
|---|---|---|---|
| `DebugWorldTravel` | `state/dev/world-travel.ts` | **Map chips** travel to any map on any continent (start node). **Node chips** jump to a node on the current map and fire its authored event through the live `resolveCurrentMapEvent` (travel doors in red). **RESET MAP** re-seeds the map; **COMPLETE MAP** stamps it done and unlocks the next. **THE APORIA** act buttons enter act I / II / III and open `/labyrinth`. | `debug-travel-map-<map>`, `debug-travel-node-<id>`, `debug-map-reset-button`, `debug-map-complete-button`, `debug-aporia-act{1,2,3}` |
| `DebugFlags` | `state/dev/flags.ts` | Chips for the tutorial-done flags, the starter-bundle pick, and the hazard hex; ALL TUTS ON / OFF | `debug-flag-<flag>`, `debug-flags-tuts-{on,off}` |

### ENCOUNTERS — `dev-section-encounters`

| Leaf | What it does | Test ids |
|---|---|---|
| `DebugTriggerEncounter` | Quick triggers on the WILDS tab: COMBAT (gentlest foe), BOSS, HAZARD, REST, GATHER, TREASURE, VILLAGE, CUTSCENE | `debug-trigger-encounter-<kind>` |
| `DebugEnemyPicker` | Any foe from any roster (`EnemiesByMap`), bosses in red; stages a real combat prelude so rewards pay out (`state/dev/enemy-picker.ts`) | `debug-enemy-map-<map>`, `debug-enemy-<enemyId>` |
| `DebugCombatSandbox` | `/combat-encounter` sandbox (mock foe, nothing persists): ASSEMBLE, TEACH (`?tutorial=1`) | `debug-combat-encounter-button`, `debug-combat-tutorial-button` |
| `DebugSkipEvent` | SKIP EVENT — resolve whatever the player is in (or the arrival owed on the node under them) with a plausible outcome and jump to WILDS; see "Skip the current event" below (`state/dev/skip-event.ts`) | `debug-skip-event-button` |

### MINIGAMES & REWARDS — `dev-section-rewards`

| Leaf | What it does | Test ids |
|---|---|---|
| `DebugHazardButton` | Start a hazard (BRAVE IT) or the pinned tutorial crossing | `debug-hazard-button`, `debug-hazard-tutorial-button` |
| `DebugRestButton` | Start the night watch at a camp or an inn | `debug-rest-button`, `debug-rest-inn-button` |
| `DebugBlacksmithButton` | Open the Anvil with the witness variant | `debug-blacksmith-button` |
| `DebugRewardTriggers` | RELIQUARY MODEST / RICH (loot-cache tiers), ANVIL ×500 (fixed budget), UNLOCK JOURNAL (every foe codex entry), KNOW ALL CARDS, and one chip per authored hazard id (`state/dev/rewards.ts`) | `debug-cache-button`, `debug-cache-rich-button`, `debug-anvil-budget-button`, `debug-journal-unlock-button`, `debug-learn-all-cards-button`, `debug-hazard-id-<id>` |

### STORY — `dev-section-story`

| Leaf | Helper | What it does | Test ids |
|---|---|---|---|
| `DebugDialogueJump` | `state/dev/story-catalog.ts` → `listNpcs` | One chip per staged NPC with a tree (all maps); opens `/dialogue` with the real tree | `debug-dialogue-<map>-<npc-slug>` |
| `DebugQuestState` | `listQuests` | One chip per authored quest with live status; START / ADVANCE / COMPLETE the selected one through the engine reducers | `debug-quest-<name>`, `debug-quest-{start,advance,complete}` |

### UI — `dev-section-ui`

| Leaf | What it does | Test ids |
|---|---|---|

### RUN & DIAGNOSTICS — `dev-section-run`

| Leaf | What it does | Test ids |
|---|---|---|
| `DebugRunControls` | SAVE, RESET RUN (keep character), NEW RUN; gallery links to `/devart`, `/devart/rooms`, `/devaftermath?panel=defeat|parley` | `debug-run-{save,reset,new}`, `debug-gallery-{enemy-art,rooms,defeat,parley}` |
| `DebugLogViewer` | AXM Log ring buffer with level / domain filters and the previous-session tail | `debug-log-viewer`, … |

## Retired in the 2026-09 audit

| Removed | Why |
|---|---|
| `DebugLootRarityButtons`, `state/dev/loot-rarity.ts`, `loot*Item` actions, `scripts/loot-rarity-e2e.mjs` | The rarity model was retired in Phase 21; all four buttons granted the same relic. |
| `DebugEncounterButtons` | Duplicated the rest + cache launchers and collided on `debug-rest-button`. |
| `DebugPlaythroughPresets` (FRESH / ENDGAME) | Raw `setState` with a hand-rolled card list; superseded by the L1–L50 ladder. |
| `DebugSeedButton` | Composite of POPULATE + RESET MAP; the `debugSeed` action is dev-only and on demand — nothing auto-seeds at launch since 2026-09-23 (a new game starts empty in every build). |
| `DebugAporiaButton`, `DebugMapResetButton` | Folded into `DebugWorldTravel`. |
| `DebugCombatEncounterButton`, `DebugCombatTutorialButton` | Merged into `DebugCombatSandbox`. |
| `DebugAddItemById` | Free-text input replaced by `DebugItemPicker` chips. |
| HIDE MANA / HIDE STANCE toggles | The HUD presenter never read them. |
| `DebugHudOverrides`, the `devOverrides` store slice, `state/presenters/combat-hud.engine.ts` | HIDE EFFECTS fed a presenter no screen rendered, so the toggle was a no-op (TRIM THE FAT T3, 2026-09-25). |
| `DebugCombatDeck`, `applyCombatDeckPreset` / `randomizeCombatDeck` actions | Superseded by the Deck tab (TRIM THE FAT T3, 2026-09-25). |
| Synthetic OMEN / FRIEND / NARRATION trees, two synthetic quests | Replaced by the real NPC and quest catalogues. |

## CI coupling

`scripts/ci-e2e-scope.mjs` (monorepo root) maps `Debug*` files to the Playwright journey
they can launch (`DebugEnemy|DebugQuest|DebugRest|DebugReward|
DebugTriggerEncounter|DebugWorld` → encounters; `DebugHazard*` → hazard;
`DebugCombat*` → combat). Browser scripts depend on these ids staying
stable: `self-dev-tools-link`, `debug-trigger-encounter-*`,
`debug-preset-*`, `debug-hazard-button`, `debug-combat-encounter-button`,
`debug-currency-large-grant`, `debug-blacksmith-button`,
`debug-rest-button`, `debug-cache-button`, `debug-player-tier-*`.
