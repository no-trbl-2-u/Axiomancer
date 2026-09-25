# Phase D8 — One Dice Valve in Every Starter Preset

> **For Hermes:** Use `subagent-driven-development` to implement this plan task-by-task. Mechanics/content-led; verify mobile and card-editor because `src/Cards/**`, `src/Combat/**`, and the public card projection surface are coupled.

**Goal:** Replace exactly one card instance in each of the ten 15-card starter presets with a card that meaningfully manipulates combat dice, so the Upgradeable-Dice model always exposes a player-controlled whiff valve.

**Architecture:** Promote the ten D4-staged `dice-valves-33` cards through the normal sandbox-first court, but slot them only into the Upgradeable-Dice preset recipes until the feature flag flips. Every preset remains 15 cards and 5/5/5 by replacing a same-aspect card—never appending. Preserve the curated 70-card library through an explicit ten-in/ten-out ledger. The preset-seat cut and the library-retirement cut are separate decisions: a library card cannot be retired while any surviving flag-on or flag-off recipe still references it.

**Tech Stack:** TypeScript, Vitest, deterministic mechanics RNG, existing card sandbox/library/preset/sim infrastructure, Jest presenter verification.

---

## Outcome

Every starter preset—erosion, oratory, foundry, penitent, standstill, augury, tithe, grace, bastion, and refrain—contains exactly one dice-interaction card when Upgradeable Dice is enabled.

The minimum acceptable valve, if a staged thematic valve fails its court, is:

- **FREE:** choose one eligible die and reroll it.
- **PAID:** reroll every eligible die currently on the table, including the powering die.

“Eligible” means non-cracked. Rerolls are honest engine RNG, produce the die gear’s actual face distribution, and return rerolled dice available for play. No stance guarantee, pity face, or fabricated result is permitted.

## Authority / source

- T direct decision, 2026-07-18: every preset replaces one card with a dice-interaction card; the dual reroll card above is the bare-minimum fallback.
- `axiomancer-mechanics/specs/33-upgradeable-dice.md` §4 valve 3.
- `plan/tuning/2026-07-18-d7-ratification.md` §§2, 4, 6, 8, 10: F3 measured Press Fate at 0.000 casts/round; early win rate lost ~15 points and status engagement lost ~9 points under the flag.
- D4 staging: `axiomancer-mechanics/src/Cards/cards.sandbox-sets.ts`, set `dice-valves-33`.

## Locked laws

1. **Replace, never append:** every preset stays exactly 15 cards.
2. **Exactly one:** each Upgradeable-Dice preset contains exactly one valve instance—not one valve definition multiplied by the old 4/2 recipe.
3. **Color law survives:** every preset remains exactly 5 Body / 5 Mind / 5 Heart. Replace a card of the same `philosophicalAspect`.
4. **Library stays 70:** promotion is ten-in/ten-out. No 80-card inflation.
5. **Flag-off stays unchanged:** current live presets and their 4/4/2/2/1/1/1 recipe remain byte-identical while Upgradeable Dice is disabled.
6. **Flag-on recipe exception:** the enabled recipe is “14 inherited cards + one singleton valve.” This explicit exception supersedes the old multiplicity law only for the valve seat.
7. **Dice honesty:** use mechanics RNG and real die-gear face tables. Never guarantee mana, stance, or a usable result.
8. **Cracked dice stay dead:** neither FREE nor PAID rerolls touch OVERHEAT-cracked dice.
9. **Theme before genericity:** prefer the ten staged theme valves—including Forge’s `forge-masters-stamp`—when their measured behavior is useful. Use the dual-reroll fallback only for a failed valve; do not make ten flavorless copies by default.
10. **No flag flip in this phase:** D8 makes the model retestable. T retains the flip decision after evidence.

## Routes / API / CLI surface

- No new route.
- Extend the existing combat card-play input only if FREE targeted reroll needs a selected die id. Use the existing play-command shape rather than mobile-local state.
- `combat-playtest --upgradeable-dice` and `combat-dice-economy` remain the proof surfaces.
- Flag-off CLI output and preset composition remain unchanged.

