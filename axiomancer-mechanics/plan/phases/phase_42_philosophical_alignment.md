# Phase 42 — Philosophical alignment engine (3-axis Logic/Outlook/Scope cube)

> Lays in the foundation of the 27-cell philosophical-alignment system
> described in `content/philosophy/content/philosophy/PhilosAxiosDoc.pdf` (moved from the repo root at iterate 322227a era). Ships
> the engine primitives — state shape, shift reducer, bucket-to-cell
> selector — and the full 27-entry content registry (philosopher,
> literary character, three signature fallacies per cell). Wires
> save/load migration and surfaces the current cell on the CLI
> character sheet. Does NOT yet wire alignment shifts into existing
> map events, dialogue, or combat — that's follow-up content work.
> Does NOT retire `moralMeter`; the existing compassion axis stays
> intact alongside this new system.

## Outcome

After this phase:

- `GameState.philosophicalAlignment: { epistemology: number; outlook: number; scope: number }`
  with each value in `[-100, +100]`, defaulting to `0/0/0` at new-game.
- `shiftPhilosophicalAlignment(state, delta)` reducer + matching store
  action + matching `GameAction` variant (mirrors the `shiftMoralMeter`
  pattern).
- `getAlignmentCell(state) → PhilosophicalAlignmentCell` selector that
  buckets each axis to one of three zones and looks up the resulting
  cell from a frozen library of 27 entries. Every reachable
  `(axis1Bucket, axis2Bucket, axis3Bucket)` triple resolves; no holes.
- `philosophicalAlignment.library` ships every cell from the PDF:
  philosopher name, literary character + source work, three logical
  fallacies (each with name + example sentence + alignment rationale).
- Save migration `v4 → v5` defaults the new field to `{0, 0, 0}` so
  legacy saves continue to load.
- The CLI **Character** tab gains a "Philosophical alignment" block
  rendering the current cell's name + philosopher + literary character
  (the three fallacies are stored but not yet surfaced — they're
  reserved for future spell/ability content per the PDF's closing
  note).
- New `docs/philosophy.md` documents the axis shape, the bucketing
  rule, and the cell registry.

## Source spec

- `content/philosophy/PhilosAxiosDoc.pdf` (12 pages, repo root, committed) — the
  authoritative 27-cell layout. Each cell entry is read straight off
  the PDF in `philosophicalAlignment.library`.
- `specs/10-moral-difficulty-meter.md` Q1 explicitly leaves room:
  > "For now, a single integer, but in the future it'll be multi-axis."
  This phase opens that multi-axis surface as a sibling field rather
  than replacing `moralMeter`, because (a) Q4 keeps `moralMeter`
  narrative-only and (b) the PDF's three axes don't map onto the
  compassion ↔ ruthlessness dimension that `moralMeter` already
  tracks.
- No standalone `specs/NN-philosophical-alignment.md` is being
  authored in this phase — the PDF acts as the source-of-truth for
  cell content and the engine details are all decided in this brief.
  A follow-up `specs/14-philosophical-alignment.md` is filed under
  Follow-ups if the system grows enough to need its own conversation-
  loop spec.
- `plan/bearings.md` "Visual & tonal defaults": "Enemies are
  embodiments of logical fallacies. Effect names reference
  philosophical paradoxes." — the cell library is the long-form
  vocabulary backing this tonal commitment.

## Implementation units

### Unit 1 — Engine primitives + types + library scaffold

**Files (new):**
- `src/Philosophy/types.d.ts`
- `src/Philosophy/alignment.engine.ts`
- `src/Philosophy/alignment.library.ts` (skeleton only — actual 27
  entries land in Unit 2)
- `src/Philosophy/index.ts`

**Files (edited):**
- `src/Game/types.d.ts` — add `philosophicalAlignment` field.
- `src/Game/game.reducer.ts` — default in `createInitialGameState`;
  reducer branch + helper.
- `src/Game/actions.types.ts` — new action variant.
- `src/Game/actions.constants.ts` — new action constant.
- `src/Game/store.ts` — new store action.
- `src/Game/game.migrate.ts` — bump version + v4→v5 migrator + extend
  `assertGameState`.
