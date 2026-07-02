---
name: swap-asset-placeholder
description: Swap a placeholder SVG/image asset in the Axiomancer Mobile codebase for a real generated or hand-authored asset, wire it into its component, write a hermetic test, tick the asset checklist, and prepare an atomic commit. Use when the user (or another agent) mentions creating, generating, swapping, replacing, or wiring an icon, glyph, illustration, SVG, PNG, or visual asset; when working on items in SVG_ASSET_SPEC.md; or when keywords like "placeholder", "woodcut", "stance glyph", "effect glyph", "action icon", "tab icon", "enemy art", "splatter", or "event illustration" appear.
---

# Swap a placeholder asset (vector or raster)

The canonical, end-to-end workflow for swapping any placeholder visual
asset for a real one in this repo. Lands the asset, its provenance,
the wiring, a hermetic test, and a checklist tick — atomically.

**Reference implementation:** `GlyphHeart` (§1) — see
`assets/images/heart.svg`, `assets/images/heart.provenance.json`,
`components/StanceGlyph.tsx`, `components/StanceGlyph.test.tsx`.

## Workflow checklist

Copy this into your todos and tick as you go:

```
- [ ] Step 0: Pick target from SVG_ASSET_SPEC.md
- [ ] Step 1: Classify (vector vs raster)
- [ ] Step 2: Guard against overwriting a hand-authored asset
- [ ] Step 3: Generate the asset
- [ ] Step 4: Write the provenance sidecar
- [ ] Step 5: Wire the asset into its component
- [ ] Step 6: Hermetic test + npx tsc + npm test (twice)
- [ ] Step 7: Tick the checklist; offer the atomic commit
```

## Step 0 — Pick the target

Read `SVG_ASSET_SPEC.md`. Find the **first** unchecked item under
"Asset checklist" (a `- [ ]` line). That is the target. Do not touch
already-checked items or anything not on the checklist (e.g.
`components/XpChain.tsx` is intentionally out of scope).

Print a one-line plan before starting:

```
Asset: <name> | Type: <vector|raster> | Source file: <file> | Spec section: <§N>
```

## Step 1 — Classify

| Track | Spec sections | Output |
|---|---|---|
| **Vector** (3A) | §1 Stance Glyphs, §2 Effect Glyphs, §3 Action Icons, §4 Map Node Markers, §10 Tab Bar Icons | hand-written SVG XML using `currentColor` |
| **Raster** (3B) | §5 Ink Splatter, §6 Enemy Illustration, §7 Event Illustrations, §8 Character Body Diagram | PNG via `GenerateImage` or an image-gen MCP |

## Step 2 — Guard: never overwrite a hand-authored asset

Before writing anything, check the target path
(`assets/images/<kebab-name>.{svg,png}`):

- File exists **and** has a sibling `.provenance.json` → AI-generated; OK to regenerate.
- File exists with **no** provenance sidecar → **hand-authored**. Refuse:

  ```
  REFUSE: <path> is hand-authored. No changes made.
  ```

  Stop. Do not proceed.

## Step 3 — Generate

### 3A · Vector path (icons / glyphs / tab icons)

Write SVG XML directly. **Do not** call an image generator.

Requirements:

- Single- or minimal-path **woodcut silhouette**. No gradients, no
  embedded raster, no `filter` / `foreignObject`.
- Every `fill` and `stroke` is `currentColor` — never a hardcoded hex.
- ViewBox matches the spec contract (typically `0 0 64 64`).
- Confirm `react-native-svg` (see `package.json`) supports every
  attribute you use. `fill-rule="evenodd"` works; `mask` may not.

Save the raw SVG at `assets/images/<kebab-name>.svg` as the source
artifact. **Mirror the same XML inline as a top-level constant in the
component file** — Metro is not currently configured with an
SVG-as-string transformer, so do **not** `require('@/assets/images/x.svg')`
expecting a string.

Wire pattern (mirrors `components/StanceGlyph.tsx`):

```tsx
import { SvgXml } from 'react-native-svg';

const heartXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">…</svg>`;

