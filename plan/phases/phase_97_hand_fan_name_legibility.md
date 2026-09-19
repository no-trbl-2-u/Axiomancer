# Phase 97 — The hand fan stops covering its own card names

> From `plan/CRITIQUE.md` [MED] "combat — the mobile hand fan overlaps card-name
> bands, hiding the covered cards' names" (pass 37, reconfirmed by passes 38-41).
> Mirror issue: #343.

## Outcome

On a phone, a player can read every card in their hand. Before this, four of
five cards read `THIN HYM / CHILBLAI / THE LONG / SPOILED ` — you had to play a
card to find out what it was.

## Why

The critique filed this at pass 37 and passes 38, 39, 40 and 41 each re-drove the
same capture and reconfirmed it verbatim, each noting "no fix yet". It is the
oldest un-actioned legibility row on the combat board, and combat is the screen
the player spends the most time on.

## The diagnosis that changed the fix

The row's own suggested fix was to copy the hazard route-choice precedent
(#295 / `8f3acef7`): widen the fan's negative margin from `-32` to `-22`.
**That lever does not exist here, and could not work if it did.**

1. CombatBoard has no flat margin. Since the 2026-09-12 S1-board-C11 repair the
   overlap is *derived* by `handFanLayout(screenW, n)`.
2. The geometry is nearly exhausted. The fan must satisfy
   `HAND_CARD_W + (n-1) * step <= screenW` — at 375pt with 5 cards that caps
   `step` at `63.75` against the shipped `57.75`. Widening the overlap buys
   ~6pt, about **one character**, before the outermost cards run off the phone.
   Matching RouteSelect's 75.6%-visible ratio would need a 483pt fan on a 375pt
   viewport.

The measured arithmetic at 375x812 with five cards: `band = 351`,
`step = 57.75`, `overlap = 62.25`. Band chrome is `1.5` (face border) + `6`
(band padding) + `5` (rarity pip) + `5` (gap) = `17.5`, so `40.25pt` of a `95pt`
name column survives — ~42%, which is the 8-9 characters the capture recorded.

So this is **occlusion, not truncation**: `plateName` is already
`numberOfLines={2}` and already wraps; it was simply laid out across the full
column and then painted over by an opaque neighbour (`zIndex: i` ascending).

## Components / handlers

New, all in `axiomancer-mobile/components/combat/encounter/CombatBoard.tsx`:

- `NAME_BAND_LEFT_CHROME` — `17.5`, derived from the four styles it sums.
- `nameColumnPeek(step)` — the width a covered card's name may honestly use.
- `CombatCardFace` gains optional `namePeek`; when set, caps `plateName`'s
  `maxWidth`.
- `HandCard` gains `namePeek` and threads it.

Reused: `handFanLayout` is **untouched** — that is the point of the approach.

## Output schema / contracts

No engine contract changes. `namePeek` is an optional presentational prop with a
`null` default.

## Decisions made upfront — DO NOT ASK

1. **The name BOX, not the geometry.** The geometry lever is capped at ~1 extra
   character (proved above). Sizing the box to the peek makes the name wrap
   inside the sliver, which is what the band's own comment already promised.
2. **`handFanLayout` stays byte-identical.** This is the decisive benefit:
   `CombatBoard.fresh-eyes-repair.test.tsx:137` pins `step` to five decimals and
   `:191-192` assert the fan stays on-screen. Those are the guards for the
   previously-closed C11-R / C11-R2 findings. A geometry fix would have forced
   them to be re-derived or relaxed; this one leaves them green untouched.
3. **Only the hand fan passes `namePeek`.** `CombatCardFace` is instanced at five
   sizes (hand 120, staged 92, reward offer 100, drag ghost, detail overlay
   large). The prop defaults to `null`, so the other four are byte-identical and
   cannot regress. Pinned by a test.
4. **The last card is uncapped.** Nothing covers the topmost card, so narrowing
   it would cost legibility for nothing.
5. **The peek is floored at 1.** A degenerate step must never yield a zero or
   negative layout box — React Native would lay the name out at zero width and
   hide it entirely, which is strictly worse than the bug being fixed.
6. **The chrome constant is derived once and re-summed in the test.** The value
   appears in exactly two places, and the test re-derives it independently so a
   silent style drift fails the gate rather than quietly re-clipping every name.
7. **Ship the precedent's second half too.** The tap-to-read path is already
   wired end-to-end (`Gesture.Tap` → `inspectJS` → `onInspect` → the detail
   overlay) but was advertised only in an `accessibilityHint`, where a sighted
   player never meets it. The board hint line now says `tap a card to read it`,
   exactly as RouteSelect's label change did. This also closes a real coverage
   hole: combat's tap path had **no test at all**.
8. **No vertical-stagger change.** The recon flagged that `translateY` currently
   staggers the left half of the fan the wrong way (each covering card sits
   *higher* than the card it covers). That is a real second lever, but it trades
   against the FREE/PAID ledger at the card bottom inside a ~20pt slack budget
   in an `overflow: hidden` dock — a separate, measurable change. Filed as a
   follow-up rather than bundled.

## Empty / loading / error states

- One-card hand — `handFanLayout` returns `step = HAND_CARD_W`; that card is the
  last, so it is uncapped. Unchanged.
- Desktop (1280) — a wider band yields a larger step and therefore a larger cap;
  names were already fully legible there and stay so.

## Mobile reflow

This IS the mobile reflow. No layout box moves; only the name text's own
max-width changes, inside a band that already grows for a second line.

## Pages x tests matrix

| Suite | Asserts |
|---|---|
| `CombatBoard.handfan.test.tsx` (new, 10 tests) | chrome constant re-derived independently; peek is step-minus-chrome, floored, never wider than the step; the shipped 375px geometry yields 57.75 -> 40.25; every covered card capped to exactly the peek; the last card uncapped; non-fanned faces uncapped; the board states the tap hatch; hand cards still announce it to a screen reader |
| `CombatBoard.fresh-eyes-repair.test.tsx` (unchanged) | C11-R / C11-R2 geometry invariants — still green, deliberately untouched |
| all 31 combat-encounter suites | 186 tests green |

## Verify gate

- `npm run verify --workspace axiomancer-mobile` — lint + typecheck + jest
- mechanics / card-editor untouched by this phase (presentation-only, no file
  outside `axiomancer-mobile/components/`)
- **No baseline regen** — AGENTS.md ties regen to mechanics changes; this lane
  touches no engine file.

## DoD

- [x] `NAME_BAND_LEFT_CHROME` + `nameColumnPeek` exported and derived
- [x] `namePeek` threaded fan -> `HandCard` -> `CombatCardFace`
- [x] last card uncapped; other four face sizes untouched
- [x] tap-to-read stated on the board
- [x] 10-test guard suite; 31 suites / 186 tests green
- [x] mirror issue #343 opened, closed by the shipping commit

## Follow-ups (out of scope)

- The vertical-stagger lever (decision 8) — a monotonic descending ramp would let
  every covered band peek above its neighbour, at the cost of the FREE/PAID
  ledger's bottom margin. Needs a measurement, not a guess.
- A before/after `critique:drive` capture. The guard test pins the exact property
  (`maxWidth === nameColumnPeek(step)`), which is a stronger regression guard
  than an image, but a capture is still the nicer artifact for the row's
  resolution note.