- `src/Game/game.reducer.ts` — bump `GAME_STATE_VERSION` to `5`.
- `src/index.ts` — re-export the new public types + helpers.

**Types (`src/Philosophy/types.d.ts`):**

```ts
/** One of three buckets per axis, computed from a [-100, +100] integer. */
export type AxisBucket = 'low' | 'mid' | 'high';

/** Continuous alignment state on three orthogonal axes. */
export interface PhilosophicalAlignment {
    /** -100 = Faith ◀ Agnostic ▶ +100 = Logic. */
    epistemology: number;
    /** -100 = Pessimistic ◀ Neutral ▶ +100 = Optimistic. */
    outlook: number;
    /** -100 = Individual ◀ Relational ▶ +100 = Transcendent. */
    scope: number;
}

/** A single logical-fallacy entry attached to a cell. */
export interface AlignmentFallacy {
    name: string;
    example: string;
    rationale: string;
}

/** One of the 27 cells, identified by its triple of axis buckets. */
export interface PhilosophicalAlignmentCell {
    id: string;
    epistemology: AxisBucket;
    outlook: AxisBucket;
    scope: AxisBucket;
    label: string;
    philosopher: string;
    literaryCharacter: { name: string; work: string };
    fallacies: [AlignmentFallacy, AlignmentFallacy, AlignmentFallacy];
}
```

**Engine (`src/Philosophy/alignment.engine.ts`):**

- `bucketAxis(value: number): AxisBucket` — `< -33` → `'low'`,
  `> 33` → `'high'`, else `'mid'`. Exported.
- `getAlignmentCell(alignment: PhilosophicalAlignment): PhilosophicalAlignmentCell`
  — buckets each axis and looks up the cell in
  `alignmentCellsByTriple` (a `Map<string, Cell>` built once at
  module load from `philosophicalAlignment.library`). Throws if the
  triple isn't in the map — invariant: the library is exhaustive.
- `shiftPhilosophicalAlignment(state: GameState, delta: Partial<PhilosophicalAlignment>): GameState`
  — clamps each shifted axis to `[-100, +100]`, returns a new
  `GameState`. Missing axes in `delta` pass through unchanged.

**Library scaffold (`src/Philosophy/alignment.library.ts`):**

Export `philosophicalAlignment.library: readonly PhilosophicalAlignmentCell[]`.
Unit 1 ships the array with a single placeholder cell (Logic-
Optimistic-Individual = Nietzsche) so the engine compiles; the rest
of the 27 land in Unit 2. The Unit 1 hermetic test will only assert
shape + reducer behaviour, not coverage.

**Action wiring:**

```ts
// actions.types.ts
| { type: 'SHIFT_PHILOSOPHICAL_ALIGNMENT'; payload: { delta: Partial<PhilosophicalAlignment> } }

// store.ts
shiftPhilosophicalAlignment: (delta: Partial<PhilosophicalAlignment>) => void;
```

**Save migration (`src/Game/game.migrate.ts`):**

```ts
interface GameStateV4 extends Omit<GameState, 'philosophicalAlignment'> {
    version: 4;
}

function migrateV4toV5(v4: GameStateV4): GameState {
    return {
        ...v4,
        version: 5,
        philosophicalAlignment: { epistemology: 0, outlook: 0, scope: 0 },
    };
}
```

Funnel adds the v4→v5 step. `assertGameState` learns to check
`philosophicalAlignment` shape (three numbers).

**Tests (Unit 1):**

`src/Philosophy/e2e/alignment.engine.test.ts` (new) — at least 6
cases:

1. `bucketAxis` boundary table — `-100/-34/-33/0/+33/+34/+100` → expected buckets.
2. `shiftPhilosophicalAlignment` clamps at both ends.
3. `shiftPhilosophicalAlignment` honours `Partial` — only the named
   axis shifts.
4. `getAlignmentCell` returns the placeholder cell when alignment
   maps to its triple.
5. `SHIFT_PHILOSOPHICAL_ALIGNMENT` action dispatches through
   `gameReducer` and updates state.
