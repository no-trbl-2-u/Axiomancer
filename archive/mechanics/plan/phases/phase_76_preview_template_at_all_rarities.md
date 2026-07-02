# Phase 76 — `previewTemplateAtAllRarities` batch helper

> Phase 75 follow-up named in that brief's Follow-ups section.
> Convenience wrapper around `previewTemplateAtRarity` for mobile
> item-detail / tooltip views that render every-rarity-for-this-template
> comparison strips in a single call.

## Outcome

New `previewTemplateAtAllRarities(templateId, playerLevel, rng?): Record<ItemRarity, Equipment | undefined>`
helper on `src/Items/item.factory.ts`. Re-exported through `src/Items/index.ts`
+ top-level barrel. Hermetic e2e extended at
`src/Items/e2e/preview-template.engine.test.ts`. Public surface
gains +1 runtime export; fixture 236 → 237.

## Implementation units

### Unit 1 — Engine helper + e2e

**Files touched:**
- `src/Items/item.factory.ts` — append `previewTemplateAtAllRarities`
  after `previewTemplateAtRarity`. Calls the single-cell helper
  four times (one per `ItemRarity` value) and zips into a record.
- `src/Items/index.ts` — re-export.
- `src/index.ts` — re-export from Items block.
- `scripts/public-surface.expected.json` — regenerate (236 → 237).
- `src/Items/e2e/preview-template.engine.test.ts` — append 3 cases
  per D2.

**Implementation sketch:**

```typescript
export function previewTemplateAtAllRarities(
    templateId: string,
    playerLevel: number,
    rng: () => number = () => 0.5,
): Record<ItemRarity, Equipment | undefined> {
    return {
        common:   previewTemplateAtRarity(templateId, 'common',   playerLevel, rng),
        uncommon: previewTemplateAtRarity(templateId, 'uncommon', playerLevel, rng),
        rare:     previewTemplateAtRarity(templateId, 'rare',     playerLevel, rng),
        unique:   previewTemplateAtRarity(templateId, 'unique',   playerLevel, rng),
    };
}
```

### Unit 2 — Docs + CHANGELOG

- `docs/items.md` Modifier-catalogue "Previewing rolled mods"
  subsection — extend with the batch helper alongside the
  single-cell helper.
- `docs/api.md` Items block — append the batch helper alongside
  the Phase 75 single-cell row.
- `README.md` Items row — append Phase 76 surface phrasing.
- `plan/bearings.md` Items block — append a Phase 76 sibling line
  to the Phase 75 fold-in.
- `CHANGELOG.md [unreleased] ### Added` — Phase 76 bullet.

## Decisions made upfront — DO NOT ASK

- **D1 — Default `rng = () => 0.5`.** Same shape as Phase 75
  (Phase 70 deterministic-drop pattern). Each rarity-cell uses
  the same rng; identical seed produces stable mod values across
  the rarity strip.

- **D2 — 3 hermetic cases.** (1) Happy path — returns all-4-rarity
  record per template with rolled mods matching tier; (2)
  level-too-low — yields all-undefined record (every rarity fails
  the requiredLevel check); (3) unique template — returns only
  `unique` populated, the other three cells undefined (per Phase
  75 D1 soft-error on rarity='non-unique' for unique-only
  templates).

- **D3 — Returns `Record<ItemRarity, Equipment | undefined>`, not
  a sparse map / not an array.** Full record shape lets the
  consumer index by rarity name directly + signals "this slot
  intentionally exists; undefined = unavailable" cleanly.

- **D4 — No new types exported.** Helper signature uses existing
  `ItemRarity` + `Equipment`. +1 runtime export; +0 type exports.
  Fixture 236 → 237 (runtime); 167 (types unchanged).

- **D5 — Two commits.** Unit 1 ships engine + e2e + barrels +
  fixture. Unit 2 ships docs + CHANGELOG. Plan flip = 3rd commit.

## Verify gate

- `npm run type-check` / `npm test` / `npm run build` /
  `npm run deploy:check` — all green expected.
- Test count: 704 → 707 (+3 new cases per D2).

## Definition of Done

- [ ] `previewTemplateAtAllRarities` ships + re-exports.
- [ ] Fixture refreshed (236 → 237).
- [ ] 3 new hermetic cases in
      `src/Items/e2e/preview-template.engine.test.ts`.
- [ ] `docs/items.md` / `docs/api.md` / `README.md` /
      `plan/bearings.md` / `CHANGELOG.md` extended.
- [ ] Phase 76 row flipped `[ ]` → `[x]`.

## Canonical sibling

Phase 75 (`plan/phases/phase_75_preview_template_at_rarity.md`)
is the direct ancestor; helper is a thin wrapper around its
primitive.
