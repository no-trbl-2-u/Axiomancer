# Philosophy — 3-axis alignment cube (Phase 42)

> Source-of-truth content: `content/philosophy/PhilosAxiosDoc.pdf`.
> Engine module: `src/Philosophy/`. Reducer wiring: `src/Game/`.

The philosophical-alignment system encodes a character's position on
three orthogonal axes drawn from `content/philosophy/PhilosAxiosDoc.pdf`. Each axis is
an integer in `[-100, +100]`. The current `(low | mid | high)` bucket
triple indexes one of 27 cells in `philosophicalAlignmentLibrary`,
each carrying a representative philosopher, a literary character with
their source work, and three signature logical fallacies.

The system is **orthogonal** to `moralMeter` — see
[Relationship to `moralMeter`](#relationship-to-moralmeter) below.

## The three axes

| Axis | low | mid | high |
|---|---|---|---|
| `epistemology` | Faith | Agnostic | Logic |
| `outlook`      | Pessimistic | Neutral | Optimistic |
| `scope`        | Individual | Relational | Transcendent |

Polarity is chosen so the "more grounded in reason" / "more
hopeful" / "larger scope" ends land at the positive pole. The PDF
display order (Logic first, Optimistic first, Individual first) is
listing convention, not axis polarity — the engine uses the table
above.

## Bucketing

`bucketAxis(value: number): 'low' | 'mid' | 'high'`:

| Value range | Bucket |
|---|---|
| `value <= -34` | `'low'` |
| `-33 <= value <= 33` | `'mid'` |
| `value >= 34` | `'high'` |

Boundary values `±34` land in `'high'` / `'low'`; `±33` and below
(in absolute value) stay in `'mid'`. Three equal-width zones across
`[-100, +100]`.

Thresholds are exposed as `AXIS_HIGH_THRESHOLD` (`34`) and
`AXIS_LOW_THRESHOLD` (`-34`).

## Engine API

All exports are surfaced through `src/index.ts`:

- `bucketAxis(value: number): AxisBucket`
- `getAlignmentCell(alignment: PhilosophicalAlignment): PhilosophicalAlignmentCell`
  — buckets each axis and looks up the cell in the 27-cell registry.
  Throws if the resulting triple isn't in the library (invariant:
  the library is exhaustive — 27 entries cover every triple).
- `applyAlignmentDelta(current, delta): PhilosophicalAlignment` —
  pure shift; missing axes in `delta` pass through; each axis clamps
  to `[-100, +100]`.
- `defaultAlignment(): PhilosophicalAlignment` — `{0, 0, 0}` (the
  dead-centre Agnostic-Neutral-Relational / Buber cell).
- `philosophicalAlignmentLibrary: readonly PhilosophicalAlignmentCell[]`
  — frozen, length 27.

State + reducer:

- `GameState.philosophicalAlignment: PhilosophicalAlignment` (added
  in Phase 42; `GAME_STATE_VERSION` 4 → 5).
- `SHIFT_PHILOSOPHICAL_ALIGNMENT` action (`{ delta: Partial<PhilosophicalAlignment> }`).
- Store action `shiftPhilosophicalAlignment(delta)` mirrors
  `shiftMoralMeter(delta, gating?)`.

Save migration: `migrateV4toV5` defaults the field to `{0, 0, 0}` on
legacy saves (`src/Game/game.migrate.ts`).

## The 27 cells

PDF cell numbers in parens; ids are kebab-case
`<epistemology>-<outlook>-<scope>`.

