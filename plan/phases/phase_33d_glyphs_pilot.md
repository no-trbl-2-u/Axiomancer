# Phase 33d — GLYPHS pilot (Option-B grammar experiment)

> Agent-facing brief. Concise, opinionated, decisive. Ship without asking;
> document judgment calls in the commit body. This brief IS the "decisive
> 33d brief scoped from the braindump" that `plan/AUDIT.md`'s "GLYPHS
> (Phase 33d) has no formal spec" finding (filed 2026-07-18) calls for —
> landing it resolves that finding. Do not re-open it as a separate
> follow-up; close it in this phase's commit body.

## Shape call — this is an engine+content pilot, not a page-family phase

`skills/ship-a-phase.md` §5's page-family template (routes + sections +
e2e per surface) does not apply here, the same way it didn't for D2
(engine core, flagged) or D8 (preset card content). 33d ships engine
primitives + sandbox card content, proven by hermetic tests + a
combat-playtest/sim run — **no mobile UI, no new mobile route.** See
"Decisions" for why the mobile board-zone work in the source design doc
is explicitly deferred.

## Design sources (read in this order — no formal spec exists; this brief
supersedes the braindump as the authority for 33d)

1. `plan/tuning/2026-07-10-out-of-flow-mechanics.md` §3 "GLYPHS" — the
   ratified scope-discipline note: *"pilot as 3-5 sandbox cards across
   2-3 themes via `/deck-tuning` (register -> A/B -> promote); engine
   surface is a new zone with charge events — spec it before building."*
   This is the authority for "sandbox-only, do not touch the curated
   70-card library" and "promotion is a later, separate decision."
2. `plan/tuning/2026-07-10-audit-evidence/cross-new-mechanics.md` §C2 +
   WI-2 — the only build-ready spec sketch: zone shape, charge-tick
   grammar, `crackGlyph` action, acceptance criteria. Treated as the
   engine-shape source; **scoped down** per Decisions below (mobile UI,
   preset conversion, 3rd theme, and the existing-card FREE-line retrofit
   are cut from this pilot).
3. `plan/tuning/2026-07-10-turn-texture.md` §1 — defines "Option B"
   (condition-amplified, one-line grammar) and records it is **NOT
   ratified** library-wide; GLYPHS is the sanctioned sandbox for testing
   its *grammar* (small deposits, one chosen cash-out) without touching
   the ratified FREE/PAID fork (Option A, EA-5, spec 32 v4).
4. `axiomancer-mechanics/specs/33-upgradeable-dice.md` §3 rule 5 — "FREE
   lines never touch momentum." `combat.engine.ts`
   `applyStanceAndMomentumV2` is only invoked on `useBottom` (PAID) plays
   (~line 1056), so a FREE-line `glyphCharge` rider is structurally
   momentum-safe already — this phase adds a regression test proving it,
   not new momentum-isolation logic.
5. `plan/AUDIT.md` "GLYPHS (Phase 33d) has no formal spec" (filed
   2026-07-18) — the governance finding this brief closes.

