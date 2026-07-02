# Phase 9 — Spec 11: Asset pipeline

## Outcome

Drain the SVG placeholder backlog via the existing `.cursor/skills/swap-asset-placeholder/SKILL.md` flow. One real asset per tick through the autonomous loop.

## Why

Currently all assets in the app are coded placeholders (see `SVG_ASSET_SPEC.md`). With 18 unchecked items in the asset checklist, the app lacks visual polish. This phase establishes the autonomous asset swap workflow that allows the loop to replace one placeholder per tick without user intervention.

## Routes / API endpoints / CLI surface

No new routes. Existing screen routes (`app/(tabs)/{combat,character,exploration,inventory,event}`) gain real assets instead of placeholder SVGs.

## Content / data reads

No new content reads. Asset files land in `assets/images/` with provenance sidecars.

## Components / handlers

**Reused primitives:**
- `SvgXml` from `react-native-svg` (existing)
- `AXM` palette tokens from `theme/axm.ts` (existing)

**Modified components (one per asset):**
- `components/StanceGlyph.tsx` (body, mind glyphs)
- Components with action icons, effect glyphs, etc. per `SVG_ASSET_SPEC.md`

Each swap follows the canonical pattern established in `GlyphHeart`:
1. Replace placeholder `<Svg>` with `<SvgXml xml={assetXml} />` for vectors
2. Replace with `<Image source={...} />` for raster
3. Maintain `currentColor` inheritance for theming
4. Add provenance sidecar for all AI-generated assets

## Cross-links

**In (verify):** None new. Each asset swap verifies existing screen render paths.

**Out (ship):** None new. Asset swaps enhance existing screen visuals.

**Retro-fit:** None required. Assets are drop-in replacements for placeholders.

## SEO / metadata / output schema

Not applicable (mobile binary).

## Hero / body / sub-section composition

Each asset swap per `.cursor/skills/swap-asset-placeholder/SKILL.md`:
1. Pick next unchecked item from `SVG_ASSET_SPEC.md`
2. Generate vector (SVG XML) or raster (PNG) asset
3. Wire into component maintaining existing API
4. Write hermetic test
5. Tick checklist

**Vector track (icons/glyphs):** Hand-written SVG using `currentColor`
**Raster track (illustrations):** Generated PNG via image-gen MCP or GenerateImage

## Empty / loading / error states

**Empty state:** "No assets swapped yet — check SVG_ASSET_SPEC.md."
**Loading state:** N/A (build-time asset compilation)
**Error state:** "Asset generation failed — check MCP config."

## Decisions made upfront — DO NOT ASK

1. **One asset per autonomous tick** — prevents context pollution, allows incremental progress
2. **Follow existing GlyphHeart pattern** — proven reference implementation
3. **Vector assets use hand-written SVG** — predictable, theme-compatible, no dependency on image gen
4. **Raster assets use image-gen MCP or GenerateImage** — Mörk Borg woodcut aesthetic
5. **All assets get provenance sidecars** — enables regeneration, prevents overwriting hand-authored work
6. **Maintain component public APIs** — existing screen code unchanged
7. **Guard against hand-authored overwrites** — Step 2 check protects user assets
8. **Atomic commits per asset** — asset + provenance + wiring + test + checklist tick

## Mobile reflow / responsive / paginate / output limits

Assets render at spec dimensions (`currentColor` for theming):
- Glyphs: 12px to 64px square
- Action icons: 24px square at baseline
- Illustrations: Fixed dimensions per spec
- Tab icons: Platform-standard dimensions

## Pages × tests matrix

Each asset swap includes:
- Component render test at min/max sizes
- `currentColor` inheritance verification
- No hardcoded hex leak detection
- Dispatcher routing tests for multi-glyph components

## Verify gate

```bash
npx tsc --noEmit        # Clean TypeScript
npm test                # Hermetic tests green
npm test                # Green twice (no flakes)
```

## Commit body template

```
feat(assets): swap <asset-name> placeholder for generated <vector|png>

Replaces the inline SVG in <SourceFile> with <asset-path>.
Spec: SVG_ASSET_SPEC.md §N. Provenance: assets/images/<name>.provenance.json.
```

## DoD

- [ ] Select next unchecked asset from `SVG_ASSET_SPEC.md`
- [ ] Generate real asset (vector SVG or raster PNG)
- [ ] Write provenance sidecar
- [ ] Wire asset into component
- [ ] Write hermetic component test
- [ ] Verify gate passes (2x green)
- [ ] Tick checklist in `SVG_ASSET_SPEC.md`
- [ ] Commit atomically

## Follow-ups (out of scope)

- Complete asset backlog (remaining 17 items after this phase)
- Design system consistency audit
- Asset optimization (file size, loading performance)
- Real artwork commission (post-placeholder MVP)