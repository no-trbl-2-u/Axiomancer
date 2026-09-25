# Phase V4 — Background acquisition pipeline

> Woodcut Codex, V-series. Depends on Phase 71's ingest legs (shipped
> 2026-08-27). Brief generated 2026-08-28 by `/ship-a-phase` §9.

## Outcome

`scripts/acquire-art.mjs`: a public-domain acquisition path that
**verifies the license from the source before it writes anything**, and
the per-region map backdrops it delivers.

## The gap, measured

`mapBackdropFor` has exactly one rule — `/forest/i` — and one plate.
Every other region falls through to it. The engine ships ten map names
(`caverns`, `connecting-river`, `northern-city`, `town-across-river`,
`fishing-village`, `northern-forest`, plus the three Aporia acts), so a
cave, a river crossing and a city currently all render as a dark wood.

## Why the license check is the phase, not a detail

Phase 71's provenance gate found that **no shipped raster art has a
license on record** (`plan/AUDIT.md`, needs-user-call). That row is
about art already in the tree. This phase decides how art *arrives*
from here on, and the answer has to be: with its terms established at
acquisition time, from the source, mechanically — or not at all.

Wikimedia Commons' `imageinfo` API returns `LicenseShortName`,
`UsageTerms` and `Artist` per file. Verified live against the shipped
Doré plate: `License: pd`, `Artist: Gustave Doré`. So the check is
cheap and real, and an acquisition that cannot prove PD/CC0 must fail
rather than land with `UNRESOLVED`.

## Decisions made upfront — DO NOT ASK

- **The script refuses anything it cannot prove is PD or CC0.** Not a
  warning, not an `UNRESOLVED` record — a non-zero exit and no file
  written. `UNRESOLVED` exists to describe art that already shipped; it
  must never become the landing pad for new acquisitions.
- **The license comes from the API, never from the operator.** A
  `--license` flag the caller can assert would reproduce exactly the
  failure this phase exists to prevent. The only thing the caller
  chooses is the file and where it goes.
- **A descriptive User-Agent is sent**, per Wikimedia's API etiquette,
  identifying the repo. Anonymous bulk fetching against a donated
  service is not something to do quietly.
- **Acquisition is one file per invocation, driven by an explicit
  manifest** of chosen titles. No crawling, no category sweeps: each
  plate is a curation decision with a reason recorded next to it.
- **Region keying stays regex-over-display-name**, matching the shipped
  `mapBackdropFor` shape. A rewrite to a keyed map is V5's business
  (`ScreenBg` generalization); this phase only adds rules and plates.
- **Grade ON for these.** Unlike Phase 71's doors (art with its own
  styling), these are raw scanned plates — the grayscale/brightness/
  contrast pass is exactly what the recorded Doré recipe is for, and
  the backdrop must sit dim enough that the chart layer stays legible.

## Surface

| File | Role |
|---|---|
| `axiomancer-mobile/scripts/acquire-art.mjs` | fetch + verify + hand to the ingest recipe |
| `axiomancer-mobile/scripts/art-sources.json` | the curated manifest: title, region, why |
| `axiomancer-mobile/assets/images/maps/*.webp` | the delivered plates |
| `axiomancer-mobile/assets/images/maps/index.ts` | region rules |
| `axiomancer-mobile/assets/images/maps/provenance.json` | source URL, artist, license, recipe |
| `axiomancer-mobile/scripts/art.test.mjs` | the verification gate, offline |

## Tests

| Case | Assert |
|---|---|
| a PD extmetadata blob | accepted |
| a CC BY-SA blob | rejected, with the license named |
| a blob with no license field | rejected |
| provenance | carries source URL, artist, license, recipe |
| the live tree | `assets:check` clean, every plate registered |

The license gate is tested against captured metadata shapes, not the
network — the test must pass in CI, which has no reason to call Commons.

## Verify gate

`npm run verify`, `npm run assets:check`, root `npm test`.

## DoD

- [ ] Acquisition verifies license from the source or refuses.
- [ ] Plates delivered for the regions that had none.
- [ ] Registry rules + provenance complete; `assets:check` green.

## Follow-ups (out of scope)

- **V5** — `ScreenBg` generalization; encounter screens consuming this
  art; combat arena variety.
- Title-screen candidates. The title art is a *wordmark* problem (the
  AUDIT row from Phase 67), not a backdrop problem, and picking a new
  title plate is an owner call.
- CC0 texture sources beyond Commons.
