# Phase 31 — The Roll and the Read (momentum wheel, THE STAKE, signature repricing)

> **PARTIALLY SUPERSEDED (2026-07-17, Phase D1 / spec 33):** the
> hidden-stance read economy (Part 2's wager subject, `resolveRead`-as-draft,
> read-win ◆, unpicked-die income) is retired by spec 33 §2. **THE STAKE is
> retired ENTIRELY** (owner call at D1 — plumbing removed in D2, not
> rewired). The momentum wheel (Part 1) is absorbed into spec 33 §3's stance
> chain — its landed-play gate and temporary-die persistence filter survive,
> but its truth table does NOT: chain breaks now reset to **null** (owner
> call, supersedes restart-at-played-color) and FREE plays no longer advance
> the chain (spec 33 §3 rule 5 reverses this brief's Decision (1)). Part 3's
> `sig-conviction-strike` repricing stands pending D3's economy derivation.

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document judgment calls in the commit body.

## Scope

Build plan row 31 bundles three related engine work items, ratified
2026-07-10 (`plan/tuning/2026-07-10-momentum-scoping.md`,
`.../2026-07-10-out-of-flow-mechanics.md` §1,
`.../2026-07-10-turn-law-and-honest-baseline.md` §4):

1. **Port the combat momentum WHEEL engine-native.** Today it's a
   host-side-only mechanic in mobile
   (`axiomancer-mobile/state/combat/momentum.ts` +
   `CombatEncounterPanel.tsx`) with a standing
   `TODO(engine): fold momentum into axiomancer-mechanics`. The
   engine and sim policies currently cannot see it at all.
2. **THE STAKE** — a new pre-play Conviction wager on the enemy's
   hidden stance, paid out in floating dice on a correct call.
3. **Reprice the signature economy** against Phase 27's honest
   (post-Turn-Law) income baseline — `sig-conviction-strike`
   dominated pre-law transcripts (90-95% of damage) under farmed
   income; re-measure and reprice against the real baseline.

**Scoping note** (flagged by research pass): `plan/PHASE_CANDIDATES.md`
maps these to three separate slots (EA-6/7/8 → phases 31/32/33). The
authoritative source of truth is `01_build_plan.md`'s Phase 31 row,
which explicitly bundles all three and was ratified the same day as
the candidate mapping — the row wins (it's the file `/ship-a-phase`
reads to pick scope, and it postdates/supersedes the candidate sketch).
Shipping combined, one PR, three focused commits.

## Part 1 — Momentum wheel engine-native

### Current state (verified in code)

- `axiomancer-mobile/state/combat/momentum.ts` — pure module: wheel
  order `heart -> body -> mind -> heart`, `advanceWheel(lit, played)`
  (wrong/repeated stance resets to `[played]`; completing the 3rd node
  returns `{ lit: [], completed: true }`), `momentumDieId`/
  `isMomentumDieId` (id prefix `momentum-`).
- `CombatEncounterPanel.tsx` (`onApply`, ~440-502): reads the played
  card's stance from hand *before* the play commits, calls
  `advanceWheel` **synchronously before `playCombatCard` runs**, then
  splices a raw `CombatManaDie` (`floating: true, temporary: true`)
  into engine state after `apply()`. This is the exact `TODO(engine)`
  site. Bug inherited from this ordering: the wheel advances even when
  the subsequent play fizzles.
- Engine side: `playCombatCard` (`combat.engine.ts:755`) dispatches to
  `playTopAction`/`playBottomAction`, both of which push a
  `{ kind: 'card-played' }` event **only when the play actually lands**
  (every fizzle-before-landing return path — missing draft, wrong die
  color, already-in-play unique — returns before that push). This is
  the reliable "did this play land" signal the host-side code lacks.
- `startTurn` (`combat.engine.ts:445-516`) already merges
  `state.floatingDice` into the fresh `dice` tray every call
  (lines 494-496) — a momentum die implemented as a `floating: true`
  entry needs zero new tray-merge code.
- `combat.encounter.sim.ts`'s powered-play loop (~343-394) already
  walks `working.dice` for any `floating && available` die as a power
  source — a floating-flagged momentum die is automatically spendable
  by every sim policy with zero new sim code.
- `getFloatingDiceColors` (`combat.engine.ts:3704-3710`) is the
  combat-end write-back to the character save. It does **not** filter
  on `temporary` today — a latent bug (currently unreachable, since no
  `temporary: true` floating die has ever existed engine-side) that
  this phase must close, or the momentum die would leak into
  cross-combat persistence, violating the owner-ratified "no wheel
  persistence" rule.

### Outputs

- `combat.encounter.types.ts`: `export type WheelStance = 'heart' | 'body' | 'mind';`
  new field `momentumWheel?: WheelStance[]` on `CombatEncounterState`;
  new `CombatEvent` variants `{ kind: 'wheel-lit'; lit: WheelStance[] }`,
  `{ kind: 'wheel-completed'; dieId: string }`.
- `combat.engine.ts`: module-private `advanceWheel`/`nextWheelStance`/
  `isWheelStance` ported 1:1 from the mobile module's truth table;
  exported `isMomentumDieId`; a private `advanceMomentumWheel(transition, stance)`
  wrapper called once from `playCombatCard` after dispatching to
  top/bottom action. Fix `getFloatingDiceColors` to `.filter(d => !d.temporary)`.
- Mobile: delete the host-side splice + `wheelLit`/`chargedRef`/
  `momentumCounter` state from `CombatEncounterPanel.tsx`; the view
  model (`state/presenters/combat-encounter.engine.ts`) projects
  `momentumWheel: WheelStance[]` and `momentumCharged: boolean`
  (derived: any `floating` die in `vm.dice` whose id is
  `isMomentumDieId`) straight off engine state. `CombatBoard`/
  `MomentumWheel` keep reading `wheelNext`/`isWheelStance` from
  `state/combat/momentum.ts` (kept, UI-only pure helpers) but no
  longer own `advanceWheel`/grant logic — that block is deleted from
  the mobile module; its test coverage moves to the new engine e2e
  test (below), ported assertion-for-assertion.
- `combat.cli.ts`: one `Wheel: ...` status line in the per-phase header
  (~line 456-460) rendering `lit` nodes + `charged` state, so auditors
  can see the mechanic (today: nothing renders it anywhere).

### Decisions made upfront — DO NOT ASK

- **Ratifying the two open rules from the momentum-scoping doc:**
  (1) A FREE (top, unpowered) play still advances the wheel — matches
  today's host behavior (no `useBottom` branch in the host code); the
  card's *stance*, not its power source, is what the wheel tracks.
  (2) A fizzled play does **not** advance the wheel — this CORRECTS
  the host-side bug (wheel advanced before the engine confirmed the
  play landed) by gating on the `card-played` event, which only fires
  on a landed play. (3) No cross-combat wheel persistence — unchanged,
  reinforced by the `getFloatingDiceColors` filter fix.
- **Implementation shape: reuse the floating-die pool, don't invent a
  parallel array.** The momentum die is `{ floating: true, temporary: true }`
  with a `momentum-` id prefix, pushed into both `state.dice` (so it's
  immediately draggable this turn, mirroring the `forgedFloating` splice
  pattern already used by `forge_floating_die`) and `state.floatingDice`
  (so `startTurn` re-merges it every subsequent turn with zero new code,
  and sim policies see it automatically via the existing floating-die
  loop). This is the lower-risk path flagged by the research pass:
  100% of the tray/sim/spend plumbing is already floating-die-aware;
  the only genuinely new code is the wheel-advance reducer, the grant
  call site, and the persistence-filter fix.
- **"Charged" gate**: while any `momentum-`-prefixed die exists in
  `state.floatingDice`, the wheel does not advance on further plays
  (mirrors the host's `chargedRef` guard) — presence in `floatingDice`
  is a reliable "still unspent" signal since every spend path filters
  the die out of that array on spend (never marks it `state: 'spent'`
  in place).
- **Sim-policy behavioral bias is out of scope.** Policies already see
  and can spend the granted die for free (via the existing floating-die
  loop) — that satisfies "sims learn the wheel exists." Teaching a
  policy to *seek* wheel-advancing plays over otherwise-equal options
  is a follow-up, not required for this phase (the wheel becoming
  visible + spendable is the actual gap named in the scoping doc; the
  scoping doc does not ask for policy-level wheel-seeking heuristics).
- **The mobile info-modal copy bug** ("the wild die lasts until spent
  or the turn ends" — actually until spent or combat ends) is a
  pre-existing copy inaccuracy, not something this phase's engine
  change makes worse or better; left as a follow-up (see below), fixed
  opportunistically only if the modal component is touched anyway.

## Part 2 — THE STAKE

### Current state (verified in code)

- Does not exist. Two design docs describe it with a timing wording
  difference: the Gate-4 summary says "before the draft"; the full
  underlying audit spec (`cross-new-mechanics.md` C3/WI-3) says
  "after drafting, before playing cards," with a settable-once-per-round
  `placeStake` action and settlement "at the top of `resolveThreatPhase`."
  **The full WI-3 spec is authoritative** (more detailed,
  acceptance-criteria-bearing, internally consistent with a settlement
  hook that already has the revealed stance in hand) — ship post-draft,
  pre-play.
- Conviction: `state.conviction: number` (`combat.encounter.types.ts:521`),
  cap `CONVICTION_CAP = 12` (`combat.engine.ts:124`). Currently has
  exactly one sink: `playSignatureSkill`. THE STAKE is the second.
- Floating dice: `CombatManaDie { floating: true }`, cap
  `FLOATING_DICE_CAP = 3` (`combat.dice.ts:136`), minted via the
  `forge_floating_die` code path (`combat.engine.ts:2075-2096`) —
  reused verbatim for STAKE payouts (these ARE meant to be real,
  persistent floats, unlike Part 1's temporary momentum die).
- The enemy's stance for every threat phase is authored/fixed at
  `initializeCombatEncounter` time (`threatPhases[idx].enemyStance`,
  `combat.engine.ts:340`) — nothing random happens at resolution. What's
  hidden is purely `state.revealedStances: number[]` (player visibility),
  revealed at `draftStanceDie`'s first contest of the phase
  (`combat.engine.ts:628-632`). `resolveThreatPhase`
  (`combat.engine.ts:2668+`) has the phase's `enemyStance` immediately
  available — the correct settlement hook.
- No new `CombatEncounterPhase` enum value is needed either way (before-
  or after-draft): both timings live inside the existing `'phase-play'`
  window; the wager is a state-field write, not a phase transition.

### Outputs

- `combat.encounter.types.ts`: `stake?: { color: WheelStance; amount: 2 | 4 | 6 }`
  on `CombatEncounterState`; new `CombatEvent` variants
  `{ kind: 'stake-placed'; color: WheelStance; amount: 2 | 4 | 6 }`,
  `{ kind: 'stake-won'; color: WheelStance; payout: 'colored' | 'colored-pip' | 'wild' }`,
  `{ kind: 'stake-lost'; amount: 2 | 4 | 6 }`.
- `combat.engine.ts`: `placeStake(state, color, amount)` — rejects
  (fizzle-style no-op event) if `state.stake` already set, `phase !== 'phase-play'`,
  `state.draftedDieId === null` (post-draft gate), or
  `conviction < amount`; spends the Conviction immediately, sets
  `state.stake`. Settlement folded into the top of `resolveThreatPhase`:
  compare `state.stake.color` to `phase.enemyStance`; win → mint a float
  via the existing `forge_floating_die` mint shape (2◆ → colored,
  4◆ → colored +1 pip, 6◆ → wild), respecting `FLOATING_DICE_CAP`
  overflow → +1◆ fallback (same as every other float mint); lose →
  stake is already spent (nothing more to deduct) + one extra
  escalation tick via the same lever `resolveThreatPhase` already uses
  for the round-escalation clock. `state.stake` clears either way.
- `combat.sim-policies.ts` / `combat.encounter.sim.ts`: `stake` heuristic
  — `greedy` places a stake when the current phase's stance is already
  known via `sig-read-opponent`'s reveal (own scouted info, not
  omniscience — `blind`'s witness must stay uninformed); `blind` never
  stakes (matches the doc's acceptance criterion 2: the greedy-vs-blind
  gap must become measurably nonzero).
- Mobile: one stake chip near the Conviction counter (3 stance icons ×
  3 amounts), a resolution toast at threat-phase reveal. Zero new drag
  surface (matches the doc's own "no new drag-and-drop grammar needed").

### Decisions made upfront — DO NOT ASK

- **Post-draft, pre-play timing** (per WI-3, overriding the summary
  doc's looser "before the draft" phrasing) — see above.
- **Loss penalty is the escalation tick only**, not an additional
  Conviction or HP cost — the staked ◆ is already gone (spent at
  placement), so "losing" only needs one additional consequence to
  make the read matter; re-using the existing escalation lever avoids
  inventing a new punishment currency.
- **One stake per phase**, cleared on settlement regardless of outcome
  — no carrying a stake across phases, no stacking multiple stakes.
- **The Oracle card is DEFERRED, not shipped this phase** — discovered
  during implementation: `cards.library.ts` is doctrine-locked at exactly
  70 cards / 7 per theme (verified by count); adding an 8th Oracle card
  breaks that invariant. `CLAUDE.md` is explicit that the card POOL is
  `/deck-tuning`'s domain (sandbox-first A/B, promote-or-swap), not
  ship-a-phase's. Moved to Follow-ups — the STAKE mechanic itself ships
  complete and playable without this flavor card.

## Part 3 — Reprice the signature economy

### Current state (verified in code)

Full signature roster (`combat.signature.ts`, 246 lines):

| id | kind | cost | notes |
|---|---|---|---|
| `sig-read-opponent` | scout | 1◆ | reveal current+next stance |
| `sig-press-the-point` | reroll | 4◆ | reroll spent/blocked-X dice |
| `sig-second-wind` | sustain | 4◆ | draw 2 + heal 12% max HP |
| `sig-overwhelming-argument` | control | 8◆ | hard petrify (boss-staggers) |
| `sig-conviction-strike` | dot | 7◆ | guaranteed poison, never fizzles |
| `sig-disarming-plea` | mercy | 6◆ | HEART-only charm + flat chip |
| `sig-rallying-blow` | conclude | 6◆ | BODY-only, 2dmg/stack finisher |
| `sig-clever-gambit` | draw | 4◆ | MIND-only draw 2 + refresh |

`convictionThreshold` per sim policy (`combat.sim-policies.ts:168-298`):
greedy/blind/dot-weaver/aggro-brute/chaos = 7, control-lock = 8,
turtle = 9, mercy-seeker = 6 — consumed every powered-play loop
iteration in `combat.encounter.sim.ts:353`. A second, independent
hardcoded threshold lives in `combat.autoplay.ts:101`
(`conviction >= 6`), not sourced from `CombatSimPolicy` — must be
audited alongside the policy table, not missed.

The 90-95%-damage-share figure for `sig-conviction-strike` predates
both Phase 26 (Turn Law) and Phase 27 (re-baseline) — it was measured
under farmed income. **This phase re-measures before repricing**
(Gate 0's own ordering: §3 re-baseline → §4 reprice), per
`2026-07-10-turn-law-and-honest-baseline.md` §4.

### Outputs

- Run `npm run combat-playtest -- --stage=all --policy=all` (or the
  project's equivalent honest-income matrix harness — same one Phase 27
  used) to re-measure `sig-conviction-strike`'s current damage-share
  and dead-signature rate under the shipped Turn Law + THE STAKE's new
  Conviction sink (Parts 1-2 land in the same phase's earlier commits,
  so this measurement reflects the full phase, not a stale baseline).
- If dominance survives (share still clearly >60%): reprice
  `sig-conviction-strike`'s cost upward (raise ◆ cost) and/or reduce
  its guaranteed-never-fizzles floor, documenting the exact before/after
  numbers in the commit body per Gate 0 §4 lever 1 ("signature costs /
  effects priced against honest income"). If dominance already dropped
  below the threshold (plausible: Turn Law + a second Conviction sink
  both suppress spam independently), document the measured numbers and
  make no cost change — do not fix what isn't broken.
- Update every `convictionThreshold` this repricing touches (both the
  `combat.sim-policies.ts` table and `combat.autoplay.ts:101`) and the
  test pins in `combat-sim-policies.engine.test.ts` that assert specific
  threshold values.
- Re-run `combat-playtest.balance-bands.sim.test.ts` after any numeric
  change; update its pinned bands only if the new curve is intentional
  and still respects the locked 80/50/25-35/0 doctrine
  (`CLAUDE.md` "Load-bearing doctrine (set 2026-07-08)").

### Measured (2026-07-13, post Parts 1-2)

`buildCombatSummary`/`recordAttribution` never attributes signature-applied
DoT ticks to the casting signature (they land in the "lingering
afflictions" bucket) — literal damage-share isn't available from existing
tooling without building new attribution plumbing, which is out of this
phase's scope. Used **cast-share** as the available, honestly-labeled
proxy instead: a 540-run stage-matrix (`COMBAT_STAGE_ORDER` × every stage
enemy × 30 seeds, `greedy` policy, policy-pick decks — mirroring
`runPlaytestCell`'s own deck-building) via a new `signatureCastsByKind`
field added to `runOneEncounter`'s return (mirrors the existing
`turnLawBlocked`/`stakesPlaced` counters). Result: only 2 of 8 signatures
ever fired at all (`sig-conviction-strike`, `sig-overwhelming-argument` —
`mercy`/`conclude`/utility kinds never reached `bestSignature`'s
affordability+kind filter under `greedy`'s funded kinds + these decks), and
of the 67 total casts across 540 runs, `sig-conviction-strike` took 56
(83.6%) — the dominance survives Parts 1-2's independent Conviction-sink
corrections, confirming Gate 0's own suspicion that the old 90-95%
damage-share figure understated a *structural* mechanism, not just a farmed
one.

**Root cause, not just correlation**: `sig-conviction-strike` cost 7◆,
`sig-overwhelming-argument` cost 8◆, and `greedy`'s `convictionThreshold`
sits at 7 — so any run that banked exactly 7 (not yet 8) Conviction could
*only* ever afford the DoT signature; `bestSignature` (`combat.encounter.sim.ts:206-218`)
already filters by `conviction >= cost`, so control never got a look in
that 1◆ window. Combined with `sig-conviction-strike` being the
guaranteed-never-fizzles pick, it held a double edge (cheaper AND safer).

### Decisions made upfront — DO NOT ASK

- **Measure-first, change-only-if-warranted** — done above; the
  dominance survived, so lever 1 fires.
- **The fix is price parity, not a magnitude nerf**: raise
  `sig-conviction-strike` 7◆ → 8◆ to match `sig-overwhelming-argument`.
  This removes the structural "only-affordable-at-7" edge without
  touching either signature's actual payload — both compete on merits
  once a policy holds 8◆, instead of dot auto-winning the 7-7 gap.
- **No `convictionThreshold` changes needed.** `bestSignature` already
  gates per-signature by `conviction >= cost` (not by the coarser
  `convictionThreshold` policy gate, which only decides whether to
  *attempt* a cast at all) — raising the cost alone makes both
  signatures equally unaffordable until 8◆, with zero risk of stranding
  a policy or breaking the `convictionThreshold === 7` pins in
  `combat-sim-policies.engine.test.ts`.
- **`combat.autoplay.ts:101`'s hardcoded `conviction >= 6` pre-filter is
  left unchanged.** It's a cheap pre-check before `bestAutoSignature`,
  which does its own real `conviction < sig.cost` filter
  (`combat.autoplay.ts:66-73`) — so no fizzle risk from the repricing;
  the outer 6 just occasionally triggers one extra no-op lookup in the
  6-7 Conviction band, unchanged behavior otherwise. Touching it is
  unrelated scope.
- **`combat-playtest.balance-bands.sim.test.ts` needed no pin changes**
  — re-ran clean; the win-rate curve is driven by card play, not
  signature spam (signatures average 0.12 casts/run even before this
  change), so a 1◆ signature-cost shift doesn't move the doctrine bands.
- **Repricing lever order follows Gate 0 §4 verbatim**: (1) cost/effect
  tuning first (done), (2) theme-flavoring is Gate 2 scope (not this
  phase), (3) Conviction sinks-as-decisions is THE STAKE (Part 2, same
  phase, already shipped). This phase only exercises lever 1.

## Tests

- `axiomancer-mechanics/src/Combat/e2e/momentum-wheel.engine.test.ts`
  (new) — ports every truth-table case from
  `axiomancer-mobile/state/combat/__tests__/momentum.test.ts`
  (start-anywhere, wrap-around succession, 3rd-node completion+empty,
  wrong-stance reset incl. self-repeat) against the engine's
  `advanceMomentumWheel`/`wheel-lit`/`wheel-completed` events, plus:
  fizzled play does NOT advance the wheel (the corrected behavior);
  a FREE play DOES advance the wheel; the granted die is immediately
  spendable the same turn; `getFloatingDiceColors` excludes the
  momentum die at combat end; a cross-policy sweep (mirroring
  `turn-law.engine.test.ts`'s pattern) confirming no policy crashes on
  wheel state across every `COMBAT_SIM_POLICY_ORDER` entry.
- `axiomancer-mechanics/src/Combat/e2e/the-stake.engine.test.ts` (new)
  — place/settle win-tiers (2/4/6◆)/loss+escalation/reject-double-stake/
  reject-insufficient-◆/cap-fallback-to-conviction, mirroring
  `floating-die-persistence.engine.test.ts`'s float-cap assertion style.
  `combat-sim-policies.engine.test.ts` gets new assertions for the
  `greedy` stake heuristic (stakes when informed) vs `blind` (never
  stakes) producing a nonzero win-rate gap at mid/late stage.
- `axiomancer-mobile/state/combat/__tests__/momentum.test.ts` — trim to
  the UI-only helpers that survive the port (`wheelNext`, `isWheelStance`);
  delete the `advanceWheel`/`momentumDieId` cases (moved to the engine
  test above).
- Signature repricing: no new test file — update existing pins in
  `combat-sim-policies.engine.test.ts` and
  `combat-playtest.balance-bands.sim.test.ts` to match whatever the
  measure-then-reprice pass concludes.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
```

## Deploy gate

```bash
npm run deploy:check
```

## Git

Three focused commits (one per part), each following the existing
commit-message conventions; a fourth ticks the DoD. Exact bodies
written at commit time per `ship-a-phase.md` §10 (list "Decisions"
from the corresponding section above).

## DoD

Flip Phase 31 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append
the commit hash(es). Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 31 shipped — The Roll and the Read"
git push origin main
```

## Confirm deploy

```bash
npm run deploy:check
```

Iterate to green per the skill failure-mode rules.

## Follow-ups (out of scope this phase)

- Sim-policy behavioral bias toward wheel-seeking plays (Part 1) —
  visibility + spendability ship this phase; active-seeking heuristics
  are a follow-up if the audit later finds the wheel still under-used
  by policies despite being spendable.
- The mobile momentum info-modal's "lasts until spent or the turn ends"
  copy vs the real until-spent-or-combat-ends lifetime — pre-existing
  inaccuracy, fixed opportunistically only if that component is touched
  for another reason.
- THE COVETED DIE, GLYPHS, and the rest of the Gate-4 out-of-flow batch
  — explicitly staged after THE STAKE in
  `2026-07-10-out-of-flow-mechanics.md`, not this phase.
- The "Wagered Sight" Oracle uncommon (omen riders ×1.5 while a Stake
  settled this phase) — route through `/deck-tuning` as a card-pool
  swap-or-add candidate (the theme is at its 7-card cap; shipping it
  means retiring an underperforming Oracle card, a balance call
  `/deck-tuning` owns, not ship-a-phase).
- Theme-flavored signature variants (Gate 0 §4 lever 2) — coupled to
  Gate 2 theme work (Phase 32), not this phase's repricing pass.
