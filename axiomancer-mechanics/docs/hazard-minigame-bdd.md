# Hazard Minigame — Behavior-Driven Development Specifications

> Companion to [`docs/hazard-minigame.md`](./hazard-minigame.md) (CDR-0006 doctrine),
> [`docs/hazard-minigame-prd.md`](./hazard-minigame-prd.md), and
> [`docs/hazard-minigame-tdd.md`](./hazard-minigame-tdd.md).
>
> Scenarios here map directly to hermetic e2e test cases in
> `src/World/Hazard/e2e/hazard.engine.test.ts`.
> Every scenario is testable with stubbed RNG — no UI, no async.
>
> **Terminology:** "top route" = safe route; "bottom route" = risk route.
> Risk route rounds always require dual meters (BOTH REQUIRED).
> Mana die colors: Red, Blue, Purple, Gold, X (×2). No Green or Yellow.
> Exhausted dice reset to available between rounds; spent dice do not auto-reset.

---

## Feature: Hazard Start Sequence

**Background:** A player enters a hazard node. The hazard engine initializes.

---

**Scenario: Hazard card is revealed and opening hand is drawn before route choice**

```
Given a hazard card H01 (Cracked Cliff Path, 3 rounds)
And the player has a deck of 10 action cards
When the hazard is initialized
Then the phase is 'reveal'
And no route has been chosen
And no dice have been rolled

When the player draws their opening hand
Then the player holds exactly 5 cards
And those 5 cards are removed from the deck
And the phase is 'route-select'
And no dice have been rolled yet
```

---

**Scenario: Route is chosen before dice roll**

```
Given the hazard phase is 'route-select'
And the player holds 5 action cards
When the player selects 'bottom' route
Then the chosen route is 'bottom'
And the phase is 'dice-roll'
And no dice have been rolled yet
```

---

**Scenario: Dice are rolled once after route selection**

```
Given the chosen route is 'bottom'
And the phase is 'dice-roll'
When the dice are rolled with a fixed RNG producing [red, blue, gold, x]
Then there are exactly 4 mana dice
And their colors are red, blue, gold, X
And all dice are in state 'available'
And the phase advances to 'round-play'
```

---

## Feature: Mana Dice

---

**Scenario: Safe route dice persist between rounds without auto-refresh**

```
Given a Safe route hazard in round 1 with dice [red, blue, purple, gold] all 'available'
When the player spends the red die (bottom action cost)
And round 1 resolves
And between-rounds processing completes (no enchantments active)
Then at the start of round 2, the red die is still 'spent'
And the blue, purple, gold dice remain 'available'
```

---

**Scenario: X die cannot be spent**

```
Given a hazard in round 1 with dice [red, x, blue, gold]
When the player attempts to play a bottom action with cost '1 any'
Then the X die cannot satisfy the 'any' cost
And only the red, blue, and gold dice are eligible to spend
```

---

**Scenario: Temporary dice expire at end of round**

```
Given a hazard in round 1
And the player plays a mana-creation card that creates 1 temporary die
  (Note: 'Find the Vein' creates a Gold die post-color-migration; card text must be confirmed
   after the card color migration is completed — see docs/hazard-minigame.md Card Color Migration)
Then there are now 5 dice total
And the new die has temporary = true

When round 1 resolves
And between-rounds processing runs
Then the temporary die is removed (state = 'discarded' / expired)
And there are 4 dice total again in round 2
```

---

**Scenario: Safe route exhausted die resets to available at round end**

```
Given a Safe route hazard in round 1 with a blue die in state 'available'
When the player plays 'Bitter Harvest' top action (Exhaust 1 die; +3 Force)
And the blue die is marked 'exhausted'
And round 1 resolves
And between-rounds processing completes (no enchantments active)
Then at the start of round 2, the blue die is in state 'available'
And the die's color is unchanged
```

*(On Safe, exhausted state does not persist between rounds — it resets automatically in between-rounds processing, unlike spent dice which persist until explicitly refreshed by a card or enchantment.)*

---

**Scenario: Risk route does not re-cast dice between rounds**

```
Given a Risk route hazard in round 1 with dice [red, blue, purple, gold]
And the red die is 'spent'
And the blue die is 'available'
When round 1 resolves
And between-rounds processing completes without a re-cast card
Then round 2 has the same four dice
And the red die still carries the prior round's 'spent' state
And the blue die remains 'available'
```

