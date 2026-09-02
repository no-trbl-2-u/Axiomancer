# Keyword atlas — the live combat vocabulary

One row per LIVE keyword: the word, the reminder text a player reads the first
time they meet it, and what carries it. Rewritten 2026-09-02 for THE BIG
NUMBERS REWRITE (`plan/2026-09-02-big-numbers-overhaul.prompt.md`), which
repealed the atlas's old apparatus — the prior-art-receipt rule, the row-count
gate, the proving-gate scoreboard and the "3+ cards earns a row" bar are all
gone. A `kb:` receipt is welcome in the notes; it is not required.

**Discipline** (overhaul §6.1, replacing the old row policy):

- A keyword exists when **≥2 cards or ≥2 enemies** use it *and* it passes
  Vilain's three tests — it has **flavor** (the word evokes the effect), it
  **compresses** (the reminder text is longer than the word), and it has
  **class** (it groups cards into a family a player recognises). A one-card
  mechanic stays as plain rules text on that card.
- Every keyword prints with reminder text on first sight (the mobile popup,
  `KEYWORD_GLOSS`), and every printed number is the number the engine applies.
- Complexity budget by rank: **Ash/Tooth** carry ≤1 keyword beyond a damage or
  guard verb and never a trigger condition; **Splinter/Rib** carry ≤2 and may
  carry one condition; **Skull/Saint** are unbudgeted.

**Sources of truth.** Player reminder text lives in
`axiomancer-mobile/state/combat/keywords.ts` (`KEYWORD_GLOSS`); enemy reminder
text lives in `axiomancer-mechanics/src/Enemy/enemy-keywords.ts`
(`ENEMY_KEYWORD_GLOSS`). This file is the index, not the source — when a row
disagrees with the code, the code wins and the row is the bug.

**Carriers.** The card library and the enemy roster are being rewritten in
parallel with this pass, so the carrier column says `(see the catalog)` for
cards and `(see the roster)` for enemies rather than naming ids that are
mid-flight. Run `npm run catalog` for the current binding.

---

## Player keywords — the damage family

| keyword | reminder text | carried by |
|---|---|---|
| **DEAL N** | Direct VITAE damage. Not a keyword — plain English on the face; a multi-hit prints `N × k` and each hit is its own damage instance. | (see the catalog) |
| **PIERCE** | This damage ignores the foe's HIDE and every effect that would reduce it. | (see the catalog) |
| **WRATH N** | Every hit you land deals that much more, for the rest of the fight. It stacks and never fades. | (see the catalog) |
| **FLAY N** | Each of your next hits deals half again as much, spending one stack per hit. | (see the catalog) |
| **CHAIN N** | Your next hit deals that much more. Chain fades at the end of a turn that added none. | (see the catalog) |
| **EXECUTE N%** | While the foe is at or below the printed share of its VITAE, this card's damage doubles. | (see the catalog) |
| **OVERKILL** | Damage past the killing blow is not wasted: it converts at the printed rate (Conviction, healing, or Souls). | (see the catalog) |
| **TWIN** | Your next spell this turn resolves its PAID line twice. Never chains — a twinned spell that arms TWIN does not re-arm. | (see the catalog) |

## Player keywords — afflictions and their payoffs

| keyword | reminder text | carried by |
|---|---|---|
| **POISON iN dM** | Each time a card is played, the foe loses VITAE per Poison stack. The longer it holds, the harder it bites. | (see the catalog) |
| **BLEED iN dM** | Each hit the bearer takes deals extra VITAE per Bleed stack, then removes a stack. | (see the catalog) |
| **DOOM iN** | Deals VITAE per stack at the start of each round and grows a stack every time the foe acts. It ends only when consumed. | (see the catalog) |
| **MARK iN dM** | Every damage-over-time tick on the bearer deals +1 VITAE per Mark stack. Marks hold until consumed, not until a calendar expires. | (see the catalog) |
| **RUPTURE N** | Consumes the foe's afflictions and deals their remaining damage at once. ALL-spenders are uncapped. | (see the catalog) |
| **FESTER N** | Every damage-over-time effect on the foe gains that much intensity. | (see the catalog) |
| **PROLONG N** | Adds that many turns to every damage-over-time effect you have on the foe. | (see the catalog) |
| **CURDLE iN** | Flips the foe's Bleed into Poison and its Poison into Bleed, each landing that much harder. | (see the catalog) |
| **TICK** | Your strongest damage-over-time effect on the foe ticks again, immediately. | (see the catalog) |
| **SIPHON N%** | Heals you for the printed percentage of the damage this play deals. | (see the catalog) |

## Player keywords — walls and reprisal