## Content / data reads

- `axiomancer-mechanics/src/Cards/cards.sandbox-sets.ts`
  - Read the ten staged `dice-valves-33` records.
  - Promote approved records; delete them from the sandbox set once live.
- `axiomancer-mechanics/src/Cards/cards.library.ts`
  - Add ten approved valve records.
  - Retire ten displaced cards named in the tuning report’s replacement ledger.
  - Keep 70 total cards / 50 spells unless a valve’s type requires a same-type replacement; all existing library lints remain green.
- `axiomancer-mechanics/src/Combat/combat.starter-deck-presets.ts`
  - Preserve existing `cardIds` as flag-off truth.
  - Add one explicit same-aspect replacement per preset for flag-on deck construction.
- `axiomancer-mechanics/src/Cards/types.ts`
  - Add only the smallest typed surface required for targeted FREE reroll / all-dice PAID reroll if the staged valves do not already satisfy all ten presets.
- `axiomancer-mechanics/src/Combat/combat.engine.ts` and `combat.dice.ts`
  - Resolve rerolls through deterministic engine helpers; event the selected ids and resulting faces.
- `axiomancer-mobile/state/presenters/combat-encounter.engine.ts`
  - Present valve FREE/PAID text honestly.
  - If the fallback is used, expose die selection for FREE and explain disabled states loudly.

## Implementation units

### Task 1 — Pin the structural law with failing tests

**Tests:**
- Modify `axiomancer-mechanics/src/Combat/e2e/deck-presets.engine.test.ts`.
- Add a flag-on matrix assertion:
  - ten preset ids;
  - each deck length = 15;
  - each deck color count = 5/5/5;
  - exactly one card instance carries `tags: ['dice', 'valve']`;
  - the valve replaces a same-aspect card;
  - flag-off decks equal their pre-D8 snapshots.
- Add a curated-library assertion: 70 cards remain after ten-in/ten-out.

Run the focused tests and prove they fail before implementation.

### Task 2 — Run the ten-valve promotion court

Use `/deck-tuning` sandbox-first conventions against `dice-valves-33`.

For each preset, record in `plan/tuning/2026-07-18-d8-preset-dice-valves.md`:

- preset / theme;
- valve id;
- preset-seat displaced card id and exact instance count (one);
- same-aspect proof;
- separate library retirement chosen to preserve 70, with proof no surviving
  flag-on or flag-off preset references it;
- baseline and valve A/B at early stage, seeds ≥5;
- valve seen/drawn/played rate;
- dice interaction fired rate;
- win-rate and statusEngagement delta;
- keep / re-author-to-fallback verdict.

The scorer must actually draft/play the valve; a zero-seen or zero-fired result is failed evidence, not a neutral result.

### Task 3 — Promote ten cards and retire ten cards

Move the approved cards into `cards.library.ts`, remove the promoted copies from `dice-valves-33`, and apply the separate ten-card library-retirement ledger. The retired library ids need not be the ten preset-seat cuts, and no retired id may remain in either flag-on or flag-off preset truth. Preserve ids only when semantics remain the same; do not silently overwrite an unrelated live card under its old id.

Update:
- pricing arithmetic comments;
- keyword atlas / glossary entries if new verbs are introduced;
- effectiveness and paid-summary honesty coverage;
- reward/stage pool expectations affected by the ten-in/ten-out swap.

### Task 4 — Add flag-aware preset replacement

Implement one pure helper in `combat.starter-deck-presets.ts` that derives the enabled deck by replacing the named source instance with the valve. It must fail loudly in tests if:

- source card is absent;
- valve is absent;
- the replacement changes deck length;
- the replacement breaks 5/5/5;
- a second valve appears.

Do not duplicate the entire ten-preset table.

### Task 5 — Implement the fallback reroll only where required

If any themed valve fails Task 2, add the smallest engine-owned fallback:

