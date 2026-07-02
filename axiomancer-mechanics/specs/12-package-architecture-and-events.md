# Spec 12 — Package Architecture & UI Event Surface

## Goal

Define the contract between this engine package and its React Native
consumer: which APIs are public, which are internal, how UI receives events,
and which Node-only modules (`fs`, persistence) must move out of the core.

**Success state:** A consumer can `import { … } from 'axiomancer-mechanics'`
in a React Native app without bundling any Node-only code. Combat / world /
quest events are surfaced through a typed channel the UI can subscribe to.
The package's public API is documented at the source level.

## Why now / dependencies

- **Unblocks:** the React Native UI development.
- **Depends on:** Spec 09 (the orchestration that decides what events
  exist). Spec 08 world primitives are already implemented; Spec 09 must
  compose them into `createGameStore` (or an agreed equivalent).

## Current state

- `src/index.ts` is the public barrel. It exports lots of internal helpers
  alongside genuine public API.
- `Game/persistence/node.adapter.ts` uses `fs` and would not bundle in
  React Native today.
- `package.json` has `zustand` as a runtime dependency and re-exports
  `createGameStore`.
- The combat CLI uses `console.log` for player-facing messages — there's
  no event channel a UI could subscribe to.
- Knowledge-Gaps 23–25 capture the open design questions.

## Open questions

1. **Public API trim.** Today `src/index.ts` re-exports nearly everything.
   Before publishing:
   - (A) Aggressive trim — only the minimum the UI needs.
   - (B) Light trim — drop only obviously internal helpers.
   - (C) No trim — leave the surface wide.
   The bigger the surface, the more work for a future renaming/refactor.
   > Your answer: (C) No trim. `src/index.ts` ships ~150 symbols across
   > every module (Character, Enemy, Combat, Effects, Items, Skills,
   > Game, World, NPCs, Utils, events). The deliberate Phase 21 cleanup
   > (a3f1693) removed only the genuinely dead — `createNodeAdapter`
   > duplicate-export, the seven `create*Event` factories, redundant
   > casts — and left the rest. Rationale: the React Native consumer is
   > internal (one app, one team), so surface-area churn cost is low and
   > the convenience of a single import path is high. Plan an aggressive
   > trim later if the package is ever published externally.

2. **Zustand dependency.** Spec 09 Q1 asks where the store lives. From
   the package perspective:
   - (A) Keep `zustand` as a dep; ship `createGameStore` as the canonical
     consumer entry point.
   - (B) Drop `zustand`; expose only pure reducers; the consumer picks
     their state library.
   - (C) Provide both — pure reducers as primary, `createGameStore` as a
     convenience exported from a sub-path (`'axiomancer-mechanics/store'`).
   > Your answer: A practical hybrid of (A) and (C), but without the
   > separate sub-path: `zustand` is still a runtime dep
   > (`package.json:dependencies`); `createGameStore` is the canonical
   > entry; the pure `gameReducer`, `migrate`, `createNewGameState`,
   > selectors, and `createEventEmitter` are also exported alongside, so
   > a consumer who wants their own state library can opt out without
   > paying the Zustand cost at the reducer layer. The convenience of a
   > single import path beat the sub-path-tree cost.

3. **Persistence adapters.** `node.adapter.ts` uses `fs`. Options:
   - (A) Move it to `src/Game/persistence/node.adapter.ts` behind a
     subpath export so React Native won't reach it.
   - (B) Move it out of the package entirely (into a `dev-tools`
     directory unbundled).
   - (C) Switch the package's `main` to a "core" entry that excludes Node
     adapters; expose them via `'axiomancer-mechanics/node'`.
   > Your answer: (C). `package.json` `exports` field maps
   > `'axiomancer-mechanics'` → `dist/index.js` (core, RN-safe) and
   > `'axiomancer-mechanics/node'` → `dist/node.js`. `src/node.ts` is a
   > four-line re-export of `createNodeAdapter` and the
   > `PersistenceAdapter` type; nothing under that sub-path touches
   > `fs`-free callers. Verified by the Phase 21 cleanup which dropped
   > `createNodeAdapter` from the main barrel (commit e478bdd).

