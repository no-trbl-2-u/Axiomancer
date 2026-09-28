# Phase 103 — The last two arenas, and the plate that shouldn't have shipped

> Follow-up to Phase 101, whose own brief named the blocker: *"Adding a
> `trim`/crop recipe is filed as the follow-up that unlocks the rest."* And its
> third follow-up: *"Replace `arena-ruined-city.jpg`. Licence UNRESOLVED, and it
> is still the plate behind every unmapped fight."* Both are closed here.
> Authorized as a loop call by THE OPEN GATE ¶6 (T direct, 2026-08-28): art that
> cannot be traced within reasonable effort is a re-art decision — *"replace via
> the licensed trove and retire the untraceable asset."*

## Outcome

**Bespoke combat backdrops go from 4 of 7 regions to 6 of 7**, and the plate
every *unmapped* fight falls back to stops being a licence exposure. No live
region fights in front of a picture drawn for somewhere else any more.

## What actually unblocked it

Phase 101 could only take plates that need no crop, because `acquire-art.mjs`
had no crop step and hand-cropping outside the licence-proving pipeline defeats
the one thing that pipeline exists to do. That ruled out the two registers the
remaining regions want — subterranean and monumental — because neither has a
documentary-London equivalent, and the Doré Dante plates that do are *page
photographs*: caption band, cream margins, the physical edge of the book.

So this phase built the missing step. `scripts/acquire-art.mjs` gains:

- **`detectPlateBox(sharp, raw, { darkPct, sample })`** — finds the engraving on
  a scanned page by row/column darkness. It takes the **longest contiguous dark
  run** per axis, not the first and last crossing. That distinction is the whole
  detector: a v1 that used first/last crossings swallowed the dark edge of the
  book on the far side of the margin and returned the entire page.
- **`buildPlatePage(sharp, raw, maxEdge, inset)`** — crops to that box with a
  1% inset, then hands off to the same grade-and-resize the other plates get.
- **`recipe: 'plate-page'`**, wired through `acquireOne`, with the crop box
  written into `provenance.json` (`crop: {left, top, width, height,
  sourceWidth, sourceHeight, inset}`). The record says where the pixels came
  from, not just that they were cropped.

## What shipped

| Region | Plate | Why |
|---|---|---|
| The Caverns | "Abandon all hope ye who enter here" (Inferno, Canto III) | A gateway cut into a rock face, two figures at the threshold, a lit horizon band behind. The region BEGINS underground, so its arena wants the moment of going in rather than a cave interior. Distinct from the maps registry's Titans plate, which the player crossed to get here. |
| The Capital | The Empyrean Rose (Paradiso, Canto XXXI) | The capital is where the advisor-selection payoff lands, so its arena is the one place that dwarfs the player: a court that is vast, ranked and wholly indifferent. The two supplicants at the base of the frame are exactly the player's position. |
| *(fallback)* | "The New Zealander" (1873) | Replaces the retired `arena-ruined-city.jpg`. Chosen because a fallback must stay coherent behind regions it was not drawn for: heavy dark mass at the edges, a lit band across the middle where the foe composites, and a subject — ruin outliving the city that made it — general enough not to contradict an unmapped region. |

## Decisions made upfront — DO NOT ASK

1. **The single-source rule is deliberately broken, and only here.** Phase 101
   decision 1 was "one source edition, not the best plate per region", and it
   was right *for a set of settled London regions*. The Caverns and the Capital
   are not settled London regions; there is no *London: A Pilgrimage* plate of
   an underworld gate or a celestial court, because Doré did not draw one. The
   coherence argument still holds — same artist, same decade, same engraving
   technique, same grade — it is the same hand, a different book.
2. **`arena-ruined-city.jpg` is retired, not kept as a second fallback.** It was
   owner-supplied, licence UNRESOLVED and untraced; and on inspection it is
   saturated **pixel art of modern high-rise buildings** sitting among nine
   grayscale wood engravings. Because it was the fallback it was the *most-seen*
   arena in the game, so it was simultaneously the licence exposure and the
   worst visual mismatch in the product. Phase 101 declined to rush its
   replacement. This phase did the search instead of rushing it.
3. **The detector's threshold was measured, not guessed.** `darkPct` was tested
   at 0.35, 0.15 and 0.05 against all three pages. At 0.35 the Caverns lost its
   sky band and the Capital cropped to a corner of clouds — and *nearly
   shipped*. 0.15 is correct for all three. Every plate was pulled and LOOKED AT
   after the crop, which is the only reason that was caught: a mis-crop is
   invisible from a filename, a dimension and an exit code.
