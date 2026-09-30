# Hazard Minigame API Guide

Date: 2026-09-30
Status: Shipped consumer guide (the minimal ten-card deck, THE REVAMP R6)
Owner: Mechanics / Mobile integration

## Purpose

This is the downstream-consumer guide for the Hazard minigame engine now owned by `axiomancer-mechanics`. Mobile may own layout, animation, hit targets, and presentation; it must not own Hazard rules, dice legality, card effects, scoring, reward math, or tuning bands.

Companion source-of-truth documents:

- [`docs/encounters/hazard.md`](./encounters/hazard.md) — the current rules, deck, and hazard library.
- [`docs/hazard-minigame.md`](./hazard-minigame.md) — accepted CDR/design doctrine (v0 vocabulary).
- [`docs/hazard-minigame-prd.md`](./hazard-minigame-prd.md) — product requirements and success metrics.
- [`docs/hazard-minigame-tdd.md`](./hazard-minigame-tdd.md) — state machine, module layout, and integration notes.
- [`docs/hazard-minigame-bdd.md`](./hazard-minigame-bdd.md) — behavior scenarios mirrored by hermetic tests.
- [`docs/hazard-playtest-2026-06-10-spec.md`](./hazard-playtest-2026-06-10-spec.md) — prototype playtest findings.

## Package surface

The Hazard module's surface lives in `src/World/Hazard` (its `index.ts`).
The top-level package barrel re-exports only the names mobile consumes; the
module adds `seedRng`, `hazardCardValue`, and the `HazardDef` type:

```ts
import {
  HAZARD_TUNING,
  HAZARD_KEYWORDS,
  HAZARD_DECK,
  HAZARD_CRACK_CARD,
  HAZARD_REWARDS,
  HAZARD_CONSEQUENCES,
  HAZARD_VITAE_REWARD,
  HAZARD_SHILLINGS_REWARD,
  HAZARD_RISK_SHILLINGS_REWARD,
  HAZARD_MINHP_LOSS,
  HAZARD_MAXHP_SCAR,
  HAZARD_LIBRARY,
  getHazardCardDef,
  getHazardDef,
  HAZARD_CARD_FLAG_PREFIX,
  hazardStarterBag,
  decodeAcquiredCards,
  hazardDeckBag,
  appendAcquiredCard,
  hazardProjectedProgress,
  dieCanPowerCard,
  createHazardSession,
  selectHazardRoute,
  finishHazardRolling,
  stageHazardCard,
  unstageHazardCard,
  powerHazardCard,
  applyHazardCard,
  discardHazardCard,
  resolveHazardRound,
  continueHazardAfterResolve,
  acknowledgeHazardOutcome,
  claimHazardRewards,
  type HazardColor,
  type HazardDieKind,
  type HazardProgressKey,
  type HazardCardDef,
  type HazardHandEntry,
  type HazardRouteKey,
  type HazardMark,
  type HazardOutcomeTier,
  type HazardPhase,
  type HazardSessionState,
} from 'axiomancer-mechanics';
```

The balance simulator (`simulateHazard`, `generateHazardBalanceReport`) lives
in `hazard.sim.ts` and is test/tooling surface, not host surface.

## Canonical state machine

The engine-owned phases are:

```text
route-select -> rolling -> playing -> resolve-flash -> (playing | outcome) -> rewards -> done
```

A normal host flow is:

```ts
const bag = hazardDeckBag(gameState.flags);
let session = createHazardSession(seed, bag, 'cracked-cliff');

session = selectHazardRoute(session, 'safe', bag);   // casts the four dice
session = finishHazardRolling(session);

session = stageHazardCard(session, session.hand[0]!.uid, bag);
session = powerHazardCard(session, session.play[0]!.uid, session.dice[0]!.id, bag);
session = applyHazardCard(session, session.play[0]!.uid, bag);
session = resolveHazardRound(session, bag);           // -> 'resolve-flash'
session = continueHazardAfterResolve(session, bag);   // next round, or 'outcome' after the last

if (session.phase === 'outcome') {
  session = acknowledgeHazardOutcome(session);        // -> 'rewards'
  session = claimHazardRewards(session, session.outcome!.offerCards[0]?.id ?? null); // -> 'done'
}
```

