# Spec 14 — Philosophical Alignment Cube

[DONE on 2026-05-20 — engine shipped Phase 42 (`bdfda00`); spec authored
retroactively at Phase 58.]

## Goal

A three-axis player alignment system (**Epistemology × Outlook ×
Scope**) backed by a 27-cell content registry where each cell carries
a philosopher, a literary character, and three signature fallacies.
The cube is **observable** (rendered on the Character tab),
**payloadable** (dialogue + map events can shift it),
**enemy-side** (every authored enemy has an alignment + outlook-driven
AI bias), and **gated** (dialogue choices + skill learning can
require an axis-bucket threshold).

**Success state:** A consumer can read `GameState.philosophicalAlignment`,
shift it via `SHIFT_PHILOSOPHICAL_ALIGNMENT` (or implicitly via
`alignmentDelta` on a dialogue choice or map-event pool entry), look
up the active cell via `getAlignmentCell`, gate content with
`AlignmentGate`, and observe the cube influencing combat through
authored enemy alignments + the Phase 45 outlook-driven flip rules.
All four surfaces shipped across Phases 42-46; this spec is the
retroactive conversation-loop record.

## Why now / dependencies

- **Unblocks:** future alignment-content phases (befriendable-enemy
  alignment cues; alignment-gated endings; second-continent
  alignment regions). Drains the critique-18 spec-gap row from
  `plan/CRITIQUE.md`.
- **Depends on:** Spec 01 (Effects) for status-effect cross-link in
  the fallacy-as-spells / fallacy-as-effects content (Phase 44),
  Spec 04 (Skills) for skill-side alignment gating + content
  authoring (Phase 44 / 46), Spec 09 (Game store) for the
  `GameState.philosophicalAlignment` field + `migrateV4toV5`
  migrator (Phase 42), Spec 23 (MapEvents) for the per-pool-entry
  `alignmentDelta` authoring surface (Phase 43). All shipped.

## Current state

Five phases of engine + content work shipped against the cube:

| Phase | Closing commit | What landed |
|---|---|---|
| **42** | `bdfda00` | `src/Philosophy/` module: types (`PhilosophicalAlignment`, `AxisBucket`, `AlignmentFallacy`, `PhilosophicalAlignmentCell`), engine (`bucketAxis`, `getAlignmentCell`, `applyAlignmentDelta`, `defaultAlignment`), constants (`AXIS_HIGH_THRESHOLD`, `AXIS_LOW_THRESHOLD`), and the full 27-cell library (`philosophicalAlignmentLibrary`) populated from `content/philosophy/PhilosAxiosDoc.pdf` with philosopher + literary character + 3 fallacies per cell. `GameState.philosophicalAlignment` field. `SHIFT_PHILOSOPHICAL_ALIGNMENT` action + store action. `GAME_STATE_VERSION` 4 → 5 with `migrateV4toV5` defaulting legacy saves to `{0, 0, 0}`. CLI Character tab renders the active cell. `docs/philosophy.md` ships axes + thresholds + 27-cell table + orthogonality note vs `moralMeter`. |
| **43** | `764de7f` + `fb7a474` + closing | `DialogueChoice.effect.alignmentDelta?: Partial<PhilosophicalAlignment>` + `MapEventPoolEntry.alignmentDelta?: Partial<PhilosophicalAlignment>` authoring surfaces. `applyDialogueChoice` and `resolveMapEvent` apply the delta via `applyAlignmentDelta` (clamps `[-100, +100]` per axis). First-pass authoring: 5 dialogue deltas (Old Marrow + Coastal Beggar trees) + 6 map-event deltas (`fv-1/8/9/10`, `nf-4/10`). Result surfaces include `effects.philosophicalShift`. |
| **44** | `87cfa7e` + `06f5ffe` + closing | `Skill.sourcedFromCell?: string` + `Effect.sourcedFromCell?: string` cross-link. 4 new Tier 3 fallacy skills (`appeal-to-consequences`, `nirvana-fallacy`, `pascals-wager`, `appeal-to-fear`) + 3 new fallacy status effects (`debuff_no_true_scotsman`, `buff_special_pleading`, `debuff_category_error`), all linked to their originating cell. `docs/skills.md` + `docs/effects.md` "Philosophical fallacy payloads (Phase 44)" subsections. |
| **45** | `b185fe2` + `cb526a1` | `Enemy.philosophicalAlignment?: PhilosophicalAlignment` field. All 16 `ENEMY_REGISTRY` entries backfilled with thematic cell pins (13 distinct cells used of 27). `applyOutlookBias(action, enemy)` flip rule wired into `decideEnemyAction`: pessimistic enemies (outlook ≤ -34) flip `attack` → `defend` at 25% / round; optimistic enemies (outlook ≥ 34) flip `defend` → `attack` at 25% / round; mid-bucket / no-alignment / non-`attack`/`defend` actions pass through unchanged. |
| **46** | `49b02f6` + `fb319cb` + `3765c31` | `AlignmentGate` predicate type (`{ axis, op: 'gte' \| 'lte', value }`). `DialogueChoice.requires.requiresAlignment?: AlignmentGate` + `SkillLearningRequirement.requiresAlignment?: AlignmentGate`. `visibleChoices` / `meetsLearningRequirement` / `getAvailableSkills` / `learnSkill` extended with optional `alignment` parameter. `DialogueContext.alignment?` field. First-pass authored gates: `nirvana-fallacy` requires `outlook ≤ -34`; `appeal-to-fear` requires `scope ≥ 34`; Old Marrow + Coastal Beggar trees gain alignment-gated branches. |
| **69** | `a42709f` + closing | `FriendshipReward.alignmentDelta?: Partial<PhilosophicalAlignment>` field on `src/Enemy/types.ts`. END_COMBAT reducer applies the delta to `state.philosophicalAlignment` via `applyAlignmentDelta` on the `outcome === 'friendship'` branch (alongside the Phase 36 +1 `moralMeter` shift). `CombatEndReport.friendshipReward.alignmentShift?: PhilosophicalAlignment` surfaces the post-clamp value for consumers. First authored deltas: MournfulGull `{ outlook: +3 }` (wistful empathy); HollowEyedBeggar `{ scope: -3 }` (re-grounds toward the relational individual). Closes Q4. |