| keyword | reminder text | carried by |
|---|---|---|
| **GUARD N** | Blocks that much incoming damage during the next threat phase. Unused Guard is lost unless the card prints "persists". | (see the catalog) |
| **BARRIER N** | The persisting sense of GUARD: it does not fade at round end, only when consumed. Shares GUARD's popup. | (see the catalog) |
| **THORNS iN dM** | The foe takes VITAE per Thorns stack each threat phase it attacks you, even through a full block. | (see the catalog) |
| **RIPOSTE iN dM** | Armed for one threat phase: reduces the first attack by its parry value, and if the blow is fully blocked the foe takes the counter instead. | (see the catalog) |

## Player keywords — tempo and control

| keyword | reminder text | carried by |
|---|---|---|
| **STAGGER N** | Removes that many rungs (the steps of the foe's telegraph) from its next action. Strip them all and the action is denied. | (see the catalog) |
| **BACKFIRE iN dM** | The foe takes VITAE per Backfire stack for each rung its telegraphed action loses; a denied action counts all of its rungs. | (see the catalog) |
| **CHARGE** | A running tally. When it reaches the count printed on the card that spends it, that payoff fires free and the tally resets. | (see the catalog) |
| **FORETELL N** | Reveals the foe's next stance and looks at that many cards of your deck, moving the best to the top. | (see the catalog) |
| **OMEN** | Stake a stance and a window of phases it must land within, paying a Conviction ante up front. A hit fires the payoff free; a miss keeps the ante. | (see the catalog) |
| **QUARTER iN dM** | The foe's attacks deal less damage per Quarter stack. | (see the catalog) |

## Player keywords — turn shape (the conditions a line waits on)

| keyword | reminder text | carried by |
|---|---|---|
| **AMBUSH** | This line fires only when the card is your first spell of the turn. (Engine: the `opening` predicate at `maxPriorSpells: 0`.) | (see the catalog) |
| **FLOW N** | This line fires once you have already played that many spells this turn. | (see the catalog) |
| **FINALE** | This line fires when playing the card leaves at most the printed number of cards in hand. | (see the catalog) |
| **REQUIEM N** | A card's REQUIEM line fires free while your discard pile holds that many cards. | (see the catalog) |
| **FALLEN** | A state: you carry 2 or more different afflictions. A card's FALLEN line fires free while you are Fallen. | (see the catalog) |

## Player keywords — the deck as a resource

| keyword | reminder text | carried by |
|---|---|---|
| **DRAW N** | Draw that many cards from your deck, up to your hand limit. | (see the catalog) |
| **MILL N** | Sends that many cards from your deck to your discard pile. | (see the catalog) |
| **RECALL N** | Returns that many cards from your discard pile to your hand, highest rank first. | (see the catalog) |
| **ECHO** | The card's PAID line fires twice. FREE lines never echo. | (see the catalog) |
| **REPLAY N** | Says your last spell again: its PAID payload fires that many more times. | (see the catalog) |
| **IMMOLATE** | Burns the lowest-rank cards in your hand as a cost, and they leave the fight entirely. A curse burns as well as anything. | (see the catalog) |
| **PURGE** | Playing this curse removes it from the fight entirely. A die and a beat buy the deck clean. | (see the catalog) |

## Player keywords — resolve, harvest and mercy

| keyword | reminder text | carried by |
|---|---|---|
| **SOUL** | You gain 1 Soul each time an affliction on the foe expires or is consumed. | (see the catalog) |
| **REAP N** | Spends the printed number of Souls to fire the printed effect. With fewer Souls, it fizzles. REAP ALL is uncapped. | (see the catalog) |
| **PLEA N** | Builds on the foe and decays each round. At their resolve, they relent. | (see the catalog) |
| **HEAL N** | Restores that much VITAE, up to your maximum. | (see the catalog) |
| **CLEANSE N** | Removes up to that many afflictions from you. | (see the catalog) |
| **RECOIL N** | Pay the printed VITAE as a cost when the card is played. No defense can prevent it. | (see the catalog) |

## Player keywords — the dice

| keyword | reminder text | carried by |
|---|---|---|
| **FORGE** | Forges a GHOST die (or revives a dead X die as WILD) that plays beside your drafted die and is spent for good. At the cap it grants Conviction instead. | (see the catalog) |
| **KINDLE** | Creates a temporary die of the printed color in your Reserve. If the Reserve is full, it grants Conviction instead. | (see the catalog) |
| **PIP** | Each threat phase a Reserve die survives it gains a pip; each pip spent adds `PIP_INTENSITY_BONUS` intensity, or `PIP_GUARD_BONUS` Guard on a defend card. | (see the catalog) |
| **BOON** | A die's BOON face powers a card of its color and grants Conviction; its equipped gear sets how much. | die gear (`spec 33 §6`) |
| **HONE** | A blacksmith upgrade: adds a mana face to a die's gear, so more of its rolls power a card. | blacksmith service |
| **TEMPER** | A blacksmith upgrade: turns a mana face into a BOON face. | blacksmith service |

---

## Enemy keywords (9)

New with THE BIG NUMBERS REWRITE. An enemy carries 0–1 at simple/normal, 1–2
at elite, 2–3 plus a STAGE at boss/unique. They print on the enemy pane with
popups. Glosses below are copied from `src/Enemy/enemy-keywords.ts`
(`ENEMY_KEYWORD_GLOSS`); `{n}` is substituted with the instance's own number,
so one foe can carry HIDE 3 and another HIDE 12.

| keyword | reminder text | applied in | carried by |
|---|---|---|---|
| **HIDE N** | Every hit against this foe is reduced by N, never below 1. PIERCE ignores it. | `applyEnemyDamage` | (see the roster) |
| **SWIFT** | Your GUARD and BARRIER count for half against this foe. | `resolveThreatPhase` | (see the roster) |
| **BRUTAL** | Damage this foe gets past your defenses is doubled. | `resolveThreatPhase` | (see the roster) |
| **VENOM N** | Damage this foe lands also poisons you for N. | `resolveThreatPhase` | (see the roster) |
| **UNSHAKEN** | This foe cannot be staggered. Its rungs never fall. | `computeRungDenial` | (see the roster) |
| **ELUSIVE** | This foe's HIDE counts double until you stagger it this round. | `applyEnemyDamage` | (see the roster) |
| **REGROW N** | This foe heals N at the end of each of its phases. | `processBetweenPhases` | (see the roster) |
| **RAVENOUS** | This foe heals for the damage it lands on you. | `resolveThreatPhase` | (see the roster) |
| **WOUNDING N** | An unguarded hit of N or more puts a WOUND in your deck. | `resolveThreatPhase` | (see the roster) |

HIDE is the reason one big hit beats many small ones: it is subtracted from
each damage instance, so `7 × 4` and `28 × 1` play differently against armour.

### STAGE (boss/unique only)

Not a keyword — a boss/unique data structure (`EnemyStage`). At a printed VITAE
fraction or round the foe changes shape: a name shouted into the log, a
telegraphed line, keywords gained, an optional cleanse, heal, threat bonus or
curse injection. Every boss authors ≥2 stages; every unique ≥3. The numbers on
the pane must visibly jump when one fires.

---

## System terms (printed, glossed, not keywords)

These get popups but are engine systems rather than card vocabulary; they live
in `SYSTEM_GLOSSARY` (mobile).

| term | what it is |
|---|---|
| CONVICTION ◆ | A spend-anytime resource banked from unspent dice and overflow. It never decays. |
| TOLL ⬡ | A whole-combat running tally of dice you spend by color; a ⬡ threshold line fires at its count. |
| RESERVE & PIPS | Dice held between phases instead of played, ripening a pip per phase. |
| GHOST ✦ | A forged die that plays alongside your drafted die, never rerolls, and is gone when spent. |
| RUNGS | The steps of the foe's telegraphed action. Losing all of them denies the action. |
| WILD / X | A WILD die counts as any color; a dead X die powers nothing until forged or fate-tapped. |
| SENTENCE | A declared conclusion: at the printed CHARGE count its payoff fires free and the tally resets. |
| CONDEMN | An alternate win: reaching the printed CHARGE count in one SENTENCE ends the fight. |
| RELENT | An alternate win: PLEA reaching the foe's resolve opens an explicit accept-or-continue choice. |

**OATH** and **HEX** are card *types*, not keywords: a passive on your side and
a standing curse on the foe respectively, three rounds when played free and
permanent when paid with a die. They carry glossary rows for the help surfaces
but never render in the inspect keyword panel.

---

## Known drift (2026-09-02)

Rows whose reminder text in `KEYWORD_GLOSS` still carries a pre-rewrite number,
pending the effects/library rescale (overhaul §5.2):

- **RUPTURE** — the mobile gloss still says "up to 60% of its max VITAE" and
  `RUPTURE_CAP_FRACTION = 0.60` is still live in `src/Combat/effects.ts`. The
  cap is repealed (law L12); the number above it is the code's, not the
  design's.
- **POISON / BLEED / DOOM** — `debuffs.library.json` still carries
  `damagePerRound` 2 / 3 / 1. §5.2 asks for roughly ×3–4.
- **PLEA** — the gloss's "~35% of max VITAE" resolve threshold is scheduled to
  become "35% of VITAE, minimum 20" (§5.4).
- **FINALE** — live as a `SynergyStatePredicate` and used on card faces, but it
  has no `KEYWORD_GLOSS` row yet, so its popup falls through. Either give it a
  row or stop printing the word.

These are the numbers to re-read before quoting this file.
