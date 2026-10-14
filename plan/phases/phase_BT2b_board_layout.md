# Phase BT2b — The combat board layout (D92)

> Agent-facing brief, plotted by T (`/plot`, 2026-10-13). The board half of
> BT2, split from the combat-declutter brief; it follows BT2a (the card face,
> D91), which edits the same file. Presentation only: no engine, card,
> keyword or number changes (D37). Ship without asking; record judgment calls
> in the PR body.

## Sources

- **D92** (the combat board layout; T 2026-10-13), the ruling this phase
  implements, in `plan/2026-09-25-refactor-strategy.decisions.md`.
- The prototype as a reference patch: `plan/phases/phase_BT2_prototype.diff`
  (throwaway code behind `localStorage.axmLayout = 'B'`). Read it for the
  target; do not ship it.
- Target screenshots, 375x812 web build: `axiomancer-mobile/screenshots/bt2-prototype/`
  (`0-before.jpg`, `1-board.jpg`, `2-pilgrim-modal.jpg`, `3-log-view.jpg`).
- T's phone screenshots (2026-10-13) that drove it: the hand squeezed between
  the portrait and END medallions, VITAE at 2/170 shown only as small rail
  text, the top-right corner crowded with intent, status chips and LOG.
- Owner UI doctrine; D65 (VITAE is canon copy), D86 (T merges by hand).

## Outcome

The board gives the decision area the room: the hand fans across the full
width with no corner chrome, the player's VITAE is a bar as loud as the foe's,
END is a wide thumb button, the foe's intent reads top-left, and LOG lives in
the pilgrim modal.

## Acceptance

- **A1 Intent top-left.** `CombatCombatantPane`'s under-bar block (intent
  badge + the foe's status chips) is left-aligned under the foe's name; the
  chips wrap left to right.
- **A2 LOG leaves the board.** The `combat-log-toggle` button is removed from
  the board. The pilgrim modal (tap the avatar) gains a LOG button
  (`combat-pilgrim-log`) in its XP row; it swaps the modal body to the combat
  log (`combat-log`, newest at the bottom, same lines as today) with a BACK
  button (`combat-pilgrim-log-back`) that returns to the stats view. Closing
  the modal resets it to the stats view.
- **A3 Corner medallions removed.** The bottom-left `PlayerMedallion` (92pt
  ring) and the bottom-right `EndPhaseMedallion` corner stack no longer render
  on the board.
- **A4 Footer dock.** The bottom rail becomes the dock, left to right: a
  ~48pt round player avatar (`combat-player-medallion`, tap opens the pilgrim
  modal, keeps the damage flash and floats the medallion has today); a VITAE
  column (♥ value / max on the first line with the deck/discard piles at its
  right, an 8pt fill bar under it, the phase ledger under the bar); a wide END
  button (~116x56, `combat-end-phase`, hourglass + END, the dead-tray
  consequence line and the resolving-disabled state kept). The dock respects
  the bottom safe-area inset.
- **A5 VITAE bar.** The fill is `vm.player.hp / vm.player.maxHp`, coloured
  `AXM.heal`, and `AXM.blood` below 25%. A test pins both colours and the
  width at 0, 24, 25 and 100%.