6. Save/load round-trip — write a `GameState` to JSON, read it back,
   assert `philosophicalAlignment` survives.

Migrator coverage lives inside the same
`src/Philosophy/e2e/alignment.engine.test.ts` file (no dedicated
`game.migrate.test.ts` exists today — see `find src -name '*migrate*'`):
pin v4→v5 by hand-rolling a v4 fixture (lacking
`philosophicalAlignment`), calling `migrate(raw, 4)`, asserting the
result has `version === 5` + the field defaulted to `{0,0,0}`.
Adding a stand-alone migrate test file is out of scope for this
phase — `/iterate` can split the case out later if the migrate
coverage backlog grows.

Commit: `feat(philosophy): Phase 42 unit 1 — alignment engine + state field + migrator`.

### Unit 2 — 27-cell content registry

**File:** `src/Philosophy/alignment.library.ts` (replace placeholder).

Author all 27 cells exactly as listed in `content/philosophy/PhilosAxiosDoc.pdf`. Cell id
format: `<eps>-<outlook>-<scope>` lowercase (e.g.
`logic-optimistic-individual`). Triples in `(epistemology, outlook,
scope)` order. Cell mappings:

| Axis | low | mid | high |
|---|---|---|---|
| `epistemology` | Faith | Agnostic | Logic |
| `outlook` | Pessimistic | Neutral | Optimistic |
| `scope` | Individual | Relational | Transcendent |

Decision: the **PDF lists Logic first** but Logic is the *high* bucket
because Logic represents the "more grounded in reason" end of the
axis, mirroring how `moralMeter` puts compassion in the positive
half. Authoring still cross-references the PDF numbering (1-27) in
each entry's leading comment so a future reader can audit against the
source pdf.

**Tests:** extend `alignment.engine.test.ts` with:

7. **Library exhaustiveness** — assert `philosophicalAlignment.library`
   has exactly 27 entries; assert every `(low|mid|high) × 3` triple
   resolves through `getAlignmentCell`; no duplicate ids.
8. **PDF cross-check** — spot-check three cells against the PDF
   verbatim (cell 1 Nietzsche / Prometheus, cell 12 William James /
   Pi Patel, cell 27 Marcion / Grand Inquisitor) — assert philosopher
   name + literary character name + first fallacy name.

Commit: `feat(philosophy): Phase 42 unit 2 — 27-cell content library + exhaustiveness test`.

### Unit 3 — CLI surface + docs + plan-tick

**File (edited):** `src/CLI/game.cli.ts` — extend the Character tab
(`renderCharacterSheet` or wherever moralMeter renders today).
Render block:

```
Philosophical alignment
  Cell:        <label>
  Philosopher: <philosopher>
  Character:   <literaryCharacter.name> — <literaryCharacter.work>
  Epistemology: <bucket> (<raw>)
  Outlook:      <bucket> (<raw>)
  Scope:        <bucket> (<raw>)
```

(Format may vary slightly to match the prevailing render style in
`game.cli.ts`; the rule is one line of axis numerics so the agent-
graded harness can extract them.)

**File (new):** `docs/philosophy.md` — short page covering:
- The three axes and their endpoints.
- The bucketing thresholds.
- A table of the 27 cells (id + philosopher + literary character).
- A note that the three fallacies per cell are content fuel for
  future skill/effect/spell authoring per the PDF's closing line.
- A cross-link to `docs/morality.md` clarifying that
  `philosophicalAlignment` is orthogonal to `moralMeter`, not a
  replacement.

**Files (edited for docs hygiene):**
- `docs/api.md` — add the new exports under a "Philosophy" group
  (mirrors how Phase 37 added a Shop block).
- `Knowledge-Gaps.md` — if the file carries an open Q about
  multi-axis morality (or similar), flip it to resolved with this
  phase hash.
- `plan/steps/01_build_plan.md` — append Phase 42 row in the "Next
  up" block once committed; flip `[ ]` → `[x]` with hash + summary.

**Plan tick + commit:**

Commit: `feat(philosophy): Phase 42 unit 3 — CLI alignment surface + docs`.

