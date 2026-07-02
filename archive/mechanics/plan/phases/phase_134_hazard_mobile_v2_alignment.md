# Phase 134 — Hazard Mobile v2 Alignment

## Outcome

Replace the Phase 131 / CDR-0006 hazard minigame rules with the current mobile v2 rules proven in `axiomancer-mobile/state/hazard/`, so `axiomancer-mechanics` becomes the package source of truth again and mobile can delete its local mechanics behind issue no-trbl-2-u/axiomancer-mobile#333.

## Source spec

Primary source: `docs/hazard-v2-vs-mechanics-divergence.md`, refreshed from current mobile source inspection on 2026-06-11.

Related tracking:

- Mechanics extraction issue: no-trbl-2-u/axiomancer-mechanics#154
- Mobile package-consumption issue: no-trbl-2-u/axiomancer-mobile#333
- Existing v0 docs/API: `docs/hazard-minigame.md`, `docs/hazard-minigame-api.md`, `docs/hazard-minigame-prd.md`, `docs/hazard-minigame-tdd.md`, `docs/hazard-minigame-bdd.md`
- Existing mechanics implementation: `src/World/Hazard/`
- Mobile extraction source: `../axiomancer-mobile/state/hazard/`
- Mobile rule tests: `../axiomancer-mobile/state/hazard/__tests__/engine.test.ts`
- Mobile balance guard: `../axiomancer-mobile/state/hazard/__tests__/balance.sim.test.ts`
- Mobile store-flow e2e: `../axiomancer-mobile/state/e2e/hazard.flow.engine.test.ts`

## Doctrine lock

Mobile v2 is the target, not CDR-0006 v0. Preserve the following unless T explicitly overrules:

- Session opens in `route-select` with the 5-card opening hand visible and no dice cast.
- Route selection is binding and casts exactly 4 dice once.
- Phase order is `route-select` → `rolling` → `playing` → `resolve-flash` → `outcome` → `rewards` → `done`.
- Progress types are exactly `force` and `escape`.
- Card/dice colours are exactly `red`, `blue`, `purple`, `gold`; dice also have hostile `hex`/✕ faces.
- Die faces are six-slot casts: red, blue, purple, gold, hex, hex.
- Card powering costs exactly one available die of the card's own colour; gold requires gold with no substitution.
- Hex dice cannot power cards.
- Safe route is one combined FORCE+ESCAPE meter.
- Risk route is dual FORCE and ESCAPE meters with BOTH required in the same round.
- Dice do not re-cast between rounds. Spent stays spent. Only live card effects such as SECOND WIND, convert, and salvage-created temporary dice alter dice state.
- Hand economy is persistent: played cards discard, unplayed cards stay in hand, and the player draws back up to 5. Hands inflated above 5 draw nothing and keep all cards.
- Play area caps at 6 staged cards per round.
- Trash-bin discard / salvage is part of the rules, not UI sugar.
- Momentum carries half surplus, capped at 3, into the next round.
- Outcome is tiered: Perfect / Complete / Failure, not O-X final score.
- Rewards are tiered and include pick-1-of-3 card offers plus reserve bonus.
- Penalties are applied at claim with the mobile consequence ladder, route penalty, max-VITAE scar, CRACK insertion, token flags, hexed flag, and VITAE floor at 1.
- Deck persistence uses `GameState.flags` entries `hazard-card:<cardId>:<n>` until mechanics owns a cleaner run-deck system.
- Enchantments are not part of current v2 unless reintroduced by T.

## Implementation units

### Unit 1 — Reconcile type surface

- **Files**: `src/World/Hazard/hazard.types.ts`, `src/World/Hazard/index.ts`, `docs/hazard-minigame-api.md`
- Replace v0 progress/colour/card-class type vocabulary with mobile v2 vocabulary.
- Add `HazardPhase`, `HazardRouteKey`, `HazardProgressKey`, `HazardColor`, `HazardDieKind`, `HazardDieState`, `HazardCardDef`, `HazardSalvage`, `HazardSessionState`, `HazardOutcome`, and constants matching mobile.
- Use `hex` internally for hostile dice and document that UI may render it as ✕.
- Keep public exports stable only where truthful; prefer breaking types over compatibility lies.
- Add migration notes for removed progress types (`stability`, `supply`) and removed colours (`green`, `yellow`, `any`).

### Unit 2 — Port mobile v2 content/data

- **Files**: `src/World/Hazard/hazard.cards.library.ts`, `src/World/Hazard/hazard.hazards.library.ts`, new/updated deck-flag helpers as needed
- Use mobile `state/hazard/content.ts` and `state/hazard/deck-flags.ts` as extraction source.
- Port the 14 starter cards, weighted starter bag total of 28, 6 reward-pool cards, CRACK, keyword glossary, reward/consequence catalogues, reward constants, and 3 tuned hazards.
- Preserve exact stats, weights, salvage definitions, flavor, reward ids, consequence ladder, thresholds, penalties, and constants unless tests prove a package-shape-only adjustment is needed.
- Port current hazard IDs: `cracked-cliff`, `flooded-undercroft`, `ashfall-crossing`.

### Unit 3 — Replace engine semantics

