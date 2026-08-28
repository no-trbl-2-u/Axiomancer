# Phase V — The Woodcut Codex: full visual redesign (master plan)

> Owner-directed 2026-08-08 (T, attended web session): *"complete freedom
> to take the game in any visual theme … full wipe on all the constraints
> I had before regarding the direction of the game's design."* This master
> plan is the standing brief for the V-sequence rows in
> `plan/steps/01_build_plan.md`. Each phase generates its own detailed
> brief on pickup per `skills/plan-a-phase.md`; this file is the shared
> north star so the sub-briefs never drift apart.

> **RATIFIED BY PLAY, 2026-08-28 (T direct, attended):** shown the live
> continent-playtest captures — the Dore-plate omen cutscenes, the
> parley sheet, the map hub — T's verbatim reaction: *"OMG! This art
> direction is amazing!"* The Woodcut Codex is no longer a bet; it is
> confirmed against the owner's eye on real screens. Standing
> consequence for V6–V8 and every `/forge` art tick: this direction is
> the bar to CLEAR, not a draft to second-guess — invest in completing
> it (plate coverage, glyph unification, placeholder teardown), not in
> exploring alternatives.

## The chosen direction

**The Woodcut Codex** — double down on the identity the game already
half-owns and finish it: *FromSoftware × Inscryption × illuminated
manuscript* (T's own lineage brief, design handoff 2026-05-23, chat5).
Every screen is a page of a chronicle. Ink-on-parchment woodcut art,
iron and wax furniture, hairline rules, ✠ eyebrows, lowercase-roman
in-world numerals, AXM-token color discipline (five region themes stay).
The redesign is not a new theme — it is the *completion* of this one:
every "coded placeholder" SVG (per `axiomancer-mobile/SVG_ASSET_SPEC.md`,
which declares the entire inline-SVG population placeholder) is either
promoted into a canonical icon system or replaced by real art.

## Ground truth (surveyed 2026-08-08)

- The icon/glyph directory T provided — **`Potential Assets/`** at the
  repo root (landed on `main` 2026-08-08, commit `8c03958`) — is the
  canonical icon source: the full game-icons.net collection (4,180
  single-path silhouettes × transparent/black-plate variants, CC BY 3.0
  / CC0 per artist, `icons-TBR/license.txt`), plus
  `MCP-Axiomancer/images/` (painted card art keyed by live card names —
  V7 fuel) and an `xml-example.xml`. Icons are consumed by *curated
  extraction* (`axiomancer-mobile/scripts/extract-game-icons.mjs` →
  generated `components/icons/game-icon-paths.ts`), never by bundling
  the library wholesale.
- Before this library landed, the app's icon language was hand-copied
  inline `react-native-svg` code descended from the May design-handoff
  placeholders, **scattered and duplicated**: `app/(tabs)/_layout.tsx`
  re-inlined five ActionIcon paths verbatim, `CombatVictoryPanel`
  re-inlined the sword, two pixel-heart emblems coexist, and
  `BodyDiagram`/`MindMark`/`FriendshipMeter` are orphans.
- 42 non-test files draw inline SVG; the biggest art surfaces are the
  event illustrations, enemy-art figures, and the minigame glyph kits.
- Raster pipeline precedent: `require()`d `.webp` + sibling
  `provenance.json` + barrel `index.ts` (labyrinth walls/doors, enemies,
  portraits, cards), rendered via `expo-image`. Backgrounds follow this.
- Theming: all color through AXM tokens (`usePalette`/`makeStyles`); any
  registry must render via tokens, never baked hex (the raw handoff files
  bake `#fff`/`#d4c026` — the registry re-sources geometry, not color).

## The V-sequence

- **V1 — Iconography canon.** One data-driven registry
  (`components/icons/`): curated game-icons.net silhouettes extracted
  from `Potential Assets/icons-TBR` (manifest in
  `scripts/extract-game-icons.mjs`, attribution per entry) rendered by a
  single `<AxmIcon>`; `ActionIcon`/`EffectGlyph` become thin adapters
  (public API unchanged); kill every verbatim duplicate (tab bar,
  victory panel, pixel-heart pair); delete or wire the orphans.
  Registry test + existing suites stay green. (mobile)
- **V2 — The map as an artifact.** WILDS redesign: layered map scene —
  parchment-void backdrop (hatch + vignette + torn frame, procedural,
  AXM-tokenized), road-style edges kept, node marks + kind icons from
  the registry (treasure reads as a chest, not a scroll), compass rose,
  region-accent theming. (mobile)
- **V3 — Menus & chrome.** Tab bar on the registry with the handoff
  active-treatment (sulfur active / bone inactive), header convention
  (✠ eyebrow + hairline) audited into one shared component, panel
  furniture (TornPanel, rivets, seals) consistency pass across
  SELF / SATCHEL / MEMOIR + modals. (mobile)
- **V4 — Background acquisition pipeline.** Scout-driven sourcing of
  real background art: public-domain woodcuts/engravings (Old Book
  Illustrations, British Library / Rijksmuseum / NYPL public-domain
  collections, Biodiversity Heritage Library) and CC0 textures
  (ambientCG etc.); license gate = public domain or CC0 preferred,
  CC-BY allowed with in-repo attribution; every file lands with
  `provenance.json` (source URL, license, retrieval date) mirroring the
  labyrinth/cards convention; webp-optimized with a size budget per
  asset class. Deliverables: per-region map backdrops, encounter-screen
  backgrounds (rest / gathering / cache / quest / village / dialogue),
  title-screen refresh candidates. (assets; scout + pipeline)
- **V5 — Backgrounds wired.** `ScreenBg` gains a keyed art slot with
  dim/vignette treatment (map stays legible above art per the handoff
  "map dims behind, never blurs" rule); each encounter screen + map
  region consumes its V4 backdrop; combat arena variety extends the
  `arena-ruined-city` precedent. Graceful fallback to the procedural
  V2 backdrop when no asset exists. (mobile)
- **V6 — Combat & minigame glyph unification.** Fold the shared subset
  of the hazard/gathering/cache/combat glyph kits into the registry
  (die faces and deliberately-bespoke marks stay local); audit
  `glyphShapes.ts` + `statusGlyphs.ts` against the keyword registry so
  every keyword renders one canonical mark. (mobile)
- **V7 — Illustration upgrades.** Replace the remaining procedural
  illustration SVGs with acquired art per `SVG_ASSET_SPEC.md` §5–8
  (event/boss illustrations, splatter PNG variants, room-scene
  backdrops); the PixelEmblem woodcut-pixel carve-out is preserved.
  (assets + mobile)
- **V8 — Closure.** `/critic-loop` full screenshot pass at 375×812 +
  tablet, contrast/a11y audit, teardown of superseded placeholder code,
  `SVG_ASSET_SPEC.md` checklist reconciled, and a
  `docs/VISUAL_LANGUAGE.md` documenting the finished system. (mobile)

## Hard rules carried

No hex literals in components (AXM tokens only); no player-facing copy
in components; VITAE/STANCE canon; tests alongside code; per-workspace
verify gate; provenance for every acquired asset; no new dependencies
without a phase-level case (SvgXml + expo-image already in-tree).
