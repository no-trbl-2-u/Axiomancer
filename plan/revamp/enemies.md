# Revamp — enemies

> Part plan of [THE REVAMP](README.md). Phases **R2** (reset, loop) and
> **B2** (enemy revamp, owner). Decisions D48, D59. Status: RATIFIED 2026-09-28 (D64).

## Why

The purge left the player one damage source, A Plain Blow (DEAL 5 × body ÷ 5),
and the roster was built against a 134-card library:

- **HIDE** (31 foes, 12 at HIDE 8) reduces every hit by N to a floor of 1.
  A Blow does 1 damage until body ≈ 10. Its counters (PIERCE, big single
  hits) are gone. This was the trigger for the reset.
- **WOUNDING** (13 foes) shoves `the-wound`, a card that no longer exists;
  the engine skips it silently (`combat.engine.ts:232`).
- **UNSHAKEN** (12) and **ELUSIVE** (3) are countered only by The Stilling's
  STAGGER, which R4 turns into GUARD 5.
- **22 enemy cards** carry `swayCleanse` / `premiseShed` riders. Their
  telegraphs print "shakes off N PLEA" / "unravels N premises"
  (`combat.threat.ts:350-353`) and `effectIsDebuff` (`:216`) counts them, so
  the intent icon shows a debuff that does nothing. No player source of PLEA
  or premises exists (The Open Hand applies QUARTER + 6 damage; PR #409's
  carrier table was wrong on PLEA).
- **Curse injection** code survives with zero data: `curseCardId` at
  `combat.engine.ts:3504, 3597, 3951`, `combat.threat.ts:217, 343, 354`.
- **Afflictions** (MARK ×78, POISON ×36, BLEED ×23, DOOM ×10) have no
  in-combat answer: no cleanse card, and consumables are out-of-combat only.

## R2 — Enemy reset (loop)

**Roster → three foes, all keywords stripped (D48):**

| Tier | Foe | Level | Notes |
|---|---|---|---|
| normal | Float-Eye (`enemy-float-eye`) | 1 | 3 phases; no befriend data |
| elite | Brine Hag (`enemy-brine-hag`) | 7 | Rarer mid-region fight (D61); **has** friendshipReward, befriendabilityConfig, journal, pactLines |
| boss | The Doorwarden (`enemy-the-doorwarden`) | 8 | Every region's door fight (D61); tiered deck; was the Labyrinth's Act I boss (`Labyrinth/content/act1.content.ts:20`) — re-point its lore lightly as a region boss (no new prose) |

Retired: the other 76 (incl. Grave Larva, Chattering Skull, the King of
Revenge — T purged him with fishing-village, D53). `sandbag-01` stays as the
dev dummy.

Work:

1. Delete the 76 `createEnemy` blocks (`Enemy/enemy.library.ts`), their
   decks (`Combat/combat.enemy-decks.ts`), their stance maps, and every
   enemy card no survivor plays (`Combat/combat.enemy-cards.ts`). Portraits
   and art registry rows for retired foes go too (keep provenance history in
   git).
2. **Strip afflictions** from the survivors' cards: no MARK, POISON, BLEED,
   DOOM or other status on the player. Survivors deal plain damage (D48).
3. **Strip keywords** from the survivors (the Doorwarden carries HIDE,
   UNSHAKEN, BRUTAL, SWIFT). With no carrier left, delete the resolution code
   for all 11 enemy keywords and `enemy-keywords.ts`'s glosses
   (D63); keep `Enemy.keywords?` as an optional empty field so
   B2 can re-add.
4. Delete the `swayCleanse` / `premiseShed` riders, their telegraph text and
   their debuff classification; delete the curse-injection code paths.
5. `EnemiesByMap` (`enemy.library.ts:3443`): every Act 1 map's pool becomes
   Float-Eye, with the Brine Hag as a rarer mid-region fight; **every
   region's door fight pins the Doorwarden** (`bw-17`, `cw-17`, `bc-15`, the
   Lantern Deep's column-5 node) as a region-boss preview (D61, overturns
   D30 everywhere). Parked maps' pools empty.
6. Retired-foe references elsewhere: quests, dialogue gates, bestiary,
   stage profiles (`combat.stage-profiles.ts:113`), CLI defaults, the
   `impossible` stage's `TheIncompleteness`, e2e journeys. The world phase
   (R3) handles map content; R2 handles engine and test references.
7. Stale comments: the enemy library header ("solve fights with DoT or
   control"), `combat.enemy-cards.ts:13, 28`, the "reach alignment" stance
   hint (`:810`).
8. Carrier sweep (D45): HIDE, SWIFT, BRUTAL, VENOM, UNSHAKEN, ELUSIVE,
   REGROW, RAVENOUS, WOUNDING, FLURRY, SUMMON, POISON, BLEED, MARK, DOOM
   leave the atlas, the mobile gloss/glyph tables and the DevLog catalog.

Gates: README §5. Tests pinned to retired foes are deleted or re-pointed at
the survivors.

## B2 — Enemy revamp (owner)

T, 2026-09-28: the revamp adds a new enemy type, the **Act Boss**, and a
four-tier placement model:

| Tier | Placement | Gate |
|---|---|---|
| Normal | Scattered across a region | — |
| Elite | Scattered, fewer than normals | — |
| **Region Boss** | One per region | Blocks region completion |
| **Act Boss** (new type) | One per act | Blocks act completion |

This overturns D30 ("Act 1 has no bosses"). B2 also:

- **Retunes** the roster against the grey office and S3 stats: HIDE-like
  armour only returns alongside a player counter; afflictions only return
  alongside an answer (a cleanse card, or consumables usable in combat).
- Re-grows the roster tier by tier, guided by T (no autonomous enemy
  creation, D58).
- Re-adds enemy keywords one at a time, each with a live counter (D45).
- Decides `difficulty` enum changes (`simple`/`unique` fold into the four
  tiers or stay).

Requires R9 (so XP and stat curves are known). Owner-led; the loop never
starts it.
