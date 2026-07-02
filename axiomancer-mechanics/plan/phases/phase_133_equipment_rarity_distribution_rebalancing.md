# Phase 133 — Equipment Rarity Distribution Rebalancing

## Outcome

Audit and rebalance equipment drop rates, rarity weights, and modifier distributions to create meaningful progression feel and level-appropriate challenge since Phase 54 set items shipped.

## Why

Current equipment rarity weights in `src/Items/item.factory.ts` were established early in development. With the addition of set items (Phase 54) and ongoing balance changes, the progression curve may no longer provide satisfying loot discovery or appropriate power scaling across levels. Players should feel excited about rare/unique drops while maintaining common items as meaningful baseline progression.

## Source spec

No dedicated spec — this is a balance/configuration phase. References existing equipment infrastructure from Specs 05c (Item Rarity) and 05d (Modifier Catalogue), building on the established `dropItem` / `rarityWeightTable` / `MODS_PER_RARITY` systems.

## Implementation units

### Unit 1 — Current state audit

Document the existing rarity distribution and analyze its impact:

1. **Current weights documentation** (`docs/equipment.md` update):
   - Document current `RARITY_WEIGHTS` table: Common 60%, Uncommon 30%, Rare 9%, Unique 1%
   - Document `MODS_PER_RARITY` mapping: Common 0, Uncommon 1, Rare 2, Unique 3
   - Analysis of progression feel across levels 1-50

2. **Drop rate analysis** (`src/Items/item.factory.ts` comments):
   - Add comments explaining the rationale behind current weights
   - Document how rarity interacts with level gating and set items

### Unit 2 — Rebalanced rarity weights

Adjust the core rarity distribution for better progression feel:

1. **Updated `RARITY_WEIGHTS` table** (`src/Items/item.factory.ts`):
   - Rebalance Common/Uncommon/Rare weights for more exciting loot
   - Consider increasing rare drop rate for late-game engagement
   - Maintain unique items as truly special (1% or similar)

2. **Level-based progression** (if needed):
   - Evaluate if level gating needs adjustment
   - Ensure meaningful upgrades available at each progression tier

### Unit 3 — Set item integration review

Audit how Phase 54 set items interact with the rarity system:

1. **Set bonus availability** analysis:
   - Ensure set items appear at appropriate rarity levels
   - Review set completion rates given current drop weights

2. **Balance documentation** (`docs/equipment.md`):
   - Document how set items fit into the progression curve
   - Note any special considerations for set vs. non-set drops

### Unit 4 — Testing and validation

Ensure changes maintain system integrity:

1. **Hermetic tests** (`src/Items/e2e/equipment-rarity-rebalance.engine.test.ts`):
   - Test new rarity distribution produces expected percentages
   - Verify progression feel across representative level bands
   - Test set item interaction with new weights

2. **Existing test updates**:
   - Update any hardcoded rarity expectations in existing tests
   - Ensure `item.factory.engine.test.ts` reflects new weights

## Decisions made upfront — DO NOT ASK

1. **Scope limitation**: Config/balance changes only — no mechanical system rewrites or new rarity tiers.
2. **Progression philosophy**: Rare items should feel exciting and meaningful, but common items must remain viable progression.
3. **Set item precedence**: Phase 54 set items are established content; balance around them rather than changing them.
4. **Testing approach**: Use existing hermetic test patterns rather than creating new test infrastructure.
5. **Documentation target**: Update `docs/equipment.md` rather than creating separate balance docs.

## Verification

```bash
npm run verify     # type-check + lint + tests + build
```

New rarity weights must produce statistically expected distributions in tests.

## Commit body template

```
feat(items): phase 133 — equipment rarity distribution rebalancing

- Rebalance RARITY_WEIGHTS for improved progression feel
- Common: [old]% → [new]%, Uncommon: [old]% → [new]%, Rare: [old]% → [new]%
- Updated docs/equipment.md with rarity philosophy and progression analysis
- Add hermetic tests validating new distribution percentages

Decisions:
- Maintained unique items at ~1% to preserve special status
- Increased rare drop rate for better late-game engagement
- Config-only changes to preserve existing mechanical systems

Since Phase 54 set items, progression needed retuning for meaningful 
loot discovery and level-appropriate challenge scaling.
```

## Definition of Done

- [ ] Current rarity system documented in `docs/equipment.md` with analysis
- [ ] `RARITY_WEIGHTS` table rebalanced in `src/Items/item.factory.ts`
- [ ] Rationale comments added explaining weight choices
- [ ] Set item interaction with new weights documented
- [ ] Hermetic tests verify new distribution produces expected percentages
- [ ] Existing tests updated for any hardcoded rarity expectations
- [ ] Equipment documentation reflects new progression philosophy
- [ ] Verify gate passes with all existing functionality preserved

## Follow-ups (out of scope)

- Player feedback collection on new rarity feel in actual gameplay
- Dynamic rarity weights based on player level or progression milestones
- Additional rarity tiers between rare and unique
- Set item drop rate specialization beyond the general rarity system