# Phase R7e2 — Content strip, the relics

## Sources

- Part plan: [`plan/revamp/content-strip.md`](../revamp/content-strip.md)
  (Delete 6, Keep "Equipment slots", Save migration).
- Split from R7e: [`phase_R7e_content_strip.md`](phase_R7e_content_strip.md).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D72** (relics: the Suppliant's Ring only), **D47** (the ten
  GUARD 5 signatures were placeholders until B1), **D45** (carrier rule),
  **D50** (delete; git is the archive), **D58** (nothing is authored), **D62**
  (the dev menu changes only where a deletion forces it).
- Siblings: R5 (`v29 → v30`, retired consumables dropped from a save) and
  R7e (`v33 → v34`).

## Outcome

The relic library is one row, the Suppliant's Ring, granting The Open Hand.
The ten placeholder relics and their ten GUARD 5 signatures are gone, and so
is the `guard` signature kind they were the only carriers of. Equip and
unequip across every slot are still witnessed, by neutral fixture relics
that the live game never offers. A save holding a deleted relic loses it.

## Scope

1. **Library.** `Items/relic.library.ts` keeps the ring only. `defaultWorn`,
   `DEFAULT_WORN_RELIC_IDS` and `BENCHED_RELIC_IDS` go (one row has nothing
   to split). `cloneStartingRelics()` returns a flat `Equipment[]`: fresh
   clones of the library, all worn.
2. **Signatures.** `SignatureSkillId` is `'sig-disarming-plea'`. The ten
   `guardSignature` rows, `SIGNATURE_GUARD`, `signatureGuardAmount` and the
   `guard` arm of `SignatureSkillKind` / `applySignatureSkill` go
   (`SIGNATURE_COST` stays: The Open Hand pays it). `magnitude` leaves
   `SignatureSkill` (only a `guard` signature read it).
3. **Readers.**
   - `first-node-grant.ts`: `STAND_IN_RELIC_ID` and the seat back-fill go.
     `withholdFirstNodeRelic` just takes the ring off; `grantFirstNodeRelic`
     displaces the last worn accessory only when the row is full.
   - `createCharacter({ seedStartingRelics })`, presets, the mock character
     and the state-fixture builder now seed the ring alone.
   - Sim policies keep `signatureKinds` (it still says whether a policy
     casts the mercy signature); the guard-only policies cast none.
   - `combat.cli.ts` and `test-utils/combat-autoplay.ts` lose
     `bestAutoSignature` (it only ever chose a `guard` signature).
   - `CLI/dev-tools.ts` grants and lists the one-row library unchanged.
   - Old migration hops that seeded the starting kit (`v12 → v13`,
     `v13 → v14`, `v21 → v22`) read the shrunk library; the new hop drops
     whatever they would have added, so a v11 save still lands clean.
4. **Fixture relics.** `Game/fixtures/fixture-content.ts` gains
   `FIXTURE_WEAPON`, `FIXTURE_ARMOR` (+5 max VITAE, the `maxHp` line's
   witness) and `FIXTURE_TRINKETS` (three accessories). Placeholder names,
   no signature (none can be authored). Exported for mobile's suites.
5. **Mobile.** `state/item-reward/store-actions.ts` loses the stand-in
   branch; the signature icon map loses `guard`; `DebugItemPicker` lists the
   library as it is. Suites move onto the ring and the fixture relics.
6. **Save v35.** `migrateV34ToV35`: every equipment item whose id starts
   `relic-` and is not the ring leaves `inventory` and every loadout slot;
   `maxHealth` is recomputed from the remaining worn bonus and `health`
   clamped (the two armor relics carried +5). The ring and any non-relic
   item pass through. Idempotent.

## Carrier sweep (D45)

Glossary, atlas, keyword and copy rows that name only a deleted relic or
signature go, both workspaces. The `SIGNATURE_SKILL_LIST`-driven UI needs no
edit beyond the icon map.

## Decisions made upfront — DO NOT ASK

- **The `guard` signature kind goes** with its ten carriers (D45). B1
  re-authors signatures with T; it can bring a kind back.
- **Fixture relics carry no signature.** A fixture signature would be an
  authored ability in the engine's union (D58).
- **`cloneStartingRelics` stays** as the seeding helper so presets, the mock
  character and fixtures keep one source; its return flattens.
- **Old hops are not rewritten** beyond what the shrunk library forces; the
  v35 hop is the one place deleted relics are dropped.

## Tests matrix

- Deleted or rewritten with their subjects: `relic-library`, `relic-equip`,
  `equip-delta`, `item-grant`, `first-node-relic-grant`,
  `relic-vitae-persistence`, `presets`, `combat.signature`, the guard rows of
  `hazard-pattern-combat`, `combat-sim-policies`, the relic migration suites
  (pinned to the ring), and mobile's item-reward, inventory, satchel,
  dev-presets, item-by-id, ItemCard, EquipmentDock and EquipDeltaPanel suites.
- Added: `migrateV34ToV35` (deleted relics leave inventory and loadout,
  max VITAE recomputed, ring and other items pass, idempotent); equip /
  unequip across every slot with fixture relics.

## Verify gate

`npm run verify` (both workspaces), root `npm test`, `npm run lint:content`,
`node scripts/check-lexicon.mjs`.

## DoD

- `relicLibrary` has one row; no deleted relic or signature id is left in
  live code.
- Equip / unequip witnessed by fixture relics.
- A v34 save holding a deleted relic loads without it.
- Gates green; R7e2 ticked.

## Follow-ups (out of scope)

- Comments and docs that narrate the eleven-relic kit: R10c.
- New signatures and relics: B1, with T.
