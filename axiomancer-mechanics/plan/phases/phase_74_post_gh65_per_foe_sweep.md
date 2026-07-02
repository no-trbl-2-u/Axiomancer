# Phase 74 — Post-GH#65 per-foe content sweep

> Closes the Phase 71 + Phase 73 follow-up. Authors `finalBlowLines`
> + `causeLines` on the 13 non-befriendable enemies. Pure content;
> no engine touch.

## Outcome

All 16 enemies in `src/Enemy/enemy.library.ts` carry per-foe
`finalBlowLines` + `causeLines` chronicle prose (`pactLines` only
authored on befriendable enemies — see D2). Mobile aftermath panel
renders engine-authored chronicle prose for every encounter; no
presenter-derived fallback for the player-visible majority of
fights. Hermetic e2e at `src/Enemy/e2e/aftermath-lines.engine.test.ts`
extended with registration assertions for the newly-authored
enemies; `docs/enemy.md` Aftermath narrative section extended;
`CHANGELOG.md [unreleased] ### Added` entry.

## Source spec / candidate

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 74 row —
promoted at oversight-16 2026-05-23 (commit `c0a273e`). Phases 71
+ 73 each shipped content on only the 3 currently-befriendable
enemies (D1/D9 scope-tightening); the remaining 13 enemies were
explicitly named as a follow-up content sweep.

## Implementation units

### Unit 1 — Content: `finalBlowLines` + `causeLines` on 12 enemies

**Files touched:**
- `src/Enemy/enemy.library.ts` — append `finalBlowLines` +
  `causeLines` blocks to each of the 12 non-sandbox enemies:
  - **Tier simple** (3): TidepoolCrab, SeaMistWisp, LullabyMoth
  - **Tier normal** (4): Disatree_01, WetHound, ForestSprite,
    ArgumentativeCrow
  - **Tier elite** (3): TideflukeReaver, HushWraith, HollowSaint
  - **Tier boss** (2): TheDisagreement, EchoOfPyrrhonia

Sandbag_01 intentionally skipped per D1 — it's a test sandbox
with no narrative weight; authoring placeholder lines would
pollute the e2e fixtures more than it would help.

**6 strings per enemy × 12 enemies = 72 chronicle lines.** Voice
continues from each enemy's existing `description` + Phase 45
alignment pin + Phase 49 skill rotation where present. Variant
key conventions (Phase 71):
- `finalBlowLines.brutal` — overkill burst (damage ≥ 2× cap)
- `finalBlowLines.quiet` — exact-cap KO
- `finalBlowLines.ironic` — mirror / self-inflicted / misread
- `causeLines.brutal` — enemy unloaded a burst
- `causeLines.broken` — attrition over many rounds
- `causeLines.quiet` — single-tick / exact-cap KO

### Unit 2 — Hermetic e2e + docs + CHANGELOG

**Files touched:**
- `src/Enemy/e2e/aftermath-lines.engine.test.ts` — extend the
  registration-shape pin to all 12 newly-authored enemies (+15
  the existing 3 = 15 total authored). Drop the TidepoolCrab
  "un-authored regression" case since TidepoolCrab is now
  authored; replace with Sandbag_01 (the deliberately-skipped
  test sandbox) as the new un-authored regression.
- `docs/enemy.md` Aftermath narrative section — extend the
  "Initial author coverage (Phase 71)" paragraph to note the
  Phase 74 sweep (12 → 15 authored; Sandbag_01 remains unauthored
  as a test sandbox).
- `CHANGELOG.md [unreleased] ### Added` — new bullet citing the
  12 newly-authored enemies + the sweep's role closing the
  Phase 71 / 73 follow-up.

## Decisions made upfront — DO NOT ASK

- **D1 — Skip Sandbag_01.** It's a test sandbox with no narrative
  identity (`name: 'Sandbag_01'`); authoring placeholder lines
  would pollute the e2e fixtures. The Unit 2 e2e regression case
  uses Sandbag_01 as the new un-authored control (replacing
  TidepoolCrab which becomes authored).

