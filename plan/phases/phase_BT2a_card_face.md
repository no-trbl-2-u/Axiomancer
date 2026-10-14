# Phase BT2a — One card face (D91)

> Agent-facing brief, plotted by T (`/plot`, 2026-10-13). The card half of
> BT2, split from the combat-declutter brief so the loop can ship it as one
> reviewable `loop:pr` PR; BT2b (the board layout, D92) follows it.
> Presentation only: no engine, card, keyword or number changes (D37). Ship
> without asking; record judgment calls in the PR body.

## Sources

- **D91** (one card face, everywhere; T 2026-10-13), the ruling this phase
  implements, in `plan/2026-09-25-refactor-strategy.decisions.md`.
- The prototype as a reference patch: `plan/phases/phase_BT2_prototype.diff`
  (throwaway code behind `localStorage.axmLayout = 'B'` and
  `localStorage.axmBadge = 'v5'`; `localStorage.axmDeck` pins a hand on the
  dev `/combat-encounter` route). Read it for the target; do not ship it
  (no tests, dead variants, `localStorage` gates).
- Target screenshot, 375x812 web build:
  `axiomancer-mobile/screenshots/bt2-prototype/1-board.jpg` (Blood Price hand).
  The prototype also shows the BT2b board; this phase changes only the cards.
- Owner UI doctrine; D37 (card hold), D80 (Blood Price trial set), D86 (T
  merges by hand).

## Outcome

Every card face, small and large, wears the D91 design: a FREE corner pill in
the card's colour with a white value, a one-line name, seamless art, and one
die : PAID line at the bottom; no rarity pips anywhere.

## Acceptance

- **A1 FREE corner pill.** Every face (hand, staged card, drag ghost, reward
  offer, card detail, reward preview) with a FREE line shows a pill on the
  card's top-left corner, straddling the frame (`combat-card-face-free-corner`):
  the FREE glyph (`glyphShapeFor(freeGlyphKey)`, text glyph fallback) filled
  in the card's colour (the stance colour; the armed accent when set) and the
  FREE value (`compactFree`) in white. The name band gains top padding only
  when the pill is present, so no name is covered. A card with no FREE line
  shows no pill and no padding. The pill is drawn as a sibling of the card
  frame so the frame does not clip it.
- **A2 No rarity pips.** The three-dot rarity track renders on no face (a 5pt
  spacer keeps `NAME_BAND_LEFT_CHROME` true). The large face keeps the rarity
  word; every face names the rarity in its accessibility label.
- **A3 Names on one line.** A card name never wraps (`numberOfLines={1}`); a
  covered card's name runs on under its right-hand neighbour. The `namePeek` /
  `nameColumnPeek` cap is removed (T 2026-10-13, reversing the earlier "wrap
  inside the sliver" fix).
- **A4 Ledger is die : PAID.** The ledger drops the FREE cell and its rule.
  It is one row: the stance die cube, then `[family glyph] KEYWORD value` as a
  single line (`numberOfLines={1}`, 12pt). A card whose PAID headline has no
  keyword prints the value alone ("Deal 38"). The ledger never stacks:
  `paidLedgerFit` no longer reserves room for a FREE cell that is not drawn,
  so every card's PAID line sits at the same height (the old fit stacked
  P-01a's "Deal 38" and dropped its line lower than its neighbours).
- **A5 Seamless art.** The art plate has no grey mat (`plateArtWrap` padding
  and `panelBg`), no hairline frame or `deepBg` (`plateArtFrame`), and no
  rules under the name band or over the ledger (`plateBand` / `plateLedger`
  borders): name, art and PAID line read as one surface. The large face
  prints the full rules text under its PAID line, as today.
- **A6 Evidence.** The PR attaches 375x812 web screenshots of the grey hand
  and the Blood Price hand (pin `bp-p-06d`, `bp-p-08d`, `bp-p-01a`,
  `bp-m-06c`, `bp-m-05b` via `__AXM_COMBAT_DECK__`), plus one card detail,
  next to the prototype shot. T checks a phone build at review (D86).

**Measure:** `npm run verify -w axiomancer-mobile` and root `npm test` green;
the A6 hand screenshots match the cards in
`axiomancer-mobile/screenshots/bt2-prototype/1-board.jpg`.

## Scope

| File | Change |
|---|---|
| `axiomancer-mobile/components/combat/encounter/CombatBoard.tsx` | `CombatCardFace` (A1-A5), `paidLedgerFit` (A4), `nameColumnPeek` and the fan's `namePeek` plumbing (A3), the `RarityTrack` use (A2), styles `plateBand`, `plateArtWrap`, `plateArtFrame`, `plateLedger`. |
| `axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx` | Only if the card detail or reward preview renders its own face markup outside `CombatCardFace`; it then adopts the same face. |
| Tests | See the matrix. |

Board layout, the corner medallions, the hand fan's band, the rail, the HUD
and the LOG are BT2b; do not touch them here. No hardcoded player-facing
strings, no hex literals (AXM/HUE tokens only).

## Consumers to update

- Any test or e2e that reads `combat-card-face-rarity-pips` or the FREE cell.
- `docs/game-model.md` only if it describes the card face.

## Save / schema contracts

None.

## Decisions made upfront — DO NOT ASK

1. **Card face = prototype variant 6** (T 2026-10-13), over FREE-in-both,
   FREE-only, PAID-in-corner and a split pill.
2. **One face everywhere (D91)**: the large face adds only the rarity word
   and the full rules text.
3. **A multi-effect FREE line shows one glyph** (the presenter's existing
   `programFreeCell` pick, e.g. SACRIFICE for "SACRIFICE 2, DEAL 7"). Changing
   which effect the pill shows is card design, not this phase.
4. **The rarity-D4 suite** is rewritten to assert no pips on any face, the
   word on the large face, and the accessibility label everywhere.
5. **No ordering constraint** against the "Printed equals applied" and
   "Refuse before commit" candidates (T, 2026-10-13); rebase onto whichever
   lands first.

## Tests matrix

| Suite | Change |
|---|---|
| `CombatCardFace.rarity-D4.test.tsx` | No pips on any face; word on large; a11y label everywhere (A2). |
| `CombatCardFace.declutter.test.tsx`, `CombatBoard.paid-column.test.tsx` | No FREE cell; one-line PAID; never stacked; pill present iff FREE, in the stance colour, value present (A1, A4). |
| `CombatBoard.handfan.test.tsx` | The `nameColumnPeek` wrap cases become one-line, uncapped name cases (A3); `NAME_BAND_LEFT_CHROME` still sums with the 5pt spacer. Leave its band cases for BT2b. |
| New or extended face test | No border on `plateBand` / `plateLedger`, no padding or frame on the art plate (A5). |

## Verify gate

`npm run verify -w axiomancer-mobile` and root `npm test`, foreground.

## Commit body template

```
feat(mobile): BT2a — one card face (D91)

FREE corner pill, one-line names, die : PAID, seamless art, no rarity pips,
on every face. Closes A1-A6 (plan/phases/phase_BT2a_card_face.md).
```

## DoD

A1-A6 ticked in the PR body; T merges (D86).

## Follow-ups (out of scope)

- BT2b, the board layout (D92).
- Placeholder Blood Price names ("Blood Price P-06d") read alike in the fan;
  card naming is T's (D37).