4. **The detector throws on failure rather than guessing.** `frac < 0.2` (the
   detected box is a fifth of the page or less) means detection failed, and it
   raises. There is deliberately **no upper guard**: a plate that legitimately
   fills its page is the normal case for the Gallica scans, and an upper bound
   would reject exactly the images that need no cropping.

   **Corrected by the burn-day audit of 2026-09-19 (row 3.5).** As written this
   claim was true only of the case where a block IS found and is too small. It
   was false for the case it names — the plate not being found at all. `span()`
   initialised its answer to the whole axis and only overwrote it when a run
   closed, so a page where nothing reached `darkPct` (a blank page, or a plate
   below the coverage floor) came back as x[0,1] y[0,1] at `frac` 0.96 and
   raised nothing: the scan's margins, book edge and caption band would have
   shipped as the plate. No `frac` threshold could have caught it — two of the
   three plates below legitimately sit at 0.904 and 0.913. `detectPlateBox` now
   raises "no plate detected" instead, pinned by four cases in
   `scripts/art.test.mjs` (blank page, plate below the floor, plate with page
   margins, tight scan). The three plates below are untouched by the change:
   all three found real runs, and both controls are bit-identical across it.

   **Still open, and the sentence is still false for it.** The detector throws
   when it finds NO block; it continues to guess when it finds the WRONG one.
   Longest-run prefers whichever dark block is widest, so a 600px book edge
   beside a 200px plate crops the edge at `frac` 0.568 with no throw. Neither
   remedy the audit row suggested works: preferring the darkest run picks the
   edge too (a solid edge means 40, the plate's column 137.5), and a per-axis
   `minFrac` at 0.2 is arithmetically a no-op and misses a 0.6×1.0 box at any
   value. The honest fix is an ambiguity guard on the competing runs, and its
   ratio must be **measured** against the live sources the way `darkPct` was in
   decision 3 — not guessed. That must close before the Northern Forest
   acquisition, which is the next `plate-page` source.
5. **The licence is never asserted, only read.** Every plate went through
   `acquire-art.mjs`, which reads Commons' own `imageinfo` extmetadata and
   refuses anything it cannot prove PD/CC0. All three returned `Public domain —
   Gustave Doré`. Provenance records were written by the script.
6. **The screens registry was repointed, not left dangling.**
   `assets/images/screens/index.ts` reached the retired plate for the dev-only
   combat sandbox route. It now takes the *fallback* arena, which is the honest
   answer: that screen has no region, so it should show what an unmapped region
   shows.

## The gate that let a deleted file stay referenced

`scripts/asset-provenance.test.mjs` exists to catch exactly the failure this
phase created — its own header says "a require() for a deleted file (a runtime
crash)". It did not catch it. Two holes, both closed here with a proof that each
new gate fails on the condition it claims to catch:

1. **It only matched `require('./…')`.** But `screens/index.ts` reaches ACROSS
   directories *by design* — its header note is that plates are reused from
   `maps/` rather than re-acquired — so every one of its requires is `../…` and
   none was ever checked. It also only swept directories holding raster files of
   their own, and `screens/` holds none. Now every `index.ts` under
   `assets/images` is swept for every relative require.
2. **Nothing checked that a record's `covers` names a file that exists.** The
   retired plate's provenance record survived its own asset, still claiming a
   licence for something that no longer ships. Now `covers` entries are checked
   against the directory (the prose blanket form — "every .webp in this
   directory" — names no file and is skipped).

## Output schema / contracts

No contract change to `arenaBackdropFor` / `arenaAltTextFor`. `provenance.json`
records gain an optional `crop` block; the `plate-page` recipe is additive.

## Pages × tests matrix

| Suite | Asserts |
|---|---|
| `assets/images/combat/__tests__/index.test.ts` (re-derived + 2) | NO live region falls back (the phase's actual claim, asserted over the region list rather than one example); six keyed regions, six distinct plates; the fallback has its own description shared by no region; alt text describes the PLATE, never names the region back at the user; The Capital and The Northern City stay on separate plates |
| `components/.../CombatBoard.region-arena.test.tsx` (1 re-derived) | the unmapped case feeds an invented region, since every real one is now keyed |
| `scripts/asset-provenance.test.mjs` (+2) | every registry require — `../` included — points at a file that exists; every record's `covers` names a file that exists. Both proven to FAIL on the condition they catch |

Two assertions were re-derived rather than repaired, each with its reason in the
test: `arenaBackdropFor('The Caverns')` no longer equals the fallback, and the
fallback's description no longer contains "ruined city". Both changes ARE the
phase.

## Verify gate

`npm run verify --workspace axiomancer-mobile` — 308 suites, 2946 tests, 0 lint
errors (15 pre-existing warnings, unchanged). Provenance gate 9/9.

## DoD

- [x] `plate-page` recipe (`detectPlateBox` + `buildPlatePage`) in the
      licence-proving pipeline, crop box recorded in provenance
- [x] The Caverns and The Capital have their own plates — bespoke arenas 6 of 7
- [x] `arena-ruined-city.jpg` retired; fallback replaced; screens registry
      repointed; its provenance record removed with it
- [x] every plate pulled and visually inspected after cropping
- [x] the two provenance-gate holes closed, each proven to fail on its condition
- [x] tests re-derived with the reason stated; mobile gate green

## Follow-ups (out of scope)

- **The Northern Forest** is the last region without its own arena. It is not
  blocked on tooling any more — only on finding the right plate.
- `maps/ludgate-hill.webp` carries legible 1872 advertising (`LLOYD NEWS ONE
  PENNY`), flagged in `docs/art-catalog.json`. Period-correct, but it is text in
  a game whose UI is also text.
- `combat/arena-desolation.webp` — the plate this phase installed as the
  fallback — carries the same class of text: the right-edge building's frieze
  reads `COMMERCIAL WHAR[F]`, cut mid-word by the plate edge. It went
  unrecorded through this phase's visual inspection and was found in the
  burn-day audit of 2026-09-19 (row 3.12); it is flagged in
  `docs/art-catalog.json` now, not cropped — `buildPlatePage`'s `inset` trims
  all four sides, and the right-edge dark mass it sits in is the reason this
  plate was chosen for the fallback slot.