- **D2 — No new befriendable enemies this phase.** The candidate
  text allowed optional Unit 2 promotion (1-2 newly-befriendable
  enemies with the full Phase 60/62/68/69/71/73 stack — TideflukeReaver
  / HushWraith / TheDisagreement / HollowSaint as plausibles), but
  this brief picks the narrower scope: **breadth before depth**.
  Adding even one new befriendable enemy expands scope by
  ~30 LOC of new content (friendshipReward + flagSet +
  befriendabilityConfig + alignmentDelta + pactLines +
  journalEntry) + ~5 new e2e cases. Better to ship the 72-line
  baseline sweep cleanly, then file a separate "Befriendable-enemy
  Tier-2 expansion" candidate for the next oversight.

- **D3 — `pactLines` skipped on the 12 non-befriendable enemies.**
  pactLines is the friendship-outcome chronicle variant; only
  meaningful when the enemy carries a `friendshipReward` (Phase 71
  D2 originally said "All three line groups on all three authored
  enemies"). Authoring pactLines for enemies without a befriend
  arc would either (a) lie about the engine surface, or (b) require
  promoting them to befriendable — which D2 rejects. So Phase 74
  ships finalBlowLines + causeLines only.

- **D4 — Voice continues from existing identity.** Each enemy's
  Phase 71-style line set extends the voice signature already
  established in `description` + alignment archetype + skill
  rotation. No new identity invention — purely chronicle prose
  matching what each enemy already is.

- **D5 — Line length matches difficulty tier.** Per Phase 71 D11:
  simple ~8-12 words, normal ~10-15 words, elite ~15-20 words,
  boss ~20-30 words (matching the existing CoastalTyrant + 70
  weight).

- **D6 — Two commits.** Unit 1 ships content authoring (one
  commit); Unit 2 ships e2e + docs + CHANGELOG (one commit);
  ship-row flip is the 3rd commit. Original candidate text had
  3 commit units but Unit 2 (new befriendables) collapses per D2.

- **D7 — No new e2e file.** Extend `src/Enemy/e2e/aftermath-lines.engine.test.ts`
  rather than splitting. The existing 4 cases already establish
  the shape; adding the 12 new authored enemies to the `authored`
  array + replacing the TidepoolCrab un-authored case with
  Sandbag_01 is a small diff.

- **D8 — Voice spot-check pins NOT added per-enemy.** Phase 71's
  Case 2 spot-checks one phrase per authored enemy ("voice
  signatures pin per enemy"). For 12 new enemies that's 12 new
  string-match assertions, which would make the test brittle to
  voice refinement. D8 picks the minimum: keep the registration
  shape pin (all sub-keys non-empty) + the existing 3 spot-check
  signatures (MournfulGull / Beggar / Tyrant) + the un-authored
  regression. Future iterates can author new spot-checks if voice
  refinements drift.

- **D9 — No public-surface change.** Phase 74 is pure content
  authoring against the fully-shipped Phase 71 engine surface
  (`finalBlowLines` / `pactLines` / `causeLines` already on the
  Enemy type as optional fields). Fixture stays at 235 + 167. No
  GAME_STATE_VERSION bump. No new type / runtime exports.

## Verify gate

- `npm run type-check` — must pass; additive authoring on
  existing optional fields.
- `npm test` — must pass; e2e count: 698 + 0 (the extension
  modifies existing cases, doesn't add new `it()` blocks per D7).
- `npm run build` — must pass.
- `npm run deploy:check` — must pass; no fixture change (D9).

## Authored lines per enemy (Unit 1 reference)

Below are the 72 lines drafted at brief time so Unit 1 ship is
pure transcription, not on-the-fly authoring (matches Phase 71
brief pattern for consistency).

### TidepoolCrab — territorial / simple / mid-mid-individual

```typescript
finalBlowLines: {
    brutal: 'The claim breaks before the claw does. The piling stays.',
    quiet:  'It folds itself back into the tidepool, smaller than it pinched.',
    ironic: 'A grievance pressed too hard. It pinched itself loose.',
},
causeLines: {
    brutal: 'The claw closes on a part of you that does not let go again.',
    broken: 'You wear down on the pinch and the pinch does not.',
    quiet:  'A small grip in a wrong place. You sit down and do not stand.',
},
```

### SeaMistWisp — confused thought / simple / mid-mid-transcendent

```typescript
finalBlowLines: {
    brutal: 'The fog parts around a sound that was not there.',
    quiet:  'It dissipates mid-sentence. The fog keeps its half.',
    ironic: 'It came to be spoken to. You answered with a closing.',
},
causeLines: {
    brutal: 'The fog thickens until the question is the only thing left.',
    broken: 'You speak to it for too long. The fog gets into the speaking.',
    quiet:  'You forget what you were going to say. The wisp remembers.',
},
```

### LullabyMoth — half-remembered song / simple / faith-optimistic-individual

```typescript
finalBlowLines: {
    brutal: 'The hum ends on the wrong note. The wings settle anyway.',
    quiet:  'It lands once on your sleeve. The song was almost finished.',
    ironic: 'You hummed back. The moth took that as permission.',
},
causeLines: {
    brutal: 'The song wraps you in a sleep you did not choose.',
    broken: 'The hum is patient. You stop noticing it long before it stops.',
    quiet:  'A lullaby for one. You answer it the only way a lullaby asks to be answered.',
},
```

### Disatree — tree who disagrees / normal / mid-pessimistic-relational

```typescript
finalBlowLines: {
    brutal: 'The argument resolves in splinters. The bark does not get the last word.',
    quiet:  'A branch lowers. The tree concedes a small point and leaves it there.',
    ironic: 'You convinced it. It fell over to make its position clear.',
},
causeLines: {
    brutal: 'The bark wins by being bark. You were softer than the argument required.',
    broken: 'The disagreement goes on. Eventually the tree is the part still standing.',
    quiet:  'You sit down to think it over and the tree mistakes that for surrender.',
},
```

### WetHound — half feral half pitiful / normal / logic-pessimistic-individual

```typescript
finalBlowLines: {
    brutal: 'The bite finishes the trembling. The hound goes still in your name.',
    quiet:  'It lowers its head and does not get up. The fur was always going to be wet.',
    ironic: 'You meant to feed it. The hound made a different choice with the offering.',
},
causeLines: {
    brutal: 'The bite arrives before the beg finishes. Both were honest in their way.',
    broken: 'You wear down on the trembling. The trembling does not wear down on you.',
    quiet:  'It curls beside you when you stop moving. The fur is still wet.',
},
```

### ForestSprite — lattice of opinions / normal / mid-optimistic-individual

```typescript
finalBlowLines: {
    brutal: 'The lattice unweaves. Several opinions go quiet at once.',
    quiet:  'It argues itself out of visibility one last time and stays gone.',
    ironic: 'You agreed with one of its opinions. The lattice did not survive the agreement.',
},
causeLines: {
    brutal: 'A whole lattice of small wrongnesses adds up to a single large one.',
    broken: 'The opinions outnumber you. The lattice closes around the difference.',
    quiet:  'A single careful argument lands. You sit down to refute it and do not rise.',
},
```

### ArgumentativeCrow — sequence of premises / normal / logic-optimistic-individual

```typescript
finalBlowLines: {
    brutal: 'The premises resolve, infuriatingly, in its own defeat.',
    quiet:  'The conclusion lands soft. The crow nods at it once and does not caw again.',
    ironic: 'It had the argument. You won by interrupting at the right syllable.',
},
causeLines: {
    brutal: 'The premises were never about you. The conclusion was.',
    broken: 'Premise after premise. You go down somewhere in the third repetition.',
    quiet:  'It caws once more, gently. You did not see how that one followed.',
},
```

### TideflukeReaver — salt-bound shore-cursed / elite / logic-pessimistic-relational

```typescript
finalBlowLines: {
    brutal: 'The reaver falls in a wash of salt. The fists were faster than the surf retreated; the strike was faster than the fists.',
    quiet:  'A single quiet strike to the salt-bound chest. The shore does not curse louder.',
    ironic: 'The reaver swung at the surf and you stepped between. The surf still arrived; the reaver did not.',
},
causeLines: {
    brutal: 'The fists arrive in a sequence the surf is too slow to retreat from.',
    broken: 'You hold for as long as the tide allows. The reaver holds longer.',
    quiet:  'A clean strike from salt-bound hands. The shore claims you on the way down.',
},
```

### HushWraith — silence after a question / elite / mid-pessimistic-transcendent

```typescript
finalBlowLines: {
    brutal: 'The silence breaks first. Then the wraith. Then the question stays.',
    quiet:  'You stop answering. The wraith fades into the room the silence left.',
    ironic: 'You doubted out loud. The wraith took your doubt as its undoing.',
},
causeLines: {
    brutal: 'The silence thickens until the answer you would have given does not arrive.',
    broken: 'You answer once, twice, the third time you are not sure. The wraith is patient.',
    quiet:  'The question is the last thing left in the room. You let it have the room.',
},
```

### HollowSaint — martyr without a cause / elite / faith-mid-transcendent

```typescript
finalBlowLines: {
    brutal: 'The wound it offered was yours; you returned it with interest.',
    quiet:  'The saint accepts the strike like it was a cause. The cause was not yours.',
    ironic: 'You declined to be its martyr. It found the role anyway, by other means.',
},
causeLines: {
    brutal: 'The wound it offered was yours. You took it. It still belongs to you.',
    broken: 'You decline the martyrdom round after round. Eventually you accept it.',
    quiet:  'The saint kneels beside where you fall. The cause it was looking for is here now.',
},
```

### TheDisagreement — unresolved argument with thorns and teeth / boss / unknown alignment

```typescript
finalBlowLines: {
    brutal: 'The argument is over because one party is no longer present to make it. The thorns retract slowly, as if the silence is what they were always for.',
    quiet:  'A point lands that the disagreement had not rehearsed. The thorns fold. The teeth retract. The argument leaves the body it had been wearing.',
    ironic: 'You agreed with one of its phases. The agreement did the work the strikes had not — the disagreement could not survive being agreed with.',
},
causeLines: {
    brutal: 'The phases were rehearsed. Your defeat was the conclusion of an argument prepared without you.',
    broken: 'You hold against one phase, then the next. The disagreement has more phases than you have rounds.',
    quiet:  'A single thorn lands in a small place. The argument was not loud about it. You go down quietly anyway.',
},
```

### EchoOfPyrrhonia — Pyrrhonian regress / boss / philosophical-skeptic archetype

```typescript
finalBlowLines: {
    brutal: 'The regress closes on itself. The echo stops being able to ask whether it has stopped.',
    quiet:  'A small certainty lands in the middle of the doubt. The echo cannot accommodate it; the echo falls silent.',
    ironic: 'You doubted whether the strike had landed. The echo doubted with you, and then did not recover.',
},
causeLines: {
    brutal: 'The regress takes one of your claims and unmakes it. Then the next. Then the body the claims were standing on.',
    broken: 'Every certainty you offered came back as a question. Eventually you ran out of certainties to be questioned.',
    quiet:  'The echo asks once whether you are still standing. You are not sure, and then you are not.',
},
```

## Definition of Done

- [ ] All 12 enemies (excl. Sandbag_01) carry authored
      `finalBlowLines` + `causeLines` per Unit 1 voice.
- [ ] `src/Enemy/e2e/aftermath-lines.engine.test.ts` registration
      pin extended to all 15 authored enemies (3 originals + 12
      new); regression case re-keyed from TidepoolCrab to
      Sandbag_01.
- [ ] `docs/enemy.md` Aftermath narrative section "Initial author
      coverage" paragraph extended.
- [ ] `CHANGELOG.md [unreleased] ### Added` Phase 74 bullet.
- [ ] `npm run verify` green (698/698 expected).
- [ ] `npm run deploy:check` green (no fixture change).
- [ ] `plan/steps/01_build_plan.md` Phase 74 row flips `[ ]` →
      `[x]` with commit hashes per unit.

## Follow-ups (out of scope)

- **Phase 74 D2 deferred — newly-befriendable enemy promotion.**
  TideflukeReaver / HushWraith / TheDisagreement (Tier-2) +
  HollowSaint (boss-tier) remain plausible candidates for a
  dedicated "Befriendable-enemy Tier-2 expansion" phase. Each
  would carry the full Phase 60/62/68/69/71/73 stack
  (`friendshipReward` + `flagSet` + `befriendabilityConfig` +
  `alignmentDelta` + `pactLines` + `journalEntry`).
- **Voice-spot-check pins for the new enemies.** D8 deferred
  per-enemy assertion authoring. If voice drift becomes a real
  issue, a future iterate can author spot-checks.
- **Sandbag_01 narrative authoring.** Per D1 skipped today; if
  the test-sandbox enemy ever gets player-facing exposure, author
  trivial placeholder lines.

## Canonical sibling

`plan/phases/phase_71_aftermath_narrative_lines.md` is the
direct ancestor — Phase 71 established the field shape + the
3-enemy authoring pattern; Phase 74 is the breadth-expansion
sweep of the same pattern across the remaining roster.
