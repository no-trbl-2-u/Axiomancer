# Phase 32 — Theme Deep Work (Gate 2, sandbox-first)

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document judgment calls in the commit body.

## Scope

Build plan row 32 bundles the Gate 2 per-theme rework batch, ratified
2026-07-10 (`plan/tuning/2026-07-10-theme-identity.md` §2): "One
sub-phase per rework: harvest (REAP attacks max HP + travelling
Souls), bulwark (RIPOSTE reflects the prevented blow), akrasia (DEBT
ledger), then remaining per-theme M items."

This is the largest content phase after 30/31 — four-plus
self-contained reworks across ten themes. Shipped **incrementally,
one part per tick**, mirroring phase 31's part-1/2/3 pattern: each
part is a focused commit; the DoD row stays `[ ]` until every listed
part has landed. A later `/ship-a-phase` tick re-reads this brief,
sees which parts already have a commit hash below, and picks up the
next one.

**Status:**
- [x] Part 1 — Harvest: REAP attacks MAXIMUM HP (this tick)
- [x] Part 1a — DoT clocks: distinct trigger substrate, Suppuration's
      cross-clock accumulator, and actual-VITAE receipt/attribution honesty
      (WS3 shipped in `85acd441` / `3cecd275`; lethal receipt and summary
      reconciliation closed in the combat-truth follow-up)
- [x] Part 1b — Harvest: Souls persist across combats (`player.bankedSouls`,
      write-back + a Memoir REMAINS read-back; milestone-rider design further
      split to Part 1c, see below)
- [x] Part 2 — Bulwark: RIPOSTE reflects the prevented blow (this tick)
- [x] Part 3 — Akrasia: DEBT ledger (this tick; Absolution fork / Last Word /
      Sin-priced FREE lines deferred, see below)
- [x] Part 4a — Control: TURNABOUT (this tick)
- [x] Part 4b — Oratory: milestone drip (this tick)
- [x] Part 4c — Forge: OVERHEAT (this tick)
- [x] Part 4d — Oracle: OMEN v2 (this tick; recolor cassandras-burden /
      gate prophecy-fulfilled / PORTENT / foretell picker UI deferred, see
      below)
- [x] Part 4e — Charm: Resolve milestones (this tick)
- [x] Part 4f — Echo: Ouroboros targets the last spell that LANDED A STATUS
      (this tick; second-thoughts partial detonate and CRESCENDO overflow
      deferred, see below)
- [x] Part 1c — Harvest: milestone epithet on the carried Soul bank
      (this tick; resolves the last quarter of the P-NEXT item — see below)

## Part 1 — Harvest: REAP attacks MAXIMUM HP

### Design intent (source: 2026-07-10-theme-identity.md §2, PA-1)

> REAP attacks MAXIMUM HP (a win vector no other theme touches —
> erosion of the possible, not the present) + Souls persist across
> combats with milestone riders (P-NEXT: the jar travels). This is
> the theme's unique axis; sized like a spec, not a patch.

The source doc bundles two items with a `+`. The Souls-persistence
half is explicitly tagged `P-NEXT` (a forward-looking property, not
one of this pass's two graded targets, P-IDENT/P-ARC) and requires
cross-run save-schema work (a new persistent-currency slot on the
character save, migration, a mobile surface to show the carried
bank, and milestone-rider design) — orthogonal engineering to the
in-combat mechanic and large enough to be its own part. **Split
here**: Part 1 ships the in-combat MAX-HP win vector; Part 1b (Souls
persistence) is a follow-up, not blocking this tick.

### Current state (verified in code)

- `Enemy.health` / `Enemy.maxHealth` (`src/Enemy/types.ts:227-228`) —
  `maxHealth` is set once at spawn (`src/Enemy/index.ts:157-163`) and
  never mutated by any existing verb. `isDefeated` (`src/Combat/health.ts:25`)
  checks `health <= 0` only.
- REAP lives in two cards, both Harvest (`src/Cards/cards.library.ts`):
  `the-gleaners-due` (`specialMechanics: [{ kind: 'reap', cost: 2,
  rider: { drawCards: 2, souls: 1 }, kindle: 'mind' }]` — the small
  utility REAP, no current-HP burst today) and `the-reaping`
  (`specialMechanics: [{ kind: 'reap_all', burstPerSoul: 4 }, { kind:
  'siphon', pct: 0.4 }]` — the capstone finisher).
- Engine cases `'reap'` / `'reap_all'` (`src/Combat/combat.engine.ts:2018-2062`):
  `reap_all` computes `burst = round(burstPerSoul * spent * mult *
  vulnMult)` and applies it via `applyEnemyDamage` (current HP only,
  plus the shared damage-instance clock). `reap` (single) has no
  burst today — it's a utility/kindle card, not a damage source.
- `maxHealth` is load-bearing elsewhere and will react to a shrinking
  ceiling automatically: `ruptureBurstCap(enemy.maxHealth)` (Affliction's
  RUPTURE cap, `effects.ts:87`), `capitulateThreshold` (Charm's SWAY
  capitulation-offer threshold, `effects.ts:128-129`), `combat.sim-policies.ts:119`
  (`LOW_HP_FRACTION` AI heuristic), `combat.attribution.ts:142`
  (`hpLostCeiling` used in damage-share normalization). These are
  cross-theme synergies (a shrunk ceiling lowers other themes' burst
  caps and alt-win thresholds too) — expected and desirable per "the
  possible," not a bug to suppress.
- Mobile presenters (`combat-encounter.engine.ts:626-627`,
  `combat-hud.engine.ts`) read `e.maxHealth` live off engine state
  every render — a shrinking bar needs **zero** mobile code changes,
  it falls out of the existing `hpPct = health / maxHealth` derivation.

### Decisions made upfront — DO NOT ASK

- **Additive, not replacement.** REAP's existing current-HP burst
  (`the-reaping`'s `burstPerSoul` payoff) is UNCHANGED. REAP now
  ALSO permanently lowers `enemy.maxHealth` by the same amount, in
  the same call. This was chosen over a pure "erode only the
  ceiling, current HP untouched until the ceiling passes under it"
  design because the latter risks the capstone dealing **zero**
  effective damage on its most common use pattern (played as a
  finisher after DoTs have already ground current HP below what the
  new, still-positive ceiling would be) — a balance regression that
  would require a full theme re-tune this tick has no evidence
  budget for. The additive version is strictly backward-compatible
  on current-HP output (preserves the shipped win-rate curve with
  zero re-tuning) while still literally shipping "REAP attacks
  MAXIMUM HP." A pure alt-win-condition version (kill via emptied
  ceiling regardless of current HP) is a stronger, more thematically
  pure follow-up once A/B evidence exists to retune `burstPerSoul`
  against it — noted under Follow-ups.
- **Both `reap` and `reap_all` erode maxHealth**, not just the
  capstone. `the-gleaners-due`'s small REAP (cost 2, no current-HP
  burst today) gets a **new**, modest maxHealth erosion tied to its
  `cost` (Souls spent) so the mechanic reads consistently across both
  cards — a REAP that spends Souls always shrinks the ceiling a
  little, the capstone shrinks it by a lot. Sized at the same rate as
  `the-reaping`'s per-Soul burst conversion (see Outputs) so both
  cards speak one formula, not two.
- **No clamp code needed.** Because current HP and max HP always
  drop by the identical amount in the same call, `health <= maxHealth`
  is preserved automatically (an invariant-preserving subtraction,
  not a clamp-after-the-fact) — no new invariant-enforcement code, no
  risk of a stale `health > maxHealth` state leaking into `isDefeated`,
  `getHealthPercentage`, or any mobile bar math.
- **Damage-instance clock**: the erosion piggybacks on the SAME
  `applyEnemyDamage` call already firing for the current-HP burst
  (erosion is folded into that one call, not a second damage
  instance) — a REAP does not double-trigger BLEED's damage-instance
  clock relative to today's behavior.
- **Attribution**: `recordAttribution`/`mechanicDamage`/`directDamage`
  keep counting the CURRENT-HP portion only (unchanged formula) — the
  maxHealth erosion is a side effect, not double-counted HP damage,
  so the single-card-spam ≤70% telemetry stays honest.
- **New event, not an overloaded one.** Add `{ kind: 'max-hp-eroded';
  cardId: string; amount: number; newMax: number }` rather than adding
  a field to the existing `reaped` event — keeps `reaped`'s existing
  consumers (tests, any UI reading `amount`) unchanged, and gives the
  new effect its own legible telemetry hook for a future mobile toast
  (not required this part; the HP bar shrinking is legible on its
  own).
- **Pricing**: no field on either card's declared `specialMechanics`
  changes (cost, `burstPerSoul`, rider) — `scoreCard` is a pure
  function of declared fields and does not know about the erosion
  side effect, so the pricing lint's band check is unaffected
  structurally. The `// pts:` comments are updated to note the
  erosion qualitatively (honesty of intent, not a scoring input) —
  this is a bonus riding an existing paid effect, matching how
  `bone-orchard`'s enchant text already documents non-scored engine
  behavior in prose.
- **Souls-persistence deferred to Part 1b** (see Scope) — tracked as
  a Follow-up, not silently dropped.

### Outputs

- `src/Combat/effects.ts` (or a small new helper colocated near
  `applyDamage`/`heal` in `src/Combat/health.ts`): pure function
  `erodeMaxHealth<T extends Combatant>(combatant: T, amount: number):
  T` — `{ ...combatant, maxHealth: Math.max(0, combatant.maxHealth -
  amount), health: Math.max(0, combatant.health - amount) }` (single
  subtraction on both fields, floored independently at 0; health
  cannot exceed the new max because both start from the same
  pre-erosion state and drop by the same amount).
- `combat.engine.ts` `reap_all` case: after computing `burst`, call
  `erodeMaxHealth(enemy, burst)` instead of the current `applyDamage`-only
  path — i.e., replace the direct-damage application with the erosion
  helper (which still reduces `health`, so `applyEnemyDamage`'s
  damage-instance clock wiring stays exactly where it is, just
  sourced from the eroded enemy). Push `{ kind: 'max-hp-eroded',
  cardId: card.id, amount: burst, newMax: enemy.maxHealth }` alongside
  the existing `reaped` event.
