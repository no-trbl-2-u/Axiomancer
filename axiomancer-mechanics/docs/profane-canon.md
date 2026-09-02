# The Profane Canon — the dark-fantasy PvE card rework (2026-08-08)

**Status:** HISTORICAL — superseded by THE BIG NUMBERS REWRITE (2026-09-02,
`plan/2026-09-02-big-numbers-overhaul.prompt.md`), which repealed the 57-card
catalogue, the 7-card archetype package shape and the deck-size laws below.
The *tonal* brief (§1) survives as voice guidance — the names and the register
are still the North Star — but every number, count and structural rule here is
a period record.

<!-- lexicon-ok: premise, concede, sway, capitulate, rapport, reargue -->

*Magic: The Gathering, if it were a solo, dark-fantasy, PvE campaign.* This
document is the design record for the 2026-08-08 wholesale card rework: the
tonal brief, the keyword set, the three campaign presets and their lineage,
and the enemy card library. Implementation lives in
`src/Cards/cards.library.ts`, `src/Combat/combat.starter-deck-presets.ts`,
`src/Combat/combat.enemy-cards.ts`, and `src/Combat/combat.enemy-decks.ts`.

## 1. The tonal brief

Grim, bodily, superstitious: rot, debt, oaths, saints, teeth, cold, brine,
bells, ledgers, candle-stubs. Not high fantasy — profane liturgy and folk
horror in the game's existing philosophical register. Card text reads like a
fragment of scripture, contract, or confession; names are concrete nouns with
weight (*Tithe of Teeth*, never *Dark Blast*).

The MTG feel is mechanical identity fused with flavor, built on four rules
distilled from the research pass (MTG's black/Rakdos canon, Slay the Spire,
Aeon's End, Arkham Horror LCG, Gloomhaven, Monster Train, Dawncaster):

1. **Cost and reward live in different currencies** (blood for cards, cards
   for fire, souls for mercy).
2. **Costs defer and compound** (DOOM is interest; the pact comes due later).
3. **Opting in is the player's signature on the contract** — the drawback text
   IS the story.
4. **The enemy is a deck-player too**, with a visible economy and one-sentence
   boss rules that invert one player habit.

Unchanged, by hard constraint: **Conviction, Surge, and the dice system.**
Cards read, spend, and grant them; the subsystems themselves are untouched.
Direct damage is LEGAL (THE UNSHACKLING, 2026-08-08 — `cards.library.ts`'s
header is authoritative): the CURRENT canon happens to deal enemy HP only
via DoT ticks, affliction payoffs (RUPTURE / REAP / consumed marks), engine
drips (BACKFIRE, persistent hooks), and reflect (THORNS / RIPOSTE), but
that is a design choice of this library, not a law — a future card may
carry direct damage through the full wiring checklist.

## 2. The library at a glance (57 cards)

| Class | Count | Role |
|---|---|---|
| The Threadbare Office (starters) | 8 | Deliberately weak teaching cards — built to be removed |
| The reliquary dice (valves) | 3 | Dice-interaction relics, one per aspect, seated flag-on |
| The curses | 4 | Enemy-injected junk; PURGE or IMMOLATE them out |
| Six archetype packages | 42 | 7 each: 2 commons, 2 uncommons, 1 rare spell, 1 enchantment, 1 disenchant |

### The six archetypes

- **rot — The Blight.** Contagion liturgy: plant POISON/BLEED/MARK, PROLONG
  and FESTER them, detonate with RUPTURE, drink it back with SIPHON. MTG
  ancestors: infect, wither, proliferate. Capstone loop: *The Untended
  Garden* (end-of-round FESTER) + *Edict of the Open Wound* (DoTs never
  expire, healing fails).
- **debt — The Reckoning.** Power bought in blood: RECOIL, chosen-X prices,
  FALLEN payoffs, the fate-line (a dead X die made load-bearing), DOOM as
  compound interest. Ancestors: Phyrexian mana, Necropotence, Dark Confidant,
  pacts. Capstone loop: *The Red Ledger* (every RECOIL bills BLEED) +
  *Joint and Several* (the enemy is liable for your debts).
- **grave — The Exhumation.** The discard pile as reliquary: MILL, RECALL,
  REPLAY, REQUIEM gates, IMMOLATE as the pyre. Ancestors: dredge, flashback,
  delirium, madness. Capstone loop: *The Sexton's Count* (every
  RECALL/REPLAY tolls DOOM) + *The Congregation Below* (the discard pile
  itself is the kill clock).
