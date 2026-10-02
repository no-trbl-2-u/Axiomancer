# Keyword atlas — the live combat vocabulary

One row per keyword the game glosses: the word, the reminder text a player
reads the first time they meet it, and what carries it. The rules behind each
word are in [`docs/game-model.md`](../../docs/game-model.md).

**Sources of truth.** Reminder text lives in
`axiomancer-mobile/state/combat/keywords.ts`: card keywords in
`KEYWORD_GLOSS`, system terms in `SYSTEM_GLOSSARY`. This file is the index,
not the source. When a row disagrees with the code, the code wins and the row
is the bug. `scripts/content-drift.test.mjs` checks that every row here has a
gloss and every gloss has a row; `scripts/axio-mcp-server.mjs` serves these
tables as `axio_keywords`.

**The bar.** A word earns a row when a live card, item, hazard or die prints
it and its reminder text says more than the word does. A one-card mechanic
stays as plain rules text on that card. Every printed number is the number
the engine applies.

---

## Player keywords — damage

| keyword | reminder text | carried by |
|---|---|---|
| **DEAL N** | Direct VITAE damage. Plain English on the face, so it has no gloss. | grey-strike (PAID) |

## Player keywords — afflictions

| keyword | reminder text | carried by |
|---|---|---|
| **VULNERABLE +N% dM** | The foe takes that much more damage from every hit. Adding more stacks it and refreshes the turns. Heart scales N. | grey-word |
| **BLEED** | Each hit the bearer takes deals 3 more VITAE per Bleed stack, then removes a stack. | no live carrier: no card, foe, hazard or item applies `debuff_bleed`; the effect stays in `src/Effects/debuffs.library.json` and mobile still glosses it |

## Player keywords — walls

| keyword | reminder text | carried by |
|---|---|---|
| **GUARD N** | Blocks that much incoming attack damage during the next threat phase. Unused Guard is lost. | grey-ward |

## Player keywords — mending

| keyword | reminder text | carried by |
|---|---|---|
| **HEAL N** | Restores that much VITAE, up to your maximum. | the three healing potions (`src/Items/consumable.library.ts`) |

## Player keywords — the dice

| keyword | reminder text | carried by |
|---|---|---|
| **PIP** | Each threat phase a Reserve die survives, it gains one pip, capped at 2 (`RESERVE_PIP_CAP`). Each pip spent adds +2 intensity (`PIP_INTENSITY_BONUS`), or +5 Guard on a defend card (`PIP_GUARD_BONUS`). | banked Reserve dice |
| **BOON** | A die's BOON face powers a card of its color and grants Conviction. Its equipped gear sets how much (2 by default, `SPECIAL_CONVICTION_DEFAULT`). | the special face of every die (the engine calls it `'special'` and the die prints SPECIAL) |
| **HONE** | A blacksmith upgrade: adds a mana face to a die's gear, so more of its rolls power a card. | the Anvil (turns a miss face to mana) |
| **TEMPER** | A blacksmith upgrade: turns a mana face into a BOON face. A colored die caps at 2 boon and 1 miss, gold at 1. | the Anvil |

---

## Enemy keywords (none)

No enemy carries a keyword (`EnemyKeyword = never`). The three foes fight
with plain damage from their decks.

---

## System terms (printed, glossed, not keywords)

These get popups but are engine systems rather than card vocabulary; they live
in `SYSTEM_GLOSSARY`.

| term | what it is |
|---|---|
| CONVICTION ◆ | A spend-anytime resource banked from unspent dice and overflow. It never decays. |
| RESERVE & PIPS | Up to 2 dice held between phases instead of played. Each gains +1 pip per phase it survives, spent for extra intensity or Guard. |
| WILD / X | A WILD die (the gold die) counts as any color. A dead X die (a miss face) powers nothing. |

---

## Wiring a keyword

A new keyword touches each of these. A keyword that misses a step does not
ship.

1. The mechanic: a `CardSpecialMechanic` member in
   `axiomancer-mechanics/src/Cards/types.ts`, or a status in
   `axiomancer-mechanics/src/Effects/debuffs.library.json` /
   `buffs.library.json` with its payload in `src/Effects/types.ts`.
2. Resolution in `axiomancer-mechanics/src/Combat/combat.engine.ts` and face
   text in `axiomancer-mechanics/src/Combat/combat.cards.ts`. Both switches
   have `default:` arms, so a kind that skips them type-checks clean while
   doing nothing; a carrier card is what catches it.
3. A carrier in `axiomancer-mechanics/src/Cards/library/`.
4. The gloss in `axiomancer-mobile/state/combat/keywords.ts`, the headline
   in `axiomancer-mobile/state/presenters/combat-encounter.engine.ts`, and a
   glyph in `axiomancer-mobile/components/combat/statusGlyphs.ts` /
   `glyphShapes.ts`, mirrored in `scripts/build-catalog.mjs`.
5. A row in this atlas.
