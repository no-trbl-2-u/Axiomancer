# Phase 46 — Alignment-gated content (`requires.alignment` on dialogue + skill learning)

> Closes the "alignment is observable / payloadable / enemy-side /
> gated" four-corner triangle the Phase 42-45 sequence has been
> building toward. Phase 42 wired the cube; Phase 43 made it
> observable through authored deltas; Phase 44 gave the player
> philosophical payloads (4 skills + 3 effects); Phase 45 made
> enemies read the cube too. Today, every dialogue choice and every
> skill is still reachable regardless of where the player sits on
> the cube. This phase locks specific dialogue branches + skill
> learning behind cell requirements — same shape as the existing
> `DialogueChoice.requires.flag` / `SkillLearningRequirement.level`
> gates. The cube finally narrows the content menu.

## Outcome

- `DialogueChoice.requires.requiresAlignment?: { axis: 'epistemology'
  | 'outlook' | 'scope'; op: 'gte' | 'lte'; value: number }`
  exists. `visibleChoices` reads `ctx.alignment` (a new
  `DialogueContext` field carrying the player's current
  `PhilosophicalAlignment`) and filters choices whose
  `requiresAlignment` is unmet.
- `SkillLearningRequirement.requiresAlignment?` exists with the
  same shape. `meetsLearningRequirement` accepts an optional
  `alignment` parameter and gates `learnSkill` /
  `getAvailableSkills` accordingly.
- 2-3 alignment-gated dialogue branches authored on Old Marrow /
  Coastal Beggar trees (`src/World/Continents/Coastal-Village/maps.ts`).
- 2 alignment-gated Tier 3 fallacy skills:
  `nirvana-fallacy` requires `outlook <= -34` (pessimistic);
  `appeal-to-fear` requires `scope >= 34` (transcendent). Mirrors
  each skill's `sourcedFromCell` quadrant — you can only learn the
  skill if your alignment matches its philosophical home.
- `applyDialogueChoice` callers in `dialogue.runtime.ts` and the
  store-side dispatch path thread the player's alignment into the
  context so the runtime can filter choices.
- Hermetic e2e covers: alignment-gated choice is visible to a
  matching player and hidden from a mismatched one; alignment-gated
  skill learnable by a matching player and refused for a mismatched
  one; `getAvailableSkills` filters accordingly.
- `docs/philosophy.md` "Authoring gates (Phase 46)" subsection
  documents the shape, the gate operator semantics, and the
  authored examples.

## Source spec

- Build-plan row Phase 46 (`plan/steps/01_build_plan.md`).
- Promoted via `/oversight` 2026-05-16 (commit `c8cb53a`,
  promote-multiple sequence 46 → 47 → 48 after the Phase 42-45
  arc closed).
- `plan/phases/phase_42_philosophical_alignment.md` Follow-ups —
  "Alignment-gated skills / effects / endings" names the scope.
- Expand pass 7 candidate (filed at `5b37528`).
- Mirrors the existing `DialogueChoice.requires.flag` gate shape
  in `src/NPCs/types.d.ts:44-48` and the `SkillLearningRequirement`
  shape in `src/Skills/types.d.ts:76-82` — Phase 46 adds one
  optional clause to each, no breaking changes.

## Implementation units

### Unit 1 — Dialogue `requiresAlignment`

**Files (edited):**
- `src/NPCs/types.d.ts` — add `requiresAlignment?: { axis, op, value }`
  on `DialogueChoice.requires`.
- `src/NPCs/dialogue.ts` — extend `DialogueContext` with optional
  `alignment?: PhilosophicalAlignment`; `visibleChoices` honours the
  new clause.
- `src/World/dialogue.runtime.ts` — `applyDialogueChoice` callers
  build the `DialogueContext` from `gameState` and need to include
  alignment. (Likely upstream in CLI / store; check the call sites.)

**Type addition:**

```ts
// src/NPCs/types.d.ts — DialogueChoice.requires:
requiresAlignment?: AlignmentGate;

// src/NPCs/types.d.ts — new exported type:
export interface AlignmentGate {
    axis: 'epistemology' | 'outlook' | 'scope';
    op: 'gte' | 'lte';
    value: number;
}
```

