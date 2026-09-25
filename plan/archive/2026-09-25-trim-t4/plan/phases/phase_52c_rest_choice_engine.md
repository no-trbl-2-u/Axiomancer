# Phase 52c — The rest-choice engine (heal / anvil / cut)

> Agent-facing brief. The heart of the epic: a small pure engine that
> turns a rest node into **one irreversible choice of three**. Mechanics
> only. Third of the **rest-choice** epic (52a-52f). The Night Watch is
> still live after this phase — 52e removes it, once the replacement is
> reachable.

## Why this exists

T direct (attended chat, 2026-08-08), verbatim shape:

> Remove the Rest mini-game and replace it with a choice for the players:
> 1) Rest (heal 20% of the player's health)
> 2) Use the blacksmith (upgrade a die for a high price)
> 3) Remove a card from the player's deck (low price to start, but every
>    time the player does this across the game, it costs a little more)
> Once the player chooses an option, the rest is done/completed/locked.

## Inputs

1. `src/World/Rest/rest.engine.ts` — the **shape** to copy, not the
   content. Every minigame here is `(session, …) → session`, never reads
   `GameState`, and hands the host an outcome ledger at claim. Follow it.
2. `src/World/Blacksmith/` — **already built** (Phase D5): HONE / TEMPER
   / SWAP against a `DieGearRail`, a `budget`, loud refusals,
   `BLACKSMITH_PRICING_PLACEHOLDER = { hone: 2, temper: 3, swap: 4 }`.
   Do **not** rebuild it — compose it.
3. Phase 52a's `removeCardFromCombatDeck` + `cardRemovalPrice`.
4. Phase 52b's `RestPayload.shelter`.
5. `src/World/MapEvents/resolve-map-event.ts` — **note step 5**: the node
   is added to `consumedNodes` when the event RESOLVES, i.e. on entry,
   before the player has chosen anything. That is what makes the lock
   T asked for nearly free — and what makes a back-out button a bug.

## Scope

- **`src/World/RestChoice/`** — a new pure engine, sibling to
  `World/Rest`: `restchoice.types.ts`, `restchoice.engine.ts`,
  `restchoice.content.ts`, `index.ts`.
- **Session creation** takes an authored payload from the host — nothing
  more, nothing read from `GameState`:
  `{ shelter, maxHealth, health, currency, rail, deckCardIds, removals }`.
- **Three offers, each with its own affordability + `disabledReason`:**
  | Offer | Cost | Effect |
  |---|---|---|
  | `rest` | free | heal **20% of maxHealth**; when `shelter === 'inn'`, full heal + the scar mend instead |
  | `anvil` | **50 shillings** (provisional) | **exactly one** die upgrade — one HONE or one TEMPER on a die of the player's choosing |
  | `cut` | `cardRemovalPrice(removals)` — **15 + 10×n** (provisional) | remove one card from the combat deck |
- **One commit, then locked.** Phases: `offer` → (`anvil` opens a
  sub-step to pick die + verb; `cut` opens a sub-step to pick the card)
  → `outcome` → `done`. Once an offer is committed the other two are
  gone. Re-committing returns the session unchanged (the standing
  invalid-call contract).
- **Outcome ledger** the host settles at claim: `{ chosen, healed,
  spent, rail, removedCardId, removals }`.
- **Refuse loudly, never silently.** Unaffordable `anvil`/`cut`, a
  die already at its face cap, a deck at `MIN_COMBAT_DECK_SIZE` — all
  produce a stated reason and leave the session choosable. A player with
  no shillings still has `rest`, which is free, so the node is never a
  dead end.
- **Wire the `rest` MapEvent kind** to hand the host what the session
  needs. `resolveMapEvent`'s existing consumption stays exactly as-is.
- **Resolve the standing `[needs-user-call]`** in
  `src/World/MapEvents/types.ts:141-146` (blacksmith placement/cadence).
  The answer is: the anvil is reached **through the rest node**, at every
  rest node, at rest-node cadence. Replace the comment with the ruling
  and its date. Keep the `blacksmith` MapEvent kind registered — it is
  built and tested, and a future dedicated node costs nothing to leave
  open — but it stays unauthored in map content.

## Decisions made upfront — DO NOT ASK

- **20% of MAX health**, not of missing health, not of current. T said
  "20% of the player's health"; max is the only reading that does not
  punish the player for being nearly dead — which would invert the whole
  point of a rest node.
- **One upgrade per anvil visit.** "The rest is done/locked" after one
  choice; a multi-buy shop inside one of the three options breaks that.
- The anvil's flat 50 replaces per-verb pricing **at this surface only**.
  D5's `BLACKSMITH_PRICING_PLACEHOLDER` tiers stay in the blacksmith
  engine untouched — this phase pays one price for one action and lets
  the player pick which action.
- **SWAP is not offered here.** It needs variant gear, which no map
  authors yet. Leave the verb in the blacksmith engine; do not surface it.
- No back-out. The node is consumed on entry; a cancel path would burn
  the node for nothing.
- Prices are provisional and marked as such. **52f calibrates.**

## Surface as `[needs-user-call]`

- If 20%-of-max measurably makes the map trivial or brutal, say so with
  numbers — do not re-tune T's stated figure inside this phase.

## Naming — read before writing any copy

`plan/bearings.md` forbids improvising dark-fantasy flavor before Phase
42 ratifies the bible. Use **neutral working names** in code
(`RestChoice`, `rest` / `anvil` / `cut`) and keep player-facing strings
in the mobile copy layer where 44f can rename them. Do not invent a
poetic name for this node in this phase.

## Prove (DoD)

- Hermetic tests: 20% heal exact at several max-VITAE values; inn
  branch heals full + mends; committing one offer locks the other two;
  re-commit is a no-op; each refusal path states its reason and leaves
  the session live; a broke player can still take `rest`; the anvil
  actually mutates the rail via the D5 engine; the cut actually shrinks
  `buildCombatDeck`'s output; deterministic under a stubbed RNG
  (`src/test-utils/rng.ts` — never hand-roll a `Math.random` spy).
- `npm run verify --workspace axiomancer-mechanics`; barrel additions ⇒
  mobile + card-editor re-verify.

## Follow-ups

- 52d renders it; 52e removes the Night Watch it supersedes.
