# axiomancer-mechanics: 0.21.0 → 0.22.0 upgrade guide for mobile

> Status: **published**. npm registry confirms `axiomancer-mechanics@0.22.0`.
> Phase 134 is the mobile catch-up phase for this release.

---

## TL;DR

- Bump `axiomancer-mechanics` from `^0.21.0` to `^0.22.0`.
- This is an **affix release**. Regular equipment drops now carry
  structured prefix/suffix provenance, and the equipment library is
  trimmed into a smaller base set plus curated affixed variants.
- Mobile must **read** structured affix fields (`prefixName`,
  `suffixName`, `prefixId`, `suffixId`) directly. It must **never** parse
  affix truth out of `item.name`, and must **never** simulate affixes
  locally.
- The package bump also broadens the encounter seed type to
  `SeedInput = string | number`; mobile view-models that surfaced a
  numeric session seed widen to `SeedInput`.

---

## Release contents mobile must account for

## 1. Structured affix provenance on `Equipment`

**Mechanics change:** runtime `Equipment` now carries four optional
fields so consumers can render affixes without parsing display names:

- `prefixId?: string`
- `suffixId?: string`
- `prefixName?: string`
- `suffixName?: string`

`EquipmentTemplate` also carries optional `prefixId` / `suffixId`.

**Mobile action:**

- Read `prefixName` / `suffixName` (and the structured IDs) directly when
  surfacing affix labels. The Phase 133 equip-change delta surface
  (`state/presenters/equipDelta.ts::keywordEntries`) already reads these
  fields structurally — it now lights up automatically on affixed drops.
- Omit the labels gracefully when the fields are absent (common/unique
  drops, and legacy saves authored before 0.22.0).
- Never parse prefixes/suffixes out of `item.name`.

## 2. `dropItem` rarity affix defaults

**Mechanics change:** `dropItem` now applies affixes by rarity:

- `common` — no affix.
- `uncommon` — exactly one prefix or suffix.
- `rare` — both prefix and suffix.
- `unique` — fixed / non-procedural (no rolled affixes).

`dropItemWithAffixes` is unified with `dropItem`; both paths share the
same affix construction and fold mechanical payload into `rolledMods` /
resolved stats, passives, procs, and resource interactions. Both
`dropItem` and `dropItemWithAffixes` are exported at the package root.

**Mobile action:**

- The loot-cache roller (`state/cache/loot-table.ts`) already consumes
  engine `dropItem` truth — affixed uncommon/rare drops now arrive by
  default, no mobile change required.
- Where a fixture asserted a plain uncommon/rare name from `dropItem`,
  update the expectation to the new affixed truth (assert the structured
  affix fields, not the composed name) rather than disabling affixes
  locally.
- Seed-coupled fixtures may shift because the trimmed library + affix
  rolling change the RNG stream. Refresh the seed/expectation to engine
  truth; do not pin the old library shape.

## 3. Trimmed equipment library + affix factory exports

**Mechanics change:** each slot/family keeps three base templates and
gains five curated affixed variants, backed by the modifier catalogue.
New affix helpers are exposed at the package root: `prefixes`,
`suffixes`, `allAffixes`, `getAffixById`, `composeItemName`,
`affixesForSlot`, `AFFIX_RARITY_WEIGHTS`.

**Mobile action:**

- Dev "add item by id" (`state/dev/item-by-id.ts`) and "populate all"
  (`actions.populateAllItems`) resolve IDs dynamically against the engine
  registries and already surface a graceful failure for unknown IDs, so
  removed/renamed template IDs from the trim degrade safely.
- Do not hardcode template IDs or library counts in mobile fixtures.

## 4. `SeedInput` widening

**Mechanics change:** the encounter seed type is `SeedInput =
string | number`. Gathering / Hazard session `seed` fields are typed
`SeedInput`.

**Mobile action:**

- The Gathering and Hazard view-models widen `sessionSeed` from `number`
  to `SeedInput`; the screens widen the `introAckSeed` state likewise.
  The seed is used only as an intro-ack identity token, so equality
  comparison is unaffected by the widening.

---

## Required verification for Phase 134

```bash
npm ls axiomancer-mechanics --depth=0
npm run typecheck
npm test -- --runInBand state/e2e/inventory.engine.test.ts state/cache/__tests__/loot-table.test.ts state/e2e/cache.loot-table.engine.test.ts
npm run verify
```

If `verify:visual` is still blocked by the pre-existing Metro/Node
`configs.toReversed` config-load error, report it exactly and do not
confuse it with the package bump.

---

## Out of scope

- Equip/swap delta UI (shipped in Phase 133; re-verified here).
- Mechanics changes.
- Visual redesign of inventory cards.
- Store deploy / EAS preview build.