4. **Async storage adapter.** Should this package ship an
   `asyncStorageAdapter` for React Native's `AsyncStorage`, or document
   the interface and let the UI implement it?
   > Your answer: Document the interface; let the UI implement.
   > `src/Game/persistence/types.ts:11` carries an explicit comment:
   > "React Native → implement with AsyncStorage in the app package".
   > Shipping an adapter here would pull `@react-native-async-storage/
   > async-storage` into the engine's peer-dep graph — bad smell for an
   > otherwise platform-agnostic library. The shipped interface
   > (`PersistenceAdapter` with `load()` / `save(state)`) is small
   > enough that the consumer's implementation is ~10 lines.

5. **Event channel shape.**
   - (A) Pure reducers return `{ state, events }`; the consumer subscribes
     by polling state.
   - (B) `EventEmitter` instance exposed on the store.
   - (C) Observable (RxJS or nano-observable).
   - (D) Callback list (`store.onEvent(handler)`).
   > Your answer: (B), implemented in-house rather than via Node's
   > `events` module. `src/Game/events.ts:46-72` exports
   > `createEventEmitter()` returning a `GameEventEmitter` with three
   > methods: `on(type, handler)`, `onAny(handler)`, and `emit(event)`.
   > The store accepts an emitter as an optional ctor arg
   > (`createGameStore(adapter, overrides?, emitter?)`) and emits a
   > typed `GameEvent` after each dispatch. Combat sub-events
   > (DamageDealt, EffectApplied, etc., per Q6) ride inside the
   > `combat:round` payload rather than as separate topics — keeps the
   > top-level taxonomy small and the per-round work atomic. The pure
   > reducer path (`gameReducer(state, action)`) is also exported for
   > consumers who prefer (A).

6. **Event taxonomy.** Initial event types:
   - `CombatStarted` / `CombatEnded` / `RoundResolved` / `EffectApplied`
     / `EffectExpired` / `DamageDealt` / `Healed` / `Crit` / `Fumble`.
   - `LevelUp` / `XPGained` / `SkillLearned`.
   - `MapChanged` / `NodeEntered` / `QuestCompleted`.
   Additions / removals?
   > Your answer: Shipped 10 top-level topics in
   > `src/Game/events.ts:11-21`: `combat:started`, `combat:round`,
   > `combat:ended`, `world:moved`, `world:processed`,
   > `character:levelup`, `inventory:changed`, `dialogue:applied`,
   > `game:saved`, `game:loaded`.
   >
   > Removals from the spec proposal — these collapsed into
   > `combat:round`'s `combatEvents` payload rather than top-level
   > topics: `RoundResolved` (= `combat:round`), `EffectApplied`,
   > `EffectExpired`, `DamageDealt`, `Healed`, `Crit`, `Fumble`. The
   > `RoundEvent` discriminated union in `combat.resolver.ts` carries
   > all of these as sub-events; consumers narrow on
   > `event.payload.combatEvents[].phase`. Rationale: a single fight
   > round emits dozens of sub-events and one top-level topic per
   > round-with-bag is cheaper than fanning out N topics.
   >
   > Folded: `XPGained` (rides inside `character:levelup`'s payload via
   > `report.xpGained`); `MapChanged` ⊂ `world:moved`; `NodeEntered` ⊂
   > `world:moved`. `SkillLearned` and `QuestCompleted` deferred —
   > Phase 30 (skill learning) and the future quest-completion path
   > will add the missing topics.
   >
   > Additions: `inventory:changed` (not in the spec proposal but
   > needed by the Items module path); `dialogue:applied` (Phase 14);
   > `game:saved` / `game:loaded` (the persistence path).