**Visibility logic:**

```ts
// src/NPCs/dialogue.ts — inside visibleChoices' filter:
if (req.requiresAlignment) {
    if (!ctx.alignment) return false;
    const { axis, op, value } = req.requiresAlignment;
    const v = ctx.alignment[axis];
    if (op === 'gte' && !(v >= value)) return false;
    if (op === 'lte' && !(v <= value)) return false;
}
```

`DialogueContext.alignment` is optional — if a caller doesn't pass
it, alignment-gated choices are silently hidden. Mirrors the
`req.flag` behaviour when `ctx.flags` doesn't include the flag.

**Tests:**

Extend `src/NPCs/e2e/dialogue.engine.test.ts` (or add a sibling) with
3 cases:
1. Choice with `requiresAlignment: { axis: 'outlook', op: 'lte', value: -34 }`
   visible to a player at `outlook = -50`, hidden at `outlook = 0`.
2. Choice with `op: 'gte'` visible at exactly the threshold, hidden one below.
3. `ctx.alignment === undefined` always hides the gated choice.

Commit: `feat(npcs): Phase 46 unit 1 — requiresAlignment on dialogue choices`.

### Unit 2 — Skill `requiresAlignment`

**Files (edited):**
- `src/Skills/types.d.ts` — add `requiresAlignment?: AlignmentGate`
  on `SkillLearningRequirement` (re-export the same shape from
  `src/NPCs/types.d.ts`, or duplicate the literal — pick TS path
  of least friction).
- `src/Skills/skill.engine.ts` — `meetsLearningRequirement` accepts
  an optional `alignment?: PhilosophicalAlignment` parameter and
  applies the gate when both the requirement and the alignment are
  present. `getAvailableSkills` accepts the same param and threads
  it through. `learnSkill` accepts the same param OR reads
  alignment from the wider `Character` (today it only Picks
  `level | baseStats | knownSkills`).

**Decision (locked):** add `alignment?: PhilosophicalAlignment` as
an optional fourth parameter to `meetsLearningRequirement`,
`getAvailableSkills`, and `learnSkill`. Same shape on all three.
Reducer `LEARN_SKILL` in `game.reducer.ts` already passes the full
`state.player`, so the call site reads
`state.player.philosophicalAlignment` (the field shipped at Phase 42).
The optional parameter keeps backwards compatibility for any caller
that doesn't have alignment in hand.

**Type sharing:** import `AlignmentGate` from `src/NPCs/types.d.ts`
into `src/Skills/types.d.ts` — both surfaces share the predicate
shape. (Could elevate to `src/Philosophy/types.d.ts` instead;
pick whichever import direction stays acyclic. Brief decision below.)

**Tests:**

Extend `src/Skills/e2e/learning.engine.test.ts` (or
`src/Skills/e2e/skill.engine.test.ts`) with 3 cases:
1. Skill with `requiresAlignment: { axis: 'outlook', op: 'lte', value: -34 }`
   passes `meetsLearningRequirement` for a player at `outlook = -50`,
   fails at `outlook = 0`.
2. `getAvailableSkills` excludes the gated skill when the player's
   alignment doesn't match.
3. Skill with both `requiresAlignment` AND `level` gates: a high-level
   player with mismatched alignment is still refused; a level-low
   player with matched alignment is also refused.

Commit: `feat(skills): Phase 46 unit 2 — requiresAlignment on learning requirements`.

### Unit 3 — Content authoring + docs + plan tick

**Files (edited):**
- `src/Skills/skill.library.ts` — add `requiresAlignment` to
  `nirvana-fallacy` (`outlook <= -34`) and `appeal-to-fear`
  (`scope >= 34`). Both already carry `sourcedFromCell` to the
  matching philosophical quadrant; the gate aligns mechanics with
  source.