- **vigil — The Cold Watch.** Winter siegecraft: GUARD/BARRIER, THORNS,
  RIPOSTE, and payoffs for bloodless nights (the no-damage predicates), with
  DOOM as winter itself so the wall always owns a clock. Ancestors: ward,
  defender-matters. Capstone loop: *Every Stone an Oath* (quiet rounds lay
  courses) + *Caltrops Under the Snow* (every hit they land bleeds them).
- **trial — The Indictment.** A witch-trial prosecuted mid-combat: PREMISE
  toward the declared verdict (*The Black Cap*, CONCEDE alt-win), STAGGER as
  objection, BACKFIRE as contempt, MARK as entered evidence. Capstone loop:
  *The Assize Bell* (every denied rung becomes a premise) + *Writ of
  Attainder* (the sentence compounds nightly).
- **choir — The Pale Choir.** Sung mercy and harvested souls: SWAY toward
  CAPITULATE, RAPPORT, SOUL on affliction endings, REAP to spend the plate.
  Ancestors: extort, drain, devotion. Deliberate tension: *The Long Amen*
  rewards HOLDING souls while *The Offertory Plate* and *Miserere* reward
  spending them.

### New mechanics (the only engine additions)

- **DOOM iN** — `debuff_creeping_doom` promoted from its sandbox quarantine:
  a DoT that grows +1 intensity each time the foe acts, no calendar — it ends
  only by consumption. The inevitability engine; ~12 carriers.
- **IMMOLATE N** — burn the N lowest-rank cards in hand as a printed cost
  (they leave the fight); the rider fires. Exploit/madness feel, and the
  in-combat answer to curses.
- **REQUIEM N** — a condition line (state-predicate): fires free while the
  discard pile holds ≥ N cards. The delirium read.
- **PURGE** — a curse card exiles itself from the fight when played (a die
  and a tempo beat buy the deck clean).
- **Curse injection** (enemy-side) — an enemy card payload (`curseCardId`)
  that shuffles a curse into the player's combat deck: the StS/Arkham
  deck-contamination attack vector. Combat-scoped; the collection is never
  touched.

### Keyword registry

POISON · BLEED · MARK · DOOM · RUPTURE · SIPHON · GUARD · THORNS · RIPOSTE ·
RECOIL · FALLEN · SOUL · REAP · SWAY · RAPPORT · STAGGER · BACKFIRE · PREMISE
· CONCEDE · FORETELL · OMEN · KINDLE · PIP · FORGE · ECHO · RECALL · REPLAY ·
MILL · DRAW · HEAL · CLEANSE · TICK · PROLONG · FESTER · REARGUE · IMMOLATE ·
REQUIEM · PURGE. Glosses live mobile-side in `state/combat/keywords.ts`
(presentation owns how words read; the engine owns what they do).

## 3. The campaign presets — one deck, three snapshots

