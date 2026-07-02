# Phase 76 — Engine narrative prose consumer (aftermath panels)

> Promoted via /oversight 2026-05-23 (36th call) from
> `PHASE_CANDIDATES.md` `[score 5.5]` row. Engine 0.11.0
> Phase 71 [ENGINE LANDED] surfaced per-foe narrative lines
> on `Enemy.finalBlowLines` / `Enemy.pactLines` /
> `Enemy.causeLines`; this phase makes the aftermath
> presenter consume them.

## 1. Why

`state/presenters/aftermath.engine.ts` carries three
`derive*Phrase` helpers (`deriveFinalBlowPhrase`,
`derivePactPhrase`, `deriveCausePhrase`) that select one of
three placeholder chronicle lines based on damage tier (or
enemy level for pact). The Phase 70 Tick A/B/C commit bodies
each flagged this as "placeholder; engine integration
follow-up if writers want per-enemy lines." Engine 0.11.0
landed exactly those per-enemy lines on the `Enemy` shape.
This phase retires the placeholders in favour of engine
reads.

Today: 3/16 enemies in `ENEMY_REGISTRY` have the lines
populated (`enemy-mournful-gull`, plus two others).
Coverage will grow as the writers fill in the library; the
presenter must read engine lines when present and fall back
gracefully when absent so the panel always renders a phrase.

## 2. Scope (single tick)

### A. Extend `AftermathData.enemy`

`state/combat-mode.tsx` — the snapshot stashed at
combat-exit time strips the engine's narrative lines.
Extend the `enemy` shape on all three variants
(`victory` / `parley` / `defeat`) to optionally carry:

```ts
finalBlowLines?: { brutal: string; quiet: string; ironic: string };
pactLines?:      { quiet: string; setDown: string; heavy: string };
causeLines?:     { brutal: string; broken: string; quiet: string };
```

All optional — old fixtures and enemies without lines render
the fallback phrase.

### B. Snapshot producers in `app/(tabs)/combat.tsx`

Three call sites build snapshots (victory at ~line 332,
parley at ~299, defeat at ~356). Each `enemy` literal extends
to include the three `*Lines` fields from `combat.enemy.*Lines`
verbatim (the engine field is already optional, so a plain
pass-through preserves the optional contract).

### C. Replace `derive*Phrase` helpers

`state/presenters/aftermath.engine.ts`:

- `deriveFinalBlowPhrase(data)` — pick a tier key from
  `data.finalBlow.damage`:
  - `>= 20` → `'brutal'`
  - `>= 10` → `'quiet'`
  - else    → `'ironic'`
  Read `data.enemy.finalBlowLines?.[tier]`. Fall back to the
  existing generic phrase per tier when engine lines absent.
- `deriveCausePhrase(data)` — pick a tier key from
  `data.finalBlow.damage`:
  - `>= 20` → `'brutal'`
  - `>= 10` → `'broken'`
  - else    → `'quiet'`
  Read `data.enemy.causeLines?.[tier]`. Fall back to the
  existing generic per-tier phrase when absent.
- `derivePactPhrase(data)` — pick a tier key from
  `data.enemy.level`:
  - `<= 2` → `'quiet'`
  - `<= 5` → `'setDown'`
  - else   → `'heavy'`
  Read `data.enemy.pactLines?.[tier]`. Fall back to the
  existing generic per-tier phrase when absent.

The tier-key extraction lives in two new presenter-local
helpers (one for damage, one for level) so the three
selectors share the same mapping logic and tests can pin
the boundaries once.

### D. Tests

`state/presenters/__tests__/aftermath.engine.test.ts`:

- Retire the three placeholder-string pins (`'went down
  face-first'`, `'wet rag folds'`, `'bell did not ring'`,
  `'set down the bell'`, etc. — keep them as the *fallback*
  assertions, but add a parallel set of pins that exercise
  engine-sourced reads).
