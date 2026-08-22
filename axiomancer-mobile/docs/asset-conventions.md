# Asset conventions — naming, ingest, provenance

> The previously-tacit rules of the art pipeline, written down
> (2026-08-22, from the content-pipelines audit). Sources: the registry
> file headers under `assets/images/*/index.ts`, the `provenance.json`
> records (esp. `maps/` — the Doré plate acquisition), `SVG_ASSET_SPEC.md`,
> and `specs/11-asset-pipeline.md`. Those stay authoritative for their
> own surfaces; this doc is the one-page checklist.

## The ingest contract (raster art)

1. **File**: WebP preferred (JPEG acceptable for full-bleed photos),
   longest edge <= 640px (card/enemy art historically <= 512px),
   dark-mode-first grading. Enemy portraits are ALPHA-MATTED cutouts.
2. **Location**: `assets/images/<category>/<kebab-case-name>.webp` —
   categories today: `cards/`, `enemies/`, `portraits/`, `labyrinth/`,
   `treasure/`, `maps/`, `combat/`.
3. **Registry**: add a static `require()` literal to that directory's
   `index.ts` map (Metro needs static literals — no dynamic paths).
   Art keys are kebab-case; enemies key by `portraitAsset`
   (declared in `axiomancer-mechanics/src/Enemy/types.ts`, documented
   in `axiomancer-mechanics/docs/enemy.md`), cards key by card id in
   `assets/images/cards/index.ts` (the ONE place a card id meets a
   file path — the mechanics package stays art-free).
4. **Provenance**: append an entry to the directory's
   `provenance.json` in the same commit — source (URL for
   acquisitions), license, generator/tool, post-process recipe, date.
   The Doré plate entry (`maps/provenance.json`) is the model record:
   Wikimedia Commons source URL, PD status, and the exact grade
   (grayscale, brightness 0.62 / contrast 1.08, WebP q44).
   **No provenance entry, no asset.**
5. **Render**: consume through `lib/platform/image.ts` (the expo-image
   seam), never a direct `expo-image` import.

## Acquisition (the proven no-generation path)

Public-domain woodcuts/engravings (Wikimedia Commons and kin) fit the
Mörk Borg tonal north star and need no generation capability:
download → grade → WebP → registry + provenance. Licensing bar:
PD or CC0 preferred; CC BY acceptable with attribution carried in the
provenance entry. The `Potential Assets/icons-TBR` SVG trove
(game-icons.net, CC BY 3.0/CC0 — see its `license.txt`) is ingested
only via `scripts/extract-game-icons.mjs` (hand-edited MANIFEST →
regenerates `components/icons/game-icon-paths.ts` with per-entry
attribution).

**Do not build on `Potential Assets/MCP-Axiomancer/images/`** (116
card paintings): no license/provenance is on record — blocked until
the owner states their origin (filed `[needs-user-call]`,
2026-08-22 audit).

## Known gaps (queued work, build plan)

- No provenance-completeness or registry-vs-directory drift test.
- No in-repo image post-processing dependency (`sharp` is the
  candidate; adding it needs its phase case per the V-series rules).
- No bundle-size budget (spec 11 Q5 was left blank).
- `assets/images/maps/` has one plate; `combat/` one arena — coverage,
  not convention, problems.