- FREE play requires one chosen non-cracked die id and honestly rerolls only it.
- PAID play consumes its powering die, then honestly rerolls every non-cracked die on the table—including that powering die—and returns those rerolled dice available.
- Cracked dice remain unchanged and unavailable.
- No eligible die: FREE is a loud no-op; PAID may still resolve its non-reroll payload but cannot fabricate dice.
- Emit a deterministic `dice-rolled` event plus a valve-specific event carrying affected die ids.

Use `mockSequentialRng`; never spy on `Math.random` directly.

### Task 6 — Presenter and interaction truth

If Task 5 adds targeted FREE selection:

- Reuse the current die selection/drop affordance.
- Card face text must distinguish `REROLL 1` from `REROLL ALL`.
- Disabled cracked dice state why they cannot be chosen.
- Add presenter/Jest tests and one flag-on mobile interaction witness.

If all ten staged valves pass without new interaction grammar, this task reduces to full-library card-face honesty and keyword coverage.

### Task 7 — Re-run the D7 gates

Run on the final D8 state:

```bash
npm run combat-playtest --workspace axiomancer-mechanics -- --stage=all --policy=blind --deck=preset:<each-id> --upgradeable-dice --runs=20 --seed=<1..5>
npm run combat-dice-economy --workspace axiomancer-mechanics -- --seeds=1,2,3,4,5,6,7,8
```

Report:
- early/mid/late/impossible curve against 80/50/25–35/0;
- statusEngagement vs D7 flag-on and flag-off;
- dice-valve casts/round;
- dead rounds;
- average rounds;
- momentum break/surge ratio;
- Conviction income/spend.

D8 is complete when every preset exposes a live valve and the model is honestly re-measured. D8 does **not** require a passing curve and must not tune numbers until green; a red curve becomes the next bounded tuning phase.

## Pages × tests matrix

- Preset construction → `deck-presets.engine.test.ts`.
- Card promotion / 70-card law → `cards-library.engine.test.ts`, `pricing.engine.test.ts`, `card-effectiveness.engine.test.ts`, `paid-summary-honesty.engine.test.ts`.
- Dice resolver → new `src/Combat/e2e/preset-dice-valves.engine.test.ts` with all ten presets and deterministic RNG.
- Sim reachability → focused economy/playtest witness proving every valve fires.
- Mobile presenter → `card-face-honesty.guard.test.ts` plus targeted reroll interaction test only if fallback grammar lands.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
npm run deploy:check
```

Run mechanics tests twice before claiming deterministic coverage.

## Definition of done

- [ ] Ten flag-on starter presets each contain exactly one dice-valve card instance.
- [ ] Every valve replaced exactly one same-aspect card; no deck exceeds 15; every deck remains 5/5/5.
- [ ] Flag-off preset compositions are byte-identical.
- [ ] Curated library remains exactly 70 cards with a ten-in/ten-out ledger.
- [ ] Every valve is seen, played, and fires in deterministic or population evidence.
- [ ] Any fallback reroll obeys honest RNG, cracked-die exclusion, and FREE-one / PAID-all semantics.
- [ ] D7 matrix rerun is published with no flag flip hidden inside the phase.
- [ ] Mechanics, mobile, card-editor, and deploy gates are green.

## Commit body template

```text
feat(mechanics): one dice valve in every starter preset — phase D8

- replace one same-aspect card in each flag-on 15-card preset
- promote ten dice valves through sandbox evidence; preserve 70-card library
- rerun D7 curve/economy witnesses with every valve reachable

Decisions:
- flag-off presets unchanged; flag remains off
- exactly one singleton valve per preset; 15-card and 5/5/5 laws survive
- fallback, if needed: FREE reroll one chosen die / PAID reroll all eligible dice
```

## Follow-ups

- Flag-default flip remains T’s call after D8 evidence.
- Mid/late progression collapse remains separate from this structural affordance phase.
- Signature 2/3/4◆ flag-gated costs and blacksmith economy ratification remain separate phases.
