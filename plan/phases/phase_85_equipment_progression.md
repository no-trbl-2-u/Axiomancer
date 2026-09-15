# Phase 85 — Equipment progression: 3 new signature skills for head/hands/feet

> Agent-facing brief. Concise, opinionated, decisive. Ship without asking;
> document any judgment calls in the commit body. Extends the equipment-
> signature epic (phases 18-21 + 23, canonical brief: phase 19) — depends on
> `src/Items/relic.library.ts` (the 8 signet relics) and
> `src/Combat/combat.signature.ts` (`SIGNATURE_SKILLS`).

## Outcome / Why

`relic.library.ts`'s `AccessoryKind` union has 6 values
(`head | hands | feet | amulet | ring | charm`); only `amulet`, `ring`, and
`charm` have ever had live relics. `head`/`hands`/`feet` have shipped empty
since Phase 19 — a structural gap flagged by `/adjust-equipment`'s pass-1
audit (`plan/AUDIT.md` "[loop-call] No mid/late equipment progression",
2026-09-04) and ratified via `/oversight` on 2026-09-15 as: **design N new
signature skills first (preserving `relic.library.ts`'s stated 1:1
relic-identity rule), then author relics carrying them into the empty
accessory kinds** — ruled out breaking the 1:1 rule with stat-only
accessories.

A `mechanics-expert` design session (this phase) produced 3 new signatures —
one per empty accessory kind — closing the gap in full (no kind left empty,
no partial-fill exception needed).

**Success state:** `relicLibrary` has 11 relics (2 weapon / 2 armor / 7
accessory); every `AccessoryKind` has at least one live relic; the 3 new
signatures are castable via `playSignatureSkill` and each does something
observable to combat state; a pre-Phase-85 save loads with the 3 new relics
in inventory (benched); `npm run verify --workspace axiomancer-mechanics` and
`npm run verify --workspace axiomancer-mobile` are green.

## Locked decisions (mechanics-expert design session, 2026-09-15) — DO NOT ASK

1. **3 new signatures, filling all 3 empty accessory kinds.** No partial-fill
   exception — the ratified option is satisfied in full.
2. **Stat-pool shift:** accessories move from Mind×2/Heart×2 to
   Mind×3/Heart×2/Body×2 — `head` carries `mind` (a third mind accessory),
   `hands`/`feet` carry `body` (closing the prior 0-body-accessory gap; the
   weapons already carry `body`, but no accessory did until now). Mnemonic:
   hands/feet are "the body's tools," head is "the mind's tool" — `amulet`/
   `ring`/`charm` already had no strict kind→stat rule (charm alone carries
   both an existing mind and heart relic).
3. **Scale matches the existing signature kit** (flat/intensity numbers in
   the 1-6 range), not the bigger-numbers single-hit damage ladder — WRATH/
   CHAIN grants are compounding multipliers into FUTURE hits, not one-shot
   damage instances, so the correct price comparison is against existing
   card-authored WRATH/CHAIN rider ceilings (~3-4 / ~6), not §5's flat-hit
   bands. Priced modestly above those ceilings since the signature's entire
   payoff is the grant, unbundled from a damage/heal rider.
4. **`sig-mounting-dread` reuses the existing `'dot'` kind** (content-only,
   the switch case already reads `skill.magnitude` generically as
   `intensityDelta`) — reusing `'conclude'` or `'scout'` was ruled out
   because those two kinds hardcode their behavior independent of
   `skill.magnitude`, so a second signature of either kind would be
   mechanically identical to the existing one except cost.
5. **`sig-endless-labor` (`'empower'`) and `sig-unbroken-stride` (`'surge'`)
   are genuinely new `SignatureSkillKind` values** — WRATH/CHAIN require new
   engine surface (none of the original 8 kinds touch `state.wrath`/
   `state.chain`); in scope per THE OPEN GATE ¶4.