- Add pins:
  - When `enemy.finalBlowLines` is populated, the presenter
    returns the line keyed off the damage tier (one test per
    tier).
  - When `enemy.causeLines` is populated, ditto by damage.
  - When `enemy.pactLines` is populated, ditto by level.
  - When the engine field is absent (the existing test
    fixtures), the fallback phrase fires (existing
    assertions stay green).

## 3. Decisions made upfront — DO NOT ASK

1. **Damage tier boundaries stay 20 / 10 / else.** Same as
   the existing placeholder selector. Engine doesn't
   prescribe; the boundaries are presenter judgement.
2. **Cause-line tier-2 key is `'broken'`** (engine field
   name), not `'quiet'` like the victory branch. Engine
   typed them differently — the presenter doesn't
   normalize.
3. **Pact-line level boundaries stay ≤2 / ≤5 / else.** Same
   as the existing placeholder selector.
4. **Fallback phrases stay verbatim.** The existing
   placeholder strings continue to ship as defensive
   fallbacks for foes that haven't had narrative lines
   authored yet. Removing them entirely would render an
   empty italic line on every uncovered foe — worse UX than
   the generic phrase.
5. **AftermathData snapshot widening is additive only.**
   New optional fields, no shape rename, no consumer impact
   beyond the presenter.
6. **No engine bump required.** `finalBlowLines` /
   `pactLines` / `causeLines` already shipped in
   `axiomancer-mechanics` 0.11.0 (already on lockfile).
7. **No UI / component changes.** The aftermath panels
   render the existing `finalBlowPhrase` / `pactPhrase` /
   `causePhrase` strings; the swap is presenter-internal.
8. **No combat-modal layout touch.** Honours the 36th
   /oversight call's combat-modal-audit bias (same
   constraint that gated Phase 75).
9. **Tier-key extraction helpers are presenter-local.** No
   shared utility module — these are aftermath-internal,
   and the engine may extend tier vocabularies in the
   future.

## 4. Acceptance (DoD)

- `pnpm verify` green; new pins for engine-sourced reads
  pass alongside the retained fallback pins.
- Snapshots built in `app/(tabs)/combat.tsx` thread the
  three optional `*Lines` fields through to the presenter.
- The presenter prefers engine lines when present; falls
  back to the generic per-tier phrase when absent.
- No changes to component render code; the aftermath
  panels (`<CombatVictoryPanel>`, `<CombatFriendshipPanel>`,
  `<CombatDefeatPanel>`) read the same VM fields they did
  before.
- Closes the three Phase-70-follow-up rows (Tick A/B/C
  commit bodies all flagged this gap).

## 5. Commit body template

```
feat: engine narrative prose consumer — phase 76

- Aftermath presenter now reads per-foe finalBlowLines /
  pactLines / causeLines from the engine snapshot when
  present, falling back to the generic per-tier phrases when
  absent. Closes the three Phase-70 follow-up gaps.
- AftermathData.enemy widened to optionally carry the three
  *Lines fields (additive, no consumer impact).
- Snapshot producers in app/(tabs)/combat.tsx pass the lines
  through from combat.enemy verbatim.
- New pins for engine-sourced reads (per tier per kind);
  existing fallback pins stay green.

Decisions:
- Cause-line tier-2 key is 'broken' (engine name), not
  'quiet'; presenter doesn't normalize.
- Fallback phrases stay verbatim — removing them would render
  empty italic lines for uncovered foes.
- Damage / level tier boundaries unchanged from the previous
  placeholder selector.

Closes #<phase-issue-number>
```

## 6. Follow-ups (out of scope)

- Per-foe narrative coverage for the 13/16 enemies that
  currently lack `*Lines` — a content phase, not engine
  work.
- Richer tier signals (enemy archetype, stance triangle,
  philosophical alignment) feeding the selector — would
  need engine-side enumeration and new presenter mapping
  tables.
