# Phase 85 — Combat-tuning audit (Knowledge-Gaps Q1 / Q2 / Q4 / Q6 / Q26)

> Closes 5 deferred combat-tuning Qs by documenting the live
> engine state against each question and flipping their status
> from "Deferred" to "Resolved" with shipping references.

## Outcome

Each of the 5 Knowledge-Gaps Qs gets a resolution annotation
documenting the current engine shape as the decided answer. No
engine code changes — the audit confirms the live code is
intentional, not drifted. Q4 was already fixed (comment at
`scenario.ts:316-318` documents the symmetric fix).

## Source

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 85 row —
promoted at oversight-20 2026-05-24.

## Implementation units

### Unit 1 — Audit findings + Knowledge-Gaps resolution

**File:** `Knowledge-Gaps.md`

Per-Q resolution annotations:

- **Q1 (Attack vs Defense roll model):** Current shape is
  "attacker roll vs attacker roll" for the Attack-vs-Attack path;
  "attacker roll vs active-defense stat × multiplier" for the
  Attack-vs-Defend path. Both models coexist by design — the
  simultaneous-action mechanic (Q6) means both combatants choose
  before resolution, making the "single-roll contest" appropriate
  for the mutual-attack scenario while the active-defense path
  rewards the strategic defend choice. Mark as "Resolved — shipped
  model is canonical."

- **Q2 (Damage formula):** Formula is
  `ceil(max(0, damageRoll + studyBonus - (defense × multiplier)))`.
  Crit (Nat 20) auto-selects higher of `double` (2× base) or
  `pierce` (ignores defense). No separate weapon die — attack stat
  IS the damage modifier. Mark as "Resolved — shipped model is
  canonical."

- **Q4 (Defend action defense base asymmetry):** Fixed in an
  earlier commit (comment at `scenario.ts:316-318`). Both player
  and enemy now use `getDefenseStat()` for active defense and
  `getBaseStat + defenseDelta` for passive defense — symmetric.
  Mark as "Resolved — bug fixed prior to this audit."

- **Q6 (Initiative / turn order):** Simultaneous-action model is
  canonical. No `determineTurnOrder` or `rollInitiative`
  functions exist. Both combatants choose independently; round
  resolves both sides in one tick. Mark as "Resolved — simultaneous
  model is canonical; sequential turns not planned."

- **Q26 (How punishing):** HP at L1 ranges 10–35; combat is 1–3
  rounds with RNG swings. Friendship counter provides peaceful
  exit; regen/items provide sustain. Lethality is "moderately
  punishing, fast, swingy" — Mork Borg-inspired baseline with the
  friendship mechanic as counterweight. Mark as "Resolved —
  current lethality is intentional; further tuning via playtest
  signal only."

### Unit 2 (conditional) — Small fixes

**Not needed.** Q4 was the only potential bug and is already fixed.
Q1/Q2/Q6/Q26 are deliberate design choices. No CRITIQUE rows filed.

### Unit 3 — Plan-row flip + CHANGELOG

Flip the Phase 85 `[ ]` → `[x]` row in `01_build_plan.md`.
No CHANGELOG entry needed (pure docs phase, no API/behavior change).

## Decisions made upfront — DO NOT ASK

- **D1 — All 5 Qs marked Resolved (not "Deferred pending playtest").**
  The audit confirms the live code matches deliberate design
  decisions documented in Spec 02. Leaving them as "Deferred" after
  82+ phases of shipping would be misleading — the model IS decided.
  Future tuning (if playtest surfaces issues) would file NEW
  candidates, not re-open these Qs.

- **D2 — No engine code changes.** Q4 is already fixed. The
  remaining Qs describe canonical design choices, not bugs or
  gaps. The Phase 85 deliverable is documentation, not code.

- **D3 — No CRITIQUE rows filed.** The audit surfaced zero
  inconsistencies between the Knowledge-Gaps descriptions and the
  live engine. The earlier code comment at `scenario.ts:316-318`
  correctly documents the Q4 fix.

- **D4 — Single commit.** Knowledge-Gaps updates + plan-row flip
  in one commit (pure docs).

## Verify gate

`npm run verify`. Expected: 738 tests unchanged (pure docs). No
engine file touched.

## Commit body template

```
feat(docs): Phase 85 shipped — combat-tuning audit (KG Q1/Q2/Q4/Q6/Q26)

- Knowledge-Gaps.md: 5 deferred combat-tuning Qs resolved with
  per-Q shipping references and engine-state documentation
- Q1: attack-vs-attack + attack-vs-defend dual model is canonical
- Q2: ceil(max(0, dmg + bonus - def×mult)) + crit double/pierce
- Q4: defend asymmetry was already fixed (scenario.ts:316-318)
- Q6: simultaneous-action model is canonical; no initiative system
- Q26: moderately punishing, 1-3 round combats, friendship exit valve

Decisions:
- D1: all 5 Qs marked Resolved (live code is the decided model)
- D2: no engine code changes (Q4 already fixed; others are design calls)
- D3: no CRITIQUE rows filed (zero inconsistencies found)
- D4: single commit (pure docs)

Closes #<phase-issue>. 738/738 tests unchanged.
```

## Definition of Done

- [ ] Q1, Q2, Q4, Q6, Q26 annotated with resolution in Knowledge-Gaps.md.
- [ ] `plan/steps/01_build_plan.md` Phase 85 row flipped.
- [ ] `npm run verify` passes (738 tests unchanged).

## Follow-ups (out of scope)

- If future playtesting surfaces balance issues with Q1 (roll model),
  Q2 (damage formula), or Q26 (lethality), new candidates get filed
  via /expand — these Qs don't re-open.
- The damage-resist primitive candidate (from Phase 80 D1) may
  interact with Q2's formula; that's a separate phase.