- `src/World/Continents/Coastal-Village/maps.ts` — add 2-3
  alignment-gated dialogue branches:
  - Old Marrow `offer` node: a new choice "You speak like someone
    who already lost everything" surfaces only when the player is
    at `outlook <= -34` — pessimistic recognition between two
    broken people.
  - Coastal Beggar `greet` node: an alignment-gated "Take my hand —
    your I-Thou is sacred" surfaces only when `scope` is
    `mid` (relational) — `op: 'gte', value: -33` combined with
    `op: 'lte', value: 33`... wait, single-clause gate. Use one
    that captures the spirit. Author it as `axis: 'scope', op: 'gte', value: -33`
    (i.e. not solidly individual).
- `src/CLI/game.cli.ts` — wherever the CLI calls
  `applyDialogueChoice` or `visibleChoices`, thread
  `player.philosophicalAlignment` into the `DialogueContext`.
- `docs/philosophy.md` — append "Authoring gates (Phase 46)"
  subsection documenting the `AlignmentGate` shape, the operator
  semantics (`gte` / `lte`), and the authored examples.
- `plan/steps/01_build_plan.md` — flip Phase 46 `[ ]` → `[x]`.

**Hermetic e2e:** new `src/Philosophy/e2e/alignment-gates.engine.test.ts`
(or extend `alignment-authoring.engine.test.ts`) with:
1. Drive `applyDialogueChoice` through `gameReducer` with a player
   whose alignment matches the gated branch — branch fires.
2. Same, with player whose alignment doesn't match — branch is
   absent.
3. `learnSkill('nirvana-fallacy', ...)` succeeds for a player at
   `outlook = -50`, fails at `outlook = 0`.

Commit: `feat(philosophy): Phase 46 unit 3 — alignment-gated content + docs + plan tick`.

## Decisions made upfront — DO NOT ASK

- **Single-clause gate**, not a Partial range. `AlignmentGate` is
  one axis + one op + one value. Compound gates (e.g. "Logic AND
  Pessimistic") are deferred — when a real content author needs
  one, they can use TWO separate gated choices that share a
  follow-up `nextNodeId`. Keeps the type narrow.
- **`AlignmentGate` lives in `src/NPCs/types.d.ts`** as the
  canonical declaration; `src/Skills/types.d.ts` imports it. Pick
  this direction because NPCs already declares the choice-shape
  type that the gate sits on; the Skills side just consumes.
- **`DialogueContext.alignment` is optional.** Mirrors the existing
  `flags`-set convention — a missing context field implicitly
  rejects the gated content. Callers that DO want gated content
  surfaced must thread alignment explicitly.
- **`meetsLearningRequirement` signature gains an optional 4th
  parameter, not a Character pick widening.** Keeps the existing
  3-arg form back-compat for any consumer; adds the alignment-
  aware path for sites that have the full state. `learnSkill` does
  the same.
- **Authored gates use real cell quadrants, not invented thresholds.**
  `outlook <= -34` matches the cube's `bucketAxis` boundary (the
  Phase 42 `AXIS_LOW_THRESHOLD`). Authors who want "more
  pessimistic than mid" use the same threshold the bucketing
  helper does. Documented in `docs/philosophy.md`.
- **Gated skills do NOT also gain `sourcedFromCell` matching
  enforcement.** The cell that authored the skill (Phase 44) and
  the cell the player needs to be in to LEARN it (Phase 46) are
  related but not identical. Author chooses both per skill.
  Today `nirvana-fallacy` is `sourcedFromCell: logic-pessimistic-individual`
  but the gate is the looser `outlook <= -34` (any pessimistic
  cell). Future content can tighten the gates by combining clauses.
- **No new `SHIFT_PHILOSOPHICAL_ALIGNMENT_*` action.** The gate is
  read-only on the runtime side; alignment shifts are still authored
  via the Phase 43 `alignmentDelta` field.
- **No store-side `GameAction` shape changes.** `LEARN_SKILL` still
  takes `{ skillId: string }`; the reducer reads the player's
  alignment from state internally and passes it down.