---

**Scenario: Preserved die carries state into next round**

```
Given a hazard with 'Iron Discipline' enchantment active
And dice includes a blue die in state 'available'
When between-rounds processing fires
Then the player may choose one available die to preserve
And the chosen die carries into round 2 still 'available'
```

---

**Scenario: Refreshed spent die returns to available**

```
Given a hazard with 'The Watcher's Lamp' enchantment active
And the red die is in state 'spent' after round 1
When between-rounds processing fires
Then the player may choose one spent die to refresh
When the red die is chosen
Then the red die returns to state 'available' in round 2
```

---

## Feature: Action Cards

---

**Scenario: Top action is free**

```
Given a player holds 'Force Through' (top: +2 Force)
And round 1 is in progress with 0 Force accumulated
When the player plays 'Force Through' top action
Then Force progress increases by 2
And no mana dice are spent
```

---

**Scenario: Bottom action requires mana and is stronger**

```
Given a player holds 'Force Through' (bottom: spend 1 red → +5 Force)
And the red die is 'available'
And 0 Force is accumulated
When the player plays 'Force Through' bottom action
Then the red die transitions from 'available' to 'spent'
And Force progress increases by 5
```

---

**Scenario: Bottom action fails if mana cost cannot be met**

```
Given a player holds 'Force Through' (bottom: spend 1 red → +5 Force)
And no red dice are in state 'available'
When the player attempts to play 'Force Through' bottom action
Then the action is rejected
And dice states are unchanged
And progress is unchanged
```

---

**Scenario: Focus buff stacks on the next progress card**

```
Given round 1 is in progress with 0 Force accumulated
When the player plays 'Clear Mind' top action (Focus +2)
Then the focus buffer is 2

When the player then plays 'Force Through' top action (+2 Force)
Then Force progress increases by 4 (2 base + 2 Focus)
And the focus buffer resets to 0
```

---

**Scenario: Focus buff applies to the very next progress value, then clears**

```
Given a focus buffer of 3
When the player plays a card that adds +4 Supply
Then Supply increases by 7
And the focus buffer is 0

When the player plays a second card that adds +3 Stability
Then Stability increases by 3 (Focus already consumed)
```

---

**Scenario: ENCHANT card moves to enchantment zone, not discard**

```
Given the player holds 'The Watcher's Lamp' (bottom: ENCHANT)
And a blue die is 'available'
When the player plays 'The Watcher's Lamp' bottom action
Then the blue die transitions to 'spent'
And 'The Watcher's Lamp' is in the enchantment zone
And 'The Watcher's Lamp' is NOT in the discard pile
And 'The Watcher's Lamp' is NOT in the deck
```

---

## Feature: X-Die Interaction Cards

---

**Scenario: Scavenge Fate rerolls an X die**

```
Given the X die is in state 'available' with color 'x'
When the player plays 'Scavenge Fate' top action (Reroll 1 X die)
And the RNG produces 'blue' for the reroll
Then the die's color is now 'blue'
And the die's state remains 'available'
```

---

**Scenario: Scavenge Fate bottom creates purple if re-roll stays X**

```
Given two X dice are available
When the player plays 'Scavenge Fate' bottom action (spend 1 purple → reroll all X)
And the RNG produces [x, blue] for the rerolls (first stays X, second becomes blue)
Then the first die remains X
And the second die becomes blue
And 1 temporary purple die is created (for the die that stayed X)
And the purple die is available this round
```

---

**Scenario: Curse Work treats X as purple this round**

```
Given an X die is available
And the player plays 'Curse Work' top action (Treat 1 X as purple)
Then the X die is treated as purple for mana-spending purposes this round
And a bottom action costing 1 purple can use this die
```

---

**Scenario: X die cannot be interacted with without an X-interaction card**

```
Given the X die is available
And the player holds no X-die interaction cards
When the player attempts to use the X die as a mana cost
Then the attempt is rejected
And the X die state is unchanged
```

---

## Feature: Round Resolution

---

**Scenario: Single-type round resolves O when threshold is met**

```
Given hazard H01 top route, round 1, threshold = 6 Stability
And the player has accumulated 7 Stability
When round 1 resolves
Then round 1 is marked O
And no penalties are applied
```

