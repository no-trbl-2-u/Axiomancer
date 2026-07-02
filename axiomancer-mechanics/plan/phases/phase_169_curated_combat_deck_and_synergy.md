# Phase 169 — Curated Combat Deck + Synergy

## Outcome

Replace `buildCombatDeck(player) = knownSkills + Retreat` with a **curated loadout**: a
player-shaped ordered list of skill ids persisted on `GameState.flags` via a `combat-loadout:`
codec (mirroring `hazard.deck-flags`). Add a pure read-only helper
`isCombatSynergySatisfied(card, enemyActiveEffects)` that tells mobile whether a card's
`CardSynergy.predicate` is currently live — so a combo highlight can be shown on the board.

## Source spec

`specs/28-curated-combat-deck-and-synergy.md` — open questions resolved below.

**Open questions resolved upfront (DO NOT ASK):**

| Q | Decision |
|---|---|
| Q1 — What defines the deck? | **Option A: explicit loadout.** An ordered list of skill ids selected from `knownSkills`, persisted on `flags`. `buildCombatDeck` falls back to all `knownSkills` when no loadout flag exists (backwards compat). |
| Q2 — Deck size + growth | Initial default loadout = `STARTING_SKILL_IDS` (2 cards). Player adds to it via `addToLoadout`; max 20 cards (`COMBAT_LOADOUT_MAX`). Cap is fixed in this phase (no level-based cap scaling). |
| Q3 — Persistence | `GameState.flags` via `combat-loadout-card:` prefix (one flag per card copy, identical pattern to `HAZARD_CARD_FLAG_PREFIX`). Engine owns the loadout; mobile reads/edits via exported reducer functions. No `GAME_STATE_VERSION` bump (flags are additive; v10 saves without these flags fall back to full-knownSkills deck). |
| Q4 — Synergy surfacing | Pure helper `isCombatSynergySatisfied(card: CombatCard, enemyEffects: ActiveEffect[]): boolean` exported from the Combat barrel. Mobile calls it per card in hand to decide whether to render a combo glow. No engine-side state change. |
| Q5 — Card removal | Free at any time via `removeFromLoadout(flags, cardId)`. No scarcity economy in this phase. Removal is permanent for the run (same session semantics as hazard acquired cards). |
| Q6 — Starter deck | `STARTING_SKILL_IDS` (`['slippery-slope', 'brace-for-impact']`) — seeded by `encodeCombatLoadout(STARTING_SKILL_IDS, [])`. `createNewGameState` seeds the flags so a new character has a valid loadout immediately. |

## Implementation units

### Unit 1 — `src/Combat/combat.loadout.ts` (codec + reducer functions)

New file. Pattern: exact mirror of `src/World/Hazard/hazard.deck-flags.ts`.

```ts
export const COMBAT_LOADOUT_FLAG_PREFIX = 'combat-loadout-card:';
export const COMBAT_LOADOUT_MAX = 20;

export function decodeCombatLoadout(flags: readonly string[]): string[]
// Returns ordered card ids from flags (order: index in flag-array).
// Each flag: `combat-loadout-card:<cardId>:<position>` where position is 1-based insertion order.
// Decode: filter prefix, strip trailing `:n`, return in position order.

export function addToLoadout(flags: readonly string[], cardId: string): string[]
// Returns new flags array with cardId appended.
// Guard: if decodeCombatLoadout(flags).length >= COMBAT_LOADOUT_MAX, return flags unchanged.

export function removeFromLoadout(flags: readonly string[], cardId: string): string[]
// Removes first occurrence of cardId from loadout flags. Returns new flags array.

export function getCombatLoadout(flags: readonly string[]): string[]
// Convenience alias for decodeCombatLoadout — the canonical read API.
```

Flag encoding: `combat-loadout-card:<cardId>:<n>` where `<n>` is 1-based copy count (same
as Hazard). `addToLoadout` counts existing copies and appends the next ordinal.

