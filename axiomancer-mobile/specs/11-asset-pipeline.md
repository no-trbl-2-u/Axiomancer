# Spec 11 — Asset Pipeline

## Goal

Replace the SVG placeholders enumerated in
[`SVG_ASSET_SPEC.md`](../SVG_ASSET_SPEC.md) with real woodcut / ink
artwork. Establish the import path, the rendering primitives, and
the contract for new assets so adding the next 50 doesn't require a
spec each time.

**Success state:** Every checklist item at the bottom of
`SVG_ASSET_SPEC.md` ships a real asset. The "asset checklist" turns
into a "completed" header. New assets can be dropped into
`assets/images/` and referenced via a single helper.

## Why now / dependencies

- **Unblocks:** visual polish; getting feedback from non-technical
  testers.
- **Depends on:** none — can land any time after Spec 01 ships
  (because asset render branches need their own component render
  tests).

## Current state

- `SVG_ASSET_SPEC.md` enumerates 12+ asset categories with exact
  dimensions and contract.
- No real assets are in `assets/images/` (only the Expo template
  images survive).
- `react-native-svg` is the rendering primitive for vector marks.
- `expo-image` is installed and is the right choice for raster
  fallbacks and SVG-via-`SvgXml`.

## Open questions

1. **Asset format priority.**
   - (A) **(default)** SVG-first (smallest, scaleable, monochrome
     via `currentColor`). PNG fallback only for irregular
     illustrations (hierophant portrait, event scenes).
   - (B) PNG-first, with @1x / @2x / @3x. Avoid SVG runtime cost.
   - (C) Mix per asset class — small icons SVG; large illos PNG.
   > Your answer: C

2. **Asset source.** Where does the actual artwork come from?
   - (A) Hand-drawn by the designer, scanned, traced.
   - (B) AI-generated (Midjourney, etc.) and post-processed.
   - (C) Commissioned from an artist.
   - (D) Mix.
   > Your answer: B

3. **Asset registry.** Hand-rolled `assets/index.ts` mapping slug →
   `require(...)`?
   - (A) **(default)** Yes — typed registry with autocomplete.
   - (B) No — direct `require('@/assets/images/...')` per consumer.
   > Your answer: A

4. **Theming on raster assets.** PNG illustrations cannot be
   recoloured at runtime. If a future "light mode" or "alt palette"
   is desired:
   - (A) **(default)** Defer — accept dark-mode-only for v1.
   - (B) Provide light/dark variants per asset.
   > Your answer: A (There will not be a "light mode")

5. **Bundle size budget.** Set a budget for the assets folder
   (e.g. ≤ 5 MB before launch)?
   > Your answer:

## Proposed approach

1. **Create `assets/images/` folder structure**:
   - `assets/images/glyphs/` — heart, body, mind, effect glyphs.
   - `assets/images/icons/` — action icons, tab icons, node marks.
   - `assets/images/illustrations/` — hierophant, encounter, boss.
   - `assets/images/splatters/` — 4 ink splatter PNGs.
2. **Add `assets/index.ts`** if Q3 = A: typed registry.
3. **Swap one asset class at a time**, in this order:
   1. Stance glyphs (`StanceGlyph.tsx`).
   2. Effect glyphs (`EffectGlyph.tsx`).
   3. Action icons (`ActionIcon.tsx`).
   4. Node marks (`NodeMark.tsx`).
   5. Splatters (`Splatter.tsx`).
   6. Hierophant illustration (`combat.tsx`).
   7. Event illustrations (`event.tsx`).
   8. Body diagram (`BodyDiagram.tsx`).
   9. Tab bar icons (`(tabs)/_layout.tsx`).
4. **Component render tests** for each swapped component asserting
   the new render path (presence of an `<Image source={...}>` or
   `<SvgXml>` rather than the legacy procedural SVG).
5. **Update `SVG_ASSET_SPEC.md`** — strike through the checklist
   items as they land; mark the doc `[COMPLETED on YYYY-MM-DD]` at
   the top once empty.

## Acceptance checklist

- [ ] All 5 questions answered.
- [ ] Every checklist item in `SVG_ASSET_SPEC.md` ticked.
- [ ] `assets/images/` structured per Q3.
- [ ] No procedural SVG remains in placeholder components (except
      where a procedural path is the deliberate aesthetic — e.g.
      `tornEdgePath` is still useful).
- [ ] Bundle size under the budget set in Q5.
- [ ] `npm test` and `npx tsc --noEmit` clean.

## Out of scope

- Sound effects / music — flagged for `BRAINDUMP.md`.
- Animated illustrations (Lottie) — future spec.