export function GlyphHeart({ size = 40, color = AXM.parchment }: GlyphProps) {
  return <SvgXml xml={heartXml} width={size} height={size} color={color} />;
}
```

### 3B · Raster path (illustrations / splatter)

Requires an image-generation tool. Confirm one is available:

1. (preferred) An image-gen MCP configured in workspace MCP settings
   (e.g., fal.ai, Replicate, Stability AI).
2. (fallback) Cursor's built-in `GenerateImage` tool.

If neither is available, stop:

```
BLOCKED: No image-generation tool available. Add an image-gen MCP to .cursor/mcp.json and re-run.
```

Prompt template:

```
High-contrast woodcut ink illustration on transparent background.
<subject from spec>. Mörk Borg aesthetic: pitch black lines, no color,
heavy cross-hatching, rough edges. <W>×<H> px.
```

Save at `assets/images/<kebab-name>.png` at 2× resolution. If the spec
lists multiple variants (e.g., §5 splatter wants 3–4), generate each.

## Step 4 — Provenance sidecar (always)

Always write `assets/images/<kebab-name>.provenance.json`:

```json
{
  "generated_by": "cursor-agent",
  "date": "<YYYY-MM-DD>",
  "tool": "<GenerateImage | <mcp-server-name> | hand-written-svg>",
  "prompt": "<exact prompt used, or 'hand-written SVG' for 3A>",
  "spec_section": "<§N>",
  "target_dimensions": "<W>x<H>",
  "source_file": "<component file where it is wired>"
}
```

The Step 2 guard checks for this sidecar. **Never skip it.**

## Step 5 — Wire the asset

Follow the exact swap pattern in `SVG_ASSET_SPEC.md` §N for the target.

- The placeholder `<Svg …>` block must be **fully removed** (or, for
  vectors, replaced with a single `<SvgXml />` call).
- Component public API (props interface) is unchanged.
- No hardcoded hex colors — use `AXM` palette tokens (`theme/axm.ts`).
- No new `Math.random()` calls in screens — RNG goes through the
  engine.
- No reformatting of unrelated lines.

## Step 6 — Hermetic test (REQUIRED)

Per `.cursorrules`, `.cursor/rules/hermetic-e2e-testing.mdc`, and
`docs/testing.md`, every implementation lands with at least one
hermetic test.

**Component-render tests** live at `components/<Component>.test.tsx`,
rendered via `@testing-library/react-native`. Cover:

- Renders at the smallest **and** largest sizes from the spec contract.
- Forwards a custom `color` to the rendered tree (verifies
  `currentColor` inheritance).
- Asserts no hardcoded `#000` / `#fff` / off-palette hex leaks through.
- Dispatcher routing if the component is a kind-switch (e.g.
  `StanceGlyph kind="heart" | "body" | "mind"`).
- No-regression smoke for sibling exports the swap did **not** touch.

**Reference:** `components/StanceGlyph.test.tsx`.

For pure presenter / engine work, the test goes at
`app/<route>/e2e/<feature>.engine.test.ts`. Reference:
`app/(tabs)/combat/e2e/combat-hud.engine.test.ts`.

### Verify (stop on first failure)

1. `npx tsc --noEmit` — clean.
2. `npm test` — green.
3. `npm test` again — green twice in a row (no flakes).

If a snapshot changes, update it **only** if the change is intentional
(placeholder gone, real asset in). Print which snapshots changed.

## Step 7 — Tick the checklist + offer the commit

Update `SVG_ASSET_SPEC.md`: change the target line from `- [ ]` to
`- [x]`.

**Do not commit without explicit user permission** (workspace policy).
When asked to commit, stage **exactly** these files and nothing else:

- `assets/images/<kebab-name>.<ext>` (the asset)
- `assets/images/<kebab-name>.provenance.json` (provenance)
- The modified component file(s) (the wiring)
- The new or updated test file(s)
- `SVG_ASSET_SPEC.md` (checklist tick)

Commit message format (no emojis, no `Co-Authored-By`):

```
feat(assets): swap <asset-name> placeholder for generated <vector|png>

Replaces the inline SVG in <SourceFile> with <asset-path>.
Spec: SVG_ASSET_SPEC.md §N. Provenance: assets/images/<name>.provenance.json.
```

## Hard rules (non-negotiable)

- Never overwrite a hand-authored asset (Step 2 guard).
- Never upload assets to external services. Assets land in
  `assets/images/`, served by Metro.
- No `Math.random()` added to screens. No hardcoded hex outside
  `theme/axm.ts`.
- Atomic commit: asset + provenance + wiring + tests + checklist tick
  — all in one commit, nothing else.
- If any step blocks unrecoverably, print `BLOCKED: <reason>` and stop.
  Never commit partial work.
