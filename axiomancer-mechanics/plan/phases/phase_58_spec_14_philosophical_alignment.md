# Phase 58 — `specs/14-philosophical-alignment.md` (conversation-loop spec)

> Retroactive conversation-loop spec for the Phase 42-46 philosophical
> alignment system. Pure docs phase — the engine is live since Phase 42.
> Closes critique-18 row + the symmetry gap with every other multi-phase
> mechanic (Combat = Spec 02/03; Skills = Spec 04/04b; Equipment =
> Spec 05/05b/05c/05d/05e; Character = Spec 06; MapEvents = Spec 23).

## Outcome

`specs/14-philosophical-alignment.md` exists, follows the
`specs/00-how-to-use-specs.md` template, ships as `**DONE**` since
the engine is already live, and answers the four open design calls
from critique-18 with shipped-code-derived answers. `specs/README.md`
Recommended order grows a row 14 pointing at the new spec. The
critique-18 Pending row in `plan/CRITIQUE.md` moves to Done.

## Source spec

`specs/14-philosophical-alignment.md` itself is the artefact being
created. Phase 42 brief
(`plan/phases/phase_42_philosophical_alignment.md`) Decisions block
explicitly said this spec would be filed "if the system grows enough
to need its own conversation-loop spec" — five phases on the cube
(42 / 43 / 44 / 45 / 46) is well past that threshold.

The four open questions from critique-18 are all answered in this
brief's Decisions section; the spec itself records the answers
inline as `> Your answer:` lines per the template convention.

## Implementation units

### Unit 1 — file `specs/14-philosophical-alignment.md`

One new file at `specs/14-philosophical-alignment.md` following the
`specs/00-how-to-use-specs.md` template. Sections:

- **Title:** `# Spec 14 — Philosophical Alignment Cube`
- **Status header line** directly under the title:
  `[DONE on 2026-05-20 — engine shipped Phase 42 (bdfda00); spec
  authored retroactively at Phase 58.]`
- **Goal:** "Three-axis player alignment (Epistemology × Outlook ×
  Scope) with a 27-cell content registry mapping each cell to a
  philosopher + literary character + 3 signature fallacies.
  Observable, payloadable, enemy-side, and gated for content access."
- **Why now / dependencies:**
  - Unblocks: future alignment phases (befriendable-enemy alignment
    cues; alignment-gated endings; second-continent alignment regions);
    drains critique-18.
  - Depends on: Spec 01 (Effects) + Spec 04 (Skills) + Spec 23
    (MapEvents) — all shipped.
- **Current state:** Five-phase inventory citing shipping references:
  Phase 42 `bdfda00` (engine + 27-cell library + state field +
  `migrateV4toV5`), Phase 43 `764de7f` / `fb7a474` / current
  (alignmentDelta on dialogue + map-event authoring surfaces +
  first-pass authoring), Phase 44 `87cfa7e` / `06f5ffe` / current
  (`sourcedFromCell` + 4 fallacy skills + 3 fallacy effects),
  Phase 45 `b185fe2` / current (enemy alignment + outlook-driven
  AI bias), Phase 46 `49b02f6` / `fb319cb` / current (`AlignmentGate`
  + `requiresAlignment` on dialogue + skill learning).
- **Open questions (4):** All four from critique-18, each with a
  pre-filled `> Your answer:` line per the Decisions section of
  this brief. The template's convention is `> Your answer:` blank,
  but a retroactive spec MUST come with the answers filled — the
  spec's job is to record what the code already decided.
- **Proposed approach:** Empty / strike-through with one-sentence
  reason — engine is live, nothing to propose. Per
  `specs/00-how-to-use-specs.md` line 120-121 (the hermetic-e2e
  reminder), pure-docs / pure-retroactive specs may strike the
  implementation sections.
