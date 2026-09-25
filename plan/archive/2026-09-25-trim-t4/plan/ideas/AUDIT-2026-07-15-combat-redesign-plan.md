# Audit — Combat System Foundational Redesign Plan (Pass 3 Final)

**Auditor:** Claude (independent pass, no stake in the plan's conclusions)
**Date:** 2026-07-15
**Plan audited:** `plan/ideas/COMBAT_SYSTEM_FOUNDATIONAL_REDESIGN_PLAN.md` (dated 2026-07-14, pinned to `ab6aae15`)
**Repo state at audit:** `0af7dec` (main, 2026-07-15) — 10 commits past the plan's pin
**Method:** every load-bearing factual claim re-checked at HEAD source (and at the plan's
own pin where the distinction matters); internal-consistency read of the document;
divergence check against the live build plan (`plan/phases/phase_32_theme_deep_work.md`).

---

## Verdict

The plan is a genuinely strong decision brief — its epistemics (corpus-claim discipline,
labeled evidence gaps, receipts-not-motives, instrument-validity-first) are better than
most shipped plans in `plan/tuning/`, and **the large majority of its load-bearing claims
verify at source**. It has three problems, in ascending order of importance:

1. **Three factual defects**, all of the same species: claims presented as
   source-verified that were actually echoed from stale docs.
2. **One internal contradiction** the Pass-3 correction failed to propagate.
3. **It is being overtaken by the live loop in exactly the inverted order the plan
   forbids.** Phase 32 has shipped most of the plan's Phase 8 (theme wave 2) plus the
   §11 clock substrate, while the plan's Phase 1 instrument repairs — including the
   fix it and the rebaseline both call the highest-leverage single change — remain
   untouched. This is the item that needs a T decision, not a doc edit.

---

## 1. Claims that verify at source (receipts)

| Plan claim | Verified against | Result |
|---|---|---|
| Rebaseline headline: early 92.8/87.5/82.2%, late 0.0% all seeds, impossible 0.0% | `plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md` §1 (lines 35–38) | ✓ exact |
| Mercy 0 in 25,920 runs; CONCEDE 0; CAPITULATE 30/73/268 (F-5) | rebaseline line 42 | ✓ exact |
| Grace verdict "Calibration freeze, provisional"; Tasks 2/3 named next | `plan/tuning/2026-07-13-grace-preset-tuning-plan.md:203` | ✓ exact, incl. marker lineage `ddec4adc`→`13b58c8d` |
| Spec-29 reactive-cleanse branch tested, emits `threat-cleansed` (F-10 correction) | `axiomancer-mechanics/src/Combat/e2e/threat-branches.engine.test.ts` | ✓ exists |
| `CombatPerorationVM` shipped (F-17 correction) | `combat-encounter.engine.ts:461,1820` | ✓ |
| CONCEDE tiers exist (`CONCEDE_PREMISES_BASE/_ELITE/_BOSS`) (F-19) | exported from mechanics barrel + engine | ✓ |
| FORETELL copy honest: "reveal the foe's next stance and reorder your deck"; `applyForetell` matches | presenter ~line 1250; `combat.engine.ts:1215` | ✓ |
| Card editor: `mechanics.contract.ts`, `cardEditorPlugin.ts`, `cardCodegen.ts`, `KeywordHint` form component | all present (`KeywordHint` at `components/form/`) | ✓ |
| Editor `verify` = `type-check && lint && build`, richer than bearings claims (Pass-3 correction) | `axiomancer-card-editor/package.json` | ✓ — the correction itself is accurate |
| 30-keyword registry | `keywords.ts` header: "30 KEYWORDS (down from a drifted 32…)" | ✓ |
| 70 cards, 10 fixed presets | `cards.library.ts` (70 unique ids), `combat.deck-presets.ts` (the ten named) | ✓ |
| Skills/Cards naming-collision warning live in docs (F-12) | `docs/combat.md:461` | ✓ |
| Defend three-reason doctrine + "not an always-correct bunker" | `axiomancer-mechanics/VISION.md:83–91` | ✓ |
| 8/10 themes play as affliction neighbors (F-3) | `2026-07-10-theme-identity.md` §0 table | ✓ (spot-checked rows match) |
| Spec 03 proc engine in-tree, not called from the combat loop | `combat-effects.ts` present; imported only by `combat.constants.ts` and the barrel, not by engine/reducer | ✓ |
| Draft-scorer starvation (F-6): 5 sets at zero drafts ≥1 seed | rebaseline line 149 | ✓ |
| Version pins: mechanics 0.37.0 / mobile 1.9.0 / editor 0.1.0 | package.json ×3 | ✓ |

The corrected-findings mechanism (F-10, F-17, F-19 with strike-through lineage) checks
out: every correction I re-verified was a real correction, not a walk-back.

## 2. Factual defects

All three are the same failure mode the plan itself warns about in Risk 10
("doc/atlas drift misleads later phases… every phase re-verifies its load-bearing
claims at source"): a docs claim repeated under a "verified at source" banner.

**D-1 — F-13 is half stale, and was stale at the plan's own pin.**
F-13 lists as "dead subsystems in-tree": Spec 03 procs, `calculateSkillDamage` stub,
`'retreat'` union, `BattleLogEntry`. At `ab6aae15` — the plan's own pinned research
commit — `calculateSkillDamage` and `BattleLogEntry` existed **only in docs**
(`README.md`, `docs/combat.md`, `CHANGELOG.md`); both were deleted from source in
`b097efe` ("Fixes from cleanup", 2026-07-12), two days before Pass 1. The Spec 03 proc
engine and the `'retreat'` union member are still in-tree (verified). Consequence:
Phase 0's demolition list is ~half already done, and its "zero behavior change,
bit-identical baselines" acceptance is scoped against ghosts of ghosts. The real
remaining Phase-0 work is the proc engine, the retreat union, and **updating
`docs/combat.md`, which still documents the two deleted symbols**.

**D-2 — "61 authored threat sequences… verified at source" is a docs echo; actual is 56.**
§6.6 and the §3 architecture map both say 61. `AUTHORED_THREAT_SEQUENCES` has **56 keys
at HEAD and 56 at the plan's pin**. The 61 figure comes from `docs/combat.md:635`,
which explicitly stamps it "at `v0.32.0`" (engine is at 0.37.0). The qualitative claim
(strong voice, hidden stance, `damageWeight`, `stanceHint`) verifies; the count and the
"verified at source" framing do not.

**D-3 — F-14 misquotes the registry.**
The plan (§12) renders the registry's Erosion entry as "Player audited; held out of the
queue." `preset-rework-status.md:22` actually reads: "T considers it in a good place.
Hold it out of the rework queue unless new player evidence or a regression reopens it."
The substantive finding survives (registry says hold-out; T's later authority says the
audit is due) — but the quoted words "player audited" do not appear in the file, and a
plan this careful about attribution should not paraphrase inside what reads as a quote.

## 3. Internal inconsistencies

**I-1 — The §3 architecture map contradicts the plan's own Pass-3 correction.** The
diagram still says the editor writes via "`@mechanics` (type-check-only gate)" while
§1 (Pass-3 verification) and §6.10 correctly say the gate is
`type-check && lint && build`. The correction landed in prose but not in the diagram.

**I-2 — Phase 0 still contains a task Pass 3 completed.** Phase 0 includes "Physically
verify the card-editor package layout (the open item from the verification pass)" and
§14 says editor validation comes "after Phase 0 physically confirms the package" — but
the Pass-3 verification (§1, item 1) already did this. Residue from Pass 2 that the
final edit didn't sweep.

Beyond these two, the document is unusually self-consistent: §16's decision matrix,
§18's dialogue record, §19's Q-resolutions, and §20's rulings all agree with the body
text, and I found no case where a ruling stated in one section is contradicted by a
recommendation in another.

## 4. Overtaken by events — the finding that matters

The plan's standing law (§15): **"no redesign phase is judged on pre-repair
instruments."** Its R1: instrument repair "before all diagnosis and ontology work."
Its Phase 8 (theme wave 2) comes after Phases 0–5. The live build plan inverted this
within a day of the plan being archived:

**Shipped by `phase_32_theme_deep_work.md` (Gate 2) as of HEAD:**

| Phase-32 part | Shipped item | Where the ideas plan scheduled it |
|---|---|---|
| 1 | Harvest: REAP attacks max HP | Phase 8 ("harvest PA-1… deep rework") |
| **1a** | **DoT clocks: distinct trigger substrate** (card-played / damage-instance event clocks now live in `effects.ts` WS3 fuel math) | **§11 / R4 — the centerpiece, gated behind the restraint law's per-field inexpressibility test and Phase 3b's Grace gate** |
| 2 | Bulwark: RIPOSTE reflects the prevented blow | Phase 8 |
| 3 | Akrasia: DEBT ledger | Phase 8 |
| 4a | Control: TURNABOUT | §6.5 (noted "landed") |
| 4b | Oratory: milestone drip | Phase 8 / §6.5 |
| 4c | Forge: OVERHEAT | §6.5 foundry row |
| 4d | Oracle: OMEN v2 | §6.5 augury row |

**Meanwhile, not shipped:** any change to `combat.deck-draft.ts` /
`combat.reward-draft.sim.ts` since the 07-12 cleanup — i.e. the draft-scorer starvation
fix (F-6) that both the rebaseline ("one targeted fix + re-cut unblocks six verdicts")
and the plan (R1, "highest-leverage single change") put first. No receipts pipeline, no
strong-policy witnesses, no preset-injection probe (F-7, F-20) exist either.

Three consequences:

1. **The findings register is decaying fast.** F-3 (8/10 affliction clones), F-10,
   F-17's remaining-gauge list, the entire §6.5 priority-work column, and §12's
   registry table describe a repo that is 8+ theme reworks out of date. Anyone reading
   the plan as current will re-litigate shipped work.
2. **The plan's own abort/acceptance machinery can't evaluate what shipped.** Phase-32
   reworks are being judged on the instruments the rebaseline flags as broken
   (scorer starvation F-6, pool-shuffle attribution F-8) and without the decision
   telemetry that the plan's status-metric law says is the only honest success measure.
   By the plan's standing law, none of the wave-2 verdicts being produced now would
   count.
3. **The clock substrate landed outside the plan's governance.** Part 1a shipped with
   receipt/attribution honesty work (good — it matches §11's receipts intent) but with
   no recorded per-field inexpressibility test and while Grace remains open — the two
   explicit gates the Judge put on exactly this work (restraint law; active-plan law /
   Phase 3b gate). Either the phase-32 track legitimately supersedes those gates
   (T's call, undocumented) or the gates were bypassed.

To be fair to both artifacts: `plan/ideas/README.md` says "don't implement unless
specifically directed," and phase 32's queue predates the plan (it derives from the
2026-07-10 engagement-overhaul roadmap / theme-identity docs, which the plan itself
cites). So this is not a rogue implementation of the plan — it is **two governing
documents prescribing opposite orderings for the same work**, with the older one
executing. The plan's §20 self-description as "the governing redesign decision brief"
is currently false in practice.

## 5. Smaller observations

- **§21 (unresolved T decisions) is the best part of the document** — it ends with real
  open decisions instead of manufactured closure, exactly as instructed. All seven are
  still genuinely open at HEAD. But it is now incomplete: see additions below.
- The plan's final line (451) is a dangling restatement of the original research
  question after the closing `---` — harmless, but it reads like an unremoved prompt
  artifact in an otherwise polished document.
- The kb:heat citation is used four times as a load-bearing constraint ("no artificial
  late rescue") while §20's disposition explicitly demotes it to "suggestive prior art,
  not load-bearing… until its exact source path and evidence ids are verified." The
  body was not softened to match the disposition — reads as governing in §10/§16/§21
  despite being demoted in §20.
- Mid-range 3.0–28.0% and other §2 figures I spot-checked against the rebaseline all
  reproduce; I did not re-verify every §6.5 E/M/L cell.

## 6. Recommendations

1. **Put the ordering conflict in front of T as a new unresolved decision (§21 item 8):**
   either (a) ratify phase 32 continuing on pre-repair instruments — explicitly
   accepting that its verdicts get re-cut after instrument repair — or (b) pause the
   remaining wave-2 parts (charm resolve milestones, echo) and land the scorer fix +
   receipts pipeline first. The scorer fix is small, named, and unblocks six verdicts;
   there is no evidence-side reason it should still be open.
2. **Item 9: retroactively regularize Part 1a's clock substrate** — record which clock
   fields passed (or skip) the inexpressibility test, and either close or explicitly
   waive the Grace/active-plan gate for it. Silence here rots the restraint law.
3. **Stamp the plan as superseded-in-part** — a short header note pointing at phase 32
   for what has shipped — rather than editing its body. It is a signed three-pass
   dialogue record; corrections belong in a dated addendum (this audit can serve),
   not silent rewrites.
4. **Fix the three factual defects wherever they propagate forward:** 56 not 61
   sequences; F-13 reduced to {Spec 03 procs, retreat union} plus a docs/combat.md
   cleanup task; F-14's quote corrected. Also fix `docs/combat.md` itself, which still
   documents `calculateSkillDamage` and `BattleLogEntry` — the actual root of D-1.
5. **Keep the plan's Phase 1 instrument list as the next evidence-lane work regardless
   of what T decides on ordering** — nothing shipped since 07-11 has touched F-6, F-7,
   F-8, or F-20, and every future verdict (including judging phase 32's own reworks)
   depends on them.
