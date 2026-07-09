# Phase 19 — Equipment-granted signatures + the 8 signet relics

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body. **This is
> the canonical/foundational phase of the equipment-signature epic
> (phases 18-21 + 23): phase 18 built the slot model this phase equips into;
> phases 20-22 lean on the contracts established here. Spend extra
> care.** Depends on phase 18 (5-slot `EquipmentLoadout`).

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
its signature plus a **static stat bump**. The relics are ordinary
`Equipment` typed into the phase-18 slots — **2 weapons, 2 armor,
4 accessories** — so the player owns all 8 and wears exactly what the
slot model allows: **1 weapon + 1 armor + 3 of the 4 accessories = 5
worn**. The wear constraint is the slot model itself (no separate cap
counter); the build choice is 2 × 2 × C(4,3) = **16 loadouts**.
`initCombatEncounter` stops reading the archetype kit and instead reads
the signatures granted by the worn loadout. Archetype-based signature
selection is **retired** (`playerArchetype` may still flavor the mobile
portrait — that read is untouched).

This is user-intent phase 1 ("gate signatures off equipment") fused
with the signature-carrying half of user-intent phase 3 ("each piece
grants one signature + a stat bump"): the gate flip **cannot ship green
without** gear that grants signatures, so the 8 relics land here. The
remaining half of user-intent 3 (deleting the *old* procedural library)
is phase 21; effect-decoupling is phase 20; teardown is phase 23.

**Success state:** A freshly-created player starts with all 8 relics
(5 worn in the default loadout, 3 in inventory). Entering combat,
`state.signatures` equals the (deduped) signatures of the worn 5 —
**not** an archetype kit. Swapping the worn weapon/armor/accessory
changes which signature is available next fight. The worn `+5 maxHp`
armor relic visibly raises `maxHealth` (and current `health`).
`npm run verify --workspace axiomancer-mechanics` is green; the mobile
gate is green.

## Locked decisions from planning (2026-07-09) — DO NOT ASK

1. **Archetype gating retired.** Signatures come *only* from worn
   equipment. `SIGNATURE_KITS` / `signaturesForArchetype` are removed
   from the combat-init path (kept as unused symbols for phase 23 to
   delete once nothing imports them).
2. **8 relics, one signature each; full 8-signature roster kept.** No
   signatures are deleted — the player owns all 8 and *decides* which
   to wear within the slot shape.
3. **Relic slot typing is 2 weapons / 2 armor / 4 accessories**
   (updated 2026-07-09 for the 5-slot model). This is the only split of
   8 that fills the 1/1/3 loadout while leaving a real choice in every
   category. Relics are ordinary `Equipment` in ordinary slots — **no
   `'relic'` slot marker, no `equippedRelicIds`, no relic-specific
   reducer** (all superseded by phase 18's `equipItem`/`EquipmentLoadout`).
4. **Fixed starting loadout.** All 8 owned at creation; the fixed
   default 5 (`defaultWorn` below) are worn so there is never an
   empty-signature state and combat tests keep a full kit.
5. **Max-HP is a first-class stat modifier.** Add `'maxHp'` to the stat
   modifier target union; the two armor relics carry
   `{ stat: 'maxHp', value: 5, isMultiplier: false }`. No effect is
   involved (this keeps phase 20's "static stat bumps only" promise
   honest). Handle it **generically in `equipItem`/`unequipItem`** (any
   equipment, not a relic special case): equipping folds the summed
   `maxHp` bonus onto `character.maxHealth` and grows current `health`
   by the same delta; unequipping lowers `maxHealth` and clamps `health`
   down — mirroring the stat-allocation HP-delta convention in
   `src/Character/index.ts:118-129`. (Old library items carry no
   `maxHp` mods, so their behavior is unchanged.)
6. **Stat-to-slot alignment:** weapons carry the Body bumps, armor
   carries the HP bumps, accessories carry Mind/Heart. Consequence
   (accepted): the old "stat-neutral default kit" is impossible under
   typed slots (the two HP relics now compete for the single armor
   slot); the default loadout below is +2 body / +5 maxHp / +4 mind /
   +2 heart and is explicitly balance-tunable later.
7. **All 8 signatures are relic-gated, including the once-universal
   `sig-read-opponent`.** No signature is "always free" anymore — its
   relic is the default-worn *armor*, so a new player still starts with
   the scout. (Follow-up candidate: make read-opponent a default
   freebie — deferred, not this phase.)

## The 8 relics — mapping (locked; names are copy-tunable)

Stat pool: **Body ×2 (weapons), +5 maxHp ×2 (armor), Mind ×2 +
Heart ×2 (accessories)**. IDs encode the granted signature 1:1.
`defaultWorn` marks the starting loadout (1 weapon + 1 armor + 3
accessories).

| Relic id | Working name | Slot (kind) | Grants signature | Stat bump | defaultWorn |
|---|---|---|---|---|---|
| `relic-overwhelming` | Gorgon Brand | weapon | `sig-overwhelming-argument` | +2 body | yes |
| `relic-conclusion` | Capstone Maul | weapon | `sig-rallying-blow` | +2 body | no |
| `relic-read` | Coldglass Aegis | armor | `sig-read-opponent` | +5 maxHp | yes |
| `relic-second-wind` | Ashen Cuirass | armor | `sig-second-wind` | +5 maxHp | no |
| `relic-conviction-strike` | Venom Sigil | accessory (amulet) | `sig-conviction-strike` | +2 mind | yes |
| `relic-clever-gambit` | Gambit Chit | accessory (charm) | `sig-clever-gambit` | +2 mind | yes |
| `relic-disarming-plea` | Suppliant's Ring | accessory (ring) | `sig-disarming-plea` | +2 heart | yes |
| `relic-press-the-point` | Gambler's Knot | accessory (charm) | `sig-press-the-point` | +2 heart | no |

Accessory relics set `accessoryKind` per the parenthesized kind
(phase 18's invariant: every accessory carries a kind). Kinds are
flavor/copy-tunable like the names — the 3 accessory positions accept
any kind.

Default loadout = Gorgon Brand + Coldglass Aegis + {Venom Sigil, Gambit
Chit, Suppliant's Ring} → signatures `overwhelming-argument`,
`read-opponent`, `conviction-strike`, `clever-gambit`,
`disarming-plea`. The armor choice (read vs second-wind) and the
4-choose-3 accessory pick are the interesting swap decisions; the
spread is balance-tunable later via `/deck-tuning`-adjacent tuning — it
is NOT a locked balance claim.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

- **Mechanics CLI** (`src/CLI/game.cli.ts`): the `combat` sub already
  lists `state.signatures`; no CLI contract change — it now reflects the
  worn-loadout-derived list automatically. The phase-18 equip prompt
  already covers relic equipping (they're ordinary equipment); surface
  the granted signature in the item line.
- **`@mechanics` barrel** (`src/index.ts`): **additive** exports only
  (relic library + signature-derivation helper + `grantsSignature`
  field). No rename/removal of existing exports this phase (removals
  are phase 23). Deprecated live aliases stay per bearings.
- **Mobile routes:** no new route. The character/inventory equipment
  surface (phase 18's 5 rows) gains signature labels; the
  `combat-encounter` signature column is **unchanged** — it already
  renders `state.signatures`.

## Content / data reads

| Helper | Lookup | Use |
|---|---|---|
| `relicLibrary` (new, `src/Items/relic.library.ts`) | `Equipment[]` (the 8) | source of truth for the relics |
| `getRelicById(id)` (new) | `Equipment \| undefined` | resolve ids → items |
| `getSignaturesForLoadout(loadout)` (new) | `SignatureSkillId[]` (deduped, order-stable: weapon, armor, accessories) | replaces `SIGNATURE_KITS[archetype]` in `initCombatEncounter` |
| `SIGNATURE_SKILLS` (existing) | signature defs | unchanged; still the effect/cost source |
| `calculateMaxHealth(level, baseStats)` (existing, `src/Utils`) | base max HP | equip reducers add the worn `maxHp` bonus on top |
| `getEquippedItems(loadout)` (phase 18) | worn pieces in slot order | the derivation walks this |

## Components / handlers

**Mechanics (engine — the bulk of the phase):**

- `src/Items/relic.library.ts` (new) — the 8 relic `Equipment`
  instances (`category:'equipment'`, slots per the table, each with
  `statModifiers` per the table and a new `grantsSignature` field).
  Plus `getRelicById`, `relicLibrary`, `getSignaturesForLoadout`.
- `src/Items/types.ts` — add `grantsSignature?: SignatureSkillId` to
  `Equipment`. Import `SignatureSkillId` from `Combat` (watch for
  cycles — the type is declared in `Combat/combat.encounter.types.ts`;
  a `type`-only import is safe). No slot-union change (phase 18 owns
  it).
- `src/Effects/types.ts` (or wherever `StatModifier.stat` /
  `EffectStatTarget` lives) — extend the stat-target union with
  `'maxHp'`.
- `src/Character/equipment.reducer.ts` — per decision 5:
  `getEquipmentModifiers` / `AggregatedEquipmentModifiers` bucketing
  recognizes the `'maxHp'` key (bucket into `statFlat`);
  `equipItem`/`unequipItem` fold the summed worn `maxHp` bonus onto
  `maxHealth` (+ grow/clamp `health` by the delta).
  `recomputeDerivedStats` stays combat-stat-only (maxHp is folded onto
  `maxHealth`, NOT into `DerivedStats`).
- `src/Character/index.ts` (`createCharacter`) — seed the 8 relics
  (5 into the loadout per `defaultWorn`, 3 into `inventory`); compute
  `maxHealth`/`health` with the worn `maxHp` bonus so a fresh character
  already reflects the +5 HP from the worn armor relic.
- `src/Character/presets.ts` — every preset seeds the same 8 relics +
  default loadout. **Presets stop wearing procedural gear** (their
  `dropItem`-built pieces would compete for the same 5 slots): drop the
  preset `equipment` template entries in favor of the relic loadout. If
  a preset's identity depended on a stat stick, note it in the commit
  body as a phase-21 tuning follow-up — do NOT keep dual loadouts.
- `src/Combat/combat.engine.ts:338-339` — replace
  `signatures: SIGNATURE_KITS[...]` with
  `signatures: getSignaturesForLoadout(clonedPlayer.equipment)`.
  Keep an `archetype` field only if the type requires it — set it from
  `playerArchetype` still (portrait), but it no longer drives
  signatures. (If `CombatEncounterState.archetype` is unused post-flip,
  leave the field but stop relying on it; its removal is phase 23
  scope.)

**Mobile (labels only — phase 18 already shipped the loadout UI):**

- Equipment rows / inventory item rows / tooltips: show
  "grants <SignatureName>" when `grantsSignature` is set (resolve the
  display name via `SIGNATURE_SKILLS`).
- `computeEquipDelta` surfaces the signature swap (gained/lost
  signature) alongside stat deltas — minimal text row, rich preview UX
  is a follow-up.

## Cross-links

**In** (already shipped — verify still wired):
- Phase 18: `EquipmentLoadout`, `SLOT_CAPACITY`, `equipItem`/
  `unequipItem`, `getEquippedItems`, `wornPerSlot`, the mobile 5-row
  equipment panel.
- `SIGNATURE_SKILLS` / `playSignatureSkill` / conviction economy — the
  signature *execution* path is untouched; only *which* signatures are
  present changes.
- `calculateMaxHealth` + the stat-allocation HP-delta convention
  (`src/Character/index.ts:118-129`) — mirrored for equipment maxHp.

**Out** (this phase ships these):
- `grantsSignature` field, `'maxHp'` stat target, the relic library,
  `getSignaturesForLoadout`, combat-init derivation, signature labels
  in mobile equip surfaces.

**Retro-fit:**
- Combat e2e/sim suites that assume archetype kits (`SIGNATURE_KITS`,
  `signaturesForArchetype`, per-archetype exclusives) must be updated to
  the worn-loadout model. Expect churn in `src/Combat/e2e/*`,
  `combat.encounter.sim.ts`, `combat.sim-policies.ts`, `combat.cli.ts`,
  and any autoplay policy that enumerates signatures.

## Output schema / contracts

New/changed public shapes (all **additive** on the barrel this phase):
```ts
// Items/types.ts
interface Equipment {
  // ...existing...
  grantsSignature?: SignatureSkillId;   // NEW — a signet grants one signature
}

// Effects stat target union — ADD:
type EffectStatTarget = /* ...existing... */ | 'maxHp';

// Items/relic.library.ts
const relicLibrary: Equipment[];                         // the 8 (2 weapon / 2 armor / 4 accessory)
function getRelicById(id: string): Equipment | undefined;
function getSignaturesForLoadout(loadout: EquipmentLoadout): SignatureSkillId[]; // deduped, order-stable
```
`GAME_STATE_VERSION` 12 → **13** (phase 18 took 12): migration seeds
the 8 relics onto any pre-existing save — default 5 equipped into the
loadout, displaced previously-worn gear moved to `inventory`, the other
3 relics added to `inventory` — and recomputes stats/`maxHealth`. Do
not silently leave old saves relic-less (that would leave loaded saves
signature-less in combat).

## Composition

Combat signature column: unchanged (renders `state.signatures`).
Character equipment panel (phase 18 rows + this phase's labels):
```
Row: Weapon    — Gorgon Brand — grants Overwhelming Argument — +2 BODY
Row: Armor     — Coldglass Aegis — grants Read Opponent — +5 HP
Row: Accessory — Venom Sigil — grants Conviction Strike — +2 MIND
...
```

## Empty / loading / error states

- **Empty slots (only reachable by explicit unequip, never at start):**
  combat legally begins with fewer (or zero) signatures — the signature
  column renders what's worn; combat still resolves via cards. Don't
  crash on empty `signatures`.
- **Slot-full guards:** phase 18's semantics apply unchanged to relics.
- **Loading old save:** migration seeds relics + default loadout.

## Decisions made upfront — DO NOT ASK

- See "Locked decisions from planning" (1-7) above — all seven are
  resolved; do not re-litigate.
- **Do not route relics through `dropItem`.** They are fixed content;
  `dropItem`/rarity/mods are being deleted in phases 21-22. Author the 8
  as plain `Equipment` literals with `rarity:'common'`, no `rolledMods`,
  no affixes, no `resourceInteraction`, no `passiveEffects`/procs.
- **Do not delete `SIGNATURE_KITS` / `signaturesForArchetype` yet.** Stop
  *using* them in combat-init; leave the symbols for phase 23 to remove
  once nothing imports them (avoids a barrel-removal + consumer break in
  the same large phase).
- **`playerArchetype` stays** (portrait flavor); it just no longer picks
  signatures.
- **maxHp folds onto `maxHealth`, not `DerivedStats`.** `DerivedStats`
  has no HP field; keep the concerns separate.
- **Relic identity = `grantsSignature !== undefined`** (plus the
  `relic-` id prefix). No new item category, no slot marker.

## Mobile reflow / responsive

Signature labels are inline text on existing rows — no new layout;
long signature names wrap. Follows existing inventory-row patterns.

## Pages × tests matrix

| Surface | Unit / engine tests | E2E |
|---|---|---|
| `relic.library.ts` | invariants: exactly 8 relics; slot split 2 weapon / 2 armor / 4 accessory; every accessory relic has an `accessoryKind`; each has `grantsSignature`; the 8 values = the 8 `SignatureSkillId`s (full-roster coverage, no dupes); stat pool = Body2(weapons)/HP2(armor)/Mind2+Heart2(accessories); defaultWorn set is a legal loadout | — |
| equip reducers + maxHp | worn armor `maxHp` folds onto `maxHealth` and grows/clamps `health` on equip/unequip; stat bumps reach `derivedStats`; relics obey phase-18 slot semantics (armor swap displaces armor, 4th accessory guarded) | — |
| `getSignaturesForLoadout` | dedupes; order-stable (weapon, armor, accessories); empty loadout → `[]` | — |
| `combat.engine` init | `initCombatEncounter` derives `signatures` from the worn loadout, NOT archetype; default character → the 5 default-worn signatures; swap a relic → signature set changes | `src/Combat/e2e/*` funded-path suites updated to worn-loadout model |
| `createCharacter` / presets | fresh character owns 8 relics, wears the default 5, `maxHealth` includes +5 from the worn armor relic; presets wear the relic loadout (no procedural gear worn) | existing character e2e updated |
| migration | v12 save (no relics) → 8 owned, default 5 worn, displaced gear in inventory; enters combat with 5 signatures | version-bump migration test |
| mobile labels | equipment rows show granted signature; equip-delta shows signature gained/lost | mobile e2e: swap armor relic on character screen, next combat shows the swapped signature |

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
feat(mechanics): equipment-granted signatures + 8 signet relics — phase 19

- Signatures now come from worn equipment, not archetype:
  initCombatEncounter reads getSignaturesForLoadout(character.equipment)
  instead of SIGNATURE_KITS[archetype]. Archetype no longer selects
  signatures (playerArchetype kept for portrait only).
- New: 8 fixed "signet" relics (relic.library.ts) — 2 weapons / 2 armor /
  4 accessories, one signature each, each with a static stat bump
  (Body2/HP2/Mind2+Heart2). grantsSignature field on Equipment.
- New first-class 'maxHp' stat modifier handled generically in
  equipItem/unequipItem: folds onto maxHealth (+ grow/clamp current
  health), no effect involved.
- createCharacter/presets seed all 8, wear the default 5 (1 weapon +
  1 armor + 3 accessories); presets no longer wear procedural gear.
- GAME_STATE_VERSION 12→13 + migration seeds relics onto old saves.
- Mobile: granted-signature labels on equipment rows + equip-delta;
  combat signature column unchanged.

Decisions:
- Gate flip + the 8 signature-granting pieces ship together (the flip
  can't be green without them); old procedural library removal is
  phase 21.
- Relics typed 2/2/4 across the phase-18 slots (only split that fills
  1/1/3 with choice in every category); wear-cap IS the slot model.
- All 8 signatures relic-gated (incl. read-opponent — its relic is the
  default armor). SIGNATURE_KITS left in place (unused) for phase 23.

Closes #<phase-issue-number>
```

## DoD

Flip Phase 19's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append
commit hash, add to "Phase log". Confirm CI-green.

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- Rich loadout UX (drag-reorder, signature tooltips, stat-delta
  preview) — labels only ship here.
- Make `sig-read-opponent` a default freebie (un-gate the scout) if
  playtests show the read relic is a forced armor pick — deferred.
- Relic acquisition/progression (finding relics in the world instead of
  a fixed start) — the model supports it (ordinary equipment +
  inventory), but the content/loot side is not built here.
- Preset stat-identity retune if dropping procedural preset gear moves
  their combat numbers — flag from the preset change, handle in tuning.
- Deleting `SIGNATURE_KITS` / `signaturesForArchetype` / the
  `CombatEncounterState.archetype` field once unused — phase 23.