- **Acceptance checklist:** Each item ticked as `[x]` with shipping
  reference; the hermetic-e2e checkbox cross-links to the existing
  `src/Philosophy/e2e/alignment.engine.test.ts` +
  `src/Philosophy/e2e/alignment-authoring.engine.test.ts` +
  `src/Skills/e2e/fallacy-skills.engine.test.ts` +
  `src/Enemy/e2e/alignment.engine.test.ts` test files (the engine
  was test-driven from day one).
- **Out of scope:** moralMeter unification (Q1 — explicitly orthogonal
  by design); alignment-aware NPC observers (Q2 — deferred to a
  future content phase); alignment-gated endings (Q3 — deferred to
  endgame phases); friendship-victory alignment shifts (Q4 —
  orthogonal; no current intersection).

Concrete sketch of the four `Open questions` answers (verbatim text
to ship into the spec):

```md
## Open questions

1. **Should `moralMeter` unify into the cube as a 4th axis?**
   > Your answer: No. `moralMeter` and `philosophicalAlignment` are
   > intentionally orthogonal. `moralMeter` tracks compassion ↔
   > cruelty along a single sympathetic axis (Spec 10, Phase 10);
   > the cube tracks epistemology × outlook × scope (Phase 42).
   > They shift independently and `docs/philosophy.md` already
   > documents the orthogonality with a worked example (a Pessimist
   > can still be compassionate). Unifying them would conflate
   > categories and rob the game of one of its two character axes.

2. **Should alignment shifts propagate to NPCs that observe the
   player?**
   > Your answer: Deferred. As of Phase 49 the alignment is a
   > player-state field; NPCs *read* it via `requiresAlignment`
   > gates (Phase 46) but do not react to shifts. Adding observer
   > wiring is a content-phase decision once specific NPCs need it,
   > not an engine-tier change. Out of scope for Spec 14.

3. **Should there be alignment-gated endings?**
   > Your answer: Deferred. No endgame content exists in the engine
   > (spec.md 6-month horizon lists endgame as future work). The
   > `AlignmentGate` predicate Phase 46 shipped is the natural
   > primitive for ending eligibility; the gate is already on
   > `DialogueChoice.requires` + `SkillLearningRequirement` and can
   > extend to an `endingEligibility?: AlignmentGate[]` slot when
   > endgame content lands. No new engine work needed; document the
   > extension path here and ship it in the endgame phase.

4. **How does the alignment cube intersect with the friendship-
   victory mechanic?**
   > Your answer: It doesn't, by design. Friendship-victory shifts
   > `moralMeter` +1 (Phase 36's `endCombat` path) and grants
   > half-XP + full loot, but no `philosophicalAlignment` axis
   > moves. No `alignmentDelta` is wired to the friendship-counter
   > resolution. If a future content phase wants befriending a
   > philosopher-themed enemy to nudge alignment, the per-encounter
   > `MapEventPoolEntry.alignmentDelta` (Phase 43) is the
   > authoring surface — no engine wiring needed. Document the
   > orthogonality + the authoring path here; no Spec 14 action.
```

### Unit 2 — add row to `specs/README.md`

Append a new row to the Recommended order table:

```md
| 14 **DONE** | [`14-philosophical-alignment.md`](./14-philosophical-alignment.md) | Phases 42–46. 3-axis alignment cube + 27-cell content registry; observable, payloadable, enemy-side, and gated. Spec authored retroactively (engine shipped Phase 42, content surface filled through Phase 46). |
```

Placement: directly after row 13 (the existing Spec 23 row at
`specs/README.md:77`). Numerical 14 is the next free slot after
13 (Spec 23 was the 13th in order — the spec number doesn't have
to match the row number).

### Unit 3 — drain critique-18 from `plan/CRITIQUE.md` Pending → Done