Public-API surface (top-level barrel, `src/index.ts`):

- **Engine:** `bucketAxis`, `getAlignmentCell`, `applyAlignmentDelta`, `defaultAlignment`.
- **Constants:** `AXIS_HIGH_THRESHOLD`, `AXIS_LOW_THRESHOLD`.
- **Library:** `philosophicalAlignmentLibrary`.
- **Types:** `AxisBucket`, `PhilosophicalAlignment`, `AlignmentFallacy`, `PhilosophicalAlignmentCell`, `AlignmentGate` (the gate type is re-exported from the NPCs section since it surfaces in dialogue, but its semantics belong to this spec).
- **State:** `GameState.philosophicalAlignment` (Phase 42); `SHIFT_PHILOSOPHICAL_ALIGNMENT` action + store action.
- **Authoring:** `DialogueChoice.effect.alignmentDelta`, `MapEventPoolEntry.alignmentDelta`, `Skill.sourcedFromCell`, `Effect.sourcedFromCell`, `Enemy.philosophicalAlignment`, `DialogueChoice.requires.requiresAlignment`, `SkillLearningRequirement.requiresAlignment`.

Hermetic test coverage:

- `src/Philosophy/e2e/alignment.engine.test.ts` — Phase 42 cube + library + reducer + migrator.
- `src/Philosophy/e2e/alignment-authoring.engine.test.ts` — Phase 43 authoring-surface deltas.
- `src/Skills/e2e/fallacy-skills.engine.test.ts` — Phase 44 fallacy skills + effects + `sourcedFromCell`.
- `src/Enemy/e2e/alignment.engine.test.ts` — Phase 45 enemy alignment + outlook-bias AI tuner.
- Phase 46 gate behaviour covered by extensions to `src/NPCs/e2e/dialogue.engine.test.ts` + `src/Skills/e2e/learning.engine.test.ts` + `src/Game/e2e/learn-skill.engine.test.ts`.

## Open questions

