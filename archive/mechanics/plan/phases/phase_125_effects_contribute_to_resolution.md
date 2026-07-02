# Phase 125 — Effects contribute to resolution

> Close mid/high-level timeouts the streamlined way: let status effects push the
> win condition, instead of expanding the round cap.

## Outcome

A combat that the player is dominating via status effects resolves (victory or
friendship) instead of timing out. A sufficiently saturated/debuffed enemy
yields, and/or damage-over-time effects erode HP toward victory, so
status-effect-heavy fights converge to a resolution within the existing round
cap.

## Source

Promoted by owner direct order on 2026-06-07 from the merged `combat-tuning`
suggestions (PR #125). The owner explicitly **declined** expanding the round cap
("keep combat streamlined") and chose the effects-to-resolution path.

Root cause from the data: `resolutionSuccessRate = (victory + friendship) /
totalRuns` (`src/Playtest/playtest.runner.ts:401`); a **timeout is neither**.
The off-band mid/high cells are high-engagement fights the player can't *close
out*:

- `l50-mixed-normal` vs `graveward-keeper`: 100% timeout, 80/80 rounds, 54 skill
  uses/run, dmg ratio **815** — landing everything, still can't finish.
- `l15-strategist-normal` vs `reef-barnacle-colony`: 89% timeout, 47 skill uses.
- `l15-defensive-easy` vs `apprentice-heretic`: 84% timeout.

These score as failures (0–16% resolution) despite *excellent* status-effect
engagement — exactly the doctrine being punished by the resolution rules.

## Implementation units

### Unit 1 — Choose the resolution mechanic

**Files:**
- `src/Combat/` resolver (round resolution + end-of-combat detection)
- `src/Combat/types.ts` / `CombatEndReport` (`outcome` union)
- `src/Effects/` (effect categories: control/DoT/debuff)

**Work:**
- Pick the mechanism (or a combination), grounded in the existing effect model:
  - **Saturation yield (befriend-adjacent):** when an enemy is under enough
    stacked control/debuff intensity for N rounds, it yields — routed through the
    existing `friendship` outcome rather than a new outcome string, to keep the
    `CombatEndReport.outcome` union and `src/index.ts` contract stable.
  - **DoT erosion toward victory:** ensure damage-over-time effects actually
    drive enemy HP to 0 within the cap (the `graveward-keeper` cell does 815:1
    damage yet never converges — investigate why DoT/effect damage isn't closing
    it: regen, resist, or the AI loop).
- Document the chosen rule and why it preserves the streamlined cap.

### Unit 2 — Wire it into combat resolution

**Files:**
- `src/Combat/` resolver helpers (round-end / scenario)
- `src/Game/` store end-combat detection (mirrors the Phase 36 friendship-victory
  wiring — store side must agree with the reducer side)

**Work:**
- Implement the resolution trigger deterministically (RNG stubbed in tests).
- Reuse the existing `friendship`/`victory` outcomes and their reward paths
  (XP + loot) so downstream consumers need no new outcome handling.
- Keep the round cap untouched.

### Unit 3 — Optional: expose a threshold tunable

**Files:**
- `src/Game/game-mechanics.constants.ts`
- `src/Tuning/tunable.registry.ts`
- `src/Tuning/e2e/registry-applier.engine.test.ts`

**Work:**
- If the saturation path uses a numeric threshold (stacked intensity, or rounds
  held), expose it as a constant + registry tunable (`category: 'effect'` or
  `'fundamental'`, tight bounds) so the loop can tune how easily status play
  forces a resolution.

### Unit 4 — Hermetic e2e + evidence

**Files:**
- `src/Combat/e2e/*.engine.test.ts` / `src/Game/e2e/*.engine.test.ts`
- generated reports under `automation/playtest/reports/`

**Work:**
- Hermetic e2e: drive an encounter where the player only applies status effects
  (no finishing basic attacks) and assert it now resolves (victory or friendship)
  instead of timing out.
- Re-run the matrix and record the timeout rate dropping on the evidence cells,
  with resolution rising into band.

## Decisions made upfront — DO NOT ASK

- **D1 — No bigger round cap.** `maxRounds` stays; resolution comes from effects,
  not more turns.
- **D2 — Reuse existing outcomes.** Route saturation yields through `friendship`
  and DoT kills through `victory`; do NOT add a new `outcome` union member (keeps
  the `src/index.ts` contract and all consumers stable).
- **D3 — Deterministic + hermetic.** RNG stubbed; the resolution trigger must be
  testable without disk/network/TTY.
- **D4 — Doctrine-positive.** This rewards status-effect play with resolutions —
  it must not create a basic-attack shortcut.

## Verify gate

- `npm run type-check`
- `npm test -- --run` (new combat/game e2e + any registry test)
- `npm run tune` slice over the timeout cells to confirm timeout↓ / resolution↑
- `npm run verify` + `npm run deploy:check`
- `git diff --check`

## Definition of Done

- [ ] A status-effect-only encounter resolves (victory or friendship) instead of
  timing out.
- [ ] Resolution routed through existing `outcome` members; no `src/index.ts`
  contract change.
- [ ] Round cap unchanged.
- [ ] Any threshold exposed as a tight-bounded tunable (if numeric).
- [ ] Hermetic e2e proves the new convergence; matrix shows timeout↓ on the
  evidence cells.
- [ ] Verify + deploy gates pass.

## Follow-ups out of scope

- Player skill/effect strength (Phase 124) — companion lever.
- Enemy gear-tier counterweight (Phase 123).
- Per-enemy L1 outliers (Phase 122).
