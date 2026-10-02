# The game model

> The game as the code stands. Read this first. Every number names the
> constant it comes from, so a change to the code shows up as a wrong line
> here. Paths are under `axiomancer-mechanics/src/` unless rooted. The card
> rules in full, with file and line, are in
> [`plan/revamp/card-rules-inventory.md`](../plan/revamp/card-rules-inventory.md).

Miserere Mei, Deus is a single-player dark fantasy deckbuilder for mobile.
The player walks Act 1 node by node and fights with cards powered by dice.
The rules live in a deterministic TypeScript engine (`axiomancer-mechanics`);
the Expo app (`axiomancer-mobile`) presents it.

## Cards

- **The library is three grey cards** (`GREY_OFFICE_CARDS`,
  `Cards/library/starters.cards.ts`): A Plain Blow (attack, DEAL), A Plain
  Ward (skill, GUARD), A Plain Word (spell, VULNERABLE). All are colour
  `any`, rank 1 (Ash), tier 1.
- **Card types** are Attack, Skill and Spell (`CardType`). The engine never
  branches on type; it is display only.
- **Every card has two lines.** The FREE line (`Card.free`) plays with no
  die. The PAID line (`specialMechanics` and `combatEffects`) costs exactly
  one die. Blow: FREE 2 damage, PAID deal 5. Ward: FREE guard 2, PAID guard
  5. Word: FREE VULNERABLE 10% for 1 turn, PAID VULNERABLE 25% for 2 turns.
- **Card mechanics** are DEAL and GUARD (`CardSpecialMechanic`). The player's
  keywords are DEAL, GUARD and VULNERABLE.
- **The starting deck is ten cards:** Blow ×5, Ward ×3, Word ×2
  (`STARTING_CARD_IDS`, `Combat/combat.rewards.ts`). The deck never drops
  below `MIN_COMBAT_DECK_SIZE` = 10.
- **Rewards:** a won fight offers 3 cards (`COMBAT_REWARD_OFFER_COUNT`,
  mobile) drawn uniformly from the whole library (`COMBAT_REWARD_POOL`). A
  cache offers one.

## Dice

- **Four dice are rolled each threat phase**, one per colour: body, mind,
  heart and gold (wild) (`UPGRADEABLE_DIE_COLORS`,
  `Combat/combat.upgradeable-dice.ts`). The tray is rolled once per phase;
  a second roll is refused (`startTurn`, `Combat/combat.engine.ts`).
- **Faces** (`DEFAULT_DIE_GEAR`): a coloured die has 1 special, 2 mana and 3
  miss faces; the gold die has 1 special, 1 mana and 4 miss. A miss cannot
  power a card. A special face pays `SPECIAL_CONVICTION_DEFAULT` = 2
  Conviction when the die is used.
- **The Color Law** (`dieSatisfiesColorLaw`): a die powers a card when the
  card is `any`, the die is gold, or the colours match. A mismatch fizzles.
- **Colour match** (`colorMatchBonus`): a die of the card's own colour adds
  25% (minimum +2) to PAID numbers and 1 turn to statuses. A grey card never
  gets it.
- **Reserve:** at turn end one unspent die is banked (`RESERVE_MAX` = 2). A
  banked die gains a pip per phase, up to `RESERVE_PIP_CAP` = 2. Each pip
  adds `PIP_GUARD_BONUS` = 5 GUARD or `PIP_INTENSITY_BONUS` = 2 status
  intensity.
- **Momentum (the Surge meter):** using heart, body and mind dice in chain
  order (`MOMENTUM_CHAIN_ORDER`, `MOMENTUM_SURGE_LENGTH` = 3) grants a
  temporary gold die. At most `UPGRADEABLE_TABLE_CEILING` = 7 dice sit on the
  table; a grant past that becomes +1 Conviction.

## A fight

- **The hand** is `COMBAT_HAND_SIZE` = 5. Unplayed cards stay; the hand
  refills to 5 each phase. The discard reshuffles when the draw pile empties.
- **Scrap:** discarding a card pays +1 Conviction, for the first
  `SCRAP_CONVICTION_CAP_PER_TURN` = 2 each turn.
- **Conviction** is capped at `CONVICTION_CAP` = 12. It is spent only on the
  signature, The Open Hand (`SIGNATURE_COST` = 4, `Combat/combat.signature.ts`).
- **GUARD** resets to 0 after each threat phase.
- **The enemy** plays an ordered deck, one card per threat phase, the last
  card repeating (`ENEMY_DECKS`, `Combat/combat.enemy-decks.ts`). Tier 2 and
  3 cards unlock at rounds `TIER2_DEFAULT_ROUND` = 3 and 6. The telegraph
  shows the intent (damage, debuff, buff, combo or pass) before the player
  acts.
- **Escalation:** enemy damage rises `THREAT_ESCALATION_PER_ROUND` = 0.22 per
  round after `THREAT_ESCALATION_GRACE` = 1 round, up to
  `THREAT_ESCALATION_MAX` = ×2, and `THREAT_ESCALATION_BOSS_MULT` = 1.6×
  faster against a boss.
- **Ending:** the player wins when the foe's VITAE reaches 0, or by sparing
  a befriended foe. The player loses at 0 VITAE or after `MAX_PHASES` = 60.

## VITAE and stats

