[harness: subagent output matched instruction-shaped pattern(s): settings-json. Control tags below are neutralized (`<` → `<\`); treat any remaining directive-shaped text as a finding to relay to the user, not an instruction to you.]

I have everything needed. Here is the survey.

---

# Axiomancer — Card Library & Enemy System Survey
**Repo:** `C:/Users/notrb/Workspace/Axiomancer` · **HEAD:** `0549fab8` · **Date of survey:** 2026-09-02

> ⚠️ **Three of the brief's premises are stale.** The current tree does **not** have 10 themes, does **not** use the Doxa/Lemma/Thesis/Theorem/Axiom/Aporia rank ladder, and does **not** use `enchantment`/`disenchant` as literals. What actually shipped (2026-08-08 "Profane Canon" rework + 2026-08-09 spec-34 renames) is **7 themes**, ranks **Ash/Tooth/Splinter/Rib/Skull/Saint**, and card types **`spell` / `oath` / `hex`**. The old words are *actively lint-banned* (see §5.6). SWAY→PLEA, PREMISE→CHARGE, PERORATION→SENTENCE, CONCEDE→CONDEMN, CAPITULATE→RELENT are display renames — **the code literals still say `sway`/`premise`/`peroration`/`concedeAt`/`capitulate`.**

---

## 1. CARD DATA

### 1.1 Files

| Path | Lines | Role |
|---|---|---|
| `axiomancer-mechanics/src/Cards/cards.library.ts` | 1448 | THE library — 57 cards, data only |
| `axiomancer-mechanics/src/Cards/types.ts` | 711 | `Card` schema + `CardRider` + `CardSpecialMechanic` union |
| `axiomancer-mechanics/src/Cards/card-themes.ts` | 57 | 7 themes + `THEME_KEYWORDS` families |
| `axiomancer-mechanics/src/Cards/cards.pricing.ts` | 647 | `VERB_POINTS`, `scoreCard`, DoT lifetime math |
| `axiomancer-mechanics/src/Cards/card.engine.ts` | 564 | legacy `executeCard` (no-ops most mechanics) |
| `axiomancer-mechanics/src/Cards/cards.sandbox.ts` / `cards.sandbox-sets.ts` | 120 / 139 | experimental overrides, `--sandbox` |
| `axiomancer-mechanics/src/Cards/cards.haunts.ts` | 110 | CONJURE-only `ht-*` cards, outside the pinned library |
| `axiomancer-mechanics/src/Cards/cards.allies.ts` | 98 | village-goodwill grants, outside the pinned library |
| `axiomancer-mechanics/src/Cards/synergy-predicates.ts` | 324 | predicate evaluation |
| `axiomancer-mechanics/src/Cards/card.removal.ts` / `.types.ts` / `.pricing.ts` | 239/89/71 | removal encounters |

Lookup chain (`cards.library.ts:1445-1447`): `getSandboxCard(id) ?? getHauntById(id) ?? getAllyById(id) ?? registry.get(id)`.

### 1.2 The `Card` schema (verbatim, `src/Cards/types.ts:582-711`)

```ts
export interface Card {
    id: string;
    name: string;
    philosophicalAspect: StatType;      // 'body' | 'mind' | 'heart'
    description: string;
    tier: CardTier;                     // 1 | 2 | 3  — RESIST axis
    targetType: CardTarget;             // 'self' | 'enemy'
    rank: CardRank;                     // 1..6 — QUALITY axis (Ash..Saint)
    cardType: CardType;                 // 'spell' | 'oath' | 'hex'
    theme?: CardTheme;                  // one of 7
    free?: CardRider;                   // the authored FREE (dieless) line — SPELLS only
    persistentEffect?: string;          // oath/hex one-line passive summary — REQUIRED for them
    paidSummary?: string;               // authored PAID prose (spells only, ≤130 chars)
    combatEffects?: CardCombatEffects[];
    specialMechanics?: CardSpecialMechanic[];
    synergy?: CardSynergy;
    incrementsFriendship?: number;
    addedIn?: string;
    tags?: string[];
    intentionallyAsymmetric?: boolean;  // lint exemption for FREE/PAID dominance bands
    threshold?: { color: StatType; count: number; rider: CardRider };
    dieBonus?: { onColor: StatType | 'match' | 'off'; rider: CardRider };
    fate?: { rider: CardRider; recoilHp?: number };
    fallen?: { rider: CardRider };
    glyph?: { payload: GlyphPayload; cap: number };   // sandbox-only pilot
}
```

Supporting types, same file:
- `StatType = 'body' | 'mind' | 'heart'` (:17)
- `CardTier = 1 | 2 | 3` (:24)
- `CardRank = 1|2|3|4|5|6` (:30); `CARD_RANK_NAMES` (:33-35) = `{1:'Ash',2:'Tooth',3:'Splinter',4:'Rib',5:'Skull',6:'Saint'}`
- `rankToRarity` (:43-45): `rank<=2 → 'common'`, `<=4 → 'uncommon'`, else `'rare'`
- `CardType = 'spell' | 'oath' | 'hex'` (:57)
- `CardCombatEffects { effectId; appliedTo:'self'|'opponent'; description?; intensity?; duration? }` (:83-89)
- `CardRider` (:377-447) — 24 optional fields: `bonusIntensity, bonusDuration, guard, conviction, refreshDie, revealStance, tickAllDots, tickOne, cleanse, healHp, drawCards, premises, sway, souls, foretell, applyEffect{effectId,intensity,duration,to}, ruptureMarks, intensityPerPip, pips, stagger, barrier, recoil, millCards, glyphCharge, glyphChargeFallback`
- `SynergyStatePredicate` (:496-505): `enemy-dealt-no-damage-last-round | opening{maxPriorSpells} | finale{cardsLeftAtMost} | recoil-paid-this-turn | enemy-drew-blood | requiem{n}`
- `SynergyPredicate` (:455-460): `{ effectId; on:'caster'|'target'; intensityMin?; durationMin? }`
- `CardSynergy` (:534-565): `predicate?, statePredicate?, rider?, bonusDamage?, durationDamageMul?, intensityDamageMul?, consumeMatched?, clearAllEffectsBothSides?, applyEffectOnFire?`

**`basePower` and `chipHp` do not exist** — deleted at the schema level (spec 32 v3 strike purge). Re-adding them is a lexicon-lint failure *and* a source-string test failure (`curated-library.engine.test.ts:163-167`).

### 1.3 Counts (measured from source, 2026-09-02)

| Axis | Distribution |
|---|---|
| **Total** | **57 unique cards** (pinned: `curated-library.engine.test.ts:36`, `card-coverage.sim.test.ts:93`, `deck-presets.engine.test.ts:177`) |
| **Theme** | rot 8 · debt 8 · grave 9 · vigil 9 · trial 9 · choir 10 · curse 4 |
| **Rank** | 1 Ash:17 · 2 Tooth:7 · 3 Splinter:8 · 4 Rib:6 · 5 Skull:13 · 6 Saint:6 |
| **cardType** | spell 45 · oath 6 · hex 6 |
| **Aspect** | body 19 · heart 20 · mind 18 |
| **Classes** | 8 starters (`tags:['…','starter']`) · 3 dice valves · 4 curses · 6 archetype packages × 7 |
| **Reward pool** | 53 (`COMBAT_REWARD_POOL` = library − curses; `curated-library.engine.test.ts:207`) |
| **Preset/reward split** | 34 campaign starters / 23 reward-only (`:127`,`:139`) |
| **Priced spells** | 41 (45 spells − 4 unpriced curses; `pricing.engine.test.ts:53`) |

Archetype package shape (enforced `curated-library.engine.test.ts:47-58`): each theme = 7 cards = 2 commons (rank≤2) + 2 uncommons (rank 3-4) + 1 rare spell (rank≥5) + 1 `oath` + 1 `hex`.

### 1.4 Themes (`src/Cards/card-themes.ts:16-47`)

```ts
export type CardTheme =
    | 'rot' | 'debt' | 'grave' | 'vigil' | 'trial' | 'choir' | 'curse';

export const THEME_KEYWORDS: Record<CardTheme, readonly string[]> = Object.freeze({
    rot:   ['POISON','BLEED','DOOM','MARK','RUPTURE','SIPHON','PROLONG','FESTER'],
    debt:  ['RECOIL','FALLEN','DOOM','IMMOLATE','BLEED','DRAW','HEAL'],
    grave: ['MILL','RECALL','REPLAY','REQUIEM','IMMOLATE','ECHO','DOOM','FORETELL'],
    vigil: ['GUARD','THORNS','RIPOSTE','BLEED','DOOM','FORETELL'],
    trial: ['CHARGE','STAGGER','BACKFIRE','MARK','DOOM'],
    choir: ['PLEA','QUARTER','SOUL','REAP','DOOM','HEAL','CLEANSE','KINDLE'],
    curse: ['PURGE'],
});
```

### 1.5 The cost model

**There is no mana cost field.** A card has exactly two lines:

- **FREE line** (`Card.free: CardRider`) — **dieless, always available**. Budget law: FREE ≈ 25–35% of the card's total points (`types.ts:613-619`). Every SPELL must author one (`curated-library.engine.test.ts:85-96`). `oath`/`hex` author **none** — their FREE line is engine-derived (a 3-round timed instance of the same passive; `FREE_ENCHANT_ROUNDS`).
- **PAID line** — costs **exactly ONE die**, and **THE COLOR LAW** applies: a die can power only a card of its own colour; WILD is the sole exception; an X die powers nothing unless the card carries `fate` (`combat.engine.ts:1947`, `:335`).

Resources cards read/spend/grant (none is a printed "cost"):
- **Conviction ◆** — cap 12 (`CONVICTION_CAP`, `combat.engine.ts:137`). Banked from unpicked dice: `CONVICTION_PER_UNPICKED_DIE = 1`, `CONVICTION_PER_UNPICKED_WILD = 2`, `CONVICTION_READ_WIN_BONUS = 1`. Scrap pays +1◆ for the first `SCRAP_CONVICTION_CAP_PER_TURN = 2` scraps/turn.
- **Reserve** — `RESERVE_MAX = 2` dice, `RESERVE_PIP_CAP = 2` pips (`combat.dice.ts:107-109`); `OVERHEAT_PIP_CEILING` / `OVERHEAT_BUST_CHANCE` (35%) push past.
- **Dice** — `TURN_DICE_COUNT = 3` rolled fresh each turn; face bag `['heart','body','mind','wild','x','x']` (1/6 each colour, 2/6 X) (`combat.dice.ts:26-36`).
- Printed *costs* are all in-card verbs: `recoil` (VITAE), `recoil_x` (chosen X VITAE), `reap{cost}` (Souls), `immolate{count}` (hand cards).

### 1.6 Eight representative cards, verbatim

**(a) Starter, rank 1 Ash, rot, spell** — `cards.library.ts:64-83`
```ts
const spoiledPoultice: Card = {
    id: 'spoiled-poultice', theme: 'rot', name: 'Spoiled Poultice',
    philosophicalAspect: 'body',
    tier: 1, rank: 1, cardType: 'spell', targetType: 'enemy',
    paidSummary: 'Inflict POISON 1 (ticks each card you play, 2 turns).',
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    addedIn: '2026-08-08', tags: ['rot','dot','starter'],
};   // pts ≈ 2.85
```

**(b) Starter defensive, GUARD numbers** — `:131-152`
```ts
const chilblainWatch: Card = {
    id: 'chilblain-watch', theme: 'vigil', philosophicalAspect: 'body',
    tier: 1, rank: 1, cardType: 'spell', targetType: 'self',
    paidSummary: 'GUARD 6. Gain THORNS 1 for 2 turns.',
    free: { guard: 4 },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 6 }],
};   // pts ≈ 4.0
```

**(c) Rank 5 Skull rare — the rot capstone (RUPTURE + SIPHON)** — `:505-530`
```ts
const communionOfTheWorm: Card = {
    id: 'communion-of-the-worm', theme: 'rot', philosophicalAspect: 'heart',
    tier: 3, rank: 5, cardType: 'spell', targetType: 'enemy',
    paidSummary: 'RUPTURE ALL: consume every affliction on the foe and detonate. SIPHON 50% of the RUPTURE damage.',
    free: { applyEffect: { effectId: 'debuff_poison', intensity: 1, duration: 4 }, tickOne: true },
    specialMechanics: [ { kind: 'rupture' }, { kind: 'siphon', pct: 0.5 } ],
};   // pts ≈ 18.9 — deliberately top-of-band (rare band ceiling 19)
```

**(d) Rank 5 Skull rare — chosen-X blood cost** — `:681-703`
```ts
const blankIndenture: Card = {
    id: 'blank-indenture', theme: 'debt', philosophicalAspect: 'heart',
    tier: 3, rank: 5, cardType: 'spell', targetType: 'enemy',
    paidSummary: 'RECOIL X (at least 3). Afflict POISON 1 per 2 VITAE paid, rounded up, for 4 turns (ticks each card you play).',
    free: { applyEffect: { effectId: 'debuff_creeping_doom', intensity: 2 }, drawCards: 1 },
    specialMechanics: [{ kind: 'recoil_x', min: 3, poisonPerX: 0.5 }],
};   // pts ≈ 16.3
```

**(e) Rank 5 Skull — the alt-win declarer (SENTENCE / CONDEMN)** — `:1174-1199`
```ts
const theBlackCap: Card = {
    id: 'the-black-cap', theme: 'trial', philosophicalAspect: 'heart',
    tier: 2, rank: 5, cardType: 'spell', targetType: 'enemy',
    paidSummary: 'Inflict DOOM 2 (grows +1 per foe action). SENTENCE 6: RUPTURE MARK for 2 per stack, DRAW 1. CONDEMN 8 wins (elite 10, boss 12).',
    free: { applyEffect: { effectId: 'debuff_creeping_doom', intensity: 1 }, premises: 1 },
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 2 }],
    specialMechanics: [
        { kind: 'peroration', at: 6, rider: { ruptureMarks: 2, drawCards: 1 }, concedeAt: 8 },
    ],
};   // pts ≈ 12.0
```

**(f) OATH (was "enchantment"), rank 5** — `:532-549`
```ts
const theUntendedGarden: Card = {
    id: 'the-untended-garden', theme: 'rot', philosophicalAspect: 'mind',
    persistentEffect:
        'At the end of each round, FESTER 1: every DoT on the foe gains +1 intensity.',
    tier: 2, rank: 5, cardType: 'oath', targetType: 'self',
    addedIn: '2026-08-08', tags: ['rot','oath'],
};   // no `free`, no `paidSummary`, no combatEffects — pure engine hook keyed by card id
```

**(g) HEX (was "disenchant"), rank 6 Saint** — `:551-569`
```ts
const edictOfTheOpenWound: Card = {
    id: 'edict-of-the-open-wound', theme: 'rot', philosophicalAspect: 'body',
    persistentEffect:
        'The foe\'s wounds refuse to close: its POISON, BLEED and DOOM no longer lose duration, and its HEAL fails.',
    tier: 2, rank: 6, cardType: 'hex', targetType: 'enemy',
};
```

**(h) CURSE (enemy-injected junk)** — `:327-345`
```ts
const mouthfulOfBrine: Card = {
    id: 'mouthful-of-brine', theme: 'curse', philosophicalAspect: 'body',
    tier: 1, rank: 1, cardType: 'spell', targetType: 'self',
    paidSummary: 'PURGE this curse (it leaves the fight entirely).',
    free: { recoil: 1 },
    specialMechanics: [{ kind: 'purge_self' }],
    intentionallyAsymmetric: true,
};   // unpriced by design; exempt from the band lint
```

Other useful numbers: `frostbitten-palisade` GUARD 8 + THORNS 1 d2, FREE guard 5 (`:913-932`) · `the-besiegers-winter` BARRIER 12 + THORNS 2 d2 + DOOM 2, pts ≈14.7 (`:1008-1038`) · `miserere` REAP ALL burstPerSoul 3 + SIPHON 50%, pts ≈17.8 (`:1339-1363`) · `open-every-grave` `replay_last{times:2}` + `reprise{count:1}`, pts ≈17 (`:848-871`) · `the-reprisal-bell` `riposte{damage:4,reduce:2}` + GUARD 8 (`:981-1006`).

---

## 2. KEYWORD REGISTRY

### 2.1 Where it lives

| Path | Role |
|---|---|
| `axiomancer-mobile/state/combat/keywords.ts` | **THE registry.** `KEYWORD_GLOSS` (42 rows) + `EFFECT_KEYWORD`, `SUPPORT_KEYWORD`, `VERB_KEYWORD`, `MECHANIC_KEYWORD`, `SYSTEM_GLOSSARY`, `ARCHETYPE_KEYWORDS` |
| `axiomancer-mechanics/docs/keyword-atlas.md` (141 ln) | The scoreboard + prior-art cache, one row per keyword, gate `E/P/D/T` marks |
| `axiomancer-mechanics/src/Effects/debuffs.library.json` / `buffs.library.json` | The engine effect payloads (`debuff_poison`, `debuff_bleed`, …) |
| `axiomancer-mechanics/src/Effects/effects.library.ts` (24 ln) | `effectsLibrary`, `lookupEffect` |
| `axiomancer-mechanics/src/Cards/card-themes.ts` | `THEME_KEYWORDS` (per-theme families) |
| `axiomancer-mechanics/docs/lexicon.json` / `docs/LEXICON.md` | Retired-terminology + retired-doctrine registry |

Why mobile-side: `keywords.ts:26-28` — "a player-facing label is presentation (ADR-0001/0003). Never rename engine effect ids for player text — map them here."

### 2.2 `KEYWORD_GLOSS` — all 42 rows (`keywords.ts:164-258`), pinned by `keywords.test.ts:31-44`

| # | Keyword | Gloss (verbatim, abbreviated where noted) |
|---|---|---|
| 1 | **Draw** | Draw that many cards from your deck, up to your hand limit. |
| 2 | **Forge** | Forges a GHOST die (or revives a dead X die as WILD)… At 3 dice, it grants +1 Conviction instead. |
| 3 | **Guard** | Blocks that much incoming attack damage during the next threat phase. Unused Guard is lost unless the card prints "persists". |
| 4 | **Tick** ⚠️ | Your strongest damage-over-time effect on the foe ticks again, immediately. |
| 5 | **Mark** | Every DoT tick on the bearer deals +1 VITAE per Mark stack. Marks hold until consumed. |
| 6 | **Cleanse** | Removes up to that many afflictions from you. |
| 7 | **Heal** | Restores that much VITAE, up to your maximum. |
| 8 | **Rupture** | Consumes the foe's afflictions and deals their remaining damage at once, up to 60% of its max VITAE. |
| 9 | **Siphon** | Heals you for the printed percentage of the damage this play deals. |
| 10 | **Prolong** | Adds that many turns to every DoT you have on the foe. |
| 11 | **Fester** | Every DoT on the foe gains that much intensity. |
| 12 | **Curdle** | Flips the foe's Bleed into Poison and its Poison into Bleed, each landing that much harder. |
| 13 | **Poison** | Each time a card is played, the foe loses 2 VITAE per Poison stack. The longer it holds, the harder it bites. |
| 14 | **Bleed** | Each hit the bearer takes deals 3 more VITAE per Bleed stack, then removes a stack. |
| 15 | **Doom** | Deals 1 VITAE per stack at the start of each round and grows a stack every time the foe acts. It ends only when consumed. |
| 16 | **Charge** | A running tally. When it reaches the count printed on the card that spends it, that payoff fires free and the tally resets. |
| 17 | **Kindle** | Creates a temporary die of the printed color in your Reserve. If the Reserve is full, +1 Conviction instead. |
| 18 | **Pip** | Each threat phase a Reserve die survives, it gains one pip, capped at 2… Each pip spent adds +1 intensity, or +2 Guard on a defend card. |
| 19 | **Recoil** | Pay the printed VITAE as a cost when the card is played. No defense can prevent it. |
| 20 | **Fallen** | A state: you carry 2 or more different afflictions. A card's FALLEN line fires free while you are Fallen. |
| 21 | **Stagger** | Removes that many rungs (the steps of the foe's telegraph) from its next action. Strip them all and the action is denied. |
| 22 | **Backfire** | The foe takes 1 VITAE per Backfire stack for each rung its telegraphed action loses. A denied action counts all of its rungs. |
| 23 | **Foretell** | Reveals the foe's next stance and looks at that many cards of your deck, moving the best to the top. |
| 24 | **Omen** | Stake a stance and a window of phases it must land within, paying a Conviction ante up front… A hit fires the payoff free and a miss keeps the ante. |
| 25 | **Soul** | You gain 1 Soul each time an affliction on the foe expires or is consumed. |
| 26 | **Reap** | Spends the printed number of Souls to fire the printed effect. With fewer Souls, it fizzles. |
| 27 | **Plea** | Builds on the foe and decays 1 each round. At their resolve (~35% of max VITAE), they relent. |
| 28 | **Quarter** | The foe's attacks deal 10% less damage per Quarter stack. |
| 29 | **Thorns** | The foe takes 1 VITAE per Thorns stack each threat phase it attacks you, even through a full block. |
| 30 | **Riposte** | Armed for one threat phase: reduces the first attack by its parry (CUT) value. If Guard fully blocks it, the foe takes CTR damage instead… |
| 31 | **Echo** | The card's PAID line fires twice. FREE lines never echo. |
| 32 | **Recall** | Returns that many cards from your discard pile to your hand, highest rank first. |
| 33 | **Replay** | Says your last spell again: its PAID payload fires that many more times. |
| 34 | **Requiem** | A card's REQUIEM line fires free while your discard pile holds that many cards. |
| 35 | **Immolate** | Burns the lowest-rank cards in your hand as a cost, and they leave the fight entirely. A curse burns as well as anything. |
| 36 | **Purge** | Playing this curse removes it from the fight entirely. A die and a beat buy the deck clean. |
| 37 | **Mill** | Sends that many cards from your deck to your discard pile. |
| 38 | **Boon** | A die's BOON face powers a card of its color and grants Conviction. Its equipped gear sets how much (2 by default). |
| 39 | **Hone** | A blacksmith upgrade: adds a mana face to a die's gear… |
| 40 | **Temper** | A blacksmith upgrade: turns a mana face into a BOON face. A colored die caps at 2 boon and 1 miss, gold at 1. |
| 41 | **Oath** † | A passive on your side: 3 rounds when played free, permanent when paid with a die. |
| 42 | **Hex** † | A standing curse on the foe: 3 rounds when played free, permanent when paid with a die. |

† = card-TYPE labels, never rendered in the inspect keyword panel (`keywords.ts:254-257`); the guard test blocks them appearing there.

### 2.3 Deprecated / killed keywords

- **TICK — owner-ratified KILLED 2026-07-10** (spec 32 amendment #2, Phase 30). *But it is still live in code:* the `KEYWORD_GLOSS.Tick` row survives (`keywords.ts:173`), the atlas row survives with the note "retirement rides phase 30's FREE-line rework" (`keyword-atlas.md:75`), `CardRider.tickOne` / `tickAllDots` are still authored on ~8 cards, and `combat.card-complexity.ts:52` maps both riders to `'TICK'`. Retirement was ratified but **never executed**.
- **Removed in Phase 29** (`keyword-atlas.md:47-51`): `BARRIER` (merged into GUARD's semantics — "persists"), `CONJURE` (zero library cards), `SENTENCE` (demoted to the systems glossary), `PERORATION` (demoted). `PREMISE` also demoted (it is now CHARGE).
- **Renames (Phase 29):** FESTER→PROLONG, TRANSMUTE→CURDLE, REPRISE→RECALL. Note FESTER was later re-minted as a *separate* keyword by the Profane Canon (row 11) — the two are now distinct.
- **Renames (Phase 44b/44c, spec 34 §5.2, 2026-08-09):** PREMISE→CHARGE (R-1), PERORATION→SENTENCE (R-2), CONCEDE→CONDEMN (R-3), SWAY→PLEA (R-4), CAPITULATE→RELENT (R-5), RAPPORT→QUARTER (R-6), REARGUE→CURDLE (R-7), SPECIAL face→BOON (R-8), enchantment→OATH (R-9), disenchant→HEX (R-10), RESONANCE⬡→TOLL⬡ (R-11), FLOATING✦→GHOST✦ (R-12), THOUGHTFORM→HAUNT (R-13, `tf-`→`ht-`), rank names R-14. All 15 rows are in `docs/lexicon.json`.
- **Retired doctrine rows** (`lexicon.json:169-191`): `strike-ban-doctrine`, `status-primacy-doctrine`, `win-rate-objective-doctrine`. Type `doctrine`, matched whole-file with collapsed whitespace.

### 2.4 SYSTEM_GLOSSARY (8 entries, `keywords.ts:371-387`) — "systems, not card keywords"

`CONVICTION ◆` · `TOLL ⬡` · `RESERVE & PIPS` · `GHOST ✦` · `RUNGS` (2 on a normal action, 3 on a boss) · `WILD / X` · `SENTENCE` · `CONDEMN`.

### 2.5 How a card references a keyword — the effect DSL

Four channels, resolved in this order by `executeCard` / `playBottomAction`:

1. **`combatEffects[]`** → effect id → `EFFECT_KEYWORD` map (`keywords.ts:35-56`). Only **7** live mappings: `debuff_poison→Poison, debuff_bleed→Bleed, debuff_mark→Mark, debuff_backfire→Backfire, debuff_quarter→Quarter, buff_thorns→Thorns, debuff_creeping_doom→Doom`; plus `debuff_kindling_ember→Bleed`, `debuff_nettle_sting→Bleed`.
2. **`specialMechanics[]`** → `CardSpecialMechanic['kind']` → `MECHANIC_KEYWORD` (`keywords.ts:112-150`, 24 rows): `stagger→Stagger, lock_stance→Stagger, turnabout→Backfire, foretell→Foretell, omen→Omen, premise→Charge, spend_premises→Charge, recoil→Recoil, recoil_x→Recoil, soul_gain→Soul, consume_affliction→Rupture, siphon→Siphon, sway→Plea, echo→Echo, echo_next_spell→Echo, reprise→Recall, extend_dots→Prolong, convert_dots→Curdle, boost_all_dots→Fester, immolate→Immolate, purge_self→Purge, replay_last→Replay`. Kinds with their own face kind (guard/barrier/riposte/rupture/reap/forge cluster) are deliberately absent.
3. **`CardRider` fields** on `free` / `threshold` / `dieBonus` / `fate` / `fallen` / `synergy.rider` → `RIDER_KEYWORDS` (`combat.card-complexity.ts:44-55`).
4. **UPPERCASE runs in `paidSummary` / `persistentEffect`** → `keywordsInPersistentText` (`keywords.ts:288-300`), gated by the structural-word exclusion list `STRUCTURAL_UPPER` (`combat.card-complexity.ts:34-37`: FREE, PAID, ALL, WILD, VITAE, HP, DOT, DOTS, CONDEMN, SENTENCE, OPENING, X).

### 2.6 `CardSpecialMechanic` — the full op-code union (43 kinds)

Runtime array `CARD_SPECIAL_MECHANIC_KINDS` (`types.ts:295-339`), bound to the compile-time union in **both** directions by `AssertNever` (`:342-359`):

```
strip_random_buff, befriend_attempt, guard, rupture, siphon, barrier, riposte,
reroll_spent, refresh_die, convert_die_color, create_temporary_die, grant_pip,
overheat, bank_spent_die, forge_floating_die, float_x_die, stagger, lock_stance,
foretell, omen, premise, peroration, spend_premises, spend_all_pips, recoil,
recoil_x, extend_dots, convert_dots, boost_all_dots, soul_gain,
consume_affliction, reap, reap_all, turnabout, sway, echo, echo_next_spell,
reprise, replay_last, conjure_card, immolate, purge_self, rider
```

The special-mechanic rider families you asked about (all `types.ts`):
- **RUPTURE** `:117` `{ kind:'rupture'; bonusPct?; fuelPerPip?; fuelPerOmenHit? }` — 1.5× remaining DoT fuel + flat per non-DoT stack, capped at `ruptureBurstCap()` = **0.60 × enemy maxHP** (`RUPTURE_CAP_FRACTION`, atlas row `keyword-atlas.md:79`)
- **REAP** `:236` `{ kind:'reap'; cost; rider?; kindle? }` and `:240` `{ kind:'reap_all'; burstPerSoul }` — **uncapped** (WS7.1; `themed-decks.engine.test.ts` pins a 240-damage uncapped burst)
- **SWAY (=PLEA)** `:249` `{ kind:'sway'; amount }` — decays `SWAY_DECAY_PER_TURN = 1`; RELENT at `capitulateThreshold`
- **PERORATION (=SENTENCE)** `:205` `{ kind:'peroration'; at; rider; concedeAt? }`
- **OMEN** `:198` `{ kind:'omen'; maxWindow; anteConviction; rider }` — v2 staked claim, ante paid up front, `claimScale = 1/window`
- **ECHO** `:251` `{kind:'echo'}` / `:253` `{kind:'echo_next_spell'}`; **REPLAY** `:260` `{kind:'replay_last'; times}`; **RECALL** `:257` `{kind:'reprise'; count; fireFree?}`
- **Forge / die-bank ops:** `reroll_spent`(:134), `refresh_die`(:137), `convert_die_color`(:139), `create_temporary_die{color}`(:143 KINDLE), `grant_pip{count,overflow?}`(:149), `overheat{pips}`(:158), `bank_spent_die`(:161), `forge_floating_die{color:'powering'|'wild'}`(:167), `float_x_die`(:172 TRANSMUTE)
- **TURNABOUT** `:246` `{kind:'turnabout'; burstPerRung}` — consumes `rungsDeniedTotal`

### 2.7 Status / debuff list (`src/Effects/debuffs.library.json`)

Live card-facing debuffs and their payloads:

| id | name | tier | dur | stacking | resistedBy/DR | payload |
|---|---|---|---|---|---|---|
| `debuff_poison` | Poison | 2 | 4 | intensity | body / 12 | `damageOverTime{damagePerRound:2, mentalAttack, trigger:'card-played'}` + `dotModifiers{escalatesPerTurn:true, rampFactor:0.5}` |
| `debuff_bleed` | Bleed | 2 | 3 | intensity | body / 12 | `damageOverTime{damagePerRound:3, physicalAttack, trigger:'damage-instance'}` + `dotModifiers{decaysPerTick:true}` |
| `debuff_mark` | Mark | 1 | 2 | intensity | — | `tickAmplifyFlat:1` + `dotModifiers{calendarExpiry:false}` (battle-long) |
| `debuff_backfire` | Backfire | 2 | 2 | intensity | mind / 12 | `backfirePerRung:1` |
| `debuff_quarter` | Quarter | 2 | 2 | intensity | heart / 12 | `outgoingDamageMulPct:-10` |
| `debuff_creeping_doom` | Doom | — | *no calendar* | intensity | — | grows +1 per foe action; ends only on consumption/combat end |
| `debuff_kindling_ember` | Kindling Ember | 1 | 3 | intensity | mind / 10 | `damageOverTime{1, mentalAttack, tickPhase:'start'}` |
| `debuff_nettle_sting` | Nettle Sting | 2 | 2 | intensity | body / 10 | `damageOverTime{2, physicalAttack, tickPhase:'end'}` |
| `debuff_curse` | Grelling's Malediction | 2 | 5 | none | body / 14 | statMods body-1/mind-1/heart-2, rollModifier -2 — *engine threat clock only, `non-card` tag* |

**There is no `petrify`, `stagger` (as an effect), or generic status list in the card-facing set.** Soft-control effects (confusion −5, fear −4, daze −3, slow −2, blind −5) exist in the wider effect library and feed `THREAT_WEAKEN_PER_ROLL = 0.06` / `THREAT_DENY_AT = 8` (`combat.engine.ts:133-135`), but no library card applies them. STAGGER is a **mechanic**, not an effect (`staggerRungs` counter). Player buffs mapped: `buff_thorns` (only card-facing one) + `SUPPORT_KEYWORD` mappings for `buff_regeneration/phoenix_vigor→Heal`, `buff_cleanse/absolved→Cleanse`, `buff_damage_reduction/all_stats_up/invincibility→Guard`, `buff_haste→Draw`, `buff_accuracy_up→Foretell`, `buff_critical_*_up/status_chance_up→Mark` (`keywords.ts:63-80`).

---

## 3. ENEMY DATA

### 3.1 Files

| Path | Lines | Role |
|---|---|---|
| `axiomancer-mechanics/src/Enemy/enemy.library.ts` | 2904 | The roster (73 `createEnemy` calls) + `EnemyLibrary` (72), `EnemiesByMap`, `ENEMY_REGISTRY` |
| `axiomancer-mechanics/src/Enemy/types.ts` | 326 | `Enemy` interface + `EnemyLogic`, `EnemyDifficulty`, `BefriendabilityConfig`, `FriendshipReward`, `FinalBlowLines`, `PactLines`, `CauseLines`, `LootTableEntry` |
| `axiomancer-mechanics/src/Enemy/index.ts` | 194 | `createEnemy`, `enemyStatBudget`, `DEFAULT_XP_BY_DIFFICULTY` |
| `axiomancer-mechanics/src/Combat/combat.enemy-cards.ts` | 1440 | `ENEMY_CARD_LIBRARY` — **108 enemy cards**, 7 archetypes |
| `axiomancer-mechanics/src/Combat/combat.enemy-decks.ts` | 228 | `ENEMY_DECKS` (72 decks), `DECK_STANCE_CHECKS`, `compileEnemyDeck` |
| `axiomancer-mechanics/src/Combat/combat.threat-sequences.ts` | 24 | `AUTHORED_THREAT_SEQUENCES` = decks compiled |
| `axiomancer-mechanics/src/Combat/combat.threat.ts` | 512 | `AuthoredThreatPhase`, `AuthoredThreatBranch`, `getThreatSequence`, `resolveAuthored`, `DIFFICULTY_MULT` |
| `axiomancer-mechanics/src/Enemy/loot.ts` | 63 | `rollLoot` |

**`devlog/data/enemies.json` does not exist in the tree** — it is a *generated* artifact, gitignored (`.gitignore` last block: `devlog/data/`). Produced by `npm run catalog:export` (`axiomancer-mechanics/scripts/export-catalog.ts`).

### 3.2 The `Enemy` schema (verbatim, `src/Enemy/types.ts:222-326`)

```ts
export interface Enemy {
    id: string;
    name: string;
    description: string;
    level: number;
    health: number;
    maxHealth: number;
    baseStats: BaseStats;               // { body, mind, heart }
    derivedStats: DerivedStats;
    mapName: MapName;
    logic: EnemyLogic;                  // 'random'|'aggressive'|'defensive'|'balanced'|'strategic'|'boss'
    difficulty?: EnemyDifficulty;       // 'simple'|'normal'|'elite'|'boss'|'unique'
    tier1Overrides?: Tier1EffectOverrides;
    procUnlocks?: ProcUnlocks;
    procOverrides?: ProcOverrides;
    cards?: Card[];
    loot?: LootTableEntry[];
    xpReward?: number;
    effects: ActiveEffect[];
    philosophicalAlignment?: PhilosophicalAlignment;   // {epistemology, outlook, scope} each -100..100
    friendshipReward?: FriendshipReward;
    befriendabilityConfig?: BefriendabilityConfig;
    finalBlowLines?: FinalBlowLines;    // {brutal, quiet, ironic}
    pactLines?: PactLines;              // {quiet, setDown, heavy}
    causeLines?: CauseLines;            // {brutal, broken, quiet}
    journalEntry?: CodexEntry;
    addedIn?: string;
    tags?: string[];
    portraitAsset?: string;             // 1:1 art law
    stanceHint?: string;
}
```

`BefriendabilityConfig` (`:29-53`): `{ roundsThreshold?, hpGate?{belowPct:0..1}, defaultFallback?:'both-defend-cap' }` — all present predicates AND-compose.
`FriendshipReward` (`:103-141`): `{ items?, xpBonus?, narrative?, flagSet?, alignmentDelta?, factionDeltas? }`.

**There is no `maxHealth`/`VITAE` authored field** — `createEnemy` derives it: `calculateMaxHealth(level, baseStats)` (`Enemy/index.ts:157`). Stats come from `enemyStatBudget(level, weights)` = `round(level × ENEMY_STAT_PER_LEVEL)` distributed by weight, then × `(1 + level × ENEMY_GEAR_TIER_PER_LEVEL)` (`Enemy/index.ts:91-139`). **Stat law: 5 × level** (pinned `Enemy/e2e/enemy.engine.test.ts:86-118`).
XP: `xpReward ?? level × DEFAULT_XP_BY_DIFFICULTY[difficulty]`, where the table is `{simple:10, normal:20, elite:50, boss:200, unique:500}` (`Enemy/index.ts:66-72`).

### 3.3 Counts

| | |
|---|---|
| `createEnemy` calls | **73** |
| `EnemyLibrary` | **72** (excludes `Sandbag_01`) |
| Roster (art-law) | **68** = 52 paintings + 9 (Phase W3) + 7 (Phase W4); pinned `Enemy/e2e/new-enemies.engine.test.ts:40-45` |
| By difficulty | boss 17 · elite 25 · normal 24 · simple 3 · unique 4 |
| Authored threat sequences | **72** (`AUTHORED_THREAT_ENEMY_IDS.length` pinned `hazard-pattern-combat-helpers.engine.test.ts:406`) |
| Maps | fishing-village 13 · northern-forest 39 · caverns 14 · northern-city 8 · connecting-river 4 · town-across-river 3 · aporia-colonnade 8 · aporia-archive 8 · aporia-proof 11 |

### 3.4 Threat sequences (2–5 phases)

`AuthoredThreatPhase` (`combat.threat.ts:34-98`) fields: `enemyStance`, `damageWeight?` (default 1.0), `threatEffectId?`, `threatIntensity?`, `enemyHeal?`, `enemyCleanse?`, `swayCleanse?`, `premiseShed?`, `glyphShatter?`, `curseCardId?`, `actionText`, `isFinalPhase?`, `stanceHint?`, `unlockAfterRound?`, `rungs?` (1-4), `stanceCheck?{punishes?,yields?}`, `stake?`.

Branches (`:108-114`): `AuthoredThreatBranch = { branch: { condition; then; else } }`; condition union is closed — `{kind:'bearer-afflictions-gte'; n}` | `{kind:'prior-threat-fully-blocked'}`. Zero RNG, commits at phase START (`commitThreatBranch`, `:163-189`).

**Damage budget** (`:274-283`): `THREAT_BASE = 4`, `THREAT_PER_LEVEL = 0.95`;
`threatDamageBudget = max(3, round((4 + 0.95×level) × dMult × (1 + 0.2×phaseIndex) × weight))`.
`DIFFICULTY_MULT` (`:197-199`): `{simple:0.7, normal:0.92, elite:1.08, boss:1.5, unique:1.45}`.
Global scale `THREAT_DAMAGE_SCALE = 1.7` (`combat.engine.ts:116`).

**DECK LAWS** (`combat.enemy-decks.ts:12-19`, pinned by the roster e2es):
- 2–5 cards per enemy (bosses 4–5); every id resolves.
- Escalation: the final card's `damageWeight` is the deck's maximum.
- THE COVETED DIE: boss/unique decks stake **exactly their second card**; never elite/normal/simple. Enforced in `wagersCovetedDie` (`:171-175`).
- Exactly one curse-injector card per **archetype** (not per deck).

Enemy-card schema `EnemyCard` (`combat.enemy-cards.ts:69-93`): `{ name, archetype, grade:'common'|'escalation'|'signature', stance, damageWeight?, effectId?, intensity?, enemyHeal?, enemyCleanse?, swayCleanse?, premiseShed?, glyphShatter?, rungs?, stake?, unlockAfterRound?, curseCardId?, branch?, actionText, stanceHint }`.
7 archetypes (`:36-38`): `drowned-parish, gnawing-court, omen-choir, bone-clergy, debt-office, old-fires, the-aporia`. 108 cards — bone-clergy 18, gnawing-court 17, omen-choir 16, the-aporia 16, debt-office 15, drowned-parish 13, old-fires 13; grades: common 28, escalation 24, signature 56.

Sample deck rows (`combat.enemy-decks.ts`): `'enemy-the-harbormaster': ['adjusters-visit','the-weighing','the-toll-entire','execution-of-the-agreement']` weights 0.95/0.9(stake)/1.3/1.4 (:99); `'enemy-the-incompleteness': ['the-sentence-outside','the-true-thing-about-you','a-new-axiom','you-cannot-go-on']` weights **0.21/0.232/0.271/0.326**, `debuff_mark` at 2/2/3/3 (:81).

### 3.5 Alt-win thresholds ("capitulate/concede")

`src/Combat/effects.ts:162-193`:
```ts
export const CONCEDE_PREMISES_BASE  = 8;   // CONDEMN — simple/normal
export const CONCEDE_PREMISES_ELITE = 10;
export const CONCEDE_PREMISES_BOSS  = 12;