## Decisions made upfront — DO NOT ASK

- **Sibling field, not replacement.** `philosophicalAlignment`
  lives alongside `moralMeter`, not in place of it. Spec 10 Q4 keeps
  the meter narrative-only; the PDF's three axes don't collapse onto
  the compassion ↔ ruthlessness dimension. Treat the two systems as
  orthogonal narrative surfaces. Long-term migration to a unified
  alignment model is an explicit non-goal of this phase.
- **Continuous int per axis, not bucketed enum.** Each axis is an
  integer in `[-100, +100]` so future content can ship small/medium/
  large shifts the way `moralMeter` already does. The 27-cell
  lookup is *computed* from the current bucket triple — the cell
  isn't itself a state field.
- **Bucket thresholds: `< -33` / `> 33`.** Three equal-width zones
  across `[-100, +100]`. Boundary values land in `'mid'`. Decision
  is arbitrary-but-defensible; tuneable later via a single constant
  if the cell transitions feel wrong in playtest.
- **Axis polarity.** `epistemology`: low = Faith, high = Logic.
  `outlook`: low = Pessimistic, high = Optimistic. `scope`: low =
  Individual, high = Transcendent. The PDF's display order (Logic
  first, Optimistic first, Individual first) is just listing
  convention — engine numbering puts the "more grounded" / "more
  hopeful" / "smaller scope" ends at +/-. Documented in the table
  in `docs/philosophy.md`.
- **Cell ids are kebab-case "eps-outlook-scope".** Stable across
  versions; never refactor casing without a migration.
- **Fallacies stored, not surfaced.** Unit 3 renders philosopher +
  literary character on the Character tab. The three fallacies stay
  on the cell record — they are content fuel for a future
  skill/effect/spell phase per the PDF's closing line, but Phase 42
  doesn't wire them to gameplay.
- **No existing event / dialogue / combat call sites are
  retro-wired in this phase.** Authoring `moralDelta`-style
  payloads with philosophical shifts is a separate content phase;
  this phase only ships the primitives + content registry so future
  authoring can lean on them. Pre-empting authoring before the
  engine lands is exactly the churn the build plan warns against.
- **GameState version bumps to 5.** `game.migrate.ts` already
  knows the stepwise pattern (v2 → v3 → v4). v4 → v5 is mechanical:
  default the new field to `{0, 0, 0}`.
- **Library lives in `src/Philosophy/`, not `src/Game/`.** Library
  content matches the `src/Skills/skill.library.ts` and
  `src/Items/equipment.library.ts` pattern of "content as data
  table in its own module".
- **Public exports cross the barrel.** `src/index.ts` re-exports
  `philosophicalAlignment.library`, `getAlignmentCell`,
  `bucketAxis`, `shiftPhilosophicalAlignment`,
  `PhilosophicalAlignment`, `PhilosophicalAlignmentCell`,
  `AlignmentFallacy`, `AxisBucket`. RN consumers need them to
  render whatever the CLI renders.
- **No standalone `specs/NN-philosophical-alignment.md` in this
  phase.** The PDF is the source-of-truth for content; the engine
  decisions are documented here. If a follow-up phase needs to
  ratchet alignment-driven content surfaces (event payloads,
  alignment-gated skills, alignment-locked endings), that phase
  will write the conversation-loop spec then.
- **`moralMeter` not deprecated.** It keeps its current friendship
  +1 hook and its `± 1..±5` authoring range. Long-term unification
  is a Follow-up.
- **No multi-axis narrative payload format yet.** A `MapEvent`
  choice may currently carry `moralDelta?: number`. This phase
  does *not* add `alignmentDelta?: Partial<PhilosophicalAlignment>`.
  That's a content-authoring follow-up; doing it here would force a
  data-migration sweep across `src/World/Continents/` content with
  no live consumer.

## Verify gate

`npm run type-check && npm run lint && npm test && npm run build`.
Then `npm run verify:agent` to confirm the new tests register in the
agent-friendly report.

## Commit body template

