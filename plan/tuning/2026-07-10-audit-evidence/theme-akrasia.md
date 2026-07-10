# THEME AUDIT — AKRASIA (preset: `penitent`) — the debt that never comes due

Auditor: mechanics-expert (SNOB lens), 2026-07-10. Sims on `axiomancer-mechanics@0.37.0`,
post dice-law rework. Read against the shared dossier (`tuning-audit/dossier.md`) and
baseline (`tuning-audit/baseline.md`). Five sim invocations:

- (t1) `npm run combat -- --auto --policy status --stage early --deck preset:penitent --seed 3 --max-turns 14`
- (t2) `npm run combat -- --auto --policy status --stage mid --enemy tri-eyes --deck preset:penitent --seed 5 --max-turns 14`
  (explicit `--enemy` per baseline caveat #1 — bare `--stage mid` fights Little Belle)
- (m1) `npm run combat-playtest -- --stage=early --policy=blind --deck=preset:penitent --runs=30 --seed=1 --cards`
- (m2) same at `--stage=mid`

## 0. Verdict in one paragraph

Akrasia is flavored as "pay in blood for undercosted power; the debt argues for you"
(`combat.deck-presets.ts:105`). As played it is **erosion with a gratuity**: stack
poison/bleed, detonate with a RUPTURE, and tip the bartender 5 HP on the way out. The
two hallmarks are inert-to-vestigial — RECOIL is a cost nobody feels (5–6 HP against
90–255 HP pools, fights lasting 1.5–3.0 rounds) and FALLEN is a flickering 2-round
coincidence whose flagship payoff is *heal 4*. The theme's one genuinely great design,
`mirror-of-guilt`, is a single copy. The theme's one genuinely *thematic* moment I
witnessed — dying to your own debt on the same resolution that killed the enemy — is
scripted as a plain Defeat with zero counterplay (engine.ts:2485). The deck overshoots
the doctrine curve at both stages it was printed for (97% early vs ~80%; 69% mid vs
~50%) while its identity mechanic never has time to exist. Distinctiveness 3/10,
engagement 4/10.

## 1. The cards as printed (`src/Cards/cards.library.ts:494-633`)

| card | rarity/slot | PAID line | FREE line | the akrasia content |
|---|---|---|---|---|
| against-my-judgment ×4 | C1, heart | self-MARK d2 + draw 2 | **+1 Conviction** | self-mark (half of FALLEN) |
| sweet-poison ×4 | C2, body | poison i2 enemy + self-BLEED i1 d2 | TICK | self-bleed (~3 HP total — a "cost") |
| self-flagellant ×2 | U1, body | RECOIL 5 + RUPTURE (+10%) | TICK | recoil |
| fallen-grace ×2 | U2, heart | bleed i2 d3 enemy; FALLEN: heal 4 | draw 1 | the FALLEN payoff card |
| pact-of-akrasia ×1 | R spell, body | FORGE wild float + RECOIL 6 + self-bleed | guard 2 | recoil + debt-for-dice |
| crown-of-thorns ×1 | R enchant, heart | while FALLEN: +1..+4 intensity by debt depth | (3-round timed) | the FALLEN engine |
| mirror-of-guilt ×1 | R disenchant, mind | every self-debuff mirrors 1 stack to enemy; every 3 HP of recoil = +1 stack | (3-round timed) | the debt argues for you |

Engine reality checks:

- **FALLEN** = `getDistinctDebuffCount(player) >= 2` at play time (engine.ts:1318;
  `src/Combat/effects.ts:459-465`). It counts *distinct effect ids*, any source —
  including enemy-inflicted debuffs. Duplicates collapse.
- **The preset can only manufacture 2 distinct self-debuff ids**: `debuff_mark`
  (against-my-judgment) and `debuff_bleed` (sweet-poison, pact-of-akrasia). Both
  duration 2. FALLEN uptime therefore requires playing *two different cards* inside a
  2-round window — in a deck whose early fights last **1.1–1.9 rounds** (m1).
- **Crown-of-thorns' 2026-07-08 rework is unreachable in its own preset.**
  `crownBonus = min(4, max(1, debtDepth - 1))` (engine.ts:1338-1341). Own-card ceiling
  is debtDepth 2 → **+1, permanently** — exactly the flat behavior the rework comment
  (engine.ts:1331-1337) claims to have fixed. Depth 3+ requires the *enemy* to curse
  you. The "bigger, scarier Fallen state that compounds" is advertising copy.
- **Mutual kill = you lose.** `pendingOutcome` checks `isDefeated(player)` before
  `isDefeated(enemy)` (engine.ts:2484-2486), and mid-play `checkImmediateOutcome`
  only ever checks the enemy (engine.ts:2186-2192) — so a self-bleed/recoil death that
  resolves in the same tick pass as the enemy's death is a Defeat. For the one theme
  whose fantasy is spending life as currency, the ledger's final entry always bounces.

## 2. As played — transcripts and matrix

### (t1) Early, seed 3, Little Belle 40 HP — Victory, 1 phase, player 71/90

```
Phases:    1
DoT damage:      768        Direct damage:   0
Per-card attribution:
  Sweet Poison: 48 DoT      Fallen Grace: 24 DoT
  Conviction Strike: 696 DoT ("over 9 phases" — in a 1-phase fight)
```

The signature `sig-conviction-strike` (7◆) delivered **91%** of attributed damage.
The theme's ten library cards contributed 72 DoT between two of them. FALLEN never
mattered; crown-of-thorns never entered play; nobody paid recoil that registered.
This is the baseline's game-wide finding reproduced inside the theme: akrasia's most
effective "card" is the off-theme conviction button, and — the bitter joke —
against-my-judgment's FREE line (+1 Conviction, 81 top-plays across m1) exists to
*fund* it. The penitent deck's actual engine is: drip tokens, press the button.

### (t2) Mid, seed 5, Tri-Eyes 375 HP — **Defeat, player 0/255, enemy 0/375**

```
Outcome: Defeat
  Player HP: 0/255        Enemy HP:  0/375
  Conviction Strike: 1992 DoT (70%)   Fallen Grace: 426   Sweet Poison: 410
```

Both bars hit zero in the same resolution; `pendingOutcome` player-first says Defeat.
Read that as a player: you stacked the poison, you paid the blood, the enemy died —
and the game hands you the loss screen. Inscryption would at least let the scale
tip theatrically. This is the single most akrasia-flavored moment the sim produced,
and the rules treat it as an accounting rounding direction, invisible and unappealable.

### (m1/m2) Blind matrix, 30 runs/cell, `--cards`

| stage | win | doctrine | rounds | statusEng | dotFrac | dom |
|---|---|---|---|---|---|---|
| early (6 cells) | **97%** | ~80% | **1.5** | 51% | **45%** | fallen-grace 43% |
| mid (5 cells) | **69%** | ~50% | 3.0 | 65% | 53% | sweet-poison 39% |

- **Curve violator on this seed**: +17pp early, +19pp mid. Not standstill-flagrant,
  but the preset is a tier too strong at both stages it was printed for — and it's
  strong for the wrong reason (rupture spam + signature, not the FALLEN engine).
- **dotFrac 45–53%** vs the game-wide 95–99%: nearly half the enemy HP falls to
  RUPTURE bursts. That is the *good* news — the deck mechanically owns a
  setup→detonate spike. It is also the indictment: that spike is affliction/erosion's
  arc, purchased at a 5 HP surcharge.
- Win-path mix: **vic only. 0 mercy, 0 capitulate, 0 concede in 330 fights.** No
  alt-win texture whatsoever.
- Early fights at **1.1–1.9 rounds** (grave-larva 1.1!) — the FALLEN state, a
  2-card 2-round construction, cannot exist inside most early fights at all.

Per-card usage (m2, mid, 150 fights):

| card | plays | bottom | top | statusLands |
|---|---|---|---|---|
| sweet-poison | 1065 | 966 | 99 | 966 |
| against-my-judgment | 810 | 554 | **256** | 419 |
| self-flagellant | 507 | 456 | 51 | 278 |
| fallen-grace | 504 | 422 | 82 | 422 |
| pact-of-akrasia | 251 | 193 | 58 | 157 |
| crown-of-thorns | 163 | 126 | 37 | 0 |
| mirror-of-guilt | 158 | 145 | 13 | 0 |
| *discards (scrap for ◆)* | | | | **0** |

No dead cards *within* the preset (util 100% — credit where due, all 7 ids see play),
but the top-line column is the owner's FREE/PAID complaint in miniature:
against-my-judgment is topped 256 times for a bare `+1 Conviction` token drip — the
exact "bogging the game down" fork, and here it isn't even a chip, it's a coin.

## 3. Identity as played, and the nearest neighbor

**As flavored:** Faustian self-harm engine — take on debt, become Fallen, the debt
fights for you.

**As played:** a mid-tempo affliction deck. Poison + bleed via sweet-poison /
fallen-grace, detonated by self-flagellant's RUPTURE, topped up by the conviction
signature. **Nearest neighbor: affliction (`erosion`), unambiguously** — same DoT
verbs (`debuff_poison`, `debuff_bleed`), same RUPTURE finisher, same TICK free-lines;
erosion even does it better (venom-and-vein's +1 intensity/+1 duration is
crown-of-thorns without the FALLEN homework). Strip the recoil numbers off
self-flagellant and pact-of-akrasia and no playtester would notice the theme changed.
The self-damage is a costume: 5–6 HP recoils and a ~3 HP self-bleed against a 90 HP
early pool, in fights that end before three of them can accumulate. Compare what the
recoil *buys* in the KB's prior art below — here it buys a rank discount on the
points ledger (`cards.library.ts:548`, "recoil 5 credit −1.25") that the player
cannot perceive.

## 4. Where the player thinks / where it's autopilot

**Genuine decisions (two, both borrowed):**

1. **Rupture timing** on self-flagellant — detonate the fuel now vs let poison ramp
   another tick. Real, but it is erosion's decision (resonance-detonation makes it
   with more fuel and no surcharge).