6. **`debuff_backfire` deliberately avoided** for the head slot despite
   thematic fit ("denied motion turns inward") — the WI-8 code comment in
   `combat.signature.ts` records it was already tried on a signature and
   measured at zero HP movement across 4 casts (no self-generated rungs to
   pay off). Reusing it here risks repeating a documented mistake.
7. **All 3 new relics start benched** (`defaultWorn: false`) — the current
   5-piece default loadout is a tuned, validated opener (spec-33 whiff valve,
   the 2026-07-18 "drains D7 report F3" call); swapping in unplaytested
   content is a follow-up tuning decision, not this content-add.
8. **No cast-condition exceptions needed** for any of the 3 — `'dot'` mirrors
   the existing guaranteed-apply shape (no boss-immunity branch, since
   `debuff_creeping_doom` carries no `actionRestriction.skipTurn`);
   `'empower'`/`'surge'` are player-side buffs indifferent to enemy
   difficulty. `'surge'`'s CHAIN fading if unfed is the same risk every
   CHAIN-granting card already carries, not a new failure mode.

## The 3 relics + signatures (locked)

| Relic id | Name | Accessory kind | Stat | Signature id | Signature name | Kind | Cost | Magnitude | Effect |
|---|---|---|---|---|---|---|---|---|---|
| `relic-mounting-dread` | Cassandra's Circlet | `head` | mind +2 | `sig-mounting-dread` | The Mounting Dread | `dot` | 9◆ | 3 | `debuff_creeping_doom` (guaranteed, open-ended DoT — no fixed duration, grows per enemy action) |
| `relic-endless-labor` | Sisyphus's Grip | `hands` | body +2 | `sig-endless-labor` | The Endless Labor | `empower` (new) | 6◆ | 3 | grants WRATH +3 directly (`state.wrath`) |
| `relic-unbroken-stride` | Achilles' Greaves | `feet` | body +2 | `sig-unbroken-stride` | The Unbroken Stride | `surge` (new) | 4◆ | 5 | grants CHAIN +5 directly (`state.chain`, `chainFedThisTurn: true`) |

## Components / handlers

**Mechanics (engine):**

- `src/Combat/combat.encounter.types.ts` — add `'empower'` + `'surge'` to
  `SignatureSkillKind`; add the 3 new ids to `SignatureSkillId`.
- `src/Combat/combat.signature.ts` — add the 3 entries to `SIGNATURE_SKILLS`;
  add `'empower'`/`'surge'` cases to `applySignatureSkill`'s switch, mirroring
  the card-authored WRATH/CHAIN grant shape in `combat.engine.ts` exactly
  (flat add, `chainFedThisTurn: true` on surge, identical event shapes
  `wrath-gained`/`chain-gained` so every downstream reader — combat log,
  `scalePlayerHit` — treats a signature-granted stack identically to a
  card-granted one).
- `src/Items/relic.library.ts` — add the 3 `RELIC_SPECS` entries; update the
  header comment's roster count (8→11), slot split (4→7 accessory), stat pool
  (Mind×2+Heart×2 → Mind×3+Heart×2+Body×2), and loadout math
  (`2×2×C(4,3)=16` → `2×2×C(7,3)=140`).
- `src/Combat/combat.sim-policies.ts` — add `'empower'`/`'surge'` to
  `ALL_SIGNATURE_KINDS` so the `chaos` witness's signature coverage stays
  exhaustive (`LEGACY_SIGNATURE_KINDS` intentionally untouched — it's a
  historical pin of `greedy`/`blind`'s bit-identical legacy behavior).
- `src/Game/game.reducer.ts` — bump `GAME_STATE_VERSION` 21 → 22.
- `src/Game/game.migrate.ts` — add `migrateV21ToV22`: appends the 3 new
  relics (benched) to inventory for any save missing them; idempotent
  (skips ids already present); worn loadout and every other field pass
  through untouched. Wire into the `migrate()` dispatch chain + doc comments.

**Mobile:**

- `state/presenters/combat-encounter.engine.ts`'s `SIG_ICON` map — add
  `empower: '🔥'`, `surge: '⚡'` (the existing per-kind icon lookup with a
  `'◆'` fallback; no other UI change needed — the signature rune column
  renders name/description/cost generically from `SignatureSkill`).

## Cross-links

**In** (already shipped — verify still wired): `relicLibrary`,
`getSignaturesForLoadout`, `playSignatureSkill`, `cloneStartingRelics`,
`createCharacter`'s relic seeding (generic over `RELIC_SPECS`, no change
needed), `SIG_ICON`'s per-kind lookup pattern.

