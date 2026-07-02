# Rarity, Modifiers, and Set Items — 2026-05-12

## Surface question
How should specs 05c, 05d, and 05e define rarity tiers, a modifier system, and
set items on top of the existing equipment engine (specs 05 and 05b)?

## Better question surfaced
Specs 05 and 05b built a 50-item named library on a `tier: 1|2|3` axis.
The real design problem is: **how do we layer a PoE2-style rarity + modifier
system without creating a 4×3 item matrix that's impossible to balance, while
keeping the existing `statModifiers`/`passiveEffects`/`resourceInteraction`
pipeline unchanged?**

## Prior art consulted

- **Path of Exile 2 — Base Item + Affix System:** Normal/Magic/Rare items are
  all instances of the same base type; rarity gates mod count; mods have an
  item level requirement and a drop weight invisible to the player. Universally
  praised for build depth; common criticism is that bad rolls "brick" items with
  no crafting recourse, and PoE2 intentionally cut max mod count vs PoE1 to
  address this.
- **Diablo II — Unique Items with Rolled Ranges:** Each Unique has fixed affix
  types but values roll within a `[min, max]` range at drop. "Perfect" Shako or
  Grandfather became community chase targets for years. The fixed-mod /
  variable-value model created enduring item identity without endless permutations.
- **Diablo III — Legendary Items + Hidden Affix Weight:** Legendaries have named
  unique affixes alongside invisible common-pool affixes with hidden weights.
  Players praised build-defining identities; criticized that heavy weight bias on a
  few affixes killed discovery. Lesson: hidden mod rarity concentrated too tightly
  on a few mods collapses the sense of finding something new.
- **World of Warcraft (Wrath era) — Tier Set Bonuses:** 2-piece and 4-piece
  bonuses changed how skills worked, not just their numbers. Praised for
  collectibility; criticized when 4-piece became mandatory, making individual item
  quality irrelevant within a patch. Lesson: set bonuses should add a new verb, not
  just amplify an existing stat.

## Design directions on the table

### Option A — Slot-specific mod pools *(chosen)*
*(inspired by PoE2 affix pool)*

Each slot type has its own mod pool (`weaponModPool`, `headModPool`, etc.) with
mods exclusive or shared within a slot category. Each mod has a `hiddenRarity`
weight and `levelTiers` that gate value ranges to player level at drop.

**Trade-off:** Clean data structure, easy to extend. Risk: slot pools balloon
before the design feels "full."
**Telltale failure mode:** Every Rare helmet has the same 2 mods because the
helm pool is too small and the rare mods are too concentrated.

### Option B — Unified pool with slot tags
*(inspired by Diablo IV "can roll on" affix restrictions)*

One mod catalogue; each mod tags `validSlots: EquipmentSlot[]`. Fewer entries,
but more combinatorial bleed (accessories rolling weapon mods unexpectedly).

### Option C — Stance-aligned mod pools
*(inspired by MTG color identity)*

Mods tagged to Heart/Body/Mind stance. Rare items cross stances, enforcing the
RPS triangle at the item layer. Elegant thematically; risk of Resonance Pair
optimization making cross-stance Rares mandatory for every build.

## Decision / leaning

**Option A — Slot-specific pools** for the mod catalogue.
Rarity replaces tier (PoE2 instance model). Set bonuses hook fully into the
existing `ResourceInteraction` shape. Set size: 2–4 pieces with tiered bonuses.

## Open questions

- Should Unique items eventually belong to named sets with other Unique items,
  or always paired with base-item sets? (Answered: base-item sets only early
  game; Unique set membership is a late-game / Spec 07+ extension.)
- The hidden mod rarity weights (10/3/1) are placeholder — exact values need
  playtesting validation.
- Should `dropItem` accept a seeded RNG (tying into Spec 11's RNG harness)?
  Almost certainly yes; spec 05c should note the dependency.

## Raw notes

- The existing `BaseItem` interface in `src/Items/types.ts` (id/name/description/
  category) is NOT the same as "base item type" in the new rarity model. Specs
  should use `EquipmentTemplate` to avoid confusion.
- `EffectTier` (1|2|3) is NOT being removed globally — only `Equipment.tier`
  (which uses `EffectTier`) is replaced. `Effect.tier`, `EquipmentProcTrigger.tier`,
  `ActiveEffect.tier` are unchanged.
- Spec 05b's 50-item library is deprecated. Existing test fixtures referencing
  `tier` on Equipment will need updating.
- Set bonus `resourceInteraction` should stack additively on top of individual
  item `resourceInteraction` — same rule as spec 05b Q2 (additive stacking, no cap).