Move the row currently at `plan/CRITIQUE.md:17` ("[LOW] No
conversation-loop spec for the philosophical alignment system…") to
the Done section with the shipping note:

```md
- [x] **[LOW] No conversation-loop spec for the philosophical
  alignment system after two phases shipped against it** —
  resolved at Phase 58 (commit `<hash>`). `specs/14-philosophical-
  alignment.md` filed retroactively with all four critique-18
  open questions answered inline (orthogonal moralMeter, no NPC
  observer wiring, no endgame alignment gates yet, friendship-
  victory orthogonality); `specs/README.md` Recommended order
  gains a row 14 pointing at the new spec. Pure docs work; engine
  was live since Phase 42 (`bdfda00`). Impact 4 × Ease 8 / 10 = 3.2.
  Source: critique-18 row (commit `c62702e`).
```

Format mirrors every other Done row in CRITIQUE.md.

## Decisions made upfront — DO NOT ASK

- **D1 — Status of the spec at file time.** Ship as `[DONE on
  2026-05-20 — engine shipped Phase 42 (bdfda00); spec authored
  retroactively at Phase 58.]` in a single line directly under the
  title. The engine is live; there is no "implement Spec 14" work
  to do; the spec exists to record what shipped + answer the
  centralised Q&A trail every other multi-phase mechanic carries.

- **D2 — `> Your answer:` lines come pre-filled.** The
  `specs/00-how-to-use-specs.md` template leaves them blank by
  convention. For a retroactive spec the template's intent is
  "the answers drive the design"; here the answers ARE the design
  the code shipped. Ship the answers inline with the spec; do not
  leave any open `> Your answer:` blank.

- **D3 — Q1 (`moralMeter` unification): No.** Two axes by design;
  Phase 42 `docs/philosophy.md` already documents the orthogonality.
  Unifying would conflate compassion (moralMeter) with epistemology
  (alignment) and rob the game of a character axis.

- **D4 — Q2 (NPC observers): Deferred / out of scope.** No code path
  reads alignment-delta as an NPC-side input today; the read path is
  `requiresAlignment` (Phase 46) which gates content access, not NPC
  behaviour. Future content phase can add observer wiring; not a
  Spec 14 action.

- **D5 — Q3 (alignment-gated endings): Deferred.** No endgame phase
  exists. The `AlignmentGate` primitive already supports the use
  case structurally (predicate type); the wire-in is endgame work,
  not Spec 14 work.

- **D6 — Q4 (friendship-victory intersection): None, by design.**
  Friendship shifts `moralMeter`; cube is unaffected. Future content
  can wire per-encounter `alignmentDelta` via Phase 43's authoring
  surface without engine work.

- **D7 — `specs/README.md` row 14, not 24.** Spec number 14 has been
  reserved since the Phase 42 brief Follow-ups; this is the slot the
  candidate row predicted. Spec numbering is independent of order-
  table row position (Spec 23 sits at row 13 in the table).

- **D8 — Acceptance checklist ticks reference existing tests, do
  not author new ones.** The hermetic-e2e checkbox cross-links to
  the four already-shipped Philosophy + adjacent test files. No new
  test file ships in this phase.

- **D9 — Single commit per unit.** Unit 1 (the spec file) is its
  own commit; Unit 2 (README.md row) folds into the spec commit
  since they're tightly coupled docs work shipping together. Unit 3
  (CRITIQUE drain) is the third commit, with the ship-row flip
  inside it. The `plan: phase 58 shipped` row flip happens in a
  fourth commit per `skills/ship-a-phase.md` Step 11.

  Revised — Unit 1 + Unit 2 ship as ONE commit (`docs(specs): ...`);
  Unit 3 ships separately (`plan: ...`); Step 11 ship-row flip
  ships third (`plan: phase 58 shipped — ...`). Three commits total.

## Verify gate

- `npm run type-check` (no TS code changes — should be a no-op pass).
- `npm test` (no test changes — 625/625 should stay green).
- `npm run build` (no build-graph changes).
- `npm run deploy:check` (no public-surface drift — fixture untouched).

All four expected to pass without modification; this phase touches
only docs.

## Commit body template (per unit)

### Unit 1 + 2 commit

```
docs(specs): Phase 58 unit 1+2 — file Spec 14 (philosophical alignment cube)

- Add specs/14-philosophical-alignment.md as the retroactive
  conversation-loop spec for the Phase 42-46 alignment system.
  All four critique-18 open questions answered inline (orthogonal
  moralMeter, no NPC observer wiring yet, no endgame alignment
  gates yet, friendship-victory orthogonality).
- Mark [DONE on 2026-05-20 — engine shipped Phase 42 (bdfda00);
  spec authored retroactively at Phase 58] in the status line.
- Add row 14 **DONE** to specs/README.md Recommended order
  pointing at the new spec.

Decisions:
- D1/D2 — Spec ships as DONE with all `> Your answer:` lines
  pre-filled (retroactive spec; the answers ARE the design
  shipped, not future calls).
- D3-D6 — Q1 No (orthogonal); Q2-Q4 Deferred / orthogonal /
  out-of-scope per shipped behaviour.
- D7 — Spec number 14 was reserved at Phase 42; row 14 in the
  Recommended order is the next free slot after row 13 (Spec 23).
- D9 — Three-commit shipping rather than five (Unit 1 + Unit 2
  together as they're tightly coupled docs; Unit 3 separately;
  ship-row flip third).
```

### Unit 3 commit

```
plan: critique-18 row resolved — Spec 14 filed at Phase 58 (<hash>)

Move the LOW spec-gap row from plan/CRITIQUE.md Pending to Done
with shipping reference. Updates CRITIQUE.md only.
```

## Definition of Done

- [ ] `specs/14-philosophical-alignment.md` exists at the canonical
      path, follows `specs/00-how-to-use-specs.md` template,
      header reads `[DONE on 2026-05-20 — engine shipped Phase 42
      (bdfda00); spec authored retroactively at Phase 58.]`.
- [ ] All four critique-18 open questions answered inline with
      `> Your answer:` lines populated per D3-D6 above.
- [ ] `specs/README.md` Recommended order gains a row 14 **DONE**
      pointing at the new spec, placed directly after row 13.
- [ ] `plan/CRITIQUE.md` Pending row "[LOW] No conversation-loop
      spec…" moves to Done with the resolved entry per Unit 3.
- [ ] `npm run verify` is green (no code change — should stay
      625/625).
- [ ] `npm run deploy:check` is green (public-surface fixture
      unchanged).
- [ ] `plan/steps/01_build_plan.md` Phase 58 row flips `[ ]` → `[x]`
      with commit hash.

## Follow-ups (out of scope)

- **Befriendable-enemy alignment cues.** If/when Phase 60 (next-up)
  authors befriendable enemies, the per-encounter `alignmentDelta`
  authoring surface from Phase 43 can wire per-friendship alignment
  nudges — but that's content authoring, not Spec 14.
- **Alignment-gated endings.** Document the extension path
  (`endingEligibility?: AlignmentGate[]`) in the eventual endgame
  spec; do not pre-author the slot in Spec 14.
- **NPC observer wiring.** A future content phase can add an
  `observesAlignment?: boolean` field on `NPC` + reactive dialogue
  branches; not a Spec 14 action.
- **moralMeter ↔ alignment compound queries.** Future content might
  benefit from a `requiresMoral` ∧ `requiresAlignment` compound
  gate primitive; the current shape is sequentially-checkable in
  `DialogueChoice.requires` already. Document if/when content
  needs compound gates.

## Canonical sibling

`plan/phases/phase_42_philosophical_alignment.md` is the closest
prior phase brief (it shipped the engine this spec documents). For
the spec-file shape, `specs/23-map-events.md` is the closest sibling
(it's the most recent retroactive-ish spec, Phase 41 unit 3 ticked
its acceptance checklist with shipping references the same way this
spec will).

For the README.md row format, `specs/README.md:77` (row 13, the
Spec 23 row) is the most recent precedent.