Deps 33a / D4 / D7 are all shipped; none of the three left a functional
hook GLYPHS depends on (33a's `swayCleanse`/`premiseShed` are an
unrelated enemy-counterplay pair, but their shape is the direct template
for this phase's `glyphShatter` hook — see Outputs). D4 re-derived
`cards.pricing.ts` (the pricing baseline this phase's cards price
against); D7 ratified the economy.

## Decisions made upfront — DO NOT ASK

- **Sandbox-only. No library promotion in this phase.** The Gate-4
  scope-discipline note is higher-authority than WI-2's "convert one
  uncommon slot in 3 pilot presets" — presets are the curated, D7-ratified
  70-card library; touching them is explicitly the *next* stage
  ("register -> A/B -> **promote**"), not this one. Pilot cards register
  via `registerSandboxCards` in a new named set (`cards.sandbox-sets.ts`),
  never edit `cards.library.ts` or `combat.starter-deck-presets.ts`.
- **No `CardType` union edit.** WI-2 suggests `cardType: 'glyph'`. Adding
  a new closed-union `CardType` member fans out through every
  `cardType`-switching site (card-editor tabs, mobile face renderer, the
  legacy-card-engine no-op guards). Cheaper and equally expressive: a new
  optional `Card.glyph?: { payload: GlyphPayload; cap: number }` field on
  the existing `'spell'` cardType. The PAID line's existing
  `combatEffects`/`paidSummary` resolution is untouched; inscribing is a
  side effect appended after normal PAID resolution (see Outputs). This
  keeps the pilot additive-only against every existing switch statement.
- **2 themes, not 3.** `erosion` (DoT identity — glyph payload = POISON,
  mirrors WI-2's own "Glyph of Suppuration" example) and `bastion` (Guard
  identity — glyph payload = BARRIER, mirrors "Glyph of the Bulwark").
  `grace` (WI-2's third suggestion) is cut — 2 themes is inside the
  ratified "2-3 themes" band and keeps the pilot's surface area reviewable
  in one tick.
- **4 cards, not 3-5's upper end.** 2 per theme: one **inscriber** (PAID:
  inscribe the glyph + a small immediate thematic tempo effect so the
  card isn't dead if never cracked; FREE: +1 charge to a glyph you
  already control of that payload, else a plain theme-currency fallback
  so the FREE-currency lint law holds before any glyph exists) and one
  **pump** (PAID: a normal small thematic status effect, unrelated to
  glyphs, priced independently; FREE: +1 charge to ANY glyph you control,
  else the same fallback shape). The pump card is this pilot's version of
  WI-2's "wire the FREE verb onto 2-3 existing weak-chip lines" ask —
  same grammar, delivered as a new sandbox card instead of retrofitting a
  library card, so the ratified 70 stay untouched (see first bullet).
- **No existing-library FREE-line retrofits.** WI-2's "wire onto
  `slippery-slope`'s `tickOne`" idea edits a live, D7-ratified library
  card. Cut for this pilot (sandbox-only rule above); revisit only if the
  pilot graduates and Option A's FREE-currency law gets a follow-up pass.
- **No SOUL/Harvest parity hookup.** WI-2's "expiry/consumption feeds
  SOUL" ties GLYPHS into Harvest's theme currency, which only makes sense
  once/if glyphs graduate to Harvest's own preset. Out of scope for a
  2-theme (erosion/bastion) pilot that doesn't touch Harvest.
- **No mobile UI.** WI-2's board-zone/tap-confirm-sheet UI is explicitly
  gated by its own doc: *"run the touch-UX check the completeness critic
  flagged BEFORE the spec is ratified"* — this pilot is exactly the
  pre-ratification stage. `crackGlyph` is exercised via the mechanics CLI
  (`npm run game -- combat --script`) and hermetic engine tests only,
  same as every other sandbox-only card set before its D8-style mobile
  promotion (precedent: `dice-valves-33` shipped sandbox-first at D4,
  mobile-visible only after D8 promoted it). Follow-up, not this phase.
- **No sim `crackAt` policy heuristic.** The autoplay policies
  (`combat.policies.ts`) do not learn a glyph-cracking heuristic this
  phase; the sandbox proof step (see Prove) runs the existing greedy/blind
  policies, which will simply never crack a glyph (crackGlyph is a new
  action they don't know about) — evidence gathered is "does the engine
  behave correctly," not "is a glyph-aware bot stronger." A `crackAt`
  policy is graduation-stage work.
- **Enemy counterplay: engine hook only, 2 enemies, reusing 33a's exact
  shape.** Add `CombatThreatEffect.glyphShatter?: boolean` (mirrors
  `swayCleanse`/`premiseShed`'s shape from 33a: applied inline in
  `resolveThreatPhase`, gated by `!doubtId`, no new cooldown field, rate
  limited only by how often the authored phase recurs). When true and the
  player controls >=1 glyph, destroy the LOWEST-charge glyph (tie-break:
  first in array order — deterministic, no RNG). Author it onto exactly
  one already-authored phase each for 2 existing late-game enemies (pick
  the two highest-difficulty enemies already in
  `combat.threat-sequences.ts` that don't already carry `enemyCleanse` on
  every phase, so the new field reads as a distinct threat) — no new
  bestiary entries, matching 33a's own "hook-only" restraint.
- **Charge cap = 3 for both pilot payloads.** Mid of WI-2's authored
  "3-5" band; keeps the sim's early-fight (2.0-2.2 round) baseline able to
  reach a full-charge crack without redesigning fight length.
- **Payload formulas** (existing status verbs only, per WI-2's own
  constraint — no new effect types):
  - `glyph-of-suppuration` (erosion): crack -> POISON intensity
    `1 + charges`, duration 2. (Toned down from WI-2's illustrative
    `2 + 2*charges` — that reads as a rare-tier finisher; this pilot
    prices as a common/uncommon, see pricing below.)
  - `glyph-of-the-bulwark` (bastion): crack -> BARRIER `2 + charges`
    (persistent Guard, per the existing `barrier` `CardRider` verb).
- **No save-migration entry.** `CombatEncounterState` is transient
  in-memory combat state, never persisted across app sessions (same
  reasoning phase 37 used to skip `GAME_STATE_VERSION`/`migrate` for the
  `combatResources` teardown) — `state.glyphs` needs no migration.

## Outputs

```
axiomancer-mechanics/src/Combat/combat.encounter.types.ts
  + interface GlyphInstance { id: string; cardId: string; payload: GlyphPayload; charges: number; cap: number }
  + type GlyphPayload = { kind: 'poison'; baseIntensity: number; duration: number }
                       | { kind: 'barrier'; baseAmount: number }
    (closed union — both members are existing status verbs, no new
    CardCombatEffects kind; `baseIntensity`/`baseAmount` are the FLAT
    term, `+ charges` is applied at crack time)
  ~ CombatEncounterState: + glyphs?: GlyphInstance[] (beside `tempZone`,
    same "optional, absent = none" back-compat convention)
  + CombatThreatEffect.glyphShatter?: boolean (beside `enemyCleanse`,
    mirrors 33a's `swayCleanse`/`premiseShed` addition exactly)
  + CombatEvent additions (beside 'threat-cleansed' / the 33a pair):
    | { kind: 'glyph-inscribed'; glyphId: string; cardId: string }
    | { kind: 'glyph-charged'; glyphId: string; charges: number; cap: number }
    | { kind: 'glyph-cracked'; glyphId: string; cardId: string; charges: number }
    | { kind: 'glyph-shattered'; glyphId: string; phaseIndex: number }

axiomancer-mechanics/src/Cards/types.ts
  + CardRider.glyphCharge?: number (beside `barrier`/`recoil`/`millCards`
    — the Phase-30 FREE-currency rider family; +N charge to a glyph you
    control matching this card's `glyph.payload.kind`, or if none, the
    engine applies `glyphChargeFallback` instead — see below)
  + Card.glyph?: { payload: GlyphPayload; cap: number } (PAID line
    inscribes; only meaningful alongside a `combatEffects`/`paidSummary`
    PAID line, same card)
  + CardRider.glyphChargeFallback?: CardRider (the plain theme-currency
    deposit applied by `glyphCharge` when the player controls no
    matching glyph yet — keeps the FREE-currency lint law satisfied
    before a glyph exists; e.g. `{ applyEffect: { effectId: 'mark',
    intensity: 1, duration: 1 } }`)

axiomancer-mechanics/src/Combat/combat.engine.ts
  ~ zoneHas-adjacent: new `glyphsOfKind(state, kind)` helper (beside
    `zoneHas`, ~line 1210) — filters `state.glyphs` by payload kind.
  ~ PAID-line resolution (wherever `combatEffects` for a `'spell'` card
    finish applying — the same site enchant/disenchant push into
    `tempZone`/`persistentZone`): if `card.glyph`, push a new
    `GlyphInstance` (id = `${card.id}-${state.glyphs.length}`, charges 0,
    cap `card.glyph.cap`) onto `state.glyphs`; emit `glyph-inscribed`.
  ~ FREE-line resolution (wherever `CardRider` FREE fields apply, e.g.
    `barrier`/`recoil`): if `rider.glyphCharge`, find a glyph in
    `state.glyphs` whose `payload.kind` matches the card's own
    `card.glyph?.payload.kind` (or, for pump cards with no `card.glyph`,
    ANY glyph — see Decisions "pump" card); if found, `charges =
    Math.min(cap, charges + rider.glyphCharge)`, emit `glyph-charged`;
    if none found, apply `rider.glyphChargeFallback` instead (or no-op
    with a `effect-fizzled` event if absent — never silently drop a FREE
    line's only rider).
  + charge tick in `processBetweenPhases` (~line 3844 region, beside the
    `tempZone`/`enemyTempAttachments` roundsLeft tick): every glyph in
    `state.glyphs` with `charges < cap` gains `+1` charge (uncapped tick
    beyond cap is a no-op, not an error), following the `ripenReserve`
    grammar (no event per tick — same silence `tempZone`'s tick keeps;
    only crack/shatter/charge-from-a-play are logged).
  + new exported function `crackGlyph(state, glyphId, rng = defaultRng):
    CombatTransition`, following `playSignatureSkill`'s shape (~line
    4468): legal only in `phase-play`; not gated by dice/cost (dieless —
    the die was paid at inscription); resolves `glyphId`'s payload at
    its current `charges` via the existing DoT/Barrier application
    helpers (same functions `applyEffect`/the `barrier` rider already
    call — no new damage/status math); removes the glyph from
    `state.glyphs`; emits `glyph-cracked`; runs `checkImmediateOutcome`
    same as `playSignatureSkill`.
  + `glyphShatter` handling in `resolveThreatPhase`, immediately after
    the existing `premiseShed` block (33a, ~line 3314+209): `if
    (eff.glyphShatter && !doubtId && (state.glyphs?.length ?? 0) > 0)` —
    remove the lowest-`charges` entry (stable sort, first on tie), emit
    `glyph-shattered`.

axiomancer-mechanics/src/Cards/cards.pricing.ts
  + CONDITION_DISCOUNTS unaffected (glyphs aren't a state-gated rider,
    they're their own scoring branch).
  + new scoring term in the card-scoring function (beside
    `card.threshold`/`card.dieBonus` handling, ~line 570-595): `if
    (card.glyph) pts += glyphExpectedValue(card.glyph) *
    GLYPH_CRACK_DISCOUNT` — expected value = the payload's flat term +
    (cap / 2) [expected charges at a "reasonable" crack timing, not the
    max — cracking early is a real, common line per the design's own
    "ripening dilemma"], scored through the SAME `scoreRider`-style
    verb-points table as any other rider, discounted (`GLYPH_CRACK_DISCOUNT
    = 0.6`, new constant beside `CONDITION_DISCOUNTS` — priced like
    `dieBonus` since both are "fires later, not guaranteed at print
    time").
  + `VERB_POINTS.glyphCharge` — priced like `millPerCard`/`pips`-family
    entries (a small deposit verb): `glyphChargePerCharge: 0.4`.

axiomancer-mechanics/src/Cards/cards.sandbox-sets.ts
  + new named set `GLYPHS_33D_PILOT` (or the file's existing naming
    convention — match `dice-valves-33`'s pattern exactly): the 4 cards
    below, registered via `registerSandboxCards`.

axiomancer-mechanics/src/Combat/combat.threat-sequences.ts
  ~ 2 existing late-game enemies: add `glyphShatter: true` to one
    already-authored phase each (pick per Decisions).

axiomancer-mechanics/src/index.ts, src/Combat/index.ts, src/Cards/index.ts
  ~ export `crackGlyph`, `GlyphInstance`, `GlyphPayload` wholesale
    (additive-only — mirrors how `CombatThreatEffect`/`CombatEvent` are
    already exported wholesale per 33a's precedent).

axiomancer-mechanics/src/Combat/e2e/glyphs.engine.test.ts (new)
axiomancer-mechanics/src/Combat/e2e/momentum-wheel.engine.test.ts
  ~ add one case: a FREE `glyphCharge` play leaves `state.momentum`
    byte-identical (spec 33 §3 rule 5 regression guard).
```

## The 4 pilot cards (concept-locked; exact wording/pricing finalized
## against `cards.pricing.ts`'s real formulas during implementation)

| id | theme | role | PAID | FREE |
|---|---|---|---|---|
| `glyph-of-suppuration` | erosion | inscriber | Inscribe a Glyph of Suppuration (payload: poison, base 1, dur 2, cap 3) + apply a small immediate MARK (tempo, so the card isn't dead if never cracked) | +1 charge to your Glyph of Suppuration if you control one, else `mark i1 d1` |
| `ash-that-remembers` | erosion | pump | Apply a normal thematic DoT tick (e.g. `tickOne`-class erosion payoff, priced standalone) | +1 charge to ANY glyph you control, else `mark i1 d1` |
| `glyph-of-the-bulwark` | bastion | inscriber | Inscribe a Glyph of the Bulwark (payload: barrier, base 2, cap 3) + small immediate Guard | +1 charge to your Glyph of the Bulwark if you control one, else a small barrier fallback |
| `ward-that-waits` | bastion | pump | Apply a normal thematic Guard/Barrier payoff, priced standalone | +1 charge to ANY glyph you control, else the same barrier fallback |

Names follow the voice doctrine (terse, archaic, cold-and-old, no
thee/thou/thy/thine/ye). Card-expert may retune exact numbers to hit
the common/uncommon pricing bands (1.5-7.5 / 4.5-13) — the shapes above
are locked, the arithmetic is not.

## Tests

New `glyphs.engine.test.ts` (pattern: `reactive-counterplay-hooks.engine.test.ts`'s
direct-engine-call harness, no bestiary/sandbox-registration dependency
for the pure engine cases):

- Inscribe (PAID play of a `card.glyph` card) creates a `GlyphInstance`
  at 0 charges, cap as authored; emits `glyph-inscribed`.
- `processBetweenPhases` ticks every glyph +1 charge, capped (charges
  never exceed `cap`; a glyph already at cap stays at cap, no event).
- `crackGlyph` at N charges applies the exact scaled payload (test both
  payload kinds, at charges 0/1/3), removes the glyph, emits
  `glyph-cracked` with the correct `charges` value.
- `crackGlyph` on a nonexistent `glyphId`, or outside `phase-play`, is a
  no-op (mirrors `playSignatureSkill`'s guard pattern).
- FREE `glyphCharge` on a matching glyph increments it (capped);
  FREE `glyphCharge` with no matching glyph applies
  `glyphChargeFallback` instead (never a silent no-op).
- `glyphShatter` on a fired, non-doubted threat phase removes the
  LOWEST-charge glyph when >=1 exists; is a no-op with 0 glyphs; is
  gated by `!doubtId` (mirrors 33a's DOUBT test).
- Momentum regression (in `momentum-wheel.engine.test.ts`): a FREE
  `glyphCharge` play leaves `state.momentum` unchanged (rule 5).

## Prove (DoD)

- `npm run verify --workspace axiomancer-mechanics` green (type-check +
  type-check:tests + lint + vitest + build).
- `npm run type-check --workspace axiomancer-mobile` and `--workspace
  axiomancer-card-editor` green (public-surface additions per hard rule
  7 — `crackGlyph`/`GlyphInstance` are new exports off `src/index.ts`).
- Sandbox-registration smoke: the 4 cards resolve through
  `getCardById`/`toCombatCard` (existing sandbox-registry test pattern)
  with no collisions against the library.
- A `combat-playtest`/sim run (`npm run combat-sim` or
  `combat-playtest` with `--sandbox=<the new set id>`) confirms the 4
  cards load and play without engine errors across the stage matrix —
  evidence that the new zone/action don't destabilize existing policies.
  This is NOT the A/B promotion court (that's graduation-stage,
  out of scope) — just "does it run clean," logged in the commit body.

## Commit body template

```
feat(mechanics): GLYPHS pilot — charging seals, player-cracked (phase 33d)

- new state.glyphs zone: persistent battlefield seals that charge +1/round
  (processBetweenPhases) and crack via a new dieless crackGlyph action for
  a payload scaled by accumulated charges (poison/barrier payloads only —
  no new effect types)
- 4 sandbox-only pilot cards across erosion/bastion (glyph-of-suppuration,
  ash-that-remembers, glyph-of-the-bulwark, ward-that-waits) — inscribe
  (PAID, costs a die) + charge-pump (FREE, dieless) grammar, testing
  Option B's condition-amplified "small deposits, one cash-out" feel
  without touching the ratified 70-card library
- glyphShatter enemy-counterplay hook (CombatThreatEffect, mirrors 33a's
  swayCleanse/premiseShed shape) authored onto 2 late-game enemies
- FREE-charge / momentum-isolation (spec 33 §3 rule 5) proven by a new
  regression case, not just asserted

Decisions:
- sandbox-only, no library/preset promotion this phase — Gate-4's own
  scope-discipline note ("register -> A/B -> promote") makes promotion a
  later, separate decision
- no new CardType member; glyph config rides the existing 'spell' type
- no mobile UI, no sim crackAt policy heuristic, no SOUL/Harvest parity —
  all explicit follow-ups, not cut for time but because the source
  design doc itself gates the mobile work on a pre-ratification UX check
  this pilot is the input to
- closes the plan/AUDIT.md "GLYPHS (Phase 33d) has no formal spec"
  finding — this brief is the decisive scoping document that finding
  asked for

Closes #<phase-issue-number>
```

## DoD

Flip Phase 33d `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append
the commit hash, separate commit (`plan: phase 33d shipped — GLYPHS
pilot`).

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- Mobile UI: glyph chip row + tap-confirm sheet with the foretold next
  crack value (WI-2 acceptance criterion 4) — gated on the
  completeness-critic touch-UX check per the source doc's own caveat.
- Sim `crackAt` policy heuristic + the full A/B promotion court
  (statusEngagement +10pp / mean-rounds 2.0-2.2 -> 3-4 acceptance
  criteria from WI-2) — graduation-stage work once mobile exists to
  actually observe player cracking behavior.
- SOUL/Harvest parity (glyph expiry/consumption feeding Harvest's theme
  currency) — only relevant if/when Harvest gets its own glyph card.
- Existing-library FREE-line retrofits (the `slippery-slope` idea) —
  revisit only alongside a wider Option-A FREE-currency follow-up pass,
  never as part of a sandbox-only pilot.
- Preset conversion (WI-2's "convert one uncommon slot in 3 pilot
  presets") — promotion-stage, not pilot-stage.
- A 3rd theme (WI-2 suggested `grace`) if the 2-theme pilot's evidence
  supports widening before full promotion.
