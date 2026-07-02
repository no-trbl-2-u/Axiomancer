# Hazard Minigame API Guide

Date: 2026-06-12
Status: Shipped consumer guide for `axiomancer-mechanics@0.16.0`
Owner: Mechanics / Mobile integration

## Purpose

This is the downstream-consumer guide for the Hazard minigame engine now owned by `axiomancer-mechanics`. Mobile may own layout, animation, hit targets, and presentation; it must not own Hazard rules, dice legality, card effects, scoring, reward math, or tuning bands.

Companion source-of-truth documents:

- [`docs/hazard-minigame.md`](./hazard-minigame.md) — accepted CDR/design doctrine.
- [`docs/hazard-minigame-prd.md`](./hazard-minigame-prd.md) — product requirements and success metrics.
- [`docs/hazard-minigame-tdd.md`](./hazard-minigame-tdd.md) — state machine, module layout, and integration notes.
- [`docs/hazard-minigame-bdd.md`](./hazard-minigame-bdd.md) — behavior scenarios mirrored by hermetic tests.
- [`docs/hazard-card-expansion-2026-06-11-spec.md`](./hazard-card-expansion-2026-06-11-spec.md) — expanded reward-card roster and keyword rules ported from mobile.
- [`docs/hazard-balance-recommendations.md`](./hazard-balance-recommendations.md) — current balance/tuning evidence.
- [`docs/hazard-playtest-2026-06-10-spec.md`](./hazard-playtest-2026-06-10-spec.md) — prototype playtest findings.

## Package surface

Import Hazard helpers from the top-level package barrel:

```ts
import {
  HAZARD_DICE_COUNT,
  HAZARD_HAND_SIZE,
  HAZARD_MOMENTUM_CAP,
  HAZARD_TUNING,
  HAZARD_DIE_FACES,
  HAZARD_KEYWORDS,
  HAZARD_DECK,
  HAZARD_CRACK_CARD,
  HAZARD_REWARD_CARDS,
  HAZARD_REWARDS,
  HAZARD_CONSEQUENCES,
  HAZARD_SUBQUESTS,
  HAZARD_LIBRARY,
  HAZARD_TYPES,
  getHazardCardDef,
  getHazardSubquestDef,
  getHazardDef,
  hazardStarterBag,
  decodeAcquiredCards,
  hazardDeckBag,
  appendAcquiredCard,
  seedRng,
  createHazardSession,
  selectHazardRoute,
  finishHazardRolling,
  stageHazardCard,
  unstageHazardCard,
  dieCanPower,
  dieCanPowerCard,
  hazardCardPowerColors,
  powerHazardCard,
  chooseHazardCardKey,
  hazardCardValue,
  hazardStagedProgress,
  hazardProjectedProgress,
  applyHazardCard,
  discardHazardCard,
  resolveHazardRound,
  hazardSubquestStatus,
  hazardSubquestResults,
  continueHazardAfterResolve,
  hazardTierOf,
  acknowledgeHazardOutcome,
  claimHazardRewards,
  simulateHazard,
  // Phase 149 - Engagement mechanics
  selectSubquestFromDraft,
  getHazardDeckIdentity,
  removeHazardDeckCard,
  // 2026-06-25 — Foretell resolution
  confirmHazardForetell,
  classifyDeckFocus,
  calculateDeckScars,
  generateRewardOffer,
  generateSubquestDraft,
  chooseSubquest,
  generateDeckIdentity,
  removeCardFromDeck,
  type HazardSessionState,
  type HazardCardDef,
  type HazardDef,
  type HazardRouteKey,
  type HazardDie,
  type HazardHandEntry,
  type HazardOutcome,
  type HazardSubquestDef,
  type HazardSubquestState,
  type HazardQuestMetrics,
  // Phase 149 types
  type HazardDeckFocus,
  type HazardDeckScars,
  type HazardDeckIdentity,
  type HazardRewardOffer,
  type HazardSubquestDraft,
} from 'axiomancer-mechanics';
```

The deeper `src/World/Hazard` path is not a supported package import. Mobile should use the top-level barrel once it consumes the published mechanics build.

## Canonical state machine

The engine-owned phases are:

```text
route-select -> rolling -> playing -> resolving -> outcome -> rewards -> done
                                    |-> foretell-pending -> playing (via confirmHazardForetell)
```

A normal host flow is:

