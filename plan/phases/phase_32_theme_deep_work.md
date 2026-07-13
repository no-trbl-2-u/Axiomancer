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
- [ ] Part 2 — Bulwark: RIPOSTE reflects the prevented blow
- [ ] Part 3 — Akrasia: DEBT ledger
- [ ] Part 4 — remaining per-theme M items (oratory milestone drip,
      forge OVERHEAT, control TURNABOUT, oracle OMEN v2, charm resolve
      milestones, echo — per §2 of the source doc)

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

## Follow-ups (out of scope this part)

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
- Parts 2-4 (bulwark RIPOSTE, akrasia DEBT ledger, remaining per-theme
  M items) — see Scope; each is its own future `/ship-a-phase` tick
  against this same brief (extended with its own Part section when
  picked up).

## DoD

Do **NOT** flip Phase 32 `[ ]` → `[x]` in `plan/steps/01_build_plan.md`
yet — Parts 1b-4 remain. The DoT-clock slice is complete only because
its trigger, Suppuration, lethal-receipt, attribution, and player-facing
outcome witnesses are all present; do not regress it while tuning. A
future tick that ships the last remaining
part ticks the row then.