```
feat(philosophy): Phase 42 — 3-axis philosophical alignment engine

Adds `philosophicalAlignment: { epistemology, outlook, scope }` to
GameState (-100..+100 per axis, defaults 0/0/0) and a 27-cell content
registry mirroring `content/philosophy/PhilosAxiosDoc.pdf` (philosopher + literary
character + 3 logical fallacies per cell). Cells are computed by
bucketing each axis at ±34. `shiftPhilosophicalAlignment` action
mirrors `shiftMoralMeter`. Save migration v4 → v5 defaults new field.
CLI Character tab renders the current cell + philosopher + literary
character. `moralMeter` keeps its existing role; the new system is
orthogonal, not a replacement (Spec 10 Q1 follow-up).

Refs: content/philosophy/PhilosAxiosDoc.pdf, plan/phases/phase_42_philosophical_alignment.md
```

## Definition of Done

- [ ] `GameState.philosophicalAlignment: { epistemology, outlook, scope }` exists; new game defaults to `{0, 0, 0}`.
- [ ] `shiftPhilosophicalAlignment` reducer + `SHIFT_PHILOSOPHICAL_ALIGNMENT` action + store action all wired; clamps to `[-100, +100]`.
- [ ] `bucketAxis(value)` returns `'low' | 'mid' | 'high'` with the documented thresholds.
- [ ] `getAlignmentCell(alignment)` returns the correct cell for every reachable triple; throws on unknown triple (invariant: never reachable in practice once the library is exhaustive).
- [ ] `philosophicalAlignment.library` contains exactly 27 entries; ids unique; one entry per `(low|mid|high)^3` triple; content matches `content/philosophy/PhilosAxiosDoc.pdf` (philosopher name, literary character name + work, three fallacies with name/example/rationale).
- [ ] `GAME_STATE_VERSION` is 5; `game.migrate.ts` carries a `migrateV4toV5` step; `assertGameState` validates the new field; legacy save fixture loads.
- [ ] `src/index.ts` re-exports the new public types + helpers + library.
- [ ] CLI Character tab renders cell label + philosopher + literary character + per-axis bucket and raw int.
- [ ] `docs/philosophy.md` documents axes, thresholds, the 27-cell table, and clarifies orthogonality with `moralMeter`.
- [ ] `docs/api.md` lists the new exports under a Philosophy group.
- [ ] Phase 42 row appended to `plan/steps/01_build_plan.md` "Next up" block as `[x]` with commit hashes once shipped.
- [ ] Hermetic e2e covers: bucket boundary table, clamp, partial shift, cell lookup, action dispatch, save/load round-trip, library exhaustiveness, three spot-check PDF entries, v4→v5 migrator.
- [ ] `npm run verify` is green; `npm run verify:agent` writes the updated report.

## Follow-ups (out of scope)

- **`alignmentDelta?: Partial<PhilosophicalAlignment>` on MapEvent / dialogue choice payloads.** Authoring content that actually shifts the new axes — including a sweep of `src/World/Continents/` map content to set first-pass deltas. This is content work, not engine work.
- **Alignment-gated skills / effects / endings.** Spec 10 Q8 picked "specific story flags" as the ending selector; alignment-gated *content* (e.g. only-Logic-Pessimistic skills) is a separate authoring decision.
- **Fallacies as spells / abilities.** The PDF's closing line: "could serve as 'spells' or abilities in your RPG system." Each cell carries three named fallacies; a future phase turns the named fallacies into skill / effect / status payloads.
- **`specs/14-philosophical-alignment.md` conversation-loop spec.** Only if the system grows enough to need question-and-answer authoring. Today the PDF + this brief are sufficient.
- **Unifying `moralMeter` with `philosophicalAlignment`.** Possible long-term move: re-skin `moralMeter` as a fourth "ethics" axis or absorb it into `scope` (Individual ↔ Relational). Decision deferred — `moralMeter`'s ±1..±5 authoring is already in place and works.
- **Enemies-by-alignment AI tuning.** The "enemies are embodiments of logical fallacies" tonal commitment in `bearings.md` becomes mechanically real once enemies carry a `philosophicalAlignment` field and AI skews behaviour by cell — also a separate phase.
