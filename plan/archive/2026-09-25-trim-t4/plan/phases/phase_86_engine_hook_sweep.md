# Phase 86 — Engine hook sweep

> Promoted 2026-09-15 via `/oversight` from `plan/PHASE_CANDIDATES.md`
> (score 4.5). Brief generated 2026-09-16 by `/ship-a-phase` §9 (tooling /
> mechanics-cleanup phase — the page-family brief sections don't apply;
> adapted per Phase 81/79's precedent).

## Outcome

`combat.engine.ts` carries 19 `zoneHas(state, '<card-id>')` hook sites keyed
to card ids that resolve nowhere in `cardLibrary`, Haunts, or Allies —
pre-THE-BIG-NUMBERS-REWRITE "profane canon" era leftovers, each permanently
dead because the card that would gate them into `persistentZone` /
`enemyAttachments` no longer exists. This phase deletes all 19, rewriting the
oracle-omen-v2 telegraph harness (`fated-course` forcing clause,
`the-oracles-eye` amplification/reveal clauses) so the surviving OMEN v2
mechanics read cleanly without them, and retires the four tests that pinned
now-deleted dead-card behavior. It also closes the standing
`the-sextons-count` TWIN-trigger loop-call: the card's printed text names
RECALL/REPLAY/TWIN, but only RECALL/REPLAY were ever wired (TWIN was trimmed
from the text 2026-09-04 pending this exact scoping work) — this phase wires
TWIN at the correct point (after the `directDamage`/`drawPile`/`discard`
locals exist) and restores the printed clause.

## Why

`plan/AUDIT.md` carries two `[loop-call]` rows, both DECIDED via `/oversight`
2026-09-15 and routed here:

- **Dead engine hooks** (filed during `/adjust-cards` pass 1, 2026-09-04):
  19 orphaned `zoneHas` sites, each with its own dead-card comment. Decision:
  ship the sweep.
- **the-sextons-count missing TWIN** (filed during `/adjust-cards` pass 1,
  2026-09-04): RECALL/REPLAY fire, TWIN doesn't — the printed text was
  trimmed rather than shipping a rushed wire, because the natural hook point
  (the `twinCharge`/`echoed` resolution, ~line 2340) sits in a different
  variable scope than the RECALL/REPLAY sites (~line 3155/3204) — before
  `directDamage`/`drawPile`/`discard` are declared — and a naive fix risked
  double-counting when a twinned card also carries `reprise`/`replay_last`
  (their own hooks already toll the bell once per play, scaled internally by
  `echoFactor`; a second, TWIN-triggered generic toll on top would double it).
  Decision: re-add TWIN, correctly scoped and reprise/replay-guarded.

## Decisions made upfront — DO NOT ASK

- **The 19 dead ids** (confirmed absent from `cardLibrary`/Haunts/Allies by a
  fresh grep, not just trusted from the 2026-09-04 filing): `forge-masters-
  stamp`, `crown-of-thorns`, `venom-and-vein`, `bone-orchard`, `stuck-in-
  their-head`, `anvil-of-form`, `practiced-cadence`, `mirror-of-guilt`,
  `entropy-tax`, `quagmire-of-doubt`, `hedgehogs-dilemma`, `mirror-of-
  longing`, `crumbling-resolve`, `achilles-and-the-tortoise`, `fated-course`,
  `the-oracles-eye`, `irresistible-grace`, `captive-audience`, `resonant-
  chamber`. Each `zoneHas(state, '<id>')` site is deleted; where the
  conditional fed a computed bonus (e.g. `crownBonus`, `zoneIntensity`,
  `quagmire`, `crumbleRungs`, `bonusDraw`) the local is deleted and its
  downstream use simplified to the always-true remaining case or a literal
  `0`, never left as a dead always-false branch.
- **`anvil-of-form`'s four `pips: zoneHas(state, 'anvil-of-form') ? 1 : 0`
  sites become `pips: 0`.** Same computed value today (the card never
  existed to flip it); simplest honest reduction.
- **The oracle-omen-v2 telegraph harness (`resolveThreatPhase`'s OMEN
  boundary block) is rewritten, not just stripped.** `fated-course`'s
  "force the incoming stance to the pending omen's claim" clause and `the-
  oracles-eye`'s "+50% rider" / "always reveal next stance" clauses are
  removed at the source (the `phasesForOmen` forcing indirection collapses
  back to reading `threatPhases[nextIndex]` directly; the rider `scale` is
  just `omen.claimScale`), rather than left as permanently-false `if`
  guards — matching the phase's own "rewriting oracle-omen-v2's telegraph
  harness off fated-course first" framing in `01_build_plan.md`.
- **the-sextons-count's TWIN toll is a new, separate hook** placed
  immediately after the mechs loop closes (~old line 3360, replacing the
  now-deleted `practiced-cadence` block that sat there), gated on
  `twinCharge && !sextonsTolled`. A new `sextonsTolled` boolean (declared
  alongside `overkillExcess`) is set `true` by the existing RECALL/REPLAY
  hooks when they fire, so a card that is BOTH a `reprise`/`replay_last`
  carrier AND resolves under an armed TWIN charge tolls the bell exactly
  once (from its own RECALL/REPLAY site), not twice. A card that resolves
  under TWIN with no `reprise`/`replay_last` mechanic of its own tolls once
  from the new generic site. This is the "guarded against double-counting
  with reprise" resolution named in the loop-call.
- **Card text restored, not reworded further.** `grave.cards.ts`'s
  `theSextonsCount.persistentEffect` goes back to "Whenever you RECALL,
  REPLAY, or TWIN a card, the foe loses 8 VITAE and you MILL 1." — the exact
  clause the 2026-09-04 pass trimmed, now that the engine honours it. The
  stale "flagged for a follow-up pass" comment is replaced with a one-line
  pointer to this phase.
- **Test retirement is scoped to the four tests that assert now-deleted
  behavior**, not a broader test-file rewrite:
  - `upgradeable-dice.engine.test.ts` — the `forge-masters-stamp` +1◆
    amplifier test (asserts a fired-payload bump the deleted hook produced;
    deleted).
  - `themed-decks.engine.test.ts` — `irresistible-grace` decay-immunity test
    (deleted); `stuck-in-their-head` per-echo drip test (deleted);
    `crumbling-resolve` blocked-attack rung test (deleted). The adjacent
    `mirror-of-guilt` test is KEPT — it exercises `resolveThreatPhase`'s
    unrelated enemy-debuff isolation guard (a 2026-07-12 ruling), using
    `mirror-of-guilt` only as an arbitrary attachment-id probe that was
    never backed by a real card even when the test was written; its
    docstring is updated to stop calling the sweep "scheduled" now that it
    has happened.
  - Describe-block titles and the file's own header doc comment are updated
    to drop the retired mechanics from their mechanic lists.
  - A NEW test is added for the-sextons-count's TWIN toll (hard rule: tests
    ship alongside code) — the card had zero existing coverage for any of
    its three triggers, so this also adds a minimal RECALL/REPLAY regression
    pin while at it, in the same new `describe` block, rather than leave
    TWIN as the only covered trigger on a three-trigger card.
