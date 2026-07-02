# Phase 75 — `previewTemplateAtRarity` helper

> Closes the user-jot from `b5c8165` refined at oversight-15
> `077979e`. Mobile item-library view shows zero modifiers per
> entry because `equipmentTemplates` carries only
> `baseStatModifiers` by design; rolled mods only exist on runtime
> `Equipment` instances from `dropItem`. This phase adds the
> typed preview surface.

## Outcome

New `previewTemplateAtRarity(templateId: string, rarity: ItemRarity, playerLevel: number, rng?: () => number): Equipment | undefined`
helper on `src/Items/item.factory.ts`, re-exported through
`src/Items/index.ts` + the top-level barrel. Mobile UI can render
`equipmentTemplates × ItemRarity` cells with rolled mods visible
per cell. Hermetic e2e at
`src/Items/e2e/preview-template.engine.test.ts`. Public surface
gains +1 runtime export (`previewTemplateAtRarity`); fixture
235 → 236.

## Source spec / candidate

`plan/PHASE_CANDIDATES.md` Promoted, Phase 75 row — promoted at
oversight-17 2026-05-23 (commit `8c9716d`). User-jot origin at
`b5c8165` ("modifiers not implemented; can we fast-track those?")
verified at oversight-15: modifiers ARE implemented (Spec 05d
pre-loop), but `equipmentTemplates` is the wrong abstraction for
mobile to consume — templates carry only `baseStatModifiers` by
design; rolled mods only exist on runtime `Equipment` from
`dropItem`. The helper closes that boundary cleanly.

## Implementation units

### Unit 1 — Engine helper + hermetic e2e

**Files touched:**
- `src/Items/item.factory.ts` — append `previewTemplateAtRarity`
  function after `dropItem`. Reuses `dropItem` internally with
  `rng` + `rarity` pinned + soft-error semantics (returns
  `undefined` instead of throwing per D1 — UI-tier safety).
- `src/Items/index.ts` — re-export `previewTemplateAtRarity` from
  the `./item.factory` block (alongside `dropItem`).
- `src/index.ts` — re-export `previewTemplateAtRarity` from the
  Items section.
- `scripts/public-surface.expected.json` — regenerate (+1 runtime
  export; 235 → 236; types unchanged at 167).
- `src/Items/e2e/preview-template.engine.test.ts` — new hermetic
  e2e file (5 cases per D3).

**Implementation sketch:**

```typescript
// src/Items/item.factory.ts (appended after dropItem)

/**
 * Phase 75 — preview what a template's runtime `Equipment` instance
 * would look like if rolled at the specified rarity for the
 * specified player level (closes the user-jot at b5c8165 / mobile
 * item-library mod-visibility).
 *
 * Mobile UI (and any future inventory-detail / loot-preview /
 * vendor-stock surface) consumes the export'd `equipmentTemplates`
 * but templates by-design carry only `baseStatModifiers` — rolled
 * mods only exist on runtime `Equipment` from `dropItem`. This
 * helper wraps `dropItem` with the rng + rarity pinned so the UI
 * can render every (template, rarity, playerLevel) cell with rolled
 * mods visible.
 *
 * Default `rng` is `() => 0.5` so previews are deterministic per
 * (template, rarity, playerLevel) tuple — same shape as the Phase 70
 * Coastal Tyrant deterministic-drop pattern. Pass a custom rng for
 * randomised previews.
 *
 * Returns `undefined` instead of throwing for any failure mode (UI-
 * tier safety per D1):
 * - unknown `templateId`
 * - `playerLevel < template.requiredLevel`
 * - `rarity === 'unique'` against a non-unique template
 *
 * @see {@link dropItem} for the runtime drop entry point.
 */
export function previewTemplateAtRarity(
    templateId: string,
    rarity: ItemRarity,
    playerLevel: number,
    rng: () => number = () => 0.5,
): Equipment | undefined {
    const template = getEquipmentTemplate(templateId) ?? getUniqueTemplate(templateId);
    if (!template) return undefined;
    if (playerLevel < template.requiredLevel) return undefined;

    const isUniqueTpl = isUnique(template);
    if (rarity === 'unique' && !isUniqueTpl) return undefined;
    // Unique templates always force rarity to 'unique' (Spec 05c §9);
    // soft-coerce here so callers can pass 'rare' against a unique
    // template and still get a sensible preview.
    const finalRarity: ItemRarity = isUniqueTpl ? 'unique' : rarity;

    return dropItem(templateId, playerLevel, finalRarity, rng);
}
```

**Hermetic e2e shape** (5 cases per D3):

