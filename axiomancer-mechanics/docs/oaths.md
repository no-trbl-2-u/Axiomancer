# The Oaths — 3-axis alignment cube (Phase 42; re-skinned Phase 44h)

> Engine module: `src/Ledger/` (né `src/Philosophy/`, renamed Phase 44h per
> spec 34 §6.2.2 — internal rename only, zero persisted-state risk).
> Reducer wiring: `src/Game/`. Content re-skin ruling: spec 34 §6.2
> ("THE UNSHACKLING", 2026-08-08) — the shape, thresholds, and persisted
> field/action/cell-id names are all unchanged; only display names and the
> 27-cell authored content moved from real-world philosophy to the Parish.

THE OATHS names a character's position on three orthogonal axes — three
things your conduct swears whether you mean to or not. Each axis is an
integer in `[-100, +100]`. The current `(low | mid | high)` bucket triple
indexes one of 27 cells in `philosophicalAlignmentLibrary`, each carrying a
**damned exemplar** (a Parish figure who held this position, and what it
cost them), a **cautionary tale** (a Parish folk story carrying the same
position), and three **besetting sins**.

The system is **orthogonal** to `moralMeter` / GRACE — see
[Relationship to GRACE](#relationship-to-grace-moralmeter) below.

## The three axes

| Axis (engine field, unchanged) | Display name | low | mid | high |
|---|---|---|---|---|
| `epistemology` | **CREED** | Faith | Doubt | Evidence |
| `outlook` | **AUGURY** | Dread | Endurance | Hope |
| `scope` | **TROTH** | Self | Kin | Saints |

Polarity is chosen so the "more grounded in evidence" / "more hopeful" /
"wider troth" ends land at the positive pole. Creed is what you take on
trust; Augury is the disposition you read as a prophecy about your own
days; Troth is the archaic word for whom your conduct is pledged to,
running from the self, through kin, to the dead saints the Parish still
bills you for.

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

All exports are surfaced through `src/index.ts`. Every identifier below is
**unchanged by the Phase 44h retheme** — only the 27-cell content and
display copy moved (spec 34 §6.2.2):

- `bucketAxis(value: number): AxisBucket`
- `getAlignmentCell(alignment: PhilosophicalAlignment): PhilosophicalAlignmentCell`
  — buckets each axis and looks up the cell in the 27-cell registry.
  Throws if the resulting triple isn't in the library (invariant:
  the library is exhaustive — 27 entries cover every triple).
- `applyAlignmentDelta(current, delta): PhilosophicalAlignment` —
  pure shift; missing axes in `delta` pass through; each axis clamps
  to `[-100, +100]`.
- `defaultAlignment(): PhilosophicalAlignment` — `{0, 0, 0}` (the
  dead-centre Agnostic-Neutral-Relational cell).
- `philosophicalAlignmentLibrary: readonly PhilosophicalAlignmentCell[]`
  — frozen, length 27.

State + reducer:

- `GameState.philosophicalAlignment: PhilosophicalAlignment` (added
  in Phase 42; `GAME_STATE_VERSION` 4 → 5). Field name frozen — persisted.
- `SHIFT_PHILOSOPHICAL_ALIGNMENT` action (`{ delta: Partial<PhilosophicalAlignment> }`).
  Action name frozen — persisted/migrator-visible.
- Store action `shiftPhilosophicalAlignment(delta)` mirrors
  `shiftMoralMeter(delta, gating?)`.

Save migration: the original `migrateV4toV5` step (defaulting the field
to `{0, 0, 0}`) has since been retired — the ladder in
`src/Game/game.migrate.ts` now starts at v11 and refuses older saves.

## The 27 cells

Ids are kebab-case `<epistemology>-<outlook>-<scope>`, frozen since
Phase 42 (spec 34 §6.2.2 — cell ids are lookup keys, not display copy).

