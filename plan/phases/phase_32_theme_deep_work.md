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
- [ ] Part 1b — Harvest: Souls persist across combats (deferred, see below)
- [x] Part 2 — Bulwark: RIPOSTE reflects the prevented blow (this tick)
- [x] Part 3 — Akrasia: DEBT ledger (this tick; Absolution fork / Last Word /
      Sin-priced FREE lines deferred, see below)
- [x] Part 4a — Control: TURNABOUT (this tick)
- [x] Part 4b — Oratory: milestone drip (this tick)
- [x] Part 4c — Forge: OVERHEAT (this tick)
- [x] Part 4d — Oracle: OMEN v2 (this tick; recolor cassandras-burden /
      gate prophecy-fulfilled / PORTENT / foretell picker UI deferred, see
      below)
- [ ] Part 4 (remaining) — charm resolve milestones, echo — per §2 of the
      source doc (4e/4f, picked up one theme per future tick)

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

## Follow-ups (out of scope this part)

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
- **Part 1b — Souls persist across combats with milestone riders**
  ("the jar travels"): needs a persistent-currency slot on the
  character save (`src/Game/game.migrate.ts` gets a new migration),
  a mobile surface to show the carried bank between fights, and
  milestone-rider design (what a running Soul total unlocks). Genuine
  cross-run save-schema work, P-NEXT tagged in the source doc — not
  required for this pass's graded properties (P-IDENT/P-ARC).
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
- Part 4 (remaining per-theme M items) — see Scope; its own future
  `/ship-a-phase` tick against this same brief (extended with its own
  Part section when picked up).

## DoD

Do **NOT** flip Phase 32 `[ ]` → `[x]` in `plan/steps/01_build_plan.md`
yet — Parts 1b and 4 remain. The DoT-clock slice is complete only because
its trigger, Suppuration, lethal-receipt, attribution, and player-facing
outcome witnesses are all present; do not regress it while tuning. A
future tick that ships the last remaining
part ticks the row then.
