# Phase 95 — UI fresh-eyes six

> Promoted 2026-09-17 via `/oversight` from an `/iterate` routing dated
> 2026-09-15 (`plan/AUDIT.md` — "UI fresh-eyes 2026-09-12 left six product
> decisions"). Brief generated 2026-09-18 by `/ship-a-phase` §9 (audit /
> wiring phase — the page-family brief sections don't apply; adapted per
> Phase 81/86/87/93's precedent).

## Outcome

`axiomancer-mobile/docs/reports/UI_FRESH_EYES_2026-09-12.md` §4 named six
product decisions the loop should not make silently, each with the report's
own recommended option. `/oversight` (2026-09-15) accepted all six
recommended options and routed them to ship. A pre-work audit of the live
source (below) found **five of the six already satisfied** — four by
explicit "leave as-is" recommendations that need no code, and one (the art
captions) by a same-day repair-wave fix (`745b56ff`, `FE-047`) that shipped
*before* the 2026-09-15 decision but wasn't cross-referenced against it (same
staleness shape as Phase 87/93). The sixth — teaching the left signature-rune
rail through the tutorial primer — was genuinely unshipped. This phase closes
it: `CombatTutorialPrimer` gains a fourth panel naming the rail, its ◆
Conviction cost, and the long-press-for-details reflex; the one test that
hard-coded the primer's old 3-panel page count is updated to 4.

## Why

Each of the six decisions gets its own settlement (accept and verify, or
accept and ship) so the row can close cleanly rather than carry forward with
unclear status. Building a decision ledger nobody can trust is worse than not
tracking decisions at all.

## Audit findings (verified against current source, 2026-09-18)

**1. Fanned hand hides every card's ledger but the last.** Recommended:
*keep the reference fan as authored* — an explicit owner directive
(`CombatBoard.tsx`, 2026-08-10), with the inspect modal (confirmed present —
`CombatBoard.tsx`'s inspect wiring, `CombatCombatantPane.tsx`,
`CombatRewardsOverlay.tsx`) carrying the full face. No code implied by the
accepted option. **No change.**

**2. The left signet rail is five unnamed glyphs.** Recommended: *leave the
rail compact and teach it through the primer.* The "leave compact" half is
already true — `SignatureColumn` in `CombatBoard.tsx` renders icon + cost
only, names live in `accessibilityLabel` and the long-press info popup
(`onInfo`), unchanged since Phase 85. The "teach it through the primer" half
was NOT done: `CombatTutorialPrimer.tsx`'s three panels never mention the
rune column at all. **Real gap — shipped this phase** (see Surface).

**3. `/rest` greys an option for two possible reasons.** Recommended:
*print the binding reason on the row.* `restchoice.engine.ts`'s
`buildOffers` (unchanged since Phase 52c, `e1ae8318`, which predates the
2026-09-12 sweep entirely) already picks exactly one specific message: `the
deck is at its floor of N cards` when the deck can't shrink further
(checked first — true regardless of money, so it is the correct binding
reason when both conditions hold), else `you can't cover the N it costs`
when only funds are short. `RestScreen.tsx`'s `OfferCard` already renders
`offer.disabledReason` on the row (`rest-choice-offer-<id>-reason`
testID). This is the accepted option, already live. **No change.**

**4. `/hazard-deck` uses a light pastel visual language.** Recommended:
*deliberate — the hazard deck is meant to read as a separate object.*
Accepting this option is explicitly a decision not to touch the palette.
**No change.**

**5. `LEAGUES` is a proper noun on the title screen and a unit on the map.**
Recommended: *lowercase it in the title copy.* Already shipped — `FE-057`,
part of Phase 80's naming pass (`TitleScreen.tsx`'s header comment: "Resolves
DECISION-5 ... `leagues` is a unit of distance, not a proper noun, so the
tagline says 'the leagues beyond'"), landed 2026-09-15 per
`plan/PHASE_CANDIDATES.md`'s naming-pass status note. **No change.**