2. **Pact-of-akrasia's float purchase** — 6 HP + self-bleed for a WILD floating die
   is legitimately interesting under the locked dice law (a wild float is insurance
   against the color law's fizzle, spendable outside the 1-die rule). This is the
   deck's only decision that is *about* the price of blood.

**Autopilot (everything else):**

- Sweet-poison bottom → self-flagellant bottom → fight over. Early transcripts end in
  1 phase; the matrix says 1.1–1.9 rounds. There is no arc, only an opening.
- Top against-my-judgment for +1◆, bank toward `sig-conviction-strike`, which then
  deals 70–91% of the fight's damage (t1: 696/768; t2: 1992/2828). The theme is a
  fuel line for an off-theme button.
- FALLEN "management" involves no management: you never *choose* to enter (it happens
  if your normal curve plays two card names in a window, or if the enemy curses you —
  enemy debuffs count, `effects.ts:462`), you never choose to *leave* (no CLEANSE
  exists in the deck despite the family table advertising it, `card-themes.ts:46`),
  and both self-debuffs expire on their own at d2. A state with no entry decision, no
  exit decision, and no visible meter is not a state; it is a log line.

**Setup→payoff arc:** the rupture spike is felt (dotFrac 45–53% means half the kill
arrives as a burst). The FALLEN→Crown arc is not: one enchant copy, +1 effective
bonus (see §1), in fights too short to assemble it.

## 5. What is missing

1. **A ledger.** Recoil paid is forgotten the instant it's paid (except
   mirror-of-guilt's 3-HP-per-stack conversion, engine.ts:1862-1876 — one copy).
   Every great blood archetype keeps a running account the player watches: Dawncaster's
   Corrupted ("4 or more Corruptions in your deck, hand and/or Discard Pile" —
   `kb/KnowledgeBase/DigitalCardGames/dawncaster/keywords/corrupted.okf.md`), StS
   Blood for Blood / Brood, MTG's death's-shadow curve. Axiomancer's FALLEN is a
   *snapshot* (≥2 distinct debuff ids right now) — it flickers, it can't deepen, and
   its depth cap is unreachable in-preset.
2. **A due date.** Dawncaster's Darkness is the model: protection that costs max HP
   and *stuns you when it runs out* (`keywords/darkness.okf.md`). Akrasia's debts
   have no maturity — the self-bleed quietly expires. Nothing is ever *owed*.
3. **A redemption decision.** The theme family advertises CLEANSE and HEAL
   (`card-themes.ts:46`); the preset contains neither. The one decision an
   akrasia player should agonize over — cash out the debt (cleanse, heal, lose the
   Crown bonus) versus ride it deeper — is not merely weak, it is *unprintable* with
   the current 15 cards.
4. **Counterplay at the knife-edge.** The mutual-kill-equals-loss rule (§2, t2) turns
   the theme's signature high-wire act into an invisible coin flip resolved against
   the player. There is no "one HP from glory" moment, only a loss screen.
5. **Stakes for RECOIL.** 5–6 HP against a 90–255 pool in ≤3-round fights is below
   the threshold of feeling. The tension of Blood ("sacrifice your own blood instead
   of Energy", `keywords/blood.okf.md`) needs the price to interact with real danger —
   which under the current curve does not arrive until mid bosses.

## 6. Card-by-card issues

- **against-my-judgment** — FREE line is `+1 Conviction` (`cards.library.ts:508`):
  the *purest instance in the library* of the token-drip fork the owner condemned,
  and the deck's second-most-played card (topped 256× at mid). The card whose NAME
  is the theme should be the temptation engine, not a coin dispenser.
- **sweet-poison** — the design comment calls the self-bleed "deliberately rich —
  the akratic bargain" (`cards.library.ts:526`). i1 d2 self-bleed is ~3 HP. That is
  not a bargain; it is a tip jar. The cost is fictional.
- **fallen-grace** — the theme's named-state payoff card pays… **heal 4**
  (`cards.library.ts:577`). Nobody anticipates a heal-4 rider. This is the FALLEN
  advertisement slot and it's a coupon.
- **crown-of-thorns** — depth scaling +1..+4 is unreachable past +1/+2 in-preset
  (2 distinct self-debuff ids available); the rework's own goal is not met. Also 1
  copy in a 15-card deck for the theme's entire engine.
- **self-flagellant** — a fine detonator, but it is erosion's detonator wearing a
  hair shirt; its recoil buys nothing visible.
- **mirror-of-guilt** — the best design in the deck (self-debuffs mirror; recoil
  converts at 3 HP/stack; enemy debuffs reflect too, engine.ts:2354-2357). One copy,
  disenchant slot, no tutor. The theme's thesis card is a lottery draw.
- **pact-of-akrasia** — keep as-is; the only card where blood buys something the
  dice law makes precious.

## 7. Proposals

### A1 — DEBT: make the ledger real (keyword rework, M)

Replace FALLEN's snapshot check with a counted, combat-scoped meter: **DEBT = total
VITAE paid to RECOIL + self-affliction ticks this combat** (a `CombatResources`
counter incremented at engine.ts:1448 and in the self-tick pass). FALLEN = DEBT ≥ 8;
it never flickers off. Crown-of-thorns and all `fallen:` riders scale off DEBT tiers
(8/16/24) instead of `getDistinctDebuffCount`, making the advertised +2..+4 actually
reachable and making every point of blood a *purchase into a visible meter*. Prior
art: Dawncaster Corrupted threshold; StS Blood for Blood. Decision texture: the player
now weighs "pay 5 more now to cross tier 2 before the boss telegraph" — a real
timing/threshold puzzle, and the UI can show the meter (telegraph win).

### A2 — Sin on the FREE line (FREE/PAID inversion, theme-scoped, M)

Directly answers the owner's parked signal. On akrasia cards the FREE line becomes
the *temptation*: a dieless line with a printed blood price that lays foundation —
against-my-judgment FREE: "RECOIL 2: draw 1"; sweet-poison FREE: "RECOIL 2: apply
poison i1"; self-flagellant FREE: "RECOIL 3: TICK twice." No token drips anywhere in
the theme. Every dead-die turn (the 3-dice law guarantees them — 2/6 X faces) still
advances DEBT and the board instead of dripping ◆ toward the off-theme signature.
This is the fork redesign in its most defensible habitat: the theme whose identity
IS paying costs.

### A3 — Absolution: the redemption fork (card, replaces fallen-grace's rider, S)

Give the theme its missing exit decision. Fallen-grace PAID becomes: "bleed i2 d3;
**FALLEN: CLEANSE all your afflictions — for each removed, MARK the enemy 2 and heal
3.**" Now the player must choose between cashing out (big MARK burst + heal, but
Crown goes dark and DEBT tier resets under A1) and staying Fallen for the intensity
engine. The CLEANSE the family table promises finally exists, and it is a *dilemma*,
not hygiene. One-line effect work; the `fallen:` rider channel already exists
(engine.ts:1319-1321).

### A4 — Last Word: mutual-kill clemency while Fallen (rule, theme-gated, S)

While FALLEN, if the player and enemy would both reach 0 in the same resolution
pass, the enemy dies first (scoped check in `pendingOutcome`/the between-phase tick
pass, engine.ts:2484-2486 + 2818-2821; gate on the FALLEN/DEBT state so it stays a
theme privilege, not a global rule change). This converts t2's silent Defeat into
the theme's signature triumph — winning from your deathbed — and makes deliberately
playing *toward* the knife-edge a legitimate line with a felt payoff. Telegraph it
in the UI ("Your debt outlives you by one word."). Zero new complexity for other
themes; pure drama for this one.

### A5 — A third sin (card tweak, S)

Give the preset a third distinct self-affliction so depth-based payoffs have room:
crown-of-thorns' PAID line additionally applies **self-POISON i1 d2** when played
("the crown bites"). Under current rules this makes debtDepth 3 (+2 Crown) reachable
solo; under A1 it accelerates DEBT. One `combatEffects` entry; no new keywords.

Sequencing note: A2+A1 together dissolve the deck's dependence on the conviction
signature (the drip that funds it disappears; the blood economy replaces it) —
retune the early curve afterward, since removing 256 free-Conviction top-plays per
150 fights will drag early win% toward the 80% doctrine target on its own.