Illegal transitions return the same state reference. UI should treat no-op returns as presenter bugs, not as rules to recompute locally.

## Data ownership

Mechanics owns:

- `HazardDef`: scenario and intro copy, safe/risk route definitions, thresholds, and per-round VITAE penalty.
- `HazardCardDef`: the ten core cards and the CRACK card — colour, rarity, free row (`f`/`e`), powered row (`fp`/`ep`), utility effect (`draw`, `convert`, `recast`), gold `majorEffect`, salvage, and keywords.
- `HazardSessionState`: phase, route, hand, play area, draw/discard piles, dice, RNG state, marks, momentum (`progressBase`, `momentumCap`), resolve info, outcome, and the picked reward card.
- Rewards and consequences: `HAZARD_REWARDS` (`shillings` +12, `riskShillings` +32, `vitae` +6) and `HAZARD_CONSEQUENCES` (`deadcard`, `maxhp`, `minhp`).
- Deck persistence: acquired cards encoded in `GameState.flags` via `hazard-card:<id>:<n>`; the starter bag is implicit.
- Balance evidence: `simulateHazard` and the hazard balance test matrix.

Mobile owns:

- Stacked route layout, card fan/overlap, drag/tap affordances, animation, palette, glyphs, overlays, and accessibility copy.
- Presenters that map mechanics state to UI props.
- Input choreography before dispatching mechanics transitions.

## Core rules the UI must not invent

- Four dice are cast once, at route selection, and last the whole hazard.
- Dice faces are `red`, `blue`, `purple`, `gold`, `gold`, `hex`. Gold is wild; hex (✕) can never be spent.
- Dice do not auto-refresh or re-roll between rounds. Spent dice stay spent; only RE-CAST, CONVERT, and mana salvage change the pool.
- A die powers a card of its own colour, or any card if it is gold. Gold cards need a gold die.
- Safe route uses one combined meter.
- Risk route uses dual meters; **both are required** in the same round.
- Red cards fill FORCE, blue cards fill ESCAPE. Purple cards pay a low number to both meters plus a minor utility (DRAW, CONVERT, RE-CAST) that a die upgrades to major. Gold cards fire their major utility for free and pay their dual number only when a die is applied.
- Utilities fire once, on APPLY (or when PLAY auto-applies the staged set). Applied cards are locked.
- Salvage: binning a hand card grants its salvage — +1 of one meter for this round only, or a temporary die of the card's colour.
- Momentum: a cleared round carries half its surplus (capped at 3) into the next; failed and final rounds carry nothing.
- Score is the `O`/`X` mark ledger: all cleared is `perfect`, one or more is `complete`, none is `failure`.
- A failed round inserts a CRACK card into the middle of the draw pile before the next round. CRACK contributes nothing and cannot be powered. Mobile must not insert or count CRACK cards locally — the engine handles this in `continueHazardAfterResolve`.
- The card offer after a clear is three distinct core cards: a perfect run's first slot is a gold rare, a one-win run offers no rare, and only a perfect run may skip.
- Rewards, consequences, the route penalty, and the reserve bonus (+1 VITAE per unspent non-hex die on a clear) come from `HazardOutcome`, not local mobile math.

## Presenter guidance

Mobile may derive labels and visual hints from mechanics data:

- Use `HAZARD_KEYWORDS` (SURGE, FORCE, ESCAPE, DRAW, CONVERT, RE-CAST, GILDED, SALVAGE, CRACK) for readable keyword explanations.
- Use `hazardProjectedProgress(session)` to preview staged progress.
- Use `dieCanPowerCard(die.kind, def)` to show legal die drops.

Mobile must not maintain a parallel card library or hidden route-threshold table.

## Save migration

`GAME_STATE_VERSION` 32 drops every `hazard-card:<id>:<n>` flag whose id is not a core card or `crack`; cards from the retired reward pool leave the deck without a refund.
