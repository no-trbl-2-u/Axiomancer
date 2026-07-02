# Phase 71 — Per-foe narrative prose for aftermath panels

> Closes GH#65 ask 1 (score 5.5). Mobile aftermath presenter
> (`state/presenters/aftermath.engine.ts`) currently picks from a
> 3-variant table keyed off damage tier. Chronicle voice belongs in
> engine content. This phase moves the prose onto per-foe typed
> fields so the engine becomes the canonical source.

## Outcome

Three library enemies — **MournfulGull**, **HollowEyedBeggar**, and
**CoastalTyrant** (the currently-authored befriendable trio) — each
carry three optional per-foe line sets (`finalBlowLines`,
`pactLines`, `causeLines`), every set holding three variants. The
mobile presenter (and any future UI surface) can read the line that
matches the outcome shape directly off the enemy, with the engine
playing pure data-store. Mobile's `derive*Phrase` helpers can drop
once the engine release lands; un-authored enemies fall back to
those helpers as before. A hermetic e2e at
`src/Enemy/e2e/aftermath-lines.engine.test.ts` pins the registration
shape + per-enemy content presence.

## Source spec / candidate

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 71 row — promoted
at oversight 2026-05-22 (fourteenth oversight; user-attended GH#65
triage). GH#65 ask 1 names the field shapes verbatim:
`finalBlowLines: { brutal, quiet, ironic }`,
`pactLines: { quiet, set-down, heavy }`,
`causeLines: { brutal, broken, quiet }`. Per D3 below, `set-down`
becomes `setDown` (TS-identifier convention; GH#65 source-text
hyphen converted at brief time).

No spec file — Phase 71 is per-foe content authoring, same shape as
Phase 60 / Phase 70. Acceptance traces through the brief's
Definition of Done, not a `specs/<NN>.md`.

## Implementation units

### Unit 1 — Type + barrel + fixture: `FinalBlowLines` / `PactLines` / `CauseLines`

**Files touched:**
- `src/Enemy/types.ts` — new `FinalBlowLines`, `PactLines`,
  `CauseLines` interfaces; three new optional fields on `Enemy`.
- `src/Enemy/index.ts` — re-export the three new types from the
  module barrel.
- `src/index.ts` — re-export the three new types from the top-level
  Enemy block (appended after `FriendshipReward` /
  `BefriendabilityConfig`).
- `scripts/public-surface.expected.json` — regenerate via
  `node scripts/snapshot-public-surface.mjs --write` (+3 type
  exports; runtime exports unchanged).

**Type sketch:**

```typescript
// src/Enemy/types.ts

/**
 * Phase 71 — chronicle-voice prose for the victory final-blow
 * aftermath panel. Three variants; consumer (mobile presenter,
 * CLI, etc.) picks which to render based on the outcome shape
 * (typically damage-tier: brutal = overkill burst, quiet = exact
 * cap, ironic = self-inflicted / mirror-effect KO). Strings are
 * complete prose as authored; engine does no interpolation.
 */
export interface FinalBlowLines {
    brutal: string;
    quiet: string;
    ironic: string;
}

/**
 * Phase 71 — chronicle-voice prose for the friendship-pact
 * aftermath panel. Three variants matching how the parley landed
 * (quiet = mutual silence, setDown = enemy literally lays down arms,
 * heavy = recognition under weight). Only meaningful when the enemy
 * also carries a `friendshipReward`; un-befriendable enemies should
 * leave this undefined.
 *
 * Naming note: GH#65 source text used "set-down"; this field is
 * `setDown` (TS-identifier convention).
 */
export interface PactLines {
    quiet: string;
    setDown: string;
    heavy: string;
}

/**
 * Phase 71 — chronicle-voice prose for the defeat aftermath panel
 * ("cause of loss"). Three variants matching how the player went
 * down (brutal = enemy unloaded a burst, broken = attrition over
 * many rounds, quiet = exact-cap or single-tick KO).
 */
export interface CauseLines {
    brutal: string;
    broken: string;
    quiet: string;
}

export interface Enemy {
    // ... existing fields ...

    /** Phase 71 — per-foe victory final-blow chronicle. See
     *  {@link FinalBlowLines}. Optional; undefined falls through to
     *  consumer-side defaults. */
    finalBlowLines?: FinalBlowLines;

    /** Phase 71 — per-foe friendship-pact chronicle. See
     *  {@link PactLines}. Optional; only meaningful when the enemy
     *  also carries a `friendshipReward`. */
    pactLines?: PactLines;

    /** Phase 71 — per-foe defeat / cause-of-loss chronicle. See
     *  {@link CauseLines}. Optional; undefined falls through to
     *  consumer-side defaults. */
    causeLines?: CauseLines;
}
```