```typescript
// src/Items/e2e/preview-template.engine.test.ts

import { describe, it, expect } from 'vitest';
import {
    previewTemplateAtRarity,
    equipmentTemplates,
    uniqueTemplates,
} from '../index';

describe('Phase 75 — previewTemplateAtRarity', () => {
    it('returns Equipment with rolled modifiers matching the rarity tier', () => {
        // common = 0 mods; uncommon = 1; rare = 2; unique-on-unique-template = 3 fixed
        const common = previewTemplateAtRarity('iron-blade', 'common', 5);
        const uncommon = previewTemplateAtRarity('iron-blade', 'uncommon', 5);
        const rare = previewTemplateAtRarity('iron-blade', 'rare', 5);
        expect(common!.rolledMods ?? []).toHaveLength(0);
        expect(uncommon!.rolledMods).toHaveLength(1);
        expect(rare!.rolledMods).toHaveLength(2);
    });

    it('is deterministic per (template, rarity, playerLevel) with the default rng', () => {
        const a = previewTemplateAtRarity('iron-blade', 'uncommon', 5);
        const b = previewTemplateAtRarity('iron-blade', 'uncommon', 5);
        expect(a).toEqual(b);
    });

    it('returns undefined for unknown templateId (UI-tier safety per D1)', () => {
        expect(previewTemplateAtRarity('no-such-thing', 'common', 1)).toBeUndefined();
    });

    it('returns undefined when playerLevel < template.requiredLevel', () => {
        // mithril-blade is requiredLevel 20; preview at level 5 returns undefined
        expect(previewTemplateAtRarity('mithril-blade', 'rare', 5)).toBeUndefined();
    });

    it('returns undefined for rarity="unique" against a regular template', () => {
        expect(previewTemplateAtRarity('iron-blade', 'unique', 5)).toBeUndefined();
    });
});
```

### Unit 2 — Docs + CHANGELOG

**Files touched:**
- `docs/items.md` Modifier-catalogue section — gain a "Previewing
  rolled mods (library / catalog views)" subsection naming the
  helper + deterministic-preview convention + UI-tier soft-error
  semantics.
- `docs/api.md` Items block — append `previewTemplateAtRarity`
  alongside `dropItem` / `rollModifiers` / `resolveModifiers`.
- `README.md` Items row — append the Phase 75 surface phrasing.
- `plan/bearings.md` — no entry needed (Items module already
  enumerated; the helper is a leaf addition).
- `CHANGELOG.md [unreleased] ### Added` — Phase 75 bullet.

## Decisions made upfront — DO NOT ASK

- **D1 — Soft errors (return `undefined`), not throws.** `dropItem`
  throws on unknown templateId / level-too-low / unique-rarity-
  abuse because it's the runtime drop entry point and authoring
  errors should fail loud. `previewTemplateAtRarity` is the
  consumer-tier read surface — UI code looping through every
  template × rarity would have to wrap every call in try/catch
  otherwise. Returning `undefined` lets the UI render an empty
  cell + move on. This matches the existing
  `getEquipmentTemplate(...): EquipmentTemplate | undefined`
  lookup-style convention.

- **D2 — Default rng = `() => 0.5`.** Phase 70 Coastal Tyrant
  established the deterministic-drop pattern (`() => 0.5`); same
  reasoning here. Mobile UI rendering the same (template, rarity,
  level) cell across re-renders gets the same mod values — no
  flicker, no per-render variance. Consumers wanting randomised
  previews can pass their own rng.

- **D3 — 5 hermetic cases.** Cover the happy path (returns
  Equipment with rolled mods matching rarity tier), the
  determinism contract (two calls return identical Equipment), and
  the three soft-error paths (unknown templateId / level-too-low /
  unique-rarity-on-regular-template). Skip the "passes through to
  dropItem" white-box pin since the integration through dropItem's
  own e2e covers that.

- **D4 — Unique templates: soft-coerce rarity.** If a caller passes
  `previewTemplateAtRarity('paradox-loop', 'rare', 15)` against
  the unique Paradox Loop, the helper should return the
  unique-rolled Equipment (not undefined) — caller may not know
  the template is unique; the preview should still be useful.
  Match `dropItem`'s `isUniqueTpl ? 'unique' : rarity` coercion.

- **D5 — No public-API change to `dropItem`.** dropItem stays
  exactly as-is (throws on errors; required for the runtime path).
  previewTemplateAtRarity is a sibling, not a wrapper that
  shadows.

- **D6 — Returns full `Equipment`, not just `RolledModifier[]`.**
  Two alternative shapes were named in the candidate: (a)
  `previewTemplateAtRarity → Equipment | undefined` vs (b)
  `getTemplatePreviewModifiers → RolledModifier[]`. Brief picks
  (a) because mobile already consumes the Equipment shape (UI
  reads `Equipment.statModifiers`, `Equipment.rolledMods`,
  `Equipment.passiveEffects` etc.); returning the full Equipment
  spares UI code from re-composing the merged shape. Shape (b)
  is more composable but pushes more work to the consumer.