### Unit 2 — Wire `buildCombatDeck` to prefer the curated loadout

Edit `src/Combat/combat.deck.ts`:

```ts
import { getCombatLoadout } from './combat.loadout';

export function buildCombatDeck(player: Character, flags?: readonly string[]): string[] {
    const loadout = flags && flags.length > 0 ? getCombatLoadout(flags) : [];
    const base = loadout.length > 0 ? loadout : (player.knownSkills ?? []);
    // de-dup + reward cards + synthetic (unchanged logic)
}
```

`initializeCombatEncounter` already accepts an explicit `playerDeck?: string[]`; the Game
store's `startCombat` action can pass `buildCombatDeck(player, state.flags)` there.
Wire in `game.reducer.ts` `startCombat` branch: pass `buildCombatDeck(player, state.flags)`
as the explicit deck to `initializeCombatEncounter`.

No change to `initializeCombatEncounter` signature (it already takes `playerDeck`).

### Unit 3 — Synergy live-check helper in `src/Combat/combat.cards.ts`

New exported function:

```ts
import type { ActiveEffect } from '../Effects/types';

export function isCombatSynergySatisfied(
    card: CombatCard,
    enemyEffects: readonly ActiveEffect[],
): boolean
// Returns true when the card's backing skill has a CardSynergy.predicate
// that is currently satisfied by enemyEffects.
// Looks up the backing skill via getCardById(card.skillId).
// If no skillId, no synergy, or no predicate → false.
// Satisfied when: enemyEffects contains an effect with effectId === predicate.effectId
//   AND intensity >= intensityMin (if set) AND remainingDuration >= durationMin (if set).
// Note: predicate.on === 'target' → check enemy effects (this helper's input).
//       predicate.on === 'caster' → always false here (no player effects input; caster-side
//       synergies are resolved at executeSkill time, not preview time).
```

### Unit 4 — Barrel exports + `createNewGameState` seed

Edit `src/Combat/index.ts`: export `COMBAT_LOADOUT_FLAG_PREFIX`, `COMBAT_LOADOUT_MAX`,
`decodeCombatLoadout`, `addToLoadout`, `removeFromLoadout`, `getCombatLoadout` from
`./combat.loadout`.

Edit `src/index.ts`: add the six exports above plus `isCombatSynergySatisfied` to the
Combat group.

Edit `src/Game/game.reducer.ts` `createNewGameState()`: seed the initial flags with the
starter loadout:
```ts
import { addToLoadout } from '../Combat/combat.loadout';
import { STARTING_SKILL_IDS } from '../Combat/combat.rewards';

// inside createNewGameState():
let flags: string[] = [];
for (const id of STARTING_SKILL_IDS) flags = addToLoadout(flags, id);
```

Also wire the `startCombat` reducer branch to pass the loadout deck:
```ts
// In the startCombat reducer (game.reducer.ts), find where initializeCombatEncounter is called:
import { buildCombatDeck } from '../Combat/combat.deck';
// pass: playerDeck: buildCombatDeck(player, state.flags)
```

### Unit 5 — Hermetic e2e + docs

`src/Combat/e2e/combat-loadout.engine.test.ts`:
- Add to loadout, verify `getCombatLoadout` returns it.
- Add beyond max cap → ignored.
- Remove from loadout → gone.
- `buildCombatDeck(player, flags)` with curated loadout → only loadout cards in deck (no extra knownSkills).
- `buildCombatDeck(player, [])` (empty flags) → falls back to knownSkills (backward compat).
- `isCombatSynergySatisfied(card, enemyEffects)` → true when predicate satisfied; false otherwise.
- Synergy predicate on 'caster' side → always false from this helper.

Update `docs/combat.md` with a "§ Curated Combat Loadout" section documenting the codec,
the loadout reducers, and `isCombatSynergySatisfied`.