The progression model (the rework's spine):

> The player starts with n weak early-game cards → earns new cards as
> encounter rewards → **removes** some of the weak starters at a removal
> encounter → keeps earning rewards.

The presets are **snapshots of that one deck evolving**, machine-checked by
the LINEAGE LAW (`PRESET_LINEAGE`: each snapshot = predecessor − removed +
added, as multisets). Deck laws: sizes 18/30/45 under a **50-card hard cap**,
exact aspect thirds, ≤ 4 copies of any card.

**THREADBARE — The Threadbare Office (early, 18).**
3× Spoiled Poultice, 3× Chilblain Watch, 2× Petty Indictment, 3× First
Spadeful, 1× Grandmother's Psalter, 2× Thumbprick Oath, 3× Thin Hymn, 1×
Threadbare Cope. One card per archetype verb at whisper volume; every card
is honest and slightly clunky on purpose — these cards exist to wear out
their welcome and make the removal encounter feel like liberation.

**PILGRIM — The Pilgrim's Burden (mid, 30).**
*Removed at the confessor's shears:* 2× Spoiled Poultice, 2× Thin Hymn,
1× Petty Indictment, 1× First Spadeful.
*Earned on the road:* rot core (2× Unction of Boils, 2× The Sexton's Bell,
2× The Long Lent, The Untended Garden), debt core (2× Promissory Cut, 2× The
Vig, The Dead Pledge, The Red Ledger), vigil splash (2× Frostbitten
Palisade), grave splash (2× Shallow Grave, The Pauper's Pyre).

**APOSTATE — The Apostate's Canon (end, 45).**
*Removed at the second trimming:* 1× Spoiled Poultice, 3× Chilblain Watch,
1× Petty Indictment, 1× First Spadeful, 1× Thin Hymn, 1× Threadbare Cope —
of the original Office only the psalter, one spadeful, and the oaths survive.
*Earned:* rot deepened (2× Gangrene Gospel, Communion of the Worm, Edict of
the Open Wound, +1 Unction, +1 Long Lent), debt deepened (2× Distraint, Blank
Indenture, Joint and Several), the full vigil package (2× Hoarfrost Teeth,
2× Nothing Crossed the Ice, 2× The Reprisal Bell, The Besieger's Winter,
Every Stone an Oath, Caltrops Under the Snow), grave recursion (2× Dirge for
the Disinterred, Open Every Grave, The Sexton's Count).

The canonical lineage runs rot/debt → +vigil/grave; **trial and choir are
draft paths** — their full packages live in the reward pool so a player can
steer their own deck toward the courtroom or the choir instead. The dice
valves seat per stage under the Upgradeable Dice flag: Knucklebone Recant
(body, threadbare) → The Ossuary Drawer (mind, pilgrim) → The Saint's
Finger-Bone (heart, apostate).

## 4. The enemy card library

**The enemy uses cards too.** Every roster enemy (all 56 ids unchanged)
fights as an ordered deck over a shared 100+ card enemy library
(`combat.enemy-cards.ts`); card N is threat phase N, the final card loops,
and the telegraph names the card being played ("The Butcher casts …").
The compile layer (`combat.enemy-decks.ts` → `AUTHORED_THREAT_SEQUENCES`)
feeds the existing resolver unchanged — stances, rungs, stance checks, the
escalation clock, branches, and the coveted die all still apply.

Aeon's-End-style structural escalation: later cards carry heavier weights and
the final card is the spike. Boss/unique decks stake THE COVETED DIE on
exactly their second card. Each archetype carries exactly one curse-injector.

| Archetype | Throughline | Curse injected |
|---|---|---|
| drowned-parish | brine, bells, grief; the salt-rescue that pulls you down | Mouthful of Brine |
| gnawing-court | courtesy that ends where the reach begins | Gnaw-Marks |
| omen-choir | tallies, knocks, prophecy, the already-written | The Overheard Name |
| bone-clergy | post-flesh scholarship, decrees, plague | The Overheard Name |
| debt-office | contracts, tolls, borrowed gods, punctual endings | Arrears |
| old-fires | geological wrath; old flame that cauterizes its wounds | Arrears |
| the-aporia | the labyrinth bosses; each inverts one player habit | The Overheard Name |

Preserved identities: Lady Gabriella and Rangda steady resolve against SWAY
(`swayCleanse`); Zoma and The Sophist redact premises (`premiseShed`); the
Fire Giants cauterize their own wounds (`enemyCleanse`); the Doorwarden and
the Index shatter glyphs; Tezcatlipoca keeps his prior-threat-fully-blocked
branch as the signature card *Smoke Through the Seams*; The Incompleteness
keeps its L110 playtest calibration to the digit (weights 0.21/0.232/0.271/
0.326) — re-voiced as cards, never re-tuned.

## 5. Deliberate non-goals and residue

- **Balance is explicitly deferred** (owner directive). The band assertions in
  the balance sims are suspended with documented markers; `/deck-tuning` is
  the court that re-baselines and re-arms them against the new canon.
- Verbs with no current library carrier (OMEN, FORGE/TRANSMUTE, OVERHEAT,
  turnabout, spend-premises, lock-stance, conjure…) stay implemented and
  tested via synthetic fixtures — design space for future reward cards.
- Old id-keyed engine hooks whose carriers died with the old library are dead
  code pending a cleanup sweep (tracked in the rework report).
- The spec-32 swap pools and sandbox sets were cleared with the library they
  measured (the same clean-reset rule spec 32 v3 applied to ITS predecessor);
  `/deck-tuning` authors canon-era sets fresh.
