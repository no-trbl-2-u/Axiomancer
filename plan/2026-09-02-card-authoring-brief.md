# Card authoring brief — THE BIG NUMBERS REWRITE

> Working spec for the six theme modules of the 2026-09-02 card-library
> rewrite. Parent plan: `plan/2026-09-02-big-numbers-overhaul.prompt.md`.
> Template file (read it first, copy its shape exactly):
> `axiomancer-mechanics/src/Cards/library/starters.cards.ts`.

## Your output

ONE file: `axiomancer-mechanics/src/Cards/library/<theme>.cards.ts`, exporting

```ts
export const <THEME>_CARDS: Card[] = [ /* your cards, rank-ascending */ ];
```

`import type { Card } from '../types';` and nothing else unless you need it.
Data only — no logic, no engine calls. Every card gets `addedIn: '2026-09-02'`.
Do not touch any other file. Do not commit.

## Hard requirements (these are checked)

1. **Every card has a FREE line.** For `cardType: 'spell'`, author a non-empty
   `free: CardRider`. For `oath` / `hex`, author `persistentEffect` (their FREE
   line is engine-derived: a timed instance of the same passive) — those two
   types must NOT carry `free`.
2. **`paidSummary` names every number the PAID line applies**, verbatim as
   digits. If the card deals 24, the string contains `24`. Every UPPERCASE run
   in it must be a real keyword (list below). Spells only.
3. **`targetType`**: `'enemy'` for anything that touches the foe, `'self'` for
   pure defence/utility. An `oath` is always `'self'`; a `hex` always `'enemy'`.