**6. The opening art carries its source plate's baked-in caption.**
Recommended: *crop the plates above the caption.* Already shipped —
commit `745b56ff` ("ui-fresh-eyes: map plates - crop the blank page margins
off the pit and wentworth street", 2026-09-13, `FE-047`) cropped
`charon-crossing.webp` (the plate behind `/cutscene`, `/dialogue`, and map
`event` nodes) from 815×1120 to 784×994 specifically to remove its printed
caption band — recorded in
`axiomancer-mobile/assets/images/maps/provenance.json`. The same pass
inspected `wentworth-street.webp` (`/village`) and `ludgate-hill.webp`
(`/blacksmith`, `/cache`) and found **no caption band on either** — both
notes in `provenance.json` state this explicitly ("this scan carries no
printed caption band" / "no printed caption band to take off"). Verified
visually this tick (cropped 7% strips at each plate's current bottom edge,
all three clean of text). This fix landed 2026-09-13, two days *before* the
2026-09-15 `/oversight` decision that (redundantly) accepted "crop the
plates" as the option to ship — the decision prose was written from the
original 2026-09-12 report and didn't pick up the intervening fix, the same
staleness Phase 93 documented for its finding (1). **No change.**

## Decisions made upfront — DO NOT ASK

- **Ship findings 1/3/4/5/6 as no-op confirmations, not re-fixes.** Each is
  either an explicit "leave as-is" acceptance or already-shipped code/asset
  work, evidenced above with file + commit references. Re-deriving any of
  them would be wasted churn or (for 5/6) literal duplicate work.
- **Ship finding 2 as primer copy only, not a rail redesign.** The accepted
  option is "leave the rail compact" — changing `SignatureColumn`'s layout,
  adding printed names, or building a new onboarding surface would
  contradict the decision that was actually made. A fourth `PrimerPanel`
  entry is the full scope.
- **The new panel names no specific signature move.** Which signatures a
  loadout carries varies by preset/progression (`signaturesVM` resolves
  `state.signatures` per encounter); the panel teaches the mechanic (rune
  column, ◆ cost, long-press) generically, the same way panel 3 teaches dice
  colours without naming which cards a given deck holds.

## Surface

| File | Change |
|---|---|
| `axiomancer-mobile/components/combat/encounter/CombatTutorialPrimer.tsx` | New fourth `PrimerPanel` ("THE LEFT EDGE" / "SIGNATURES COST CONVICTION, NOT DICE") teaching the rune column, its ◆ Conviction cost, and the long-press-for-details reflex. |
| `axiomancer-mobile/state/e2e/combat-tutorial.screen.test.tsx` | `clearPrimer()` pages through 4 panels (one more `combat-primer-next` press) instead of 3, matching the new panel count. |
| `plan/steps/01_build_plan.md` | Phase 95 row ticked `[x]` with commit hash. |

No other production file changes — findings 1/3/4/5/6 need none (see Audit
findings above).

## Verify gate

`npm run verify` — mobile workspace only (typecheck + the two primer test
suites: `CombatTutorialPrimer.S1-board-C35.test.tsx`'s dynamic page-until-BEGIN
loop is unaffected by panel count; `CombatTutorialCoach.test.tsx`'s two tests
use the same dynamic loop and a fixed 2-press jump to the still-third "STAGE,
THEN POWER" panel, both unaffected; `combat-tutorial.screen.test.tsx`'s
`clearPrimer()` updated as above).

## DoD

- [ ] `CombatTutorialPrimer` renders a fourth panel teaching the signature
      rune rail.
- [ ] `combat-tutorial.screen.test.tsx` pages through 4 panels; green.
- [ ] Existing primer test suites green unchanged.
- [ ] `npm run verify` green.
- [ ] Build-plan row ticked.

## Follow-ups (out of scope)

- None. The 309-row unverified candidate set from the same sweep
  (`UI_FRESH_EYES_2026-09-12.candidates.md`) stays open and untouched — the
  build-plan row explicitly scopes this phase to the six named decisions
  only.