- **Files**: `src/World/Hazard/hazard.engine.ts`, `src/World/Hazard/hazard.dice.ts`, `src/World/Hazard/hazard.cards.ts`, `src/World/Hazard/hazard.deck.ts`, RNG helpers as needed
- Implement mobile v2 phase order: route-select → rolling → playing → resolve-flash → outcome → rewards → done.
- Implement opening hand before route selection and dice cast only after route selection.
- Implement safe combined meter and risk BOTH-required dual meters.
- Implement no-between-round re-cast: spent/exhausted dice persist across rounds.
- Implement persistent hand, played-card discard, draw-up-to-5, draw-pile refill from current deck bag.
- Implement play-area cap of 6.
- Implement own-colour powering, gold-only powering, hex rejection, and re-powering die refund.
- Implement SCOUT AHEAD draw, SECOND WIND re-cast + powered bonus die, convert-X + powered bonus die, and CRACK dead-card behavior.
- Implement trash-bin discard and salvage: current-round progress salvage, temporary mana-die salvage, staged-card die refund, no-salvage thinning.
- Implement momentum carry and reserve bonus.
- Implement tiered outcomes, reward offers, skip rules, reserve bonus, route penalty, and claim-time consequence hooks.
- Preserve deterministic RNG via explicit RNG/session seed surfaces; no naked `Math.random()` in pure engine code.

### Unit 4 — GameState integration hooks

- **Files**: `src/Game/types.ts`, `src/Game/reducer.ts` or existing hazard integration surface as appropriate, `src/World/MapEvents/resolve-map-event.ts`
- Add first-class support for the mobile-side mappings currently faked with flags where the engine can own them now:
  - persistent hazard deck / acquired cards;
  - banked hazard tokens / token loss;
  - hazard hexed flag / next-combat curse hook if available;
  - max-VITAE scar with recovery placeholder if inn-rest hook is unavailable;
  - cache/relic reward hooks, even if initial implementation maps to currency;
  - immediate VITAE reward/damage with hazard damage floor at VITAE 1;
  - CRACK card insertion from `deadcard` consequence.
- If a world system is missing, document the adapter seam clearly rather than smuggling mobile-only assumptions into engine code.

### Unit 5 — Rewrite tests around mobile parity

- **Files**: `src/World/Hazard/e2e/hazard.engine.test.ts`, supporting unit tests under `src/World/Hazard/`, CLI tests if CLI remains a public entrypoint
- Port or mirror mobile tests from:
  - `../axiomancer-mobile/state/hazard/__tests__/engine.test.ts`
  - `../axiomancer-mobile/state/hazard/__tests__/balance.sim.test.ts`
  - `../axiomancer-mobile/state/e2e/hazard.flow.engine.test.ts`
- Cover at minimum:
  - route-select starts with hand visible and no dice;
  - route choice casts exactly 4 dice and binds route;
  - force/escape-only progress types;
  - six-face dice with two hex/✕ faces;
  - own-colour and gold-only payment;
  - hex dice cannot power;
  - safe combined-meter success/failure;
  - risk BOTH-required success/failure;
  - no re-cast across rounds and spent dice stay spent;
  - persistent hand and draw-up-to-5;
  - play-area cap 6;
  - SCOUT AHEAD, SECOND WIND, convert-X, and CRACK behavior;
  - trash-bin discard and salvage;
  - momentum carry;
  - Perfect / Complete / Failure tiers;
  - reward offer rarity/skip rules;
  - reserve bonus;
  - consequence ladder, route penalty, CRACK insertion, hexed flag, and VITAE floor;
  - seeded deterministic replay;
  - balance sim bands for each current hazard and route.

### Unit 6 — Documentation and package handoff

- Update all hazard docs to v2 doctrine and remove stale CDR-0006 contradictions.
- Mark `docs/hazard-v2-vs-mechanics-divergence.md` as drained when implementation and tests match.
- Add a short mobile handoff section naming the package exports mobile should consume for no-trbl-2-u/axiomancer-mobile#333.
- Run `npm run verify` and `npm run deploy:check`.

## Verify gate

- `npm run type-check` clean
- `npm test -- --run src/World/Hazard` clean, or the repo's accepted hazard test slice if Vitest path filtering differs
- Any CLI tests still claiming Hazard support are updated or removed if CLI is no longer canonical
- `npm run verify` clean
- `npm run deploy:check` clean
- Manual grep confirms no live v0 doctrine remains in hazard docs/API except in historical notes
- Public exports are sufficient for mobile to implement no-trbl-2-u/axiomancer-mobile#333 without duplicating rules

## Commit body template

```text
feat(world): Phase 134 — align hazard engine with mobile v2

- Replace CDR-0006 v0 hazard rules with mobile v2 force/escape doctrine
- Port mobile hazard cards, dice, hazards, deck flags, rewards, penalties, and RNG semantics
- Add hermetic parity coverage for safe/risk routes, no-recast dice, persistent hand, salvage, gold-only costs, and tiered outcomes
- Update hazard docs/API and package handoff notes for mobile consumption
```

## Definition of Done

- [ ] `docs/hazard-v2-vs-mechanics-divergence.md` exists in mechanics and every divergence is either implemented or explicitly rejected with rationale.
- [ ] Mechanics hazard implementation matches mobile v2 semantics.
- [ ] Tests prove route-select hand-before-dice and route-bound single dice cast.
- [ ] Tests prove the no-recast dice economy and spent dice persistence.
- [ ] Tests prove persistent hand, draw-up-to-5, trash-bin discard, and salvage.
- [ ] Tests prove Safe combined meter and Risk BOTH-required dual meter.
- [ ] Tests prove red/blue/purple/gold/hex resource behavior.
- [ ] Tests prove tiered outcomes, reward offers, reserve bonus, and claim-time consequences.
- [ ] Balance sim bands are ported or consciously replaced with a documented mechanics-side equivalent.
- [ ] Docs and API no longer direct implementers toward stale v0 mechanics.
- [ ] Mobile issue #333 can proceed by consuming package exports instead of keeping local mechanics.
