# Axiomancer — SVG Asset Swap Spec

## Executive Summary

**This document is for asset replacement workflow, not initial development setup.**

If you're a fresh maintainer getting oriented with the project, you likely don't need this file yet. **Start using this when Spec 11 (asset pipeline) is ready to implement** or when you need to:
- Replace coded SVG placeholders with final artwork
- Work on the visual polish phase of development
- Implement new visual assets that integrate with existing components

For initial development and contributing to game logic, start with [README.md](./README.md) and [docs/](./docs/).

---

Originally, every SVG in this codebase was a coded placeholder; this document
mapped each one to the real asset that should replace it. As of Phase V8
(closure of the Woodcut Codex visual redesign, 2026-08-31) most rows are
resolved — either swapped for acquired art/registry icons, or torn down as
dead code. See the **Asset checklist** at the bottom for the current,
reconciled state of every row; the numbered sections above it are kept for
swap-procedure history and still apply verbatim to the few genuinely
outstanding rows (`GlyphMind`, map node markers, XP chain). `docs/VISUAL_LANGUAGE.md` documents the finished system this
spec was building toward.

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

**Note (Phase V8, 2026-08-31):** the `heart`/`body` rows are RESOLVED (real
acquired SVGs, see checklist). `mind` is the one genuinely outstanding row in
this section — the procedure above still applies to it.

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

**Note (Phase V8, 2026-08-31):** RESOLVED — see checklist. All 8 kinds now
route through the `AxmIcon` registry (Phase V1); the "current placeholder"
column above describes retired procedural shapes, kept for history.

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

**Note (Phase V8, 2026-08-31):** RESOLVED — see checklist. All 9 kinds now
route through the `AxmIcon` registry (Phase V1); the "current placeholder"
column above describes retired procedural shapes, kept for history.

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

**Note (Phase V8, 2026-08-31):** genuinely outstanding — `NodeMark.tsx` is
still the procedural `<Svg>` described above; not on the icon registry.

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

**CLOSED (Phase V8, 2026-08-31):** `app/(tabs)/combat.tsx` no longer exists.
The section below is kept for history only — do not act on it.

**File (historical):** `app/(tabs)/combat.tsx` — inline `<Svg>` inside `CombatScreen`
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

**CLOSED (Phase V8, 2026-08-31):** `EncounterIllustration`/`BossIllustration`
were deleted (dead code — see checklist). `EnemyIllustration` now covers
this ground through the archetype figure set. Section kept for history only.

**File (historical):** `app/(tabs)/event.tsx`

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

**CLOSED (Phase V8, 2026-08-31):** `BodyDiagram.tsx` was deleted — zero live
call sites (see checklist). Section kept for history only.

**File (historical):** `components/BodyDiagram.tsx`
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

