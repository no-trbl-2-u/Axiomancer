# Phase 43 — Alignment-shifting authoring sweep on MapEvent + dialogue content

> Phase 42 follow-up #1. Phase 42 shipped the 3-axis
> `philosophicalAlignment` engine + 27-cell library + the
> `SHIFT_PHILOSOPHICAL_ALIGNMENT` action, but the cube is
> unobservable in play because no authored content moves it. This
> phase wires `alignmentDelta?: Partial<PhilosophicalAlignment>`
> into the dialogue and map-event payload shapes, threads it through
> the existing resolvers (mirrors the `moralDelta` path), and
> authors first-pass deltas across the shipped Coastal-Village +
> Old Marrow content so the CLI Character tab's alignment cell
> actually moves when the player makes a choice.

## Outcome

- `DialogueChoice.effect.alignmentDelta?: Partial<PhilosophicalAlignment>`
  exists on the dialogue surface and is applied through
  `applyDialogueChoice` with per-axis clamping to `[-100, +100]`.
  Effects-summary block gains a `philosophicalShift?` field next
  to the existing `moralShift?`.
- `MapEventPoolEntry.alignmentDelta?: Partial<PhilosophicalAlignment>`
  exists on the pool-entry shape and is applied unconditionally
  by `resolveMapEvent` after the matching handler runs but before
  consumption / reveal, so any pool entry can carry a thematic
  philosophical pull.
- First-pass authoring lands deltas across:
  - Old Marrow dialogue (Fishing Village dialogue tree authored in
    `src/World/Continents/Coastal-Village/maps.ts`) — at least
    three choices gain alignment deltas alongside their existing
    moralDelta authoring.
  - Coastal-Village map events — at least three pool entries
    (rest, gathering, cutscene) gain alignment deltas authored to
    push the player toward distinct cells.
- Hermetic e2e at `src/Philosophy/e2e/alignment-authoring.engine.test.ts`
  drives one dialogue choice + one map-event resolution and asserts
  the cell label changes (e.g. neutral → Faith-Optimistic-Relational
  after a "kindness" choice).
- `docs/philosophy.md` gains an "Authoring deltas" subsection
  documenting the two surfaces, the magnitude band, and the
  effects-summary field name.

## Source spec

- Build-plan row Phase 43 (`plan/steps/01_build_plan.md:65`).
- Promoted via `/oversight` 2026-05-16 (single oversight commit
  `6966461`) as the top-scoring Phase 42 follow-up.
- `plan/PHASE_CANDIDATES.md` Promoted block — Phase 43 entry
  carries the full scope rationale.
- `plan/phases/phase_42_philosophical_alignment.md` Follow-ups #1.
- Mirrors the `moralDelta` pattern shipped pre-loop in
  `src/NPCs/types.d.ts:61` + `src/World/dialogue.runtime.ts:102`.

## Implementation units

### Unit 1 — `alignmentDelta` payload + resolver thread

**Files (edited):**
- `src/NPCs/types.d.ts` — add `alignmentDelta?` on `DialogueChoice.effect`.
- `src/World/MapEvents/types.ts` — add `alignmentDelta?` on
  `MapEventPoolEntry`.
- `src/World/dialogue.runtime.ts` — apply the dialogue delta + extend
  the effects summary with `philosophicalShift`.
- `src/World/MapEvents/resolve-map-event.ts` — apply the pool-entry
  delta after `applyPayload` returns and before the consume / reveal
  step.

**Types (mirror `moralDelta` shape):**

```ts
// src/NPCs/types.d.ts — DialogueChoice.effect:
alignmentDelta?: Partial<PhilosophicalAlignment>;

// src/World/MapEvents/types.ts — MapEventPoolEntry:
alignmentDelta?: Partial<PhilosophicalAlignment>;
```

**Effects-summary extension (`ApplyDialogueChoiceResult.effects`):**

```ts
philosophicalShift?: Partial<PhilosophicalAlignment>;
```

Populated when at least one axis in the delta is non-zero; missing
otherwise (matches the `moralShift?` convention).

**Dialogue runtime (`dialogue.runtime.ts`):**

After the existing `moralDelta` block, add:

```ts
if (e.alignmentDelta) {
    philosophicalAlignment = applyAlignmentDelta(philosophicalAlignment, e.alignmentDelta);
    const shifted: Partial<PhilosophicalAlignment> = {};
    for (const axis of ['epistemology', 'outlook', 'scope'] as const) {
        const v = e.alignmentDelta[axis];
        if (typeof v === 'number' && v !== 0) shifted[axis] = v;
    }
    if (Object.keys(shifted).length > 0) effects.philosophicalShift = shifted;
}
```

`philosophicalAlignment` is destructured from `gameState` alongside
`moralMeter`. The returned `gameState` carries the updated value
under `philosophicalAlignment`.

**Map-event resolver (`resolve-map-event.ts`):**

After `const result = applyPayload(stateAfterReach, entry.payload, rng);`
and before the reveal / consume step:

```ts
let stateWithAlignment = result.state;
if (entry.alignmentDelta) {
    stateWithAlignment = {
        ...result.state,
        philosophicalAlignment: applyAlignmentDelta(
            result.state.philosophicalAlignment,
            entry.alignmentDelta,
        ),
    };
}
```

Carry `stateWithAlignment` forward into the consume + reveal step.

**Tests (Unit 1):**

Two hermetic cases land at `src/Philosophy/e2e/alignment-authoring.engine.test.ts`:

1. Dialogue path — drive `applyDialogueChoice` with a choice carrying
   `alignmentDelta: { outlook: 10 }`; assert `nextState.philosophicalAlignment.outlook === 10`
   and `result.effects.philosophicalShift === { outlook: 10 }`.
2. Map-event path — set up a synthetic pool entry with
   `alignmentDelta: { epistemology: -5, scope: 8 }`; drive
   `resolveMapEvent`; assert the alignment state shifted on both axes
   and the cell-resolution lands at the expected triple.

Plus one negative-path case: a dialogue choice with no
`alignmentDelta` leaves `result.effects.philosophicalShift`
undefined and `gameState.philosophicalAlignment` unchanged.

Commit: `feat(world): Phase 43 unit 1 — alignmentDelta on dialogue + map-event payloads`.

### Unit 2 — Content authoring (Coastal-Village + Old Marrow)

**Files (edited):**
- `src/World/Continents/Coastal-Village/maps.ts` — add
  `alignmentDelta` on at least 6 authored sites total (3 dialogue
  choices, 3 map-event pool entries).

**Authoring guidelines:**

Calibrate magnitudes to the same `±1..±5` band `moralMeter` uses.
Defining `±10` choices reserved for endgame. Each delta should
nudge the cube in a single thematically-coherent direction; avoid
spraying all three axes at once unless the choice is genuinely
defining.

**Dialogue choices to author (Old Marrow, at fv-3):**

The Old Marrow dialogue currently carries five moralDelta-bearing
choices (`maps.ts:58, 80, 86, 140, 145, 150, 155, 160`). Pick three
where the philosophical lean is unambiguous and add `alignmentDelta`
alongside the existing `moralDelta`:

- "Kind offering" (`:58`) — `{ outlook: +2, scope: +2 }` (more
  optimistic, more relational; matches the kindness moralDelta `+2`).
- "Harsh threat" (`:86`) — `{ epistemology: -2, outlook: -3, scope: -2 }`
  (pulls toward Faith-Pessimistic-Individual / Ivan-Karamazov-style
  rebellion; pairs with `moralDelta: -4` and `setFlag: 'marrow_pressed'`).
- "Faithful service" (`:140` or `:150`) — `{ epistemology: -3, outlook: +3 }`
  (Faith-Optimistic; aligns with the Jean-Valjean / Dorothy Day
  cells in the registry).

**Map-event pool entries to author (Fishing Village):**

The Fishing Village authored pool entries today carry no
philosophical pull. Add deltas to three of them:

- A `rest` entry — `{ outlook: +1 }` (peaceful rest leans optimistic).
- A `gathering` entry that grants the player tide-pool foraged items —
  `{ scope: -1 }` (self-sufficiency leans individual).
- A `cutscene` or `hazard` thematic beat — `{ scope: +2 }` (a
  storm-front cutscene that reminds the player of cosmic
  indifference leans transcendent).

