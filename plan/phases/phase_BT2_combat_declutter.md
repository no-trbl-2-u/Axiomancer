# Phase BT2 — Combat UI declutter: the footer dock

> Agent-facing brief, plotted by T (`/plot`, 2026-10-13) for the existing
> attended row BT2. Scope was set by prototyping on the real combat screen
> with T: three layouts (A "player rail", B "footer dock", a mix), then six
> card-corner variants. T picked B and the sixth card face. Presentation only:
> no engine, card, keyword or number changes (D37). Attended: ship it in a
> session with T present.

## Sources

- `plan/steps/01_build_plan.md` → Phase BT2 (attended fast-follow to BT,
  T 2026-10-11: "clean up the combat screen so it is less busy and easier to
  understand now that Blood Price adds Globals, Curses and new keywords.
  Scope set with T after the BT playtest").
- The prototype, kept as a reference patch: `plan/phases/phase_BT2_prototype.diff`
  (throwaway code behind `localStorage.axmLayout = 'B'` and
  `localStorage.axmBadge = 'v5'`; `localStorage.axmDeck` pins a hand on the
  dev `/combat-encounter` route). Apply it to a scratch branch to see the
  target; do not ship it (it has no tests and keeps dead variants).
- Screenshots at 375x812, web build: `axiomancer-mobile/screenshots/bt2-prototype/`
  (`0-before.jpg`, `1-board.jpg` with the Blood Price hand, `2-pilgrim-modal.jpg`,
  `3-log-view.jpg`).
- T's phone screenshots (2026-10-13) that drove it: the hand fan squeezed
  between the portrait and END medallions, VITAE at 2/170 shown only as small
  rail text, the top-right corner crowded with intent, status chips and LOG.
- Owner UI doctrine (payload-only panels, terse glosses, illegal actions
  refused loudly); D37 (card hold), D65 (VITAE is canon copy), D80 (Blood
  Price trial set), D86 (T merges by hand).

## Outcome

The combat screen gives the decision area the room: the hand fans across the
full width with no corner chrome, the player's VITAE is a bar as loud as the
foe's, END is a wide thumb button, the foe's intent reads top-left, and each
hand card shows its FREE play as a coloured corner pill and its PAID play as
one line.

## Acceptance

- **A1 Intent top-left.** `CombatCombatantPane`'s under-bar block (intent
  badge + the foe's status chips) is left-aligned under the foe's name; the
  chips wrap left to right.
- **A2 LOG leaves the board.** The `combat-log-toggle` button is removed from
  the board. The pilgrim modal (tap the player avatar) gains a LOG button
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
  `AXM.heal`, and `AXM.blood` when below 25%. A presenter or component test
  pins both colours and the width at 0, 24, 25 and 100%.
- **A6 Full-width hand.** `handFanLayout` lays the fan across
  `screenW - 2 * HAND_FAN_BOARD_EDGE`; the corner-chrome band
  (`HAND_FAN_LEFT/RIGHT`, `END_CORNER_FOOTPRINT_W`, `PLAYER_DOCK_FOOTPRINT_W`
  as a fan input) is deleted. At 375 with 5 cards every covered card's name
  shows its first two lines.
- **A7 Signature column up.** The conviction chip and signature runes start
  just under the intent block (anchored to the HUD's measured bottom plus a
  small gap), still clamped so the last rune clears the dice tray by
  `SIG_TRAY_CLEARANCE`. A pure function test proves 5 runes fit above the
  tray at 375x812, and that the clamp still wins on a shorter screen.
- **A8 FREE corner pill.** Every non-large card face (hand, staged card, drag
  ghost, reward offer) with a FREE line shows a pill on the card's top-left
  corner (straddling the frame, `combat-card-face-free-corner`): the FREE
  glyph (`glyphShapeFor(freeGlyphKey)`, text glyph fallback) filled in the
  card's colour (the stance colour; the armed accent when set) and the FREE
  value (`compactFree`) in white. The name band gains top padding only when
  the pill is present, so no name is covered. A card with no FREE line shows
  no pill and no padding.
- **A9 Rarity pips off small faces.** The three-dot rarity track no longer
  renders on non-large faces (a 5pt spacer keeps `NAME_BAND_LEFT_CHROME`
  true). Large faces (card detail, reward preview) keep the label and pips;
  the small face still names the rarity in its accessibility label.
- **A9b Names on one line.** A card name never wraps on a non-large face
  (`numberOfLines={1}`); a covered card's name runs on under its right-hand
  neighbour instead of wrapping inside the visible sliver. The `namePeek` /
  `nameColumnPeek` cap is removed from the small face (T 2026-10-13, reversing
  the earlier "wrap inside the sliver" fix).
- **A10 Ledger is die : PAID.** On non-large faces the ledger drops the FREE
  cell and its rule. It is one row: the stance die cube, then
  `[family glyph] KEYWORD value` as a single line (`numberOfLines={1}`,
  12pt). A card whose PAID headline has no keyword prints the value alone
  ("Deal 38").
- **A10b Seamless art.** On non-large faces the art plate has no grey mat
  (`plateArtWrap` padding and `panelBg`) and no hairline frame or `deepBg`
  (`plateArtFrame`): the painting runs edge to edge between the name band and
  the ledger. Large faces keep their framed print.
- **A11 Tap hint removed.** "tap a card to read it" (`combat-tap-hint`) no
  longer renders; tapping a card still opens its detail.
- **A12 Native parity.** The same layout renders on Android (EAS preview or a
  local build) at a 360-412dp width with no clipped END, avatar or pill.
- **A13 Evidence.** The PR attaches 375x812 screenshots of the grey hand and
  the Blood Price hand (pin `bp-p-06d`, `bp-p-08d`, `bp-p-01a`, `bp-m-06c`,
  `bp-m-05b` via `__AXM_COMBAT_DECK__`), plus the pilgrim modal and the log
  view, next to the prototype shots.

**Measure:** `npm run verify -w axiomancer-mobile` green; the combat e2e
scripts (`combat-encounter-e2e.mjs`, `combat-round-e2e.mjs`,
`map-walk-e2e.mjs`) pass against the web build; the A13 screenshots match
`axiomancer-mobile/screenshots/bt2-prototype/1-board.jpg` in layout.

## Scope

| File | Change |
|---|---|
| `axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx` | A1 alignment; `PlayerMedallion` split into the dock avatar (A4) or retired. |
| `axiomancer-mobile/components/combat/encounter/CombatBoard.tsx` | A3, A4 dock, A5 bar, A6 `handFanLayout`, A7 `sigTop`, A8 pill, A9, A10 ledger, A11. Delete `END_CORNER_FOOTPRINT_W`, `HAND_FAN_LEFT/RIGHT`, `RAIL_PAD_LEFT/RIGHT` and `railLedgerStacks` if nothing else reads them. |
| `axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx` | A2: remove the board toggle, the log view moves into the pilgrim modal. |
| Their `__tests__/` | See the matrix. |

Nothing in `axiomancer-mechanics`. No copy changes beyond removing the hint;
any new label (LOG, BACK, END) reuses existing copy constants
(`COMBAT_LOG_TOGGLE_TEXT`, etc.), no hardcoded player-facing strings in
components, no hex literals (AXM/HUE tokens only).

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

1. **Layout B** (footer dock), T 2026-10-13, over A (portrait mid-left, END
   in the dice row) and the mix; recorded with screenshots above.
2. **Card face = prototype variant 6**, T 2026-10-13, over FREE-in-both,
   FREE-only, PAID-in-corner and a split pill: FREE in a card-coloured corner
   pill with a white value, the bottom only die : PAID on one line, and the
   art seamless (no mat, no frame), and names on one line under the next card.
3. **The small face is one face everywhere** it renders (hand, staged, ghost,
   reward offer), so the player learns one card.
4. **The rarity track leaves small faces** (T: "I don't care about the 3
   dots"). The rarity-D4 suite's small-face pip assertions are rewritten to
   assert absence plus the accessibility label; its large-face assertions
   stand.
5. **A multi-effect FREE line shows one glyph** (the presenter's existing
   `programFreeCell` pick, e.g. SACRIFICE for "SACRIFICE 2, DEAL 7"). The card
   detail still prints the full line. Changing which effect the pill shows is
   card design, not this phase.
6. **VITAE turns blood below 25%**; the threshold is a presentation constant
   in the board, not an engine number.
7. **Testids kept** where the element survives in a new place
   (`combat-end-phase`, `combat-player-medallion`, `combat-rail-vitae`,
   `combat-log`), so e2e drivers churn as little as possible.
8. **No ordering constraint** against the "Printed equals applied" and
   "Refuse before commit" candidates (T dropped it 2026-10-13); if either
   ships first, rebase onto its face changes.
9. **Victory and mercy gains stay out.** That candidate is the summary modal,
   a different surface; it remains in `plan/PHASE_CANDIDATES.md`.
10. **Monster art size is untouched** (T: "something to think about"); the
    figure keeps its current anchor.

## Tests matrix

| Suite | Change |
|---|---|
| `CombatBoard.handfan.test.tsx` | Rewrite: full-width band (A6); the `NAME_BAND_LEFT_CHROME` sum still holds with the 5pt spacer; the `nameColumnPeek` wrap cases become one-line, uncapped cases (A9b). |
| `CombatBoard.rail-ledger.test.tsx` | Rewrite for the dock (A4, A5); delete stacking cases if `railLedgerStacks` goes. |
| `CombatCardFace.rarity-D4.test.tsx` | Small face: no pips, a11y label still names the band (A9). |
| `CombatCardFace.declutter.test.tsx`, `CombatBoard.paid-column.test.tsx` | Small face has no FREE cell; one-line paid (A10); pill present iff FREE (A8). |
| `CombatEncounterPanel.log.test.tsx` | Log opens from the pilgrim modal, BACK returns, close resets (A2). |
| `CombatBoard.S1-board.test.tsx`, `.fresh-eyes-repair`, `.multistage`, `.colorlaw` | Update corner-medallion and END lookups (A3, A4). |
| New: sig column anchor | Pure function test for A7. |

## Verify gate

`npm run verify -w axiomancer-mobile` in the foreground; the three combat e2e
scripts against the web build; a manual Android check for A12.

## Commit body template

```
feat(mobile): BT2 — combat footer dock, full-width hand, FREE corner pill

Layout B and card face 6 as prototyped with T on 2026-10-13.
Closes A1-A13, A9b and A10b (plan/phases/phase_BT2_combat_declutter.md).
```

## DoD

A1-A13, A9b and A10b ticked in the PR body; T merges (D86).

## Follow-ups (out of scope)

- Monster art size (T to think about).
- The momentum chip and phase ledger have no labels (from T's 2026-10-13
  screenshots); a separate legibility pass.
- Status chips do not say whose they are beyond position; A1 puts the foe's
  with its intent, the player's strip is unchanged.
- Placeholder Blood Price names ("Blood Price P-06d") read alike in the fan;
  that is card naming, T's (D37).
