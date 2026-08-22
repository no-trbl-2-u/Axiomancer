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

**`Potential Assets/MCP-Axiomancer/images/` (116 card paintings) —
open-source art found online** (owner's answer, 2026-08-22), per-image
license NOT yet on record. "Open source" spans CC0 (no obligations),
CC BY (attribution required), and share-alike terms, so the origin
answer removes the scrape risk but does not settle the terms. Rule:
do not wire one into the card registry until its source and license
can be written truthfully into `provenance.json`. Tracing them
(filename / reverse-image / bundled-manifest search against the usual
open-art hosts) is fair game, and any image whose license is
evidenced may ship.

## Generated art (Option A, ruled 2026-08-22)

The art route is hosted **gpt-image-2 behind a swappable adapter**,
upgradeable to a local FLUX+LoRA setup later
(`plan/ideas/AI_ART_PIPELINE_OPTIONS.md` §9; build-plan Phase 73).
A generated asset follows the same ingest contract above, with two
additions to its `provenance.json` entry: the **model** and the
**exact prompt**. That record is the Steam AI-disclosure artifact —
raw AI output is not copyrightable, so the provenance file is what
evidences human curation. The API key lives in `.env` (gitignored)
and is never committed.

## Known gaps (queued work, build plan)

- No provenance-completeness or registry-vs-directory drift test.
- No in-repo image post-processing dependency (`sharp` is the
  candidate; adding it needs its phase case per the V-series rules).
- No bundle-size budget (spec 11 Q5 was left blank).
- `assets/images/maps/` has one plate; `combat/` one arena — coverage,
  not convention, problems.