- **No content-library changes beyond the one persistentEffect string.**
  This phase does not re-add any of the 19 dead cards to the library —
  that's `/adjust-cards` or `/forge` territory if ever wanted; this phase is
  pure removal of unreachable code plus the one already-scoped TWIN wire.

## Surface (no routes — engine + test + one content-string phase)

| File | Change |
|---|---|
| `axiomancer-mechanics/src/Combat/combat.engine.ts` | Delete 19 dead `zoneHas` sites (and their now-unused locals); rewrite the OMEN v2 boundary harness off `fated-course`/`the-oracles-eye`; simplify `isPhaseStanceRevealed`; add the-sextons-count's TWIN toll + `sextonsTolled` guard |
| `axiomancer-mechanics/src/Cards/library/grave.cards.ts` | Restore TWIN to `theSextonsCount.persistentEffect`; update the comment |
| `axiomancer-mechanics/src/Combat/e2e/themed-decks.engine.test.ts` | Delete 3 dead-hook tests; update header doc + 2 describe titles + the mirror-of-guilt test's comment; add a new the-sextons-count describe block (RECALL/REPLAY/TWIN) |
| `axiomancer-mechanics/src/Combat/e2e/upgradeable-dice.engine.test.ts` | Delete the `forge-masters-stamp` amplifier test |
| `plan/AUDIT.md` | No change needed — both loop-calls already marked "Row closed" at decision time; this phase is the fulfillment |
| `plan/steps/01_build_plan.md` | Phase 86 row ticked `[x]` with commit hash |

## Verify gate

`npm run verify` (mechanics workspace scope) — the deleted branches are
provably unreachable today (confirmed by grep against the live card
libraries before writing this brief), so no behavioral test should move
except the four retired/added ones. `typecheck` catches any now-unused
local left behind.

## DoD

- [ ] All 19 dead `zoneHas` sites removed, each downstream local simplified
      (no dead `if (false)`-shaped branches left).
- [ ] OMEN v2 boundary harness reads cleanly with no `fated-course` /
      `the-oracles-eye` reference; `isPhaseStanceRevealed` simplified.
- [ ] the-sextons-count TWIN wired, `sextonsTolled` guard in place, card text
      restored.
- [ ] Four dead-hook tests retired; new the-sextons-count coverage added;
      describe titles + header doc comment updated.
- [ ] `npm run verify` green.
- [ ] Build-plan row ticked.

## Follow-ups (out of scope)

- Re-adding any of the 19 retired mechanics as content on a NEW card is
  `/adjust-cards` or `/forge` territory, not this phase.
- The oracle-omen-v2 harness's remaining behavior (claim/window/hit/miss) is
  unchanged by this phase — no balance retune intended.