Update `spec.md` Contracts Combat row: add the 6 loadout exports + `isCombatSynergySatisfied`.
Update `plan/bearings.md` Combat locked-contract group with the same.

## Decisions made upfront — DO NOT ASK

- **No `GameState` shape change / no version bump.** Loadout lives in `flags`; old saves
  fall back to full-knownSkills deck. No migration needed.
- **No scarcity removal economy.** `removeFromLoadout` is free. Earn/lock mechanics are
  out of scope (Spec 27 or a future phase).
- **`isCombatSynergySatisfied` checks enemy (`target`) effects only.** Caster-side synergies
  are execution-time matters, not preview-time. Returns `false` for `on === 'caster'`
  predicates cleanly.
- **`buildCombatDeck` signature extension.** New optional second param `flags?` is
  backwards-compatible — all existing callers pass zero or one arg and keep working.
- **No new spec file.** Spec 28 is authoritative; this brief resolves all open questions.
- **No new card content.** Synergy cards are existing `SkillSynergy` content. Authoring
  more is out of scope (Spec 28 §Out of scope).
- **`createNewGameState` seeds the loadout.** A brand-new character has `STARTING_SKILL_IDS`
  in their loadout flags so mobile never encounters an empty loadout on first boot.

## Verify gate

```bash
npm run verify   # type-check + test + build
npm run deploy:check
```

## Commit body template

```
feat(combat): phase 169 — curated combat loadout + synergy live-check

- combat.loadout.ts: flags codec (combat-loadout-card: prefix) with
  addToLoadout / removeFromLoadout / getCombatLoadout / COMBAT_LOADOUT_MAX
- buildCombatDeck: prefers curated loadout from flags; falls back to
  knownSkills when no flags present (backwards compat)
- isCombatSynergySatisfied: pure read-only combo-live helper for mobile
- createNewGameState: seeds STARTING_SKILL_IDS into loadout flags
- game.reducer.ts: startCombat passes buildCombatDeck(player, flags)
- barrel: 6 loadout exports + isCombatSynergySatisfied on public surface
- docs/combat.md §Curated Combat Loadout; spec.md + bearings.md contracts

Decisions:
- Flags codec (no GameState version bump): loadout is additive, old saves fall
  back to knownSkills deck transparently
- isCombatSynergySatisfied returns false for caster-side predicates (preview
  context has no player effects; execution-time synergy is unaffected)
```

## Definition of Done

- [ ] `getCombatLoadout` / `addToLoadout` / `removeFromLoadout` / `COMBAT_LOADOUT_MAX` /
      `COMBAT_LOADOUT_FLAG_PREFIX` exported from `src/index.ts`.
- [ ] `isCombatSynergySatisfied` exported from `src/index.ts`.
- [ ] `buildCombatDeck(player, flags)` with a non-empty loadout → only loadout cards appear
      (verified by hermetic e2e).
- [ ] `buildCombatDeck(player, [])` / `buildCombatDeck(player)` → falls back to knownSkills
      (backwards compat; verified by e2e).
- [ ] `isCombatSynergySatisfied` returns `true` when predicate satisfied, `false` otherwise
      (hermetic e2e: both branches + caster-side always-false).
- [ ] `createNewGameState()` flags include the STARTING_SKILL_IDS loadout.
- [ ] `startCombat` reducer passes `buildCombatDeck(player, state.flags)` as deck.
- [ ] `npm run verify` green; `npm run deploy:check` green.
- [ ] `docs/combat.md` §Curated Combat Loadout added.
- [ ] `spec.md` Contracts + `plan/bearings.md` updated with new exports.

## Follow-ups (out of scope)

- Deck-size cap scaling with character level or equipment stat (Spec 28 §2 B).
- Card removal as earned reward / scarcity economy (Spec 28 §5).
- `/combat-tuning` sim policy that respects the curated loadout (Spec 28 §5).
- Cross-run roguelike deck progression (Spec 28 §Out of scope).
- Salvage sideways-play economy (Spec 27).
