# Phase 18 — Equipment-granted signatures + the 8 signet relics

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body. **This is
> the canonical/foundational phase of the equipment-signature epic
> (phases 18-21); the other three lean on the contracts it establishes.
> Spend extra care.**

## Outcome / Why

Today a player's signature kit is **derived from their archetype**
(dominant base stat) at combat-init and equipment plays no part:
`initCombatEncounter` writes
`signatures: SIGNATURE_KITS[playerArchetype(clonedPlayer)]`
(`axiomancer-mechanics/src/Combat/combat.engine.ts:338-339`). Nothing
is persisted on `Character`; the archetype→kit map is the sole source
of truth.

This phase makes **worn equipment the source of signatures**. We add a
fixed set of **8 "signet" relics** — one per signature — each granting
its signature plus a **static stat bump**. The player owns all 8 and
wears **up to 5** (the wear-cap is the gate and the build choice).
`initCombatEncounter` stops reading the archetype kit and instead reads
the signatures granted by the worn relics. Archetype-based signature
selection is **retired** (`playerArchetype` may still flavor the mobile
portrait — that read is untouched).

This is user-intent phase 1 ("gate signatures off equipment") fused
with the signature-carrying half of user-intent phase 3 ("each piece
grants one signature + a stat bump"): the gate flip **cannot ship green
without** gear that grants signatures, so the 8 relics land here. The
remaining half of user-intent 3 (deleting the *old* procedural library)
is phase 20; effect-decoupling is phase 19; teardown is phase 21.

**Success state:** A freshly-created player starts with all 8 relics in
inventory and 5 worn by default. Entering combat, `state.signatures`
equals the (deduped) signatures of the 5 worn relics — **not** an
archetype kit. Unequipping a relic and equipping a different one
changes which signature is available next fight. The two `+5 HP` relics
visibly raise `maxHealth` (and current `health`) when worn. `npm run
verify --workspace axiomancer-mechanics` is green; the mobile gate is
green.

## Locked decisions from planning (2026-07-09) — DO NOT ASK

1. **Archetype gating retired.** Signatures come *only* from worn
   relics. `SIGNATURE_KITS` / `signaturesForArchetype` are removed from
   the combat-init path (kept only if a test or the portrait still needs
   the map; see "Barrel / exports" — prefer deleting the init use, defer
   full symbol removal to phase 21 if anything else imports it).
2. **8 relics, one signature each; full 8-signature roster kept.** No
   signatures are deleted (planning Q2 final answer: the player starts
   with all 8 and *decides* which to wear).
3. **Wear-cap = 5 of 8.** Enforced by a dedicated relic loadout with
   capacity 5. (Not the legacy 7-slot record — see decision 6.)
4. **Fixed starting loadout.** All 8 owned at creation; a fixed default
   5 are worn so there is never an empty-signature state and combat
   tests keep a full kit. Default-worn set: the 5 listed `defaultWorn:
   true` in the mapping table below.
5. **Max-HP is a first-class stat modifier.** Add `'maxHp'` to the stat
   modifier target union; the `+5 HP` relics carry
   `{ stat: 'maxHp', value: 5, isMultiplier: false }`. No effect is
   involved (this is what keeps phase 19's "static stat bumps only"
   promise honest). Equipping folds the summed `maxHp` bonus onto
   `character.maxHealth` and grows current `health` by the same delta;
   unequipping lowers `maxHealth` and clamps `health` down — mirroring
   the existing stat-allocation HP-delta convention in
   `src/Character/index.ts:118-129`.
6. **Relics are their own equip domain, independent of the legacy 7-slot
   `Character.equipment` record.** Phases 20-21 tear the legacy slot
   model down, so the relic model must not depend on it. Add persisted
   `Character.equippedRelicIds: string[]` (length ≤ 5) and keep the 8
   relic `Equipment` instances in the normal `inventory`. `equipRelic` /
   `unequipRelic` reducers manage the worn set and recompute stats + HP.
7. **All 8 signatures are relic-gated, including the once-universal
   `sig-read-opponent`.** No signature is "always free" anymore — slot
   the read relic if you want the scout. (Follow-up candidate: make
   read-opponent a default freebie — deferred, not this phase.)

## The 8 relics — mapping (locked; names are copy-tunable)

Stat-bump pool is deliberately balanced: **Body ×2, Mind ×2, Heart ×2,
+5 HP ×2**. IDs encode the granted signature for a 1:1 obvious mapping.
`defaultWorn` marks the 5 worn at creation.

| Relic id | Working name | Grants signature | Stat bump | defaultWorn |
|---|---|---|---|---|
| `relic-read` | Cold Lens | `sig-read-opponent` | +5 maxHp | yes |
| `relic-second-wind` | Ashen Locket | `sig-second-wind` | +5 maxHp | yes |
| `relic-conviction-strike` | Venom Sigil | `sig-conviction-strike` | +2 mind | yes |
| `relic-clever-gambit` | Gambit Chit | `sig-clever-gambit` | +2 mind | no |
| `relic-overwhelming` | Gorgon Seal | `sig-overwhelming-argument` | +2 body | yes |
| `relic-conclusion` | Capstone | `sig-rallying-blow` | +2 body | no |
| `relic-disarming-plea` | Suppliant's Ring | `sig-disarming-plea` | +2 heart | yes |
| `relic-press-the-point` | Gambler's Knot | `sig-press-the-point` | +2 heart | no |

Default-worn 5 = one of each stat axis plus both HP relics
(`relic-read`, `relic-second-wind`, `relic-conviction-strike`,
`relic-overwhelming`, `relic-disarming-plea`). This gives a stat-neutral,
5-signature opening kit. The spread is balance-tunable later via
`/deck-tuning`-adjacent tuning; it is NOT a locked balance claim.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

- **Mechanics CLI** (`src/CLI/game.cli.ts`): the `combat` sub already
  lists `state.signatures`; no CLI contract change — it now reflects the
  worn-relic-derived list automatically. The character/loadout CLI
  builder gains a relic-equip prompt (mirrors the existing equip prompt).
- **`@mechanics` barrel** (`src/index.ts`): **additive** exports only
  (new types + relic library + relic reducers). No rename/removal of
  existing exports this phase (removals are phase 21). Deprecated live
  aliases stay per bearings.
- **Mobile routes:** no new route. The `character` / `inventory` tab
  gains a minimal relic-loadout selector (pick ≤5 of 8). The
  `combat-encounter` signature column is **unchanged** — it already
  renders `state.signatures`.

## Content / data reads

| Helper | Lookup | Use |
|---|---|---|
| `relicLibrary` (new, `src/Items/relic.library.ts`) | `Equipment[]` (the 8) | source of truth for the relics |
| `getRelicById(id)` (new) | `Equipment \| undefined` | resolve worn ids → items |
| `RELIC_SIGNATURE` (new) | `relicId → SignatureSkillId` | combat-init derivation |
| `getSignaturesForWornRelics(relicIds)` (new) | `SignatureSkillId[]` (deduped, order-stable) | replaces `SIGNATURE_KITS[archetype]` in `initCombatEncounter` |
| `SIGNATURE_SKILLS` (existing) | signature defs | unchanged; still the effect/cost source |
| `calculateMaxHealth(level, baseStats)` (existing, `src/Utils`) | base max HP | equip reducers add the relic `maxHp` bonus on top |

## Components / handlers

**Mechanics (engine — the bulk of the phase):**

- `src/Items/relic.library.ts` (new) — the 8 relic `Equipment`
  instances (`category:'equipment'`, a `slot:'relic'` marker, each with
  `statModifiers` per the table and a new `grantsSignature` field). Plus
  `getRelicById`, `relicLibrary`, `RELIC_SIGNATURE`,
  `getSignaturesForWornRelics`.
- `src/Items/types.ts` — add `grantsSignature?: SignatureSkillId` to
  `Equipment`; add `'relic'` to `EquipmentSlot` (so the relics are
  well-typed items without inventing a second item category). Import
  `SignatureSkillId` from `Combat` (watch for cycles — the type is
  declared in `Combat/combat.encounter.types.ts`; a `type`-only import
  is safe).
- `src/Effects/types.ts` (or wherever `StatModifier.stat` /
  `EffectStatTarget` lives) — extend the stat-target union with
  `'maxHp'`.
- `src/Character/types.ts` — add `equippedRelicIds: string[]` to
  `Character` (persisted; length ≤ 5).
- `src/Character/relic.reducer.ts` (new) — `equipRelic(character,
  relicId)` and `unequipRelic(character, relicId)`: capacity-guarded (≤5)
  pure reducers that update `equippedRelicIds`, recompute `derivedStats`
  from the worn-relic stat mods (reuse `getEquipmentModifiers` over the
  worn relic list), and fold the summed `maxHp` bonus onto `maxHealth`
  (+ grow/clamp `health` by the delta). `getWornRelics(character)` and
  `getEquipmentMaxHpBonus(relics)` helpers.
- `src/Character/equipment.reducer.ts` —
  extend `getEquipmentModifiers` / the `AggregatedEquipmentModifiers`
  bucketing to recognize the `'maxHp'` key (bucket into `statFlat`);
  `recomputeDerivedStats` stays combat-stat-only (maxHp is folded onto
  `maxHealth` by the relic reducer, NOT into `DerivedStats`).
- `src/Character/index.ts` (`createCharacter`) — seed the 8 relics into
  starter `inventory` and set `equippedRelicIds` to the 5 `defaultWorn`
  ids; recompute `maxHealth`/`health` with the worn `maxHp` bonus so a
  fresh character already reflects the +10 HP from the two worn HP
  relics (both default-worn).
- `src/Character/presets.ts` — every preset seeds the same 8 relics +
  default 5 worn (presets currently build `equipment` via `dropItem`;
  add a parallel relic seed — do NOT route relics through `dropItem`).
- `src/Combat/combat.engine.ts:338-339` — replace
  `archetype: playerArchetype(...)` / `signatures: SIGNATURE_KITS[...]`
  with `signatures: getSignaturesForWornRelics(clonedPlayer.equippedRelicIds ?? [])`.
  Keep an `archetype` field only if the type requires it — set it from
  `playerArchetype` still (portrait), but it no longer drives signatures.
  (If `CombatEncounterState.archetype` is unused post-flip, leave the
  field but stop relying on it; its removal is phase 21 scope.)

**Mobile (minimal loadout surface):**

- `axiomancer-mobile/state/actions.ts` — `equipRelicAction` /
  `unequipRelicAction` calling the engine `equipRelic` / `unequipRelic`;
  capacity-5 guard surfaced as a no-op + toast when full.
- `axiomancer-mobile/state/presenters/inventory.engine.ts` (or a new
  `relics.engine.ts`) — a `RelicLoadoutVM` listing the 8 relics with
  `{ id, name, signatureName, statLabel, worn, canEquip }`.
- A minimal relic selector in the character/inventory screen (checkbox
  list, ≤5 enforced). Rich UX (drag, previews, signature tooltips) is a
  follow-up candidate, not this phase.

## Cross-links

**In** (already shipped — verify still wired):
- `SIGNATURE_SKILLS` / `playSignatureSkill` / conviction economy — the
  signature *execution* path is untouched; only *which* signatures are
  present changes.
- `getEquipmentModifiers` / `recomputeDerivedStats` — reused for relic
  stat aggregation.
- `calculateMaxHealth` + the stat-allocation HP-delta convention
  (`src/Character/index.ts:118-129`) — mirrored for relic maxHp.

**Out** (this phase ships these):
- `grantsSignature` field, `'maxHp'` stat target, `equippedRelicIds`,
  the relic library + reducers + combat-init derivation, mobile loadout.

**Retro-fit:**
- Combat e2e/sim suites that assume archetype kits (`SIGNATURE_KITS`,
  `signaturesForArchetype`, per-archetype exclusives) must be updated to
  the worn-relic model. Expect churn in `src/Combat/e2e/*`,
  `combat.encounter.sim.ts`, `combat.sim-policies.ts`, `combat.cli.ts`,
  and any autoplay policy that enumerates signatures.

## Output schema / contracts

New/changed public shapes (all **additive** on the barrel this phase):
```ts
// Items/types.ts
interface Equipment {
  // ...existing...
  grantsSignature?: SignatureSkillId;   // NEW — a relic grants one signature
}
type EquipmentSlot = /* ...existing 7... */ | 'relic';   // NEW marker

// Effects stat target union — ADD:
type EffectStatTarget = /* ...existing... */ | 'maxHp';

// Character/types.ts
interface Character {
  // ...existing...
  equippedRelicIds: string[];   // NEW — worn relics, length ≤ 5
}

// Items/relic.library.ts
const relicLibrary: Equipment[];                         // the 8
function getRelicById(id: string): Equipment | undefined;
const RELIC_SIGNATURE: Record<string, SignatureSkillId>;
function getSignaturesForWornRelics(ids: string[]): SignatureSkillId[]; // deduped, order-stable

// Character/relic.reducer.ts
function equipRelic(c: Character, relicId: string): Character;   // ≤5 guard
function unequipRelic(c: Character, relicId: string): Character;
function getWornRelics(c: Character): Equipment[];
```
`GAME_STATE_VERSION` + `migrate`: adding `equippedRelicIds` is a save
shape change — **bump `GAME_STATE_VERSION`** and add a migration that
seeds `equippedRelicIds` (and the 8 inventory relics) onto any
pre-existing save with the default-worn 5, so old saves still enter
combat with a full kit. Do not silently default to `[]` (that would
leave loaded saves signature-less).

## Composition

Combat signature column: unchanged (renders `state.signatures`).
Character screen relic selector (pseudocode):
```
RelicLoadout
  Header: "Signets — wear up to 5"  (worn count e.g. 5/5)
  For each of 8 relics:
    Row: [worn?] Name — grants <SignatureName> — <+stat>
         toggle disabled when (worn=5 and this not worn)
```

## Empty / loading / error states

- **Wear-cap reached:** toggling a 6th relic is a no-op; show
  "Loadout full — remove a signet first." No throw.
- **No relics worn (only reachable by explicit unequip, never at
  start):** combat legally begins with `signatures: []` — the signature
  column renders empty; combat still resolves via cards. Don't crash on
  empty `signatures`.
- **Loading old save:** migration seeds relics + default-worn 5.

## Decisions made upfront — DO NOT ASK

- See "Locked decisions from planning" (1-7) above — all seven are
  resolved; do not re-litigate.
- **Relic `slot:'relic'` is a marker, not a 5-way slot split.** Capacity
  is enforced by `equippedRelicIds.length ≤ 5`, not by per-slot
  uniqueness. Don't invent `relic1..relic5` slots.
- **Do not route relics through `dropItem`.** They are fixed content;
  `dropItem`/rarity/mods are being deleted in phases 20-21. Author the 8
  as plain `Equipment` literals with `rarity:'common'`, no `rolledMods`,
  no affixes, no `resourceInteraction`, no `passiveEffects`/procs.
- **Do not delete `SIGNATURE_KITS` / `signaturesForArchetype` yet.** Stop
  *using* them in combat-init; leave the symbols for phase 21 to remove
  once nothing imports them (avoids a barrel-removal + consumer break in
  the same large phase).
- **`playerArchetype` stays** (portrait flavor); it just no longer picks
  signatures.
- **maxHp folds onto `maxHealth`, not `DerivedStats`.** `DerivedStats`
  has no HP field; keep the concerns separate.

## Mobile reflow / responsive

Relic selector is a simple vertical list — no horizontal overflow;
long signature names wrap. Follows existing inventory-row patterns.

## Pages × tests matrix

| Surface | Unit / engine tests | E2E |
|---|---|---|
| `relic.library.ts` | invariants: exactly 8 relics; each has `grantsSignature`; the 8 `grantsSignature` values = the 8 `SignatureSkillId`s (full-roster coverage, no dupes); stat-pool tally = Body2/Mind2/Heart2/HP2 | — |
| `relic.reducer.ts` | `equipRelic` respects ≤5 cap; `unequipRelic` frees a slot; worn `maxHp` bonus folds onto `maxHealth` and grows/clamps `health`; stat bumps reach `derivedStats` | — |
| `getSignaturesForWornRelics` | dedupes; order-stable; empty in → empty out | — |
| `combat.engine` init | `initCombatEncounter` derives `signatures` from `equippedRelicIds`, NOT archetype; default character → the 5 default-worn signatures; swap a relic → signature set changes | `src/Combat/e2e/*` funded-path suites updated to worn-relic model |
| `createCharacter` / presets | fresh character owns 8 relics, wears 5, `maxHealth` includes +10 from two HP relics | existing character e2e updated |
| migration | old save (no `equippedRelicIds`) → migrated to 8 owned + 5 worn; enters combat with 5 signatures | version-bump migration test |
| mobile relic loadout | `RelicLoadoutVM` shape; equip/unequip actions; cap guard | mobile e2e: character screen renders 8 relics, can swap within cap |

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
# public-surface change couples the consumers:
npm run verify --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
```
All legs green before commit.

## Commit body template

```
feat(mechanics): equipment-granted signatures + 8 signet relics — phase 18

- Signatures now come from worn relics, not archetype: initCombatEncounter
  reads getSignaturesForWornRelics(equippedRelicIds) instead of
  SIGNATURE_KITS[archetype]. Archetype no longer selects signatures
  (playerArchetype kept for portrait only).
- New: 8 fixed "signet" relics (relic.library.ts), one per signature,
  each with a static stat bump (Body2/Mind2/Heart2/HP2 pool). grantsSignature
  field on Equipment; 'relic' slot marker.
- New first-class 'maxHp' stat modifier: +5 HP relics fold onto maxHealth
  (+ grow/clamp current health), no effect involved.
- New Character.equippedRelicIds (<=5) + equipRelic/unequipRelic reducers;
  createCharacter/presets seed all 8, wear the default 5.
- GAME_STATE_VERSION bumped + migration seeds relics onto old saves.
- Mobile: minimal relic-loadout selector on the character screen; combat
  signature column unchanged.

Decisions:
- Gate flip + the 8 signature-granting pieces ship together (the flip
  can't be green without them); old procedural library removal is phase 20.
- All 8 signatures relic-gated (incl. read-opponent); full roster kept,
  player wears up to 5. SIGNATURE_KITS left in place (unused) for phase 21.

Closes #<phase-issue-number>
```

## DoD

Flip Phase 18's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append
commit hash, add to "Phase log". Confirm CI-green.

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- Rich relic-loadout UX (drag-reorder, signature tooltips, stat-delta
  preview) — minimal selector ships here.
- Make `sig-read-opponent` a default freebie (un-gate the scout) if
  playtests show the read relic is a forced pick — deferred.
- Relic acquisition/progression (finding relics in the world instead of
  a fixed start) — the model supports it (`equippedRelicIds` +
  inventory), but the content/loot side is not built here.
- Deleting `SIGNATURE_KITS` / `signaturesForArchetype` / the
  `CombatEncounterState.archetype` field once unused — phase 21.