| # | Cell | Philosopher | Literary character |
|---|---|---|---|
| 1 | `logic-optimistic-individual` | Friedrich Nietzsche (late period) | Prometheus — *Prometheus Unbound* |
| 2 | `logic-optimistic-relational` | Peter Singer | Dr. Rieux — *The Plague* |
| 3 | `logic-optimistic-transcendent` | Teilhard de Chardin | Elwin Ransom — *Perelandra* |
| 4 | `logic-mid-individual` | Albert Camus | Meursault — *The Stranger* |
| 5 | `logic-mid-relational` | Simone de Beauvoir | Jane Eyre — *Jane Eyre* |
| 6 | `logic-mid-transcendent` | Baruch Spinoza | The Narrator — *The Library of Babel* |
| 7 | `logic-pessimistic-individual` | Arthur Schopenhauer | Underground Man — *Notes from Underground* |
| 8 | `logic-pessimistic-relational` | Thomas Ligotti | Rust Cohle — *True Detective* S1 |
| 9 | `logic-pessimistic-transcendent` | Gnostics / Hans Jonas | Severian — *Book of the New Sun* |
| 10 | `mid-optimistic-individual` | Richard Rorty | Huckleberry Finn — *Adventures of Huckleberry Finn* |
| 11 | `mid-optimistic-relational` | John Dewey | Atticus Finch — *To Kill a Mockingbird* |
| 12 | `mid-optimistic-transcendent` | William James | Pi Patel — *Life of Pi* |
| 13 | `mid-mid-individual` | Michel de Montaigne | Ishmael — *Moby-Dick* |
| 14 | `mid-mid-relational` | Martin Buber | Nick Carraway — *The Great Gatsby* |
| 15 | `mid-mid-transcendent` | Lao Tzu / Zhuangzi (Taoism) | Siddhartha — *Siddhartha* |
| 16 | `mid-pessimistic-individual` | Emil Cioran | Hamlet — *Hamlet* |
| 17 | `mid-pessimistic-relational` | Peter Wessel Zapffe | Captain Ahab — *Moby-Dick* |
| 18 | `mid-pessimistic-transcendent` | H.P. Lovecraft (cosmicism) | Burroughs — *A Short Stay in Hell* |
| 19 | `faith-optimistic-individual` | Søren Kierkegaard | Alyosha Karamazov — *The Brothers Karamazov* |
| 20 | `faith-optimistic-relational` | Desmond Tutu / Ubuntu theology | Jean Valjean — *Les Misérables* |
| 21 | `faith-optimistic-transcendent` | St. Augustine / Thomas Aquinas | Dante — *Divine Comedy* |
| 22 | `faith-mid-individual` | Blaise Pascal | Raskolnikov — *Crime and Punishment* |
| 23 | `faith-mid-relational` | Dorothy Day / Catholic Worker Movement | Father Damien (historical) |
| 24 | `faith-mid-transcendent` | St. John of the Cross / Mystical Theology | Father Rodrigues — *Silence* |
| 25 | `faith-pessimistic-individual` | Tertullian | Ivan Karamazov — *The Brothers Karamazov* |
| 26 | `faith-pessimistic-relational` | Philipp Mainländer | Father Ferreira — *Silence* |
| 27 | `faith-pessimistic-transcendent` | Marcion / Gnostic Christianity | The Grand Inquisitor — *The Brothers Karamazov* |

## Fallacies — content fuel for future content

Each cell carries three signature logical fallacies (name, example,
rationale). They ship as data but are not wired to gameplay yet.
Per the PDF's closing line ("This complete system gives you 27
distinct philosophical positions, each with a representative
philosopher, literary character, and three characteristic logical
fallacies that could serve as 'spells' or abilities in your RPG
system"), the fallacies are reserved as content fuel for a future
skill/effect/spell phase. See `plan/phases/phase_42_philosophical_alignment.md`
"Follow-ups" for the planned content arcs.

## Authoring deltas (Phase 43)

Content authors shift the alignment cube through two surfaces, both
accepting `alignmentDelta?: Partial<PhilosophicalAlignment>`. Each
axis clamps to `[-100, +100]` via `applyAlignmentDelta`; missing axes
in the partial pass through unchanged.

### `DialogueChoice.effect.alignmentDelta`

Lives next to `moralDelta` on the dialogue-choice effect block.
Applied by `applyDialogueChoice` and surfaced on
`ApplyDialogueChoiceResult.effects.philosophicalShift` (only the
axes that actually moved appear in the summary).

Example — Old Marrow's "Take only half — your need is greater than
mine." choice in `src/World/Continents/Coastal-Village/maps.ts`:

```ts
{
    text: "Take only half — your need is greater than mine.",
    effect: {
        grantCurrency: 12,
        moralDelta: 5,
        // Faith-Optimistic-Relational lean (Jean Valjean / Dorothy Day cells).
        alignmentDelta: { epistemology: -2, outlook: 3, scope: 3 },
    },
},
```

### `MapEventPoolEntry.alignmentDelta`

Lives on the pool-entry shape next to `weight`. Applied by
`resolveMapEvent` AFTER the matching handler runs and BEFORE the
consume / reveal step — the per-event delta (HP heal, item grant,
etc.) lands on the pre-shift state and the alignment shift applies
on top. Single field for all 8 payload kinds.

Example — the fv-9 unattended-campfire rest in
`src/World/MapEvents/content.ts`:

```ts
{
    kind: 'rest', weight: 1,
    payload: { kind: 'rest', healFraction: 1.0, description: '...' },
    // Peaceful rest at someone else's campfire: small optimistic +
    // relational pull.
    alignmentDelta: { outlook: 2, scope: 1 },
},
```

### Magnitude band

| Delta | Authoring use |
|---|---|
| `±1` | Incidental flavour (a small kindness, a brief flinch). |
| `±2..±3` | Routine choice with a clear philosophical lean. |
| `±4..±5` | Strong choice — defines the player's posture in this scene. |
| `±10` | Reserved for endgame "defining" choices. Do NOT use in early-act content. |

These match `moralMeter`'s authoring band by design — a content
author scoring a choice on both axes can use the same magnitudes
for moral + philosophical impact. A future calibration pass can
tune both bands together if the cube moves too fast in playtest.

### Phase 43 first-pass authoring

