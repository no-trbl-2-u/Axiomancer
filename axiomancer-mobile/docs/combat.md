# Combat screen

> **Hazard-Pattern Combat (mechanics Spec 25, mobile Spec 26 / 26b) is the
> ONLY combat engine.** The legacy turn-based resolver this doc used to
> describe (`resolveCombatRound`, the four-phase `choosing_stance` loop,
> `app/(tabs)/combat.tsx`) was fully removed from the engine in 2026-06 —
> see `plan/bearings.md` § "Which combat engine is canonical". **Never**
> resurrect that shape for a combat gate or playtest. The engine-side rules
> live in [`axiomancer-mechanics/docs/combat.md`](../../axiomancer-mechanics/docs/combat.md);
> this doc describes only what the **mobile screen** renders and how it
> drives that engine. (History: the retired screen was pinned by
> [Spec 04](../../plan/archive/2026-09-25-trim-t5/axiomancer-mobile/specs/04-combat-screen-wiring.md), archived as a decision
> record — do not treat it as current.)

## Entry points

Combat is a card-and-dice surface hosted by
[`<CombatEncounterPanel>`](../components/combat/encounter/CombatEncounterPanel.tsx),
mounted from two places:

- [`app/combat-encounter/index.tsx`](../app/combat-encounter/index.tsx) —
  dev-only launcher route. Bootstraps a mock foe + demo deck and passes
  `persistOutcome={false}`, so playing here never mutates the real
  player's progression (a sandbox).
- `EncounterModalOverlay` (live map flow) — feeds the panel the real
  enemy + player and sets `persistOutcome={true}`.

## Data flow

```text
CombatEncounterState (pure, from axiomancer-mechanics)
        │  held in <CombatEncounterPanel>'s local React state
        │  advanced by calling engine transition functions directly
        │  (initializeCombatEncounter, rollEncounterDice, playCombatCard,
        │   endTurn, resolveThreatPhase, playSignatureSkill, …)
        ▼
buildCombatViewModel(state)  ──►  CombatViewModel
  (state/presenters/combat-encounter.engine.ts)
        ▼
<CombatBoard>  (components/combat/encounter/CombatBoard.tsx)
```

Unlike the retired screen, there is no separate "action layer" module —
the panel calls the `@mechanics` transition functions from `@mechanics`
directly and re-renders from the returned `CombatEncounterState`. The
presenter (`buildCombatViewModel`) is the only translation step, and owns
the engine → view-model mapping; the board owns all UI/interaction.

`persistOutcome` (live play only) hand-rolls the economy write-back the
engine intentionally omits (it has no economy layer): final HP →
`player.health`, `enemy.xpReward` → experience (+ level-ups),
`rollLoot(enemy.loot)` → inventory, plus the deckbuilder reward card.

## Phases

The engine's `CombatEncounterState.phase` (`CombatEncounterPhase` in
`axiomancer-mechanics`) drives the loop:

| Phase | Meaning |
|---|---|
| `reveal` | Enemy + opening hand visible, before dice are rolled. |
| `dice-roll` | Player rolls stance dice (`rollEncounterDice`). |
| `phase-play` | Player plays cards (`playCombatCard` with the chosen die; `endTurn` banks one unspent die). |
| `phase-resolve` | Effect kinds compared, enemy threat action fires, phase graded Clear/Overwhelmed (`resolveThreatPhase`). |
| `between-phases` | DoT ticks, durations tick, hand draws back to 5. |
| `mercy-choice` | Control Saturation opened the spare/exploit modal (`selectMercyChoice`). |
| `complete` | Combat over, `finalOutcome` determined. |

## Turn flow (Spec 26b)

Per turn, inside `phase-play` (spec 33, the Upgradeable-Dice model — the
only combat model since the D7 flag collapse): **reveal → roll the four
fixed-colour dice (each shows a SPECIAL, MANA or MISS face) → drag any live
die onto a staged card of its colour (WILD powers any) to POWER it → END
PHASE to bank one unspent die and resolve the threat phase.**

The drag-to-power interaction model (unchanged since introduction, per
`CombatBoard.tsx`'s own header comment):

1. Drag a card UP into the play region to **stage** it (drag to the scrap
   zone to discard instead).
2. Drag a **die** onto the staged card to power it — this only *selects*
   the die; it isn't committed yet, and can be re-dragged to a different
   card.
3. Read the card's live keyword line (the projected hit).
4. Tap **APPLY** (the ribbon fused to the staged card) to commit.

A die powers only the card it was dropped (or tapped) onto. A die a
refresh rider hands back stays live in the tray for another card via an
explicit re-drop — it never auto-attaches to the next staged card.

## Board layout

`CombatBoard` is a full-bleed battlefield with floating chrome, not a
scrolling panel stack:

| Region | Renders |
|---|---|
| Battlefield + top HUD | `CombatCombatantPane` — enemy pane, player pane, intent telegraph, effect chips. |
| Play region | Invisible drop target; dashed affordance shows only while a card drag is live. |
| Signature rune column | Left edge — Conviction chip + circular signature runes. |
| Dice row | Free-floating gem dice above the hand. |
| Hand fan | Edge-to-edge arc of playable cards. |
| Corner medallions | Player portrait (tap → pilgrim modal) and the END PHASE button. |
| Bottom rail | HP, phase ledger (`ledger`/`phaseBadge`/`roundLabel`/`turnLabel`), deck/discard counts. |

There is no scrolling battle log in the current UI (the retired screen's
severity-coloured log is gone); state changes read from the board itself
plus transient FX (`CombatFx`).

## View-model

`CombatViewModel` (`state/presenters/combat-encounter.engine.ts`) is the
single frozen object the board renders — `phase`, `enemy`, `player`,
`dice`, `hand`, `conviction`, `signatures`, `resonance`, the Spec 33
`momentumV2` / `playerStance` / `dieGear` / `pressFate` surfaces, and
`diceRolled`. See the file's own interfaces
(`CombatEnemyPaneVM`, `CombatPlayerPaneVM`, `CombatCardVM`, `CombatDieVM`,
…) for the full per-region shape — they're the source of truth, not this
doc.

## Tests

| What | Where |
|---|---|
| Component render — the combat-encounter screen mounts and plays through phases | [`state/e2e/combat-encounter.screen.test.tsx`](../state/e2e/combat-encounter.screen.test.tsx) |
| Multi-stage board interaction (drag/END PHASE guards) | [`components/combat/encounter/__tests__/CombatBoard.multistage.test.tsx`](../components/combat/encounter/__tests__/CombatBoard.multistage.test.tsx) |

`npm test` must pass twice in a row and `npx tsc --noEmit` must be clean
before declaring a combat change done. See [`docs/testing.md`](./testing.md).
