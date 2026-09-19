# Phase 101 — Every settled region fights on its own ground

> Owner instruction, 2026-09-19: *"find whatever art/background/assets/fonts
> online you'd like for a true 'big impact'."* Authorized as a loop call by
> THE OPEN GATE ¶6 (T direct, 2026-08-28): art origin questions are the loop's
> to settle.

## Outcome

Three regions stop fighting in front of a borrowed cityscape and get their own
arena. Bespoke combat backdrops go from **1 of 7 regions to 4 of 7**.

## Why this, and not fonts

The type system was checked first and deliberately left alone. Pirata One /
IM Fell English / JetBrains Mono / Bebas Neue are already OFL-licensed and
period-correct for the Woodcut Codex register (`docs/VISUAL_LANGUAGE.md`:
*FromSoftware x Inscryption x illuminated manuscript*). Changing them would be
churn dressed as impact.

The arena was the real gap. `arenaBackdropFor` shipped in Phase 83 with exactly
one rule, and Phase 83's own brief named the residual as follow-up work: *"Arena
plates for the remaining regions — each its own curation decision."* Six of
seven live regions rendered the same generic ruined city, including every fight
in the entire northern continent.

## What shipped

| Region | Plate | Why |
|---|---|---|
| The Northern City | "Over London by Rail" | Tenement backyards and chimney stacks under a railway viaduct, framed by a dark brick arch. A city grim by ordinary congestion rather than by monsters — the register the region is written in. |
| The Connecting River | dock gate at low sun | A crowd at a dock gate, a forest of masts behind, a body on the cobbles. A landing rather than a view of open water: the region is a crossing you arrive at. |
| The Sweetheart's Village | "Dudley Street, Seven Dials" | A slum lane, children in the roadway, second-hand wares on the stones. Domestic, poor and human-scale, which is what the town across the river is. |

All three are Gustave Doré plates from **the same edition as the coastal arena
already shipped** — *London: A Pilgrimage* (1872), via the Gallica scans on
Commons. That is the point: four fights in four places now look like four
places by one hand, not four borrowed pictures.

## Decisions made upfront — DO NOT ASK

1. **One source edition, not the best plate per region.** Coherence beats
   per-region optimisation. A Doré Inferno plate would have suited the Caverns,
   but mixing Dante's fantasy register with London's documentary one inside the
   same screen family reads as a stock-art grab.
2. **Only plates that need no crop.** The Gallica scans are tight, uncaptioned,
   edge-to-edge plates. The alternatives were not: the Yale (YCBA) scans of the
   same book are *page photographs* — title text, cream margins, the physical
   book edge — and the well-named Dante series carries an English caption band.
   `acquire-art.mjs` has no crop step (the Doré recipe only grades and resizes;
   only the `silhouette` recipe trims). `maps/forest-dark.webp` got its caption
   band cropped by a one-off Pillow step back in August, before that script
   existed. Rather than hand-crop outside the licence-proving pipeline — the one
   thing that pipeline exists to prevent — this phase only took plates that need
   no crop. **Adding a `trim`/crop recipe is filed as the follow-up that unlocks
   the rest.**
3. **The licence is never asserted, only read.** Every plate went through
   `scripts/acquire-art.mjs`, which reads Commons' own `imageinfo` extmetadata
   and refuses anything it cannot prove is PD/CC0. All three returned
   `Public domain — Gustave Doré`. Provenance records were written by the script,
   not by hand.
4. **Narrow, non-overlapping patterns.** `/northern city/i`, not the maps
   registry's `/city|citadel|capital/i` family — that generality would collapse
   The Northern City and The Capital onto one plate, and those are the two places
   the game most wants to feel different. It is also what silently stopped
   matching after the 44f naming pass.
5. **The village matches on `sweetheart` alone.** The live string is
   `The Sweetheart's Village`; a pattern spanning the apostrophe would break on a
   straight/curly swap in the layout file. Pinned by a test that feeds it both.
6. **The fallback was NOT replaced, though policy allows it.**
   `arena-ruined-city.jpg` carries licence `UNRESOLVED`, and THE OPEN GATE ¶6
   makes replacing it a loop call. The best neutral candidate found (Doré's
   "The Deluge") was rejected on inspection: a caption band, page margins, and a
   foreground of drowning nudes — wrong behind *every* unmapped fight. Rushing
   the plate that shows most often is the worst place to compromise. Filed.
7. **Every plate was looked at before it was chosen.** Thumbnails were pulled
   and viewed. That is how the YCBA page-scans, the Derby crowd, the theatre
   audience and a plate carrying legible `LLOYD NEWS ONE PENNY` advertising were
   all caught and dropped — none of which is visible from a filename.

## Output schema / contracts

No contract change. `ArenaPlate` records were already introduced by the
preparatory refactor (`d266066`); this phase adds three entries to the table.

## Pages x tests matrix

| Suite | Asserts |
|---|---|
| `assets/images/combat/__tests__/index.test.ts` (+3, 1 re-derived) | each keyed region gets its OWN plate and no two share one (4 distinct); the village matches through both apostrophe forms; every keyed region has its own description and none keeps the fallback's; a region with no rule still falls back |
| `scripts/asset-provenance.test.mjs` | every art file reachable from a registry, every record carries date/tool/licence/covers — 7/7 green |

The re-derived case previously asserted that The Northern City and The
Sweetheart's Village fall back. That was true, and it was the bug.

## Verify gate

`npm run verify --workspace axiomancer-mobile` — 306 suites, 2916 tests, 0 lint
errors (15 pre-existing warnings, unchanged). No mechanics file touched, so **no
baseline regen**.

Weight added: 644K for three plates (8.8M → 268K, 5.6M → 128K, 8.8M → 246K).

## DoD

- [x] three plates acquired through the licence-proving pipeline
- [x] provenance written by the script for each
- [x] wired into the plate table with their own alt text
- [x] tests re-derived with the reason stated; provenance gate green
- [x] mobile gate green

## Follow-ups (out of scope)

- **A `trim` recipe for `acquire-art.mjs`.** This is the gate on everything
  else: with it, the Dante series (caption band) and the Yale scans (page
  margins) both open up, which covers The Caverns, The Capital and a distinct
  Northern Forest arena. Sharp already does `.trim()` — the `silhouette` recipe
  uses it. The work is making it a first-class option with its own provenance
  note, not a hand step.
- **The Caverns and The Capital** still fall back. Both want a register London
  does not have (subterranean; monumental). Blocked on the trim recipe above.
- **Replace `arena-ruined-city.jpg`.** Licence UNRESOLVED, and it is still the
  plate behind every unmapped fight. Needs a neutral, uncaptioned, desolate
  plate — a real search, not a rush.
