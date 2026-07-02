# Engine Upgrade: axiomancer-mechanics 0.15.1 → 0.16.0

Date: 2026-06-10  
Status: Applied in mobile  
Package: `axiomancer-mechanics@^0.16.0`

## Summary

Mobile now consumes `axiomancer-mechanics@0.16.0`, the Hazard minigame mobile-consumer release.

This mechanics bump is documentation/package-surface focused. It publishes the Hazard minigame design and API guidance with the npm tarball and documents the existing top-level Hazard exports that mobile should consume.

## What changed upstream

Mechanics `0.16.0` adds and publishes:

- `docs/hazard-minigame-api.md` — consumer guide for public Hazard imports, legal state-machine order, route/card/dice contracts, scoring, mobile presenter boundary, and v0 caveats.
- Hazard docs in the published npm package:
  - `docs/hazard-minigame.md`
  - `docs/hazard-minigame-api.md`
  - `docs/hazard-minigame-prd.md`
  - `docs/hazard-minigame-tdd.md`
  - `docs/hazard-minigame-bdd.md`
- README/release notes for the Hazard public API surface.

## Mobile dependency change

```json
{
  "dependencies": {
    "axiomancer-mechanics": "^0.16.0"
  }
}
```

## Hazard integration contract

Mobile should import Hazard helpers from the top-level package barrel only:

```ts
import {
  ACTION_CARD_LIBRARY,
  HAZARD_CARD_LIBRARY,
  STARTER_DECK_CARD_IDS,
  advanceToNextRound,
  computeFinalScore,
  drawOpeningHand,
  getActionCard,
  getHazardCard,
  getRandomHazardCard,
  initializeHazard,
  playCardInRound,
  resolveRound,
  rollDiceAndStartRound,
  selectRoute,
  type HazardActionCard,
  type HazardCard,
  type HazardManaDie,
  type HazardMinigameState,
  type HazardPhase,
  type HazardProgressType,
  type HazardRoundResult,
} from 'axiomancer-mechanics';
```

Do not deep-import `World/Hazard` implementation files.

## UI ownership boundary

Mechanics owns:

- Hazard phase transitions.
- Hazard route thresholds.
- Card effects.
- Hand/discard/enchantment movement.
- Mana dice state and spend legality.
- Round `O` / `X` marks.
- Final `O - X` score.

Mobile owns:

- Screen layout.
- Animation and feedback.
- Affordance hints.
- Route/card/dice/ledger presentation.
- Presenter tests proving it renders engine state truthfully.

## Current v0 caveats

These are upstream v0 boundaries, not mobile regressions:

- Hazard penalties are typed but round penalty application is not fully wired.
- Map benefit/penalty types exist but are not live world-state mutations yet.
- Hazard sessions are standalone engine state; no `GameState` reducer action owns a live hazard session yet.

## Verification

Run after this bump:

```bash
npm run typecheck
npm run verify
```

Recommended follow-up focused coverage:

- route choice visible before dice roll;
- X dice render blocked unless X-interaction is legal;
- card bottom action affordance follows engine affordability;
- round ledger renders `O` / `X` in order;
- final score renders only after `computeFinalScore`.