4. **Unique kebab-case `id`**, unique `name`. Nothing may collide with an id in
   `starters.cards.ts` or another theme file (yours are yours; stay inside your
   theme's fiction).
5. **`theme`** is your theme slug on every card. **`tier`** 1-3 (resist tier:
   1 for cheap/common, 2 mid, 3 for rares). **`rank`** 1-6.
6. Every card carries a `// pts:` comment stating the intent in one or two
   lines. Pricing is advisory now — it is a design note, not a gate.

## The scale ladder (pillar 1 — bigger numbers)

| Rank | Single hit | Multi-hit | GUARD | BARRIER | DoT intensity | HEAL | per-◆ scaler |
|---|---|---|---|---|---|---|---|
| 1 Ash | 6-9 | 3 x 2 | 8-12 | 8 | POISON 3 / BLEED 4 | 5 | — |
| 2 Tooth | 9-14 | 4 x 3 | 12-16 | 8-12 | 4-5 | 8 | 3 |
| 3 Splinter | 14-20 | 5 x 4 | 16-22 | 12-18 | 6 | 12 | 4 |
| 4 Rib | 20-30 | 7 x 4 | 22-30 | 18-24 | 8 | 16 | 5 |
| 5 Skull | 30-45 | 9 x 5 | 30-40 | 25-30 | 10-12 | 22 | 6 |
| 6 Saint | 45-70 | 12 x 6 | 40-60 | 35 | 15 | 30 | 8 |

- The FREE line is roughly **30-45%** of the PAID headline, or a different verb
  entirely. A FREE line nobody would ever choose is a bug: make it a real
  choice, not a consolation.
- Payoffs (RUPTURE, REAP ALL, BACKFIRE ALL, ruptureMarks, ◆-dumps) are
  **uncapped** and should reach **100-300** in a fed deck. Do not be shy.
- Rank budget (New World Order): **Ash/Tooth** carry at most one keyword beyond
  a damage/guard verb and no condition line. **Splinter/Rib** at most two
  keywords and at most one condition. **Skull/Saint** are unbudgeted — that is
  where the engine-y cards live.

## Card counts and spread

**15-16 cards**, spread across ranks 1-6 with at least one at rank 1, one at
rank 3, and one at rank 6. Include **exactly one `oath`** and **exactly one
`hex`** (both rank 5 or 6); everything else is a `spell`. Aim for a mix of
aspects — your theme must be able to contribute to a 5/5/5 body/mind/heart
deck, so do not make every card one colour. Rough target: 5 body, 5 mind, 5
heart.

## The schema you may use

```ts
interface Card {
  id, name, description, philosophicalAspect: 'body'|'mind'|'heart',
  tier: 1|2|3, rank: 1..6, cardType: 'spell'|'oath'|'hex',
  targetType: 'self'|'enemy', theme, addedIn, tags?: string[],
  free?: CardRider,            // spells
  persistentEffect?: string,   // oath/hex
  paidSummary?: string,        // spells
  combatEffects?: { effectId, appliedTo: 'self'|'opponent', intensity?, duration? }[],
  specialMechanics?: CardSpecialMechanic[],
  // condition lines (at most one below Skull):
  threshold?: { color, count, rider },        // spent-die tally of a colour
  dieBonus?: { onColor: 'match'|'off'|colour, rider },
  fate?: { rider, recoilHp? },                // may be powered by an X die
  fallen?: { rider },                         // while you carry 2+ self-debuffs
  synergy?: { statePredicate, rider },
}
```

`CardRider` fields (all optional, all real engine units):
`damage`, `pierce`, `wrath`, `chain`, `flay`, `guard`, `barrier`, `recoil`,
`healHp`, `drawCards`, `cleanse`, `conviction`, `souls`, `premises`, `sway`,
`stagger`, `foretell`, `millCards`, `pips`, `tickOne`, `tickAllDots`,
`bonusIntensity`, `bonusDuration`, `refreshDie`, `revealStance`,
`ruptureMarks`, `intensityPerPip`,
`applyEffect: { effectId, intensity?, duration?, to?: 'self'|'opponent' }`.

`CardSpecialMechanic` kinds (use `kind:` exactly):
`deal { amount, hits?, pierce? }`, `wrath { amount }`, `flay { stacks }`,
`twin`, `chain { amount }`, `execute { atPct }`,
`overkill { per, conviction?, healPct?, souls? }`, `guard { amount }`,
`barrier { amount }`, `riposte { damage, reduce }`, `rupture { bonusPct?,
fuelPerPip?, fuelPerOmenHit? }`, `siphon { pct }`, `stagger { rungs }`,
`lock_stance`, `foretell { count }`, `omen { maxWindow, anteConviction, rider }`,
`premise { count }`, `peroration { at, rider, concedeAt? }`,
`spend_premises { markPer, drawPer }`, `spend_all_pips { guardPerPip?, markPer? }`,
`recoil { hp }`, `recoil_x { min, poisonPerX }`, `extend_dots { turns }`,
`convert_dots { bonusIntensity }`, `boost_all_dots { intensity }`,
`soul_gain { count }`, `consume_affliction { souls }`,
`reap { cost, rider?, kindle? }`, `reap_all { burstPerSoul }`,
`turnabout { burstPerRung }`, `sway { amount }`, `echo`, `echo_next_spell`,
`reprise { count, fireFree? }`, `replay_last { times }`,
`conjure_card { cardId }`, `immolate { count, rider }`,
`create_temporary_die { color }`, `grant_pip { count, overflow? }`,
`overheat { pips }`, `bank_spent_die`, `forge_floating_die { color }`,
`float_x_die`, `reroll_spent`, `refresh_die`, `convert_die_color`,
`strip_random_buff`, `befriend_attempt`, `rider { rider }`.

`SynergyStatePredicate` kinds: `opening { maxPriorSpells }` (0 = AMBUSH, your
first spell this turn), `flow { minPriorSpells }`, `finale { cardsLeftAtMost }`,
`requiem { n }`, `recoil-paid-this-turn`, `enemy-drew-blood`,
`enemy-dealt-no-damage-last-round`.

Effect ids that exist (check `src/Effects/debuffs.library.json` and
`buffs.library.json` before using any other): `debuff_poison`, `debuff_bleed`,
`debuff_mark`, `debuff_creeping_doom`, `buff_thorns`. Do NOT invent effect ids.

## Keyword vocabulary for `paidSummary` (UPPERCASE tokens must come from here)

POISON, BLEED, DOOM, MARK, RUPTURE, SIPHON, PROLONG, FESTER, RECOIL, FALLEN,
IMMOLATE, DRAW, HEAL, MILL, RECALL, REPLAY, REQUIEM, ECHO, FORETELL, GUARD,
THORNS, RIPOSTE, BARRIER, CHARGE, STAGGER, BACKFIRE, PLEA, QUARTER, SOUL, REAP,
CLEANSE, KINDLE, PURGE, SENTENCE, CONDEMN, TOLL, OMEN, PIP, FORGE, CURDLE,
DEAL, PIERCE, WRATH, FLAY, TWIN, CHAIN, EXECUTE, OVERKILL, AMBUSH, FLOW,
OPENING. Plain words ("Deal 24", "Heal 16", "Draw 2") are fine and preferred
where no keyword is needed — do not shout every word.

## Voice

Mörk Borg by way of a decayed liturgy: doom-laden, terse, physical, funny in
the dark. Names are concrete nouns and legal/ecclesiastical phrases, never
abstractions — *The Black Cap*, *Communion of the Worm*, *Every Stone an Oath*,
*Jointly and Severally*. `description` is 2-4 sentences of flavour, present
tense, second person where it lands; it never explains the mechanics.

Avoid: numerals, colons and parentheses in card NAMES; philosophy jargon
("epistemic", "dialectic"); the words "enemy" (use "the foe") and "HP" (use
"VITAE") in player-facing strings.

## Your theme's axis

Each theme owns ONE axis and borrows one. Stay in your lane — that is what
makes six decks feel like six decks.

- **rot** — affliction stacking and payoff. POISON, BLEED, FESTER, PROLONG,
  RUPTURE, SIPHON, FLAY, EXECUTE. The deck that plants, deepens, and then
  detonates for 200.
- **debt** — power now, cost later. RECOIL, recoil_x, FALLEN, WRATH, OVERKILL,
  IMMOLATE, DOOM as compound interest, `fate` lines. The deck that hits far
  above its rank and bills you in VITAE.
- **grave** — the deck as a resource. MILL, RECALL, REPLAY, ECHO, TWIN,
  REQUIEM, IMMOLATE, conjure. The deck that plays its best card three times.
- **vigil** — walls and reprisal. GUARD, BARRIER, THORNS, RIPOSTE, FORETELL,
  payoffs for a bloodless round. The deck whose 40 GUARD *is* 40 damage back.
- **trial** — tempo and control. CHARGE toward SENTENCE and the CONDEMN
  alt-win, STAGGER, BACKFIRE, MARK as evidence, CHAIN, AMBUSH, FLOW, OPENING,
  lock_stance, OMEN. The deck that denies the spike and wins the argument.
- **choir** — resolve and harvest. PLEA toward the RELENT alt-win, QUARTER,
  SOUL, REAP, HEAL, CLEANSE, KINDLE, DOOM. The deck that talks a boss down or
  reaps twelve souls for 150.

## Definition of done

- The file type-checks: `cd axiomancer-mechanics && npx tsc --noEmit`.
- 15-16 cards, one `oath`, one `hex`, ranks 1/3/6 all represented, roughly
  5/5/5 by aspect.
- Every spell has a non-empty `free` and a `paidSummary` naming every number.
- You report back: the list of ids you authored, their rank/aspect/type, and
  any effect id or mechanic you wanted and could not find.