7. **Logging vs events.** Today the CLI uses `console.log`. After this
   spec:
   - (A) Engine emits typed events; `combat.cli.ts` subscribes and renders
     to terminal.
   - (B) Engine retains a `BattleLogEntry[]` plus events; CLI uses log,
     UI uses events.
   > Your answer: (A) for combat — the standalone `combat.cli.ts` was
   > deleted at Phase 17 (commit 7595c2e); the unified
   > `src/CLI/game.cli.ts` subscribes to the emitter via
   > `events.onAny(emit)` (`game.cli.ts:48`) and lets `emit` route each
   > event to either a one-line human summary or a JSON line (`io.ts`).
   > `BattleLogEntry` survives on `CombatState.log` as state but is not
   > the rendering source of truth — the CLI never reads it. So the
   > effective answer is (A) with `BattleLogEntry` retained as a
   > dormant in-state log for any future UI that wants a per-round
   > history without re-subscribing.

8. **Versioning strategy.** Currently `1.0.0`. Once the UI is consuming
   the package, breaking changes need bumps:
   - (A) Strict semver; breaking = major.
   - (B) `0.x` for the duration of pre-release; breaking = minor.
   - (C) Pinned commit hashes from the UI side; semver irrelevant.
   > Your answer: (B). `package.json` ships `version: 0.6.0` today — the
   > "currently 1.0.0" framing in this spec is stale and was rolled back
   > so breaking changes can land as minor bumps without an external
   > signal that the API is stable. Promote to `1.0.0` when the public
   > API trim (Q1) and the React Native consumer's integration tests
   > both stabilise.

## Proposed approach

1. **Subpath-export refactor** per Q3 — `package.json` `exports` field
   points React Native at the core, Node consumers at the full surface.
2. **Public API trim** per Q1 — move internal helpers to non-exported
   namespace.
3. **Pure reducer entry point** — keep `createGameStore` but ensure all
   logic is reachable without it per Q2.
4. **`AsyncStorage` adapter** per Q4 (only if you opt in).
5. **Event channel implementation** per Q5; events typed per Q6.
6. **CLI refactor** per Q7 — `combat.cli.ts` subscribes to events instead
   of receiving them via return values.
7. **Versioning rules** documented in `README.md` per Q8.
8. **`docs/` index for the public API** — a new `docs/api.md` listing
   every export with its stability level.

## Acceptance checklist

- [x] All 8 questions answered. — Phase 28 unit 4 (`bb0d895`) backfilled
      the answers against the live engine.
- [x] React Native consumer can import from the core entry point with
      *no* `fs` errors. — Phase 12 (`251dda9`) split the Node-only
      `createNodeAdapter` onto the `./node` subpath; the root entry
      ships only RN-safe code.
- [x] Event channel exposes the events listed in Q6. — Phase 12
      shipped the 10 `GameEventType` topics; Phase 21 (`a3f1693`) added
      `EnginePayload` + typed aliases + guards; Phase 30 unit 2
      (`6097001`) extended the envelope with `unlockedSkills?` on
      level-up; Phase 66 (`25e3c28`) added a `synergy-fired` variant on
      the `SkillEvent` / `SkillPhaseEvent` discriminated unions
      surfaced via `combat:round` (carries `bonusDamage`,
      `consumedEffectIds`, `consumedAllResources`, `consumedTokens`,
      `clearedAllEffects` for UI / agent rendering). The `GameEventType`
      registry itself is unchanged — Phase 66's addition lives one
      level deeper inside the existing `combat:round` envelope.
- [ ] CLI rendered output is unchanged from before the refactor (run a
      seeded combat before/after — same transcript). — Pre-refactor
      transcript was never captured; the Phase 26 walkthrough harness
      now pins golden-path traces, but a direct before/after comparison
      against the pre-Phase-12 CLI is no longer recoverable. Treat as
      a one-shot verification step that is past its window; the green
      walkthroughs are the standing equivalent.
