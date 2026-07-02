# Phase 59 — Docs gap audit + drain (re-scoped from older Docs-sweep candidate)

> Audit-first phase. Re-scoped at promotion time (oversight 2026-05-20
> sixth-of-day) from the older Docs-sweep candidate because most of
> its 9 row-groups had drained via /iterate ticks across May 19-20.
> Per the PHASE_CANDIDATES.md row: "If the re-audit finds zero
> residual, the phase ships as a single audit-summary commit and
> closes." That is the verdict at dispatch.

## Outcome

A `plan/phases/phase_59_audit-summary.md`-equivalent record is added
(written inline in this brief and reflected in the ship commit body)
documenting that all 9 row-groups (a-i) from the original Docs-sweep
candidate's signal have drained. The phase ships as a single
audit-summary commit + the ship-row flip. No new docs work; the
verdict IS the deliverable.

## Source

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 59 row — written
at oversight 2026-05-20 sixth-of-day. The original candidate
("Docs sweep — drain pending CRITIQUE.md rows") was filed at expand
pass 11 (`ce88559`).

## The audit (run at brief-generation time, 2026-05-20)

Each of the 9 row-groups from the candidate's signal text was
re-grepped against the live tree at commit `e958dff`:

| Row | Original signal | Verdict |
|---|---|---|
| **(a)** | docs/api.md Philosophy entry stops at Phase 44 (critique-20) | **DRAINED.** `docs/api.md:249` Philosophy heading now reads "(Phase 42, Phase 43, Phase 44, Phase 46) — Beta" and lines 282-287 carry the full Phase 46 surface (`AlignmentGate`, `requiresAlignment` on dialogue + skill learning, 2 live gates authored). Resolved at iterate `03daba1`. |
| **(b)** | README.md + plan/bearings.md Philosophy row missing Phase 46 (critique-20) | **DRAINED.** `README.md:75` Philosophy row carries the full `AlignmentGate` + `requiresAlignment` surface; `plan/bearings.md:77` mirrors. Resolved at iterate `e870e81`. |
| **(c)** | docs/npcs.md missing alignmentDelta + requiresAlignment (critique-20) | **DRAINED.** `docs/npcs.md:45`, `:55`, `:64`, `:65` all reference the Phase 43 + Phase 46 surfaces with type sketches + worked examples. Resolved. |
| **(d)** | docs/skills.md missing requiresAlignment on SkillLearningRequirement (critique-20) | **DRAINED.** `docs/skills.md:104` + `:127` document the `requiresAlignment` slot + the engine wiring. Resolved. |
| **(e)** | docs/effects.md count drift after Phase 44 (critique-19) | **DRAINED.** `docs/effects.md:19-20` Complete Effects Tables read "Buffs (40)" + "Debuffs (48)" — matches the post-Phase-44 library count. Resolved at iterate `385fac6`. |
| **(f)** | Spec 23 acceptance missing Phase 43 line (critique-19) | **DRAINED.** `specs/23-map-events.md:213-217` carries the Phase 43 alignmentDelta extension as a 13th acceptance row. Resolved at iterate `a73e3e4`. |
| **(g)** | docs/morality.md missing philosophy cross-link (critique-19) | **DRAINED.** `docs/morality.md:14` opens a "Relationship to `philosophicalAlignment` (Phase 42)" section + cross-link at `:26` to `docs/philosophy.md`. Resolved at iterate `ce543d8`. |
| **(h)** | specs/14-philosophical-alignment.md spec-gap (critique-18 — separate candidate) | **DRAINED.** Filed at Phase 58 (`f103a8d`); critique-18 row drained at Phase 58 unit 3 (`972e770`). |
| **(i)** | Older items: Spec 03/05e acceptance unchecked, PhilosAxiosDoc.pdf placement, TODO(spec-09), Phase 37 sell-price exploit, shop walkthrough, Phase-11 walkthrough JSONs cleanup, automation/ README, getCoastalMap removal | **ALL DRAINED.** Sub-verdict below. |

Sub-verdict for row-group (i):

- **(i.1)** Spec 03 acceptance — `grep -nE "^- \[ \]" specs/03-tier2-tier3-effect-procs.md` returns 0; all acceptance rows ticked.
- **(i.2)** Spec 05e acceptance — `grep -nE "^- \[ \]" specs/05e-set-items.md` returns 0; resolved at Phase 54 close (`bcb4e03`).
- **(i.3)** `PhilosAxiosDoc.pdf` — moved to `content/philosophy/PhilosAxiosDoc.pdf` at iterate `2529697`.
- **(i.4)** `TODO(spec-09)` markers — `grep -rn "TODO(spec-09)" src/` returns 0; resolved at Phase 51 (`4972f9a`).
- **(i.5)** Phase 37 sell-price exploit — `defaultSellPrice(ware: ShopWare): number = Math.floor(ware.price / 2)` ships in `src/Items/shop.reducer.ts`; full hermetic coverage at `src/Items/shop.reducer.test.ts:118-130`. Resolved at iterate `3ba5319`.
- **(i.6)** Shop walkthrough — `automation/scripts/walkthroughs/shop.{json,goal.md}` ship; resolved at Phase 37 unit 5 (`729e705`).
- **(i.7)** Phase-11 walkthrough JSONs cleanup — current walkthrough inventory (`boss-encounter`, `character-sheet`, `item-use`, `map-events`, `save-load`, `shop`, `skill-learning`) is the canonical Phase 26 + 27 + 30 + 37 set; no Phase-11-era cruft survives.
- **(i.8)** `automation/README.md` — exists at `automation/README.md`; resolved at iterate `ce8f5c4`.
- **(i.9)** `getCoastalMap` barrel removal — `grep -rn "getCoastalMap" src/` returns 0; resolved at iterate `b85f509`.