- **A6 Full-width hand.** `handFanLayout` lays the fan across
  `screenW - 2 * HAND_FAN_BOARD_EDGE`; the corner-chrome band
  (`HAND_FAN_LEFT/RIGHT`, `END_CORNER_FOOTPRINT_W`, `PLAYER_DOCK_FOOTPRINT_W`
  as a fan input) is deleted. At 375 with 5 cards each covered card shows the
  start of its one-line name (BT2a's A3).
- **A7 Signature column up.** The conviction chip and signature runes start
  just under the intent block (anchored to the HUD's measured bottom plus a
  small gap), still clamped so the last rune clears the dice tray by
  `SIG_TRAY_CLEARANCE`. A pure function test proves 5 runes fit above the tray
  at 375x812, and that the clamp still wins on a shorter screen.
- **A8 Tap hint removed.** "tap a card to read it" (`combat-tap-hint`) no
  longer renders; tapping a card still opens its detail.
- **A9 Evidence.** The PR attaches 375x812 web screenshots of the board with
  the grey hand and the Blood Price hand, the pilgrim modal and the log view,
  next to the prototype shots. T checks a phone build at a 360-412dp width at
  review (no clipped END, avatar or pill; D86).

**Measure:** `npm run verify -w axiomancer-mobile` and root `npm test` green;
the combat e2e scripts (`combat-encounter-e2e.mjs`, `combat-round-e2e.mjs`,
`map-walk-e2e.mjs`) pass against the web build; the A9 screenshots match
`axiomancer-mobile/screenshots/bt2-prototype/` in layout.

## Scope

| File | Change |
|---|---|
| `axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx` | A1 alignment; `PlayerMedallion` becomes the dock avatar (A4) or is retired. |
| `axiomancer-mobile/components/combat/encounter/CombatBoard.tsx` | A3, A4 dock, A5 bar, A6 `handFanLayout`, A7 `sigTop`, A8. Delete `END_CORNER_FOOTPRINT_W`, `HAND_FAN_LEFT/RIGHT`, `RAIL_PAD_LEFT/RIGHT` and `railLedgerStacks` if nothing else reads them. |
| `axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx` | A2: the board toggle goes; the log view moves into the pilgrim modal. |
| Tests | See the matrix. |

The card face is BT2a's; do not touch `CombatCardFace` here. Any new label
(LOG, BACK, END) reuses existing copy constants (`COMBAT_LOG_TOGGLE_TEXT`,
etc.); no hardcoded player-facing strings, no hex literals.

## Consumers to update

- e2e scripts that click `combat-end-phase` or `combat-log-toggle`
  (`scripts/combat-encounter-e2e.mjs`, `combat-round-e2e.mjs`,
  `map-walk-e2e.mjs`, `perf-web.mjs`): `combat-end-phase` keeps its testID;
  any log step goes through the avatar.
- `state/e2e/combat-encounter.screen.test.tsx`.
- `docs/game-model.md` only if it describes the combat screen layout.

## Save / schema contracts

None.

## Decisions made upfront — DO NOT ASK

1. **Layout B** (footer dock; D92), T 2026-10-13, over A (portrait mid-left,
   END in the dice row) and the mix.
2. **VITAE turns blood below 25%**; a presentation constant in the board, not
   an engine number.
3. **Testids kept** where the element survives in a new place
   (`combat-end-phase`, `combat-player-medallion`, `combat-rail-vitae`,
   `combat-log`), so e2e drivers churn as little as possible.
4. **Victory and mercy gains stay out**: that candidate is the summary modal,
   a different surface; it remains in `plan/PHASE_CANDIDATES.md`.
5. **Monster art size is untouched** (T: "something to think about").

## Tests matrix

| Suite | Change |
|---|---|
| `CombatBoard.handfan.test.tsx` | Band cases: full width (A6). |
| `CombatBoard.rail-ledger.test.tsx` | Rewrite for the dock (A4, A5); delete stacking cases if `railLedgerStacks` goes. |
| `CombatEncounterPanel.log.test.tsx` | Log opens from the pilgrim modal, BACK returns, close resets (A2). |
| `CombatBoard.S1-board.test.tsx`, `.fresh-eyes-repair`, `.multistage`, `.colorlaw` | Corner-medallion and END lookups (A3, A4). |
| New: sig column anchor | Pure function test for A7. |

## Verify gate

`npm run verify -w axiomancer-mobile` and root `npm test`, foreground; the
three combat e2e scripts against the web build.

## Commit body template

```
feat(mobile): BT2b — combat footer dock, full-width hand, intent top-left (D92)

Closes A1-A9 (plan/phases/phase_BT2b_board_layout.md).
```

## DoD

A1-A9 ticked in the PR body; T merges (D86).

## Follow-ups (out of scope)

- Monster art size (T to think about).
- The momentum chip and phase ledger have no labels; a separate legibility
  pass.
- Status chips say whose they are only by position; A1 puts the foe's with
  its intent, the player's strip is unchanged.