**No engine logic change.** Pure data fields; no resolver / reducer
touches. `createEnemy` already forwards arbitrary `Enemy`-shape
fields; the three new optional fields require zero
`createEnemy.ts`-equivalent updates (the field is added on the
`Enemy` type directly and `createEnemy` accepts the full shape).

**Hermetic coverage in this unit:** none — all test work lands in
Unit 3 (the brief's content + tests + docs split mirrors Phase 60).
Unit 1 ships type-only.

### Unit 2 — Content: author lines on the befriendable trio

**Files touched:**
- `src/Enemy/enemy.library.ts` — append `finalBlowLines` +
  `pactLines` + `causeLines` blocks to MournfulGull (line 162),
  HollowEyedBeggar (line 210), CoastalTyrant (line 326).

**Voice / tone constraints per enemy:**
- **MournfulGull** — heart-aspected, wistful, "every slight it
  remembers" (line 165 description). 2nd-person observer narration.
  Light, lyrical, restrained metaphor. Short sentences.
- **HollowEyedBeggar** — faith-pessimistic-relational, "they want
  what you carry, not what you are" (line 213). Sparse, gnomic.
  Often a single sentence per line, sometimes with implied direct
  speech.
- **CoastalTyrant** — magistrate-fallen-priest, "a king whose
  subjects are all gulls and grievances" (line 330). Formal,
  weighty, longer sentences. Echoes the existing 4-paragraph
  `friendshipReward.narrative` (lines 378-389).

**MournfulGull content:**

```typescript
finalBlowLines: {
    brutal: 'The gull falls mid-cry. The list of slights ends on a half-syllable.',
    quiet: 'It folds its wings and lands once, gently, before it stops.',
    ironic: 'A slight it had not catalogued yet, delivered by the listener.',
},
pactLines: {
    quiet: 'For a long moment, neither of you speaks the slights you remember.',
    setDown: 'It settles on the rail beside you. The catalogue, for now, is closed.',
    heavy: 'The list goes on inside it. You are listed too. It lands anyway.',
},
causeLines: {
    brutal: 'The list resolves in your name. You go down to the next item on it.',
    broken: 'The slights accumulate. Eventually you are one of them.',
    quiet: 'It catalogues a last grievance and you do not stand up from it.',
},
```

**HollowEyedBeggar content:**

```typescript
finalBlowLines: {
    brutal: 'You leave them with nothing more to carry.',
    quiet: 'They do not flinch. The rags settle as if they had been waiting.',
    ironic: 'They take what you are. It costs you what you carried.',
},
pactLines: {
    quiet: 'They stop reaching. The cloth in their hand is for you now.',
    setDown: 'They lay the phials on the stones between you, slowly, as if returning them.',
    heavy: '"I was carrying these for someone." A pause. "But you stopped. So."',
},
causeLines: {
    brutal: 'They wanted what you carried. They take it from where you fall.',
    broken: 'You carry less and less. Eventually you carry nothing, including yourself.',
    quiet: 'They wait until you have set everything down before they kneel beside you.',
},
```

**CoastalTyrant content:**

```typescript
finalBlowLines: {
    brutal: 'The magistrate falls in full regalia. The blade lands beside him, still cold.',
    quiet: 'He lowers the sword before the strike. The strike still arrives.',
    ironic: 'A verdict pronounced on the magistrate, in the magistrate\'s own court.',
},
pactLines: {
    quiet: 'The sword stays low. The shoulders are wrong for striking — they have given up the weight.',
    setDown: 'He sets the circlet between you and steps back from it. The sentence on its inner band keeps ending and starting again.',
    heavy: '"I was the king of nothing. You have made me a man with nothing to be king of. That is closer to honest."',
},
causeLines: {
    brutal: 'The old blade was older than the village charter, and it remembers its work.',
    broken: 'You hold the line as long as a man can hold a line. The magistrate holds longer.',
    quiet: 'The verdict is read out in your name. There is no appeal from the bay.',
},
```

### Unit 3 — Hermetic e2e + docs + CHANGELOG

**Files touched:**
- `src/Enemy/e2e/aftermath-lines.engine.test.ts` — new file (3-4
  cases). Imports the three authored enemies + one un-authored
  control (TidepoolCrab) and pins:
  - **Case 1** — Registration: each of the 3 enemies carries all
    three line groups (`finalBlowLines`, `pactLines`, `causeLines`)
    with all three sub-keys (`brutal`/`quiet`/`ironic`,
    `quiet`/`setDown`/`heavy`, `brutal`/`broken`/`quiet`); each
    sub-key value is a non-empty string.
  - **Case 2** — Voice presence: spot-check one phrase per enemy
    per line group to pin the voice signature (e.g. MournfulGull's
    pactLines.quiet matches `/slights/`).
  - **Case 3** — Regression: TidepoolCrab (un-authored normal) has
    all three fields strictly `undefined`. Confirms the fields are
    additive-optional and the consumer fallback path stays
    intact.
- `docs/enemy.md` — new "Aftermath narrative (Phase 71)" subsection
  after the "Befriendable enemies" block. Names the three line-set
  types + the 3-variant convention + the 3-enemy initial-author
  coverage + the consumer-side selection guidance (engine doesn't
  pick; UI / presenter does, based on outcome shape).
- `docs/api.md` Enemy block — append the three new type rows
  alongside `FriendshipReward` / `BefriendabilityConfig`.
- `README.md` Enemy row (line 71) — extend with the Phase 71
  surface phrasing ("+ `finalBlowLines` / `pactLines` / `causeLines`
  per-foe chronicle prose — Phase 71").
- `plan/bearings.md` Enemy block — append `+ FinalBlowLines /
  PactLines / CauseLines (+ Enemy.{finalBlowLines, pactLines,
  causeLines}? — Phase 71)`.
- `CHANGELOG.md [unreleased] ### Added` — new bullet for Phase 71
  naming the three types + the 3-enemy initial author + the GH#65
  consumer-side rationale.

**Test sketch:**

```typescript
import { describe, it, expect } from 'vitest';
import {
    MournfulGull,
    HollowEyedBeggar,
    CoastalTyrant,
    TidepoolCrab,
} from '../enemy.library';

describe('Phase 71 — per-foe aftermath narrative lines', () => {
    const authored = [MournfulGull, HollowEyedBeggar, CoastalTyrant];

    it('all three authored befriendable enemies carry the full line-set shape', () => {
        for (const enemy of authored) {
            expect(enemy.finalBlowLines).toBeDefined();
            expect(enemy.finalBlowLines!.brutal).toMatch(/\S/);
            expect(enemy.finalBlowLines!.quiet).toMatch(/\S/);
            expect(enemy.finalBlowLines!.ironic).toMatch(/\S/);

            expect(enemy.pactLines).toBeDefined();
            expect(enemy.pactLines!.quiet).toMatch(/\S/);
            expect(enemy.pactLines!.setDown).toMatch(/\S/);
            expect(enemy.pactLines!.heavy).toMatch(/\S/);

            expect(enemy.causeLines).toBeDefined();
            expect(enemy.causeLines!.brutal).toMatch(/\S/);
            expect(enemy.causeLines!.broken).toMatch(/\S/);
            expect(enemy.causeLines!.quiet).toMatch(/\S/);
        }
    });

    it('voice signatures pin per enemy', () => {
        expect(MournfulGull.pactLines!.quiet).toMatch(/slights/);
        expect(HollowEyedBeggar.pactLines!.heavy).toMatch(/carrying these/);
        expect(CoastalTyrant.pactLines!.heavy).toMatch(/king of nothing/);
    });

    it('un-authored enemies (TidepoolCrab) have all three fields undefined', () => {
        expect(TidepoolCrab.finalBlowLines).toBeUndefined();
        expect(TidepoolCrab.pactLines).toBeUndefined();
        expect(TidepoolCrab.causeLines).toBeUndefined();
    });
});
```

## Decisions made upfront — DO NOT ASK

- **D1 — Three enemies, not all sixteen.** Same scope-tightening
  pattern as Phase 60 D2 ("2 enemies, not 3"). The three
  currently-authored befriendable enemies (MournfulGull +
  HollowEyedBeggar + CoastalTyrant) get full coverage; the
  remaining 13 enemies in `enemy.library.ts` are explicitly a
  follow-up content sweep. Mobile presenter's existing
  `derive*Phrase` helpers continue to fallback for un-authored
  enemies. Three is enough to establish the authoring pattern + the
  consumer integration shape; thirteen more is content-sprint
  scope, not pattern-setting.

- **D2 — All three line groups on all three authored enemies.**
  Even though `pactLines` is only logically meaningful for
  befriendable enemies, the three we're authoring ARE all
  befriendable, so all 27 line slots (3 × 3 × 3) get authored
  content. Un-authored enemies leave all three fields undefined.

- **D3 — Sub-key naming: `setDown` (camelCase), not `set-down`.**
  GH#65 source text used the hyphenated `set-down`; a hyphenated
  field name is not a valid TypeScript identifier without quoting.
  Brief converts to `setDown` per TS convention. The semantic stays
  the same: "the enemy literally lays its weapon down". Mobile
  callsite reads `pactLines.setDown` instead of `pactLines["set-down"]`.

- **D4 — Variants are pure data; engine does NO selection.** The
  three variants per line group exist as parallel slots. Consumer
  (mobile presenter, CLI, hypothetical future UI) picks which
  variant to render based on outcome shape (damage tier for
  final-blow / cause, parley posture for pact). Engine never
  branches on which variant to pick; the field is a static lookup
  table. This keeps the engine's responsibility surface minimal +
  lets each consumer pick its own selection heuristic.

- **D5 — No template interpolation.** Lines are complete prose as
  authored. No `{{enemy.name}}` / `{{player.name}}` substitution
  pattern. Mobile renders strings verbatim. Keeps the data layer
  simple + makes the lines portable across consumers without
  template-engine compatibility concerns.

- **D6 — Three new type exports; runtime exports unchanged.**
  `FinalBlowLines`, `PactLines`, `CauseLines` add to the top-level
  Enemy block. Fixture bump 162 → 165 types (per Phase 69's
  current 162-type baseline; Phase 70 was content-only and didn't
  shift fixture); runtime exports stay at 233.

- **D7 — Hermetic e2e file lives at `src/Enemy/e2e/`, not `src/Game/e2e/`.**
  The test is about Enemy data registration + content presence, not
  combat-resolver behaviour. Sibling pattern:
  `src/Enemy/e2e/befriendability-config.engine.test.ts` (Phase 68)
  has the same shape — Enemy-side data pin, not a Game-store drive.

- **D8 — No fallback-string author-time helper on the engine
  side.** Mobile presenter owns the fallback path entirely. The
  engine surfaces optional data; consumers handle absence. Pushing
  fallback prose into the engine would force the engine to ship
  generic chronicle voice for every enemy (which is the exact
  problem GH#65 wants to fix). The mobile `derive*Phrase` helpers
  stay in place as the fallback path; they only drop when an enemy
  becomes authored.

- **D9 — Three commits (Units 1 / 2 / 3) + one ship-row flip.**
  Unit 1 ships types + barrel + fixture (typecheck-only safe).
  Unit 2 ships content authoring (typecheck-only safe since types
  shipped in Unit 1). Unit 3 ships e2e + docs + CHANGELOG (all
  tests green). Ship-row flip is a 4th plan-only commit per the
  standard pattern.

- **D10 — Voice is per-enemy-archetype, not per-line-group-template.**
  Each enemy's nine lines share a unified voice signature (e.g.
  MournfulGull's "slights" / "list" / "catalogue" thread; the
  Beggar's "carrying" / "rags" / "phials" thread; the Tyrant's
  "magistrate" / "verdict" / "regalia" thread). Brief drafts all 27
  lines explicitly in Unit 2 so ship-time authoring just transcribes;
  on-the-fly voice generation at ship-time would be inconsistent.

- **D11 — Length matches archetype weight.** Normal-tier enemies
  (Gull + Beggar) get sentences-length lines, ~10-20 words each.
  Boss-tier CoastalTyrant gets longer compound sentences, ~20-30
  words each, matching the existing 4-paragraph
  `friendshipReward.narrative` weight. Sub-key variants stay
  proportional to each other within an enemy (don't author a
  one-clause `quiet` against a four-clause `brutal`).

- **D12 — `createEnemy` requires no signature change.** The factory
  already accepts the full `Enemy` shape; adding three optional
  fields to the type propagates without touching the factory. (Cross-
  checked: `src/Enemy/enemy.library.ts:23` imports `createEnemy from
  './index'`; the factory forwards the input shape.)

- **D13 — `docs/enemy.md` Aftermath subsection placement.** Append
  AFTER the Befriendable-enemies block (currently the last
  per-feature subsection). Sub-heading: "Aftermath narrative
  (Phase 71)". Cross-link to GH#65 isn't needed in docs (GH-link
  pollution); the CHANGELOG entry carries the GH#65 attribution.

## Verify gate

- `npm run type-check` — must pass; three additive optional fields
  + three new type exports, no breaking shape change.
- `npm test` — must pass; new e2e at
  `src/Enemy/e2e/aftermath-lines.engine.test.ts` adds 3 cases.
  Expected count: 680 + 3 = 683.
- `npm run build` — must pass; no build-graph change.
- `npm run deploy:check` — must pass; public-surface fixture
  regenerated in Unit 1 with `FinalBlowLines` + `PactLines` +
  `CauseLines` added (162 → 165 types).

## Commit body template (per unit)

### Unit 1 commit

```
feat(enemy): Phase 71 unit 1 — FinalBlowLines / PactLines / CauseLines types

- Add three new optional type interfaces on src/Enemy/types.ts:
  FinalBlowLines { brutal, quiet, ironic }, PactLines { quiet,
  setDown, heavy }, CauseLines { brutal, broken, quiet }.
- Extend Enemy with three new optional fields:
  finalBlowLines? / pactLines? / causeLines?.
- Re-export the three new types through src/Enemy/index.ts +
  src/index.ts Enemy block.
- Refresh scripts/public-surface.expected.json — 162 → 165 type
  exports (runtime unchanged at 233).

Decisions:
- D3 — GH#65 hyphenated `set-down` → TS-identifier `setDown`.
- D4 — pure data, engine does NO selection between variants.
- D6 — additive-optional; existing consumers unaffected.
- D12 — createEnemy needs no signature change (factory forwards
  the full Enemy shape).
```

### Unit 2 commit

```
feat(content): Phase 71 unit 2 — aftermath lines on the befriendable trio

- MournfulGull (line 162, src/Enemy/enemy.library.ts) — 9 lines in
  the heart-aspected wistful voice; "slights" / "list" / "catalogue"
  thread runs through final-blow + pact + cause variants.
- HollowEyedBeggar (line 210) — 9 lines in the
  faith-pessimistic-relational voice; "carrying" / "rags" / "phials"
  thread; reversal-of-begging carries into pact + cause variants.
- CoastalTyrant (line 326) — 9 lines in the
  magistrate-fallen-priest voice; "verdict" / "regalia" /
  "magistrate" thread; pact lines echo the existing
  4-paragraph friendshipReward.narrative voice.

Decisions:
- D1 — 3 enemies, not all 16; remaining 13 deferred to follow-up.
- D10 — voice is per-enemy-archetype; all 9 lines per enemy share
  a unified signature.
- D11 — line length matches archetype weight (normal-tier ~10-20
  words, boss-tier ~20-30 words).
```

### Unit 3 commit

```
test(enemy): Phase 71 unit 3 — hermetic e2e + docs + CHANGELOG

- src/Enemy/e2e/aftermath-lines.engine.test.ts — 3 cases:
  registration shape across the 3 authored enemies (all 9 sub-keys
  non-empty); voice-signature spot-checks; regression
  pinning TidepoolCrab leaves all three fields undefined.
- docs/enemy.md — "Aftermath narrative (Phase 71)" subsection
  after the Befriendable-enemies block; names the three line-set
  types + 3-variant convention + initial 3-enemy coverage +
  consumer-side selection guidance.
- docs/api.md Enemy block — append 3 new type rows alongside
  FriendshipReward / BefriendabilityConfig.
- README.md Enemy row — Phase 71 surface phrasing appended.
- plan/bearings.md Enemy block — Phase 71 surface line appended.
- CHANGELOG.md [unreleased] ### Added — Phase 71 bullet citing
  GH#65 ask 1 + the three types + the 3-enemy initial author.

Decisions:
- D7 — e2e lives at src/Enemy/e2e/, not Game/e2e (data pin, not
  combat-resolver drive). Mirrors Phase 68's
  befriendability-config.engine.test.ts.
- D8 — engine ships no fallback string; consumer (mobile
  presenter) owns the fallback path for un-authored enemies.
```

## Definition of Done

- [ ] `FinalBlowLines`, `PactLines`, `CauseLines` interfaces exist
      in `src/Enemy/types.ts`.
- [ ] `Enemy.finalBlowLines?`, `Enemy.pactLines?`, `Enemy.causeLines?`
      added (additive-optional).
- [ ] Three new types re-exported through `src/Enemy/index.ts` +
      `src/index.ts` Enemy block.
- [ ] `scripts/public-surface.expected.json` regenerated — type
      count 162 → 165 (runtime unchanged at 233).
- [ ] MournfulGull, HollowEyedBeggar, CoastalTyrant each carry
      authored `finalBlowLines` + `pactLines` + `causeLines` blocks
      per Unit 2 voice.
- [ ] `src/Enemy/e2e/aftermath-lines.engine.test.ts` ships with 3
      hermetic cases.
- [ ] `docs/enemy.md` "Aftermath narrative (Phase 71)" subsection.
- [ ] `docs/api.md` Enemy block extended with 3 new type rows.
- [ ] `README.md` Enemy row extended.
- [ ] `plan/bearings.md` Enemy block extended.
- [ ] `CHANGELOG.md [unreleased] ### Added` bullet.
- [ ] `npm run verify` is green (683/683 tests expected).
- [ ] `npm run deploy:check` is green.
- [ ] `plan/steps/01_build_plan.md` Phase 71 row flips `[ ]` →
      `[x]` with commit hashes per unit.

## Follow-ups (out of scope)

- **Author lines on the remaining 13 enemies in `enemy.library.ts`.**
  TidepoolCrab / SeaMistWisp / LullabyMoth / Disatree_01 / WetHound
  / ForestSprite / ArgumentativeCrow / TideflukeReaver / HushWraith
  / HollowSaint / TheDisagreement / EchoOfPyrrhonia / Sandbag_01.
  Best paired with a future content sweep that also adds
  `friendshipReward` to whichever subset becomes the next
  befriend-tier batch (so `pactLines` only authors on enemies that
  actually carry a friendship arc).
- **Voice-consistency lint.** A future tooling phase could add a
  `scripts/check-aftermath-voice.mjs` that flags enemies where the
  9-line voice signature drifts (e.g. a normal-tier enemy with
  boss-tier verbose lines, or a `pactLines.heavy` shorter than its
  `pactLines.quiet`). Out of scope here.
- **Damage-tier selection helper on the engine side.** If multiple
  consumers (CLI + mobile + future surfaces) end up implementing
  similar variant-selection logic, the engine could ship a
  `pickAftermathVariant(report, enemy): string | undefined` helper.
  D4 keeps the engine selection-free for now; D8 keeps fallback on
  the consumer. Helper is a fast follow if multiple consumers
  converge.
- **`pactLines` validation against `friendshipReward`.** A linter
  could enforce that `pactLines` only ships on enemies that also
  carry `friendshipReward`. Today both stay strictly optional and
  the brief's content authoring keeps them aligned manually.
- **Mobile presenter `derive*Phrase` cleanup.** Post-engine-release
  drop the mobile fallback helpers in
  `state/presenters/aftermath.engine.ts`; mobile reads engine
  fields directly. Mobile-repo concern, not engine.

## Canonical sibling

`plan/phases/phase_60_befriendable_enemy_content.md` is the
closest-shape ancestor: per-enemy optional content field, three
implementation units (type + content + e2e/docs), `Enemy`-type
additive-optional extension, fixture refresh. Phase 70's
`enemy.library.ts` content commit (`1a4f6e4`) is the most recent
sibling for the per-foe authoring style (CoastalTyrant's
multi-paragraph narrative voice + the in-file comments naming the
archetype + the Phase attribution).

`src/Enemy/e2e/befriendability-config.engine.test.ts` (shipped at
Phase 68) is the canonical sibling for the Unit 3 hermetic e2e file
shape — Enemy-side data pin, not a Game-store drive (D7).