The Phase 43 content sweep landed 5 dialogue-choice deltas (Old
Marrow + Coastal Beggar trees) and 6 map-event pool-entry deltas
(Fishing Village fv-1 / fv-8 / fv-9 / fv-10 + Northern Forest
nf-4 / nf-10). Together they exercise every axis in both
directions across a starting-area playthrough.

## Authoring gates (Phase 46)

Phase 46 introduces `AlignmentGate` — a single-clause predicate that
locks dialogue choices and skill learning behind a position on the
alignment cube.

```ts
interface AlignmentGate {
    axis: 'epistemology' | 'outlook' | 'scope';
    op: 'gte' | 'lte';
    value: number;
}
```

The predicate sits on two existing requirement shapes:

- `DialogueChoice.requires.requiresAlignment?: AlignmentGate` —
  evaluated by `visibleChoices(node, ctx)`. When `ctx.alignment`
  doesn't satisfy the gate (or isn't provided), the choice is hidden.
  Mirrors the existing `requires.flag` semantic — a missing context
  field implicitly hides the gated content.

- `SkillLearningRequirement.requiresAlignment?: AlignmentGate` —
  evaluated by `meetsLearningRequirement(character, skill, alignment?)`.
  `getAvailableSkills` and `learnSkill` accept an optional `alignment`
  parameter and thread it through. The reducer's `LEARN_SKILL` action
  reads `state.philosophicalAlignment` automatically.

### Operator semantics

| Op | Means | Threshold alignment with bucketAxis |
|---|---|---|
| `gte` | "axis value ≥ `value`" | `value: 34` matches the `high` bucket boundary |
| `lte` | "axis value ≤ `value`" | `value: -34` matches the `low` bucket boundary |

Use `value: 34` for "high-bucket only" gates (`gte 34`) and
`value: -34` for "low-bucket only" gates (`lte -34`). Mid-bucket
gates (e.g. "must be in `outlook` mid") aren't supported as a
single clause today — author two separate gated choices with
`gte -33` and `lte 33` that share a `nextNodeId`. Promote to a
range form if real content authoring needs it.

### Phase 46 first-pass authoring

Authored gates (`src/Skills/skill.library.ts` +
`src/World/Continents/Coastal-Village/maps.ts`):

| Surface | Author | Gate | Rationale |
|---|---|---|---|
| Skill | `nirvana-fallacy` | `outlook lte -34` | Schopenhauer's metaphysics; only learnable by a pessimistic caster. |
| Skill | `appeal-to-fear` | `scope gte 34` | Lovecraftian indifference; only learnable by a transcendent-leaning caster. |
| Dialogue | Old Marrow `offer` "You speak like someone who already lost everything" | `outlook lte -34` | Two-broken-people recognition — gate accepts the quest with a different framing. |
| Dialogue | Coastal Beggar `greet` "Sit with them a while. Their grief is part of yours." | `scope gte 34` | Transcendent player hears the beggar as part of the larger weave. |

### Compound gates

Single-clause is the canonical shape. To express "Pessimistic AND
Transcendent" (e.g. Lovecraft cell), author two distinct gated
choices that share a `nextNodeId`:

```ts
choices: [
    { text: '...', nextNodeId: 'next',
      requires: { requiresAlignment: { axis: 'outlook', op: 'lte', value: -34 } } },
    // The second gate is checked only if the first matches — both
    // must hold for the choice to surface (visibleChoices ANDs all
    // requires clauses).
],
```

Better: when both clauses are on the SAME choice, the engine
currently supports one `requiresAlignment` per `requires` block.
Compound surfacing patterns (multiple gated branches with same
outcome) are the in-scope idiom; an `AlignmentGate[]` AND-of-array
form is a deferred follow-up if content authoring grows compound.

## Relationship to `moralMeter`

`philosophicalAlignment` is **orthogonal** to
[`moralMeter`](./morality.md), not a replacement. Spec 10 Q4 keeps
the meter narrative-only (a single compassion ↔ ruthlessness
integer), and the PDF's three axes don't collapse onto that
dimension. Both fields persist independently; both are surfaced on
the CLI Character tab; both are read by save / load.

A future phase may unify the two systems (e.g. reskin `moralMeter`
as a fourth "ethics" axis or absorb it into `scope`), but that's an
explicit follow-up — Phase 42 ships them side-by-side. The
authoring sweep that retro-wires alignment shifts into existing map
events / dialogue is also a separate follow-up.

## CLI surface

The Character tab (`npm run game` → Character) renders the active
cell on every visit:

```
Philosophical alignment:
  Cell:         Agnostic-Neutral-Relational
  Philosopher:  Martin Buber
  Character:    Nick Carraway — Fitzgerald's "The Great Gatsby"
  Epistemology: mid (0)
  Outlook:      mid (0)
  Scope:        mid (0)
```

The bucket label + raw integer pair lets the agent-graded harness
(`automation/agent-e2e.mjs`) extract numerics without parsing the
prose label.
