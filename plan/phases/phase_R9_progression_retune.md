# Phase R9 — Progression retune

## Sources

- Part plan: [`plan/revamp/progression.md`](../revamp/progression.md) (R9).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D55** (Act 1 on the three survivors yields about 3–4
  level-ups, checked against the S3 curve), **D41** (`base × stat ÷ 5`; enemy
  VITAE `(30 + 18·level) × difficulty`), **D57** (the deck-matrix baseline is
  retired; a measurement this phase builds becomes a baseline only by T's
  call), **D58** (nothing is authored), **D61** (Float-Eye wanders, the Brine
  Hag is the mid-region fight, the Doorwarden every region's door).
- Canonical sibling: R2a (the survivor pins in `MapEvents/content.ts`) and
  R7e2 (the last save hop, `migrateV34ToV35`).

## Reality check (2026-10-01)

Measured on `main` at `2ccbf7b3` with a scratch harness (the greedy witness,
`simulateHazardPatternCombat`, the grey office, 200 seeded runs):

- **XP sources are fights only.** No live quest pays XP (R3c and R7e removed
  them); the `experience` quest-reward kind is plumbing with no carrier
  content. Fight XP is `level × DEFAULT_XP_BY_DIFFICULTY` (normal 20, elite 50,
  boss 200), rescaled by `scaleEnemyToLevel` to the pinned level.
- **Levels cost a flat 1,000 XP.** A full clear of all 26 Act 1 fights pays
  about 4,400 XP, but most of it is the door fights (600 + 600 + 800 + 800).
  The Breakwater's fights before its door pay 230 XP, so the player meets the
  first door at **level 1**.
- **The first door cannot be passed.** The Breakwater's Doorwarden is pinned at
  level 3. A level-1 player (5/5/5) wins 0% against it. Even a level-1
  Doorwarden is 8%. The game as shipped stalls at the first door.
- **Doorwarden win table** (player level P, stats 5/5/5 plus 3 points a level
  spread evenly / two-thirds body / all body):

  | | DW1 | DW2 | DW3 | DW4 |
  |---|---|---|---|---|
  | P1 | 8 / 8 / 8 | 0 | 0 | 0 |
  | P2 | **30 / 39 / 78** | 9 / 11 / 43 | 1 / 3 / 11 | 0 |
  | P3 | 56 / 92 / 100 | **31 / 59 / 90** | 10 / 30 / 69 | 3 / 11 / 40 |
  | P4 | 99 / 100 / 100 | 71 / 93 / 100 | **44 / 69 / 95** | 24 / 41 / 82 |
  | P5 | 100 | 94 / 100 / 100 | 68 / 97 / 100 | **46 / 77 / 99** |

  The bold diagonal, Doorwarden one level under the player, is the "winnable,
  not free" band at every stage. Float-Eye is 100% at every pairing tried
  (L1–L5 against P1–P5); the Brine Hag at level 3 is 82% for P1, 100% from P2.
- **Flat level costs cannot fit.** Fight XP grows with the pinned level, so
  later regions pay more and a flat cost overshoots. A per-level cost that
  grows with the level fits the `level ×` payouts.

## Outcome

A full Act 1 clear meets each region's Doorwarden one level above it and ends
at level 5: four level-ups, one per region. Every door is winnable but not
free for the greedy witness at the expected stage.

## Scope

All in `axiomancer-mechanics`.

1. **The curve.** `EXPERIENCE_PER_LEVEL` (flat 1,000) is replaced by
   `EXPERIENCE_STEP = 250`. Reaching level L+1 costs `L × 250` more XP, so the
   total XP to *be* level L is `250 × (L−1) × L ÷ 2` (L2 250, L3 750, L4 1,500,
   L5 2,500, L6 3,750). One helper owns it: `experienceForLevel(level)` in a new
   `Character/experience.ts`, exported from the package. `createCharacter` and
   `applyLevelUps` read it; nothing else computes a threshold.
2. **The pins** (`World/MapEvents/content.ts`):
   - Doors: Breakwater **1**, Charcoal Wood **2**, Beacon Crags **3**, Lantern
     Deep **4**, each a named constant (`BW_DOOR_LEVEL` and so on). The door
     stops borrowing the elite's or the late ring's level.
   - The Breakwater's four Float-Eye fights get a pinned level, **2**
     (`BW_FIGHT_LEVEL`), like every other Act 1 fight. Unpinned, they scaled to
     the player and paid 20–40 XP depending on order.
   - Every other pin (Float-Eye early/late, the Brine Hag at 3) is unchanged.
3. **Payouts.** `DEFAULT_XP_BY_DIFFICULTY` is unchanged. With the pins above
   it pays the ledger below. No enemy, card or map is added.
4. **The measurement.** `Game/act1-progression.ts` builds the Act 1 fight
   ledger from the registered map-event pools (map order, column order, the
   door last in its column) and walks it through the curve. A small CLI,
   `npm run act1-progression`, prints the ledger, the level at each door and
   the door win table above. It is a tool, not a gated baseline (D57); a test
   pins the ledger's outcome.

The ledger, full clear:

| Region | Fights before the door | Total XP at the door | Level at the door | Door XP | Total XP after |
|---|---|---|---|---|---|
| Breakwater | 4 × FE2 + BH3 = 310 | 310 | 2 | DW1 200 | 510 |
| Charcoal Wood | 3 × FE2 + BH3 + 2 × FE3 = 390 | 900 | 3 | DW2 400 | 1,300 |
| Beacon Crags | 2 × FE3 + BH3 + 2 × FE4 = 430 | 1,730 | 4 | DW3 600 | 2,330 |
| Lantern Deep | 2 × FE3 + BH3 + 3 × FE4 = 510 | 2,840 | 5 | DW4 800 | 3,640 (L5) |

## Consumers to update

- `Character/index.ts` (`createCharacter`), `Game/game.reducer.ts`
  (`applyLevelUps`), `src/index.ts` exports.
- Docs: `axiomancer-mechanics/docs/character.md` and `docs/game.md` (the
  constants table) describe the new curve.
- Mobile reads `experience` / `experienceToNextLevel` only; nothing to change.
  The dev menu's +100 / +1000 XP grants stay (D62).

## Save / schema contracts

`GAME_STATE_VERSION` 35 → 36. `migrateV35ToV36` keeps the player's `level` and
their progress through it: the old progress `(experience − (level−1)·1000) ÷
1000` (clamped at 0, so a malformed save cannot drop a level, and allowed past
1 so a pending level-up stays pending) maps onto the new curve as
`experienceForLevel(level) + progress × level × 250`, rounded.
`experienceToNextLevel` becomes `experienceForLevel(level + 1)`. Pure and
idempotent over a v35 payload; a test covers mid-level, pending and malformed
saves.

## Carrier sweep (D45)

None: no system loses its carrier. `EXPERIENCE_PER_LEVEL` leaves the docs with
the constant.

## Decisions made upfront — DO NOT ASK

- **A rising level cost, not a flat one.** Payouts are `level ×` base, so cost
  must also scale with level for "one level per region" to hold in all four
  regions. Flat costs were tried on paper: either the Breakwater gives no level
  or the Lantern Deep gives two.
- **Four level-ups, the top of D55's 3–4.** The first door needs the first one
  (P1 wins 8% even against DW1), and each later door is in band only one level
  above it. Three level-ups would leave a door one level short.
- **Doors at 1/2/3/4, one level under the expected player.** The diagonal of
  the table is the only one where every door sits in the 30–80% band for the
  balanced and body-leaning spreads. A full-body spread beats every door
  ≥ 78%; that is D41's uncapped body scaling, not a pin to tune here (B2).
- **Pin the Breakwater's Float-Eyes at 2.** It makes the ledger deterministic,
  and Float-Eye is 100% at every pairing, so the pin changes XP, not danger.
- **Leave the Brine Hag at 3 everywhere.** Ramping it adds XP the curve would
  have to absorb, and the elite's danger is B2's question (D61 keeps it
  "rarer", not "harder").
- **Skipping fights is allowed and costs levels.** Three of the four doors can
  be bypassed through a lateral rib, and every non-door fight is optional. A
  door-only player meets the Breakwater door at level 1. The door's XP is
  the catch-up. This phase does not force fights.
- **Payout constants unchanged.** The pins and the curve carry the retune;
  touching `DEFAULT_XP_BY_DIFFICULTY` as well would move two knobs for one
  result.
- **No new baseline.** The CLI prints; nothing gates on its win rates except
  the coarse "winnable, not free" test below (D57).

## Tests matrix

- Added `Character/experience.test.ts`: the curve's values and its inverse
  relation with `applyLevelUps` (a cascade from 0 to 3,640 XP lands on L5 with
  12 stat points).
- Added `Game/act1-progression.test.ts`: the ledger has 26 fights (4 doors);
  a full clear meets the doors at levels 2/3/4/5 and ends at level 5; a
  door-only route meets the Breakwater door at level 1. A seeded 100-run
  witness at each door's expected stage (balanced spread) wins more than 0%
  and less than 100%.
- Added a v35 → v36 leg to the migration suite.
- Rewritten to the curve: `character.engine.test.ts`,
  `levelup-unlocks.engine.test.ts`, and any suite pinned to a 1,000 XP level or
  to the old door levels.

## Verify gate

`npm run verify --workspace axiomancer-mechanics`, then `npm run verify` (the
`@mechanics` alias couples mobile), root `npm test`, `npm run lint:content`,
`node scripts/check-lexicon.mjs`.

## Commit body template

```
feat: progression retune, Act 1 levels on a rising curve — phase R9

- Level L+1 costs L x 250 XP (experienceForLevel); was a flat 1,000
- Door pins 1/2/3/4; the Breakwater's Float-Eyes pinned at 2
- Full Act 1 clear: doors met at 2/3/4/5, ends level 5 (4 level-ups)
- npm run act1-progression prints the ledger and the door win table
- Save v35 -> v36 keeps level and progress through it

Decisions:
- ...
```

## DoD

- A full clear ends at level 5, each door met one level above it, pinned by
  test.
- `EXPERIENCE_PER_LEVEL` is gone; one helper owns the curve.
- A v35 save loads at v36 with its level kept.
- Gates green; R9 ticked.

## Follow-ups (out of scope)

- Body-heavy spreads beat every door ≥ 78%: D41's uncapped scaling, for B2 or
  a stats session with T.
- Float-Eye is never a threat at any pinned level: B2 (enemy revamp).
- Whether `act1-progression` becomes a baseline: T's call (D57), with R12.
