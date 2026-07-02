# Phase 134 — Mechanics 0.22.0 mobile catch-up

## Outcome

Bump mobile to `axiomancer-mechanics@0.22.0` and drain the integration fallout from the affix release, including re-verifying the already-shipped inventory delta UI against the new structured affix fields.

This phase exists because mechanics 0.22.0 changes the equipment/item public surface: equipment can now carry structured affix provenance and `dropItem` can yield affixed uncommon/rare gear by default.

## Source / user decision

T direct steering, 2026-06-17 after mechanics 0.22.0 was published:

> create a phase for mobile to account for the package bump

## Mechanics package truth

Published package:

- `axiomancer-mechanics@0.22.0`
- npm `latest`: `0.22.0`
- GitHub release: `https://github.com/no-trbl-2-u/axiomancer-mechanics/releases/tag/v0.22.0`

Relevant mechanics changes:

- `Equipment` exposes optional affix provenance fields:
  - `prefixId?: string`
  - `suffixId?: string`
  - `prefixName?: string`
  - `suffixName?: string`
- `dropItem` now applies rarity-affix defaults:
  - `common`: no affix
  - `uncommon`: one prefix or suffix
  - `rare`: prefix + suffix
  - `unique`: fixed/non-procedural
- Equipment library is trimmed to three base templates per slot/family plus five curated affixed variants per slot/family.
- Public surface includes the affix factory/export changes.

## Decisions made upfront — DO NOT ASK

- Do not simulate affixes locally.
- Do not parse prefix/suffix truth from `item.name`.
- Use `prefixName` / `suffixName` and structured IDs where available.
- Preserve canon terms: `VITAE` and `STANCE`; no `HEALTH` / `GUARD` regressions.
- This phase is package bump + integration catch-up only. The richer equip/swap delta UI shipped in Phase 133 and should be re-verified against 0.22.0 truth.
- If a mobile test expects plain uncommon/rare equipment from `dropItem`, update the expectation to the new mechanics truth rather than disabling affixes locally.

## Implementation units

1. **Package bump**
   - Update `package.json` and lockfile to `axiomancer-mechanics@0.22.0`.
   - Confirm with `npm ls axiomancer-mechanics --depth=0`.

2. **Type/import drift**
   - Run typecheck after install.
   - Fix any compile errors from new/changed item exports or equipment shape.
   - Prefer top-level mechanics imports where already established by mobile conventions.

3. **Presenter and fixture catch-up**
   - Audit inventory/cache/dev-item surfaces that inspect equipment names, modifiers, or templates.
   - Ensure affixed drops render without crashing.
   - Ensure any curated dev item by id flow still handles removed/renamed template IDs from the trimmed mechanics library.
   - Where fixtures assert exact equipment names or template counts, update them to 0.22.0 truth.

4. **Docs**
   - Add `docs/engine-upgrade-0.21.0-to-0.22.0.md` summarising:
     - package bump
     - new affix fields
     - `dropItem` rarity behavior
     - mobile rule: consume structured affix fields, never parse names
     - follow-up Phase 134 equip-change delta surface

5. **Tests**
   - Add/extend focused tests proving mobile can consume an affixed equipment item with `prefixName` / `suffixName` present.
   - Add regression coverage for absent affix fields if any presenter sees legacy saved equipment.

## Verification gate

Run:

```bash
npm ls axiomancer-mechanics --depth=0
npm run typecheck
npm test -- --runInBand state/e2e/inventory.engine.test.ts state/cache/__tests__/loot-table.test.ts state/e2e/cache.loot-table.engine.test.ts
npm run verify
```

If `verify:visual` is still blocked by the pre-existing Metro/Node `configs.toReversed` config-load error, report it exactly and do not confuse it with the package bump.

## Definition of Done

- Mobile installs `axiomancer-mechanics@0.22.0`.
- Typecheck and verify are green.
- Inventory/cache/dev item surfaces tolerate affixed equipment.
- Tests cover structured affix fields and legacy absence.
- Upgrade doc exists.
- Build-plan row is ticked in the shipping commit.

## Follow-ups out of scope

- Equip/swap delta UI. That is Phase 134.
- Mechanics changes.
- Visual redesign of inventory cards.
- Store deploy / EAS preview build.