- [x] `docs/api.md` lists the public API. — Last rewritten at
      `353933f`; Phase 34 unit 3 (`18f0038`) added the Phase 29 + 30
      surface (stat allocation, runtime skill learning,
      `EnginePayload.unlockedSkills`); Phase 50 (`19f2015` + `57c06ab`)
      promoted `skillLibrary` + `getSkillById` to the top-level barrel
      and emitted matching `types.d.ts` files (engine handoff for
      `axiomancer-mobile`); Phase 53 (`6e9d4f6` + siblings) introduced
      the `scripts/public-surface.expected.json` snapshot fixture +
      deploy-gate drift detection; subsequent additive type additions
      (Phase 60 `FriendshipReward` 158 → 159; Phase 66 `SkillSynergy` +
      `SynergyPredicate` 159 → 161; Phase 68 `BefriendabilityConfig`
      161 → 162; Phase 71 `FinalBlowLines` + `PactLines` + `CauseLines`
      162 → 165; Phase 73 `CodexEntry` + `CodexState` 165 → 167) ship
      through the same fixture-bump discipline. Runtime export count
      held at 233 across the v0.10.0 / v0.10.1 / v0.10.2 / v0.10.3
      tags; Phase 72 broke that hold (the first runtime-count change
      in the 0.10.x line) by adding `generateRunId` + `STARTING_REGION`
      for run-loop semantics — current `[unreleased]` shape is 235 +
      167 (see also `scripts/README.md` fixture-state annotation).
- [x] `package.json` `exports` field reflects the agreed subpath
      layout. — Verified: `"."` and `"./node"` subpaths are present
      with the standard types / import / require triples.

## Out of scope

- The actual React Native UI implementation.
- A graphical asset pipeline.
- Bundle-size optimisation (tree-shaking, code-splitting).

## Post-spec engine extensions

Phases that grew the public package surface (new exports, new event
verbs, new action variants, save-format bumps) after the v2 baseline.
This section is the canonical pointer for "what changed about the
package contract since the spec acceptance" — the deploy-gate fixture
+ `scripts/diff-public-surface.mjs` are the authoritative diff
tools, but the per-phase narrative belongs here.

### Phase 72 — Run-loop semantics surface (closes GH#65 ask 2)

- **New runtime exports** (2): `generateRunId(rng: () => number): string`
  and `STARTING_REGION: MapName = 'fishing-village'`, both from
  `src/Game/run-loop.ts`. First runtime-count change in the 0.10.x
  line (233 → 235).
- **New action variant**: `{ type: 'RESET_RUN'; payload: { keepCharacter: boolean } }`
  on the `GameAction` union. Added to `DURABLE_ACTIONS` (the
  autosave gate from Phase 51) so the new state persists
  immediately.
- **New store method**: `store.resetRun({ keepCharacter }): GameState`
  on the `GameActions` interface (Zustand vanilla store
  consumer-facing surface).
- **GameState shape**: required `runId: string` field added to
  `GameState`. Persisted by the save adapter (all 3 `adapter.save()`
  call sites updated).
- **Save format**: `GAME_STATE_VERSION` bumped `5 → 6`;
  `migrateV5toV6` defaults `runId` for legacy v5 saves via
  `generateRunId(() => getRng().random())`.
- **No new event verbs** — `RESET_RUN` dispatches go through the
  standard `gameReducer` → `set` → `emit` → autosave pipeline; the
  emitted event remains `game:saved` (via the autosave hook).

### Phase 73 — Codex slice surface (closes GH#65 ask 3)

