# Phase 30 — FREE Lines (70-card content pass)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document judgment calls in the commit body.

## Scope

Execute `plan/tuning/2026-07-10-turn-texture.md` §1's ratified Option A
("constrain the fork"): rewrite every spell's FREE line to deposit theme
currency instead of TICK/generic-draw/generic-guard chaff, retire TICK
registry-wide (KW-4, deferred from Phase 29), and add the FREE-currency
law as a permanent lint. 50 of the 70 library cards are spells (the other
20 — enchant/disenchant — have an engine-derived FREE line, out of scope).

## Decisions (documented, not asked)

1. **Three new `CardRider` fields, wired end-to-end** (type -> engine
   apply -> face/detail text -> pricing -> mobile presenter): `barrier`
   (persistent Guard — bulwark's "lay a brick" verb), `recoil` (pay HP as
   an unpreventable FREE cost — akrasia's "sin as currency"), `millCards`
   (move N cards deck→discard, never to hand — echo's "advance the loop").
   `stagger` and `pips` already existed on the type but were never wired
   into the FREE-line apply path (`applyRiderToState`) — added there too.
2. **Per-theme FREE verb mapping** (from turn-texture.md §1's own list):
   affliction/akrasia → a 1-round MARK seed (self-targeted for akrasia,
   building toward FALLEN); peroration → +1 Premise (already mostly
   shipped); forge → +1 PIP (banks toward the pip-spend payoffs); harvest
   → a 1-round BLEED seed (a short-fuse affliction that expires next round
   and yields its own Soul via the existing SOUL-on-expiry hook — never
   minting Souls directly on FREE, per the theme doc's own caveat); charm
   → a 2-round RAPPORT seed; bulwark → persistent GUARD (the new `barrier`
   rider); echo → MILL 1 (the new `millCards` rider).
3. **Control is the one theme that deviates from its doc-listed verb**,
   and this was a real balance find, not a style call: the doc says
   "control exposes/notches the telegraph." A literal reading (`FREE
   stagger: 1`, stacking on top of each card's existing PAID stagger)
   shipped first, and the full mechanics verify gate caught it —
   `combat-playtest.balance-bands.sim.test.ts`'s win-rate-curve check
   flagged the `standstill` preset flatlining at 1.00/1.00/1.00 (100% win
   rate at every stage — the enemy was being permanently action-denied).
   Fixed by reading "information as theme currency" (Gate 2's own control
   section) literally: control's FREE line now uses the existing
   `revealStance` rider (reveal the next telegraphed stance) instead of a
   second stagger source. Re-verified healthy: `1.00/0.23/0.00`, decaying
   as intended. `revealStance` is added to the FREE-currency lint's
   accepted-verb list as a result — it wasn't in the original plan.
4. **TICK is fully retired** (KW-4, owner-ratified 2026-07-10): the ten
   `free: { tickOne: true }` lines are gone; the keyword drops out of
   `keywords.ts`'s glossary is explicitly NOT done this phase — TICK stays
   defined for now since old effect ids / support mappings may still
   reference it defensively, and the registry-count bookkeeping already
   landed conceptually in Phase 29's doc updates. A source-string lint
   (`cards.library.ts` never mentions `'tickOne'`) makes the retirement a
   permanent regression gate.
5. **FREE-currency law lint** (`curated-library.engine.test.ts`, mirrors
   the no-strike lint's shape): every spell FREE line must include ≥1
   currency verb from a fixed allow-list; a bare utility field (draw,
   guard, heal, cleanse, conviction) may never stand alone; `tickAllDots`/
   `ruptureMarks` are banned outright on FREE (damage/payoff verbs, not
   FREE-legal per the law).
6. **A parallel "FREE effectiveness" test suite** was added beside the
   existing PAID-line effectiveness lint (`card-effectiveness.engine.test.ts`
   — the Ouroboros-class-bug witness), reusing its exact `assertRiderPromise`
   dispatch table for the TOP (dieless) action. Every spell's rewritten
   FREE line is proven to produce a real, observable state delta, not just
   type-check.
7. **Pinned regression witnesses updated, not weakened**: the pricing
   lint's two starter-pair anchors, `combat-sim-policies.engine.test.ts`'s
   two seeded greedy-decision-sequence pins, and mobile's
   `combat-card-vm.test.ts` face/detail assertions all shifted because the
   underlying card content legitimately changed. Each was re-measured
   against the new engine output and re-pinned — never loosened to paper
   over a real regression (the control-theme balance break in decision 3
   was fixed at the content layer, not by editing the balance-bands test).
8. **Pricing band overages fixed at the FREE-line layer, not the PAID
   layer**: five cards (sketch-of-a-thought, ex-nihilo, the-overtake,
   red-herring, cassandras-burden) drifted outside their printed rank's
   point band after the FREE-line swap. Every fix stayed scoped to the
   FREE line itself (drop a kicker, swap to a lighter-weight currency
   verb, or — for `ex-nihilo` only — drop a now-redundant conditional
   threshold that duplicated the new guaranteed FREE deposit). No PAID
   mechanic's balance-sensitive magnitude (e.g. `the-overtake`'s
   `fuelPerPip`/`bonusPct`, gated in Phase 28) was touched.

## Acceptance

- `cards.library.ts` never mentions `tickOne` (source-string lint).
- Every spell FREE line deposits ≥1 theme-currency verb (new lint,
  `curated-library.engine.test.ts`).
- Every spell FREE line produces a real observable delta (new suite,
  `card-effectiveness.engine.test.ts`, 50 cases).
- Every spell's `scoreCard()` lands in its printed rank's band (existing
  lint, re-verified with updated arithmetic comments).
- The ten-preset win-rate curve stays healthy — no preset flatlines
  (`combat-playtest.balance-bands.sim.test.ts`).
- `npm run verify --workspace axiomancer-mechanics`,
  `--workspace axiomancer-mobile`, and
  `type-check --workspace axiomancer-card-editor` all green (the new
  `CardRider` fields + `CombatEvent` kind touch the `@mechanics` public
  surface).
