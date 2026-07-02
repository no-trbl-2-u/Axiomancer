# Phase 73 — Codex / journal-entry surface on parley outcomes

> Closes GH#65 ask 3 (score 4.0). Mobile `<CombatFriendshipPanel>`
> renders an optional 'A NEW ENTRY' card that never mounts because
> the engine doesn't expose any codex / journal-entry surface. This
> phase ships the slice + per-foe metadata + auto-firing wiring so
> mobile can mount the card.

## Outcome

`GameState` gains a required `codex: CodexState` slice (where
`CodexState = { unlockedEntries: string[] }`) — additive state that
collects journal-entry IDs unlocked across the run.
`Enemy.journalEntry?: CodexEntry` (where
`CodexEntry = { id, title, body }`) holds the per-foe metadata.
`store.endCombat()`'s `outcome === 'friendship'` branch auto-fires
a codex unlock when the befriended enemy carries a `journalEntry`,
appending the entry's id to `state.codex.unlockedEntries`
(de-duped via `includes()`) and surfacing the entry's id + title on
`CombatEndReport.friendshipReward.codexEntryUnlocked`. The store
also exposes a direct `unlockCodexEntry(entryId)` action so future
narrative content (dialogue, map events) can grant codex entries
outside combat. `GAME_STATE_VERSION` bumps 6 → 7 with
`migrateV6toV7` defaulting `codex = { unlockedEntries: [] }` on
legacy v6 saves. Three authored entries land on MournfulGull,
HollowEyedBeggar, and CoastalTyrant matching the established
chronicle voices.

