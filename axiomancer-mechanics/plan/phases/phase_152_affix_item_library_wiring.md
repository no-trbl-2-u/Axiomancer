# Phase 152 — Affix item library wiring and curated prefixed/suffixed gear

## Outcome

Turn the prefix/suffix affix layer from a side factory into normal item-library truth.

After this phase, equipment instances preserve affix provenance, normal non-common drops can receive prefix/suffix identity through `dropItem`, and the curated equipment library is reduced and rebuilt around fewer base items plus visible prefixed/suffixed variants.

## Source / user decision

T direct steering, 2026-06-17:

1. Add `prefixId`, `suffixId`, `prefixName`, and `suffixName` to equipment output/provenance.
2. Make `dropItemWithAffixes` populate those fields.
3. Add an affix parameter to `dropItem` while preserving its existing `rarity` parameter. Affix rule by rarity:
   - `common`: no prefix/suffix by default.
   - `uncommon`: exactly one affix — prefix **or** suffix.
   - `rare`: both prefix **and** suffix.
   - `unique`: no procedural affixes unless a future phase explicitly changes unique doctrine.
4. Add tests for persistence, name composition, mechanical payload, and unique exclusion.
5. Remove all but 3 of each item first.
6. Then add item-library entries with prefixes and/or suffixes: 5 of each item.
7. Bundle this as one mechanics phase and promote it above all else.

## Decisions made upfront — DO NOT ASK

- Interpret “each item” as each equipment slot/family (`weapon`, `armor`, `head`, `body`, `hands`, `feet`, `accessory`) unless live code exposes a stronger, already-named “item family” taxonomy.
- Trim the base procedural equipment template library to exactly **3 base templates per equipment slot**: early, mid, late. Preserve at least one low-level starter per slot.
- Add exactly **5 curated affixed variants per equipment slot/family** after the trim. These variants must visibly use prefix/suffix naming and must be mechanically backed by real catalogue modifier IDs.
- Do not delete unique items as part of the “3 base templates” trim. Unique items are curated chase items and remain governed by `uniqueTemplates` / `fixedModIds`.
- Do not turn affixed variants into fake static flavor names. Their prefix/suffix metadata must be structured on the `Equipment` instance.
- Keep `dropItem(templateId, playerLevel, rarity?, rng?)` source compatibility if feasible. If adding a parameter risks breaking existing call sites, use an options overload while preserving current call semantics.
- `uncommon` affix choice should be deterministic under the provided RNG and should choose prefix vs suffix through RNG unless a caller option pins it.
- `rare` gets both one prefix and one suffix by default.
- `dropItemWithAffixes` may remain as an explicit helper, but it must share the same core resolver as `dropItem`; do not let two affix systems diverge.
- Mobile-facing public exports must include the new structured fields in emitted types after build.

## Implementation units

1. **Equipment type shape**
   - File: `src/Items/types.ts`
   - Add optional fields to `Equipment`:
     - `prefixId?: string`
     - `suffixId?: string`
     - `prefixName?: string`
     - `suffixName?: string`
   - Update JSDoc so consumers know these are affix provenance, not separate mechanical payload fields.

2. **Affix factory unification**
   - File: `src/Items/item.factory.ts`
   - Preserve existing `rarity` behavior.
   - Add an affix-control parameter/options path to `dropItem`.
   - Default behavior by rarity:
     - common → no affix
     - uncommon → one prefix or suffix
     - rare → prefix + suffix
     - unique → no procedural affix
   - Make `dropItemWithAffixes` populate `prefixId` / `suffixId` / `prefixName` / `suffixName` and delegate to the same underlying construction path.
   - Ensure affix-granted `modIds` still land in `rolledMods` and resolve through `resolveModifiers`.

3. **Library trim and curated affixed items**
   - Files likely involved:
     - `src/Items/equipment.templates.ts`
     - `src/Items/affix.library.ts`
     - any loot/cache/shop tables that reference removed template IDs
   - Reduce regular base templates to exactly 3 per equipment slot/family.
   - Add 5 affixed item entries per slot/family, using structured affix provenance rather than only hand-written names.
   - Keep references coherent: no loot table, enemy drop, preset, dev tool, or test may reference a removed base template ID.

4. **Docs / release surface**
   - Update `docs/equipment.md` or the canonical item/equipment docs to explain:
     - base templates vs affixed variants
     - `dropItem` rarity-affix defaults
     - `prefixName` / `suffixName` consumer contract
     - unique-item exclusion
   - If public exports/types change, update the public-surface fixture according to repo law.

5. **Tests**
   - Extend item/equipment hermetic e2e coverage:
     - `src/Items/e2e/affixes.engine.test.ts`
     - `src/Items/e2e/item.factory.engine.test.ts`
     - catalogue/library coverage as needed
   - Required assertions:
     - uncommon drops carry exactly one of prefix/suffix when affixes are enabled by default.
     - rare drops carry both prefix and suffix.
     - `prefixId`/`suffixId` and `prefixName`/`suffixName` persist on equipment instances.
     - composed names match provenance.
     - affix payload still appears in `rolledMods` and resolved fields.
     - unique drops do not receive procedural affixes.
     - trimmed library has exactly 3 base templates per slot and exactly 5 curated affixed entries per slot/family.
     - removed template IDs have no live references.

## Verification gate

Run, in order:

```bash
npm run type-check
npm test -- --run src/Items/e2e/affixes.engine.test.ts src/Items/e2e/item.factory.engine.test.ts
npm test -- --run
npm run verify
npm run deploy:check
```

If `deploy:check` fails because the public surface changed, decide whether the type change is intended. For this phase, `Equipment` shape expansion is intended; refresh the public-surface fixture and document the change.

## Commit body template

```text
Phase 152 — Affix item library wiring

- add structured prefix/suffix provenance to Equipment
- make dropItem rarity-affix defaults generate normal affixed gear
- keep uniques fixed and non-procedural
- trim base equipment library and add curated affixed variants
- update docs/tests/public surface

Verification:
- npm run type-check
- npm test -- --run src/Items/e2e/affixes.engine.test.ts src/Items/e2e/item.factory.engine.test.ts
- npm test -- --run
- npm run verify
- npm run deploy:check
```

## Definition of Done

- [x] `Equipment` type exposes `prefixId`, `suffixId`, `prefixName`, and `suffixName`.
- [x] `dropItem` can produce affixed items using rarity defaults without callers needing the side factory.
- [x] `dropItemWithAffixes` still works and populates structured provenance.
- [x] Regular base equipment library is reduced to 3 templates per slot/family.
- [x] 5 affixed item entries exist per slot/family.
- [x] All removed template IDs are cleaned from call sites/tests/docs.
- [x] Hermetic e2e tests prove both mechanics and persistence of affixes.
- [x] `npm run verify` and `npm run deploy:check` are green.

## Follow-ups out of scope

- Mobile UI rendering of item diff/equipped-change surfaces. That is Mobile Phase 133.
- Unique-item procedural affixes.
- Loot-rate balance changes beyond whatever is necessary to keep the trimmed/affixed library coherent.
- Storefront/economy pricing redesign.