Concrete entry targets are picked at implementation time from the
existing pool authoring in `maps.ts`; no new entries are created.

**Tests (Unit 2):**

Tightening on the existing Coastal-Village content-drift test in
`src/World/MapEvents/e2e/content.engine.test.ts` (if one exists),
or one new case at the same location: assert that the authored
`alignmentDelta` fields exist on the named entries and carry the
expected `±` direction (positive vs negative) on the named axis.
The test does NOT assert exact magnitudes — those are authoring
balance and can drift; the test pins the direction so a future
content sweep doesn't accidentally flip a sign.

Commit: `feat(world): Phase 43 unit 2 — alignment deltas on Coastal-Village + Old Marrow content`.

### Unit 3 — Hermetic e2e (full path) + docs + plan tick

**Files (edited / new):**
- `src/Philosophy/e2e/alignment-authoring.engine.test.ts` — extend
  with a full-path case that drives a `gameReducer({ type: 'APPLY_DIALOGUE', ... })`
  with the authored Old Marrow tree and asserts the
  `philosophicalAlignment` field shifted on `GameState` (not just
  the dialogue runtime's return). Same idea for the map-event
  path via the store's dispatch surface.
- `docs/philosophy.md` — append an "Authoring deltas" subsection
  documenting:
  - The two surfaces (`DialogueChoice.effect.alignmentDelta` +
    `MapEventPoolEntry.alignmentDelta`).
  - The `±1..±5` authoring band + reserved `±10` defining choices.
  - The `philosophicalShift?` effects-summary field name.
  - A two-line example for each surface drawn from the Phase 43
    authoring.
- `plan/steps/01_build_plan.md` — flip Phase 43 `[ ]` → `[x]` with
  the three commit hashes and a per-unit summary.

**Plan tick + commit:**

Commit: `feat(world): Phase 43 unit 3 — hermetic e2e + docs + plan tick`.

## Decisions made upfront — DO NOT ASK

- **Per-pool-entry, not per-payload.** `alignmentDelta` lives on
  `MapEventPoolEntry`, not on each of the 8 payload types
  (`EncounterPayload`, `InteractionPayload`, etc.). Per-entry
  concentrates the authoring surface to one place, mirrors the
  `weight` field's per-entry placement, and avoids the scatter of
  the same optional field across eight discriminated-union branches.
  Future per-payload nuance is a follow-up if anyone ever needs
  e.g. "shop choice within a village shifts alignment differently
  than the village arrival event."
- **Applied AFTER the handler, BEFORE consume / reveal.** Mirrors
  the moralDelta path inside `applyDialogueChoice`. The handler
  computes its event delta (HP heal, item grant, etc.) on the
  pre-shift state; the alignment delta then applies on top. Pure;
  order doesn't matter for the engine, but matters for narrative
  framing ("you rested AND were inclined toward optimism" reads
  better than "your optimism made the rest happen").
- **`philosophicalShift?: Partial<PhilosophicalAlignment>` in the
  effects-summary**, not three separate fields like
  `epistemologyShift?` / `outlookShift?` / `scopeShift?`. The
  `Partial<...>` shape is already in the engine vocabulary; a single
  field is simpler for consumers.
- **No new state field, no migration.** The alignment field
  already exists on `GameState` since Phase 42 (`bdfda00`). This
  phase only adds authoring surfaces + threading. `GAME_STATE_VERSION`
  stays at 5.
- **No SHIFT_PHILOSOPHICAL_ALIGNMENT action is dispatched.** The
  runtime applies the delta inline because `applyDialogueChoice`
  is a pure helper called by `gameReducer`, not a dispatcher
  itself. Mirrors the existing moralDelta path. The
  `SHIFT_PHILOSOPHICAL_ALIGNMENT` store action stays as the
  programmatic entry point for non-content shifts.
- **Authoring band stays at ±1..±5.** Same as `moralMeter`. The
  PDF doesn't prescribe magnitudes; staying inside the existing
  moralMeter authoring vocabulary keeps content authoring
  consistent and lets future calibration adjust both axes at once
  if needed.
- **No content-drift constants test.** The exact magnitudes per
  authored choice are deliberately fluid (authoring balance work);
  the content test pins direction (sign) per axis, not the
  numeric magnitude.
- **Dialogue runtime imports from `Philosophy` are fine.** Phase 42
  added `applyAlignmentDelta` to the public barrel; `dialogue.runtime.ts`
  consumes it via the `Philosophy/` module barrel like any other
  cross-module helper. No circular-import risk — `Philosophy/`
  knows nothing about World/NPCs.
- **`alignmentDelta` on `MapEventPoolEntry`, not on `MapEventPool` or
  `MapDefinition`.** Per-entry is the finest granularity available
  in the existing pool authoring shape; pool-level deltas would
  fire on every roll which is too blunt.

## Verify gate

`npm run type-check && npm run lint && npm test && npm run build`.
Then `npm run deploy:check`.

## Commit body template (final commit / Unit 3)

```
feat(world): Phase 43 — alignment-shifting authoring sweep

Wires `alignmentDelta?: Partial<PhilosophicalAlignment>` into the
dialogue + map-event authoring surfaces and authors first-pass deltas
across the Coastal-Village + Old Marrow content. The Phase 42 alignment
cube now moves in actual play.

- DialogueChoice.effect.alignmentDelta + MapEventPoolEntry.alignmentDelta
- applyDialogueChoice + resolveMapEvent apply the deltas via
  applyAlignmentDelta (clamps to [-100, +100] per axis)
- ApplyDialogueChoiceResult.effects.philosophicalShift mirrors moralShift
- 3 Old Marrow dialogue choices + 3 Fishing Village pool entries
  authored with ±1..±5 deltas
- Hermetic e2e drives both surfaces end-to-end and asserts cell
  transitions
- docs/philosophy.md "Authoring deltas" subsection

Refs: plan/phases/phase_43_alignment_authoring_sweep.md, Phase 42 (bdfda00)
```

## Definition of Done

- [ ] `DialogueChoice.effect.alignmentDelta?: Partial<PhilosophicalAlignment>` exists in `src/NPCs/types.d.ts`.
- [ ] `MapEventPoolEntry.alignmentDelta?: Partial<PhilosophicalAlignment>` exists in `src/World/MapEvents/types.ts`.
- [ ] `applyDialogueChoice` applies the dialogue delta + populates `effects.philosophicalShift`.
- [ ] `resolveMapEvent` applies the pool-entry delta after `applyPayload` returns.
- [ ] At least 3 Old Marrow dialogue choices + 3 Fishing Village pool entries authored with non-trivial `alignmentDelta` fields.
- [ ] `src/Philosophy/e2e/alignment-authoring.engine.test.ts` covers dialogue + map-event + null-delta paths; minimum 3 hermetic cases.
- [ ] `docs/philosophy.md` "Authoring deltas" subsection lists both surfaces, the magnitude band, the effects-summary field, and one example per surface.
- [ ] Phase 43 row in `plan/steps/01_build_plan.md` flipped to `[x]` with all three commit hashes.
- [ ] `npm run verify` + `npm run deploy:check` green.

## Follow-ups (out of scope)

- **Per-payload `alignmentDelta` granularity.** Today the field lives on `MapEventPoolEntry`; if a payload subtype ever needs richer per-branch authoring (e.g. a `village` shop choice shifting alignment differently than the arrival cutscene), promote the field down to the payload. Authoring follow-up; no immediate consumer.
- **`SHIFT_PHILOSOPHICAL_ALIGNMENT` action emission for dialogue / map-event sites.** Today the runtime applies the delta inline (mirrors moralDelta). A future phase could emit an explicit action for replay determinism / event-log richness if the agent-graded harness wants to grade alignment shifts as discrete log entries.
- **Authoring-balance pass after first playtest.** The magnitudes chosen in this phase (±1..±5) are first-pass calibration; the actual feel of "how fast does the cube move" needs a playtest to tune.
- **Alignment-gated dialogue choices.** `DialogueChoice.requires` could gain `requiresAlignment?: { axis, op: 'gte'|'lte', value }` so cells unlock different choices. Phase 42 brief Follow-ups names this; not in scope here.
- **Fallacies-as-spells (Phase 44) and Enemies-by-alignment (Phase 45)** ride on top of this phase. Both are already promoted on the build plan.
