# Phase 78 — General skills audit (all 21 authored skills)

> Audit-first phase. Pre-work for Phase 80 (skills-always-land mechanic
> shift, direction (a) pure split). Surfaces per-skill resolution shape +
> spec/doc/behaviour drift across the 21 Tier 1 / 2 / 3 skills before the
> engine shift lands.

## Outcome

A per-skill audit table is recorded in `docs/skills.md` (new "Audit summary
(Phase 78)" subsection) + an audit verdict written into the build-plan
ship-row body. Per-skill findings filed as `plan/CRITIQUE.md` Pending rows
where drift is real; Unit 2 small-fix commit ships any iterate-tier
drains the audit surfaces.

## Source

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 78 row — promoted at
oversight-19 2026-05-24 (commit `7419142`). Original candidate filed at
oversight-18 2026-05-23 with user-flagged framing: "user wants a general
audit pass — likely sniffing for inconsistency between spec / docs /
actual behaviour; possible balance issues; possible orphan exports;
possible test gaps."

## Sibling brief

`plan/phases/phase_59_docs_gap_audit_drain.md` — same audit-first shape
(walk the surface, record verdict in the ship-row body, file findings
rather than drain inline).

## The audit (run at brief-generation time, 2026-05-24)

Walk every skill in `src/Skills/skill.library.ts` (21 entries — 6 Tier 1
+ 8 Tier 2 incl. Phase 66 synergy + 7 Tier 3 incl. Phase 44 fallacies)
against four axes:

1. **Per-skill test coverage** — does any e2e under `src/Skills/e2e/` or
   `src/Combat/e2e/` or `src/Game/e2e/` reference the skill id directly?
2. **Doc coverage** — does `docs/skills.md` name the skill in its Tier
   table? (canonical surface)
3. **Spec acceptance alignment** — does `specs/04b-skills-library-and-e2e.md`
   acceptance match the live library shape?
4. **Engine resolution shape** — what's the current effect-application
   behaviour per skill? (snapshot for Phase 80 baseline)

### Verdict — per-skill table

| Skill id | Tier | Test coverage | Doc row | Behaviour shape | Verdict |
|---|---|---|---|---|---|
| `ad-hominem-strike` | 1 | 13 refs (heaviest) | yes | basePower 8 body + strip_random_buff special | **CLEAN.** Canonical Tier 1 reference. |
| `false-dilemma` | 1 | 0 direct refs | yes | basePower 4 mind + debuff_confusion 2t | **DRIFT — no direct test pin.** Transitive coverage via skill-resource-system tests for cost path. File LOW finding. |
| `appeal-to-pity` | 1 | 0 direct refs | yes | self-heal, basePower 0 + scalingMultiplier 4 | **DRIFT — no direct test pin.** Self-heal formula (heart × 0.5 × 4 → heart × 2) not pinned anywhere. File LOW finding. |
| `achilles-gambit` | 1 | 8 refs | yes | basePower 12 body, pure damage | **CLEAN.** Strong damage baseline pin. |
| `liars-echo` | 1 | 0 direct refs | yes | basePower 3 mind + tier1_mind_mark intensity 2 duration 2 | **DRIFT — no direct test pin.** File LOW finding. |
| `ship-of-theseus` | 1 | 0 direct refs | yes | basePower 0 heart + convert_enemy_buff_to_self special | **DRIFT — no direct test pin.** The `convert_enemy_buff_to_self` special-mechanic has zero hermetic coverage — moderate-risk finding. File MED finding. |
| `mob-appeal` | 2 | 0 direct refs | yes | basePower 10 body + secondary_heal_self special | **DRIFT — no direct test pin.** `secondary_heal_self` has zero hermetic coverage. File MED finding. |
| `undistributed-middle` | 2 | 0 direct refs | yes | basePower 8 mind + tier1_mind_mark intensity 3 duration 3 | **DRIFT — no direct test pin.** File LOW finding (similar shape to liars-echo). |
| `eternal-regress` | 2 | 0 direct refs | yes | basePower 6 heart + debuff_confusion + debuff_slow | **DRIFT — no direct test pin.** Two-effect compound application has zero hermetic coverage. File MED finding. |
| `sorites-cascade` | 3 | 3 refs | yes | basePower 5 mind + debuff_bleed intensity 2 duration 4 | **CLEAN.** |
| `straw-giant` | 3 | 5 refs | yes | basePower 18 body + bypass_defense marker | **CLEAN.** Marker-only special is intentionally inert (resolver already produces flat damage). |
| `bootstrap-paradox` | 3 | 0 direct refs | yes | basePower 0 heart + scalingMultiplier 4 (heal) | **DRIFT — no direct test pin.** Self-heal formula not pinned. File LOW finding. |
| `appeal-to-consequences` | 3 | 3 refs | yes | basePower 16 body + tier1_body_attack self-buff | **CLEAN.** Phase 44 fallacy. |
| `nirvana-fallacy` | 3 | 4 refs | yes | basePower 14 mind + debuff_confusion + outlook≤−34 alignment gate | **CLEAN.** Phase 44 + Phase 46. |
| `pascals-wager` | 3 | 2 refs | yes | basePower 0 heart + scalingMultiplier 3 (heal) | **CLEAN.** |
| `appeal-to-fear` | 3 | 2 refs | yes | basePower 12 heart + debuff_slow + scope≥34 alignment gate | **CLEAN.** Phase 44 + Phase 46. |
| `resonance-bleed` | 2 | 3 refs | yes | basePower 4 heart + synergy debuff_bleed durationMin 2 | **CLEAN.** Phase 66. |
| `intensity-feedback` | 2 | 3 refs | yes | basePower 5 mind + synergy buff_critical_rate_up intensityMin 1 | **CLEAN.** Phase 66. |
| `bat-swarm-thoughtform` | 2 | 3 refs | yes | basePower 0 heart + synergy tier1_body_defend consume + apply buff_max_hp_up | **CLEAN.** Phase 66. |
| `resonance-burst` | 2 | 2 refs | yes | basePower 3 mind + synergy debuff_confusion durationMin 1 consume | **CLEAN.** Phase 66. |
| `resonance-detonation` | 2 | 3 refs | yes | basePower 0 heart + unconditional synergy 25 dmg + consume-all | **CLEAN.** Phase 66. |

### Aggregate verdict

**Coverage gap surfaced.** 8 of 21 skills (38%) have **zero direct
hermetic test references** by skill id in `src/Skills/e2e/` /
`src/Combat/e2e/` / `src/Game/e2e/`:
- Tier 1 (4): `false-dilemma`, `appeal-to-pity`, `liars-echo`,
  `ship-of-theseus`
- Tier 2 original (3): `mob-appeal`, `undistributed-middle`,
  `eternal-regress`
- Tier 3 original (1): `bootstrap-paradox`

The 5 Phase 66 synergy skills + 4 Phase 44 fallacy-as-spells + 4 of the
6 Tier 1 + 2 Tier 2 + 3 Tier 3 originals all have direct pins.

Within the coverage gap, **two special-mechanic primitives have zero
hermetic coverage**:
- `convert_enemy_buff_to_self` (only used by `ship-of-theseus`)
- `secondary_heal_self` (only used by `mob-appeal`)

These two warrant MED-priority findings rather than LOW — they are
engine primitives that ship in `src/Skills/skill.engine.ts` but no
hermetic case asserts their behaviour. Two-effect compound application
(`eternal-regress`: `debuff_confusion` + `debuff_slow` in one cast)
also has zero direct pin and warrants MED.

**Doc coverage clean.** All 21 skills appear in `docs/skills.md` Tier
tables (lines 188 / 202 / 219). Heading counts match library counts
(6 / 8 / 7).

**Spec acceptance clean.** `grep -E "^- \[ \]"
specs/04b-skills-library-and-e2e.md` returns 0; all acceptance rows
ticked. No spec/library divergence.

**Engine resolution shape snapshot (for Phase 80 baseline).** Today's
effect-application path: `resolveEffectApplication(skill, effect,
caster, target, rng)` runs a `resistanceRoll` against the target's
relevant resistance; on roll-pass the effect applies, on roll-fail the
effect is **dropped silently** (no event surfaced — the skill is
considered to have "fizzled"). Phase 80 direction (a) pure split
replaces this with: effect-application is **unconditional** (the
effect always lands); damage-half rolls and applies resistance
independently. The 8 zero-coverage skills + 3 zero-coverage primitives
above are exactly the surface Phase 80 will need new hermetic
coverage on (Phase 83 follow-up).

## Implementation units

### Unit 1 — Audit-summary commit (this file + plan ship-row body)

Single commit per the Phase 59 audit-phase sibling pattern. Three
actions:

1. This brief file (`plan/phases/phase_78_general_skills_audit.md`)
   ships the per-skill audit verdict inline.
2. `docs/skills.md` gains a new "Audit summary (Phase 78)" subsection
   under § "Early-Game Library (Spec 04b)" — short paragraph naming
   the 8-of-21 coverage gap + the 3 zero-coverage primitives + the
   Phase 80 / Phase 83 follow-up framing. Cross-link to this brief.
3. `plan/steps/01_build_plan.md` Phase 78 row flipped `[ ]` → `[x]`
   with the audit-summary body inline (matches Phase 59 / Phase 77
   precedent).

### Unit 2 — File CRITIQUE rows for the surfaced findings

Single commit appending Pending rows to `plan/CRITIQUE.md`. One row per
finding (8 LOW + 3 MED = up to 11 rows). Each row carries:
- skill id + tier + brief
- which axis (test coverage / behaviour)
- suggested fix (one-tick iterate work: add hermetic case to existing
  e2e file)
- score per the CRITIQUE row template

Per the brief's "audit-first" framing, Unit 2 is the deliverable for
Phase 80 / Phase 83 to consume — those phases will drain these rows
as their own test re-authoring scope.

Bundle Unit 1 + Unit 2 into one commit (matches Phase 59 pattern —
both are pure plan-side changes; no engine touch).

## Decisions made upfront — DO NOT ASK

- **D1 — Single-commit ship.** Audit-only phase per the Phase 59
  sibling. No engine touch; no separate verify-on-doc-only break.
  Both Unit 1 (brief + plan-row flip + docs/skills.md audit subsection)
  and Unit 2 (CRITIQUE row filings) ship as one commit since both are
  pure plan-side changes.

- **D2 — File the findings rather than drain inline.** Per the Phase
  78 promotion note ("Drop findings as CRITIQUE rows") — the audit's
  job is to surface the gap, not close it. The 8 + 3 findings drain
  via /iterate ticks or fold into Phase 83's test sweep scope.

- **D3 — MED for primitives, LOW for skills.** Per-skill test-pin gaps
  are LOW (skills are leaf entries — adding a hermetic case is a
  single-tick iterate). Engine-primitive gaps (`convert_enemy_buff_to_self`,
  `secondary_heal_self`, two-effect compound) are MED — primitives
  ship in `src/Skills/skill.engine.ts` and ripple to every consumer;
  zero coverage is a real risk.

- **D4 — Audit lives in the brief file + the docs subsection.** Not a
  separate `audit-results.md` file. The brief itself is the audit
  artifact; `docs/skills.md` carries the reader-facing summary
  (consumers of the skills module see the audit context at the
  authoritative doc surface).

- **D5 — No coverage backfill in this phase.** The 8 + 3 findings stay
  Pending after this phase ships. /iterate or Phase 83 (post-Phase-80
  effect-application test sweep) absorb the actual case-authoring
  work. Phase 78's job is the audit.

- **D6 — Treat transitive coverage as insufficient.** Some of the
  8 zero-direct-ref skills ARE exercised transitively (e.g.
  `false-dilemma` is run through `skill-resource-system.engine.test.ts`
  for the cost-debit pin). That's not the same as a per-skill
  behaviour assertion. The audit surfaces direct-pin gaps only;
  transitive coverage is mentioned but not credited.

- **D7 — No Knowledge-Gaps cross-link.** Phase 80's mechanic shift
  closes the skills-side audit lifecycle; folding Phase 78's findings
  into Knowledge-Gaps would duplicate signal already in the candidate
  body + the post-Phase-80 follow-up cluster (Phase 83/84/85/86).

## Verify gate

Pure docs / plan-file change. `npm run verify` should be a no-op pass
(707/707 stay green). `npm run deploy:check` is unaffected.

## Commit body template

```
audit(skills): Phase 78 shipped — general skills audit (8 of 21 skills have no direct test pin)

- Walk every skill in src/Skills/skill.library.ts (21 entries) against
  test coverage + doc coverage + spec acceptance + engine resolution shape
- Verdict table for all 21 skills in plan/phases/phase_78_general_skills_audit.md
- docs/skills.md gains "Audit summary (Phase 78)" subsection naming the
  8-of-21 coverage gap + 3 zero-coverage primitives + Phase 80 / 83 framing
- 8 LOW + 3 MED findings filed in plan/CRITIQUE.md Pending — drain via
  /iterate or fold into Phase 83 (post-Phase-80 test sweep)
- plan/steps/01_build_plan.md Phase 78 row flipped [ ] → [x] with audit body

Decisions:
- D1: single-commit ship (audit-only; no engine touch)
- D2: file findings rather than drain inline (Phase 83 absorbs)
- D3: MED for primitives, LOW for skills
- D4: audit lives in brief + docs/skills.md subsection
- D5: no coverage backfill this phase
- D6: transitive coverage is insufficient
- D7: no Knowledge-Gaps cross-link

Closes phase 78 promoted at oversight-19 2026-05-24.
```

## Definition of Done

- [ ] Brief file at `plan/phases/phase_78_general_skills_audit.md`
      committed with the verdict table inline.
- [ ] `docs/skills.md` gains "Audit summary (Phase 78)" subsection.
- [ ] `plan/CRITIQUE.md` gains 8 LOW + 3 MED Pending rows (one per
      finding).
- [ ] `plan/steps/01_build_plan.md` Phase 78 row flipped `[ ]` → `[x]`
      with audit body inline.
- [ ] `npm run verify` passes (no-op for docs change).
- [ ] `npm run deploy:check` passes.

## Follow-ups (out of scope)

- Phase 79 (effects audit) ships next per the bundle order; same shape
  applied to 88 effects.
- Phase 80 (mechanic shift direction (a) pure split) ships after both
  audits.
- Phase 83 (post-Phase-80 effect-application test sweep) absorbs the
  test-pin findings filed at Unit 2 as part of its re-authoring scope.
- The 3 MED primitive findings may also drain via /iterate before
  Phase 83 lands — either path is acceptable.
