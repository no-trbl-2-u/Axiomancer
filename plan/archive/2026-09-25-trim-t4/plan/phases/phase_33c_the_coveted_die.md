# Phase 33c — THE COVETED DIE

> Agent-facing brief. Boss/unique threat phases can carry a coveted die —
> deny it (STAGGER-to-0), fully block it, or answer its stance check's
> yield, and it converts to a temp gold die on your table (spec 33 §1
> payout shape, ceiling-gated). Engine + content only — no mobile UI (the
> flag is off in production; D6b/D6c own the chip-rendering surface).
> Deps: **D2** (shipped) — plays best after D4/D7 tuning but is not gated
> on them (`phase_D7_tuning_rebaseline.md` follow-ups: "33c unblocks
> post-D2").

## Inputs

1. Build-plan row rescope (`01_build_plan.md`, 33c): steal conditions are
   **STAGGER-to-0 / full block / answering the phase's stance check**;
   payout is **a temp gold die** (spec 33 §1 ceiling; overflow → +1◆); the
   old "floating die of that color, cap 3" read-era payout is retired.
2. Original design note (`plan/tuning/2026-07-10-out-of-flow-mechanics.md`
   §2, superseded read-era details only): "Boss/elite telegraphs
   occasionally show a staked enemy die riding the threat phase... enemies
   get identity (which phases they stake = personality)." The *occasional,
   boss-identity* framing survives the rescope; the read-era steal verbs do
   not.
3. Spec 33 §1 (die/table ceiling, materialization priority, overflow →
   +1◆), §2 (open stance checks — `resolveStanceCheck`, `punishes`/
   `yields`), §3 (momentum surge — the **exact payout shape** to mirror:
   a `temporary: true, floating: true` wild/mana die, `tableHasRoom`
   gated, overflow converts to Conviction).
4. Engine primitives read this phase (all in `axiomancer-mechanics/src/Combat/`):
   - `computeRungDenial` / `rungDenied` (`combat.engine.ts` ~L3288) — the
     STAGGER-to-0 read.
   - `attacksLanded` / `attacksFullyBlocked` (`combat.engine.ts`
     `resolveThreatPhase` attack loop) — the full-block read.
   - `resolveStanceCheck` / `stanceCheck.yielded` (`combat.upgradeable-dice.ts`)
     — the answered-yield read.
   - The momentum-surge die-creation block (`combat.engine.ts`
     `applyStanceAndMomentumV2`, ~L1111-1125) — the payout to mirror
     verbatim (`tableHasRoom`, `SURGE_DIE_PREFIX` naming convention,
     `die-overflowed` + `conviction-gained` overflow events).
5. D6e precedent (`0b29ff42`) — the last spec-33 content-only phase: no
   mobile UI, flag-gated, proven via a hermetic e2e suite + an authoring
   test. This phase repeats that shape.

## Scope

- **Types** (`combat.threat.ts` `AuthoredThreatPhase`,
  `combat.encounter.types.ts` `CombatThreatPhase`): add `stake?: boolean`.
  Carried through `resolveAuthored` / `resolveBranchOutcome` /
  `getThreatSequence` / an explicit `enemy.threatSequence` override.
  **No backfill default** — unlike `stanceCheck`, this is never
  auto-generated onto unauthored phases. Absence = no coveted die on that
  phase (the common case).
- **State**: `CombatEncounterState.covetedDiceClaimed?: number[]` — phase
  indices already looted THIS combat (one-time-per-phase steal so a
  repeating/locked final phase can't be farmed on every loop). Initialized
  `[]` in `initializeCombatEncounter`.
- **`resolveThreatPhase`** (`combat.engine.ts`): after `next` is built
  (so the existing yield-Conviction payout composes correctly), resolve
  the steal:
  - Guard: `isUpgradeableDiceEnabled() && phase.stake &&
    !(state.covetedDiceClaimed ?? []).includes(phase.index)`.
  - Method, in priority order (a phase can satisfy more than one; pick
    the strongest signal — denial beats block beats yield):
    1. `rungDenied` → `'stagger'`.
    2. `attacksLanded > 0 && attacksFullyBlocked === attacksLanded` →
       `'block'`.
    3. `stanceCheck.yielded` → `'yield'`.
    4. none of the above → no steal this resolution (the phase stays
       unclaimed for a future loop/resolution).
  - Payout, mirroring the surge-die block exactly: `tableHasRoom(next)` →
    append `{ id: `${COVETED_DIE_PREFIX}${turn}-${log.length}`, color:
    'wild', face: 'mana', state: 'available', temporary: true, floating:
    true }` to both `dice` and `floatingDice`. Else (table full) → +1◆
    via the existing `die-overflowed` event (new `source: 'coveted'`) +
    `conviction-gained`. Either branch marks the phase claimed
    (`covetedDiceClaimed` gains `phase.index`) — a looted phase is spent,
    not retryable, even when the loot converted to Conviction.
  - New event: `{ kind: 'coveted-die-stolen'; phaseIndex: number; method:
    'stagger' | 'block' | 'yield'; dieId?: string }` (`dieId` absent on
    the overflow-to-Conviction branch).
- **Constants** (`combat.upgradeable-dice.ts`): `COVETED_DIE_PREFIX =
  'coveted-'`, mirroring `SURGE_DIE_PREFIX`.
- **Event union** (`combat.encounter.types.ts`): add `coveted-die-stolen`;
  widen `die-overflowed.source` to include `'coveted'`.
- **Authoring law**: exactly **one** `stake: true` phase per BOSS- or
  UNIQUE-difficulty `AUTHORED_THREAT_SEQUENCES` entry; **none** on
  elite/normal/simple entries (elites are common — 39 of 56 authored
  sequences are elite+boss+unique; restricting to boss+unique keeps the
  steal rare and a boss-identity marker, matching the "occasionally"
  framing). The 18 boss/unique entries (14 boss + 4 unique):
  `enemy-king-of-revenge, enemy-mirac, enemy-rawhead-rex,
  enemy-fate-spinner, enemy-ra-amin-ka, enemy-rangda,
  enemy-zoma-ascendant, enemy-elder-fire-giant, enemy-tezcatlipoca,
  enemy-arch-demon, enemy-beelzebub, enemy-the-doorwarden,
  enemy-the-index, enemy-the-sophist, enemy-kudan, enemy-death,
  enemy-the-abortive, enemy-the-incompleteness`. Each stakes its **2nd
  authored step** (0-indexed position 1) — never the opening phase (a
  stance-less player can't answer a yield check yet) and never the
  closing/escalated phase (too swingy to gate a reward behind). All 18
  entries have a plain (non-branch) step at position 1, so branch-fork
  selection is never in question this phase.
- **No mobile/UI work.** `phase.stake` is data a future phase (rides with
  D6b/D6c's chip work) renders. This phase proves the mechanic in the
  engine + a hermetic sim/e2e, matching D6e's precedent.

## Decisions made upfront — DO NOT ASK

1. **Steal conditions are exactly the three named in the rescope** —
   STAGGER-to-0, full block, stance-check yield. Generic soft-control
   denial (roll-penalty / DISRUPT-variety deny) does **not** count: it is
   cumulative debuff pressure, not a rung-STAGGER victory, and the
   rescope text names STAGGER specifically.
2. **One-time per phase**, tracked via `covetedDiceClaimed` (persists for
   the whole combat, reset at `initializeCombatEncounter`).
3. **Payout is a straight mirror of the momentum-surge temp gold die** —
   spec 33 §1 says "payout becomes a temp gold die"; no new die
   archetype, no new ceiling rule.
4. **`stake` authored only on boss/unique, one phase each** (18 total) —
   never on elite/normal/simple, never via backfill/default-generator.
5. **Branch phases are never a stake target this phase** — sidesteps the
   fork-selection question entirely (none of the 18 chosen phases are
   branch steps).
6. **Inert while the flag is off** — byte-identical to pre-33c behavior,
   guarded by `isUpgradeableDiceEnabled()`.
7. **No UI change.** Follow-up phase, not this one.
8. **Priority order when multiple conditions hold**: stagger > block >
   yield (documented above) — a single event, never a double-payout for
   one phase resolution.

## Prove (DoD)

- Hermetic e2e (new `coveted-die.engine.test.ts`, mirroring
  `upgradeable-dice.engine.test.ts` fixtures/rng-seeding style):
  - Flag off → `phase.stake` true, conditions met → no steal, byte-identical.
  - Each of the three methods (stagger / block / yield) pays a die when
    `tableHasRoom` is true; asserts `coveted-die-stolen` event + the new
    die's shape (`temporary`, `floating`, `color: 'wild'`, id prefix).
  - Table-full → overflow converts to +1◆ (`die-overflowed` source
    `'coveted'` + `conviction-gained`), phase still marked claimed.
  - An already-claimed phase index does not re-pay on a second
    resolution (simulates a repeating/locked final phase).
  - A phase with no `stake` never steals regardless of conditions.
- Authoring test: every boss/unique `AUTHORED_THREAT_SEQUENCES` entry has
  exactly one `stake: true` phase (position 1); no elite/normal/simple
  entry has any `stake: true` phase.
- `npm run verify -w axiomancer-mechanics` green.
- Flip 33c `[x]` in `plan/steps/01_build_plan.md` with commit hash.

## Follow-ups (out of scope)

- Mobile telegraph chip rendering `stake` + the steal outcome — rides
  with D6b/D6c's chip work.
- A D7 sim measurement/gate for coveted-die income, if the owner wants
  one ratified (no existing D3 F-gate names this mechanic; D3's report
  predates this phase).
- Branch-fork stake targets, if a future boss wants one.