- **D7 — No new types exported.** Helper signature uses existing
  types (`ItemRarity`, `Equipment`). +1 runtime export, +0 type
  exports. Fixture goes 235 → 236; types stay at 167.

- **D8 — Two commits (1 + 2 of the candidate). Unit 1 ships engine
  helper + e2e; Unit 2 ships docs + CHANGELOG. Plan flip is the
  3rd commit.**

## Verify gate

- `npm run type-check` — must pass.
- `npm test` — must pass; new e2e adds 5 cases. Expected: 699 → 704.
- `npm run build` — must pass.
- `npm run deploy:check` — must pass; fixture refresh +1 runtime
  export (235 → 236).

## Commit body templates

### Unit 1

```
feat(items): Phase 75 unit 1 — previewTemplateAtRarity helper + hermetic e2e

- New previewTemplateAtRarity(templateId, rarity, playerLevel,
  rng?): Equipment | undefined helper in src/Items/item.factory.ts.
  Reuses dropItem internally with rng + rarity pinned + soft-
  error semantics (returns undefined instead of throwing per D1
  — UI-tier safety). Default rng = () => 0.5 per Phase 70
  deterministic-drop pattern (D2). Unique templates soft-coerce
  rarity to 'unique' per D4.
- Re-exported through src/Items/index.ts + top-level barrel.
- src/Items/e2e/preview-template.engine.test.ts — 5 cases per D3
  (returns Equipment with rolled-mod count matching rarity tier;
  determinism per default rng; undefined for unknown templateId;
  undefined for level-too-low; undefined for unique-rarity on
  regular template).
- Fixture refreshed 235 → 236 runtime exports (types unchanged
  at 167).

Decisions:
- D1 — soft errors (UI-tier safety) vs dropItem's authoring-error
  throws.
- D2 — default rng = () => 0.5 (deterministic per cell).
- D6 — returns full Equipment (matches mobile's existing shape).

Closes the user-jot at b5c8165 refined at oversight-15 077979e.
```

### Unit 2

```
docs(items): Phase 75 unit 2 — docs + CHANGELOG for previewTemplateAtRarity

- docs/items.md Modifier-catalogue section gains a "Previewing
  rolled mods (library / catalog views)" subsection naming the
  helper + deterministic-preview convention + soft-error
  semantics.
- docs/api.md Items block — previewTemplateAtRarity appended
  alongside dropItem / rollModifiers / resolveModifiers.
- README.md Items row — Phase 75 surface phrasing appended.
- CHANGELOG.md [unreleased] ### Added — Phase 75 bullet.

704/704 tests stay green; pure docs change.
```

## Definition of Done

- [ ] `previewTemplateAtRarity` ships in `src/Items/item.factory.ts`.
- [ ] Re-exported through `src/Items/index.ts` + `src/index.ts`.
- [ ] `scripts/public-surface.expected.json` refreshed (+1
      runtime; types unchanged).
- [ ] `src/Items/e2e/preview-template.engine.test.ts` ships with
      5 hermetic cases.
- [ ] `docs/items.md` "Previewing rolled mods" subsection.
- [ ] `docs/api.md` Items block extended.
- [ ] `README.md` Items row extended.
- [ ] `CHANGELOG.md [unreleased] ### Added` Phase 75 bullet.
- [ ] `npm run verify` green (704/704 expected).
- [ ] `npm run deploy:check` green.
- [ ] `plan/steps/01_build_plan.md` Phase 75 row flips `[ ]` → `[x]`.

## Follow-ups (out of scope)

- **Mobile callsite cleanup.** mobile-repo concern; ships post-
  engine-release. Mobile UI replaces its zero-mod render with
  `equipmentTemplates.flatMap(tpl => itemRarities.map(r =>
  previewTemplateAtRarity(tpl.id, r, playerLevel)))` for the item-
  library matrix view.
- **`previewTemplateAtAllRarities(templateId, playerLevel)` batch
  helper.** Convenience wrapper that returns
  `Record<ItemRarity, Equipment | undefined>` for a single
  template. Defer if UI churn drives it.
- **Per-mod-value preview (lower / mid / upper).** Today the
  default rng pins one mid-tier value (0.5); a future helper
  could return the lower-band + upper-band values too. Defer.

## Canonical sibling

`src/Items/item.factory.ts` — `dropItem` is the sibling and the
implementation reference. The helper is intentionally a thin
wrapper around dropItem; the only semantic difference is the
soft-error vs throw posture (D1).