1. **Should `moralMeter` unify into the cube as a 4th axis?**
   > Your answer: No. `moralMeter` and `philosophicalAlignment` are
   > intentionally orthogonal. `moralMeter` tracks compassion ↔
   > cruelty along a single sympathetic axis (Spec 10, Phase 10);
   > the cube tracks epistemology × outlook × scope (Phase 42).
   > They shift independently and `docs/philosophy.md` already
   > documents the orthogonality with a worked example (a
   > Pessimist can still be compassionate). Unifying them would
   > conflate categories and rob the game of one of its two
   > character axes. The two systems share authoring surfaces
   > (a single dialogue choice can carry both a `moralDelta` and an
   > `alignmentDelta`), but the state fields stay separate.

2. **Should alignment shifts propagate to NPCs that observe the
   player?**
   > Your answer: **Resolved at Phase 63.** The deferral has been
   > closed. Phase 63 shipped tree-level observers rather than
   > NPC-level (per Phase 63 D1 — cleaner ergonomics; trees are
   > what `applyDialogueChoice` operates on):
   > `DialogueTree.id?: string` opts a tree into the cache;
   > `GameState.lastSeenAlignmentCells?: Record<string, string>` is
   > the keyed cache (tree-id → cell-id, additive optional field,
   > no `GAME_STATE_VERSION` bump per Phase 63 D2);
   > `DialogueChoice.requires.playerAlignmentCellChangedSince?:
   > boolean` is the reactive gate; `applyDialogueChoice` writes
   > the current cell to the cache AFTER applying choice effects
   > per Phase 63 D4. First authored use: Old Marrow's tree
   > (`id: 'old-marrow'`) gains a reactive branch that surfaces on
   > re-conversation after the player's cell has shifted.
   > See `docs/npcs.md` § "Reactive NPCs — alignment observers
   > (Phase 63)" for the consumer-side API.

3. **Should there be alignment-gated endings?**
   > Your answer: Deferred. No endgame content exists in the engine
   > today (spec.md 6-month horizon lists endgame as future work).
   > The `AlignmentGate` predicate Phase 46 shipped is already the
   > natural primitive for ending-eligibility checks; the same
   > shape that gates `DialogueChoice.requires.requiresAlignment` +
   > `SkillLearningRequirement.requiresAlignment` can extend to an
   > `endingEligibility?: AlignmentGate[]` slot when endgame
   > content lands. No new engine work needed; documenting the
   > extension path here so the eventual endgame phase has a
   > pre-shaped slot.

4. **How does the alignment cube intersect with the friendship-
   victory mechanic?**
   > **Resolved at Phase 69** (closes the orthogonality deferral).
   > Phase 69 (`a42709f`) extended `FriendshipReward` with an optional
   > `alignmentDelta?: Partial<PhilosophicalAlignment>` field on
   > `src/Enemy/types.ts`. When present, the END_COMBAT reducer at
   > `src/Game/game.reducer.ts` applies the delta to
   > `state.philosophicalAlignment` via the Phase 42
   > `applyAlignmentDelta` clamp helper (each axis clamps to
   > `[-100, +100]`, missing axes pass through). The post-clamp
   > `PhilosophicalAlignment` surfaces on
   > `CombatEndReport.friendshipReward.alignmentShift` for the
   > consumer to render. Phase 36's +1 `moralMeter` shift remains
   > unchanged on top — friendship resolutions now optionally shift
   > BOTH axes, but the engine doesn't require it. Authoring band
   > mirrors Phase 43's dialogue / map-event delta convention
   > (±1..±5 per axis; ±10 reserved for endgame). First authored
   > deltas: `MournfulGull` ships `{ outlook: +3 }` (wistful empathy);
   > `HollowEyedBeggar` ships `{ scope: -3 }` (re-grounds toward
   > the relational individual). Per-encounter MapEvent-style
   > authoring (the original "no engine work" answer) is still
   > available via Phase 43 for non-friendship-tied shifts; the
   > Phase 69 surface is the direct friendship-victory hook.

## Proposed approach

~~If you have no overrides, the AI will implement in this order:~~

**N/A — engine is live.** This spec is a retroactive conversation-loop
record. The work that would otherwise live in "Proposed approach"
shipped across Phases 42-46 (see Current state table above); each
phase brief in `plan/phases/phase_4{2-6}_*.md` carries the
implementation order for its phase. Future alignment-content phases
(befriendable-enemy alignment cues, alignment-gated endings,
NPC-observer wiring) get their own briefs.

## Acceptance checklist

- [x] All four open questions answered with shipped-code-derived
      answers.