**Out** (this phase ships): the 3 relics/signatures, 2 new
`SignatureSkillKind` engine cases, the v21→v22 migration, the 2 new icons.

**Retro-fit:** none — additive only, no existing UI/engine consumer needed a
structural change (relic seeding, mobile equipment rows, and the signature
rune column are all already generic over the relic/signature roster).

## Output schema / contracts

```ts
// combat.encounter.types.ts — additive
type SignatureSkillKind = /* ...existing... */ | 'empower' | 'surge';
type SignatureSkillId = /* ...existing... */
  | 'sig-mounting-dread' | 'sig-endless-labor' | 'sig-unbroken-stride';
```
`GAME_STATE_VERSION` 21 → **22**: migration appends the 3 new relics
(benched) onto any pre-existing save's inventory.

## Pages × tests matrix

| Surface | Unit / engine tests |
|---|---|
| `relic.library.ts` | roster = 11; slot split 2/2/7; stat pool Mind×3/Heart×2/Body×2 (accessories); benched = 6; worn = 5 (unchanged) |
| `combat.signature.ts` | `sig-mounting-dread` applies `debuff_creeping_doom`; `sig-endless-labor` grants WRATH (`state.wrath` + `wrath-gained` event); `sig-unbroken-stride` grants CHAIN + feeds the turn (`state.chain`, `chainFedThisTurn`, `chain-gained` event) |
| `createCharacter` / presets | fresh character owns 11 relics, wears the same default 5; preset inventory counts updated |
| migration | v21 save (missing the 3 new relics) → gains them in inventory, benched, worn loadout untouched; idempotent on re-migration; v20 chains straight to v22 |

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
```

## Commit body template

```
feat(mechanics): equipment progression — 3 new signature skills for
head/hands/feet — phase 85

- 3 new signet relics fill the head/hands/feet accessory kinds empty
  since Phase 19: Cassandra's Circlet (head, mind), Sisyphus's Grip
  (hands, body), Achilles' Greaves (feet, body).
- 3 new signatures: The Mounting Dread (guaranteed open-ended DoT,
  reuses the 'dot' kind), The Endless Labor (grants WRATH directly,
  new 'empower' kind), The Unbroken Stride (grants CHAIN + feeds the
  turn, new 'surge' kind).
- GAME_STATE_VERSION 21→22 + migration seeds the 3 relics (benched)
  onto existing saves.
- Mobile: SIG_ICON gains empower/surge glyphs; no other UI change
  (the rune column already renders generically).

Decisions:
- mechanics-expert design session picked accessory stat-pool
  Mind×3/Heart×2/Body×2 (was Mind×2/Heart×2, zero body) — hands/feet
  as "the body's tools," head as "the mind's tool."
- Priced against existing card-authored WRATH/CHAIN rider ceilings,
  not the bigger-numbers single-hit ladder — a scaler grant isn't a
  one-shot damage instance.
- All 3 new relics start benched — the default 5-piece loadout is
  tuned/validated; swapping in unplaytested content is a follow-up.

Closes #<phase-issue-number>
```

## DoD

Flip Phase 85's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append the
commit hash.

## Follow-ups (out of scope this phase)

- `/combat-playtest` pass watching signature-cast-share for
  `sig-mounting-dread` specifically — its 9◆ price is a design judgment call,
  not a measured one (the kit has hit DoT-price-dominance before, Phase 31).
- Relic acquisition/progression (finding relics in the world instead of a
  fixed start) — unchanged scope, still deferred.
- Default-loadout retune to consider the 3 new relics — deferred to tuning.