- **CLI threading:** the only `applyDialogueChoice` consumer
  outside tests is `src/Game/game.reducer.ts` (via `applyDialogueRuntime`).
  The CLI calls into the store dispatch path; threading alignment
  happens in the runtime, not the CLI itself. `visibleChoices` is
  called directly by `src/CLI/game.cli.ts` for the dialogue prompt
  — that call site gains alignment from `state.player.philosophicalAlignment`.

## Verify gate

`npm run type-check && npm run lint && npm test && npm run build`.
Then `npm run deploy:check`.

## Commit body template (final commit / Unit 3)

```
feat(philosophy): Phase 46 — alignment-gated content (dialogue + skill learning)

Closes the Phase 42-45 four-corner triangle. The alignment cube now
narrows the player's content menu: dialogue choices and skill learning
can be locked behind cell requirements via the new AlignmentGate shape.

- DialogueChoice.requires.requiresAlignment?: AlignmentGate
- SkillLearningRequirement.requiresAlignment?: AlignmentGate
- AlignmentGate = { axis: 'epistemology'|'outlook'|'scope', op: 'gte'|'lte', value: number }
- visibleChoices reads ctx.alignment + applies the gate
- meetsLearningRequirement / getAvailableSkills / learnSkill accept
  an optional alignment parameter
- 2 alignment-gated dialogue branches authored on Old Marrow + Coastal Beggar
- 2 alignment-gated Tier 3 skills: nirvana-fallacy (outlook ≤ -34),
  appeal-to-fear (scope ≥ 34)
- Hermetic e2e covers visibility + learning + cell-matched filtering
- docs/philosophy.md "Authoring gates (Phase 46)" subsection

Refs: plan/phases/phase_46_alignment_gated_content.md, Phase 42-45.
```

## Definition of Done

- [ ] `AlignmentGate` type exported from `src/NPCs/types.d.ts` (or re-exported via barrel).
- [ ] `DialogueChoice.requires.requiresAlignment?: AlignmentGate` exists.
- [ ] `SkillLearningRequirement.requiresAlignment?: AlignmentGate` exists.
- [ ] `DialogueContext.alignment?: PhilosophicalAlignment` exists.
- [ ] `visibleChoices` filters by `requiresAlignment` when set.
- [ ] `meetsLearningRequirement` / `getAvailableSkills` / `learnSkill` accept an optional `alignment` parameter and honour it when both gate + alignment are present.
- [ ] 2-3 authored dialogue branches with `requiresAlignment` in `Coastal-Village/maps.ts`.
- [ ] 2 authored Tier 3 skills with `requiresAlignment` (`nirvana-fallacy` + `appeal-to-fear`).
- [ ] CLI threading: `src/CLI/game.cli.ts` passes `state.player.philosophicalAlignment` to `visibleChoices` calls.
- [ ] Hermetic e2e (≥6 cases across the dialogue + skill paths).
- [ ] `docs/philosophy.md` "Authoring gates (Phase 46)" subsection.
- [ ] Phase 46 row in `plan/steps/01_build_plan.md` flipped to `[x]` with all three commit hashes.
- [ ] `npm run verify` + `npm run deploy:check` green.

## Follow-ups (out of scope)

- **Compound gates** (multiple axes AND together). Today's gate is single-axis; compound cases author as duplicate gated choices sharing a `nextNodeId`. If the duplication grows painful, promote to `requires.alignment: AlignmentGate[]` (AND-of-array) in a follow-up.
- **`requiresAlignmentRange`** — a min/max-form gate for "must be in mid bucket" (`epistemology >= -33 AND <= 33`). Today author with two separate gates that share an outcome. Promote if needed.
- **Alignment-gated effects.** Effects could also gate (e.g. `buff_special_pleading` only applicable to a Faith-aligned target). Out of scope for Phase 46; add if a concrete content authoring need surfaces.
- **Alignment-gated endings.** Phase 42 brief Follow-ups names this as a long-arc item — the endgame quest chain branches by cell. Out of scope here; the dialogue surface this phase ships is the foundation for that future work.
- **Map-event-pool `requiresAlignment`.** `MapEventPoolEntry` could gate which pool entries a node draws from based on alignment. Today entries always roll; this could create alignment-flavoured nodes. Out of scope.
