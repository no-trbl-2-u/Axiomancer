# Phase 52a — Deck-removal engine primitive + the escalating price

> Agent-facing brief. Give the engine its first way to take a card OUT of
> the combat deck, plus the per-run escalating price that makes repeated
> removal a real cost. Mechanics only — no player-facing surface lands
> here (52d builds it). First of the six-phase **rest-choice** epic
> (52a-52f), which retires the Night Watch minigame and replaces the rest
> node with a one-shot three-way choice.

## Why this exists

T direct (attended chat, 2026-08-08): the Rest minigame is removed and
the rest node becomes a choice of three — heal, upgrade a die, or
**remove a card from your deck**, the last "low price to start, but every
time the player does this across the game, it costs a little more."

The engine has **no card removal at all** today. `removeCardFromDeck` in
`src/World/Hazard/hazard.engagement.ts` is a *hazard-deck* helper and is
NOT the thing being asked for — do not extend it, do not import it.

## Inputs (read these first)

1. `src/Combat/combat.deck.ts` — `buildCombatDeck`. The combat deck is
   `player.knownCards` (or the loadout flags, when present) **plus**
   `player.combatRewardCards`. Two lists, different semantics.
2. `src/Combat/combat.rewards.ts` — `combatRewardCards` allows
   **duplicates**; `knownCards` is a unique unlock set (`grantCard`
   early-returns when already known).
3. `src/Combat/combat.loadout.ts` — when loadout flags exist,
   `buildCombatDeck` uses the curated list INSTEAD of `knownCards`. A
   removal that ignores the loadout will appear to do nothing.
4. `src/Character/types.ts` — `Character.currency` (SHILLINGS; the
   engine spells the unit at `World/LootCache/lootcache.engine.ts:262`).
5. `src/Game/game.reducer.ts` — `GAME_STATE_VERSION = 15`.
   `src/Game/game.migrate.ts` — the migration home.

## Scope

- **`removeCardFromCombatDeck(player, cardId)`** in a new
  `src/Cards/card.removal.ts` (not in `combat.deck.ts` — keep the deck
  builder read-only). Rules, in order:
  1. Remove **one copy** from `combatRewardCards` if present there.
  2. Otherwise remove the id from `knownCards`.
  3. **Reconcile the loadout** — if loadout flags name the removed card,
     drop it from them too, or the removal is invisible.
  4. Return the player unchanged + a **loud refusal reason** when the
     card is not in the deck, or when removal would breach the floor.
- **A deck-size floor.** `MIN_COMBAT_DECK_SIZE` (propose **10**, matching
  the smallest shipped preset shape — verify against
  `curated-library.engine.test.ts`'s pins before pinning it). Removal at
  the floor is refused, not clamped.
- **`Character.cardRemovals: number`** — persisted count of removals this
  run. Optional/sparse; absent reads as 0.
- **`cardRemovalPrice(removals)`** — the escalating curve.
  **Opening proposal: `15 + 10 × removals`** → 15 / 25 / 35 / 45…
  Anchored on the shipped economy (loot-cache default purse is 10
  shillings, `DEFAULT_CACHE_CURRENCY`; shop wares run ~1-12). Ship these
  as named, clearly-marked provisional constants — **Phase 52f
  calibrates them against measured income.** Linear, not exponential: an
  exponential curve prices the fourth removal out of the game entirely.
- **Persistence.** `GAME_STATE_VERSION` 15 → 16, migration defaults
  `cardRemovals` to 0 on older saves.
- **Barrel exports** from `src/index.ts` (mobile consumes these in 52d).

## Decisions made upfront — DO NOT ASK

- Removal takes **one copy**, not every copy. A player who removed a
  4-of would otherwise nuke a quarter of their deck for one price.
- `combatRewardCards` is drained before `knownCards`. Rewards are the
  bloat the player is paying to undo; the unlock set is the base.
- The counter is **per run**, not per node and not lifetime-across-runs.
  T's "across the game" reads as the campaign the player is in.
- Prices are provisional. Mark them as such in the source the way
  `BLACKSMITH_PRICING_PLACEHOLDER` does.

## Surface as `[needs-user-call]`

- Nothing expected. If `MIN_COMBAT_DECK_SIZE` cannot be set without
  breaking a shipped preset's pinned shape, surface that rather than
  quietly lowering the floor.

## Prove (DoD)

- Hermetic tests: removes from `combatRewardCards` first; falls through
  to `knownCards`; removes exactly one copy of a duplicate; reconciles
  loadout flags so `buildCombatDeck` actually shrinks; refuses an
  unowned card loudly; refuses at the floor; price curve is exact at
  0/1/2/3 removals; migration 15 → 16 defaults the counter.
- `npm run verify --workspace axiomancer-mechanics`.
- Barrel changes ⇒ re-verify mobile + card-editor (the `@mechanics`
  alias couples them — see `plan/bearings.md`).

## Follow-ups

- 52c consumes this from the rest-choice engine; 52d builds the picker.
- 52f de-placeholders the price curve.