- **New type exports** (2): `CodexEntry { id, title, body }` and
  `CodexState { unlockedEntries: string[] }`. `CodexEntry` lives in
  `src/Game/types.ts` (semantic home alongside `CodexState`) and is
  re-exported through `src/Enemy/types.ts` for the
  `Enemy.journalEntry?: CodexEntry` decoration (so the per-foe
  content site doesn't take a cross-module import). 165 → 167
  types.
- **New action variant**: `{ type: 'UNLOCK_CODEX_ENTRY'; payload: { entryId: string } }`
  on the `GameAction` union. Added to `DURABLE_ACTIONS`.
- **New store method**: `store.unlockCodexEntry(entryId: string): void`.
- **GameState shape**: required `codex: CodexState` slice added to
  `GameState`. Persisted by the save adapter.
- **Save format**: `GAME_STATE_VERSION` bumped `6 → 7`;
  `migrateV6toV7` defaults `codex = { unlockedEntries: [] }` for
  legacy v6 saves.
- **CombatEndReport extension**: optional `codexEntryUnlocked?: { id, title }`
  on `friendshipReward` — surfaces only when the friendship outcome
  unlocked a new entry (de-duped against `state.codex.unlockedEntries`).
- **No new event verbs** — same as Phase 72; consumers subscribe to
  `combat:ended` and read `report.friendshipReward.codexEntryUnlocked`,
  or to `game:saved` for the autosaved post-unlock state.

### Phase 71 — Per-foe aftermath narrative surface (closes GH#65 ask 1)

- **New type exports** (3): `FinalBlowLines { brutal, quiet, ironic }`,
  `PactLines { quiet, setDown, heavy }`, `CauseLines { brutal,
  broken, quiet }`. All three live in `src/Enemy/types.ts` and are
  re-exported through both the Enemy barrel and the top-level
  package barrel. 162 → 165 types.
- **No new runtime exports** — pure data fields on the existing
  `Enemy` type; consumer (mobile presenter / CLI / future UI) owns
  variant-selection.
- **No new action variants, no save-format bump, no event verbs**
  — additive-optional fields on `Enemy.{finalBlowLines, pactLines,
  causeLines}?`; legacy save loads are unaffected.

### Phase 75 — `previewTemplateAtRarity` helper (closes user-jot at `b5c8165`)

- **New runtime export** (1): `previewTemplateAtRarity(templateId,
  rarity, playerLevel, rng?): Equipment | undefined` from
  `src/Items/item.factory.ts`. Second runtime-count change in the
  0.10.x → 0.11.x line (235 → 236; Phase 72 was the first).
  Re-exported through `src/Items/index.ts` + top-level barrel.
- **No new type exports** — helper signature uses existing
  `ItemRarity` (Spec 05c) + `Equipment` (Spec 05). Types stay at
  167.
- **No new action variants, no save-format bump, no event verbs,
  no GameState shape change** — purely a consumer-tier read
  surface around the existing `dropItem` factory; reuses
  `rollModifiers` / `resolveModifiers` / `dropItem` machinery with
  rng + rarity pinned.
- **Soft-error semantics** distinguish this helper from `dropItem`:
  returns `undefined` for any failure (unknown templateId, level-
  too-low, unique-rarity on regular template) rather than throwing.
  UI code looping templates × rarities cannot wrap every call in
  try/catch; the soft-error shape mirrors the existing
  `getEquipmentTemplate(...): T | undefined` lookup-style convention.
- **Mobile UI callsite** (post-engine-release): the item-library
  matrix view renders `equipmentTemplates × ItemRarity` cells by
  calling `previewTemplateAtRarity(tpl.id, rarity, playerLevel)`
  per cell. Default rng `() => 0.5` (Phase 70 deterministic-drop
  pattern) keeps the same cell stable across re-renders.

### Cross-phase: GAME_STATE_VERSION ceremony

The 0.10.x cycle bumped the save format twice (5 → 6 at Phase 72;
6 → 7 at Phase 73). Both followed the same ceremony: required
field added to `GameState` + matching `migrateV<N>toV<N+1>` step +
migration wired into the `migrate()` funnel + extended
`assertGameState` validation + mirror in `docs/gameloop.md` § "Save
versioning + migration" and `docs/quickstart.md` save/load
paragraph. Future bumps follow the same pattern — see
`RELEASING.md` Pre-release checklist step 7 for the bump-ceremony
checklist.