- [x] Cube engine + 27-cell library shipped — Phase 42 (`bdfda00`).
- [x] State field + reducer + migrator shipped — Phase 42 (`bdfda00`).
- [x] Authoring surfaces (`DialogueChoice` + `MapEventPoolEntry`)
      shipped — Phase 43 (`764de7f` + `fb7a474` + closing).
- [x] Fallacy-as-spells / fallacy-as-effects content shipped —
      Phase 44 (`87cfa7e` + `06f5ffe` + closing).
- [x] Enemy alignment + outlook-bias AI shipped — Phase 45
      (`b185fe2` + `cb526a1`).
- [x] Alignment gating on dialogue + skill learning shipped —
      Phase 46 (`49b02f6` + `fb319cb` + `3765c31`).
- [x] Hermetic e2e coverage exists across the five surfaces. See
      `src/Philosophy/e2e/alignment.engine.test.ts`,
      `src/Philosophy/e2e/alignment-authoring.engine.test.ts`,
      `src/Skills/e2e/fallacy-skills.engine.test.ts`, and
      `src/Enemy/e2e/alignment.engine.test.ts`, plus Phase 46
      extensions to the NPCs + Skills + Game e2e suites.
- [x] `npm test` and `npm run type-check` are clean (625/625 as of
      Phase 57 close).
- [x] `docs/philosophy.md` documents axes, thresholds, the 27-cell
      table, orthogonality with `moralMeter`, the authoring deltas
      (Phase 43 subsection), the fallacy payloads (Phase 44 via
      `docs/skills.md` + `docs/effects.md` cross-links), the
      enemy-alignment AI tuning (Phase 45 via `docs/enemy.md`
      cross-link), and the authoring gates (Phase 46 subsection).

## Out of scope

- **moralMeter unification.** Q1 — explicitly orthogonal by design;
  see Q1's answer.
- **NPC observer wiring.** Q2 — deferred to a future content phase;
  see Q2's answer for the extension shape.
- **Alignment-gated endings.** Q3 — deferred to the eventual endgame
  phase; see Q3's answer for the pre-shaped slot.
- ~~**Friendship-victory alignment shifts.** Q4~~ — **Resolved at
  Phase 69** (`a42709f`). `FriendshipReward.alignmentDelta?:
  Partial<PhilosophicalAlignment>` is the canonical surface; the
  END_COMBAT reducer threads it through `applyAlignmentDelta`. The
  Phase 43 `MapEventPoolEntry.alignmentDelta` authoring surface stays
  available for non-friendship-tied shifts.
- **Compound moralMeter ∧ alignment gates.** Sequential checking
  works today; if/when content needs compound gates, that's a
  follow-up spec extension.
- **Per-axis content registries.** The 27-cell registry is currently
  the only content registry; if/when content authoring grows to
  per-cell quest pools or per-axis biome themes, that's separate
  spec work.

## Related artefacts

- **PDF source:** `content/philosophy/PhilosAxiosDoc.pdf` — verbatim
  source for cell content (philosopher, literary character, three
  fallacies per cell). Moved to `content/philosophy/` at iterate
  `2529697`.
- **Cross-spec links:** Spec 10 (`10-moral-difficulty-meter.md`) is
  the orthogonal compassion-axis sibling. Spec 23
  (`23-map-events.md`) ships the `MapEventPoolEntry.alignmentDelta`
  authoring surface used by Phase 43. Spec 04 / 04b ship the
  `Skill` type that gained `sourcedFromCell` (Phase 44) and
  `learningRequirement.requiresAlignment` (Phase 46).
- **Phase briefs:**
  `plan/phases/phase_42_philosophical_alignment.md`,
  `plan/phases/phase_43_alignment_authoring_sweep.md`,
  `plan/phases/phase_44_fallacies_as_spells.md`,
  `plan/phases/phase_45_enemies_by_alignment.md`,
  `plan/phases/phase_46_alignment_gated_content.md`.
- **Docs:** `docs/philosophy.md` (canonical reference),
  `docs/api.md` Philosophy section, `docs/enemy.md`
  "Alignment-driven AI tuning (Phase 45)" subsection,
  `docs/skills.md` + `docs/effects.md` "Philosophical fallacy
  payloads (Phase 44)" subsections, `docs/morality.md` cross-link
  (orthogonality, iterate `ce543d8`).
