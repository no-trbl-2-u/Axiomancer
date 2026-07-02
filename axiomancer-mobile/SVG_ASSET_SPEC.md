# Axiomancer — SVG Asset Swap Spec

## Executive Summary

**This document is for asset replacement workflow, not initial development setup.**

If you're a fresh maintainer getting oriented with the project, you likely don't need this file yet. **Start using this when Spec 11 (asset pipeline) is ready to implement** or when you need to:
- Replace coded SVG placeholders with final artwork
- Work on the visual polish phase of development
- Implement new visual assets that integrate with existing components

For initial development and contributing to game logic, start with [README.md](./README.md) and [docs/](./docs/).

---

Every SVG in this codebase is a coded placeholder. This document maps each
placeholder to the real asset that should replace it, specifies its exact
dimensions/contract, and explains how to do the swap.

---

## How to swap an asset

1. Add the asset file to `assets/images/` (PNG, SVG, or WebP).
2. Import it: `import myAsset from '@/assets/images/my-asset.png';`
3. Replace the `<Svg …>` block with:
   ```tsx
   <Image source={myAsset} style={{ width: W, height: H }} />
   ```
   where `W × H` match the spec below.
4. Delete the placeholder SVG component if it is no longer used.

For vector assets (SVG files), use `react-native-svg`'s `SvgUri` or
`SvgXml` from `react-native-svg`, or use `expo-image` which natively
handles SVGs on both platforms.

---

## 1 · Stance Glyphs

**File:** `components/StanceGlyph.tsx`
**Exports:** `GlyphHeart`, `GlyphBody`, `GlyphMind`, `StanceGlyph`
**Usage:** Combat (stance picker, resolve panel, enemy last-stance badge),
Character sheet (base stats), Skill cards.

| Glyph | Current placeholder | Intended art |
|-------|---------------------|--------------|
| `heart` | Anatomical heart SVG | Woodcut ink heart |
| `body`  | Clenched fist SVG   | Woodcut fist / muscle |
| `mind`  | Cracked skull SVG   | Woodcut skull |

**Contract:** Square. Caller passes `size` (default 40) and `color`.
The glyph must render at any size from 12 px to 64 px.
Replace each `Glyph*` function body with:

```tsx
export function GlyphHeart({ size = 40, color = AXM.parchment }: GlyphProps) {
  return (
    <SvgXml
      xml={heartXml}            // import the raw SVG string
      width={size}
      height={size}
      color={color}             // SVG must use currentColor
    />
  );
}
```

---

## 2 · Effect Glyphs

**File:** `components/EffectGlyph.tsx`
**Usage:** EffectChip (combat, character sheet), effect rows on character sheet.

| `kind` prop | Current placeholder | Size rendered |
|-------------|---------------------|---------------|
| `poison`    | Dripping vial       | 12–20 px |
| `bleed`     | Three drops         | 12–20 px |
| `stun`      | Starburst           | 12–20 px |
| `regen`     | Arrow through heart | 12–20 px |
| `burn`      | Flame               | 12–20 px |
| `buff`      | Up-triangle         | 12–20 px |
| `debuff`    | Down-triangle       | 12–20 px |
| `shield`    | Shield              | 12–20 px |

All glyphs must work as **monochrome silhouettes** — they receive a `color`
prop and should render in that single color.

---

## 3 · Action Icons

**File:** `components/ActionIcon.tsx`
**Usage:** Exploration action drawer, combat action phase, choice rows on event card.

| `kind` prop | Current placeholder | Size rendered |
|-------------|---------------------|---------------|
| `sword`     | Diagonal sword      | 22–32 px |
| `shield`    | Kite shield         | 22–32 px |
| `arcane`    | Pentagram circle    | 22–32 px |
| `bag`       | Satchel             | 22–32 px |
| `flee`      | Running arrow       | 22–32 px |
| `eye`       | Eye                 | 20–32 px |
| `crown`     | Split crown         | 20–32 px |
| `chest`     | Treasure chest      | 22–32 px |
| `scroll`    | Rolled scroll       | 22–32 px |
| `flame`     | (delegates to EffectGlyph `burn`) | 22–32 px |

Same monochrome contract as Effect Glyphs.

---

## 4 · Map Node Markers

**File:** `components/NodeMark.tsx`
**Usage:** Exploration screen node graph.

| `kind` prop  | Visual | Size |
|--------------|--------|------|
| `completed`  | Skull  | 28–36 px |
| `locked`     | Crossed-out circle | 28–36 px |
| `current`    | Glowing bull's-eye | 28–36 px |
| `available`  | Hollow circle with fill | 28–36 px |

These are small, must read clearly at 28 px. Keep them simple silhouettes.

---

## 5 · Ink Splatter

**File:** `components/Splatter.tsx`
**Usage:** Enemy panel (combat), resolve panel, event card illustrations.

This is a purely decorative procedural SVG. To replace with a real asset:

```tsx
import splat1 from '@/assets/images/splat-1.png';
// ...
<Image source={splat1} style={[{ width: size, height: size, opacity }, style]} />
```

Provide at least 3–4 splatter PNGs with transparent backgrounds. Vary by
`seed` prop → pick `splats[seed % splats.length]`.

---

## 6 · Enemy Illustration — Carrion Hierophant

**File:** `app/(tabs)/combat.tsx` — inline `<Svg>` inside `CombatScreen`
**Current:** Hooded silhouette with glowing red eyes
**Target:** High-contrast woodcut/ink illustration of the Carrion Hierophant
**Dimensions:** 180 × 200 px rendered on screen (actual asset: 360 × 400 or 2×)
**Position:** `position: 'absolute', right: -10, bottom: -8`

Swap code:
```tsx
// Replace the inline <Svg viewBox="0 0 200 200"> block with:
<Image
  source={require('@/assets/images/enemy-hierophant.png')}
  style={{ position: 'absolute', right: -10, bottom: -8, width: 180, height: 200 }}
  contentFit="contain"
/>
```

---

## 7 · Event Screen Illustrations

**File:** `app/(tabs)/event.tsx`

### 7a · Encounter Illustration (`EncounterIllustration`)
**Current:** Procedural SVG — hanged trees, insectoid creature on cairn, slit moon
**Target:** Original woodcut ink illustration: "A Figure Stirs in the Rot"
**Dimensions:** full-width × 320 px (Boss variant: 360 px)
**Swap:** Replace the `<EncounterIllustration />` component call:
```tsx
<Image
  source={require('@/assets/images/event-encounter.png')}
  style={[StyleSheet.absoluteFillObject, { resizeMode: 'cover' }]}
/>
```

### 7b · Boss Illustration (`BossIllustration`)
**Current:** Procedural SVG — broken arch, halo rings, the Gutted King on a throne
**Target:** Original woodcut ink illustration: "The Gutted King Wakes"
**Dimensions:** full-width × 360 px
**Swap:** Same pattern as 7a with `event-boss.png`.

---

## 8 · Character Body Diagram

**File:** `components/BodyDiagram.tsx`
**Usage:** Character sheet — equipment slot map.
**Current:** Simple stick-figure SVG outline with yellow dots for slots.
**Target:** Hand-drawn ink figure outline with slot circles.
**Dimensions:** 88 × 220 px fixed.

The slot dot positions (in the 88×220 viewbox) are:
```
Head:      cx=44  cy=20
Torso:     cx=44  cy=60
Left hand: cx=22  cy=115
Right hand: cx=66 cy=115
Armor:     cx=44  cy=100
Weapon:    cx=78  cy=80
Feet:      cx=44  cy=195
```
Any replacement illustration must keep these slot anchors in the same relative
positions so the dot overlay remains aligned.

---

## 9 · XP Chain

**File:** `components/XpChain.tsx`
**Usage:** Character sheet — XP progress bar.
**Current:** SVG ellipse chain links.
**Target:** Could remain as-is (it's purely abstract UI) — or replace with a
custom hand-drawn chain image if desired.

---

## 10 · Tab Bar Icons

**File:** `app/(tabs)/_layout.tsx` — `TabIcon` component
**Current:** Inline SVGs (eye, sword, crown, bag, scroll).
**Target:** Woodcut icon set matching the game aesthetic.
**Size contract:** `size` prop (default ~24 px from React Navigation), active
color = `AXM.sulfur`, inactive = `AXM.bone`.

Swap one icon:
```tsx
// In TabIcon switch:
case 'sword':
  return <SvgXml xml={swordXml} width={size} height={size} color={color} />;
```

---

## Quick reference — color palette

```
AXM.bg        = '#0a0a0a'    // near-black background
AXM.parchment = '#e8dfc8'    // main text / inactive icon
AXM.blood     = '#c0152a'    // HP, danger, bleed
AXM.sulfur    = '#d4c026'    // mana, selected, active
AXM.rust      = '#9e3a1a'    // friendship, rust accents
AXM.bone      = '#8a8273'    // secondary text, inactive tabs
AXM.ash       = '#3a3530'    // borders, disabled
```

All monochrome assets should use `currentColor` internally so they inherit
the `color` prop without needing separate colored variants.

---

## Asset checklist

- [x] `GlyphHeart` — woodcut heart
- [x] `GlyphBody` — woodcut fist
- [ ] `GlyphMind` — woodcut skull
- [ ] Effect glyph set (8 icons)
- [ ] Action icon set (9 icons)
- [ ] Map node markers (4 states)
- [ ] Ink splatter PNGs (3–4 variants)
- [ ] Enemy: Carrion Hierophant (180×200)
- [ ] Event: Encounter illustration (full-width × 320)
- [ ] Event: Boss illustration (full-width × 360)
- [ ] Character body diagram (88×220)
- [ ] Tab bar icon set (5 icons)