- `combat.engine.ts` `reap` case (`the-gleaners-due`): new erosion
  term `erosion = Math.round(mech.cost * REAP_EROSION_PER_SOUL)` (a
  new exported constant in `effects.ts`, valued at `2` to start — a
  cost-2 REAP erodes 4 max HP, roughly a tenth of `the-reaping`'s
  smallest realistic burst, keeping the utility card's erosion
  clearly secondary to the capstone's) applied via the same
  `erodeMaxHealth` helper before the existing kindle/rider logic;
  push the same `max-hp-eroded` event.
- `CardSpecialMechanic` type (`src/Cards/types.ts`) needs no new
  fields — erosion rate is derived engine-side from `cost` /
  `burstPerSoul`, not authored per-card, so both cards opt in
  automatically by using `reap`/`reap_all` at all (matches the "no
  other theme touches this" framing: it's a property of the VERB, not
  a per-card rider).
- `combat.encounter.types.ts`: new `CombatEvent` variant `{ kind:
  'max-hp-eroded'; cardId: string; amount: number; newMax: number }`.
- `// pts:` comment updates on `the-gleaners-due` and `the-reaping`
  noting the erosion bonus in prose (no numeric change to the
  existing point total).

### Tests

- New engine e2e (`src/Combat/e2e/reap-max-hp-erosion.engine.test.ts`):
  `reap_all` reduces both `health` and `maxHealth` by the reported
  burst; `reap` (single) reduces both by the cost-derived erosion
  amount; `health` never exceeds `maxHealth` after either; erosion
  floors at 0 (an overkill `reap_all` against a nearly-dead enemy
  doesn't push `maxHealth` negative); `max-hp-eroded` event fires
  with the correct `amount`/`newMax`; a full `COMBAT_SIM_POLICY_ORDER`
  sweep confirms no policy crashes with a shrinking enemy ceiling
  (mirrors the momentum-wheel test's cross-policy pattern from phase
  31).
- Confirm existing `ruptureBurstCap`/`capitulateThreshold` unit tests
  still pass unmodified (they take `maxHealth` as a parameter already
  — no code change needed there, just confirming the cross-theme
  wiring holds).
- Re-run `combat-playtest.balance-bands.sim.test.ts` and
  `combat-playtest.card-coverage.sim.test.ts` cold; both must stay
  green with zero pin changes (the additive design is chosen
  specifically so this holds without a re-tune).

### Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

No mobile-visible contract changes (presenters already derive
`hpPct` live) — `axiomancer-mobile` verify is a courtesy check, not
gating, unless the cross-package impact checklist flags a touched
shared type.

### Deploy gate

```bash
npm run deploy:check
```

### Commit body template

```
feat(mechanics): REAP attacks maximum HP — phase 32 part 1

- <erodeMaxHealth helper + wiring>
- <reap / reap_all engine cases>
- <max-hp-eroded event>
- <tests>

Decisions:
- Additive (current HP unchanged + new maxHealth erosion) over pure
  replacement — see brief §Part 1 Decisions.
- Souls cross-combat persistence split to Part 1b (P-NEXT tagged in
  source doc, orthogonal save-schema scope).
```

## Part 1b — Harvest: Souls persist across combats

### Design intent (source: 2026-07-10-theme-identity.md §2, PA-1, P-NEXT half)

> Souls persist across combats with milestone riders (P-NEXT: the jar
> travels).

Per Part 1's own scope note, this P-NEXT half bundles FOUR things: (1) a
persistent-currency slot on the character save, (2) a migration, (3) a
mobile surface to show the carried bank, (4) milestone-rider design (what a
running Soul total unlocks). **Split again, same discipline as Part 1 and
Part 3's DEBT-ledger cut**: this part ships (1)-(3) — the persistence
mechanism itself and its read-back surface. (4) is genuine forward-looking
economy/content design (what does a lifetime Soul total unlock — a shop
good? a milestone rider on a specific card? there is no shop system live
yet, per `Character.currency`'s own "shops have not landed" doc comment) and
needs its own design pass, not a decision buried in a wiring tick. Deferred
to a new Follow-up, Part 1c.

### Current state (verified in code, before this tick)

- `CombatEncounterState.souls` (Part 1's precedent field) is strictly
  per-combat: initialized to 0 in `initializeCombatEncounter`, spent by
  `reap`/`reap_all`, and simply discarded — nothing read it back at combat
  end. Every unspent Soul a Harvest deck ended a fight holding evaporated.
- `Character` already has exactly this shape of precedent:
  `floatingDice?: ('heart'|'body'|'mind'|'wild')[]` (Spec 32 v3 §5) — an
  optional, sparse, combat-state-derived field written back at combat end by
  `CombatEncounterPanel.applyHazardOutcome` (mobile), on **every** outcome
  (victory, defeat, mercy, capitulate, concede, flee alike — "persists
  regardless of how the fight ended"). No `GAME_STATE_VERSION` bump was
  needed to add it — optional fields on an already-permissive save shape
  don't require a migration hop, only ones that change the MEANING or
  requiredness of an existing field do (see `game.migrate.ts`'s v11→v12/
  v12→v13/v13→v14 hops, all of which restructure or backfill existing
  required shapes, never merely add an optional one).
- `applyHazardOutcome` already writes `floatingDice` back unconditionally in
  the same `store.setState` call that handles the outcome-conditional HP/XP/
  loot branches — the exact call site a second unconditional write-back
  slots into.
- The Memoir screen's REMAINS section (Phase 6) is the established home for
  "durable records read back outside their own outcome screen" — death
  tombstones (`hazardDeathCount`) and Rest/LootCache keepsakes both live
  there, both narrated via a singular/plural/zero line function
  (`buildDeathLine`) per Hard Rule #8 (no display literals in the screen).

### Decisions made upfront — DO NOT ASK

- **Field name `Character.bankedSouls`, optional + sparse, NO migration** —
  mirrors `floatingDice` exactly rather than introducing a new
  `GAME_STATE_VERSION` hop. A migration is for restructuring/backfilling an
  EXISTING required shape; a brand-new optional field needs none (precedent:
  `floatingDice` itself shipped with no version bump). This directly
  contradicts the brief's original one-liner ("a migration") — the
  correction is that `floatingDice` already proved the simpler path works
  and is the closer precedent than a hypothetical new migration hop.
- **Write-back is unconditional, every outcome** — `bankedSouls` accumulates
  `finalState.souls ?? 0` in the SAME `store.setState` call `floatingDice`
  already writes in, regardless of victory/defeat/mercy/capitulate/concede.
  Matches `floatingDice`'s own "the jar travels" framing (this Part's own
  design-intent quote uses that exact phrase) — a defeat shouldn't erase
  Souls a Harvest deck had already banked into the running total, any more
  than it erases forged floating dice.
- **Accumulates, never spent by anything yet.** No consumer exists this
  part — `bankedSouls` only grows. This is intentional: (4) milestone-rider
  design (what spends or unlocks off this total) is the explicitly deferred
  Part 1c. Shipping a bank with no spender is the same shape Part 3's DEBT
  ledger and Part 4a's `rungsDeniedTotal` shipped in isolation before their
  payoffs landed — the ledger is real and observable (Memoir reads it)
  before anything consumes it.
- **Mobile surface: Memoir REMAINS, not a HUD meter.** The brief's own
  wording is "a mobile surface to show the carried bank" — a between-fights
  read-back, not a live in-combat meter (in-combat Souls already have their
  own economy via existing card text/events; this is the OUT-of-combat
  lifetime tally). REMAINS is the established home for exactly this kind of
  durable, outside-its-own-screen record (death tally, keepsakes) — adding a
  third row there is more consistent than inventing a new screen or bolting
  a meter onto the persistent header (which is combat/village chrome, not a
  journal).
- **Narrative line, not a raw number, per Hard Rule #8** — `soulsLine`
  ('the jar is empty.' / 'the jar holds a single soul.' / 'the jar holds N
  souls.') mirrors `buildDeathLine`'s singular/plural/zero handling exactly,
  keeping the screen literal-free.

### Outputs

- `src/Character/types.ts`: `Character.bankedSouls?: number` — optional +
  sparse, doc comment cross-references `floatingDice` and this brief.
- `axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx`:
  `applyHazardOutcome` (now exported for direct unit testing) computes
  `soulsRemaining = finalState.souls ?? 0` and folds it into
  `player.bankedSouls` in the same unconditional `store.setState` write that
  already handles `floatingDice`.
- `axiomancer-mobile/state/presenters/memoir.engine.ts`:
  `MemoirRemainsViewModel` gains `bankedSouls: number` + `soulsLine: string`;
  `buildRemains` takes a second `rawBankedSouls` argument (defensively
  coerced: non-finite/missing → 0); new `buildSoulsLine` narrative helper.
- `axiomancer-mobile/app/(tabs)/memoir/index.tsx`: a third REMAINS row
  (`testID="memoir-souls-line"`) rendering `vm.remains.soulsLine`, reusing
  the existing `remainsLine` style — no new style needed.

### Tests

- `axiomancer-mobile/components/combat/encounter/__tests__/CombatEncounterPanel.souls-bank.test.ts`
  (new): banks unspent souls onto a fresh character; accumulates across
  repeated combats rather than overwriting; banks on a DEFEAT outcome too
  (not just victory); a combat that never generated souls contributes 0.
- `axiomancer-mobile/state/e2e/memoir.engine.test.ts`: REMAINS describe
  block extended — defaults to an empty jar; reads `player.bankedSouls` and
  pluralizes the line; floors a missing/non-finite value to 0 defensively.
- Full mechanics (171 files / 2623 tests), mobile (249 files / 2561 tests),
  and card-editor verify gates re-ran green with this change — a
  new-optional-field-only mechanics change with no engine logic, so no
  balance-sim re-run is implicated.

### Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run verify --workspace axiomancer-card-editor
```

Mechanics change is a type-only addition (no engine logic, no migration) —
mobile is the actual behavior change and is mandatory, not a courtesy.
Card-editor re-ran as a courtesy (touches `Character`, not
`CardSpecialMechanic`, so no compile surface there) — green.

### Commit body template

```
feat(mechanics,mobile): Harvest Souls persist across combats — phase 32 part 1b

- Character.bankedSouls (optional + sparse, no migration — floatingDice
  precedent)
- applyHazardOutcome write-back on every outcome, same call site as
  floatingDice
- Memoir REMAINS section: third row, soulsLine narrative helper
- tests: write-back accumulation/defeat-still-banks/zero-souls, memoir
  read-back + defensive coercion

Decisions:
- No new migration hop — an optional field needs none; floatingDice is the
  closer, already-shipped precedent over the brief's original "a migration"
  framing. See brief §Part 1b Decisions.
- Milestone-rider design (what a running Soul total unlocks) further split
  to Part 1c — genuine content/economy design, not wiring. See Follow-ups.
```

## Part 2 — Bulwark: RIPOSTE reflects the prevented blow

### Design intent (source: 2026-07-10-theme-identity.md §2, bulwark/bastion)

> RIPOSTE reflects the prevented blow [CONFIRMED · M]: reflect scales with
> what the wall actually stopped, not a flat 3 — the wall IS the weapon, and
> bigger threats become bigger paydays (doctrine-clean: reflect class).

### Current state (verified in code, before this tick)

RIPOSTE arms with two printed fields — `damage` (flat counter) and `reduce`
(one-shot parry, reduces the first incoming hit this phase). It fires a
FLAT `riposte.damage` counter whenever the phase's attack was fully blocked
(soaked to 0 by parry + GUARD + BARRIER combined), regardless of how big the
blocked blow actually was — `combat.engine.ts` `resolveThreatPhase`, the
`riposte-fired` branch. Two library carriers: `measured-answer` (GUARD 6 +
RIPOSTE 3/parry 2) and `the-adamant-wall` (BARRIER 10 + RIPOSTE 4/parry 2).

### Decision made upfront — DO NOT ASK

- **Floor, not replacement.** The counter becomes
  `max(printed damage, prevented-blow size)` rather than a pure swap to the
  prevented-blow size. A pure swap risks a card countering for LESS than
  today whenever the blocked attack happens to be small (e.g., a weakened or
  soft-controlled enemy telegraph) — a balance regression with no evidence
  budget for a re-tune this tick, same reasoning as Part 1's additive
  erosion call. The floor guarantees the printed number never gets worse
  while still literally shipping "bigger threats become bigger paydays."
- **"Prevented blow" = the pre-soak size of the specific attack(s) that
  ended up fully blocked**, summed across the phase if more than one threat
  effect carries damage (rare today, but the loop already iterates
  `phase.threatAction.effects`). Captured as `preSoakDmg` before parry/
  GUARD/BARRIER subtract from it, accumulated into `blockedBlowTotal` only
  on the branch that already increments `attacksFullyBlocked`. A partially
  blocked attack (some damage still lands) does not contribute — the design
  language is "the prevented BLOW," not "prevented damage in general."
  Scaled by the same `getDamageTakenMultiplier(enemy)` the flat path
  already applied.
- **No field/schema change.** `riposte.damage` keeps its name and meaning
  (a floor, now, instead of the whole story) — no `CombatSpecialMechanic`
  shape change, no card data migration. Matches Part 1's "erosion is a
  property of the verb, not a per-card rider" framing: the scaling is
  engine behavior, not something a card author opts into per-card.
- **Pricing untouched.** `riposteFactor` prices `(damage + reduce)` as
  before — the scaling upside is unscored bonus riding an already-paid
  effect, identical in spirit to Part 1's erosion bonus. Comment updated
  in `cards.pricing.ts` and both cards' `// pts:` lines to note the floor
  framing (prose only, no numeric change).
- **Keyword copy updated** (`axiomancer-mobile/state/combat/keywords.ts`)
  so the RIPOSTE gloss stops implying a fixed counter — "or more, if the
  blow you stopped was bigger." Avoids adding another lying-copy finding
  to the pattern already flagged elsewhere in `plan/CRITIQUE.md`.

### Outputs

- `combat.engine.ts` `resolveThreatPhase`: new `blockedBlowTotal`
  accumulator; `preSoakDmg` captured before RIPOSTE-parry/GUARD/BARRIER
  reduce `dmg`; counter computed as
  `Math.round(Math.max(riposte.damage, blockedBlowTotal) * getDamageTakenMultiplier(enemy))`
  instead of `Math.round(riposte.damage * ...)`. `riposte-fired` event
  shape unchanged (`{ kind, amount }`) — `amount` now honestly reports the
  live counter.
- `cards.pricing.ts`: `riposteFactor` doc comment notes the floor framing.
- `cards.library.ts`: `measured-answer` / `the-adamant-wall` `// pts:`
  comments note the floor framing.
- `axiomancer-mobile/state/combat/keywords.ts`: RIPOSTE gloss updated.

### Tests

- `status-depth-combat.engine.test.ts` RIPOSTE describe block: two new
  cases — counter scales past the printed floor when the blocked blow is
  bigger (floor set to 1, asserts `amount > 1` and enemy HP loss equals the
  event amount); counter stays at the printed floor when the blocked blow
  is smaller (floor set to 500, asserts `amount === 500`). Existing three
  RIPOSTE cases (flat-8 full-block, no-fire-on-landed-hit, Measured Answer
  arming) re-verified green unmodified — the flat-8 case's real attack
  magnitude is below 8, so the floor path (not the scaling path) fires,
  proving backward compatibility.

### Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

Mobile-visible: only the keyword gloss string changed (no type/contract
change) — `axiomancer-mobile` verify is a courtesy check, not gating.

### Deploy gate

```bash
npm run deploy:check
```

### Commit body template

```
feat(mechanics): RIPOSTE reflects the prevented blow — phase 32 part 2

- blockedBlowTotal tracking + scaled counter in resolveThreatPhase
- printed riposte.damage becomes a floor, not the whole story
- pricing/card comments + keyword copy updated to match
- tests: scales past the floor, holds at the floor, existing 3 green

Decisions:
- Floor (max(printed, prevented-blow)) over pure replacement — see brief
  §Part 2 Decisions; avoids a counter-strength regression with no
  evidence budget for a re-tune this tick.
```

## Part 3 — Akrasia: DEBT ledger

### Design intent (source: 2026-07-10-theme-identity.md §"Akrasia / penitent")

> FALLEN (>=2 self-afflictions) flickers on trivially; blood costs read as
> cosmetic surcharges. DEBT ledger [CONFIRMED, M]: count blood paid, tier the
> payoffs — resolve the cash-out semantics (does absolution reset a tier?).

The source doc bundles four akrasia items under one section (DEBT ledger,
Absolution fork, Last Word, Sin-priced FREE lines). **Split here**, same as
Part 1: this part ships only the CONFIRMED-M DEBT ledger core. Absolution
fork, Last Word, and Sin-priced FREE lines are follow-ups, not blocking this
tick.

### Current state (verified in code, before this tick)

FALLEN check: `getDistinctDebuffCount(state.player) >= 2`
(`combat.engine.ts:1693`). `crown-of-thorns` already scales a persistent
intensity bonus with debuff depth while FALLEN, but nothing counted
cumulative blood PAID — akrasia's RECOIL cost (`self-flagellant` 5,
`pact-of-akrasia`'s FREE-line 1, `fate.recoilHp`) was spent and forgotten each
play, no running total, no payoff for sustained sin. `souls` (Harvest theme
currency) was the existing precedent for a per-combat running counter
threaded through `CombatEncounterState`.

### Decisions made upfront — DO NOT ASK

- **"Blood paid" = RECOIL only** (the `recoil`/`recoil_x` mechanics,
  `CardRider.recoil` on both FREE and PAID lines, `fate.recoilHp`).
  Self-inflicted DoT ticks (sweet-poison's/pact-of-akrasia's self-bleed) are
  excluded: they ride the SAME shared damage-instance clock any
  enemy-inflicted BLEED would use, and `dot-tick` events carry no
  `sourceId` — crediting HP loss by origin at tick time needs new
  attribution plumbing, out of scope for an M-sized additive part, and
  exactly the double-crediting risk this doc flags. Self-MARK is excluded on
  the numbers, not by policy: MARK's payload carries no `damageOverTime`, so
  it never causes HP loss to credit. RECOIL is also the theme's own existing
  "blood price" idiom on every akrasia card — a clean, unambiguous signal.
- **Tier size 6 HP, payoff 1 GUARD per tier crossed while FALLEN.**
  `AKRASIA_DEBT_TIER_HP = 6` (close to `self-flagellant`'s printed RECOIL 5,
  so one big blood price crosses roughly one tier; `pact-of-akrasia`'s
  smaller incidental 1 HP needs several plays — rewards sustained sin, not a
  spike). `AKRASIA_DEBT_TIER_GUARD = 1` — the same "blood buys armor" idiom
  `pact-of-akrasia` already prints (1 HP -> 2 Guard) but at roughly a third
  of that rate, since this is a passive dividend riding EVERY akrasia RECOIL
  source rather than a single authored per-card trade. The ledger itself
  always accrues regardless of FALLEN; only the GUARD payoff is gated (same
  pre-play FALLEN check other FALLEN riders use). Deliberately GUARD- (not
  heal/cleanse-) flavored so it doesn't preempt the deferred Absolution
  fork's heal+cleanse cash-out design space, and doesn't touch
  `crown-of-thorns`'s existing formula at all.
- **Cash-out semantics explicitly NOT resolved this part.** The ledger has
  no reset/cash-out path; it only ever grows this combat. Whether a future
  Absolution cash-out zeroes `akrasiaDebt` back to 0 (forfeiting banked
  tiers for the heal+cleanse spike) or leaves it untouched is punted to that
  follow-up by design.
- **Per-combat reset**, confirmed — `akrasiaDebt` initializes to 0 in
  `initializeCombatEncounter` only (never reset at `startTurn`, unlike
  `recoilPaidThisTurn`), same lifecycle as `souls`. No save-schema/cross-run
  persistence, matching how Part 1b split cross-run Soul persistence into
  its own future part.

### Outputs

- `src/Combat/effects.ts`: `AKRASIA_DEBT_TIER_HP`, `AKRASIA_DEBT_TIER_GUARD`
  constants + pure `akrasiaDebtTiersCrossed(before, after)` helper.
- `src/Combat/combat.encounter.types.ts`: `akrasiaDebt?: number` on
  `CombatEncounterState`; new `CombatEvent` variants `{ kind: 'debt-paid';
  amount; total }` and `{ kind: 'debt-tier-payoff'; tiersCrossed; guard;
  total }`.
- `src/Combat/combat.engine.ts`: ledger accrual + FALLEN-gated tier-GUARD
  payoff wired into both blood-price call sites — `applyRiderToState`'s
  `r.recoil` branch (FREE line, e.g. `pact-of-akrasia`) and
  `playBottomAction`'s existing `recoilTaken` fold (PAID `recoil`/`recoil_x`
  mechanics + `fate.recoilHp`, e.g. `self-flagellant`).
- `src/Cards/cards.library.ts`: prose-only `// pts:` comment updates on
  `self-flagellant` and `pact-of-akrasia` (no numeric change).

### Tests

- New engine e2e (`src/Combat/e2e/akrasia-debt-ledger.engine.test.ts`): pure
  tier-crossing arithmetic; RECOIL-mechanic accrual without crossing a tier;
  crossing a tier WHILE FALLEN grants the GUARD payoff; crossing a tier NOT
  FALLEN still accrues the ledger but grants no GUARD; the FREE-line
  `CardRider.recoil` path posts to the same ledger; per-combat scope (starts
  at 0 fresh); a full `COMBAT_SIM_POLICY_ORDER` x seed sweep on the Penitent
  preset deck runs without crashing.
- Re-ran `combat-playtest.balance-bands.sim.test.ts` and
  `combat-playtest.card-coverage.sim.test.ts` cold — zero pin changes
  (penitent early=0.98 mid=0.30 late=0.00, curve `move=-0.98 OK`,
  `KNOWN_CURVE_VIOLATORS` stays empty) — confirmed additive, no re-tune
  needed.

### Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

163 files / 2555 tests green. Courtesy cross-package checks (touched
`src/Combat/**` type unions): `axiomancer-mobile` verify green,
`axiomancer-card-editor` type-check green.

### Commit body template

```
feat(mechanics): Akrasia DEBT ledger — phase 32 part 3

- akrasiaDebt per-combat ledger + tier-crossing helper
- FALLEN-gated GUARD payoff wired into both RECOIL call sites
- debt-paid / debt-tier-payoff events
- tests: tier math, FALLEN-gated payoff, FREE-line path, sim sweep

Decisions:
- Blood paid = RECOIL only, not self-DoT ticks or self-MARK — see brief
  §Part 3 Decisions.
- Tier 6 HP / payoff 1 GUARD while FALLEN — additive, doesn't touch
  crown-of-thorns or preempt the deferred Absolution cash-out design.
- Cash-out/tier-reset semantics explicitly deferred to the Absolution-fork
  follow-up, not resolved here.
```

## Part 4a — Control: TURNABOUT

### Design intent (source: 2026-07-10-theme-identity.md §2, Control / standstill section)

> TURNABOUT [CONFIRMED · M]: a finisher that CONSUMES accumulated denial
> (`rungsDeniedTotal`) — the theme finally banks what it does.

Context quote from the same doc: "Control / standstill — denial must be
sized, timed, and spent. Flat 2-rung telegraphs + abundant stagger = denial
is automatic; BACKFIRE is a de facto DoT." The theme converted denial into
BACKFIRE drip only; there was no capstone letting the player cash out
everything the deck had denied over the fight. TURNABOUT is that capstone,
matching the shape of Harvest's `reap_all` (Part 1) and the Akrasia DEBT
ledger (Part 3): a per-combat running counter fed by an existing mechanic,
read (and here, CONSUMED) by a new payoff.

### Current state (verified in code, before this tick)

- `resolveThreatPhase` (`combat.engine.ts`) already computes, every phase,
  `rungsTotal`/`rungsLost`/`rungDenied` via `computeRungDenial(state)` and
  `rungsForBackfire = hindered ? rungsTotal : rungsLost` — "rungs actually
  denied this phase," the exact quantity BACKFIRE's per-phase drip already
  spends. Nothing banked it across phases; a denied phase's rungs were
  spent (on the BACKFIRE drip, if any) and then forgotten.
- Control (`src/Cards/cards.library.ts`) held 7 cards: 2 commons
  (`zenos-half-step` STAGGER 1, `red-herring` BACKFIRE i2d2), 2 uncommons
  (`undistributed-middle`, `arrow-paradox`), and 3 rares —
  `paralysis-of-analysis` (tier 3 rank 5, the rare SPELL: STAGGER 2 +
  BACKFIRE i3d3, the theme's existing "payoff wall"), `achilles-and-the-
  tortoise` (rank 5 enchantment, reward-only — squeezed out of every
  preset's 5/5/5 color law), and `quagmire-of-doubt` (rank 6 disenchant).
  The `standstill` preset's recipe seated `paralysis-of-analysis` as its
  rare-spell slot (`combat.deck-presets.ts`).
- The library, presets, and pricing lint are pinned at EXACT counts
  (`curated-library.engine.test.ts` "is exactly 70 unique cards" / "each
  theme owns exactly 7 cards"; `deck-presets.engine.test.ts`'s 5/5/5 color
  law; `pricing.engine.test.ts`'s "covers all 50 spells") — spec 32's own
  title ("10 themes, 70 cards, 30 keywords") bakes the card count in at the
  same weight as the keyword cap. A genuinely NEW card therefore has to
  occupy an EXISTING seat, not grow the library past 70.

### Decisions made upfront — DO NOT ASK

- **New `specialMechanics` kind `'turnabout'`** with a `burstPerRung: number`
  field on `CardSpecialMechanic` — mirrors `reap_all`'s `burstPerSoul` shape
  exactly (compute a burst from the live bank, apply as direct damage), with
  ONE structural difference: it CONSUMES (zeroes) `rungsDeniedTotal` in the
  same call, rather than reading a still-growing counter the way REAP-ALL
  reads Souls or the DEBT ledger reads cumulative RECOIL. Burst computed
  BEFORE the zero, in one call — no double-count, no stale read.
- **`turnabout` REPLACES `paralysis-of-analysis` in its exact library seat**
  (same id-slot position in `cards.library.ts`, same rank-6-rare-spell
  recipe seat in the `standstill` preset, same `'mind'` `philosophicalAspect`
  for the 5/5/5 color law) — this is the one place this part deviates from
  the "add a new card" framing in the source doc's one-liner: the 70-card /
  7-per-theme / 5-5-5 invariants are pinned counts (see Current state), so a
  brand-new card must occupy an existing seat. `paralysis-of-analysis`'s
  STAGGER+BACKFIRE payoff role is superseded by this capstone; its flavor
  imagery (the half-step, the doorway, the herring) lives on in TURNABOUT's
  prose. **rank 6, not 5** (unlike `the-reaping`'s rank-5 rare-spell
  precedent) — the first SPELL-type Aporia card in the library (every other
  rank-6 card is a disenchant); nothing in the shape contract requires that
  pairing, only theme-level counts (2 common/2 uncommon/3 rare, exactly 1
  enchantment + 1 disenchant), both of which stay intact.
- **`burstPerRung: 1.5`**, sized backward from a target burst: a mid-fight
  Standstill deck denying ~2-4 rungs/phase across ~6-8 phases banks
  roughly 15-25 rungs by the time a rank-6 card is drawn; a ~20-rung bank at
  1.5/rung bursts `round(1.5 x 20) = 30` HP, inside the-reaping's realistic
  burst range (burstPerSoul 4 x a ~5-10 Soul bank = 20-40). Priced via new
  `VERB_POINTS.turnabout` (5, same base as `reapAll` — the same "ALL-
  spender capstone" archetype) and `VERB_POINTS.expectedRungsDenied` (20,
  the same brief arithmetic): `scoreMechanic` = 5 + 1.5x20/3 = 15; + FREE
  reveal-the-next-stance (1.5, control's currency) = 16.5, in-band for rare
  [7,19].
- **Ledger accrues unconditionally, every phase, regardless of gating** —
  `rungsDeniedTotal += rungsForBackfire` (the SAME expression BACKFIRE
  reads) fires whether or not BACKFIRE itself is live this combat; a phase
  that denied nothing contributes 0, so plain accumulation needs no extra
  gate (matches the DEBT ledger's "accrues unconditionally, only the payoff
  is gated" shape, except TURNABOUT's "payoff" IS the whole mechanic, so
  there is no separate gate to speak of).
- **Per-combat scope, reset to 0 in `initializeCombatEncounter`** — like
  `souls`/`akrasiaDebt`. UNLIKE those two, `rungsDeniedTotal` is CONSUMED
  (zeroed) by `turnabout`'s own play, not merely read — the design brief's
  own wording ("a finisher that CONSUMES accumulated denial") is explicit
  that this differs from the Souls/DEBT precedent, which only ever grow.
- **Attribution**: `recordAttribution`/`directDamage` count the burst the
  same way `reap_all`'s burst is counted (direct damage, not double-
  counted) — identical code path, no new attribution surface.
- **New event, not an overloaded one**: `{ kind: 'turnabout-fired'; cardId:
  string; rungsSpent: number; amount: number }` — mirrors `reaped`'s shape,
  own event so nothing about `reaped`'s existing consumers changes.
- **Display badge: "BACKFIRE ALL," not a new keyword.** TURNABOUT is a
  one-card mechanic (`docs/keyword-atlas.md`'s row policy: "one-card
  mechanics stay card-local... gets NO atlas row"), and its fantasy — cash
  the whole denial ledger BACKFIRE already meters — is BACKFIRE's own
  finisher variant, the same relationship REAP ALL / RUPTURE ALL have to
  REAP / RUPTURE. Printed as `BACKFIRE ALL — 1.5 damage per rung ever
  denied` (`combat.cards.ts` `mechanicText`) and keyed to the existing
  `Backfire` keyword badge on mobile (`keywordForMechanic`), not a 31st
  registry keyword — the 30-keyword proving gate is untouched. Prior art:
  kb:dawncaster/keywords/momentum.okf.md (src-001, community, medium) — the
  closest Dawncaster analogue (a banked counter cashed at a point), though
  theirs auto-fires at a threshold for a card-draw dividend rather than
  being spent by the player for an HP burst; only the "a passive tally
  becomes a real payoff" shape transfers, not the magnitude.

### Outputs

- `src/Combat/combat.encounter.types.ts`: `rungsDeniedTotal?: number` on
  `CombatEncounterState`; new `CombatEvent` variant `{ kind:
  'turnabout-fired'; cardId: string; rungsSpent: number; amount: number }`.
- `src/Combat/combat.engine.ts`: `resolveThreatPhase` accrues
  `rungsDeniedTotal` at the same site `rungsForBackfire` is computed (before
  the BACKFIRE drip block); `initializeCombatEncounter` resets it to 0; a
  new `'turnabout'` case in `playBottomAction`'s specialMechanics switch
  computes the burst from the live ledger, applies it via the same
  direct-damage path `reap_all` uses, zeroes the ledger, and pushes
  `turnabout-fired`.
- `src/Cards/types.ts`: `CardSpecialMechanic` gains the `'turnabout'`
  variant (`{ kind: 'turnabout'; burstPerRung: number }`).
- `src/Cards/cards.pricing.ts`: `VERB_POINTS.turnabout` (5) and
  `VERB_POINTS.expectedRungsDenied` (20); `scoreMechanic`'s `'turnabout'`
  case.
- `src/Cards/cards.library.ts`: `turnabout` (tier 3, rank 6, control,
  `'mind'` aspect) replaces `paralysisOfAnalysis` in its exact library slot,
  with a `// pts:` comment showing the arithmetic + the seat-replacement
  rationale + the KB citation.
- `src/Combat/combat.deck-presets.ts`: `standstill`'s recipe rare-spell
  argument becomes `'turnabout'` (was `'paralysis-of-analysis'`).
- `src/Combat/combat.cards.ts`: `'turnabout'` added to `PAYOFF_KINDS`
  (classifies as `direct-damage`, matching `reap_all`/`rupture`); a
  `mechanicText` case printing `BACKFIRE ALL — <N> damage per rung ever
  denied`.
- `src/test-utils/card-fixture.ts`: `rungsDeniedTotal: clean ? 0 : 20` on
  the shared RICH/CLEAN fixture (mirrors `souls`'s precondition-buffet
  precedent) so the effectiveness lint and the doctrine witness both have a
  legal ledger to consume / a zeroed one to prove against.
- `src/Cards/e2e/card-effectiveness.engine.test.ts`: `'turnabout'` case in
  the exhaustive `assertMechanic` switch.
- `src/Combat/e2e/control-surfaces.sim.test.ts`,
  `src/Combat/e2e/status-depth-combat.engine.test.ts`: the two id-list
  sweeps referencing `paralysis-of-analysis` updated for its retirement
  (dropped / swapped to `turnabout`'s own `direct-damage`/`none`
  classification).
- Courtesy cross-package updates (new `specialMechanics` kind — mandatory
  per the blast-radius rule): `axiomancer-mobile/state/combat/keywords.ts`
  (`turnabout: 'Backfire'` in `MECHANIC_KEYWORD`),
  `axiomancer-mobile/state/presenters/combat-encounter.engine.ts`
  (`'turnabout'` in `MECH_HEADLINE_PRIORITY` + a `mechanicHeadline` case —
  required by `card-face-honesty.guard.test.ts`'s "no library card renders
  the ambiguous PAID fallback" sweep),
  `axiomancer-mobile/assets/images/cards/index.ts` (art-mapping key
  renamed), `axiomancer-card-editor/src/data/mechanics.ts`
  (`SPECIAL_MECHANIC_KINDS` gains `'turnabout'` — `mechanics.contract.ts`'s
  compile-time union check fails without it) and
  `axiomancer-card-editor/src/components/CardForm.tsx` (default + numeric
  row for `burstPerRung`).
- `docs/keyword-atlas.md`: BACKFIRE row's notes cell updated with the
  TURNABOUT finisher note + the Momentum receipt (no new row — one-card
  mechanics stay card-local per the row policy).

### Tests

- New engine e2e (`src/Combat/e2e/turnabout-ledger.engine.test.ts`): a
  fully denied threat phase accrues `rungsTotal` (`THREAT_RUNGS`) rungs; a
  non-denied phase accrues 0 (ledger stays flat); a partial rung loss
  accrues only the rungs actually lost; accrual is additive across phases;
  the `turnabout` card banks the full ledger as burst then resets it to 0 in
  the same play; a second `turnabout` play after the reset is a legal no-op
  (banks 0, never fizzles — mirrors `reap_all`'s "always fires" precedent);
  the ledger starts at 0 for a fresh combat; a full
  `COMBAT_SIM_POLICY_ORDER` x seed sweep on the `standstill` preset runs
  without crashing.
- Re-ran `combat-playtest.balance-bands.sim.test.ts` and
  `combat-playtest.card-coverage.sim.test.ts` cold before AND after — zero
  pin drift (numbers in the commit body / final report).

### Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

Cross-package: touches `src/Cards/**` (new `specialMechanics` union member)
and `src/Combat/**` (new `CombatEncounterState` field + `CombatEvent`
variant) — `axiomancer-mobile` verify and `axiomancer-card-editor`
type-check are BOTH mandatory per the blast-radius rule (witness:
`grant_permanent_wild_die`), not merely a courtesy this time.

### Commit body template

```
feat(mechanics): Control TURNABOUT — cash the denial ledger — phase 32 part 4a

- rungsDeniedTotal per-combat ledger, accrued at BACKFIRE's own rungsForBackfire site
- new 'turnabout' specialMechanics kind + engine case (consumes, doesn't just read)
- turnabout-fired event; BACKFIRE ALL display badge (no new keyword)
- turnabout card replaces paralysis-of-analysis's exact library/preset seat
- cross-package: mobile presenter/keyword wiring + card-editor union update
- tests: ledger accrual (denied/non-denied/partial/additive), cash-out +
  no-op replay, per-combat scope, sim sweep

Decisions:
- New card occupies an EXISTING seat (paralysis-of-analysis's) rather than
  growing the pinned 70-card / 7-per-theme library — see brief §Part 4a
  Decisions.
- rank 6 (not 5) — the first spell-type Aporia card; theme-level counts
  (not per-rank pairing) are what the shape contract actually pins.
- Display badge "BACKFIRE ALL," not a new keyword — one-card mechanics stay
  card-local per the keyword-atlas row policy; 30-keyword gate untouched.
```

## Part 4b — Oratory: milestone drip

### Design intent (source: 2026-07-10-theme-identity.md §2, Peroration / oratory section)

> Milestone drip every 3rd Premise [CONFIRMED · M]: the build pays small
> dividends DURING construction — the arc gets rungs.

Context quote from the same doc: "Highest distinctiveness on paper (Premises
are a real unique resource); zero visibility (Premises have no combat-UI
rendering at all) and a dead build (CONCEDE arrives unannounced)." The other
three oratory items (fix-the-closing-word, show-the-case UI, OBJECTION
enemies) are explicit follow-ups, not this part's scope — same split
discipline as Parts 1/3's CONFIRMED-only cut.

### Current state (verified in code, before this tick)

- Every Premise source funnels through one function, `gainPremises`
  (`combat.engine.ts`): the `premise` specialMechanics kind (`exordium`,
  `mounting-case`), `CardRider.premises` (FREE lines and omen riders alike),
  and `mounting-case`'s `heart×2` threshold rider. A single insertion point,
  unlike the DEBT ledger's two independent RECOIL call sites.
  `CombatEncounterState.premises` is the SPENDABLE tally: it resets to 0 the
  moment a Peroration pays off (`decl.at`) OR CONCEDE fires
  (`decl.concedeAt`) — there was no separate lifetime counter, so nothing
  could track "how many Premises has the player EVER banked this combat"
  across a payoff/CONCEDE boundary.
- "Rungs" = STAGGER currency (`CombatEncounterState.staggerRungs`,
  `THREAT_RUNGS`/`THREAT_RUNGS_BOSS` = 2/3 per telegraphed phase). An
  existing `stagger` specialMechanics kind already increments
  `staggerRungs` directly and pushes a `staggered` event — the exact verb
  this drip reuses, no new engine primitive required.
- Precedent for an un-authored, engine-side "passive dividend riding an
  existing ledger": the Akrasia DEBT ledger's tier-GUARD payoff
  (`AKRASIA_DEBT_TIER_GUARD`, Part 3) — a free-standing `effects.ts`
  constant, not a `VERB_POINTS` entry, because the dividend isn't authored
  on any single card.

### Decisions made upfront — DO NOT ASK

- **New lifetime counter, not a reuse of the spendable `premises` tally.**
  `CombatEncounterState.premiseMilestoneTotal` accrues by the SAME `amount`
  every `gainPremises` call adds to `premises`, but — unlike `premises` —
  is NEVER reset by a Peroration payoff or CONCEDE. Reusing the resettable
  tally for milestone math would "un-cross" a milestone already paid the
  instant the build cashes out, which contradicts "the build pays small
  dividends DURING construction" (the dividends are a record of effort
  spent, not a live balance). Same per-combat, never-resets-except-by-a-
  named-consumer shape as `akrasiaDebt` (Part 3) — except nothing consumes
  this one; it only ever grows, all combat, like `souls`.
- **Every {@link PREMISE_MILESTONE_EVERY} (3) Premises grants
  {@link PREMISE_MILESTONE_RUNGS} (1) STAGGER rung, engine-side and
  unconditional** — no FALLEN-style state gate. The source doc's own
  framing ("every 3rd Premise") is a flat cadence, not a conditional
  payoff, so accrual funnels through the milestone check unconditionally,
  matching TURNABOUT's `rungsDeniedTotal` accrual (Part 4a) more than the
  DEBT ledger's FALLEN-gated payoff (Part 3).
- **Universal across every Premise SOURCE**, not scoped to Oratory-authored
  cards only. A future cross-theme Premise grant (e.g. an omen rider) would
  count toward the same milestone counter — matches "erosion is a property
  of the verb, not a per-card rider" (Part 1's framing) applied to
  `gainPremises` itself rather than to a single specialMechanics kind. Flagged
  as the one place this differs from a strictly theme-local reading of the
  source doc's one-liner; the alternative (theme/source-scoped accrual) would
  need new attribution plumbing `gainPremises` doesn't have today, same
  "out of scope for an M-sized additive part" reasoning Part 3 used to
  exclude self-DoT ticks from the DEBT ledger.
- **No new `VERB_POINTS` entry, no card pricing change.** Same precedent as
  `AKRASIA_DEBT_TIER_GUARD`: the dividend rides EVERY Premise source already
  priced at `V.premise` (0.8/tally point) — it is a property of the ledger,
  not an authored verb any single card opts into, so the per-rank pricing
  lint never sees it and no card's `// pts:` comment needs updating.
- **Own event kind, not an overload.** `{ kind: 'premise-milestone';
  tiersCrossed; rungs; total }` fires ALONGSIDE the existing `premise-gained`
  event (never replacing it) — identical convention to `debt-tier-payoff`
  (Part 3) and `max-hp-eroded` (Part 1): existing `premise-gained` consumers
  stay byte-identical.
- **No card text/data changes.** Like the DEBT ledger, this is a pure
  engine-side dividend with no `specialMechanics` field and no card literal
  touched — `exordium`/`mounting-case`/`the-closing-word` etc. are unchanged.
- **No new keyword-atlas row.** Row policy: one-card/engine-wide-drip
  mechanics stay card-local or ride an existing row as a note (TURNABOUT
  rode BACKFIRE's row in Part 4a). This drip rides the PREMISE row's own
  notes cell (its accrual side) and gets a one-line cross-reference on the
  STAGGER row (its payoff side, a cross-theme synergy) — no 31st keyword,
  the 30-cap proving gate is untouched.

### Outputs

- `src/Combat/effects.ts`: `PREMISE_MILESTONE_EVERY` (3),
  `PREMISE_MILESTONE_RUNGS` (1) constants + pure
  `premiseMilestonesCrossed(before, after)` helper — identical shape to
  `akrasiaDebtTiersCrossed`, parameterized by the Premise tier size.
- `src/Combat/combat.encounter.types.ts`: `premiseMilestoneTotal?: number`
  on `CombatEncounterState`; new `CombatEvent` variant `{ kind:
  'premise-milestone'; tiersCrossed: number; rungs: number; total: number }`.
- `src/Combat/combat.engine.ts`: `initializeCombatEncounter` resets
  `premiseMilestoneTotal` to 0; `gainPremises` accrues it alongside
  `premises` (before either the Peroration-payoff or CONCEDE reset paths
  touch `premises`), computes `premiseMilestonesCrossed`, and — when
  positive — adds `tiersCrossed * PREMISE_MILESTONE_RUNGS` to
  `staggerRungs` and pushes `premise-milestone`.
- `docs/keyword-atlas.md`: PREMISE row's notes cell gets the milestone-drip
  note; STAGGER row's notes cell gets a one-line cross-theme
  cross-reference (mirrors the BACKFIRE/TURNABOUT precedent's two-sided
  documentation).
- No cross-package changes required — no new `specialMechanics` kind, no
  card field, and `premise-milestone`/`premise-gained` are not consumed by
  any mobile presenter or the card editor today (same "internal ledger
  event, no UI consumer yet" status as `debt-tier-payoff`/`turnabout-fired`).
  Mobile verify + card-editor type-check run anyway per the blast-radius
  rule (`src/Combat/**` touched) — both green.

### Tests

New engine e2e (`src/Combat/e2e/premise-milestone-drip.engine.test.ts`):
pure tier-crossing arithmetic (no crossing within a tier, exactly one
crossing, multiple tiers in one grant, never negative); a FREE-line
`exordium` play below the first tier accrues the lifetime counter but pays
no dividend; crossing the first tier via the FREE line grants the printed
STAGGER rungs and fires `premise-milestone` alongside `premise-gained`; the
SAME accrual fires on the PAID-line `premise` specialMechanics path; the
lifetime counter survives a Peroration payoff that resets the spendable
`premises` tally (a milestone banked before the payoff stays banked, and the
very play that pays off the Peroration can also cross a new tier); per-combat
scope (starts at 0 fresh); a full `COMBAT_SIM_POLICY_ORDER` × seed sweep on
the Oratory preset deck runs without crashing. 11/11 new tests green.
Re-ran `combat-playtest.balance-bands.sim.test.ts` and
`combat-playtest.card-coverage.sim.test.ts` cold — zero pin drift (oratory
early=1.00 mid=0.57 late=0.43, curve `move=-0.57 OK`), confirming the
additive/universal design needs no re-tune.

### Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

167 files / 2588 tests green. Cross-package (touches
`src/Combat/**`): `axiomancer-mobile` verify (2554 tests) and
`axiomancer-card-editor` type-check both mandatory per the blast-radius
rule — both green.

### Commit body template

```
feat(mechanics): Oratory milestone drip — phase 32 part 4b

- premiseMilestoneTotal per-combat lifetime ledger (never resets, unlike
  the spendable premises tally it rides alongside)
- premiseMilestonesCrossed tier-crossing helper (akrasiaDebtTiersCrossed
  shape, parameterized by PREMISE_MILESTONE_EVERY)
- gainPremises grants PREMISE_MILESTONE_RUNGS STAGGER rungs per milestone,
  unconditional, universal across every Premise source
- premise-milestone event fires alongside premise-gained
- keyword-atlas: PREMISE row (accrual) + STAGGER row (cross-theme payoff)
- tests: tier arithmetic, FREE/PAID accrual parity, survives a Peroration
  payoff reset, per-combat scope, sim sweep

Decisions:
- Separate never-resetting lifetime counter, not the spendable premises
  tally — a milestone already paid must stay paid across a Peroration
  payoff/CONCEDE reset. See brief §Part 4b Decisions.
- Unconditional + universal across every Premise source (no FALLEN-style
  gate, no theme-authored scoping) — matches the source doc's flat "every
  3rd Premise" cadence.
- No VERB_POINTS entry / card pricing change — an un-authored ledger
  dividend, same precedent as AKRASIA_DEBT_TIER_GUARD.
```

## Part 4c — Forge: OVERHEAT

### Design intent (source: 2026-07-10-theme-identity.md §2, Forge / foundry section)

> OVERHEAT [CONFIRMED · M]: pips past the cap allowed behind a bust condition
> — the press-your-luck knob the theme is begging for (KB receipt: Quacks of
> Quedlinburg).

Context quote from the same doc: "Forge / foundry — press-your-luck, not a
token battery. Everything overflows into +1 Conviction; The Overtake fires
for 18 on turn 1 because nothing marks a CHARGED Overtake." The other four
forge bullets (FREE lines forge, Overtake legibility, manufactured spends
feed EMBER not MARK, ex-nihilo's wild/colored choice) are explicit
follow-ups, not this part's scope — same split discipline Parts 1/3/4b
already used (cut to the one CONFIRMED-M item).

### Current state (verified in code, before this tick)

- Pips are a `CombatManaDie.pips?: number` field (`combat.encounter.types.ts`).
  The Reserve (`CombatEncounterState.reserve`, max `RESERVE_MAX` = 2 dice)
  ripens +1 pip per threat phase survived via `ripenReserve`
  (`combat.dice.ts`), hard-capped at `RESERVE_PIP_CAP` = 2 — a die already at
  the cap simply stops accepting pips, silently, with no event and no
  alternative. `grant_pip` (the PAID pip-granting `specialMechanics` kind)
  calls the same `ripenReserve` per count and only recently (WS4.1, sandboxed
  `slag-runoff`) gained an OPTIONAL `overflow` rider that converts a wasted
  pip into a printed effect instead of dropping it — a deterministic
  conversion, not a risk.
- Nothing downstream re-clamps `pips` at `RESERVE_PIP_CAP`: `poweringPips`
  (the powering die's pip count) feeds `PIP_INTENSITY_BONUS`/defend-card pip
  Guard uncapped, and `spend_all_pips` sums every Reserve/floating pip
  uncapped (spec 32 §12 item 5 — ALL-spenders are uncapped by design). The
  cap lives ONLY inside `ripenReserve`'s own gate — the one place a die is
  ever prevented from holding more pips.
- Forge's 7-card roster (`src/Cards/cards.library.ts`): 2 commons
  (`sketch-of-a-thought` KINDLE, `half-step` GUARD 5 + `grant_pip` 2), 2
  uncommons (`bootstrap-loop`, `ex-nihilo`), 3 rares (`the-overtake` the
  `spend_all_pips` + RUPTURE finisher, `anvil-of-form` enchant, `entropy-tax`
  disenchant). `half-step` is the theme's most-played card by a wide margin
  (`cards.thoughtforms.ts`'s own comment cites 25,958 aggregate plays across
  the matrix) and the ONLY forge card carrying `grant_pip` — the sole
  existing carrier of "the cap" this part's mechanic answers.
- The library, presets, and pricing lint are pinned at EXACT counts (same
  invariant Part 4a's "Current state" documents in full) — a genuinely NEW
  card would have to occupy an existing seat, not grow the library past 70.

### Decisions made upfront — DO NOT ASK

- **Additive retrofit onto `half-step`, not a new card occupying a seat.**
  Unlike TURNABOUT (Part 4a), OVERHEAT does not need a brand-new capstone
  verb — it is a natural THIRD `specialMechanics` entry riding
  `half-step`'s EXISTING `grant_pip` (which safely fills a Reserve die to
  `RESERVE_PIP_CAP`) with a new `{ kind: 'overheat'; pips: 1 }` leg that
  offers to push the SAME die further. `guard`/`grant_pip` are UNCHANGED
  (additive, not replacement — Parts 1/2's "floor, not swap" reasoning): a
  Half-Step play still safely ripens to the cap exactly as before, and only
  THEN risks the extra pip. This avoids the 70-card/7-per-theme/5-5-5
  seat-replacement machinery entirely (no preset recipe edit, no id
  retirement, no rank/aspect renegotiation) — a materially smaller, safer
  diff than Part 4a's capstone-replacement shape for an M-sized item.
- **New `specialMechanics` kind `'overheat'`, `{ pips: number }`** — a
  count of waves to attempt, mirroring `grant_pip`'s `count` shape. Engine-
  owned pure helper `overheatReserve` (`combat.dice.ts`, sibling to
  `ripenReserve`): a die already BELOW `RESERVE_PIP_CAP` ripens for free, no
  risk (OVERHEAT only prices the overage `ripenReserve` already refuses); a
  die AT or ABOVE the cap (and below the new `OVERHEAT_PIP_CEILING` = 4 hard
  bookkeeping ceiling) rolls `OVERHEAT_BUST_CHANCE` (35%) per pip attempted.
- **A bust HALVES (floors) the targeted die's pips — it does NOT zero them.**
  This is the one place this part deviates from "wipe it" as the obvious
  bust shape: the KB receipt itself (Quacks of Quedlinburg — see below) costs
  a bust PARTIALLY ("must choose points or coins, not both"), never the
  whole pot. Zeroing a die that took 2+ threat phases to ripen would make a
  single Half-Step play capable of erasing several turns of patient banking
  in one unlucky roll — a downside disproportionate to the M-sized item's
  evidence budget (no A/B this tick to retune `half-step`'s printed
  guard/pips against a harsher bust). Halving is a real, felt setback (the
  die's future intensity/Guard cash-out drops by half) without being a trap.
- **Pricing is a genuine EV calculation, not a free pip.** `VERB_POINTS`
  gains no new named constant (the formula reuses the existing `V.pip` and
  `V.expectedPips` table entries plus the imported `OVERHEAT_BUST_CHANCE`
  probability): per attempted pip, `(1 − bustChance) × V.pip − bustChance ×
  0.5 × V.expectedPips × V.pip` = `0.65×1.5 − 0.35×0.5×2×1.5` = **+0.45**.
  `half-step`'s total moves from 5.75 to **6.2**, still inside the common
  [1.5, 7.5] band (rank 2, Doxa/Lemma) with real headroom. Unlike Part 4b's
  un-authored engine-wide dividend, OVERHEAT IS an authored verb on one
  specific card (a new `specialMechanics` entry), so it gets scored — the
  wiring checklist's "any new authored verb needs a VERB_POINTS entry" rule,
  not the "un-authored ledger dividend" exemption.
- **No new keyword-atlas row.** OVERHEAT rides the existing Forge/PIP row
  (`docs/keyword-atlas.md`) exactly as TURNABOUT rode BACKFIRE's row (Part
  4a) and the milestone drip rode PREMISE's row (Part 4b) — the PIP row's
  own semantics ("+1 pip to a held die") already IS what OVERHEAT extends;
  the card face prints `PIP N past the cap (35% bust: halves the die)`, no
  new bare capitalized term. The 30-keyword proving gate is untouched.
  KB receipt (board-game corpus, not Dawncaster — cited exactly as the
  source doc did): kb:boardgames/the-quacks-of-quedlinburg/rules/overview.okf.md
  (src-003, secondary, high) — white chips accumulate toward a bust
  threshold (sum of white-chip values > 7) and busting costs a real but
  PARTIAL penalty ("players whose pots have exploded must choose points or
  coins — not both"), never a full wipeout; only that partial-loss SHAPE
  transfers to OVERHEAT's halve-not-zero bust, not Dawncaster vocabulary or
  magnitudes (this KB corpus is the board-game reception/rules side, not the
  Dawncaster card corpus the other Part 4 receipts cite).
- **New event, not an overloaded one.** `{ kind: 'overheat-bust'; dieId;
  cardId; pips }` fires ALONGSIDE the existing `die-ripened` event on a
  SUCCESSFUL push (a successful overheat push is mechanically just a ripen
  past the cap, so it reuses `die-ripened` unchanged) — `overheat-bust` only
  fires on the bust half of the gamble, so `die-ripened`'s existing
  consumers are unaffected, matching `debt-tier-payoff`/`max-hp-eroded`
  precedent.
- **No mobile presenter wiring required (verified, not assumed).**
  `half-step`'s `verbClass` is `'defend'` (from its `guard` mechanic), and
  mobile's `resolvePrimary` short-circuits the `'defend'` branch to `kind:
  'guard'` BEFORE ever consulting `grant_pip`/`overheat` — the card's
  headline stays "GUARD" regardless of the new third mechanic, unlike
  TURNABOUT (Part 4a), whose `'direct-damage'` verb class routed through the
  generic mechanic-headline path and REQUIRED `MECH_HEADLINE_PRIORITY`
  wiring. The printed "PIP N past the cap" text still earns a bonus "Pip"
  chip in the inspect overlay via `buildDetailKeywords`'s generic
  printed-surface sweep (`keywordsInPersistentText` — any capitalized run
  that resolves to an existing `KEYWORD_GLOSS` entry auto-chips, no
  `MECHANIC_KEYWORD` entry needed, matching the existing "FORGE die-verb
  cluster... intentionally absent" exemption `grant_pip` already enjoys).
  Confirmed by running the full `axiomancer-mobile` suite (green) rather
  than asserted from the code read alone.

### Outputs

- `src/Combat/combat.dice.ts`: `OVERHEAT_PIP_CEILING` (4), `OVERHEAT_BUST_CHANCE`
  (0.35) constants + pure `overheatReserve(reserve, rng)` helper (sibling
  shape to `ripenReserve`, returns `{ reserve, ripenedIds, bustedIds }`).
- `src/Cards/types.ts`: `CardSpecialMechanic` gains `{ kind: 'overheat';
  pips: number }`.
- `src/Combat/combat.engine.ts`: new `'overheat'` case in `playBottomAction`'s
  mechanics switch — loops `mech.pips` waves through `overheatReserve`,
  pushing `die-ripened` on success and `overheat-bust` on a bust.
- `src/Combat/combat.encounter.types.ts`: new `CombatEvent` variant `{ kind:
  'overheat-bust'; dieId: string; cardId: string; pips: number }`.
- `src/Cards/cards.pricing.ts`: `'overheat'` case in `scoreMechanic` (the EV
  formula above); no new `VERB_POINTS` constant (reuses `pip`/`expectedPips`).
- `src/Combat/combat.cards.ts`: `'overheat'` case in `mechanicText` — `PIP N
  past the cap (35% bust: halves the die)`.
- `src/Cards/cards.library.ts`: `half-step` gains a third `specialMechanics`
  entry (`{ kind: 'overheat', pips: 1 }`), an updated `// pts:` comment, and
  a one-clause flavor addendum ("push it further and the kiln might just
  boil over"). No other card, seat, or preset recipe changes.
- `src/Cards/e2e/card-effectiveness.engine.test.ts`: `'overheat'` case in the
  exhaustive `assertMechanic` switch (a die ends up holding more than
  `RESERVE_PIP_CAP` pips on the shared RICH fixture's neutral RNG).
- Courtesy cross-package updates (new `specialMechanics` kind — mandatory
  per the blast-radius rule, VERIFIED not just wired):
  `axiomancer-mobile/state/combat/keywords.ts` (Pip gloss trimmed to note
  the overcap/bust exception, kept under the terse-gloss length lint),
  `axiomancer-card-editor/src/data/mechanics.ts` (`SPECIAL_MECHANIC_KINDS`
  gains `'overheat'` — `mechanics.contract.ts`'s compile-time union check
  fails without it) and `axiomancer-card-editor/src/components/CardForm.tsx`
  (default factory + numeric row for `pips`). No `MECH_HEADLINE_PRIORITY` /
  `MECHANIC_KEYWORD` entry needed — see Decisions.
- `docs/keyword-atlas.md`: PIP row's notes cell gets the OVERHEAT note + the
  Quacks-of-Quedlinburg receipt (no new row — one-card mechanics ride an
  existing row per policy).

### Tests

- New engine e2e (`src/Combat/e2e/forge-overheat.engine.test.ts`, 10 tests):
  `overheatReserve` pure-function coverage (a below-cap die ripens with NO
  risk regardless of the roll; an at-cap die busts — halves, floored — on a
  low roll; the same die pushes past the cap on a high roll; a die at
  `OVERHEAT_PIP_CEILING` takes no further push; multiple dice resolve
  independently in one call; repeated successful pushes climb toward but
  never past the ceiling); `half-step` card-level coverage (an empty Reserve
  is a legal no-op — no fizzle, no reserve dice created; a Reserve die
  already at the cap pushes past it on a neutral non-bust roll; the same die
  busts and fires `overheat-bust` on a low roll); a full
  `COMBAT_SIM_POLICY_ORDER` × seed sweep on the `foundry` preset deck
  (half-step ×4) runs without crashing. 10/10 new tests green.
- Re-ran `combat-playtest.balance-bands.sim.test.ts` and
  `combat-playtest.card-coverage.sim.test.ts` cold BEFORE and AFTER (stashed
  the diff to get a true baseline, then restored it): every preset except
  `foundry` is byte-identical before/after. `foundry`'s own spread moved
  early **0.85 → 0.95** (mid/late unchanged at 0.00/0.00; curve stays
  `move=-0.95 OK`) — a real, expected, small POSITIVE drift, not zero. This
  is the direct consequence of the deliberate pricing call above: OVERHEAT's
  EV is genuinely positive (+0.45/pip, halve-not-zero bust), so `half-step`
  — the deck's most-played card, seated ×4 — got modestly stronger in
  expectation, and Foundry's early-stage win rate (previously the roster's
  laggard at 0.85 against peers at 0.93–1.00) moved toward the pack. Both
  the loose per-preset floor/ceiling band and the win-rate-curve-shape
  assertion (`move=-0.95 OK`, still a `KNOWN_CURVE_VIOLATORS`-clean pass)
  hold at both the before and after numbers — no re-tune needed, no card
  moved dead or dominant, and the direction of the drift argues FOR the
  change (closes a gap flagged in the same source doc's verdict table
  rather than opening one).

### Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

168 files / 2598 tests green (mechanics). Cross-package: touches
`src/Cards/**` (new `specialMechanics` union member) and `src/Combat/**`
(new `CombatEvent` variant) — `axiomancer-mobile` verify (lint clean except
16 PRE-EXISTING unrelated warnings, typecheck clean, 248 suites / 2554 tests
green) and `axiomancer-card-editor` type-check + lint (both clean) are
mandatory per the blast-radius rule, not merely a courtesy — both run and
green.

### Commit body template

```
feat(mechanics): Forge OVERHEAT — phase 32 part 4c

- overheatReserve pure helper (combat.dice.ts): pips past RESERVE_PIP_CAP
  allowed up to OVERHEAT_PIP_CEILING, per-pip OVERHEAT_BUST_CHANCE risk,
  a bust HALVES (not zeroes) the targeted die's pips
- new 'overheat' specialMechanics kind + engine case; overheat-bust event
  fires alongside die-ripened only on the bust half of the gamble
- half-step (forge common) gains a third specialMechanics entry riding its
  existing guard/grant_pip, unchanged — additive, not a seat replacement
- pricing: genuine EV formula (V.pip/V.expectedPips + OVERHEAT_BUST_CHANCE),
  no free-pip credit; half-step 5.75 -> 6.2, still common-band
- docs/keyword-atlas.md: PIP row rides the mechanic (no new row) + the
  Quacks of Quedlinburg receipt (board-game corpus, not Dawncaster)
- cross-package: card-editor SPECIAL_MECHANIC_KINDS/CardForm; mobile Pip
  gloss trimmed for the terse-gloss length lint; no headline-priority wiring
  needed (half-step's 'defend' verb class short-circuits before it)
- tests: overheatReserve pure-fn coverage, half-step no-op/push/bust cases,
  Foundry sim sweep; card-effectiveness lint's 'overheat' case

Decisions:
- Additive retrofit onto half-step's existing grant_pip, not a new capstone
  card occupying a seat — smaller, safer diff than Part 4a's shape for an
  M-sized item. See brief §Part 4c Decisions.
- Bust HALVES, not zeroes, the targeted die — matches the KB receipt's own
  partial-loss bust shape (Quacks: "choose points or coins, not both"), not
  a full wipeout; avoids erasing several turns of patient ripening on one
  unlucky roll with no A/B evidence budget to retune around a harsher bust.
- Foundry's early win rate moved 0.85 -> 0.95 (expected, positive-EV pricing
  on the deck's most-played card) — both bands hold before and after; no
  re-tune performed or needed.
```

## Part 4d — Oracle: OMEN v2

### Design intent (source: 2026-07-10-theme-identity.md §2, "Oracle / augury")

> The omen game runs on rails (always predicts HEART, cantrip-sized rewards,
> self-fulfilling after fated-course). OMEN v2 [CONFIRMED · M]: player CHOOSES
> the predicted window/range; bigger claims pay bigger; misses cost. A bet,
> not a lookup.

The source doc bundles five oracle items under one section (OMEN v2, recolor
cassandras-burden to mind, gate prophecy-fulfilled on omen hits, PORTENT FREE
line, foretell picker + omen telegraph UI). **Split here**, same discipline as
Parts 1/3/4a-4c: this part ships ONLY the CONFIRMED-M OMEN v2 item — even
though "gate prophecy-fulfilled on omen hits" is also printed CONFIRMED·M in
the source doc, the task scoping this tick names OMEN v2 as the single target
(mirrors how Part 4c cut Forge to its one CONFIRMED-M item out of five listed
bullets). The recolor, the prophecy-fulfilled gate, PORTENT, and the picker UI
are follow-ups, not blocking this tick.

### Current state (verified in code, before this tick)

- OMEN (`'omen'` `specialMechanics` kind) predicted a STANCE derived silently
  from whichever die powered the play — `dieHasStance(powering.color) ?
  powering.color : dieHasStance(card.stance) ? card.stance : 'heart'`
  (`combat.engine.ts`, the mechanics switch) — never a player choice, and
  defaulting to `'heart'` whenever neither the die nor the card carried a
  stance color. This is the "runs on rails / always predicts HEART" complaint
  verbatim.
- Every declared omen pushed to `CombatEncounterState.pendingOmens`, always
  targeting `nIdx = min(currentPhaseIndex + 1, threatPhases.length - 1)` — the
  very next threat phase, with no "window/range" concept: a single absolute
  phase index, checked exactly once at the following phase boundary
  (`resolveThreatPhase`'s OMENS block). A stale omen (the phase looped past
  its target index) auto-missed with no further chance.
- Resolution: `omen.stance === incomingStance` → HIT — the card's printed
  `rider` fired free (optionally amplified ×1.5, rounded up, by
  `the-oracles-eye`'s zone effect; `fated-course`'s zone effect additionally
  forced the enemy's next telegraph to the omen's named stance, guaranteeing a
  hit and landing a MARK stack). A MISS pushed an `omen-missed` event and did
  literally nothing else — no cost, no downside, matching "misses cost" being
  wholly unaddressed.
- Oracle's 7-card roster (`cards.library.ts`, T6 — ORACLE): `glimpse` (rank 1
  common), `signs-and-portents` (rank 2 common, `{ kind: 'omen', rider: {
  drawCards: 2 } }`, heart aspect), `cassandras-burden` (rank 3 uncommon,
  `{ kind: 'omen', rider: { guard: 4 } }`, heart aspect — flagged separately
  for the recolor-to-mind follow-up; its `philosophicalAspect` is untouched
  this part, only its `specialMechanics` shape changes to satisfy the
  reworked type), `delphic-ambiguity` (rank 4 uncommon), `prophecy-fulfilled`
  (rank 5 rare, RUPTURE + `fuelPerOmenHit` — reads the cumulative `omenHits`
  counter, untouched this part per the scope cut above), `the-oracles-eye`
  (rank 5 enchant, the ×1.5 amplifier), `fated-course` (rank 6 disenchant,
  the guaranteed-hit forcer). Only `signs-and-portents` and `cassandras-burden`
  carry the `'omen'` mechanic; both needed their `specialMechanics` literal
  updated to satisfy the reworked type (a structural change, not a numeric
  re-tune) — no library seat was added, removed, or re-ranked.
- Domestic prior art for "player-chosen stakes, bigger bets pay bigger, a
  loss burns the wager": `placeStake`/`settleStake` (phase 31 EA-7, "THE
  STAKE") — a pre-play Conviction wager (2/4/6◆) on the CURRENT threat
  phase's hidden stance, settled at the phase boundary: a win pays a bigger
  floating die the bigger the stake (colored/colored-pip/wild), a loss burns
  the wager AND raises the escalation clock's round-equivalent basis. This is
  the actual mechanical template OMEN v2 generalizes (bet on the CURRENT
  phase → bet on a claimed WINDOW of upcoming phases), not a KB import — see
  the KB search below.
- KB search (Dawncaster + board-game corpus) for "player-chosen stakes on a
  future prediction": Dawncaster's own Foretell keyword
  (`kb:dawncaster/keywords/foretell.okf.md`, community, medium — "look at the
  top X cards of your deck, put 1 on top, the rest to the bottom") is a PURE
  LOOKUP with no stakes/range dimension at all — confirming the genre's
  nearest analogue does not already solve "a bet, not a lookup." No
  wager/bidding mechanic turned up in the board-game corpus's OKF records
  either (`kb/KnowledgeBase/BoardGames/games/` — 8 games, none tagged
  bid/wager/prediction). No fabricated receipt; the domestic THE STAKE
  precedent above is cited instead, per doctrine ("don't fabricate one if you
  don't [find one]").

### Decisions made upfront — DO NOT ASK

- **Extend the existing `'omen'` kind, don't add a new one.** This is a
  REWORK of the theme's own hallmark keyword, not a new one-card widget —
  `{ kind: 'omen'; maxWindow: number; anteConviction: number; rider: CardRider
  }` (was `{ kind: 'omen'; rider: CardRider }`). `maxWindow` prints the
  card's claim ceiling (both current carriers print 2 — a bold single-
  boundary bet or a two-boundary hedge); `anteConviction` prints the
  Conviction wager at the boldest (`window: 1`) claim.
- **Both the STANCE and the WINDOW are real cast-time choices**, not one or
  the other — the source doc's own framing names "always predicts HEART" as
  the headline complaint, so leaving the stance derivation in place while
  only adding a window choice would not actually fix it. `playCombatCard`
  gains `play.omenClaim?: { stance: Stance; window: number }` (same
  established shape as `play.chosenX`/`play.reprisalCardId` — an optional,
  additive per-play choice object); `playBottomAction` threads it to a new
  `omenClaim` parameter consumed only by the `'omen'` case.
- **Absent `omenClaim` falls back to `window: 1` and the pre-v2 die-derived
  stance** — deliberately, for two reasons. First, byte-compatibility: every
  pre-existing caller/test that never supplies the new option (mobile has no
  picker yet — the source doc's own separately-listed "foretell picker + omen
  telegraph UI" follow-up) keeps its exact prior stance/timing behavior,
  needing zero test rewrites for the two pre-existing `themed-decks.engine.
  test.ts` OMEN cases or the `bridge-rewards.engine.test.ts` sandbox card.
  Second, `window: 1` reproduces today's single-boundary-check shape exactly
  (the pre-v2 mechanic was ALREADY, structurally, a `window: 1` claim — it
  just never let the player size it any other way), so the default is not a
  compromise value, it is the literal pre-v2 behavior wearing the v2 plumbing.
- **Claim size is the WINDOW axis, and narrower pays MORE.** `claimScale =
  1 / window`: `window: 1` (the boldest, hardest-to-land single-boundary bet)
  fires the FULL printed rider and pays the FULL printed ante — unchanged
  from the printed numbers today. A wider claim (checked at every phase
  boundary while pending, up to `maxWindow` tries) is a hedge: both the ante
  and the rider scale down by the same fraction, `Math.ceil`'d so a hedge
  never rounds a real cost/reward to zero. This reads "bigger claims pay
  bigger" as "a bolder (narrower, riskier) claim pays more than a hedge,"
  which is the literal high-stakes/low-stakes bet framing THE STAKE's own
  2/4/6◆ tiers already established, generalized to a window instead of a
  flat wager size.
- **The ante is paid UP FRONT at cast, clamped to what the player can
  afford, and NEVER refunded on a miss** — the felt cost a lookup never had.
  Clamping (not fizzling) mirrors `recoil_x`'s "clamped to what the player
  can survive" precedent: a broke player still gets to make the bet, just
  for free (a graceful degradation, not a wall). This bounds the downside by
  construction — the worst a miss can cost is the printed ante (small,
  Conviction-denominated, never HP), which cannot spiral into a run-ending
  trap the way an escalating debuff or an HP-scaled penalty could; same
  "avoid a disproportionate downside" reasoning Part 4c's halve-not-zero
  OVERHEAT bust used. `recoilTaken`/RECOIL vocabulary was deliberately NOT
  reused for the ante (Conviction, not VITAE) — RECOIL is Akrasia's own
  blood-price idiom (`RECOIL N [hallmark/Akrasia]`), and Oracle borrowing it
  would violate "a new card must speak its theme's vocabulary, not a
  neighbor's." Conviction is the shared utility currency every theme already
  taxes/spends, so an ante in Conviction stays theme-neutral.
- **`pendingOmens` becomes a countdown, not a one-shot absolute-index
  check.** `{ cardId; stance; windowRemaining: number; claimScale: number }`
  (was `{ cardId; stance; phaseIndex: number }`) — every pending claim is
  re-checked at EVERY phase boundary while `windowRemaining > 0`: a match
  HITS (removed, rider fires at `claimScale`); a non-match decrements
  `windowRemaining` (still pending if > 0 after the decrement, a final MISS
  — ante already sunk, nothing further happens — once it reaches 0). This
  also cleanly resolves the "claim outstanding past the encounter's last
  distinct phase" edge case with no special-case clamping code: a terminal
  looping phase (spec 32's existing "final phase re-evaluates on every
  re-entry" behavior) just keeps offering fresh boundary checks against the
  same stance until the claim hits or its window runs out.
- **`fated-course`'s forcing loses its `phaseIndex` lookup** — there is no
  longer a single absolute index to match against (every pending claim is
  live at every boundary). It now forces the CURRENT boundary's telegraph to
  the FIRST pending claim's stance (`pendingOmens[0]`) — a no-op change for
  the common one-omen-live case, deterministic when more than one is
  concurrently pending. `the-oracles-eye`'s ×1.5 still compounds on top of
  the claim's own `claimScale` (`scale = claimScale * (eye ? 1.5 : 1)`), so a
  hedge claim under the eye still nets a meaningful payoff instead of
  rounding away.
- **Pricing**: `scoreMechanic('omen')` keeps its exact pre-v2 rider/dieBonus/
  info terms (priced at the boldest `window: 1` claim, the same "one
  representative value" convention `recoil_x` already uses for its chosen-X
  range) and adds `− anteConviction * V.conviction * SELF_COST_CREDIT` — the
  standard −0.75× printed-cost credit, identical convention to `recoil`/
  `fate.recoilHp`. No new `VERB_POINTS` constant needed (reuses the existing
  `V.conviction`). Both current carriers print `anteConviction: 2` — this IS
  a net price reduction from the pre-v2 numbers (a genuine new liability, not
  a re-tune of either card's rider), confirmed to stay inside each card's
  rank band: `signs-and-portents` 4.4 → 2.9 (Lemma, band [1.5, 7.5]);
  `cassandras-burden` 8.77 → 7.27 (Thesis, band [4.5, 13]). The sandbox bridge
  card `entered-into-evidence` (oracle↔peroration pairing,
  `cards.sandbox-sets.ts`) is ALSO covered by its own rank-band lint
  (`bridge-rewards.engine.test.ts`) — its smaller `premises: 2` rider takes a
  smaller `anteConviction: 1` (proportioned to its own rider, not copied from
  the two library cards), landing 5.76 → 5.01, still inside its Thesis band;
  the test's regression-anchor number is updated in the same commit.
  `entered-into-evidence` is not exempt from the band lint just for being a
  sandbox card — the first pass at `anteConviction: 2` for it failed the
  lint for real, which is exactly what the lint is for.
- **No new keyword-atlas row.** OMEN is already a Theme hallmark row — this
  IS that row's own rework, not a new one-card mechanic riding an unrelated
  row (unlike TURNABOUT riding BACKFIRE's row or OVERHEAT riding PIP's row in
  Parts 4a/4c). The row's semantics cell and notes cell are both updated in
  this same PR with the THE STAKE precedent and the Dawncaster Foretell
  negative-receipt.
- **Sim policies do not exercise `omenClaim` this tick.** No
  `CombatSimPolicy` gained a `chooseOmen` hook — every simulated card play
  goes through the engine's own backward-compatible default (`window: 1`,
  legacy die-derived stance). This is a deliberate scope cut: teaching a
  witness to peek at an unrevealed future phase's stance would either cheat
  (an omniscient guess trivializes the bet, the same risk THE STAKE's own
  `stakesWhenInformed` gate was built to avoid) or need new "informed, not
  omniscient" plumbing keyed off `revealedStances` that is its own separable
  unit of work — out of scope for an M-sized item with no evidence budget to
  design and tune a new AI decision seam this tick. The player-facing choice
  API is proven by the dedicated hermetic engine tests below, not by the
  aggregate policy sweep; the sweep's job here is strictly "does not crash."

### Outputs

- `src/Cards/types.ts`: `CardSpecialMechanic`'s `'omen'` member gains
  `maxWindow: number` and `anteConviction: number` (rider unchanged).
- `src/Combat/combat.encounter.types.ts`: `pendingOmens` entries become
  `{ cardId; stance; windowRemaining: number; claimScale: number }` (was
  `{ cardId; stance; phaseIndex: number }`); `'omen-declared'` gains
  `window: number` and `ante: number`; `'omen-missed'` gains
  `expired: boolean`.
- `src/Combat/combat.engine.ts`: `playCombatCard`'s `play` param gains
  `omenClaim?: { stance: Stance; window: number }`, threaded to
  `playBottomAction`'s new trailing `omenClaim` parameter; the `'omen'` case
  in the mechanics switch computes `window`/`stance`/`claimScale`/`ante`
  (clamped to `maxWindow` / available Conviction) and pushes the countdown
  entry; `resolveThreatPhase`'s OMENS block rewritten to the countdown model
  (checks every pending claim every boundary, decrements on a miss, removes
  on a hit or an exhausted window) with the `the-oracles-eye`/`fated-course`
  interactions updated to match (see Decisions).
- `src/Cards/cards.pricing.ts`: `scoreMechanic`'s `'omen'` case adds the
  `anteConviction` self-cost credit term.
- `src/Cards/cards.library.ts`: `signs-and-portents` and `cassandras-burden`
  gain `maxWindow: 2, anteConviction: 2` on their `'omen'` mechanic, with
  updated `// pts:` comments showing the credited arithmetic.
- `src/Cards/cards.sandbox-sets.ts`: `entered-into-evidence`'s `'omen'`
  mechanic gains `maxWindow: 2, anteConviction: 1` (a smaller ante,
  proportioned to its smaller rider — see Decisions), with an updated
  `// pts:` comment.
- `src/Cards/e2e/bridge-rewards.engine.test.ts`: the
  `entered-into-evidence` regression-anchor number updated 5.76 → 5.01.
- `src/Combat/combat.cards.ts`: `mechanicText`'s `'omen'` case reprints the
  claim/ante framing (`OMEN — stake claim (window 1-N, ante K◆ at window 1):
  on hit, ...`).
- `docs/keyword-atlas.md`: the OMEN row's semantics/Dawncaster-analogues/
  notes cells rewritten for v2 (THE STAKE domestic precedent + the Foretell
  negative-receipt) — no new row (see Decisions).
- Courtesy cross-package updates (`'omen'`'s field shape changed, not a new
  union member, but the wiring checklist's blast-radius rule still applies —
  verified, not assumed):
  `axiomancer-mobile/state/combat/keywords.ts` (the OMEN gloss rewritten —
  it described the pre-v2 die-derived mechanic, a lying-copy risk the same
  class as RIPOSTE's Part 2 fix); `axiomancer-mobile/state/presenters/
  combat-encounter.engine.ts` (`mechanicHeadline`'s `'omen'` case reprints
  the ante framing — `signs-and-portents` routes through this generic path,
  same "check first" methodology Part 4c used, confirmed by running the
  mobile suite rather than asserted); `axiomancer-card-editor/src/components/
  CardForm.tsx` (default factory gains `maxWindow: 2, anteConviction: 2`;
  the mechanic-fields row renderer gains `MAX WINDOW`/`ANTE CONVICTION`
  steppers). No `SPECIAL_MECHANIC_KINDS` change (`axiomancer-card-editor/
  src/data/mechanics.ts`) — the kind itself (`'omen'`) is unchanged, only its
  field shape, so the compile-time union check in `mechanics.contract.ts`
  needed no edit; confirmed by the card-editor's own green type-check.

### Tests

- New engine e2e (`src/Combat/e2e/oracle-omen-v2.engine.test.ts`, 13 tests):
  cast-time claim (absent `omenClaim` falls back to `window: 1` + the
  pre-v2 die-derived stance; an explicit claim overrides the stance against
  BOTH the powering die's color and the card's own stance; a requested
  window beyond the printed `maxWindow` clamps down; the ante clamps to
  available Conviction — never negative, never blocks the play; a wider
  claim halves the ante); HIT scaling by claim size (`cassandras-burden`'s
  Guard rider: window 1 fires the full printed 4, window 2 fires exactly
  half); MISS behavior (a window-2 claim missing the first boundary stays
  pending — `expired: false` — and is re-checked at the next boundary; only
  exhausting the window is a final miss — `expired: true`; a claim that
  misses boundary 1 but hits boundary 2 still pays the scaled, not the
  full, reward); the edge case of a claim outstanding past the encounter's
  last distinct phase (a looping terminal phase) resolving without
  crashing; `fated-course` forcing a guaranteed hit (binds the first
  pending claim) and still landing MARK; `the-oracles-eye`'s ×1.5
  compounding on top of the claim's own scale; a full
  `COMBAT_SIM_POLICY_ORDER` × seed sweep on the `augury` preset deck. 13/13
  green.
- `themed-decks.engine.test.ts`'s two pre-existing OMEN cases (HIT / MISS,
  neither passing `omenClaim`) re-verified green UNMODIFIED — proof the
  byte-compatible default holds.
- `bridge-rewards.engine.test.ts`'s `entered-into-evidence` cases (PAID
  declare / CONFIRM hit / MISS / FREE) re-verified green unmodified except
  the one regression-anchor number (see Outputs); its rank-band lint now
  passes at the new `anteConviction: 1`.
- `card-effectiveness.engine.test.ts`'s `'omen'` case (pendingOmens length
  grows) re-verified green unmodified.
- Re-ran `combat-playtest.balance-bands.sim.test.ts` and
  `combat-playtest.card-coverage.sim.test.ts` cold BEFORE (stashed the diff)
  and AFTER (restored it) — zero pin drift: every preset's floor/ceiling
  bands and the win-rate-curve-shape assertion hold at both readings,
  `KNOWN_CURVE_VIOLATORS` stays empty. `augury`'s own numbers (below) move
  by low single points, not enough to touch any pinned band.

Evidence (seed 1, `greedy` policy, `preset:augury`, `signs-and-portents` —
the only `'omen'`-carrying card this preset/policy combo actually plays;
`cassandras-burden` is a pre-existing dead card in this cell, unrelated to
this part):

| stage | policy | seed | winRate | Δ | statusEng | Δ | card plays (signs-and-portents) | Δ |
|---|---|---|---|---|---|---|---|---|
| early | greedy | 1 | 0.69 → 0.68 | −0.01 | 0.28 → 0.28 | 0.00 | 1469 → 1486 | +17 |
| mid | greedy | 1 | 0.01 → 0.01 | 0.00 | 0.25 → 0.25 | 0.00 | 1759 → 1742 | −17 |
| late | greedy | 1 | 0.00 → 0.00 | 0.00 | 0.26 → 0.26 | 0.00 | 1772 → 1754 | −18 |

Invocations: `npm run combat-playtest -- --stage=<s> --policy=greedy --deck=preset:augury --seed=1 --cards`
run cold on the pre-4d tree (`git stash`, control) and again on the same
tree with this part's diff restored (`git stash pop`, treatment) — not a
sandbox toggle, since this part lands directly (structural engine change,
same precedent as Parts 4a-4c). The tiny drift (≤1pp win rate, ≤18 plays
out of ~1500-1800) is the expected, small EV tax of the new ante at the
pre-v2 default claim (`window: 1`, no `chooseOmen` policy hook exercising
the hedge) — no other preset's pinned band moved (confirmed by the full
`npm run verify` gate staying green with zero other test edits).

### Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

169 files / 2611 tests green. Cross-package (touches `src/Cards/**` — the
`'omen'` mechanic's field shape — and `src/Combat/**` — `CombatEvent`/
`CombatEncounterState` field changes): `axiomancer-mobile` verify (typecheck
clean, lint clean except the same 16 pre-existing unrelated warnings Part 4c
documented, 248 suites / 2554 tests green) and `axiomancer-card-editor`
type-check + lint + build (all clean) are mandatory per the blast-radius
rule, not merely a courtesy — both run and green.

### Commit body template

```
feat(mechanics): Oracle OMEN v2 — phase 32 part 4d

- 'omen' mechanic gains maxWindow/anteConviction: the player STAKES a
  stance + window claim (play.omenClaim) instead of a silent die-derived
  guess — the "always predicts HEART" complaint, fixed at the API level
- pendingOmens becomes a countdown (windowRemaining/claimScale), checked
  every phase boundary while pending, not a one-shot absolute-phase-index
  match; claimScale = 1/window — a bolder (narrower) claim pays (and
  costs) more, a hedge pays (and costs) less across more tries
- anteConviction paid up front at cast, clamped to affordable Conviction,
  never refunded on a miss — the felt cost a lookup never had, bounded by
  construction (Conviction-denominated, never HP, never spirals)
- fated-course forces the first pending claim's stance (no more absolute
  phaseIndex to bind); the-oracles-eye's ×1.5 compounds on claimScale
- pricing: anteConviction credits at the standard −0.75× self-cost rate;
  signs-and-portents/cassandras-burden/entered-into-evidence re-priced,
  all still rank-band honest (arithmetic in each card's // pts: comment)
- docs/keyword-atlas.md: OMEN row rewritten for v2 (THE STAKE domestic
  precedent + the Dawncaster Foretell negative-receipt — no new row)
- cross-package: mobile OMEN gloss + mechanic-headline copy rewritten;
  card-editor CardForm gains maxWindow/anteConviction fields (no
  SPECIAL_MECHANIC_KINDS change — same kind, new field shape)
- tests: 13 new oracle-omen-v2 cases (cast-time claim, HIT scaling, MISS/
  countdown, edge cases, fated-course + the-oracles-eye synergy, sim
  sweep); 2 pre-existing themed-decks OMEN cases + bridge-rewards'
  entered-into-evidence cases green unmodified (one regression-anchor
  number updated); augury evidence table attached

Decisions:
- Extends the existing 'omen' kind (a hallmark rework, not a new one-card
  mechanic) — no new keyword-atlas row. See brief §Part 4d Decisions.
- Absent omenClaim falls back to window 1 + the pre-v2 die-derived stance
  — byte-compatible default until the (separately follow-up'd) mobile
  picker ships; every pre-existing OMEN test needed zero rewrites.
- Sim policies do not exercise omenClaim this tick (no chooseOmen hook) —
  avoids teaching a witness to peek at an unrevealed future stance
  (the same risk THE STAKE's stakesWhenInformed gate exists to avoid);
  the player-facing choice API is proven by hermetic tests, not the sweep.
- Ante is Conviction, not RECOIL/VITAE — Oracle borrowing Akrasia's blood-
  price idiom would violate theme vocabulary separation; Conviction is
  the shared utility currency every theme already taxes.
```

## Part 4e — Charm: Resolve milestones

### Design intent (source: 2026-07-10-theme-identity.md §2, "Charm / grace")

> Resolve milestones [CONFIRMED · M]: Wavering/Faltering thresholds on the SWAY
> track with small riders — the track gets rungs and a face. Couples with the
> 2026-07-08 resolve-threshold item (Charmed-style `SWAY ≥ resolve` opens the
> offer, resolve < maxHP, decays as HP falls).

Context quote from the same doc: "Charm / grace — capitulation must be EARNED
and legible. The one unique axis in the roster. SWAY reaching the live
threshold now opens a capitulation offer; it never authors the outcome...
Poison can still lower the current-VITAE-derived offer threshold, so Grace
must be tuned against offers and accepted outcomes separately rather than
treating threshold crossing as an automatic win." The other three charm items
(damaging plays strip SWAY, mirror-of-longing retarget, FREE lines build
rapport foundation) are explicit follow-ups, not this part's scope — same
split discipline Parts 1/3/4a-4d already used (cut to the one CONFIRMED-M
item).

### Current state (verified in code, before this tick)

- `capitulateThreshold(enemy)` (`src/Combat/effects.ts`, landed
  2026-07-08 per `plan/tuning/2026-07-08-win-path-scaling.md` item 1a) is the
  enemy's "resolve": `max(CAPITULATE_MIN(10), round(CAPITULATE_RESOLVE_FRACTION(0.35)
  × maxHealth))`, clamped to never exceed the enemy's CURRENT health. It is
  LIVE — it shrinks as the enemy's HP falls, exactly the "resolve < maxHP,
  decays as HP falls" framing in the source quote.
- Every SWAY source in the library funnels through ONE function,
  `gainSway` (`combat.engine.ts`) — the theme's exact analogue to Part 4b's
  `gainPremises` single insertion point: the `sway` `specialMechanics` kind
  (`soft-word`, `common-ground`, `the-olive-branch`, `heart-of-the-matter`),
  `CardRider.sway` (FREE lines and `dieBonus`/`threshold` riders alike), and
  `mirror-of-longing`'s "damage your defenses prevented converts to SWAY"
  zone conversion (inside `resolveThreatPhase`). `gainSway` already scales
  every gain by `buff_grace_momentum`'s per-stack multiplier
  (`irresistible-grace`'s "future SWAY gains increase" persistent effect) and
  pushes a `sway-gained` event; nothing else about the SWAY track has any
  waypoint, rung, or face today — the number climbs silently until it clears
  the whole `capitulateThreshold` and the mercy choice opens, cold.
- Charm's own printed vocabulary: SWAY itself, RAPPORT (`debuff_rapport` —
  softens the enemy's outgoing damage; the FREE/PAID payload on `soft-word`,
  `disarming-smile`, `common-ground`, and `the-olive-branch` already), GUARD,
  and small heals. `irresistible-grace`'s zone effect holds SWAY from its
  1/turn passive decay (`SWAY_DECAY_PER_TURN`) — untouched by this part.
- Precedent for an un-authored, engine-side "passive dividend riding an
  existing ledger, fires alongside the existing gain event": Part 4b's
  Oratory milestone drip (`premiseMilestoneTotal`, `PREMISE_MILESTONE_EVERY`,
  `premiseMilestonesCrossed`) is the closest shape match — a tier-crossing
  helper parameterized by a fixed step size. This part's waypoints are
  FRACTIONS OF A LIVE, SHRINKING VALUE (`capitulateThreshold`) rather than
  fixed steps of a monotonic counter, so the crossing state has to be tracked
  as latching booleans, not a re-derivable tier count (see Decisions).

### Decisions made upfront — DO NOT ASK

- **Two named fractions of the LIVE resolve, not fixed absolute SWAY numbers
  and not fractions of maxHealth.** `SWAY_WAVERING_FRACTION = 0.45`,
  `SWAY_FALTERING_FRACTION = 0.8` of `capitulateThreshold(enemy)`, recomputed
  at every `gainSway` call (the same live value the capitulation offer itself
  reads) via the new pure helper `swayResolveMilestoneThresholds(resolve)`.
  Fractions of maxHealth were rejected: the whole point of the 2026-07-08
  Charmed-style rework was decoupling the offer from a value that never
  moves — waypoints that track the SAME live, HP-driven resolve the offer
  itself uses keep the "wavering → faltering → yields" arc emotionally
  synced with the fight's actual trajectory (a boss taking damage genuinely
  softens faster), matching the source quote's own explicit coupling to the
  2026-07-08 item.
- **Each milestone fires AT MOST ONCE per combat, tracked as a LATCHING
  BOOLEAN, not a re-derivable tier count.** `CombatEncounterState` gains
  `swayMilestoneWaveringFired?: boolean` / `swayMilestoneFalteringFired?:
  boolean`, reset to `false` in `initializeCombatEncounter` only — same
  per-combat lifecycle as `souls`/`akrasiaDebt`/`premiseMilestoneTotal`. This
  is a STRUCTURAL departure from those three ledgers (which are monotonic
  counters whose crossing state can be re-derived from `before`/`after` via
  a pure `xTiersCrossed` helper): because the threshold itself
  (`capitulateThreshold`) can SHRINK as the enemy's HP falls, re-deriving
  "was this crossed" from a live recomputation would let a shrinking resolve
  ERASE a milestone already paid (the enemy "un-wavers" the moment its HP
  drops enough to shrink the threshold below the SWAY total that originally
  cleared it) — the exact clawback the brief's decision points forbid. A
  latching boolean can only ever flip `false → true`, so a milestone already
  paid stays paid regardless of which direction the live resolve moves
  afterward — the Souls/DEBT "never claw back a dividend" precedent, applied
  to a boolean because the underlying denominator (not just the numerator)
  is now allowed to shrink.
- **Wavering pays RAPPORT; Faltering pays bonus SWAY — an escalating,
  two-stage arc that speaks ONLY Charm's own vocabulary.** Wavering
  (`SWAY_WAVERING_RAPPORT = 1`) lands one stack of `debuff_rapport` on the
  enemy via the SAME `applyEffect` call shape `soft-word`/`disarming-smile`/
  `common-ground`/`the-olive-branch` already print (`sourceId:
  'sway-resolve-milestone'`) — the foe's resistance visibly softens as their
  will starts to waver. Faltering (`SWAY_FALTERING_BONUS = 2`) grants a
  small BONUS SWAY nudge, added directly to the running total in the SAME
  `gainSway` call (NOT re-routed through a second `gainSway` invocation —
  avoids any recursive-milestone-check complexity) and deliberately
  UNSCALED by `buff_grace_momentum` (a flat ledger dividend, not a re-scaled
  gain, matching `AKRASIA_DEBT_TIER_GUARD`/`PREMISE_MILESTONE_RUNGS`'s own
  "modest ledger bonus" idiom). The arc reads: first the enemy's own
  resistance softens (RAPPORT, external), then your own case gains
  momentum as their will visibly breaks (bonus SWAY, self-reinforcing) —
  "the track gets rungs and a face" in the source doc's own words. A GUARD
  or heal payoff for Faltering was explicitly REJECTED: `gainSway` is called
  from THREE sites, one of which (`mirror-of-longing`'s SWAY-conversion
  inside `resolveThreatPhase`) sits just a few lines before that SAME
  function's own hardcoded `guard: 0` phase-reset — a GUARD dividend paid at
  that call site would evaporate before it could ever matter, and this
  part has no evidence budget to re-architect `resolveThreatPhase`'s guard
  lifecycle just to make a milestone-flavor choice safe. SWAY is never reset
  mid-function at ANY `gainSway` call site, so it is the one payoff type
  correctness-safe everywhere the function fires from.
- **Fixing a latent bug at the one fragile call site, in the same commit.**
  `resolveThreatPhase`'s `mirror-of-longing` conversion previously called
  `gainSway({ ...state, player, sway }, damagePrevented, events).sway ??
  sway` — extracting ONLY `.sway` from the result and silently discarding
  every other field the function returns. This was harmless before this part
  (the function returned nothing else worth keeping), but would have SILENTLY
  DROPPED the new Wavering RAPPORT stack and both milestone-fired flags at
  this one call site the moment `gainSway` started returning them. Fixed to
  capture the full returned state (`enemy`, both fired flags) and thread it
  into that function's own final `next` object construction, alongside the
  pre-existing `sway` extraction — `guard` is deliberately NOT threaded back
  from `gainSway`'s result (see the point above: this function resets GUARD
  to 0 a few lines later regardless, and the Faltering payoff is SWAY, not
  GUARD, precisely so this fragile site never needs to care).
- **No new `VERB_POINTS` entry, no card pricing change.** Same precedent as
  `AKRASIA_DEBT_TIER_GUARD`/`PREMISE_MILESTONE_RUNGS`: the dividend rides
  EVERY SWAY source already priced at `V.sway` — it is a property of the
  `gainSway` ledger, not an authored verb any single card opts into (every
  Charm card that has EVER printed `sway` benefits automatically, with zero
  card literal changes), so the per-rank pricing lint never sees it and no
  `// pts:` comment needs updating.
- **New event, discriminated by `milestone`, not an overload.** `{ kind:
  'sway-milestone'; milestone: 'wavering'; threshold; total; effectId;
  intensity }` / `{ kind: 'sway-milestone'; milestone: 'faltering';
  threshold; total; bonus }` fire ALONGSIDE the existing `sway-gained` event
  (never replacing it) — identical convention to `premise-milestone`/
  `debt-tier-payoff`. The two `milestone` variants carry genuinely different
  payoff fields (an effect id + landed intensity vs. a bonus SWAY number)
  rather than a shared, partly-optional shape guessing at which fields
  apply.
- **No card text/data changes.** Like the Oratory milestone drip, this is a
  pure engine-side dividend with no `specialMechanics` field and no card
  literal touched — `soft-word`/`disarming-smile`/`common-ground`/
  `the-olive-branch`/`heart-of-the-matter`/`mirror-of-longing` are all
  byte-identical in `cards.library.ts`.
- **No new keyword-atlas row.** Row policy: one-card/engine-wide-drip
  mechanics stay card-local or ride an existing row as a note (TURNABOUT
  rode BACKFIRE's row in Part 4a, the milestone drip rode PREMISE's/
  STAGGER's rows in Part 4b). This drip rides the SWAY row's own notes cell
  (its accrual side, the two waypoints + the arc) and gets a one-line
  cross-reference on the RAPPORT row (its Wavering payoff side, a
  same-theme — not cross-theme — synergy) — no 31st keyword, the 30-cap
  proving gate is untouched.

### Outputs

- `src/Combat/effects.ts`: `SWAY_WAVERING_FRACTION` (0.45),
  `SWAY_FALTERING_FRACTION` (0.8), `SWAY_WAVERING_RAPPORT` (1),
  `SWAY_FALTERING_BONUS` (2) constants + pure
  `swayResolveMilestoneThresholds(resolve)` helper (floors both waypoints at
  1, unlike `akrasiaDebtTiersCrossed`/`premiseMilestonesCrossed` this is NOT
  a before/after tier-crossing count — the latching-boolean state it feeds
  lives on `CombatEncounterState` instead, per the Decisions above).
- `src/Combat/combat.encounter.types.ts`: `swayMilestoneWaveringFired?:
  boolean` / `swayMilestoneFalteringFired?: boolean` on
  `CombatEncounterState`; new `CombatEvent` variants `{ kind:
  'sway-milestone'; milestone: 'wavering'; threshold; total; effectId;
  intensity }` and `{ kind: 'sway-milestone'; milestone: 'faltering';
  threshold; total; bonus }`.
- `src/Combat/combat.engine.ts`: `initializeCombatEncounter` resets both
  flags to `false`; `gainSway` computes the live `capitulateThreshold` +
  waypoints on every call, lands the Wavering RAPPORT stack and/or the
  Faltering bonus SWAY (independently gated, so both CAN fire in one call
  when a single gain clears both waypoints at once) and returns the updated
  `enemy`/`sway`/both flags; the `resolveThreatPhase` `mirror-of-longing`
  call site is fixed to capture the FULL `gainSway` result (see Decisions'
  latent-bug point) instead of discarding everything but `.sway`.
- `docs/keyword-atlas.md`: SWAY row's notes cell gets the milestone-drip
  note (mirrors the arc, both fractions, both payoffs); RAPPORT row's notes
  cell gets a one-line cross-reference to the Wavering payoff.
- No cross-package changes required — no new `specialMechanics` kind, no
  card field, and `sway-milestone` is not consumed by any mobile presenter
  or the card editor today (same "internal ledger event, no UI consumer yet"
  status as `debt-tier-payoff`/`premise-milestone`/`turnabout-fired`).
  Mobile verify + card-editor type-check run anyway per the blast-radius
  rule (`src/Combat/**` touched) — both green.

### Tests

New engine e2e (`src/Combat/e2e/charm-resolve-milestones.engine.test.ts`, 8
tests): pure threshold arithmetic (`swayResolveMilestoneThresholds` — a
worked resolve-14 example matching the exact wavering-6/faltering-11 numbers,
Wavering always strictly below Faltering which is always ≤ resolve across a
spread of resolves, floors at 1); crossing Wavering only (a gain that clears
the wavering waypoint but stays under faltering lands exactly one RAPPORT
stack and fires exactly one `sway-milestone` event); crossing BOTH Wavering
and Faltering in one `gainSway` call (a single played card's self-echoed sway
pushes the running total past both waypoints at once — both events fire, one
RAPPORT stack lands, the bonus SWAY is included in the reported total, and
the numbers are chosen to stay just under the live resolve so this case
doesn't also trip the pre-existing capitulation-offer check); a shrinking
live resolve after Wavering already fired does NOT re-fire it or claw back
the RAPPORT stack already landed (the enemy's HP pool is slashed well below
the original crossed threshold between two plays; the second play's events
carry zero `wavering` milestones, the flag stays `true`, the RAPPORT stack
is unchanged); per-combat/per-enemy reset (`initializeCombatEncounter` starts
both flags `false`); a full `COMBAT_SIM_POLICY_ORDER` × seed sweep on the
`grace` (Charm) preset deck runs without crashing. 8/8 new tests green.
Re-ran `combat-playtest.balance-bands.sim.test.ts` and
`combat-playtest.card-coverage.sim.test.ts` cold BEFORE (stashed the diff)
and AFTER (restored it) — `grace` itself shows ZERO drift at every stage
(early/mid/late 1.00/0.00/0.00, byte-identical before and after — the two
milestones are additive dividends riding an already-winning curve, not a
new source of wins). Two OTHER, mechanically untouched presets show a
hairline (1pp) shift attributable to the matrix's single shared,
sequentially-advancing seeded RNG stream (`foundry` early 0.90→0.92,
`bastion` mid 0.07→0.08 — both stable/reproducible across repeat runs of
the SAME diff, confirming genuine determinism, not flakiness): Grace's
`gainSway` now does slightly more work per call (an extra `applyEffect`
call on a Wavering cross), which shifts how many RNG draws its own
simulated encounters consume, which — because the matrix seeds one RNG
stream across the WHOLE cell enumeration rather than per-preset — shifts
the starting RNG state for whichever cells are enumerated after it, even
though `foundry`/`bastion`'s own cards and mechanics are byte-identical.
Both the loose per-preset floor/ceiling bands and the win-rate-curve-shape
assertion (`move=...  OK`) hold at both readings; `KNOWN_CURVE_VIOLATORS`
stays empty — no re-tune needed or performed.

### Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

170 files / 2619 tests green. Cross-package (touches `src/Combat/**` —
`CombatEncounterState`/`CombatEvent` field changes, no `src/Cards/**` touch
at all since no card data or `specialMechanics` field changed):
`axiomancer-mobile` verify (248 suites / 2554 tests green) and
`axiomancer-card-editor` type-check (clean) are mandatory per the
blast-radius rule, not merely a courtesy — both run and green, with zero
code changes needed in either package (no new union member, no new card
field — confirmed, not assumed).

### Commit body template

```
feat(mechanics): Charm resolve milestones — phase 32 part 4e

- swayResolveMilestoneThresholds pure helper (effects.ts): Wavering (45%)
  and Faltering (80%) fractions of the enemy's LIVE capitulateThreshold,
  recomputed every gainSway call, not fixed absolute SWAY numbers
- gainSway (the theme's single SWAY insertion point, like Part 4b's
  gainPremises) lands each milestone's dividend at most once per combat via
  latching booleans (swayMilestoneWaveringFired/FalteringFired) — a
  shrinking live resolve can never re-fire or claw back an already-paid
  milestone, only ever prevent a NEW one from firing early
- Wavering pays one RAPPORT stack on the enemy; Faltering pays a small
  bonus SWAY nudge (unscaled by buff_grace_momentum) — an escalating,
  Charm-only-vocabulary two-stage arc, no borrowed idiom
- fixed a latent bug at the mirror-of-longing gainSway call site
  (resolveThreatPhase): it discarded everything but gainSway's returned
  `.sway`, which would have silently dropped the new RAPPORT stack + both
  fired-flags at that one site
- sway-milestone event (discriminated by `milestone`) fires alongside
  sway-gained; docs/keyword-atlas.md: SWAY row (accrual + arc) + RAPPORT
  row (cross-reference) updated, no new row
- tests: pure threshold arithmetic, Wavering-only, both-in-one-gain,
  shrinking-resolve non-clawback, per-combat reset, grace preset sim sweep

Decisions:
- Latching booleans, not a re-derivable tier count — the live resolve
  denominator can itself shrink, so "was this crossed" cannot be
  re-derived from a before/after comparison the way Souls/DEBT/PREMISE
  ledgers do. See brief §Part 4e Decisions.
- Faltering pays SWAY, not GUARD/heal — one gainSway call site
  (mirror-of-longing, inside resolveThreatPhase) resets GUARD to 0 a few
  lines after it fires; SWAY is the one payoff type safe at every call
  site without a resolveThreatPhase guard-lifecycle rework.
- No VERB_POINTS entry / card pricing change — an un-authored ledger
  dividend riding every SWAY source, same precedent as Part 4b's
  AKRASIA_DEBT_TIER_GUARD / PREMISE_MILESTONE_RUNGS.
- foundry/bastion's hairline sim drift is shared-RNG-stream entanglement
  (stable/reproducible, cards/mechanics byte-identical), not a balance
  change — grace itself shows zero drift; both loose bands hold before
  and after.
```

## Part 4f — Echo: Ouroboros targets the last spell that LANDED A STATUS

### Design intent (source: 2026-07-10-theme-identity.md §2, "Echo / refrain")

> REPRISE becomes a player choice [CONFIRMED · S]: show the songbook (discard
> picker). The single cheapest agency win in the roster.
> Ouroboros replays the last spell that LANDED A STATUS, with a face preview
> [CONFIRMED · S].
> Second-thoughts partial detonate [CONFIRMED · S]: consume ≤2 marks so the
> detonate/keep fork is real.

Echo has no CONFIRMED-M item (unlike every other theme this phase touched) —
its three CONFIRMED items are all S-tier. Audited all three before picking
scope (see Current state): the first is ALREADY fully shipped from phase 28;
the other two are genuinely unstarted. Picked the Ouroboros retarget as this
part's scope — a pure engine-side correctness fix with an existing signal to
reuse and zero new player-facing choice required, matching this phase's
established "engine-only, mobile gets verify not new UI" pattern (Parts
4a/4b/4c/4e). Second-thoughts partial detonate needs a genuine new choice
mechanism (which stacks to keep) and CRESCENDO overflow is explicitly gated
on "only if the cheap items above don't lift the ceiling" — both deferred,
see Follow-ups.

### Current state (verified in code, before this tick)

- **REPRISE choice — audited, already shipped, doc-comment was stale.**
  `playBottomAction`'s `reprisalCardId` param (phase 28) honors the player's
  songbook pick for the first return of ANY `reprise` mechanic card.
  Mobile's `needsReprisalChoice` (`combat-encounter.engine.ts`) gates on
  `specialMechanics.some(m => m.kind === 'reprise')` — not hardcoded to one
  card id — so both `second-thoughts` and `circular-reasoning` (the two
  `reprise`-carrying Echo cards) already get the picker. Only the in-code
  comment claiming "mobile ships the picker for the count-1 canonical case
  (second-thoughts)" was stale/misleading; fixed this tick, no behavior
  change needed.
- **Ouroboros retarget — not started.** `lastSpellCardId`
  (`combat.engine.ts`, `playBottomAction`) was set to `sourceCard.id`
  UNCONDITIONALLY after every PAID spell play, regardless of whether that
  play landed anything. `replay_last` (Ouroboros's mechanic) reads this
  field verbatim with no filter beyond "is a spell, isn't itself a
  `replay_last` card" — so a no-status play sandwiched between a real
  status-landing spell and Ouroboros (a fizzle, a pure-mechanic burst like
  TURNABOUT's ledger cash-out which has zero `combatEffects`, a dieless
  no-op) silently stole the echo away from the spell the flavor text
  describes ("whatever you said last, the serpent says twice more").
- **The exact signal already exists, zero new plumbing.** `landedOnEnemy`
  (a `let` local in the SAME function, `playBottomAction`) is already
  computed from `allCardEvents` — which already includes any nested
  `replay_last` call's own events (the mechanics loop resolving
  `replay_last` runs strictly BEFORE the effect-landing attribution loop
  that sets `landedOnEnemy`, confirmed by reading the function's control
  flow) — for the pre-existing die-refresh combo-chain rule ("a status new
  to this chain refreshes the die"). It means precisely "did this play
  increase an effect's intensity on the enemy," the exact predicate the
  source doc's "LANDED A STATUS" wants.
- **No face-preview UI exists.** Neither the engine nor
  `axiomancer-mobile` carries any concept of previewing what Ouroboros's
  replay will land before it's played (`state.lastSpellCardId` has zero
  mobile references). Deferred — see Follow-ups, same discipline as Part
  4d's foretell-picker UI deferral.

### Decisions made upfront — DO NOT ASK

- **Gate the existing `lastSpellCardId` assignment on `landedOnEnemy`,
  don't add a second field.** A no-status play leaves the PRIOR
  status-landing spell's id in place (`landedOnEnemy ? sourceCard.id :
  state.lastSpellCardId`) instead of clearing to `null` — clearing would
  make Ouroboros whiff entirely the moment ANY no-status card is played in
  between, which is a strictly worse player experience than "skip past it
  to the last spell that actually did something," and doesn't match the
  source doc's own framing (it wants the REPLAY TARGET corrected, not the
  replay opportunity destroyed).
- **`landedOnEnemy` only, not a broader "landed anything including
  self-buffs" predicate.** The source quote's own framing ("whatever you
  said last" replaying against the ENEMY) and the existing variable's
  established meaning (already gates the die-refresh combo-chain rule) both
  point at enemy-facing status landings specifically. Reusing the existing
  semantic keeps this a one-line change instead of introducing a second,
  subtly-different "landed something" concept.
- **No face-preview UI this part.** The engine-side retarget is the
  CONFIRMED item's substance (a wrong replay target is a correctness bug;
  not previewing a correct one is a legibility nice-to-have). Building a
  preview needs a mobile-side concept of "what will Ouroboros replay" that
  doesn't exist anywhere in the presenter layer today — sized like its own
  small UI slice, not a one-line engine gate. Deferred, matching Part 4d's
  foretell-picker precedent exactly.
- **Second-thoughts partial detonate and CRESCENDO overflow are NOT this
  part's scope.** Partial detonate needs a genuine new choice primitive
  (which stacks to keep, not just a hardcoded cap) since `ruptureMarks` is
  a SHARED verb across multiple non-Echo cards (`the-closing-word`,
  `ouroboros` itself, several sandbox cards) — capping it globally would be
  a balance change reaching far beyond Echo, and a new card-scoped rider
  field is its own design pass, not a slot-in for this tick. CRESCENDO
  overflow is explicitly gated in the source doc on "only if the cheap
  items above don't lift the ceiling" — premature before a re-run of the
  ten-theme matrix.

### Outputs

- `src/Combat/combat.engine.ts`: `playBottomAction`'s `next.lastSpellCardId`
  assignment gated on `landedOnEnemy`; two stale/misleading doc-comments
  fixed (the `reprisalCardId` param doc, the `replay_last` case comment).
- `src/Combat/combat.encounter.types.ts`: `lastSpellCardId`'s doc-comment
  updated to describe the "last status-landing spell" semantics.
- No `CombatEvent` variant, no card field, no `specialMechanics` kind, no
  keyword-atlas row — a pure semantic tightening of an existing internal
  field with a single consumer (`replay_last`/Ouroboros). No cross-package
  surface changed (no new union member, no card literal touched); mobile
  verify + card-editor type-check still run per the blast-radius rule
  (`src/Combat/**` touched).

### Tests

New engine e2e
(`src/Combat/e2e/ouroboros-status-target.engine.test.ts`, 4 tests): a
no-status play (`turnabout`, zero `combatEffects`) never overwrites
`lastSpellCardId` after a status-landing play (`refrain`); a SECOND
status-landing play still updates it to itself (regression guard — the
common case is unchanged); end-to-end `refrain -> turnabout -> ouroboros`
proves the replay lands `refrain`'s own effects (`debuff_mark`,
`debuff_poison`), not nothing, across the intervening no-status play; fresh
combat still starts `lastSpellCardId: null`. Verified the tests are
load-bearing, not just green: reverted the one-line gate locally, confirmed
the no-status-overwrite and end-to-end tests both fail against the
pre-fix behavior (`turnabout` won the slot instead of `refrain`), then
restored the fix and re-ran to green. 4/4 new tests green.

### Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

Cross-package (touches `src/Combat/combat.engine.ts` — no `CombatEvent`
variant, no card field, no `specialMechanics` kind changed):
`axiomancer-mobile` verify and `axiomancer-card-editor` type-check are
mandatory per the blast-radius rule, both run and green with zero code
changes needed in either package.

### Commit body template

```
feat(mechanics): Ouroboros targets the last status-landing spell — phase 32 part 4f

- lastSpellCardId (ouroboros's replay_last target) now only updates on a
  PAID spell play that actually landed/deepened a status on the enemy
  (landedOnEnemy, an existing local already computed from allCardEvents,
  which already includes a nested replay's own events) — a no-status play
  (fizzle, TURNABOUT's ledger-only burst, a dieless no-op) no longer steals
  the echo away from the last spell that actually did something
- audited REPRISE-becomes-a-player-choice (the other CONFIRMED item in
  scope for this theme): already fully shipped from phase 28 for both
  reprise cards (second-thoughts, circular-reasoning); only a stale
  misleading doc-comment needed fixing, no behavior change
- tests: no-status play never overwrites the replay target, a second
  status-landing play still updates it (regression guard), end-to-end
  refrain -> turnabout -> ouroboros proves the correct target, fresh-combat
  null default; verified load-bearing by reverting the fix locally and
  confirming 2 of 4 tests fail against the old behavior

Decisions:
- Gate the existing field on landedOnEnemy rather than clearing to null on
  a no-status play or adding a second field — Ouroboros skips past a dead
  play to the last spell that actually landed something, it doesn't whiff
  entirely the moment any no-status card intervenes.
- Face-preview UI, second-thoughts partial detonate, and CRESCENDO overflow
  deferred — see brief §Part 4f Decisions / Follow-ups.
```

## Part 1c — Harvest: milestone epithet on the carried Soul bank

### Design intent (source: 2026-07-10-theme-identity.md §2, PA-1, P-NEXT
final quarter)

> Souls persist across combats with milestone riders (P-NEXT: the jar
> travels).

Part 1b shipped the persistence mechanism ((1)-(3) of the P-NEXT bundle:
`Character.bankedSouls`, the `applyHazardOutcome` write-back, the Memoir
REMAINS read-back). This part ships (4), the last quarter: "milestone
riders — what a running Soul total unlocks."

### Current state (verified in code, before this tick)

`buildSoulsLine` (`memoir.engine.ts`) narrates `player.bankedSouls` with a
flat singular/plural/zero split — "the jar is empty." / "the jar holds a
single soul." / "the jar holds N souls." — and nothing else. The bank only
ever grows (no spender exists); no threshold in the running total changes
anything the player sees.

### Decision made upfront — DO NOT ASK

The brief's own Follow-up note (previous version of this file) listed three
candidates and left the pick open: a village-shop good, a milestone-gated
card rider, or a cosmetic/narrative unlock. Picking now, under the
`ship-a-phase` autonomy contract:

- **Cosmetic/narrative unlock — a milestone epithet on `soulsLine`.**
  Rejected the other two: a shop good is blocked outright (`Character.currency`'s
  own doc comment: "shops have not landed yet" — there is nowhere to spend
  it); a milestone-gated card rider is real economy/balance design (which
  Harvest card, what threshold, what power delta, re-run against the
  ten-theme matrix) with no evidence budget for a fresh re-tune this tick —
  the same reasoning Part 1 (additive erosion), Part 2 (floor not
  replacement), and Part 3 (no cash-out) already used to defer anything
  requiring a balance pass. The narrative unlock is genuinely payoff-free:
  no new state, no new event, no pricing surface, no sim re-run — it reads
  `bankedSouls`, already persisted, and derives a display string.
- **Tiers at 10 / 25 / 50, highest-qualifying-tier wins, epithet appended
  as a second clause** — not a replacement of the existing count clause
  (so `vm.remains.bankedSouls` and the leading "N souls" text stay exactly
  as Part 1b shipped them; only players who cross a threshold see anything
  new). Tier spacing is loosely logarithmic (10, 2.5x, 2x) so early
  milestones come within a realistic multi-combat Harvest run and later
  ones stay a longer-run flex, mirroring how `AKRASIA_DEBT_TIER_HP`/other
  Phase 32 tier constants pick round, easy-to-eyeball thresholds rather than
  tuned-to-the-decimal values.
- **No new state, no new event, no schema change.** The epithet is a pure
  function of the already-persisted `bankedSouls` tally — computed at
  render time in `buildSoulsLine`, the same function Part 1b already owns,
  not stored anywhere. This keeps the change entirely inside
  `memoir.engine.ts` (+ its test file); no `CombatEncounterState`,
  `Character`, or `CombatEvent` shape changes.
- **No mechanics-package change at all.** Unlike Part 1b (which needed a
  `Character.bankedSouls` field), this part reads a field Part 1b already
  added — `axiomancer-mechanics` and `axiomancer-card-editor` are untouched
  and their verify gates are not re-run for this part.

### Outputs

- `axiomancer-mobile/state/presenters/memoir.engine.ts`: new
  `SOULS_MILESTONE_TIERS` constant (`{ min: 50 | 25 | 10, epithet }`,
  highest-first so `.find` returns the highest qualifying tier);
  `buildSoulsLine` appends the matching epithet as a second clause when
  `count` clears the lowest tier. Doc comments on
  `MemoirRemainsViewModel.soulsLine` and the interface's leading comment
  updated to note the part 1c epithet layer.

### Tests

- `axiomancer-mobile/state/e2e/memoir.engine.test.ts`: four new cases —
  stays plain below tier 10 (count 9); appends the tier-10 epithet at the
  boundary (count 10); appends tier-25, superseding tier-10 (count 25);
  appends tier-50, superseding lower tiers (count 50). Existing cases
  (count 0, 1, 7) re-verified green unmodified — all below the lowest
  tier, proving backward compatibility.

### Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

Mobile-only — no mechanics or card-editor surface touched (the field this
part reads was already added by Part 1b). 249 files / 2565 tests green.

### Commit body template

```
feat(mobile): Harvest Soul-bank milestone epithets — phase 32 part 1c

- SOULS_MILESTONE_TIERS (10 / 25 / 50) + buildSoulsLine epithet clause
- doc comments updated on MemoirRemainsViewModel.soulsLine
- tests: below-tier / tier-10 / tier-25 / tier-50 boundaries

Decisions:
- Cosmetic/narrative unlock over a shop good (blocked — no shop system
  live) or a card-rider threshold (real balance design, no evidence
  budget this tick) — see brief §Part 1c Decisions.
- Tiers 10/25/50, epithet appended not replacing the existing count
  clause — no new state/event/schema, mobile-only change.

Closes #<phase-issue-number>
```

## Follow-ups (out of scope this part)

- **Ouroboros face-preview UI** (2026-07-10-theme-identity.md §2, "Echo /
  refrain," CONFIRMED·S, the other half of the retarget item) — nothing
  player-facing shows what Ouroboros will replay before it's played. The
  engine now tracks the correct target (`lastSpellCardId`); a mobile
  surface to preview it is its own small UI slice, not attempted this
  part.
- **Second-thoughts partial detonate** (CONFIRMED·S) — consume ≤2 marks
  instead of `ruptureMarks`' current all-or-nothing `consumeMarks`, so the
  detonate/keep fork is real. Needs a new card-scoped choice primitive
  (which stacks survive) since `ruptureMarks` is a shared verb across
  non-Echo cards too; not attempted this part.
- **CRESCENDO overflow** (PLAUSIBLE·L) — ECHO past the intensity cap
  converts to something else. Explicitly gated in the source doc on "only
  if the cheap items above don't lift the ceiling"; premature before a
  re-run of the ten-theme matrix. (The PA-2 song-tally rework was REFUTED
  on misread evidence — do not resurrect without fresh transcripts.)
- **Damaging plays strip SWAY** (2026-07-10-theme-identity.md §2, "Charm /
  grace," CONFIRMED·S, prior-art PA-6/Dawncaster Charmed rule) — hurt them
  and the charm slips; pure-charm play becomes a real commitment. Note from
  the source doc: SWAY's passive 1/turn decay (`SWAY_DECAY_PER_TURN`) is
  owner-ratified and untouched; this item ADDS a strip, it does not touch
  decay. Not attempted this part (Part 4e's scope is the two milestone
  waypoints only).
- **Mirror-of-longing retarget** (CONFIRMED·S) — RAPPORT-prevented damage
  converts to SWAY instead of raw damage-prevented; defense feeds the win
  condition more directly in-theme. `mirror-of-longing`'s existing
  damage-prevented→SWAY conversion (the one non-card-mechanic `gainSway`
  call site fixed in this part for the latching-flag propagation bug) is
  otherwise untouched.
- **FREE lines build rapport foundation** (PLAUSIBLE·M, Gate 1) — not
  attempted this part.
- **Gate `prophecy-fulfilled` on omen hits** (2026-07-10-theme-identity.md
  §2, "Oracle / augury," also printed CONFIRMED·M — deferred alongside OMEN
  v2's own scope cut, not silently dropped): the finisher should require the
  theme to have actually HAPPENED this combat, not just fire whenever RUPTURE
  finds fuel.
- **Recolor `cassandras-burden` to mind** (CONFIRMED·S) — breaks the heart
  monoculture that makes the Oracle draft solved (today: `signs-and-portents`
  heart, `cassandras-burden` heart, `the-oracles-eye` heart, vs.
  `delphic-ambiguity`/`prophecy-fulfilled`/`fated-course` mind, 0 body).
  Explicitly NOT touched this part — only `cassandras-burden`'s
  `specialMechanics` shape changed (to satisfy the reworked `'omen'` type),
  its `philosophicalAspect` is untouched.
- **PORTENT FREE line** (PLAUSIBLE·M) — FREE peeks + places a marker PAID
  lines cash (Gate 1 gap: today's FREE lines don't feed OMEN at all).
- **Foretell picker + omen telegraph UI** (CONFIRMED·S) — the engine can now
  accept a real `play.omenClaim` choice, but nothing player-facing offers it
  yet; the source doc's own comment ("the engine literally has a comment
  admitting the player never sees what foretell saw") is the UI-legibility
  half of this same complaint, unaddressed by this part's engine-only scope.
  Until this ships, every real (mobile) player's OMEN plays use the
  byte-compatible `window: 1` / die-derived-stance default — see brief §Part
  4d Decisions.
- **Absolution fork on fallen-grace** (heal+cleanse cash-out vs. keep
  riding the debt) — needs the cash-out/tier-reset question resolved as
  part of its own design.
- **Last Word** (mutual-kill clemency while FALLEN).
- **Sin-priced FREE lines** (FREE pays RECOIL as a cost for theme currency,
  no TICK damage on FREE).
- **Self-inflicted DoT ticks counting toward the ledger** — would require
  new per-effect-instance source attribution plumbing (a `sourceId`-aware
  tick breakdown) to distinguish self-authored BLEED from any
  enemy-inflicted BLEED riding the same damage-instance clock; not
  attempted this part.
- **Milestone-gated Harvest card rider / village-shop Soul spend** — the
  two candidates Part 1c did NOT pick (see brief §Part 1c Decisions): a
  Harvest card that reads stronger once lifetime Souls cross a threshold,
  or a village-shop good once a shop system lands
  (`Character.currency`'s own doc comment: "shops have not landed yet").
  Both are real economy/balance design needing their own pass (candidate
  for `/brainstorm-mechanics` or a `/expand` candidate), not attempted
  this part — Part 1c shipped the lower-risk cosmetic/narrative epithet
  instead.
- **Pure alt-win erosion** (kill via emptied `maxHealth` ceiling
  regardless of current HP, no additive current-HP component) — a
  stronger, more literal reading of "erosion of the possible, not the
  present." Deferred until `/deck-tuning` has A/B evidence to retune
  `burstPerSoul` against a design where reap sometimes deals zero
  current-HP damage by construction.
- **Forge S-items** (2026-07-10-theme-identity.md §2, "Forge / foundry" —
  not this part's CONFIRMED-M scope): FREE lines forge (every FREE line
  makes/charges dice material), Overtake legibility (2-pip gate + a live
  burst preview), manufactured spends feed EMBER not MARK
  (`entropy-tax`'s zone hook), and ex-nihilo's wild+0-pips vs colored+1-pip
  choice (PLAUSIBLE, not CONFIRMED).

## DoD

Phase 32 `[ ]` → `[x]` in `plan/steps/01_build_plan.md` flips **this
tick**. Every theme's headline CONFIRMED item (Part 4's "remaining
per-theme M items," Scope's own phrasing) is shipped across all ten
themes as of Part 4f — Echo had no CONFIRMED-M item, so its best
CONFIRMED-S item (the Ouroboros retarget) stood in, same as every other
part's one-item-per-theme cut. Part 1b (Harvest — Souls persist across
combats, "the jar travels") shipped the persistence mechanism itself:
`Character.bankedSouls` (optional + sparse, no migration needed — the
`floatingDice` precedent), the `applyHazardOutcome` write-back on every
outcome, and a Memoir REMAINS read-back. Part 1c (this tick) closes the
last quarter of the P-NEXT item — a milestone epithet layered onto
`soulsLine` at 10/25/50 banked Souls — resolving "what a running Soul
total unlocks" as a cosmetic/narrative recognition tier rather than a
shop good (blocked, no shop system live) or a card-rider threshold
(real balance design, no evidence budget this tick); both remain
Follow-ups for their own design pass. The DoT-clock slice remains
complete because its trigger, Suppuration, lethal-receipt, attribution,
and player-facing outcome witnesses are all present; do not regress it
while tuning. Every part of this brief (1, 1a, 1b, 1c, 2, 3, 4a-4f) has
now shipped — remaining items listed under Follow-ups are genuine
forward-looking design/content work, not wiring this brief's scope
covers, and belong to their own future phase or `/expand` candidate.