```ts
const bag = hazardDeckBag(gameState.flags);
let session = createHazardSession(seed, bag, 'cracked-cliff');

session = selectHazardRoute(session, 'safe', bag);
session = finishHazardRolling(session);

session = stageHazardCard(session, session.hand[0]!.uid, bag);
session = powerHazardCard(session, session.play[0]!.uid, session.dice[0]!.id);
session = applyHazardCard(session, session.play[0]!.uid, bag);
session = resolveHazardRound(session, bag);

if (session.phase === 'foretell-pending') {
  // FORETELL card applied: session.foretellPending.revealed holds the reordered candidate ids.
  // Player inspects and optionally discards (if session.foretellPending.scour is true).
  // Call confirmHazardForetell with the desired ordering to resume playing.
  const { revealed } = session.foretellPending!;
  session = confirmHazardForetell(session, revealed); // or a subset for scour mode
}

if (session.phase === 'playing') {
  // next round was prepared by continueHazardAfterResolve / resolver flow
}
```

UI should treat no-op returns or rejected state changes as presenter bugs, not as rules to recompute locally.

## Data ownership

Mechanics owns:

- `HazardDef`: scenario, safe/risk route definitions, thresholds, rewards, consequences.
- `HazardCardDef`: action card identities, colors, rarity, top/free row, powered row, utility effects, salvage, keywords, expansion-card rules, and reward-card pool.
- `HazardSessionState`: phase, route, hand, play area, dice, RNG state, marks, momentum, modifiers, subquests, outcome, and acquired reward options.
- Deck persistence: acquired cards encoded in `GameState.flags` via `hazard-card:<id>:<n>`.
- Balance evidence: `simulateHazard` and the hazard balance test matrix.

Mobile owns:

- Stacked route layout, card fan/overlap, drag/tap affordances, animation, palette, glyphs, overlays, and accessibility copy.
- Presenters that map mechanics state to UI props.
- Input choreography before dispatching mechanics transitions.

## Core rules the UI must not invent

- Four dice are cast at route selection.
- Dice faces are `red`, `blue`, `purple`, `gold`, `hex`, `hex`.
- Dice do not auto-refresh, auto-reroll, or freely carry over as mana between rounds. Spent dice stay spent unless card/enchantment text changes them.
- Safe route uses one combined meter.
- Risk route uses dual meters; **both are required** in the same round.
- Gold cards are rare/powerful and normally require gold dice to power.
- Red, blue, purple, and gold all include direct and utility cards; utility includes draw, convert, recast, enchant/aura, burst, vow, choose, and related manipulation.
- Score is the `O`/`X` mark ledger. `hazardTierOf` maps marks to `perfect`, `complete`, or `failure`.
- A failed round (progress threshold not reached, `resolveInfo.cleared === false`) automatically inserts a FRACTURE (CRACK) card into the middle of the draw pile before the next round begins. FRACTURE contributes 0 force/escape and clogs the hand; only a PURGE-family card removes it during a session. Mobile must not insert or count CRACK cards locally — the engine handles this in `processBetweenHazardRounds`.
- Rewards and consequences come from `claimHazardRewards` and the authored hazard/reward tables, not local mobile math.

## Presenter guidance

Mobile may derive labels and visual hints from mechanics data:

- Use `HAZARD_KEYWORDS` for readable keyword explanations.
- Use `HAZARD_TYPES` for meter labels.
- Use `hazardProjectedProgress(session)` to preview staged progress.
- Use `hazardCardPowerColors(def)` / `dieCanPowerCard(die.kind, def)` to show legal die drops.
- Use `hazardSubquestStatus(session, subquest)` and `hazardSubquestResults(session, final)` for optional objective display.

Mobile must not maintain a parallel card library or hidden route-threshold table once the mechanics package version containing this surface is installed.

## Phase 149 — Engagement Mechanics

The engagement layer (shipped in Phase 149) adds strategic deck management and player agency to Hazard rewards. Mobile may present these surfaces but must not compute deck focus, reward filtering, or card removal locally.

### Deck Focus & Identity

```ts
// Classify the persistent Hazard deck
const focus = classifyDeckFocus(deckCardIds);
// Possible values: 'force-heavy', 'escape-heavy', 'gold-utility', 'hex-control', 'scarred', 'mixed'

// Get comprehensive deck summary
const identity = getHazardDeckIdentity(deckCardIds);
// Returns: { focus, scars, cardCount, dominantColors, utilityRatio }
```

### Three-Choice Rewards

Hazard rewards now use a curated three-choice system instead of random draws:

- **Slot A:** Obvious benefit aligned with current deck focus
- **Slot B:** Stronger off-focus temptation (higher rarity/impact)
- **Slot C:** Remove-card option for deck editing

```ts
// Generate the reward offer (done automatically in engine)
const offer = generateRewardOffer(deckCardIds, rngState);

// Mobile can present the remove-card option as a deck grid
if (offer.removeCardOption.available) {
  // Show eligible cards for removal
  const eligibleCards = offer.removeCardOption.eligibleCardIds.map(getHazardCardDef);
}

// Execute deck card removal
const updatedDeck = removeHazardDeckCard(currentDeck, chosenCardId);
```

### Sub-quest Drafting

Players now choose from 2-3 candidate sub-quests before route selection:

```ts
// Access draft candidates from session state
const candidates = session.subquestDraft.candidates;
const chosen = session.subquestDraft.chosen;

// Let player select a sub-quest
const updatedSession = selectSubquestFromDraft(session, chosenSubquestId);
```

### Deck Scars

Visible tracking of CRACK cards and deck burden:

```ts
const scars = calculateDeckScars(deckCardIds);
// Returns: { crackCount, totalCards, scarRatio }

// Mobile can surface scar ratio as a deck health indicator
const healthPercent = Math.max(0, 100 - (scars.scarRatio * 100));
```

## MTG-inspired card expansion (2026-06-25 / 2026-06-26)

New `HazardCardEffect` keywords and matching `HazardCardDef` fields added in `v0.32.1` (FORETELL/ECHO/SCOUR/PURGE/BURSTMEND) and `v0.32.2` (JEOPARDY/MIRACLE/BUYBACK/DELVE):

| Keyword / field | Description |
|---|---|
| `effect: 'foretell'` | Reveal top N draw-bag cards. Player reorders freely; with `foretellScour: true` may also permanently discard any number (Surveil-equivalent). Resolves via `confirmHazardForetell`. |
| `foretellBase` / `foretellPowered` | Cards revealed at unpowered / powered tier. |
| `foretellScour` | When `true`, player may discard any number of revealed cards (not just reorder). |
| `foretellDrawCount` | Cards drawn immediately after `confirmHazardForetell` resolves. |
| `effect: 'echo'` | Burst-scaling analogue: awards `echoPerCardForce` / `echoPerCardEscape` for each card already applied this round. Rewards playing ECHO last in a sequence. Powered tier doubles the bonus. |
| `echoPerCardForce` / `echoPerCardEscape` | Per-card bonus force / escape for the ECHO keyword. |
| `effect: 'scour'` | Direct deck-thinning effect that lets the player permanently discard the top N cards from the draw bag without revealing them to reorder. |
| `purgeDrawCount` | After a PURGE effect fires, draw this many additional cards. |
| `burstMendBase` / `burstMendPowered` | MEND rider on a BURST card: queues a vitae restoration at claim, offsetting the burst's vitae cost. |
| `burstPerUnspentDieEscape` | TIDE TURNS variant: awards escape per unspent non-hex die still in the pool at apply time. |
| `effect: 'jeopardy'` | JEOPARDY (Spectacle analogue): awards `jeopardyForce` / `jeopardyEscape` bonus when ≥1 round mark is already `'X'` (i.e. the player has previously failed a round). Comeback mechanic — the card becomes stronger the worse things are going. No host interruption needed; engine applies the bonus automatically in `applyHazardCard`. |
| `jeopardyForce` / `jeopardyEscape` | Bonus force / escape awarded when the jeopardy trigger fires. |
| `effect: 'miracle'` | MIRACLE (Miracle analogue): awards `firstPlayForce` / `firstPlayEscape` bonus when this card is the **first** card applied in the current round (no prior applied cards in `s.play`). Rewards leading with the miracle card rather than saving it. No host interruption; engine checks `s.play` count at apply time. |
| `firstPlayForce` / `firstPlayEscape` | Bonus force / escape awarded when the miracle (first-play) trigger fires. |
| `buyback` | BUYBACK (Buyback analogue): when this card is applied **and** powered by a die (`dieId !== null`), it is returned to hand at the start of the next round (via `continueHazardAfterResolve`) instead of going to the discard pile. Mobile does not need to track this — the engine adds a fresh entry to `s.hand` automatically. |
| `effect: 'delve'` | DELVE (Delve analogue): awards `delveForce × s.discardPile.length` and/or `delveEscape × s.discardPile.length` bonus at apply time. Scales with how many cards have already been spent — rewards late-round or multi-round commitment. No host interruption; engine reads `s.discardPile.length` at apply time. |
| `delveForce` / `delveEscape` | Per-discard-pile-card bonus force / escape for the DELVE keyword. |

The `foretell-pending` session phase is the interruption point between `applyHazardCard` (FORETELL card) and the player's reorder confirmation. Mobile must check for this phase and show the revealed cards before calling `confirmHazardForetell`.

```ts
session = applyHazardCard(session, foretellCardUid, bag);

if (session.phase === 'foretell-pending') {
  const { revealed, scour } = session.foretellPending!;
  // Mobile: show revealed cards; if scour, allow multi-select for discard
  const orderedIds = scour ? playerSelectedSubset : revealed;
  session = confirmHazardForetell(session, orderedIds);
  // session.phase returns to 'playing'
}
```

## Migration note

During the low-turbulence migration, the mobile repo may temporarily retain its `state/hazard/*` files as a compatibility mirror until a mechanics package release is installed. From this point forward, those files are not doctrine. Corrections land first in `axiomancer-mechanics/src/World/Hazard/*`, with mobile following as a UI consumer.
