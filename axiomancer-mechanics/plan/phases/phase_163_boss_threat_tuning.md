# Phase 163 — Combat boss-threat tuning pass

**Source:** Phase 162 audit GAP-2; filed 2026-06-23.

## Outcome

The CoastalTyrant (boss) and TheDisagreement (boss) land in the 30–55% blind win-rate band per design targets (`skills/combat-tuning.md` §4). Simple/normal enemies stay in the 80–95% band. Status engagement is preserved (DoT loadout statusEngagement > 0.3 on boss). All work rides a branch + PR, never main.

## Source spec

`skills/combat-tuning.md` — §4 design targets, §5 procedure.
No separate spec file; this is a pure tuning pass.

## Pre-flight evidence (baseline)

Sim run at commit `32d547e` (300 seeded runs, seed=1):

| Enemy | Policy | Loadout | winRate | avgRounds | statusEng |
|---|---|---|---|---|---|
| CoastalTyrant | greedy | DoT | 100% | 4.0 | 51% |
| CoastalTyrant | blind | DoT | 100% | 4.0 | 51% |
| CoastalTyrant | greedy | strike | 100% | 4.1 | 0% |
| CoastalTyrant | blind | strike | 100% | 4.2 | 0% |
| MournfulGull | blind | DoT | 100% | 2.0 | 58% |
| HushWraith | blind | DoT | 100% | 2.1 | 59% |
| TheDisagreement | blind | DoT | 100% | 2.9 | 52% |

All enemies at 100% — boss is entirely too easy (target 30–55%).

Root cause: `DIFFICULTY_MULT[boss]=1.5` + `THREAT_DAMAGE_SCALE=1.6` yields only ~24–34 raw damage/phase for the level-6 boss with 150 player HP. The boss's 4 phases deal ~100–110 total damage even when fully resolved — the player survives trivially.

## Implementation units

### Unit 1 — Branch + baseline

```
git checkout -b balance/combat-boss-<ts>
```

Record baseline in PR body. No code changes.

### Unit 2 — Raise DIFFICULTY_MULT[boss] step by step

Lever: `DIFFICULTY_MULT` in `src/Combat/combat.threat.ts`.
Start: `boss: 1.5`.

Tuning ladder (measure after each step; stop when boss blind 30–55%):
- Step A: boss → 2.5 — rerun matrix, record
- Step B: boss → 3.0 (if still too low)
- Step C: adjust further as needed

The simple/normal/elite bands must not be disturbed (only `boss` key changes). TheDisagreement is also boss tier, so it moves in lockstep — verify its blind rate also lands in 30–55%.

`THREAT_DAMAGE_SCALE` stays at 1.6 unless boss tuning overshoots and simple enemies still undershoot. One axis at a time.

### Unit 3 — Update the balance-sim witness

`src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts`:
- The boss-DoT test currently asserts `dot.winRate >= 0.8`. Once the boss is correctly tuned to 30–55%, that assertion will fail.
- Replace the boss win-rate assertion with the correct target range: `winRate >= 0.3 && winRate <= 0.6` (slight buffer above 0.55 for sim noise).
- Keep: `statusEngagement > 0.3` for the DoT line, `statusEngagement === 0` for the pure-strike line, and `dot.avgRounds <= damage.avgRounds + 0.5`.
- Retain MournfulGull/HollowEyedBeggar tests at `>= 0.8` (simple/normal enemies must stay winnable).

### Unit 4 — Verify gate

```
npm run verify
```

All tests green, including the updated balance-sim witness.

## Decisions made upfront — DO NOT ASK

1. **Branch + PR only.** Per `/combat-tuning` contract: no changes merge to main autonomously. The PR is the deliverable.
2. **DIFFICULTY_MULT[boss] is the primary lever.** `THREAT_DAMAGE_SCALE` shared across all tiers is a last resort; `THREAT_BASE`/`THREAT_PER_LEVEL` are also shared and avoided.
3. **Balance-sim witness assertion update is part of this phase.** The current `>= 0.8` assertion for CoastalTyrant contradicts the actual design target; correcting it to the 30–55% band is correct and required.
4. **Simple/normal enemies may be at 100% now.** That is within range (80–95% is the *minimum* floor; 100% is not a violation per se, but is noted). If bumping the boss lever somehow affects them, re-check.
5. **TheDisagreement is also boss tier.** It will be tested jointly; its blind rate should also land in 30–55%.
6. **Single-card-spam check is out of scope** for this pass (propose-only per combat-tuning §3).
7. **No authored threat-sequence changes.** The authored `damageWeight` values for CoastalTyrant's 4 phases are not touched — they add interesting variation on top of the multiplier, which is correct.

## Verify gate

```bash
npm run verify
npx vitest run src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts
```

`npm run verify` must be green. Balance-sim witness must pass with updated assertions.

## Definition of Done

- [ ] Branch `balance/combat-boss-<ts>` exists and pushed
- [ ] Baseline sim evidence recorded (pre-change)
- [ ] `DIFFICULTY_MULT[boss]` raised to land blind boss win-rate 30–55%
- [ ] Post-change sim evidence recorded (per-enemy, both policies)
- [ ] Balance-sim witness updated to match 30–55% target band
- [ ] `npm run verify` green
- [ ] PR open (not draft, not merged) with full evidence in body
- [ ] Build-plan `[ ]` flipped to `[x]` with PR URL in a separate commit on main

## Follow-ups (out of scope)

- Simple/normal enemy difficulty tuning (currently 100%; floor 80–95% met)
- Single-card-spam attribution analysis (propose-only)
- TheDisagreement authored sequence uniqueness