---

**Scenario: Single-type round resolves X when threshold is not met**

```
Given hazard H01 top route, round 1, threshold = 6 Stability
And the player has accumulated 4 Stability
When round 1 resolves
Then round 1 is marked X
And the top route failure penalty is applied (H01 top: no extra penalty)
```

---

**Scenario: Risk route requires BOTH meters to be met (dual-meter)**

```
Given hazard H03 risk route (bottom), round 1, threshold = 5 Escape + 5 Force
And the player has accumulated 7 Escape and 3 Force
When round 1 resolves
Then round 1 is marked X (Force threshold not met — BOTH REQUIRED)

Given the same hazard, round 2, threshold = 5 Escape + 5 Force
And the player has accumulated 5 Escape and 5 Force
When round 2 resolves
Then round 2 is marked O (both thresholds met)
```

*(Risk route rounds always require dual meters. A player who clears one meter but not the other has failed the round. This is the defining property of the risk route — it is not single-meter play at harder numbers.)*

---

**Scenario: Final round uses elevated threshold**

```
Given hazard H01 top route, rounds = 3
And the per-round threshold for rounds 1–2 = 6 Stability
And the final round threshold = 8 Stability
When round 3 resolves with 7 Stability accumulated
Then round 3 is marked X (did not clear 8)
```

---

**Scenario: Final round failure applies additional penalty**

```
Given hazard H10 bottom route, final round (round 3)
And the final round failure penalty = lose 2 VITAE
And the per-round failure penalty = none
When round 3 resolves as X
Then 2 VITAE is deducted
```

---

**Scenario: Per-round penalty accumulates across rounds**

```
Given hazard H01 bottom route, rounds = 3
And the per-round failure penalty = lose 1 VITAE
When rounds 1 and 2 both resolve as X
Then 2 VITAE total has been deducted after round 2
```

---

**Scenario: 'mark 1 additional X' penalty adds to score**

```
Given hazard H05 bottom route, round 1
And round 1 resolves as X
And the per-round failure penalty = mark 1 additional X
Then the score marks 2 X for round 1 (1 from resolution + 1 from penalty)
And the final score calculation includes both X marks
```

---

## Feature: Scoring and Rewards

---

**Scenario: 3-round win scores +3**

```
Given hazard H01, 3 rounds, all resolved O
When the hazard completes
Then finalScore = 3
And the strong reward is granted (H01 top: minor supplies + safe advance)
```

---

**Scenario: 3-round partial win**

```
Given hazard H01, 3 rounds, rounds 1–2 = O, round 3 = X
When the hazard completes
Then finalScore = 1
And the minor reward tier applies
```

---

**Scenario: Full loss on 3-round hazard**

```
Given hazard H01, 3 rounds, all resolved X
When the hazard completes
Then finalScore = -3
And the bad outcome penalty applies
```

---

**Scenario: Hold the Line converts X to O at hazard end**

```
Given a hazard with rounds = [X, O, X] before conversion
And the player played 'Hold the Line' bottom (at end of scoring, convert 1 X to O)
When the hazard completes
Then 1 X mark is converted to O
And rounds resolve as [O, O, X]
And finalScore = 1
```

---

## Feature: Card Deck

---

**Scenario: Deck reshuffles when emptied mid-round**

```
Given a hazard in round 3 with 2 cards remaining in the deck and 8 cards in discard
When the round begins and 5 cards need to be drawn
Then the 2 remaining deck cards are drawn first
And the 8 discard cards are reshuffled into a new deck
And 3 more cards are drawn from the reshuffled deck
And the hand has 5 cards total
```

---

**Scenario: ENCHANT cards are never reshuffled**

```
Given 'The Watcher's Lamp' is in the enchantment zone
And the deck empties triggering a discard reshuffle
When the discard is reshuffled
Then 'The Watcher's Lamp' remains in the enchantment zone
And it does NOT appear in the reshuffled deck
```

---

## Feature: Dev Mode

---

**Scenario: Dev hand injection adds a card to hand without touching the deck**

```
Given a hazard in round 2 with hand = [cardA, cardB]
And the deck has 6 cards
When a dev injection adds 'Hold the Line' to hand
Then hand = [cardA, cardB, 'Hold the Line']
And the deck still has 6 cards
And the discard is unchanged
```