## Implementation units

**Single unit.** This phase ships one commit recording the audit
verdict + the ship-row flip per Step 11. The audit content is the
work; the lack of further commits is the deliverable.

### Unit 1 — Audit-summary commit (`plan: phase 59 ...`)

The Step 10 commit normally documents new code; here it documents
the verdict. Plan-row flip happens in the same commit since there's
no code to gate it against. Three actions in one commit:

1. Flip `plan/steps/01_build_plan.md` row 82 from `- [ ]` to `- [x]`
   with the audit-summary body inline.
2. No CRITIQUE / AUDIT row changes — every row this phase would
   have drained is already in Done sections (verified above).
3. No spec / docs file changes — the audit found zero residual
   drift.

Verify gate: pure docs change to one plan file. `npm run verify`
should be a no-op pass (625/625); `npm run deploy:check` is
unaffected.

## Decisions made upfront — DO NOT ASK

- **D1 — Single-commit close.** The PHASE_CANDIDATES.md Phase 59
  row's exit clause ("If the re-audit finds zero residual, the
  phase ships as a single audit-summary commit and closes") fires.
  No new docs to write; ship the verdict.

- **D2 — Audit lives in the build-plan ship-row body, not a
  separate file.** Phase 34 (`9d0aeb9` era) was the precedent for
  multi-unit docs sweeps with separate commits per unit; this phase
  inverts that pattern because there is no per-unit work. The
  ship-row body itself carries the per-(a)..(i) verdict so future
  readers don't need to traverse a separate audit-summary file.

- **D3 — Do NOT re-flag any drained item.** Several drained rows
  (e.g. (i.3) PhilosAxiosDoc placement, (i.5) sell-price exploit)
  carry historical context worth preserving; the relevant context
  lives in the iterate Done sections of `plan/AUDIT.md` and
  `plan/CRITIQUE.md`. The build-plan ship-row body cites the
  resolving commit per row — that's enough for future-reader
  archaeology without duplicating the Done-section bodies.

- **D4 — No verify-on-doc-only change.** This phase touches one
  plan file. `npm run verify` is still run per ship-a-phase Step 9
  to confirm the working tree is green; expected to pass without
  modification.

- **D5 — Ship-row flip in the audit commit, not a separate Step 11
  commit.** Single-unit phases that touch only plan files
  conventionally fold Step 11 into the same commit (see Phase 34
  closing commit `9d0aeb9` for the precedent — that one did go to
  multiple units, but each unit folded its plan-row touch into
  the unit commit). Two commits would create unnecessary
  archaeology noise for a phase that did one thing.

## Verify gate

- `npm run verify` — expected to pass (no code change).
- `npm run deploy:check` — expected to pass (no public-surface
  drift; no `dist/` regeneration needed).

## Commit body template

```
plan: phase 59 shipped — Docs gap audit + drain (zero residual)

Audit-first phase. Re-scoped from the older Docs-sweep candidate
at oversight 2026-05-20 sixth-of-day; the candidate's 9 row-groups
(a-i) were re-greped at dispatch and all drained via /iterate ticks
across May 19-20.

Per-row verdicts:
- (a) docs/api.md Philosophy Phase 46 surface — iterate 03daba1
- (b) README.md + bearings.md Philosophy Phase 46 surface — e870e81
- (c) docs/npcs.md alignmentDelta + requiresAlignment — pre-shipped
- (d) docs/skills.md requiresAlignment — pre-shipped
- (e) docs/effects.md count drift (Buffs 40 / Debuffs 48) — 385fac6
- (f) Spec 23 acceptance Phase 43 alignmentDelta row — a73e3e4
- (g) docs/morality.md philosophy cross-link — ce543d8
- (h) specs/14-philosophical-alignment.md spec-gap — Phase 58 (f103a8d)
- (i) older items (Spec 03/05e acceptance, PhilosAxiosDoc placement,
  TODO(spec-09), defaultSellPrice helper, shop walkthrough,
  walkthrough inventory, automation/ README, getCoastalMap removal)
  — all drained; per-row commits cited in plan/phases/phase_59...

Verify clean; deploy:check clean; no public-surface change.
The lack of further commits is the deliverable.
```

## Definition of Done

- [ ] Audit verdict recorded in `plan/steps/01_build_plan.md` row 82
      shipping body (per D2).
- [ ] Build-plan row flips `[ ]` → `[x]` with shipping commit hash.
- [ ] `npm run verify` is green.
- [ ] `npm run deploy:check` is green.
- [ ] No spec / docs / source-code files change.

## Follow-ups (out of scope)

- **Future docs drift surfaced by critique passes 25+.** When the
  next /critique pass runs (rate-limited to ≥12 commits + ≥24h),
  it will surface any new drift introduced by Phase 58 / 60. Those
  rows feed /iterate per the standard loop — they do not retroactively
  belong to Phase 59.
- **The Docs-sweep PATTERN remains valid.** A future expand pass
  may re-file a Docs-sweep candidate if a new clustering of docs
  rows appears in CRITIQUE pending. The pattern is fine; this
  particular candidate just out-lived its signal.

## Canonical sibling

`plan/phases/phase_47_knowledge_gaps_sweep.md` is the closest
shipping precedent for a multi-row docs-classification phase that
walked an external file and recorded per-row verdicts. Phase 59
is a thinner variant — Phase 47 had ~25 entries to classify across
3 categories; Phase 59 has 9 row-groups all in one category
(drained).