## Source spec / candidate

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 73 row —
promoted at oversight 2026-05-22 (fourteenth oversight; aggressive
GH#65 triage). No `specs/<NN>.md` — engine-primitive phase, same
shape as Phase 60 / 62 / 68 / 69 / 72.

Naming note: an existing CLI tab is called "Journal" (quest log) —
distinct concept from the Phase 73 Codex slice. Both can coexist
without conflict; the brief uses "Codex" throughout for the new
slice to avoid name overlap with the quest-Journal tab.

## Implementation units

### Unit 1 — Engine primitive: types + slice + action + auto-firing wire + v7 migration

**Files touched:**
- `src/Enemy/types.ts` — new `CodexEntry` interface; new optional
  `journalEntry?: CodexEntry` on `Enemy`.
- `src/Enemy/index.ts` + `src/index.ts` — re-export `CodexEntry`.
- `src/Game/types.ts` — new `CodexState` interface; add required
  `codex: CodexState` to `GameState`.
- `src/Game/game.reducer.ts` — bump `GAME_STATE_VERSION` 6 → 7;
  `createNewGameState()` initializes `codex: { unlockedEntries: [] }`;
  add `UNLOCK_CODEX_ENTRY` reducer case (appends entry id de-duped);
  extend `END_COMBAT` reducer's `outcome === 'friendship'` branch to
  auto-unlock when `enemy.journalEntry` is present.
- `src/Game/game.migrate.ts` — add `interface GameStateV6` + `migrateV6toV7`
  defaulting `codex = { unlockedEntries: [] }`; extend `assertGameState`.
- `src/Game/actions.types.ts` — new action variant:
  `{ type: 'UNLOCK_CODEX_ENTRY'; payload: { entryId: string } }`.
- `src/Game/store.ts` — extend `CombatEndReport.friendshipReward`
  with optional `codexEntryUnlocked?: { id: string; title: string }`;
  thread the field through `endCombat()` when the journalEntry
  unlocks (mirrors the Phase 69 `alignmentShift` pattern); add
  `unlockCodexEntry(entryId)` store method; add `codex` to all 3
  `adapter.save()` destructure sites; add `UNLOCK_CODEX_ENTRY` to
  `DURABLE_ACTIONS`.
- `src/Game/index.ts` — re-export `CodexState`.
- `src/index.ts` — re-export `CodexState` (top-level Game block).
- `scripts/public-surface.expected.json` — regenerate (+2 type
  exports: `CodexEntry` + `CodexState`; types 165 → 167; runtime
  exports unchanged at 235).

**Type sketch:**

```typescript
// src/Enemy/types.ts
export interface CodexEntry {
    /** Stable id; consumed by Codex-tab UI as the row key. */
    id: string;
    /** Short label rendered on the unlock toast + Codex row header. */
    title: string;
    /** Long-form chronicle prose for the Codex entry body. */
    body: string;
}

export interface Enemy {
    // ... existing fields ...
    /**
     * Phase 73 — optional per-enemy codex / journal-entry. When the
     * player befriends this enemy (`outcome === 'friendship'`), the
     * engine auto-appends `journalEntry.id` to
     * `state.codex.unlockedEntries` (de-duped) and surfaces the
     * entry's id + title on
     * `CombatEndReport.friendshipReward.codexEntryUnlocked`. Closes
     * GH#65 ask 3. Authors leave undefined for enemies whose
     * friendship arc does not unlock a codex entry.
     */
    journalEntry?: CodexEntry;
}
```

```typescript
// src/Game/types.ts
export interface CodexState {
    /**
     * Phase 73 — IDs of codex entries unlocked across the run.
     * Append-only (de-duped); never removed. Each entry id maps back
     * to a `CodexEntry` on the source `Enemy` (or on a future
     * dialogue / map-event surface that grants codex entries
     * directly). Consumers (mobile Codex tab) render entry bodies by
     * looking up the id against the content registry.
     */
    unlockedEntries: string[];
}

export interface GameState {
    version: number;
    runId: string;
    player: Character;
    // ... unchanged ...
    /**
     * Phase 73 — codex slice (closes GH#65 ask 3). Append-only
     * collection of unlocked entry IDs. Defaults to
     * `{ unlockedEntries: [] }` on new games; migrated via
     * `migrateV6toV7` for legacy v6 saves.
     */
    codex: CodexState;
}
```

```typescript
// src/Game/game.reducer.ts — UNLOCK_CODEX_ENTRY case
case 'UNLOCK_CODEX_ENTRY': {
    const { entryId } = action.payload;
    if (state.codex.unlockedEntries.includes(entryId)) return state;
    return {
        ...state,
        codex: {
            ...state.codex,
            unlockedEntries: [...state.codex.unlockedEntries, entryId],
        },
    };
}
```

```typescript
// src/Game/store.ts — END_COMBAT friendship branch extension
// (inside endCombat() — after the existing items / xpBonus /
// narrative / flagSet / alignmentDelta threads)
let codexEntryUnlocked: { id: string; title: string } | undefined;
if (outcome === 'friendship' && pre.combat?.enemy.journalEntry) {
    const entry = pre.combat.enemy.journalEntry;
    if (!stateAfterReward.codex.unlockedEntries.includes(entry.id)) {
        stateAfterReward = {
            ...stateAfterReward,
            codex: {
                ...stateAfterReward.codex,
                unlockedEntries: [...stateAfterReward.codex.unlockedEntries, entry.id],
            },
        };
        codexEntryUnlocked = { id: entry.id, title: entry.title };
    }
}
```

```typescript
// src/Game/game.migrate.ts
interface GameStateV6 extends Omit<GameState, 'codex'> {
    version: 6;
}

function migrateV6toV7(v6: GameStateV6): GameState {
    return {
        ...v6,
        version: 7,
        codex: { unlockedEntries: [] },
    };
}
```

### Unit 2 — Content authoring: three `journalEntry` blocks on the befriendable trio

**Files touched:**
- `src/Enemy/enemy.library.ts` — append `journalEntry` block to
  MournfulGull (line 162), HollowEyedBeggar (line 210),
  CoastalTyrant (line 326).

**Voice continues from Phase 71:**

```typescript
// MournfulGull
journalEntry: {
    id: 'codex-mournful-gull',
    title: 'The Catalogue of Slights',
    body:
        'It keeps the list aloud. Some entries are recent, some predate the harbour wall. ' +
        'It does not insist you remember every one — only that one exists. ' +
        'When you stopped speaking, it stopped circling. ' +
        'That, too, is on the list now, in a different column.',
},

// HollowEyedBeggar
journalEntry: {
    id: 'codex-hollow-eyed-beggar',
    title: 'They Carry What You Set Down',
    body:
        'They were carrying the phials for someone. They no longer say who. ' +
        'The folded cloth came from somewhere inside the rags — there is more in there. ' +
        'They want what you carry, but they also keep what you abandon. ' +
        'There is a difference between the two and they will not explain it to you.',
},

// CoastalTyrant
journalEntry: {
    id: 'codex-coastal-tyrant',
    title: 'The Magistrate Who Set Down the Circlet',
    body:
        'He was the magistrate of the bay before he was the king of it. ' +
        'The blade is older than the village charter; the circlet older than the blade. ' +
        'The sentence on the inner band keeps ending and starting again — old texts ' +
        'said it would. He held the line for as long as a man can hold a line. ' +
        'Then he set it down and called that closer to honest.',
},
```

### Unit 3 — Hermetic e2e + docs + CHANGELOG + bearings + README

**Files touched:**
- `src/Game/e2e/codex.engine.test.ts` — new file (6 cases).
- `docs/api.md` Game block — "Codex slice (Phase 73)" subsection.
- `docs/combat.md` Friendship Path — extend with codex-unlock
  note (after the Phase 69 `alignmentShift` block).
- `docs/enemy.md` Aftermath section — extend with `journalEntry`
  field documentation (the field semantics + the 3-enemy initial
  coverage + the auto-firing wire).
- `README.md` Game + Enemy rows — Phase 73 surface phrasing.
- `plan/bearings.md` Game + Enemy blocks — Phase 73 surface lines.
- `CHANGELOG.md [unreleased] ### Added` — Phase 73 bullet.

**Cases (6):**
1. New game: `state.codex.unlockedEntries` is `[]`.
2. Befriend MournfulGull → `state.codex.unlockedEntries` contains
   `'codex-mournful-gull'`; `report.friendshipReward.codexEntryUnlocked`
   surfaces `{ id, title }`.
3. De-dupe: dispatch `UNLOCK_CODEX_ENTRY` for an id already in
   the list — no state change.
4. No journalEntry: TidepoolCrab friendship outcome leaves
   `state.codex.unlockedEntries` empty;
   `report.friendshipReward?.codexEntryUnlocked` is `undefined`.
5. Victory outcome (not friendship) against MournfulGull does NOT
   unlock the entry.
6. `migrateV6toV7` defaults `codex` on legacy v6 saves.

## Decisions made upfront — DO NOT ASK

- **D1 — `CodexEntry` shape: `{ id, title, body }` structured (not
  flat string).** Per the brief's preferred shape; pairs with
  future Codex-tab UI better than a flat string (title is the row
  header / unlock-toast label; body is the long-form chronicle).
  Mobile `<CombatFriendshipPanel>` NEW ENTRY card reads the title
  for the headline + the body for the expanded view.

- **D2 — `codex: CodexState` is REQUIRED on `GameState`** (not
  `codex?`). Same shape as Phase 72's `runId` decision — codex
  is a state slice (like `quests`, `flags`); consumers always have
  a non-null value to read. Migration (D6) defaults for legacy
  saves so the required shape doesn't break load semantics.

- **D3 — `CodexState` wraps an array, not exposing `string[]`
  directly.** Future extensions (per-entry unlock-timestamp,
  per-entry read-status) can land additive-optionally on the
  wrapper without breaking the existing shape. The flat-array
  shape would lock the surface; the wrapper is the same lightweight
  pattern as `QuestLog`.

- **D4 — De-dupe via `includes()` on append.** Per-call O(n)
  check; the list grows slowly (one entry per befriended enemy).
  Same pattern as Phase 62's `flagSet` de-dupe on `state.flags`.

- **D5 — Auto-firing on friendship only.** The codex unlock fires
  in the `outcome === 'friendship'` branch of `endCombat()`, AFTER
  the existing items / xpBonus / narrative / flagSet /
  alignmentDelta threads. Victory / defeat / flee outcomes do NOT
  unlock the entry (D5 — codex is the parley reward). Future
  content can grant entries outside combat by dispatching
  `UNLOCK_CODEX_ENTRY` directly.

- **D6 — Bump `GAME_STATE_VERSION` 6 → 7.** Same rationale as
  Phase 72's bump — required-field shape change.
  `migrateV6toV7` defaults `codex: { unlockedEntries: [] }`.

- **D7 — `unlockCodexEntry(entryId)` is both a store method AND
  a dispatchable action.** The store method dispatches
  `UNLOCK_CODEX_ENTRY` through the standard pipeline. The action
  goes into `DURABLE_ACTIONS` so unlocks persist immediately.
  Future dialogue / map-event content can dispatch the action
  directly (e.g. a dialogue branch grants a codex entry).

- **D8 — `report.friendshipReward.codexEntryUnlocked` surfaces
  only `{ id, title }`, not the full body.** Mirrors the Phase 69
  `alignmentShift` pattern (engine has already written the
  unlocked id to `state.codex.unlockedEntries`; the report just
  carries the headline for the consumer's after-action UI). The
  body is recovered by looking up the entry id against the
  content registry (today: `Enemy.journalEntry`; future:
  `CodexLibrary`).

- **D9 — Three authored entries.** Same scope-tightening as Phase
  71 — only the currently-authored befriendable trio. Remaining
  13 enemies in the library leave `journalEntry` undefined and
  fall through to "no codex unlock on this friendship". Future
  content sweeps author entries on additional enemies.

- **D10 — Voice continues from Phase 71.** Each enemy's
  `journalEntry.body` extends the chronicle voice established by
  their `friendshipReward.narrative` + Phase 71's 9-line set. The
  bodies are sentences-paragraph in length (matching the existing
  multi-paragraph `friendshipReward.narrative` weight).

- **D11 — No `CodexLibrary` registry exported.** Entries live on
  the source `Enemy` today. A future content phase could
  centralize entry definitions in `src/Content/codex.library.ts`
  if entry count grows + cross-enemy entries (lore-only entries
  not tied to a single enemy) become a thing. Out of scope here.

- **D12 — Codex doesn't reset on `keepCharacter: true` `resetRun`.**
  Wait — D12 is wrong if codex is part of the character ledger
  (metaprogression-like). Re-evaluating: codex unlocks are
  per-character knowledge (the player learns about this NPC). On
  a `keepCharacter: true` run reset, the codex SHOULD persist
  (you've already met this NPC; the knowledge carries). On
  `keepCharacter: false`, the codex resets with everything else.
  Brief picks: **codex persists across `keepCharacter: true`
  resets** (character-ledger semantics, same family as
  `philosophicalAlignment` and `moralMeter` per Phase 72 D1/D13).
  Requires extending the Phase 72 RESET_RUN reducer to preserve
  `codex` on the `keepCharacter: true` branch — small follow-up
  edit. Documented under Cross-phase coupling.

- **D13 — Three commits + plan-row flip.** Unit 1 ships engine
  primitive + migration + reducer + action + store method +
  barrels + fixture. Unit 2 ships content authoring. Unit 3 ships
  e2e + docs + CHANGELOG.

## Cross-phase coupling — Phase 72 RESET_RUN update

Per D12, the `keepCharacter: true` branch of Phase 72's
`RESET_RUN` reducer needs to preserve `state.codex` (currently
the case omits codex; with codex required on GameState, the
omission becomes a typecheck error anyway). Unit 1 of this phase
adds `codex: state.codex` to the preserved fields. The Phase 72
`keepCharacter: false` branch already drops to
`createNewGameState()` which initializes `codex: { unlockedEntries:
[] }` — no change needed there.

## Verify gate

- `npm run type-check` — must pass; new required field on
  GameState may surface in fixture literals.
- `npm test` — 691 → 697 (+6 net per Unit 3 case count).
- `npm run build` — must pass.
- `npm run deploy:check` — must pass; fixture refresh +2 types
  (`CodexEntry` + `CodexState`).

## Commit body template

### Unit 1

```
feat(game): Phase 73 unit 1 — Codex slice + journalEntry + v7 migration

- New CodexEntry { id, title, body } interface on src/Enemy/types.ts
  + Enemy.journalEntry?: CodexEntry (additive-optional per-foe
  metadata per D1).
- New CodexState { unlockedEntries: string[] } interface on
  src/Game/types.ts + REQUIRED codex: CodexState on GameState
  (D2 — state-slice shape; migration defaults for legacy saves).
- Bump GAME_STATE_VERSION 6 → 7 (D6); migrateV6toV7 defaults
  codex = { unlockedEntries: [] }.
- New action variant: { type: 'UNLOCK_CODEX_ENTRY'; payload: { entryId }}.
- UNLOCK_CODEX_ENTRY reducer case appends de-duped (D4).
- END_COMBAT friendship branch auto-fires the unlock when
  enemy.journalEntry is present (D5); surfaces { id, title } on
  CombatEndReport.friendshipReward.codexEntryUnlocked (D8 — body
  recovered via content-registry lookup).
- store.unlockCodexEntry(entryId) method dispatches the action;
  UNLOCK_CODEX_ENTRY added to DURABLE_ACTIONS (D7).
- Re-exports through src/Enemy/index.ts + src/Game/index.ts +
  src/index.ts.
- Public-surface fixture: +2 type exports (CodexEntry +
  CodexState); 165 → 167; runtime unchanged at 235.
- Phase 72 RESET_RUN reducer extended to preserve state.codex on
  keepCharacter:true (Cross-phase coupling per D12).

Decisions:
- D1 — structured { id, title, body }; pairs with Codex-tab UI.
- D2 / D6 — required state slice + version bump.
- D5 — auto-fire on friendship outcome only.
- D7 — store method + dispatchable action.
- D8 — report carries { id, title }; body looked up at render.
- D12 — codex persists across keepCharacter:true resets.

Closes GH#65 ask 3 (engine surface; mobile callsite reads
report.friendshipReward.codexEntryUnlocked and mounts the NEW
ENTRY card).
```

### Unit 2

```
feat(content): Phase 73 unit 2 — journalEntry on the befriendable trio

- MournfulGull (line 162) — "The Catalogue of Slights": list /
  catalogue / "different column" thread.
- HollowEyedBeggar (line 210) — "They Carry What You Set Down":
  phials / cloth / "want vs keep" thread.
- CoastalTyrant (line 326) — "The Magistrate Who Set Down the
  Circlet": magistrate / blade / circlet / "honest" thread.

Decisions:
- D9 — 3 enemies (the currently-authored befriendable trio);
  remaining 13 deferred to follow-up content sweep.
- D10 — voice continues from Phase 71; bodies are paragraph-length.
```

### Unit 3

```
test(game): Phase 73 unit 3 — hermetic e2e + docs + CHANGELOG

- src/Game/e2e/codex.engine.test.ts — 6 cases pinning the
  unlock matrix:
  - new game codex defaults [] empty
  - MournfulGull befriend unlocks codex-mournful-gull + report
    surfaces { id, title }
  - UNLOCK_CODEX_ENTRY de-dupe (no state change on repeat)
  - TidepoolCrab (no journalEntry) friendship leaves codex empty
  - Victory outcome does NOT unlock the entry
  - migrateV6toV7 defaults codex on legacy v6 saves
- docs/api.md Game block — "Codex slice (Phase 73)" subsection.
- docs/combat.md Friendship Path — codex-unlock note after the
  Phase 69 alignmentShift block.
- docs/enemy.md Aftermath section — journalEntry field doc +
  3-enemy coverage + auto-firing wire.
- README.md Game + Enemy rows — Phase 73 surface phrasing.
- plan/bearings.md Game + Enemy blocks — Phase 73 surface lines.
- CHANGELOG.md [unreleased] ### Added — Phase 73 bullet citing
  GH#65 ask 3 + the slice + the auto-firing + the per-unit trail.

697/697 tests (+6 net from Phase 72's 691).
```

## Definition of Done

- [ ] `CodexEntry` + `CodexState` interfaces exist on the public
      surface.
- [ ] `Enemy.journalEntry?: CodexEntry` added (additive-optional).
- [ ] `GameState.codex: CodexState` added (required).
- [ ] `GAME_STATE_VERSION` bumped 6 → 7; `migrateV6toV7` ships.
- [ ] `UNLOCK_CODEX_ENTRY` action variant + reducer case.
- [ ] `END_COMBAT` friendship branch auto-fires unlock when
      `enemy.journalEntry` present; surfaces on
      `CombatEndReport.friendshipReward.codexEntryUnlocked`.
- [ ] `store.unlockCodexEntry(entryId)` method ships.
- [ ] `UNLOCK_CODEX_ENTRY` in `DURABLE_ACTIONS`; `codex` in all
      `adapter.save()` destructure sites.
- [ ] Phase 72 RESET_RUN preserves `state.codex` on
      `keepCharacter: true`.
- [ ] `scripts/public-surface.expected.json` refreshed (+2 types).
- [ ] MournfulGull, HollowEyedBeggar, CoastalTyrant each carry
      authored `journalEntry` per Unit 2 voice.
- [ ] `src/Game/e2e/codex.engine.test.ts` ships with 6 cases.
- [ ] `docs/api.md` Game block + `docs/combat.md` Friendship Path +
      `docs/enemy.md` Aftermath section extended.
- [ ] `README.md` + `plan/bearings.md` + `CHANGELOG.md` updated.
- [ ] `npm run verify` green (697/697 expected).
- [ ] `npm run deploy:check` green.
- [ ] `plan/steps/01_build_plan.md` Phase 73 row flips `[ ]` →
      `[x]` with commit hashes per unit.

## Follow-ups (out of scope)

- **Codex on the remaining 13 enemies.** Author `journalEntry`
  on each as the next content sweep lands.
- **`CodexLibrary` central registry.** If entry count grows or
  cross-enemy lore entries become a thing, centralize in
  `src/Content/codex.library.ts`.
- **Codex-tab CLI surface.** Today only the data lives in the
  engine. A CLI tab analogous to `journalTab` could render
  `state.codex.unlockedEntries` against the per-foe `journalEntry`
  lookup. Mobile-tier consumer can already render.
- **Per-entry unlock-timestamp / read-status.** Additive-optional
  fields on `CodexState` (or on a richer per-entry shape) for
  Codex-tab UI sort / dot-indicators.
- **Mobile callsite cleanup.** `<CombatFriendshipPanel>` NEW
  ENTRY card reads `report.friendshipReward.codexEntryUnlocked`
  and mounts when populated — consumer-side post-engine-release.

## Canonical sibling

`plan/phases/phase_72_run_loop_semantics.md` for the
required-field + GAME_STATE_VERSION bump + migration pattern.
Phase 60 (`plan/phases/phase_60_befriendable_enemy_content.md`)
for the END_COMBAT friendship-branch threading + the
`CombatEndReport.friendshipReward.<field>` surface convention.
Phase 71 for the per-enemy additive-optional content authoring
pattern + the "currently-authored befriendable trio" scope
selection.
