# Phase 89 — Art-direction coherence: die faces + HUD chrome

> Promoted via `/oversight` 2026-09-17 from `PHASE_CANDIDATES.md` [score 5.0].
> Brief generated 2026-09-17 by `/ship-a-phase` §9 (no prior brief existed).

## Outcome

The two named surfaces from the candidate row — `CombatDie.tsx`'s faces and
the combat HUD's text chrome (`CombatBoard.tsx` / `CombatEncounterPanel.tsx`
and five sibling files) — move toward the Woodcut Codex's ink/hairline-rule
register instead of the flat-CG-gem / programmer-mono treatment the
candidate row's evidence pinned them at.

## What exists, measured

- `CombatDie.tsx` (recut 2026-07-19) renders a faux-isometric cube via
  `react-native-svg` gradients — clean, glossy, no ink linework. No
  competing implementation exists to "fold"; this is a from-scratch
  restyle of the one component.
- `FONTS.mono` (`JetBrainsMono_400Regular`) is used in 8 combat-encounter
  files (~50 call sites) for a mix of genuinely tabular numeric readouts
  (HP, pip/die counts, arithmetic breakdowns) AND word/phrase/mixed-text
  chrome (labels, hints, log lines, intent-telegraph chips) — the same
  files already use `FONTS.sans` for structurally identical roles
  elsewhere (`dieXGlyph`, `chipInfoMark`, `wheelChevron`, `paidKeyword`),
  so the "mono chrome" finding is a real, fixable inconsistency, not a
  uniform design already agreed on.

## Decisions made upfront — DO NOT ASK

- **Register target: the Woodcut Codex's ink/hairline-rule language
  (Phase V's ratified North Star), not literal painted-bitmap dice.**
  The candidate row named "the painted portrait register," but converging
  the die on literal painted bitmap art requires new asset acquisition
  (the V4/V7 pipeline) — out of a single phase's scope per the row's own
  estimate ("split if the die needs newly generated art"). Painted
  portraits are themselves one expression of the same standing Woodcut
  Codex direction; moving the die and HUD chrome toward that direction's
  ink/hairline-rule vocabulary (already used on the card plate, `TornPanel`,
  and map backdrops) resolves the register clash without a new art
  dependency, and stays consistent with everything else this phase
  doesn't touch.
- **HUD chrome: reserve `FONTS.mono` for bare numeric/tabular readouts;
  move everything else to `FONTS.sans`.** Applied file-by-file, call site
  by call site (not a blanket `theme/axm.ts` remap, which would also
  repaint ~70 non-combat files well outside this row's scope). Kept mono:
  `sigCostText`, `railHp`, `pileCount`, `plateFreeValue`, `paidValue`,
  `crestMax`, `chipDurText`, `detailDieLine`, `detailMath`, `pilgrimVitae`,
  `pilgrimGridVal`, `revealHp`, `revealYours`, `rowVal`, `pillText`,
  `wallMathNet` — all render bare digits or short numeric-shorthand
  (`compactFree`'s `+3`/`3r`/`×4`) that the player reads as a live value.
  Moved to sans: labels, hints, captions, log-line-adjacent chips, and
  mixed word+number telegraph chips (`guardChip`, `ledgerChip`,
  `EnemyActionCard`'s `line`, `wallMathDenied`, the stance-check trio).
  `CombatEncounterPanel.tsx`'s scrolling combat log (`logLine`) moved to
  `FONTS.serif` instead — full-sentence narration reads as chronicle prose
  elsewhere in the app, not chrome. Three unused dead styles
  (`detailMeta`, `detailStat`, `detailStatValue`) were left untouched —
  zero render sites, so touching them is dead-code churn outside this
  phase's visible-surface scope.
- **Die restyle stays procedural, additive, and semantics-safe.** No new
  asset, no geometry change, no change to any colour that carries meaning
  (stance accent, dead/greyed/cracked state, drafted ring). Added: a faint
  cross-hatch clipped to the shell (top/right) faces only — the front
  face's info-bearing crystal glyph stays uncluttered — and one inner
  hairline rule on the front face, echoing the card plate's own hairline
  convention. Both are decoration-only; the a11y label
  (`combatDieA11yLabel`) is untouched because it never depended on visual
  treatment.

## Surface

| File | Change |
|---|---|
| `components/combat/encounter/CombatDie.tsx` | Cross-hatch overlay (clipped to shell faces) + inner hairline rule on the front face; header comment updated |
| `components/combat/encounter/CombatBoard.tsx` | 13 style keys `FONTS.mono` → `FONTS.sans` (labels/hints/chips); 5 numeric keys unchanged |
| `components/combat/encounter/CombatCombatantPane.tsx` | `hudMeta` → `FONTS.sans`; `crestMax`/`chipDurText` unchanged |
| `components/combat/encounter/CombatEncounterPanel.tsx` | 6 style keys → `FONTS.sans`, `logLine` → `FONTS.serif`; numeric/tabular keys unchanged |
| `components/combat/encounter/CombatRewardsOverlay.tsx` | `btnNote`, `previewPlayTag` → `FONTS.sans` |
| `components/combat/encounter/CombatSummaryModal.tsx` | `total` → `FONTS.sans`; `rowVal` unchanged |
| `components/combat/encounter/CombatTutorialCoach.tsx` | `lookFor` → `FONTS.sans` |
| `components/combat/encounter/EnemyActionCard.tsx` | `phase`, `line` → `FONTS.sans` |
| `components/combat/encounter/IntentIcon.tsx` | `wallMathDenied`, `rungFilled`, `rungHollow`, `scPunish`, `scYield`, `scNone`, `scResolved` → `FONTS.sans`; `pillText`/`wallMathNet` unchanged |

## Tests

Existing suites pin behavior, not font family — `npm run verify`'s
`components/combat/encounter/**` suites (176 tests, 30 files) are the
regression net. No new test file: this phase changes rendering
(`fontFamily` values, additive SVG decoration) without changing any
component's props, VM shape, or interaction contract, so nothing new
became testable that wasn't already covered by the render/a11y/juice
suites already in place.

## Verify gate

`npm run verify` (axiomancer-mobile).

## DoD

- [x] `CombatDie.tsx` shell faces carry a woodcut cross-hatch + inner
      hairline; stance/dead/greyed/cracked semantics untouched.
- [x] HUD chrome across the 8 combat-encounter files reserves
      `FONTS.mono` for bare numeric/tabular readouts; every label, hint,
      caption, and mixed-text chip moved to `FONTS.sans` (or `FONTS.serif`
      for the prose combat log).
- [x] `npm run verify` green.

## Follow-ups (out of scope)

- **Literal painted-bitmap dice.** If a future pass wants the die to be a
  true painted asset (matching the enemy-portrait register pixel-for-pixel
  rather than by shared ink vocabulary), that is a V4/V7-style asset
  acquisition phase, not a chrome restyle.
- **`detailMeta` / `detailStat` / `detailStatValue` dead styles**
  (`CombatEncounterPanel.tsx`) — zero render sites found; a future
  dead-code sweep can remove them outright rather than leave them
  inconsistent with the rest of the file's font convention.