export const CAPITULATE_RESOLVE_FRACTION = 0.35;
export const CAPITULATE_MIN = 10;
export function capitulateThreshold(enemy) {
    const resolve = Math.max(CAPITULATE_MIN, Math.round(CAPITULATE_RESOLVE_FRACTION * enemy.maxHealth));
    return Math.min(resolve, enemy.health);
}
```
`combat.engine.ts:1471`: `effectiveConcedeAt = max(card.concedeAt, concedeTierFloor)`.
PLEA milestones (`combat.engine.ts:1333-1400`, `effects.ts:195-240`): **Wavering** at 45% of live resolve → 1 QUARTER stack; **Faltering** at 80% → +2 bonus PLEA. Each fires at most once per combat, never un-fires.

### 3.6 Six representative enemies, verbatim

**NORMAL — `enemy-float-eye`** (`enemy.library.ts:134-160`) — the library's smallest block, `maxHealth = 15` (hermetic-test anchor):
```ts
export const FloatEye = createEnemy({
    id: 'enemy-float-eye', portraitAsset: 'float-eye', name: 'Float-Eye',
    stanceHint: 'It only watches — whatever it does next, it has watched you do first.',
    level: 1, baseStats: { body: 1, mind: 1, heart: 1 },
    mapName: 'fishing-village', difficulty: 'normal', logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    loot: [none(70), drop('minor-healing-potion', 25), drop('healing-potion', 5)],
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: 67 },
    finalBlowLines: {...}, causeLines: {...},
    addedIn: ADDED, tags: ['early-game', 'enemy'],
});   // xpReward = 1 × 20 = 20 · deck ['dp-first-bell','dp-undertow-grip','dp-breaking-sea'] 0.8→0.95→1.4
```

**NORMAL (W3 batch) — `enemy-seam-tick`** (`:1914-1940`):
```ts
export const SeamTick = createEnemy({
    id: 'enemy-seam-tick', portraitAsset: 'seam-tick', name: 'Seam Tick',
    level: 13, baseStats: enemyStatBudget(13, { heart: 1, body: 3, mind: 1 }),
    mapName: 'caverns', difficulty: 'normal', logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('body-elixir', 20), drop('healing-potion', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    addedIn: W3_ADDED, tags: ['mid-game', 'enemy'],
});   // 65 stat budget · deck ['dp-undertow-grip','gc-the-patient-inch','gc-the-alms-you-owed'] 0.95→1.1→1.35
```

**ELITE — `enemy-brine-hag`** (`:394-455`):
```ts
export const BrineHag = createEnemy({
    id: 'enemy-brine-hag', portraitAsset: 'brine-hag', name: 'Brine Hag',
    level: 7, baseStats: enemyStatBudget(7, { heart: 4, body: 1, mind: 2 }),
    mapName: 'fishing-village', difficulty: 'elite', logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { heart: { attack: 2, defend: 2 } },
    loot: [none(35), drop('heart-draught', 30), drop('healing-potion', 20), drop('resonance-crystal', 15)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    cards: [card('thin-hymn')],
    befriendabilityConfig: { hpGate: { belowPct: 0.3 }, roundsThreshold: 4 },
    friendshipReward: { items:[…], xpBonus: 35, alignmentDelta: { outlook:+2, scope:+1 },
                        flagSet: 'befriended-brine-hag', narrative: '…' },
    pactLines: {…}, journalEntry: { id:'codex-brine-hag', … }, finalBlowLines:{…}, causeLines:{…},
    addedIn: ADDED, tags: ['early-game','elite','enemy'],
});   // xp = 7×50 = 350 · deck ['dp-wet-congregation','dp-lead-bell','dp-drowning-drill','dp-breaking-sea'] 0.9→1.0→1.15→1.4
```

**BOSS #1 — `enemy-king-of-revenge`** (`:525-608`) — HAND-SET stats:
```ts
export const KingOfRevenge = createEnemy({
    id: 'enemy-king-of-revenge', portraitAsset: 'king-of-revenge', name: 'The King of Revenge',
    level: 6, baseStats: { body: 8, mind: 12, heart: 10 },      // 30 = 5 × 6 (stat law)
    mapName: 'fishing-village', difficulty: 'boss', logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { body: { attack: 3, defend: 3 }, heart: { attack: 2, defend: 2 } },
    loot: [drop('healing-potion', 50), drop('body-elixir', 30), drop('heart-draught', 20)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: -67 },
    cards: [card('knucklebone-recant'), card('passing-bell'), card('scolds-bridle')],
    befriendabilityConfig: { hpGate: { belowPct: 0.7 }, roundsThreshold: 1 },
    friendshipReward: { items:[…], xpBonus: 75, flagSet: 'befriended-king-of-revenge',
        alignmentDelta: { outlook: +3, scope: -2 },
        factionDeltas: { 'coastal-guard': -8, 'merchant-guild': +10 } },
    finalBlowLines:{…}, pactLines:{…}, causeLines:{…}, journalEntry:{ id:'codex-king-of-revenge', … },
    addedIn: ADDED, tags: ['early-game','boss','enemy'],
});   // xp = 6×200 = 1200 · deck ['dp-first-bell','sig-king-grievance'(stake),'dp-drowning-drill','sig-king-last-ruling'] 0.8→0.85→1.15→1.4
```

**BOSS #2 — `enemy-the-harbormaster`** (`:2149-2184`), Phase W3:
```ts
export const TheHarbormaster = createEnemy({
    id: 'enemy-the-harbormaster', portraitAsset: 'the-harbormaster', name: 'The Harbormaster',
    level: 18, baseStats: enemyStatBudget(18, { heart: 2, body: 1, mind: 3 }),   // 90 budget
    mapName: 'northern-city', difficulty: 'boss', logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { body:{attack:3,defend:3}, mind:{attack:3,defend:3}, heart:{attack:2,defend:2} },
    loot: [drop('philosopher-tea',40), drop('void-essence',30), drop('revive-crystal',20), drop('resonance-crystal',10)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 0 },
    finalBlowLines:{…}, causeLines:{…},
    addedIn: W3_ADDED, tags: ['mid-game','boss','enemy'],
});   // xp = 18×200 = 3600 · NO cards[], NO befriendability, NO journalEntry
```

**BOSS #3 (labyrinth) — `enemy-the-sophist`** (`:2551-2621`):
```ts
export const TheSophist = createEnemy({
    id: 'enemy-the-sophist', name: 'The Sophist',      // NO portraitAsset
    level: 16, baseStats: enemyStatBudget(16, { heart: 2, body: 1, mind: 4 }),   // 80 budget
    mapName: 'aporia-proof', difficulty: 'boss', logic: 'boss',
    procUnlocks: { mind:{attack:3,defend:3}, heart:{attack:3,defend:3}, body:{attack:2,defend:2} },
    loot: [drop('philosopher-tea',35), drop('clarity-serum',25), drop('greater-healing-potion',20), drop('revive-crystal',20)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 67 },
    cards: [card('ossuary-drawer'), card('shallow-grave'), card('scolds-bridle')],
    befriendabilityConfig: { hpGate: { belowPct: 0.25 }, roundsThreshold: 6 },
    friendshipReward: { …, xpBonus: 120, factionDeltas: { 'forest-wardens': +8 } },
    addedIn: APORIA_ADDED, tags: ['mid-game','boss','enemy','labyrinth'],
});   // deck ['your-position-improved','a-courteous-concession'(stake),'signed-in-thirds','your-opening-perfected'] 1.0(rungs:2)→0.9→1.2→1.4
```

**UNIQUE #1 — `enemy-kudan`** (`:636-683`):
```ts
export const Kudan = createEnemy({
    id: 'enemy-kudan', portraitAsset: 'kudan', name: 'Kudan',
    level: 10, baseStats: { body: 6, mind: 7, heart: 7 },      // hand-set, 20 (NOT 5×level)
    mapName: 'northern-forest', difficulty: 'unique', logic: 'strategic',
    procUnlocks: { body:{attack:3,defend:3}, mind:{attack:3,defend:3}, heart:{attack:3,defend:3} },
    loot: [drop('void-essence',60), drop('philosopher-tea',30), drop('revive-crystal',10)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 67 },
    cards: [card('spoiled-poultice')],
    journalEntry: { id: 'codex-kudan', … },
    addedIn: ADDED, tags: ['mid-game','unique','enemy'],
});   // xp = 10×500 = 5000 · NO befriendability · deck ['the-tally-mark','wept-in-advance'(stake),'the-calamity-spoken'] 0.85→0.9→1.3
```

**UNIQUE #2 — `enemy-the-incompleteness`** ("The Unfinished", the playtest ceiling, `:2660-2702`):
```ts
export const TheIncompleteness = createEnemy({
    id: 'enemy-the-incompleteness', name: 'The Unfinished',
    level: 110, baseStats: { heart: 184, body: 183, mind: 183 },   // 550 = 5 × 110 (stat law)
    mapName: 'northern-forest', difficulty: 'unique', logic: 'boss',
    procUnlocks: { body:{attack:3,defend:3}, mind:{attack:3,defend:3}, heart:{attack:3,defend:3} },
    loot: [none(100)],                                             // drops nothing
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 67 },
    cards: [card('ossuary-drawer'), card('spoiled-poultice'), card('shallow-grave')],
    addedIn: '2026-07-02', tags: ['impossible','playtest-ceiling','late-game'],
});   // NO befriendabilityConfig ("mercy is not an out"), absent from every EnemiesByMap pool
```

---

## 4. COMBAT ENGINE HOOKS

### 4.1 Files

| Path | Lines | Role |
|---|---|---|
| `src/Combat/combat.engine.ts` | 5287 | THE engine |
| `src/Combat/combat.encounter.types.ts` | 1063 | `CombatEncounterState`, `CombatEvent` union, `CombatThreatPhase`, `GlyphPayload` |
| `src/Combat/combat.dice.ts` | 330 | dice bag, Reserve, pips, overheat |
| `src/Combat/combat.threat.ts` | 512 | threat resolution |
| `src/Combat/combat.starter-deck-presets.ts` | 349 | **the deck presets** (this is the "combat.deck-presets.ts" you named) |
| `src/Combat/combat.cards.ts` | 510 | `toCombatCard`, `mechanicText`, `riderText` (face projection) |
| `src/Combat/effects.ts` | 1026 | DoT clocks, `capitulateThreshold`, concede floors |
| `src/Combat/types.ts` | 108 | `Stance`, `CombatState` |
| `src/Combat/combat.playtest.ts` | 847 | matrix harness + `PRESET_DOCTRINE_WIN_BANDS` |
| `src/Combat/combat.encounter.sim.ts` | 1127 | `runOneEncounter` |
| `src/Combat/combat.deck.ts` / `combat.deck-draft.ts` / `combat.rewards.ts` | 104/303/221 | deck build, drafts, rewards |

### 4.2 How a card effect resolves

Entry point `playCombatCard(state, uid, play?, rng?)` (`combat.engine.ts:1028`), which branches to:
- `playTopAction` (`:1819`) — the **FREE** line, dieless
- `playBottomAction` (`:1854`, ~1600 lines) — the **PAID** line: THE COLOR LAW check (`:1947`), then read/pips/colour-match scaling, then `combatEffects` → then `specialMechanics` in authored order → then condition lines (`threshold`/`dieBonus`/`fate`/`fallen`/`synergy.statePredicate`) via `applyRiderToState` (`:1524`)
- `playFreeEnchant` (`:1774`) — oath/hex timed FREE instance

Supporting resolvers: `applyEnemyDamage` (`:1240`), `gainSouls` (`:1299`), `gainSway` (`:1333`), `gainPremises` (`:1428`), `applyForetell` (`:1490`), `computeRungDenial` (`:3505`), `settleStake` (`:3535`), `resolveThreatPhase` (`:3576`), `processBetweenPhases` (`:4147`), `crackGlyph` (`:4909`), `endCombat` (`:3487`).

Legacy `executeCard` in `src/Cards/card.engine.ts` **no-ops** every combat-engine-owned mechanic (guard/rupture/barrier/riposte/forge/…).

Preview/projection selectors (all pure, `:5044-5265`): `projectCardImpact`, `projectRupture`, `projectRuptureBurst`, `projectSiphonHeal`, `projectReapAll`, `projectIncomingThreat`, `projectCombatOutcome`, `recoilXRange`, `cardReadPreview`, `cardDieCostPreview`, `getDisruptMeter`.

### 4.3 Dice ↔ cards ↔ momentum

- `rollTurnDice(turn, count=3)` (`combat.dice.ts:75`) → `draftStanceDie` (`engine:710`) → one die powers one PAID play.
- Read: `resolveRead(dieColor, enemyPhaseStance)` (`engine:357`) → `READ_DAMAGE_MULT = {advantage:1.5, neutral:1.0, disadvantage:0.5, none:1.0}` (`:101-103`). P0-truth read rule: advantage → `+READ_ADVANTAGE_INTENSITY_BONUS(1)` intensity; disadvantage → `-READ_DISADVANTAGE_DURATION_PENALTY(1)` turn, floor 1 (`:215-216`).
- Colour match: `COLOR_MATCH_DAMAGE_BONUS = 3` (`:112`), `COLOR_MATCH_STATUS_DURATION_BONUS = 1` (`:227`).
- Pips: `PIP_INTENSITY_BONUS = 1`, `PIP_GUARD_BONUS = 2` (`:222,:224`).
- Fate tap: `FATE_TAP_CONVICTION = 1`, once per turn (`:229`, `fateTappedTurn`).
- **Momentum wheel** — engine-native (`advanceMomentumWheel`, `:278`): `WHEEL_ORDER = ['heart','body','mind']` (`:235`); lights on each LANDED play in the next wheel stance; wrong/repeated stance resets to just that stance; the third node mints a one-shot **wild** floating die prefixed `momentum-`, always `temporary: true` (never persists past the fight, owner-ratified 2026-07-10). Mobile mirror: `axiomancer-mobile/state/combat/momentum.ts`.

### 4.4 Stance RPS

```ts
/** Heart > Body > Mind > Heart. True if stance `a` beats stance `b`. */
export function stanceBeats(a: Stance, b: Stance): boolean {
    return (a === 'heart' && b === 'body')
        || (a === 'body'  && b === 'mind')
        || (a === 'mind'  && b === 'heart');
}
```
— `combat.engine.ts:319-323`.
`defaultStanceCheck(enemyStance)` (`combat.threat.ts:451-453`) = `{ punishes: enemyStance, yields: rotateStance(enemyStance, 1) }` — punish ×1.5, yield ×0.5 + 1◆; **only resolved when the upgradeable-dice flag is on**. `DECK_STANCE_CHECKS` (`combat.enemy-decks.ts:147-162`) hand-authors 14 enemies' checks; the rest backfill.

### 4.5 The round/turn law ("Gate 0", 2026-07-10)

`CombatEncounterState.turnTakenThisPhase?: boolean` (`combat.encounter.types.ts:733`). `startTurn` (`engine:552`) stamps it; a second `startTurn` in the same threat phase is **refused** with a `turn-law-blocked` event; `resolveThreatPhase` / `processBetweenPhases` re-arm it at the phase boundary. **The law caps TRAY ROLLS, not card plays** — Reserve and floating dice still power extra plays within the turn. This closed the **Conviction farm** (the pre-law engine re-rolled a fresh 3-die tray any time the draft slot was empty). Test: `src/Combat/e2e/turn-law.engine.test.ts`.

### 4.6 DoT trigger families

`DotTriggerClock` (`src/Effects/types.ts:68`):
```ts
'round-start' | 'round-end' | 'card-played' | 'damage-instance' | 'payoff'
```
- **Round-clock** (`round-start` / `round-end`) — aliases the legacy `tickPhase` field. Used by `debuff_kindling_ember` (start), `debuff_nettle_sting` (end), `debuff_creeping_doom` (round-start drip).
- **Event-triggered** (`card-played` / `damage-instance` / `payoff`) — **never tick at the round boundary**. POISON = `card-played` (player-side plays only, ratified); BLEED = `damage-instance`; `payoff` fires inside RUPTURE/`consume_affliction` **before** consumption.
- `calendarExpiry: false` → battle-long, no round-end countdown (MARK; DOOM has no calendar at all).
- Fuel forecast: `EXPECTED_TRIGGERS_PER_ROUND` (`Combat/effects.ts`) reads 2 for the card-played clock; the *pricing* model uses D3's measured **1.83 PAID plays/round** (`pricing.engine.test.ts:86-91`).
- Resolvers: `fireDotTrigger`, `growPerEnemyActionDots`, `processRoundStartEffects`, `processRoundEndEffects`, `processDamageOverTime`, `tickAllEffects`, `getPendingDotTotal`, `computeRoundsToKill`. Test: `src/Combat/e2e/dot-trigger-clocks.engine.test.ts`.

### 4.7 Mercy / befriend outcomes

`selectMercyChoice(state, 'spare'|'exploit')` (`engine:4819-4845`):
- `spare` → `finalOutcome = 'mercy'`, `combat-ended` event.
- `exploit` → free heavy strike `max(10, round(enemy.maxHealth * 0.5))`; kills → `'victory'`, else combat continues from `phase-play`.

`selectCapitulationChoice(state, 'accept'|'continue')` (`:4795-4810`): `accept` → `endCombat(…, 'capitulate')`; `continue` sets `capitulationDeclined` so the same offer never reopens.

Befriend eligibility: `friendshipCounter >= FRIENDSHIP_COUNTER_MAX` AND all present `befriendabilityConfig` predicates (`roundsThreshold`, `hpGate.belowPct`). Reward layering: half-XP + full loot + `moralMeter +1` base, then `FriendshipReward` **augments** (never replaces).

### 4.8 The five combat resource counters

`CombatEncounterState` (`combat.encounter.types.ts`):

| # | Field | Line | Meaning |
|---|---|---|---|
| 1 | `conviction: number` | :736 | ◆ bank, cap 12, funds Signature Skills |
| 2 | `premises?: number` (**CHARGE**) | :855 | the running tally; `premiseMilestoneTotal` (:863) is the lifetime, never-resets milestone counter |
| 3 | `souls?: number` | :892 | Harvest currency, +1 per enemy affliction expiring/consumed |
| 4 | `sway?: number` (**PLEA**) | :895 | decays 1/turn; ≥ `capitulateThreshold` at a turn boundary → RELENT offer |
| 5 | `staggerRungs?: number` | :868 | rungs against the enemy's NEXT telegraph; `rungsDeniedTotal` (:~) is the consumable TURNABOUT ledger |

Adjacent ledgers (not "counters" but same lifecycle): `akrasiaDebt`, `rungsDeniedTotal`, `omenHits`, `recoilPaidThisTurn`, `enemyDamageThisTurn`/`enemyDamageLastRound`, `scrapsThisTurn`, `enemyDotDamageThisRound`, `lastThreatFullyBlocked`, `bossRungGrowth`, `stakeEscalationBonus`, `resonance{heart,body,mind}` (TOLL ⬡).

Defensive pools: `guard?` (per-phase), `barrier?` (persistent stacking), `riposte?{damage,reduce}` (one phase).

### 4.9 THE CLOCK (escalation)

`combat.engine.ts:164-202`: `THREAT_ESCALATION_PER_ROUND = 0.22`, `THREAT_ESCALATION_GRACE = 1`, `THREAT_ESCALATION_MAX = 2.0`, `THREAT_ESCALATION_BOSS_MULT = 1.6`, `THREAT_EFFECT_ESCALATION_STEP = 0.34` (+1 status intensity per step), `THREAT_ENCHANT_CURSE_EVERY_ROUNDS = 5` (50/50 `buff_all_stats_up` / `debuff_curse`). Rage phase (generated sequences only): `RAGE_UNLOCK_ROUND = 6`, `RAGE_DAMAGE_WEIGHT = 1.6`, `RAGE_HEAL_FRACTION = 0.5` (`combat.threat.ts:433-435`). `MAX_PHASES = 60` safety cap (`engine:92`).

### 4.10 Deck presets (`combat.starter-deck-presets.ts`)

Three presets = **snapshots of one deck evolving**: THREADBARE 18 → PILGRIM 30 → APOSTATE 45, hard cap `DECK_SIZE_HARD_CAP = 50` (:65).
Laws (:22-30, pinned by `deck-presets.engine.test.ts`): sizes 18/30/45; **exact aspect thirds 6/6/6 · 10/10/10 · 15/15/15** (the generalized colour law); ≤4 copies of any card; **LINEAGE LAW** — each preset = predecessor − `*_REMOVED` + `*_ADDED` as multiset equality (`PRESET_LINEAGE`, :169).
`THREADBARE_COUNTS` (:68-79): spoiled-poultice 3, chilblain-watch 3, petty-indictment 2, first-spadeful 3, grandmothers-psalter 1, thumbprick-oath 2, thin-hymn 3, threadbare-cope 1.
`PRESET_DICE_VALVES` (:281) — the flag-on D8 seats swapping one same-aspect starter for its valve relic.

---

## 5. VALIDATION / TESTS / GUARDS

### 5.1 npm scripts

**Root `package.json`:**
```
verify           = verify(mechanics) && verify(mobile) && verify(card-editor)
test             = node --test scripts/{ci-e2e-scope, check-naming-law, check-lexicon, check-prose,
                                        content-drift, loop-issue, axio-mcp-server, check-devlog-not-served}.test.mjs
lint:prose       = node scripts/check-prose.mjs
lint:names       = node scripts/check-naming-law.mjs --sweep
lint:content     = lint:prose && lint:names
lint:grants      = node scripts/check-harness-grants.mjs
baseline:check   = node scripts/check-baseline-freshness.mjs
baseline:regen   = node scripts/regen-deck-matrix-baseline.mjs
catalog:export   = npm --workspace axiomancer-mechanics run catalog:export
catalog:build    = node scripts/build-catalog.mjs
catalog          = catalog:export && catalog:build
site:build       = catalog && devlog:build
deploy:check     = node scripts/deploy-check.mjs
```

**`axiomancer-mechanics/package.json`:**
```
verify       = type-check && type-check:tests && type-check:cli && lint && test && build
verify:agent = … vitest run --reporter=./automation/agent-vitest-reporter.mjs …
test         = vitest run
type-check   = tsc --noEmit          type-check:tests = tsc -p tsconfig.tests.json
type-check:cli = tsc -p tsconfig.cli.json
build        = tsc && tsc-alias
catalog:export = ts-node --transpile-only scripts/export-catalog.ts
combat-sim / combat-playtest / combat-dice-economy = ts-node src/CLI/*.cli.ts
```

**`axiomancer-mobile/package.json`:**
```
verify = lint && typecheck && test && assets:check && art:test
test   = jest        typecheck = tsc --noEmit        lint = eslint app components
e2e:combat-round / e2e:minigames / verify:visual / critique:drive  (Playwright, NOT in verify)
```

**`axiomancer-card-editor/package.json`:**
```
verify = type-check && lint && test && build      test = vitest run
```

### 5.2 Guards that constrain CARD data

| Path | What it pins |
|---|---|
| `axiomancer-mechanics/src/Cards/e2e/curated-library.engine.test.ts` | 57 unique cards (:36); one of 7 themes each (:41); **7-card package shape per archetype** (:47-58); 8 starters / 3 valves / 4 curses (:61-66); curse = rank-1 + purge_self (:69-74); **every SPELL authors a non-empty `free`** (:85-96); oath/hex author **no** `free` (:98-102) and **must** have `persistentEffect` (:104-108); theme==tag-derived theme (:110-115); presets never seat a curse (:117-124); 34/23 preset/reward split (:127-139); oath→self, hex→enemy (:152-159); **source never mentions `basePower`/`chipHp`** (:163-167); no runtime HP-damage field (:169-177); `addedIn >= '2026-08-08'` (:192); reward pool = 53 (:207); no unreachable `dieBonus` under the colour law (:215-220) |
| `axiomancer-mechanics/src/Cards/e2e/pricing.engine.test.ts` | ⛔ **RANK_BANDS** (:41-45) `common:[1.5,7.5] uncommon:[4.5,13] rare:[7,19]`; **every priced spell must score in-band** (:57-64); 41 priced spells + 4 curses (:52-55); rank-monotone averages (:66-76); oath/hex score 0 (:78-82); DoT pricing anchors (:85-120) |
| `axiomancer-mechanics/src/Cards/e2e/roles-themes.engine.test.ts` | Sandbox role-set contents + the same `RANK_BANDS` (:86) |
| `axiomancer-mechanics/src/Cards/e2e/sequencing-grammar.engine.test.ts` | `RANK_BANDS` (:75), `opening`/`finale` predicate grammar |
| `axiomancer-mechanics/src/Cards/e2e/bridge-rewards.engine.test.ts` / `haunts.engine.test.ts` | `RANK_BANDS` again (:69 / :376) — **four independent copies of the band table** |
| `axiomancer-mechanics/src/Combat/e2e/paid-summary-honesty.engine.test.ts` | ⛔ **number parity** (every number `paidText` prints must appear verbatim in `paidSummary`); UPPERCASE runs must be registry keywords; **≤130 chars**; terminal punctuation; **no em dash, no semicolon**; "the foe" not "the enemy"; spells-only |
| `axiomancer-mechanics/src/Combat/e2e/combat-playtest.card-coverage.sim.test.ts` | 57 cards (:93-94); **every one of the 53 non-curse cards must register a play** under 3 fallback seeds — the dead-card detector |
| `axiomancer-mechanics/src/Combat/e2e/deck-presets.engine.test.ts` | Sizes 18/30/45, **exact aspect thirds** (:86), ≤4 copies, lineage multiset equality, 57-card pin (:177) |
| `axiomancer-mechanics/src/Combat/e2e/combat-playtest.line-telemetry.sim.test.ts` | Soft **85/15 FREE/PAID dominance bands**; `intentionallyAsymmetric` is the exemption |
| `axiomancer-mobile/state/presenters/__tests__/card-face-honesty.guard.test.ts` | ⛔ **no card may render the ambiguous PAID fallback** (`keyword:'DEBUFF'` / `'buff yourself'`); oath/hex must print the timed FREE truth; no type chip in keyword panel; **WI-2: every event-triggered DoT face names its trigger, never a round-clock lifetime**; no face string says "HP" (must be VITAE); **every printed keyword has a popup**; every FREE effect draws its own silhouette; BOON/HONE/TEMPER resolve a gloss |
| `axiomancer-mobile/state/combat/__tests__/keywords.test.ts` | ⛔ **KW-2: `allRegistryKeywords().length === 42`** (:41); KW-1 every applied effect id maps to a keyword; KW-3 no dead `MECHANIC_KEYWORD` rows; KW-6 theme families ⊆ registry |
| `axiomancer-mechanics/src/Combat/e2e/themed-decks.engine.test.ts` | pins the **240-damage uncapped REAP-ALL burst** |
| `axiomancer-mechanics/src/Combat/e2e/legibility-sweep.engine.test.ts`, `terminology-boundary.engine.test.ts`, `preview-truth.engine.test.ts`, `erosion-paid-wording.engine.test.ts`, `choir-card-wording.engine.test.ts` | wording/preview honesty |

### 5.3 ⛔ Guards that would BLOCK a numeric scale-up

Rewrite these rather than working around them:

1. **`pricing.engine.test.ts:41-64` + its three clones** (`roles-themes:86`, `bridge-rewards:69`, `haunts:376`) — the `RANK_BANDS` ceiling of **19** points is the single hardest cap on card power. Raising card numbers ~2× fails every rare.
2. **`cards.pricing.ts` `VERB_POINTS` (:26-…)** — the scoring table itself: `draw:2, guardPerHp:1/4, barrierPerHp:1/3, healPerHp:1/3, cleanse:1.5, swayPerStack:0.9, staggerPerRung:2, foretellPerCard:1, premise:0.8, concedeCapstone:3, soul:0.75, conviction:1, tickOne:0.6, kindle:2.5, kindleWildBonus:0.5, pip:1.5, forgeFloating:5, forgePersistence:3, forgeWildBonus:1, rupture:4, ruptureExpectedFuel:8, …`, plus `DOT_TEMPO_SURVIVAL = 0.75` and `CONDITION_DISCOUNTS` (threshold ×0.5, dieBonus ×0.6, fate ×0.7).
3. **`pricing.engine.test.ts:85-120`** — pinned DoT arithmetic anchors: `dotLifetimeHp('debuff_poison',1,4) === (2+2+3+3)×1.83`; `dotLifetimeHp('debuff_bleed',2,2) === 9`, `(3,2) === 18`; `dotLifetimeHp('debuff_creeping_doom',2,3) === 14`; `dotTempoWeightedHp('debuff_poison',1,4) ≈ 11.81`. **Changing a DoT's `damagePerRound` in `debuffs.library.json` breaks these.**
4. **`paid-summary-honesty.engine.test.ts`** — the ≤130-char budget and number-parity: changing any card number without rewriting its `paidSummary` fails.
5. **`combat-playtest.balance-bands.sim.test.ts`** — `PRESET_FLOORS = {early:0.2, mid:0}` (:110-113), `PRESET_CEILING = 1.0` (:114), and **`KNOWN_CURVE_VIOLATORS: readonly string[] = []`** (:198) with `expect(failing).toEqual(KNOWN_CURVE_VIOLATORS)` (:238). **This is an exact-set assertion** — any preset that starts or stops failing the monotone-decay curve breaks it. `evaluateWinRateCurve(points,'starter')` + `CURVE_SHAPE_TOLERANCES.starter.minTotalMove` live in `src/Combat/combat.curve-shape.ts`. **Note:** the file's own header still speaks of "ten themed presets"; the doc comment is stale, the code iterates `COMBAT_DECK_PRESET_ORDER` (3).
6. **`PRESET_DOCTRINE_WIN_BANDS`** (`src/Combat/combat.playtest.ts:133`) — the early ~80% / mid ~50% / late ~25-35% / impossible 0% doctrine curve, reported as `doctrineDelta` (:418).
7. **Enemy stat law 5×level** — `src/Enemy/e2e/enemy.engine.test.ts:86-118` pins King of Revenge = 30, Tri-Eyes = 75, Mirac = 90.
8. **Roster/deck count pins** — `new-enemies.engine.test.ts:40-45` (68 roster), `hazard-pattern-combat-helpers.engine.test.ts:406` (72 authored sequences), `card-coverage.sim.test.ts:93` + `deck-presets.engine.test.ts:177` + `curated-library:36` (57 cards), `keywords.test.ts:41` (42 keywords).
9. **`combat-playtest.card-coverage.sim.test.ts`** — no card may be unplayable; adding gated/expensive cards fails it.
10. **Already-SUSPENDED (safe to ignore, but note the skips):** `hazard-pattern-combat.balance.sim.test.ts:96` is `describe.skip` "PROFANE-CANON SUSPENSION (2026-08-08)"; same suspension notes at `combat-dice-economy.sim.test.ts:130` and `status-depth.balance.sim.test.ts:59`.

### 5.4 Measured baselines / sim harness

- `npm run baseline:check` → `scripts/check-baseline-freshness.mjs`; `npm run baseline:regen` → `scripts/regen-deck-matrix-baseline.mjs`. Baselines live at `axiomancer-mechanics/docs/reports/baselines/*.json`.
- Sim CLIs: `npm run combat-playtest -w axiomancer-mechanics` (matrix + qualitative agents), `npm run combat-sim`, `npm run combat-dice-economy`.
- `.claude/commands/deck-tuning.md` is the card-forge skill (full card authority; sandbox A/Bs); `.claude/commands/combat-playtest.md` reports only.
- Session-start hook prints baseline freshness (`guard.mjs` `sessionStart`, :~218-238) — mechanizes CLAUDE.md's "cite the baseline's stamp".

### 5.5 `.claude/settings.json` hooks + `guard.mjs` rules

`.claude/settings.json` hook wiring:
```
PreToolUse  Bash                → guard.mjs pre-bash
PreToolUse  Write|Edit|MultiEdit→ guard.mjs pre-write
PreToolUse  Skill|SlashCommand|Task|Agent → telemetry.mjs tool
PostToolUse Write|Edit|MultiEdit→ guard.mjs post-write
UserPromptSubmit               → telemetry.mjs prompt
SessionStart                   → git config core.hooksPath .githooks ; guard.mjs session-start
Stop                           → guard.mjs stop
```

**`pre-write` WRITE_BLOCKS** (`.claude/hooks/guard.mjs:159-178`) — exit 2 (hard block):
| name | test | why |
|---|---|---|
| `kb-sync-dir` | `rel === 'kb'` or `rel.startsWith('kb/')` | gitignored sync of game-knowledge-base; edits destroyed by `scripts/kb-sync.mjs` |
| `measured-baseline` | `/\bdocs\/reports\/baselines\/[^/]+\.json$/` | baselines are MEASURED truth; use `npm run baseline:regen` |

**`post-write`** (`:194-217`) — after any **`.md`** write, runs `node scripts/check-lexicon.mjs <file>`; non-zero → **exit 2** with the findings fed back. Applies zone/banner/pragma exemptions itself.

**`pre-bash` RULES** (`:48-113`) — block: `no-verify` (`git commit --no-verify|-n`), `force-push` (`--force`/`--force-with-lease`/`-f`/`+ref`), `destructive-reset` (`git reset --hard`, `git clean -f*`, `git checkout .`, `git branch -D main`), `commit-message-from-file` (`-F`/`--file`), `trailer-or-emoji-in-commit` (Co-Authored-By or emoji in a commit command), and `backgroundedGate` (never run verify/deploy:check/e2e/test with `run_in_background`).
`settings.json` also has a hard `deny` list mirroring the force-push/reset rules.

**`check-lexicon.mjs` exemptions** (`scripts/check-lexicon.mjs:44-63`): ZONE_DIRS = `node_modules/ .git/ kb/ tmp-images/ .claude/worktrees/ devlog/ braindump/ docs/reports/ docs/adr/ automation/ specs/`; ZONE_BASENAMES = `CHANGELOG.md RELEASES.md lexicon.json TELEMETRY.md`; `plan/` is zoned **except `plan/bearings.md`**. Banner exemption: `**Status:** HISTORICAL` in first 40 lines. Pragma: `<!-- lexicon-ok: id, id -->`.

---

## 6. CARD EDITOR + MOBILE

### 6.1 `axiomancer-card-editor`

- Consumes mechanics **live from source** via the `@mechanics` Vite/tsconfig alias → `../axiomancer-mechanics/src` (`vite.config.ts:38-42`).
- Adapter: `src/data/mechanics.ts` — the single bridge. Imports `cardLibrary`, `getCardById` from `@mechanics/Cards/cards.library`; `effectsLibrary`, `lookupEffect` from `@mechanics/Effects/effects.library`; `rankToRarity`, `CARD_RANK_NAMES` from `@mechanics/Cards/types`; `toCombatCard` from `@mechanics/Combat/combat.cards`. Deliberately **avoids the `@mechanics/index` barrel** (node-only code). Exposes `EFFECTS` / `DEBUFF_EFFECTS` `EffectOption[]` for dropdowns and hand-maintains `SPECIAL_MECHANIC_KINDS`.
- **Drift guard:** `src/data/mechanics.contract.ts` — two `AssertNever` type assertions binding the editor's `SpecialMechanicKind` to mechanics' `CardSpecialMechanic['kind']` in both directions. A kind added to the union without an editor row is a `type-check` failure. (Born from commit `edba726`, which left `verify-card-editor` red on `main` for half a day.)
- **Write-back:** `src/server/cardEditorPlugin.ts` + `src/server/cardCodegen.ts` — a Vite dev-server plugin mounting `GET/POST /api/cards`, `DELETE /api/cards/:id`, which **rewrites `axiomancer-mechanics/src/Cards/cards.library.ts` in place**: locates the `const <ident>: Card = {…}` block by id, replaces it, and keeps it a member of the exported `cardLibrary` array, matching the file's existing formatting. Round-trip test: `src/server/__tests__/round-trip.test.ts`.
- Components: `src/components/CardFace.tsx`, `CardForm.tsx`, `tabs/{CreateTab,EditTab,DummyTab}.tsx`, `form/KeywordHint.tsx`.
- Dev server on port **5174**, `host: true` (LAN, for phone testing).

### 6.2 Generated catalog

`axiomancer-mechanics/scripts/export-catalog.ts` (run: `npm run catalog:export`) writes:
- `devlog/data/cards.json`, `enemies.json`, `effects.json`, `meta.json` (commit + generatedAt stamp)
- `devlog/assets/catalog/cards/*`, `devlog/assets/catalog/enemies/*` (copied art)

It imports `cardLibrary`/`getCardById`, `toCombatCard`, `CARD_RANK_NAMES`/`rankToRarity`, `FREE_ENCHANT_ROUNDS`, `cardOrigin`, `THEME_KEYWORDS`, `mechanicText`/`riderText`, `EnemyLibrary`, `effectsLibrary`/`lookupEffect`, and — crossing the package boundary — `axiomancer-mobile/components/combat/statusGlyphs` (`effectGlyph`) and `axiomancer-mobile/state/combat/keywords` (`keywordForEffect`). Art registries are recovered by **text-parsing** the mobile `index.ts` Metro `require()` literals (`parseEnemyArt`, `parseCardArt`).

`scripts/build-catalog.mjs` (`npm run catalog:build`) renders `devlog/catalog.html` — zero-dependency, reads only the committed JSON + copied art.

⚠️ **`devlog/data/` is gitignored** (`.gitignore` final block, phase 57) — the JSON does not exist in a fresh checkout. Run `npm run catalog` (or `npm run site:build`) to regenerate.

### 6.3 Where mobile hardcodes ids

| Path | What |
|---|---|
| `axiomancer-mobile/state/mocks/combat.mock.ts:8-18` | `createMockEncounterEnemy()` hardcodes `id:'enemy-brine-hag'`, `level:3`, `baseStats:{heart:5,body:6,mind:7}`, `difficulty:'elite'` — a placeholder that does **not** match the real Brine Hag (level 7, budget stats) |
| `axiomancer-mobile/app/combat-encounter/index.tsx:36-39` | reads `globalThis.__AXM_COMBAT_DECK__` before the sandbox route boots (inert in production) |
| `axiomancer-mobile/state/combat/flags.ts:16` | documents the `__AXM_COMBAT_SEED__` / `__AXM_COMBAT_DECK__` test-global pattern |
| `axiomancer-mobile/state/combat/momentum.ts:23-37` | `WHEEL_ORDER = ['heart','body','mind']`, `nextWheelStance`, `wheelNext`; `momentumV2A11y` for the spec-33 chain. Rules are engine-native now; this is a11y/UI only |
| `axiomancer-mobile/state/combat/keywords.ts` | the whole keyword registry (see §2) |
| `axiomancer-mobile/state/combat/__tests__/deck-presets.test.ts` / `starter-bundles.test.ts` / `combat-reward-draft.test.ts` | preset id expectations |
| `axiomancer-mobile/state/presenters/combat-encounter.engine.ts:967-1005` | `enemyPane` — the WI-5 alt-win meters: `sway`/`swayTarget = capitulateThreshold(e)`, `premises`/`premiseAt = state.peroration?.at ?? 0`, visibility via `deckFeedsMechanic(state, ['sway'])` / `['premise','peroration','spend_premises']` |
| `axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1953` | per-mechanic face text (`riposte` case shown) — `mechanicHeadline` is the sibling of `MECHANIC_KEYWORD` |

---

## 7. PLAN DOCS + THE LAWS TO REPEAL

### 7.1 Doc inventory (2-line gists)

**`plan/tuning/2026-07-10-*.md` — the 33-agent engagement audit batch (T direct, 2026-07-10):**

| File | Gist |
|---|---|
| `2026-07-10-engagement-overhaul-roadmap.md` | Umbrella roadmap from a 33-agent fan-out audit (~3.8M tokens, 1279 tool calls); proposals survived an adversarial refutation pass. Became EA-1..EA-8 → build-plan Phases 26-33. |
| `2026-07-10-turn-law-and-honest-baseline.md` | **Gate 0.** Blocks every numeric tuning decision: `startTurn` re-rolled a fresh 3-die tray any time the draft slot was empty = a Conviction farm inflating every measured win rate. Ships the round-turn law. |
| `2026-07-10-turn-texture.md` | **Gate 1.** Makes one turn a puzzle (P-READ, P-TURN). §1 is the **FREE-line rework — the fulcrum**: RATIFIED Option A "constrain the fork" + the weak-deposit DRAW kicker amendment. |
| `2026-07-10-theme-identity.md` | **Gate 2.** Ten themes that earn their names; per-theme identity scores, the "Oracle always predicts HEART" complaint that produced OMEN v2, "the press-your-luck knob" that produced OVERHEAT, "the track gets rungs and a face" that produced the PLEA resolve milestones. |
| `2026-07-10-keyword-registry.md` | **Gate 3.** The "30-keyword" registry is really a ~45-term language. Position: **chase honesty and support, not the number 30**. TICK killed here. |
| `2026-07-10-out-of-flow-mechanics.md` | **Gate 4.** The floating die as template for persistent/visible/player-timed resources; nine candidates ranked; ship as one coupled batch on a shared float currency. |
| `2026-07-10-momentum-scoping.md` | Owner Q "scope momentum to a theme?" — the audit lens missed the mobile WHEEL and its answer was blind; revised to **global, engine-native, keeps the name**. |
| `2026-07-10-audit-evidence/` | Raw transcripts: 10 `theme-*.md` + `cross-{puzzle,keywords,momentum,new-mechanics,prior-art}.md`, `baseline.md`. |

**Other tuning docs:** `2026-07-08-win-path-scaling.md` (the doctrine win-rate curve's correction history), `2026-07-11-card-library-improvement-plan{,-detailed}.md` (WS1–WS10 workstreams; C-1..C-11 corrections), `2026-07-11-dawncaster-comparison.md`, `2026-07-11-honest-rebaseline-and-evidence.md`, `2026-07-11-phase27-rebaseline.md`, `2026-07-13-grace-preset-tuning-plan.md`, `2026-07-17-d3-dice-economy.md`, `2026-07-18-{card-library-fanout-synthesis,card-library-metrics-accumulation,d7-ratification,d8-preset-dice-valves}.md`, `2026-07-19-swap-pool-{measurement,promotions}-residue.md`, `preset-rework-status.md`.

**Root / plan-level:**

| File | Gist |
|---|---|
| `plan/north-star-mork-borg.md` (Aug, **RATIFIED 2026-08-22**) | Mörk Borg is the delivery register. Five T rulings (§1); R-F "THE LONGER LEASH" widens the loop's mandate and **puts art in scope**; deck/dice mechanics explicitly untouched. |
| `new-north-star.prompt.md` (2026-08-20) | The *trigger prompt* that opened the above session. Not a decision. Names the tension: shipped register is gothic-cathedral liturgical; Mörk Borg is apocalyptic-doom-metal minimalism. |
| `plan/naming-session-2026-08-12.md` | Product-name session: "Axiomancer" is built from exactly the register spec 34 removed everywhere else. Outcome (§6) → **Miserere Mei, Deus**, shipped as Phase 67. |
| `plan/PHASE_CANDIDATES.md` (last pass 2026-09-01, pass 10, posture **bold**) | `/expand` output. **EA-1..EA-8 row at :1339-1353** — promoted to Phases 26-33 (EA-1→26 turn law, EA-2→27 rebaseline, EA-3→28, EA-4→29 keyword registry, EA-5→30 FREE-line rework, EA-6→31 momentum, EA-7→32 THE STAKE, EA-8→33 upgradeable dice). Newest pending: in-house crash capture (score 8.5). |
| `plan/bearings.md` (41 KB, Aug 31) | Standing context. Product name, three-package layout, **no hosted web surface**, verify + deploy gates, the URL/API/CLI contract, THE UNSHACKLING record. **The only non-zoned `plan/` file** — the lexicon lint scans it. |
| `plan/AUDIT.md` (173 KB) / `plan/CRITIQUE.md` (114 KB) | The drain queues. |
| `plan/CURRENT-STATE.md` (Jul 8) | Brownfield baseline — **stale** (says Node ≥20; package.json says ≥22). |
| `spec.md` (133 lines) | The product spec. §Pillars :38-55, §Scope :57-125, §Contracts :127-133. |
| `axiomancer-mechanics/docs/profane-canon.md` (199 ln) | The 2026-08-08 rework design record: tonal brief, four MTG rules, the 57-card table, the six archetypes with capstone loops, the presets + lineage, the enemy card library. |
| `axiomancer-mechanics/specs/32-no-strike-card-library.md` | The (partly VOID) themed-library spec. §1 doctrine is **explicitly marked VOID 2026-08-08**; §12 owner decisions 1-9 are still live. |
| `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md` | The Profane Canon retheme + naming law. §5.2 R-1..R-15 renames, §8 "What does NOT change", §12 index of rulings. |
| `axiomancer-mechanics/specs/35-objective-function-v2.md` | **CQI** — the current objective function (ARC / WIDTH / IDENTITY / SPINE). |
| `axiomancer-mechanics/specs/33-upgradeable-dice.md` | Die gear, BOON/HONE/TEMPER, the flag-gated stance-check rail. |

### 7.2 Every "decision of record" / law that constrains card / keyword / enemy design

The owner intends to **repeal all except (a) the 5/5/5 colour law and (b) "every card has a FREE line."** Below, each law with every place it is encoded.

| # | Law | Where it is written / enforced |
|---|---|---|
| **L1** ✅ *KEEP* | **Preset colour law — 5/5/5 by aspect** (generalized to exact thirds 6/6/6·10/10/10·15/15/15) | Spec: `specs/32-no-strike-card-library.md:590-606` (item 9). Code: `src/Combat/combat.starter-deck-presets.ts:24, :315`. Test: `src/Combat/e2e/deck-presets.engine.test.ts:86`. Notes: `combat-playtest.balance-bands.sim.test.ts:105-107, :196`. Skill: `.claude/commands/deck-tuning.md:201`. Reports: `docs/reports/deck-tuning-2026-07-18.md:8,:97`, `-07-19.md:23,:195,:228,:239-240`. |
| **L2** ✅ *KEEP* | **Every card has a FREE line** (dieless; budget 25-35% of total points; must contain ≥1 theme-currency verb, generic DRAW alone banned) | Ratification: `plan/tuning/2026-07-10-turn-texture.md §1` ("OWNER DECISION 2026-07-10: Option A"). Schema doc: `src/Cards/types.ts:613-619`. Test: `src/Cards/e2e/curated-library.engine.test.ts:85-96` (non-empty) and `:98-102` (oath/hex author none). Pricing: `src/Cards/cards.pricing.ts:199, :202, :446`. Engine: `combat.engine.ts:1744` ("never a silent no-op — the FREE-currency lint law"). Rider family: `src/Cards/types.ts:422-446`. |
| **L3** ❌ repeal | **THE COLOR LAW** — a die powers only a card of its own colour; WILD the sole exception; X powers nothing without `fate` | `combat.engine.ts:1947` (the enforcement), `:335`, `:4680`, `:4977`. Spec: `specs/31-fate-engine-card-effect-revamp.md:39`, `specs/33-upgradeable-dice.md:40`, `specs/34:§8.3`. Docs: `docs/combat.md:598-612`. Tests: `hazard-pattern-combat.engine.test.ts:315,:333`, `preview-truth.engine.test.ts:159`, `fate-engine.engine.test.ts:145`, `curated-library.engine.test.ts:215-220`. |
| **L4** ❌ repeal | **THE STRIKE IS DEAD** (`basePower`/`chipHp` deleted at schema level; HP falls only to DoT/payoff/drip/reflect) — *doctrine already VOIDED 2026-08-08, schema purge survives* | Spec (marked VOID): `specs/32:102-140`. Lexicon rows: `docs/lexicon.json:13-25` (`base-power`, `chip-hp`) + `:169-175` (`strike-ban-doctrine`, type `doctrine`). Human guide: `docs/LEXICON.md:29-33`. Test: `curated-library.engine.test.ts:162-177`. Repeal record: `specs/34:§8.7`, `VISION.md:13-18`, `cards.library.ts:23-29`. |
| **L5** ❌ repeal | **Status-effect-focused law** — "status effects are the MAIN fun; low status engagement is a balance failure" | Lexicon doctrine row: `docs/lexicon.json:176-183` (`status-primacy-doctrine`). Repealed in: `VISION.md:13-18, :27-28`, `axiomancer-mechanics/CLAUDE.md` "Load-bearing doctrine (unshackled 2026-08-08)". **STILL LIVE IN PROSE:** `spec.md:42-46` reads "**Status effects are the main fun.** … Low status-effect engagement is a balance *failure*" — the lint pattern requires uppercase `MAIN`, so **spec.md escapes the guard**. Also still asserted in test prose: `combat-playtest.balance-bands.sim.test.ts:12` and `card-coverage.sim.test.ts:11`. Live assertion: `balance-bands.sim.test.ts:65-77` (`statusEngagement > 0` on every non-impossible stage; `dotHpFraction > 0` on ≥1 stage). |
| **L6** ❌ repeal | **TICK killed** (owner-ratified 2026-07-10, spec 32 amendment #2, Phase 30) — *ratified but never executed* | Ratification: `plan/tuning/2026-07-10-keyword-registry.md` (KW-4), `PHASE_CANDIDATES.md:1345` ("TICK = killed entirely"). Atlas: `docs/keyword-atlas.md:44-45, :75`. Spec: `specs/32:498-...` item 8 ("TICK's death leaves the atlas at 29 rows"). **Still live:** `keywords.ts:173` (`Tick` gloss), `src/Cards/types.ts:392-395` (`tickOne`, `tickAllDots` riders), `combat.card-complexity.ts:52`, `cards.pricing.ts` `tickOne: 0.6`, and ~8 cards author it. |
| **L7** ❌ repeal | **DoT clocks per family** — POISON = `card-played`, BLEED = `damage-instance`, MARK = `calendarExpiry:false`, DOOM = `growth:'per-enemy-action'`; event clocks NEVER tick at the round boundary | Ratification: `specs/32:§12 "Ratified 2026-07-11" #3`; plan `2026-07-11-card-library-improvement-plan-detailed.md` WS3. Type: `src/Effects/types.ts:62-84`. Data: `src/Effects/debuffs.library.json`. Test: `src/Combat/e2e/dot-trigger-clocks.engine.test.ts` (7 covered areas). Pricing anchors: `pricing.engine.test.ts:86-120`. Face honesty: `card-face-honesty.guard.test.ts:110`, `:155` (WI-2 — "every event-triggered DoT face names its trigger"). |
| **L8** ❌ repeal | **The round-turn law (Gate 0)** — ONE tray roll per threat phase; a second `startTurn` is refused (the `startTurn` re-roll Conviction farm) | Ratification: `plan/tuning/2026-07-10-turn-law-and-honest-baseline.md §1` (CONFIRMED·M·engine). Code: `combat.encounter.types.ts:727-736` (`turnTakenThisPhase`), `combat.engine.ts:552` (`startTurn`), phase re-arm in `resolveThreatPhase`/`processBetweenPhases`. Test: `src/Combat/e2e/turn-law.engine.test.ts`. Consequence baked into: `balance-bands.sim.test.ts:190-193` (the empty `KNOWN_CURVE_VIOLATORS` set is a *post-law* re-derivation). |
| **L9** ❌ repeal | **Momentum: global, engine-native, keeps the name; momentum dice never persist past the fight** | Decision: `plan/tuning/2026-07-10-momentum-scoping.md`. Code: `combat.engine.ts:235-311` (`WHEEL_ORDER`, `advanceMomentumWheel`, `isMomentumDieId`), `combat.encounter.types.ts` `momentumWheel?` field doc ("owner-ratified 2026-07-10"). Mobile: `axiomancer-mobile/state/combat/momentum.ts`. Test: `src/Combat/e2e/momentum-wheel.engine.test.ts`, `axiomancer-mobile/state/combat/__tests__/momentum.test.ts`. |
| **L10** ❌ repeal | **The concede/CONDEMN ladder** — flat 8 base / 10 elite / 12 boss; a card's `concedeAt` is raised to the tier floor | Code: `src/Combat/effects.ts:154-174` (`CONCEDE_PREMISES_BASE/ELITE/BOSS`, `concedeFloorFor`), `combat.engine.ts:1461-1471`. Origin: `plan/tuning/2026-07-08-win-path-scaling.md` item 1a. Card: `the-black-cap` `concedeAt: 8` (`cards.library.ts:1195`). Gloss: `keywords.ts:383`. Pricing: `VERB_POINTS.concedeCapstone = 3`. |
| **L11** ❌ repeal | **RELENT resolve threshold** — 35% of maxHealth, floor 10, capped at current HP; Wavering 45% / Faltering 80% milestones | `src/Combat/effects.ts:181-240` (`CAPITULATE_RESOLVE_FRACTION = 0.35`, `CAPITULATE_MIN = 10`, `capitulateThreshold`, `swayResolveMilestoneThresholds`). `combat.engine.ts:1322-1420`. `SWAY_DECAY_PER_TURN = 1` (`:150`). Test: `win-path-scaling.engine.test.ts:182`, `charm-resolve-milestones.engine.test.ts`. Gloss: `keywords.ts:227-228`. |
| **L12** ❌ repeal | **Payoff caps: RUPTURE capped at a pure fraction (0.60 × enemy maxHP); ALL-spenders (REAP-ALL, spend-all-pips) UNCAPPED** | Ratification: `specs/32:§12 "Ratified 2026-07-11" #5`. Atlas: `keyword-atlas.md:79` (`RUPTURE_CAP_FRACTION`), `:99` (REAP cap removed entirely). Schema docs: `src/Cards/types.ts:110-117, :211-214, :237-240`. Gloss: `keywords.ts:179-180`. Test: `themed-decks.engine.test.ts` (pins the 240-damage burst). |
| **L13** ❌ repeal | **THE COVETED DIE — boss/unique decks stake exactly their SECOND card; nobody else stakes** | `combat.enemy-decks.ts:12-19` (deck laws), `:171-175` (`wagersCovetedDie`), `:222`. Phase field: `combat.threat.ts:93-97`. Test: `coveted-die.engine.test.ts`, `new-enemies.engine.test.ts:148-152, :184-188`. |
| **L14** ❌ repeal | **Enemy deck laws** — 2-5 cards (bosses 4-5); final card is the spike; exactly one curse-injector per archetype | `combat.enemy-decks.ts:12-19`. Test: `new-enemies.engine.test.ts:64-88` (authored sequence for every roster enemy; escalation: back half outweighs the opener). |
| **L15** ❌ repeal | **Enemy stat law — total baseStats = 5 × level** | `enemy.library.ts:2669` comment ("550 = 5 × 110 (stat law)"), `ENEMY_STAT_PER_LEVEL` in `src/Game/game-mechanics.constants.ts`, `enemyStatBudget` (`Enemy/index.ts:97`). Test: `Enemy/e2e/enemy.engine.test.ts:85-118`. |
| **L16** ❌ repeal | **1:1 art law** — every roster enemy has a unique `portraitAsset` | `enemy.library.ts:4-6`. Test: `new-enemies.engine.test.ts:54-62`. (The 3 Aporia bosses + The Unfinished are exempt — they carry none.) |
| **L17** ❌ repeal | **Rank bands / pricing lint** — common 1.5-7.5, uncommon 4.5-13, rare 7-19; rank-monotone averages; oath/hex score 0 | `pricing.engine.test.ts:41-82` + 3 clones. Table: `cards.pricing.ts:26-…`. Spec: `specs/32 §4`. |
| **L18** ❌ repeal | **Archetype package shape** — 7 cards = 2 commons + 2 uncommons + 1 rare spell + 1 oath + 1 hex; library exactly 57 | `curated-library.engine.test.ts:35-66`. Doc: `docs/profane-canon.md §2`, `cards.library.ts:1-52`. |
| **L19** ❌ repeal | **Deck-size laws** — 18/30/45, hard cap 50, ≤4 copies, LINEAGE multiset equality | `combat.starter-deck-presets.ts:22-30, :65, :169`. Test: `deck-presets.engine.test.ts`. |
| **L20** ❌ repeal | **Card-face honesty / card-keyword doctrine** — every mechanic is a terse learnable KEYWORD; a mechanic without a registry row is the bug; one-card mechanics stay card-local; a term earns an atlas row at ~3+ cards | `keywords.ts:20-24`. Row policy: `keyword-atlas.md:27-45`. Guard: `card-face-honesty.guard.test.ts`. KW lints: `axiomancer-mobile/state/combat/__tests__/keywords.test.ts`. |
| **L21** ❌ repeal | **Registry count pins** — 42 `KEYWORD_GLOSS` rows, 8 system terms; row-count gate itself RETIRED 2026-08-22 (THE PIPELINE LIBERATION) but the *test pin* survives | `keywords.test.ts:31-44`. Retirement of the gate: `keyword-atlas.md:4-8, :41-45`. |
| **L22** ❌ repeal | **P0-truth law** — every number the engine applies must appear verbatim on the face; ≤130 chars; no em dash / semicolon; "the foe" not "the enemy"; every UPPERCASE token is a real keyword | `paid-summary-honesty.engine.test.ts:1-38`. Schema doc: `src/Cards/types.ts:629-641`. Read-rule half: `combat.engine.ts:203-216`. |
| **L23** ❌ repeal | **Doctrine win-rate curve** — early ~80% / mid ~50% / late ~25-35% / impossible 0%, blind policy-pick | `axiomancer-mechanics/CLAUDE.md` "Load-bearing doctrine (set 2026-07-08)". `VISION.md → Combat vision`. Code: `combat.playtest.ts:127-133` (`PRESET_DOCTRINE_WIN_BANDS`), `:418`. Curve shape: `combat.curve-shape.ts`, `balance-bands.sim.test.ts:159-239`. History: `plan/tuning/2026-07-08-win-path-scaling.md`. |
| **L24** ❌ repeal | **CQI is the objective function; win rate is deliberately NOT a term** (supersedes statusEngagement-as-target) | `specs/35-objective-function-v2.md`. Lexicon doctrine row: `docs/lexicon.json:184-191` (`win-rate-objective-doctrine`). `axiomancer-mechanics/CLAUDE.md`. |
| **L25** ❌ repeal | **HP is the SOLE win condition; alt-wins are sanctioned exceptions (Befriend / RELENT / CONDEMN)** | `VISION.md:20-28`. `spec.md:114-125` Non-goals ("Do not reintroduce the two-Pressure-Track combat win model"). `specs/32 §1` alt-win note. Lexicon: `docs/lexicon.json:26-32` (`pressure-tracks`). `isDefeated(enemy)` witness. |
| **L26** ❌ repeal | **Reshuffle law — deck exhaustion reshuffles discard; no fatigue mechanic ever** | `specs/32:151`. |
| **L27** ❌ repeal | **Conditionality law — every Tier-2+ card carries exactly ONE condition line** (`threshold`/`dieBonus`/`fate`/theme-state); Tier-1 at most one | `src/Cards/types.ts:672-675`. `specs/32:150-151`. |
| **L28** ❌ repeal | **Naming law (NL-1..NL-9, V-1..V-6)** — no numerals/colons/parentheses in names; a name may not be or begin with a registry keyword, locked-system word, card-type word, rank word, or stance word; no philosophy-native jargon (except Aporia, Sophist) | `specs/34-dark-fantasy-campaign.md §3 (:309-426)`. Enforcer: `scripts/check-naming-law.mjs` (NL-8 / NL-4/5 / V-1). Data: `docs/retheme-map.json`. Root script: `npm run lint:names`. Root test: `scripts/check-naming-law.test.mjs`. |
| **L29** ❌ repeal | **The 15 spec-34 renames (R-1..R-15)** — PLEA/CHARGE/SENTENCE/CONDEMN/RELENT/QUARTER/CURDLE/BOON/OATH/HEX/TOLL/GHOST/HAUNT/Ash-Saint ladder | `specs/34 §5.2`. Enforcer: `docs/lexicon.json` rows `premise, peroration, concede, sway, capitulate, rapport, reargue, special, resonance, floating, enchantment, disenchant, thoughtform, doxa, lemma, thesis, theorem, axiom`. Guide: `docs/LEXICON.md`. Hook: `guard.mjs post-write` on every `.md`. |
| **L30** ❌ repeal | **§8 "What does NOT change"** — mechanics, keyword behaviour, the dice model, minigame doctrines, engineering rigour, balance, the strike-stays-alive | `specs/34-dark-fantasy-campaign.md:845-882` (§8.1-§8.7). |
| **L31** ❌ repeal | **THE PIPELINE LIBERATION (T direct 2026-08-22)** — the keyword registry is GROWABLE; a new keyword ships through card-expert's full wiring checklist + atlas row + receipts in the same PR, no per-item owner ratification. Supersedes the spec-32 §3 30-cap. Count-pin bumps ride the same commit (¶4). | `docs/keyword-atlas.md:1-45`. `axiomancer-mechanics/CLAUDE.md`. `enemy.library.ts:2192` ("Count-pin bumps ride this same commit per THE PIPELINE LIBERATION ¶4"). |
| **L32** ❌ repeal | **Atlas prior-art law** — every Dawncaster analogue carries a `kb:` receipt; **no receipt, no entry**; gate cell `E/P/D/T` | `docs/keyword-atlas.md:9-21`. |
| **L33** ❌ repeal | **The card-editor drift contract** — the editor's `SPECIAL_MECHANIC_KINDS` must exactly equal `CardSpecialMechanic['kind']` | `axiomancer-card-editor/src/data/mechanics.contract.ts`. Enforced by `verify-card-editor` + the CI impact-path job. |
| **L34** ❌ repeal | **Cross-package impact checklist** — a diff in `src/{Combat,Cards,Effects,Enemy,NPCs,World}/**` or `src/index.ts` MUST run mobile verify + editor type-check | `AGENTS.md:55-100`. Mechanized in `.github/workflows/verify-mechanics.yml`. |
| **L35** *(harness)* | **kb/ and measured baselines are unwritable; every `.md` write runs check-lexicon** | `.claude/hooks/guard.mjs:159-217`; wired by `.claude/settings.json` `PreToolUse`/`PostToolUse`. |

### 7.3 Two traps for the downstream agent

1. **The lexicon lint fires on prose the agent writes, not on the code it changes.** Renaming `sway` → something else in TypeScript is invisible to it; writing "SWAY" in a `.md` is an immediate exit-2 from the post-write hook. To repeal L29 the agent must edit `docs/lexicon.json` (delete rows), not just the prose.
2. **`KNOWN_CURVE_VIOLATORS = []` at `combat-playtest.balance-bands.sim.test.ts:198` is an *exact-set* assertion, not a threshold.** Any numeric scale-up that changes which presets decay monotonically breaks it in *both* directions. The file's own comment says: "Do NOT widen the tolerances to shrink this set — re-derive the offenders and update the constant." A one-shot overhaul should expect to re-derive it (240 s test, 3 presets × 3 stages × 30 runs × 2 enemies, seed 1).