| # | Cell | Damned exemplar | Cautionary tale |
|---|---|---|---|
| 1 | `logic-optimistic-individual` | the Bellringer of Thumbprick Hill | the Boy Who Would Not Kneel |
| 2 | `logic-optimistic-relational` | the Relief-Warden of Long Assize | the Widow Who Fed Two Parishes |
| 3 | `logic-optimistic-transcendent` | the Precentor of the Nine Wheels | the Cartographer of the Last Amen |
| 4 | `logic-mid-individual` | the Gravedigger of Hollow Assize | the Woman Who Buried Without Grief |
| 5 | `logic-mid-relational` | the Confessor of Two Ledgers | the Woman Who Judged by Face, Not by Writ |
| 6 | `logic-mid-transcendent` | the Recorder of the Unread Stacks | the Archivist Who Sought the Final Shelf |
| 7 | `logic-pessimistic-individual` | the Wound-Reader of Gallows Row | the Man Who Would Not Be Comforted |
| 8 | `logic-pessimistic-relational` | the Confessor Who Would Absolve No One | the Child Who Would Not Wake |
| 9 | `logic-pessimistic-transcendent` | the Sexton Who Renounced the Bell | the Prisoner Who Named His Own Warden |
| 10 | `mid-optimistic-individual` | the Tallyman of Rushlight | the Ragpicker's Boy |
| 11 | `mid-optimistic-relational` | the Reeve of Millbrook | the Reeve's Daughter |
| 12 | `mid-optimistic-transcendent` | the Confessor of Sable Reach | the Widow Who Chose to Believe |
| 13 | `mid-mid-individual` | the Gravedigger of Hollow Wick | the Doubting Sexton |
| 14 | `mid-mid-relational` | the Almoner of Fenmark | the Watcher at the Threshold |
| 15 | `mid-mid-transcendent` | the Hermit of the Long Marsh | the Beggar Who Stopped Asking |
| 16 | `mid-pessimistic-individual` | the Almoner of Ashpool | the Boy Who Wished Himself Unmade |
| 17 | `mid-pessimistic-relational` | the Whaler-Priest of Drownmere | the Harpooner Who Argued With the Deep |
| 18 | `mid-pessimistic-transcendent` | the Confessor of the Drowned Chapter | the Clerk Who Read Too Far |
| 19 | `faith-optimistic-individual` | the Novice of Thumbprick Chapel | The Barefoot Communicant |
| 20 | `faith-optimistic-relational` | the Almoner of Gallow's Fen | The Forgiven Poacher |
| 21 | `faith-optimistic-transcendent` | the Confessor-General of the high assize | The Pilgrim of Nine Terraces |
| 22 | `faith-mid-individual` | the Assizer's Clerk of Cold Fen | The Wagering Widow |
| 23 | `faith-mid-relational` | the Almoner of the Leper Yard | The Almoner Who Stayed |
| 24 | `faith-mid-transcendent` | the Confessor of the Drowned Choir | The Listening Confessor |
| 25 | `faith-pessimistic-individual` | the Hermit of the Gallows Road | The Boy Who Counted the Dead Children |
| 26 | `faith-pessimistic-relational` | the Sexton of the Drowned Parish | The Confessor Who Signed the Book |
| 27 | `faith-pessimistic-transcendent` | the Anchorite of the Salt Crypt | The Assessor Who Judged the Almoner |

## Besetting sins — content fuel for future content

Each cell carries three besetting sins (name, example, rationale). They
ship as data but are not wired to gameplay yet — the same "content fuel"
status the original fallacy content held (see `plan/phases/phase_42_philosophical_alignment.md`
"Follow-ups"). Two Tier-3 skills and their linked status effects that once
sourced from this content (`nirvana-fallacy`, `appeal-to-fear`, and their
`sourcedFromCell`-linked effects) no longer exist in the codebase — the
Profane Canon rework (`84ef85b`) removed the spec-32 card library they
belonged to. A future content phase re-authoring skills/effects against
this library starts from zero, not from those names.

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
        // Faith-Optimistic-Relational lean.
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
    payload: { kind: 'rest', shelter: 'camp', description: '...' },
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
locks dialogue choices and card learning behind a position on the
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
  evaluated by `meetsLearningRequirement(character, card, alignment?)`.
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

Authored gates still live (`src/World/Continents/Coastal-Village/maps.ts`):

| Surface | Author | Gate | Rationale |
|---|---|---|---|
| Dialogue | Old Marrow `offer` "You speak like someone who already lost everything" | `outlook lte -34` | Two-broken-people recognition — gate accepts the quest with a different framing. |
| Dialogue | Coastal Beggar `greet` "Sit with them a while. Their grief is part of yours." | `scope gte 34` | Transcendent player hears the beggar as part of the larger weave. |

The Phase 46 row's two card-side gates (`nirvana-fallacy`, `appeal-to-fear`)
no longer exist — the Profane Canon rework (`84ef85b`) deleted the
spec-32 card library they belonged to. `AlignmentGate` still supports a
card-side gate; a future content phase would re-author one from scratch.

### Compound gates

Single-clause is the canonical shape. To express "Pessimistic AND
Transcendent", author two distinct gated choices that share a
`nextNodeId`:

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

## Relationship to GRACE (`moralMeter`)

`philosophicalAlignment` (THE OATHS) is **orthogonal** to
[`moralMeter`](./morality.md) (GRACE), not a replacement. Spec 10 Q4 keeps
the meter narrative-only (a single compassion ↔ cruelty integer), and the
cube's three axes don't collapse onto that dimension. Both fields persist
independently; both are surfaced on the CLI Character tab; both are read
by save / load. A soul in Dread can still be In Grace.

## CLI surface

The Character tab (`npm run game` → Character) renders the active
cell on every visit:

```
Grace:    0

The Oaths:
  Cell:            Agnostic-Neutral-Relational
  Damned exemplar: the Almoner of Fenmark
  Cautionary tale: the Watcher at the Threshold — the version the sextons tell, not the one the choir sings, of a stranger who looked at a dying man and called it communion enough
  Creed:           mid (0)
  Augury:          mid (0)
  Troth:           mid (0)
```

The bucket label + raw integer pair lets the agent-graded harness
(`automation/agent-e2e.mjs`) extract numerics without parsing the
prose label.
