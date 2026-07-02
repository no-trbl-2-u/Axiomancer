# Phase 161 — Combat card overhaul: finish UI polish to all-critics-shippable

Filed 2026-06-28 (T direct steering, combat-overhaul campaign).

## Context
The harsh-critic loop (rounds 1-3) shipped the card overhaul to mobile main (`d019b0a..ffc8c8f`): legible DoT (`BLEED · 18 · over 3 turns`), keyword-as-hero, Sanguine-Step detail modal with a reachable ✕, bigger 104×140 hand, dice WYSIWYG ring, amplified fx, Circe art, and the 0.34.0 keyword light-up. Round 3 verdicts were **1 minor-polish / 4 needs-work** — not yet unanimous "shippable-as-is."

## Scope (combat UI only)
Close the residual nits the critics flagged:
- **END-PHASE / SCRAP occlusion:** the controls still overlap the rightmost fan cards — reserve gutters or move END PHASE to a full-width bar below the hand.
- **Card-art proportions** + any residual mid-card dark band on the large inspect card.
- **Dice drag-hover:** highlight the target staged card BEFORE release (mirror the `resolveDrop` `rectContains` hit-test on `drag.move`).
- **Animation per-channel polish:** ~80ms hitstop synced to the `-N` pop; sequence cause→effect (delay player recoil/flash ~100ms so impact lands at the lunge apex); status-keyword floats for zero-damage control/buff intents (handle `effect-landed`); keep the flash portrait-scoped.
- Any remaining detail-modal tightening.

## Process
Run another critic round (Workflow: 5 critics → debate → converge → integrator → verify) on a fresh `scripts/combat-shots.mjs` capture, or hand-polish. Repeat until the critics have ~no negatives (UI-scoped verdict).

## Files
`components/combat/encounter/CombatBoard.tsx`, `CombatEncounterPanel.tsx`, `CombatCombatantPane.tsx`, `state/presenters/combat-encounter.engine.ts`.

## Verification
Component tests + `npm run typecheck` + `npm test`; `npm run verify:visual` + a fresh combat-shots capture (visual phase). Land on `combat-overhaul` → `main`.