**Note (Phase V8, 2026-08-31):** RESOLVED — see checklist. `TabIcon` reads
`AxmIcon` directly now; the inline-SVG procedure below is historical.
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
// default `ashen-gold` theme (`theme/palette.ts` THEME_SPECS); the other four themes re-author these
AXM.bg        = '#0b0a09'    // near-black background
AXM.parchment = '#ece0c8'    // main text / inactive icon
AXM.blood     = '#e05a45'    // HP, danger, bleed
AXM.sulfur    = '#dcb04a'    // mana, selected, active
AXM.rust      = '#c36431'    // friendship, rust accents
AXM.bone      = '#9c937f'    // secondary text, inactive tabs
AXM.ash       = '#46403a'    // borders, disabled
```

All monochrome assets should use `currentColor` internally so they inherit
the `color` prop without needing separate colored variants.

---

## Asset checklist

- [x] `GlyphHeart` — woodcut heart
- [x] `GlyphBody` — woodcut fist
- [ ] `GlyphMind` — woodcut skull — still the hand-coded procedural `<Svg>` in
      `components/StanceGlyph.tsx`; genuinely outstanding (no `mind` entry in
      the icon registry to fall back to). Real gap, left for a future tick —
      not acquired in V8 (closure, not an acquisition phase).
- [x] Effect glyph set (8 icons) — RESOLVED (Phase V1): `EffectGlyph` is a
      thin adapter (`components/EffectGlyph.tsx`) over `AxmIcon`; all 8 kinds
      (`effect-poison/bleed/stun/regen/burn/buff/debuff/shield`) are
      registered curated game-icons.net marks in
      `components/icons/icon-registry.ts`. Checklist was stale — this row
      was never ticked after V1 shipped it.
- [x] Action icon set (9 icons) — RESOLVED (Phase V1): `ActionIcon` is a thin
      adapter (`components/ActionIcon.tsx`) over `AxmIcon`; all 9 kinds
      (`action-sword/shield/arcane/bag/flee/eye/crown/chest/scroll`, plus
      `flame` delegating to `effect-burn`) are registered. Same stale-row
      correction as above.
- [ ] Map node markers (4 states) — still hand-coded procedural `<Svg>` in
      `components/NodeMark.tsx` (completed/locked/current/available); not on
      the icon registry. Real gap, left for a future tick.
- [x] Ink splatter PNGs (3–4 variants) — RESOLVED 2026-08-30 (Phase V7): four
      acquired plates (`assets/images/splatter/`, public domain — Rorschach
      test plates), `<Splatter>` now renders one via `tintColor` instead of
      procedural circles.
- [x] Enemy: Carrion Hierophant (180×200) — RESOLVED 2026-08-31 (Phase V8,
      no-op): `app/(tabs)/combat.tsx` (the file this row named) no longer
      exists. The live combat surface has used acquired portraits
      (`assets/images/enemies/`, `assets/images/portraits/`) since the
      archetype system (`components/event/enemy-art/`) landed; row closed,
      nothing to swap.
- [x] Event: Encounter illustration (full-width × 320) — DELETED 2026-08-31
      (Phase V8): `components/event/EncounterIllustration.tsx` was reachable
      only through `app/event/index.tsx` (a defensive fallback shell nothing
      routes to in production) and, via `EnemyIllustration`'s `generic`-
      archetype fallback, the dev-only `/devart` gallery. `EnemyIllustration`
      now renders `generic` through the same `CreatureScene` + `GenericFigure`
      the live in-combat `EnemyPortrait` HUD avatar already used — one figure
      set for both surfaces instead of two. The pre-archetype placeholder
      scene and its test are torn down.
- [x] Event: Boss illustration (full-width × 360) — DELETED 2026-08-31 (Phase
      V8): `components/event/BossIllustration.tsx` was `EnemyIllustration`'s
      throne fallback for a `tyrant`-archetype foe with `isBoss={false}` —
      reachable only via the same two dead/dev-only paths as the row above,
      and inconsistent with `EnemyPortrait`, which already rendered
      `TyrantFigure` for `tyrant` regardless of `isBoss`. `EnemyIllustration`
      now matches `EnemyPortrait`'s behavior; the throne placeholder scene
      and its test are torn down.
- [x] Character body diagram (88×220) — DELETED 2026-08-31 (Phase V8):
      `BodyDiagram` had zero call sites in the live tree (confirmed by grep;
      an orphan since at least the V1 ground-truth survey, surviving only in
      its own test and the archived `design/handoff-*` mockups). Component
      and test removed.
- [x] Tab bar icon set (5 icons) — RESOLVED (Phase V1): `TabIcon` in
      `app/(tabs)/_layout.tsx` reads `AxmIcon` directly (the verbatim inline
      duplicate V1's brief called out by name is gone). Same stale-row
      correction as above.
- [x] Labyrinth room-scene backdrops (47 rooms) — RESOLVED:
      `assets/images/labyrinth/index.ts` now dresses every room from a
      shared wall/door WebP kit (`walls/`, `doors/`, `ROOM_ART`), and
      `components/labyrinth/RoomScene.tsx` renders the wall as the
      full-bleed backdrop `<Image>` with door images inside the engine-driven
      hotspots. (Was OUT OF SCOPE for Phase V7 — a 47-plate acquisition was
      its own phase-sized effort; it has since landed.)