- **VITAE is the one bar.** Player maximum: `PLAYER_VITAE_BASE` 50 + 12 ×
  body + 6 × mind + 6 × heart (`RESOURCE_MULTIPLIERS`,
  `Game/game-mechanics.constants.ts`): 170 at the starting 5/5/5.
- **Enemy VITAE:** round((30 + 8 × level) × the difficulty multiplier),
  `enemyVitae` (`Enemy/index.ts`), unless the enemy sets `vitae`.
- **Stats** are body, mind and heart. An effect scales by its family's stat:
  body for damage to the foe, mind for anything on the player, heart for
  anything on the foe (`effectFamily`, `Combat/stat-scaling.ts`).
- **S3 scaling** (`scaleAmount`): a one-shot amount is base × stat ÷ 5; a
  repeating amount is base × (stat + 5) ÷ 10. Durations do not scale. The
  result floors, minimum 1, no cap. `NEUTRAL_STAT` = 5. The card face
  prints the scaled number.
- **Levels:** reaching level L + 1 costs L × `EXPERIENCE_STEP` (250) XP, so
  levels 2-5 sit at 250, 750, 1,500 and 2,500 total. A level gives
  `STAT_POINTS_PER_LEVEL` = 3 stat points. A kill gives level ×
  `DEFAULT_XP_BY_DIFFICULTY` (normal 20, elite 50, boss 200). A full Act 1
  clear ends near level 5.

## The foes

Three enemies (`EnemyLibrary`, `Enemy/enemy.library.ts`). None carries a
keyword (`EnemyKeyword = never`).

- **Float-Eye:** level 1, normal, 38 VITAE. The only foe drawn at random,
  in every region.
- **Brine Hag:** level 7, elite, 120 VITAE. Placed on certain nodes. The
  only foe that can be befriended.
- **The Doorwarden:** boss, 220 VITAE at level 8, two stages (at 60% and
  25% VITAE). It holds every region's door, pinned at level 1, 2, 3 and 4
  (`World/MapEvents/content.ts`); `scaleEnemyToLevel` scales its VITAE to
  the pin.

## Befriend and mercy

- **The one relic** is the Suppliant's Ring (`relicLibrary`,
  `Items/relic.library.ts`), granted at the first node. Its signature is
  The Open Hand.
- **The Open Hand** befriends a foe that has a `friendshipReward` and sits
  under its `hpGate` (the Brine Hag: below 30% VITAE; `Enemy/befriend.ts`).
- **The mercy choice** (`selectMercyChoice`) follows. Spare ends the fight
  as mercy and pays the friendship reward. Exploit strikes for max(10, 50%
  of the foe's maximum VITAE); the fight goes on if the foe survives.
  Befriending is the only non-lethal ending.

## The world

- **Act 1 only:** Breakwater, Charcoal Wood, Beacon Crags, the Lantern
  Deep. Each region ends at a Doorwarden door. The Lantern Deep's deep stair
  (`ld-18`) and the Labyrinth vault door (`ld-15`) are sealed cutscenes.
  The Labyrinth and the other continents' maps are parked and unreachable.
- **Nodes** in play: encounter, hazard, rest, blacksmith (the Anvil),
  loot-cache, gathering, cutscene, travel. Act 1 has no NPCs, shops or
  quests; that plumbing is kept and tested with fixtures.
- **Currency:** shillings.
- **Rest** offers one choice (`World/RestChoice/`): heal
  `restHealFraction` = 25% of maximum VITAE, or cut a card for 5, 10, 15 …
  shillings (`CARD_REMOVAL_PRICING`).
- **The Anvil** (one per region, near its exit; `ANVIL_VERB_PRICING`,
  `World/Blacksmith/blacksmith.engine.ts`): HONE turns a miss face to mana
  (3 shillings), TEMPER a mana face to special (5), SWAP changes a die's
  gear (8). This is the only way dice grow.
- **Items** are healing potions (`Items/consumable.library.ts`): Minor 10
  VITAE (15 below half), Healing 20 (30), Greater 50 (75).
- **The hazard minigame** (`World/Hazard/`): a ten-card deck (`HAZARD_DECK`)
  and four dice rolled once; the player fills the route's meters with FORCE
  and ESCAPE cards for shillings or VITAE. A failure scars: maximum VITAE
  drops (`HAZARD_MAXHP_SCAR`) until the next rest.

## What the game does not have

These were deleted in the revamp. They are not parked and do not come back
without a ruling from T.

- No stances, no hidden read, no rock-paper-scissors check.
- No preset decks and no deck draft. Every run starts with the grey deck.
- No card pricing or power budget. The only prices are the cut and the
  Anvil.
- No themes, synergy or reward steering.
- No enemy keywords, afflictions, summons or riders.
- No alternate wins beyond befriend: no RELENT, no CONDEMN, no capitulation.
- No alignment, GRACE or faction reputation.
- No card upgrades in play (D8) and no die growth beyond the Anvil (D20);
  both are parked.
- No measured balance baseline (D57). A balance question gets "not
  measured".

## Where this comes from

The revamp ([`plan/revamp/README.md`](../plan/revamp/README.md)) and its
decisions (`plan/2026-09-25-refactor-strategy.decisions.md`, D46-D73).
Where this page and the code disagree, the code is right and this page is
a bug.
