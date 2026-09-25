# Spec 32 — The Themed Deck Library: 10 themes, 70 cards, 30 keywords

> **Status:** HISTORICAL — superseded in full by THE BIG NUMBERS REWRITE
> (2026-09-02, `plan/2026-09-02-big-numbers-overhaul.prompt.md`). This spec's
> card anatomy, keyword registry, rank bands, package shape, reshuffle rule and
> conditionality rule are all repealed. Read it as a period record of the
> 2026-07 library, not as current law.

> **SUPERSEDED IN PART (T direct, /oversight 2026-08-08 — "THE
> UNSHACKLING," commit `ad934542`; executed by Phase 41,
> `plan/archive/2026-09-25-trim-t4/plan/phases/phase_41_constraint_demolition.md`):** §1's no-strike
> doctrine and the FREE-line law below (amendment item 1) are VOID. Cards
> MAY deal raw enemy-HP damage; a FREE line is no longer required to
> deposit theme currency. Both retired laws' enforcing tests
> (`doctrine-strike-dead.engine.test.ts`, the curated-library
> FREE-CURRENCY-LAW block) are deleted, not just disabled. This phase adds
> NO damage to any card — it only removes the law and its lint; a later
> phase decides what (if anything) is authored under the new freedom.
> Everything else below (card anatomy, keyword registry, rarity model,
> the 70-card catalogue, presets, win paths, the engine-change ledger,
> owner decisions) remains the historical record of what shipped and is
> UNCHANGED by this supersession.
>
> **AMENDMENT (owner-ratified 2026-07-10, engagement-audit session —
> decisions of record in
> `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-engagement-overhaul-roadmap.md` §4):**
> 1. **FREE-line law (amends §2) — VOID 2026-08-08, see supersession
>    note above.** ~~every FREE line must deposit theme currency
>    (Premises, Souls, pips, DoT seeds, rapport, wheel/loop
>    advancement…) — never damage, never a bare generic draw. A
>    weak-enough deposit MAY additionally carry a `DRAW 1`-class utility
>    kicker. Lint-enforced like the no-strike gate. Executes as the
>    70-card pass in `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-turn-texture.md` §1 (EA-5).~~
> 2. **TICK is retired from the registry (amends §3):** killed entirely,
>    not renamed; the 10 `free: tickOne` lines die with the FREE pass and
>    PAID tick effects re-author as theme verbs. The registry count may
>    drop below 30 — the "exactly 30" directive yields to earned support
>    (see `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-keyword-registry.md`).
> 3. **DoT clocks differentiate by TRIGGER (amends §3 semantics):**
>    POISON / BLEED / MARK get distinct firing conditions (per-card-played
>    / per-damage-instance / on-payoff class), specced in EA-7.
> 4. **MOMENTUM names the global combat wheel** (engine-native port
>    pending); the Hazard minigame's carry system and
>    `buff_grace_momentum` rename (`plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-momentum-scoping.md`).
>
> **AMENDMENT (phase 29, 2026-07-11 — the keyword-language pass,
> `plan/archive/2026-09-25-trim-t4/plan/phases/phase_29_keyword_registry.md`):** §3's table below is
> corrected to the shipped registry (30 keywords, drifted from the
> original 30 via renames/merges/retirements — not the same 30):
> FESTER→PROLONG, TRANSMUTE→REARGUE, REPRISE→RECALL (renames); BARRIER
> merges into GUARD ("persists" tag); CONJURE retires (zero library
> cards — re-admit if Thoughtform cards ever ship); PERORATION demotes to
> card-local text on its sole carrier (the-closing-word) — the PREMISE
> entry explains the trigger; SIPHON promotes from unglossed card text to
> a registered keyword. TICK is untouched here — amendment 2 above still
> governs its eventual retirement. The CAPITULATE/SWAY rule in the table
> and in §9 is also corrected below to match the 2026-07-08
> resolve-threshold rework (it had drifted stale since that rework
> shipped, independent of this amendment).
>
> **Status:** DESIGN v4 — v4 revises the enchant/disenchant model
> (owner-directed 2026-07-08): these cards gain a FREE (dieless) line that
> grants a TIMED 3-round instance of their passive, with the PAID line
> making the same passive permanent. Everything else is unchanged from v3
> (below), which supersedes v2 (owner-directed 2026-07-07).
> v2's catalogue (75 cards / 4 themes / 6-rank recipe / 5 presets) is
> replaced wholesale; v2's ENGINE machinery (floating-dice live tray,
> persistent enchant/disenchant zone, Premises/Peroration, power-budget
> pricing lint, no-strike doctrine) is retained and extended. Authored
> from the owner's 2026-07-07 directive (themed-deck session; 8 ratified
> answers recorded in §12) + the Dawncaster KB (kb:dawncaster — 1,692
> cards / 141 keywords, github.com/no-trbl-2-u/game-knowledge-base).
>
> **Owner directives (ratified 2026-07-07):**
> 1. Delete ALL old keywords and card outcomes; start over. The current
>    libraries (72 debuffs + 54 buffs, ~80 player-facing keywords) are
>    retired in full. New registry: **exactly 30 keywords** (§3).
> 2. **70 unique cards** — 10 themes × 7 uniques. Strictly
>    self-contained: zero cross-deck card overlap; only the synthetic
>    Retreat card is shared. Every theme expresses its own
>    defense/sustain/draw in its own vocabulary.
> 3. **10 preset decks, 15 cards each**: 4 copies × 2 unique commons,
>    2 copies × 2 unique uncommons, 1 copy × 3 unique rares — all
>    in-theme. Each deck must play fundamentally differently.
> 4. **3 rarities mapped onto the rank ladder** (§4): Common =
>    Doxa/Lemma, Uncommon = Thesis/Theorem, Rare = Axiom/Aporia. Faces
>    keep the rank names; recipes and drop weights use rarity.
> 5. **Card types:** spell (play → discard), enchantment (positive
>    passive, player-side), disenchant (negative passive **attached to the
>    enemy** — a standing curse). v4: enchant/disenchant have a FREE line
>    (a TIMED 3-round instance) and a PAID line (the same passive made
>    permanent, rest of combat). Enemies get enchantments too and may
>    attach disenchants to the player (§10).
> 6. No raw HP damage — no strikes, no chips (unchanged from v2; §1).
>    Same FREE/PAID die economy, same art pool (§11 #15).
> 7. Cards must interact with combat itself: floating dice, card draw,
>    deck order, the discard pile, the enemy's telegraphs.
> 8. Alt-wins allowed: HP remains the main threshold; Befriend stays;
>    CAPITULATE (Charm) is added; one further alt-win is an
>    assumption-confirm (§9).
> 9. A PERFORM spin-off is mandatory (T2 Peroration, kept from v2).
>
> Builds on Spec 31 (Fate Engine): Resonance thresholds, Reserve
> ripening, Omen, fate/X dice, riders, projection-truth law all stay.

---

## 1. Doctrine — the strike stays dead (v2 §1, restated + extended)

> **VOID 2026-08-08 — see the supersession note at the top of this doc.**
> The strike is alive again; this section is kept verbatim as the
> historical record of the doctrine that shipped and governed the 70-card
> library's design. No enforcement of it survives in the test suite.

**Removed from the player's vocabulary entirely, now at the SCHEMA
level:** `basePower`, `chipHp`, strike/chip projection text. The fields
are deleted from `Card`/`CardRider` types so a regression is a compile
error, and a data-lint test bans any card whose resolved play deals HP
damage outside the legal sources below. (Root cause of the recurring
"chip/strike" sightings: v2 specced the purge but never shipped it, and
nothing enforced it — 4 `basePower` cards and 3 `chipHp` riders are
still live on `main`. This gate is non-negotiable in v3.)

**Enemy HP remains the main win condition.** Every point of enemy HP
falls to exactly four sources:

1. **DoT ticks** — poison / bleed, plus TICK riders.
2. **Affliction-payoff bursts** — RUPTURE and REAP-class verbs: bursts
   that exist only because afflictions/Souls were built first (the
   `mechanicDamage` path; caps kept).
3. **Engine-gated drips** — small printed drips (1–3 HP) gated behind a
   running theme engine: BACKFIRE (enemy loses action rungs),
   `bone-orchard` (Souls), `stuck-in-their-head` (ECHO/REPRISE). Never
   playable as a raw burst; the engine must be running first.
4. **Reflect class** — THORNS and RIPOSTE (the enemy's own aggression,
   returned).

Alt-win thresholds (§9) are the sanctioned exceptions to HP: Befriend
(existing, ADR-0007) and CAPITULATE (SWAY, §3/§9).

The v2 no-floor mitigations stand: turn-2 erosion gate, anti-heal
reachability, enemy cleanse < cheapest DoT output, no-zero-capacity
sim gate.

## 2. Card anatomy — types + FREE/PAID (v2 §2, unchanged shape)

| type | lifecycle | anatomy |
|---|---|---|
| **spell** | play → discard; recycled by the reshuffle law | FREE line + PAID line |
| **enchantment** | FREE → timed zone (player side, 3 rounds), recycles · PAID → persistent zone, rest of combat, leaves the deck cycle | FREE line + PAID line |
| **disenchant** | FREE → timed zone **on the enemy** (3 rounds), recycles · PAID → persistent zone **on the enemy**, rest of combat, leaves the deck cycle | FREE line + PAID line |

- FREE line: dieless, small, always available. PAID line: one die, the
  real payload. Budget law: FREE ≈ 25–35% of total points.
- Conditionality is the third pricing lever; every Tier-2+ card carries
  at most ONE condition line (threshold / dieBonus / fate / theme-state).
- Deck exhaustion → reshuffle discard (law; no fatigue mechanic ever).
- **Spec 32 v4** — enchant/disenchant carry BOTH lines. Their FREE line
  grants a WEAK, TIMED instance of the same hooked passive (3 rounds,
  then ticks out; the card recycles); the PAID line is the identical
  passive made **permanent** (rest of combat), unique-in-play per name,
  and leaves the deck cycle. Same effect and magnitude on both lines —
  only the duration differs. A PAID play promotes a live FREE instance.
- More types to come; `cardType` stays an open enum.

## 3. The keyword registry — 30, amended by phase 29

The old effect libraries (`debuffs.library.json` 72 ids,
`buffs.library.json` 54 ids) and the mobile keyword map (~80 entries)
were **retired in full** and rebuilt from this table (v3, 2026-07-08).
Phase 29 (2026-07-11, see the amendment block above) corrected drift that
accumulated since: FESTER→PROLONG, TRANSMUTE→REARGUE, REPRISE→RECALL
(renames); BARRIER merged into GUARD; CONJURE and PERORATION retired from
the table below (CONJURE — zero library cards; PERORATION — demoted to
card-local text, its trigger explained by PREMISE); SIPHON promoted from
unglossed card text. The deprecated-effects ban-list still governs every
id retired in the original v3 purge — phase 29 did not retire any effect
ids, only presentation-layer keyword labels.

### Utility (9) — shared across all themes

| keyword | semantics |
|---|---|
| **DRAW N** | draw N cards |
| **FORGE** | create a floating die: joins the tray now, never rerolls, persists across rounds AND combats, gone forever when spent. Cap 3; forging at cap converts to +1 Conviction (printed) |
| **GUARD N** | block the next N incoming damage; fades at round end — unless the card prints "persists" (the merged BARRIER sense), in which case it carries over until consumed |
| **TICK** | one enemy DoT deals its per-turn damage now (duration unchanged) |
| **MARK iN dM** | light universal affliction: each DoT tick / payoff hit deals +1 per stack; counts as an affliction for RUPTURE / SOUL / REAP |
| **CLEANSE N** | remove N of your own afflictions |
| **HEAL N** | restore N VITAE |
| **RUPTURE N** | consume up to N afflictions on the enemy (ALL, on a finisher): their remaining DoT fuel detonates as one burst, + 3 per non-DoT affliction stack (existing cap kept); consuming a single affliction this way also yields a Soul on the cards that print it |
| **SIPHON N%** | heal for N% of the HP this play deals to the enemy |

### Theme hallmarks (19 — Peroration keeps one, not two)

| theme | keyword | semantics |
|---|---|---|
| Affliction | **POISON iN dM** | ramping DoT (escalates per turn; honest printed curve) |
| Affliction | **BLEED iN dM** | front-loaded DoT; decays 1 intensity per trigger |
| Peroration | **PREMISE** | persistent tally (the argument under construction); when it reaches a declared conclusion's printed number, the conclusion fires FREE and the tally resets — a concede-line conclusion ends the fight outright |
| Forge | **KINDLE** | create a temporary die (this combat only) |
| Forge | **PIP** | add 1 pip to a die you hold; pips empower riders and are spendable by payoff verbs |
| Akrasia | **RECOIL N** | pay N VITAE (unpreventable) as a printed cost |
| Akrasia | **FALLEN** | state: you carry ≥2 self-afflictions; FALLEN-gated riders go live |
| Control | **STAGGER N** | remove N rungs from the enemy's telegraphed action; at 0 rungs it is denied (builds on the P2 threat-downgrade ladder) |
| Control | **BACKFIRE iN dM** | while active: the enemy takes N per rung its actions lose |
| Oracle | **FORETELL N** | look at the top N cards of your deck, reorder them, and glimpse the enemy's next telegraph |
| Oracle | **OMEN** | declare the printed prediction; if it comes true by your next turn, the rider fires free |
| Harvest | **SOUL** | gain 1 Soul whenever an enemy affliction stack expires or is consumed |
| Harvest | **REAP N** | spend N Souls to fire the printed effect |
| Charm | **SWAY N** | stacks on the enemy; decays 1/turn; reaching resolve — 35% of max HP (never below 10), or current HP if lower — opens an explicit ACCEPT / CONTINUE capitulation choice (§9) |
| Charm | **RAPPORT iN dM** | the enemy deals N less damage while active |
| Bulwark | **THORNS iN dM** | attacker takes N whenever it damages you |
| Bulwark | **RIPOSTE iN dM** | when your Guard fully blocks an attack, the enemy takes N |
| Echo | **ECHO** | the printed line fires twice |
| Echo | **RECALL N** | return N cards from your discard pile to hand |

Affliction also carries two glue keywords beyond its hallmark pair —
**PROLONG N** (extend all your DoTs by N turns) and **REARGUE iN** (flip
the enemy's Bleed↔Poison, +N intensity) — bringing the shipped registry to
30 total (9 utility + 19 hallmarks + 2 affliction glue).

Retired (never renamed — ids die, ban-list enforces): burn, hemorrhage,
septic, unraveling, despair, torment and all DoT clones; stun, sleep,
petrify, paralyze, charm(old), silence, confusion, fear, slow, root,
daze and the control zoo; weaken/enfeeble/sunder/vulnerable/expose and
the stat-down zoo; COMPOUND, AMPLIFY, EXECUTE, REACT as standalone
verbs (REAP/RUPTURE absorb the payoff role); Premises/verbs not listed
above. Existing engine tokens (Conviction, Resonance, Reserve, stance
tiers) are systems, not card keywords — unchanged.

## 4. Rarity model — the ladder maps onto 3 rarities

`rank: 1..6` (Doxa → Lemma → Thesis → Theorem → Axiom → Aporia) stays
on the card and on the face; `rarity` is the derived band the deck
recipe and drop weights use:

| rarity | ranks | band (pts) | recipe slot |
|---|---|---|---|
| **common** | Doxa (1), Lemma (2) | 2 – 6 | 4 copies each of 2 uniques |
| **uncommon** | Thesis (3), Theorem (4) | 6.5 – 12 | 2 copies each of 2 uniques |
| **rare** | Axiom (5), Aporia (6) | 12.5+ / rule-text | 1 copy each of 3 uniques |

`tier` (1/2/3 resist rules) is untouched and orthogonal. The v2
power-budget point table (1 pt ≈ 3 HP neutral-read swing; conditional
discounts threshold ×0.5, dieBonus ×0.6, fate ×0.7, theme-state ×0.5;
self-cost credits −0.75×) carries over verbatim, extended with:
SWAY 1 ≈ 0.8 · RAPPORT i1 d2 ≈ 1.5 · STAGGER 1 ≈ 4 (phase-deny
equivalent) · BACKFIRE i1 d2 ≈ 1.5 · FORETELL 1 ≈ 1 · OMEN rider ≈
rider pts × 0.6 · SOUL grant ≈ 0.75 · ECHO ≈ ×1.8 on the doubled line ·
REPRISE 1 ≈ 2 · KINDLE 2.5 · PIP 1.5 · FORGE 5 (+1 per preloaded pip).
Coefficients live in one table module; every card ships its arithmetic
in a comment; a lint test asserts the sum lands in the printed rank's
band. `/deck-tuning` remains the empirical court.

## 5. Floating dice — the live-tray model (v2 §5, unchanged)

Grant via FORGE (PAID-only): the die joins the tray NOW, is exempt from
the round reroll, is written to the character save at combat end, and
arrives in the next battle's opening tray. Spent = gone forever. Cap 3
(at cap → +1 Conviction, printed). Floating dice feed Resonance when
spent and may NOT be banked to Reserve. Intent: bigger turns.

## 6. The ten themes

Each theme: 7 unique cards (2 common spells, 2 uncommon spells, 1 rare
spell finisher + 1 rare enchantment + 1 rare disenchant), 2 hallmark
keywords, its own in-theme defense/sustain, and a distinct win texture.

| # | theme | stance lean | engine | win texture |
|---|---|---|---|---|
| T1 | **Affliction** | Body/Mind | stack → extend → convert DoTs | inevitable erosion, detonated |
| T2 | **Peroration** | Heart | Premises → declared conclusion | periodic conclusion bursts (the PERFORM spin-off) |
| T3 | **Forge** | Mind | manufacture dice/pips | resource superiority → one overwhelming turn |
| T4 | **Akrasia** | Heart/Body | self-harm loans, FALLEN | fast erosion paid for in blood |
| T5 | **Control** | Mind/Body | strip action rungs | the enemy never really acts; BACKFIRE drips it down |
| T6 | **Oracle** | Mind/Heart | information + predictions | called shots — omens cash into payoffs |
| T7 | **Harvest** | Body/Mind | churn short afflictions → Souls | REAP executes funded by expiry |
| T8 | **Charm** | Heart | SWAY + RAPPORT | CAPITULATE / Befriend — wins without dropping HP |
| T9 | **Bulwark** | Body | Guard/Barrier walls | THORNS/RIPOSTE: their aggression kills them |
| T10 | **Echo** | Mind | recursion of the discard | small effects, multiplied relentlessly |

## 7. The card catalogue (70)

Format: **card (stance+tier, type)** · rank · FREE | PAID | ⬡ condition
· pts (est.; lint-audited arithmetic ships in the TS). S=spell,
E=enchantment, D=disenchant. v4: E/D have a FREE (timed, 3-round) line
and a PAID (permanent) line — same passive, only the duration differs.

### T1 — Affliction

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| slippery-slope (B2, S) | Doxa | tick | poison i1 d4 (prints "2,2,3,3 = 10") | — | 3.9 (starter) |
| straw-mans-jab (B1, S) | Lemma | tick | bleed i2 d2 | dieBonus body: +1 int | 4.6 |
| festering-argument (M2, S) | Thesis | tick | +1 duration to ALL your bleeds AND poisons | — | 6.8 |
| currys-conversion (M2, S) | Theorem | draw 1 | convert enemy bleed↔poison at equal intensity, +1 int | — | 8.5 |
| resonance-detonation (H3, S) | Axiom | tick | RUPTURE | — | 13.0 |
| venom-and-vein (B2, E) | Axiom | — | *(combat)* your bleed and poison land +1 intensity | — | ~12.5 |
| suppurating-curse (M2, D) | Aporia | — | *(combat)* enemy takes +1 HP per DoT tick | — | engine text |

### T2 — Peroration

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| exordium (H1, S) | Doxa | +1 Premise | draw 1 + 1 Premise | — | 3.6 |
| opening-statement (H1, S) | Lemma | +1 Premise | mark d2 + 2 Premises | — | 4.4 |
| mounting-case (M2, S) | Thesis | +1 Premise | mark d3 + 2 Premises | threshold Heart 2: +1 Premise | 6.9 |
| peroratio-interrupta (M2, S) | Theorem | draw 1 | spend ALL Premises: +1 mark stack per 2 spent, draw 1 per 3 spent | — | ~9 |
| the-closing-word (H3, S) | Axiom | +1 Premise | **PERORATION** at 6: consume all marks (3 per stack), draw 2, +2 Conviction | — | ~13 |
| practiced-cadence (H2, E) | Axiom | — | *(combat)* your first card each turn grants +1 Premise | — | ~12.5 |
| captive-audience (H2, D) | Aporia | — | *(combat)* while you hold 4+ Premises, enemy is marked i1 (standing) | — | engine text |

### T3 — Forge

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| sketch-of-a-thought (M1, S) | Doxa | draw 1 | KINDLE (mind) | — | 3.5 |
| half-step (B1, S) | Lemma | Guard 2 | Guard 5 + PIP | — | 4.3 |
| bootstrap-loop (M2, S) | Thesis | +1 Conviction | KINDLE (wild) | threshold Mind 2: arrives with 1 pip | 6.5 |
| ex-nihilo (M2, S) | Theorem | draw 1 | **FORGE** (color of the powering die) | threshold Mind 4: lands with 1 pip | 9.8 |
| the-overtake (B2, S) | Axiom | Guard 2 | spend ALL pips: RUPTURE with +2 fuel per pip spent | — | ~13 |
| anvil-of-form (M2, E) | Axiom | — | *(combat)* kindled and floating dice arrive with +1 pip | — | ~12.5 |
| entropy-tax (M2, D) | Aporia | — | *(combat)* whenever you spend a kindled or floating die, enemy gains mark i1 d2 | — | engine text |

### T4 — Akrasia

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| against-my-judgment (H1, S) | Doxa | +1 Conviction | draw 2 + self-mark d2 (credit) | — | 3.4 |
| sweet-poison (B2, S) | Lemma | tick | poison i2 d4 + self-bleed i1 d2 (credit) | — | 5.2 |
| self-flagellant (B2, S) | Thesis | tick | RECOIL 4: +1 intensity to ALL enemy DoTs | — | 7.2 |
| fallen-grace (H2, S) | Theorem | draw 1 | bleed i2 d3 | **FALLEN**: also heal 4 | 9.5 |
| pact-of-akrasia (B3, S) | Axiom | Guard 2 | **FORGE** (wild) + RECOIL 6 + self-bleed i1 d2 (credits) | — | 12.6 (cheapest forge in points, paid in blood) |
| crown-of-thorns (H2, E) | Axiom | — | *(combat)* while FALLEN, your status applications land +1 intensity | — | ~12.5 |
| mirror-of-guilt (M2, D) | Aporia | — | *(combat)* whenever you gain a self-debuff, enemy gains 1 stack of it too | — | engine text |

### T5 — Control

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| zenos-half-step (B1, S) | Doxa | Guard 2 | STAGGER 1 | — | 3.8 |
| red-herring (M1, S) | Lemma | draw 1 | BACKFIRE i2 d2 | dieBonus mind: +1 duration | 4.9 |
| undistributed-middle (M2, S) | Thesis | mark d1 | STAGGER 1 + BACKFIRE i1 d2 | threshold Mind 3: STAGGER 2 | 7.4 |
| arrow-paradox (B2, S) | Theorem | Guard 2 | lock enemy stance + STAGGER 1 | — | 9.8 (motion frozen mid-flight) |
| paralysis-of-analysis (M3, S) | Axiom | draw 1 | STAGGER 2 + BACKFIRE i2 d2 | — | ~13 |
| achilles-and-the-tortoise (M2, E) | Axiom | — | *(combat)* whenever an enemy action rung is denied, draw 1 | — | ~12.5 |
| quagmire-of-doubt (M2, D) | Aporia | — | *(combat)* enemy telegraphs enter play 1 rung lower | — | engine text |

### T6 — Oracle

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| glimpse (M1, S) | Doxa | FORETELL 1 | FORETELL 2 + mark d2 | — | 3.8 |
| signs-and-portents (H1, S) | Lemma | FORETELL 1 | OMEN — enemy's next stance: on hit, draw 2 | — | 4.6 |
| cassandras-burden (H2, S) | Thesis | draw 1 | OMEN — enemy's next stance: on hit, mark i2 d2 + Guard 4 | — | 7.0 |
| delphic-ambiguity (M2, S) | Theorem | FORETELL 1 | FORETELL 3 + reveal enemy's next 2 phases | dieBonus mind: also PIP | 9.2 |
| prophecy-fulfilled (M3, S) | Axiom | FORETELL 1 | RUPTURE: +3 fuel per omen hit this combat | — | ~13 |
| the-oracles-eye (H2, E) | Axiom | — | *(combat)* enemy's next stance always revealed; your OMEN riders +50% | — | ~12.5 |
| fated-course (M2, D) | Aporia | — | *(combat)* enemy cannot change a revealed intent; acting into a hit omen marks it i1 | — | engine text |

### T7 — Harvest

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| brief-candle (B1, S) | Doxa | tick | bleed i2 d1 (burns fast; expiry feeds SOUL) | — | 3.4 |
| memento-mori (M1, S) | Lemma | +1 Soul | mark i2 d1 | — | 4.2 |
| winnowing (B2, S) | Thesis | tick | consume 1 enemy affliction: its remaining fuel ticks now + gain 1 Soul | — | 7.0 |
| the-gleaners-due (M2, S) | Theorem | draw 1 | REAP 3: KINDLE + draw 2 | — | ~9 |
| the-reaping (B3, S) | Axiom | tick | REAP all: burst 2 per Soul spent (cap kept) | — | ~13 |
| bone-orchard (M2, E) | Axiom | — | *(combat)* whenever you gain a Soul, enemy takes 1 | — | ~12.5 |
| the-tithe (M2, D) | Aporia | — | *(combat)* enemy afflictions expire 1 turn sooner; each expiry yields +1 Soul | — | engine text |

### T8 — Charm

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| soft-word (H1, S) | Doxa | heal 2 | SWAY 3 | dieBonus heart: +1 SWAY | 3.6 |
| disarming-smile (H1, S) | Lemma | SWAY 1 | RAPPORT i2 d2 + heal 2 | — | 4.8 |
| common-ground (H2, S) | Thesis | draw 1 | SWAY 2 + RAPPORT i1 d2 | threshold Heart 3: +2 SWAY | 7.2 |
| the-olive-branch (B2, S) | Theorem | Guard 2 | SWAY 3 + cleanse 1 + heal 3 | — | 9.0 |
| heart-of-the-matter (H3, S) | Axiom | SWAY 1 | SWAY 5 + heal 4 | threshold Heart 5: SWAY 8 instead | ~13 |
| irresistible-grace (H2, E) | Axiom | — | *(combat)* your SWAY no longer decays | — | ~12.5 |
| mirror-of-longing (H2, D) | Aporia | — | *(combat)* enemy attacks add SWAY equal to the damage your Guard/RAPPORT prevented | — | engine text |

### T9 — Bulwark

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| brace-for-impact (B1, S) | Doxa | Guard 2 | Guard 8 | +2 Guard per pip on spent die | 3.6 (starter) |
| nettle-cloak (B1, S) | Lemma | Guard 2 | THORNS i2 d2 | — | 4.4 |
| tu-quoque (H2, S) | Thesis | Guard 2 | THORNS i3 d2 | dieBonus body: +1 duration | 6.8 |
| measured-answer (B2, S) | Theorem | Guard 3 | Guard 6 + RIPOSTE i3 d2 | — | 9.2 |
| the-adamant-wall (B3, S) | Axiom | Guard 3 | BARRIER 10 + RIPOSTE i4 d2 | — | ~13 |
| hedgehogs-dilemma (B2, E) | Axiom | — | *(combat)* THORNS triggers also mark the enemy i1 d2 | — | ~12.5 |
| crumbling-resolve (B2, D) | Aporia | — | *(combat)* enemy attacks that fail to break your Guard lose 1 rung on the next telegraph | — | engine text |

### T10 — Echo

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| refrain (M1, S) | Doxa | draw 1 | mark d2, ECHO | — | 3.7 |
| second-thoughts (M1, S) | Lemma | draw 1 | REPRISE 1 | — | 4.5 |
| ad-nauseam (M2, S) | Thesis | mark d1 | your next spell this turn gains ECHO | dieBonus mind: draw 1 | 7.0 |
| circular-reasoning (M2, S) | Theorem | draw 1 | REPRISE 1; the reprised card's FREE line fires now | — | 9.4 |
| ouroboros (M3, S) | Axiom | draw 1 | replay the PAID line of the last spell you played, ECHO | — | ~14 |
| resonant-chamber (M2, E) | Axiom | — | *(combat)* the first spell you play each turn gains ECHO | — | ~12.5 |
| stuck-in-their-head (H2, D) | Aporia | — | *(combat)* whenever you ECHO or REPRISE, enemy takes 2 | — | engine text |

Counts: 10 themes × 7 = **70**. Per theme: 2 common S, 2 uncommon S,
1 rare S + 1 rare E + 1 rare D. Registry: 30 keywords exactly (§3).

**Retired outright:** every card in the current 49-card library that
does not appear above retires to git history (no rescues — owner rule
carried from v2; `/deck-tuning` may re-promote identities later).
Kept-and-recut from v2's unshipped catalogue where names match.

**Starting deck:** slippery-slope + brace-for-impact + Retreat
(unchanged; both starters teach a mechanic in fight one).

## 8. The ten preset decks

Recipe (all decks): C1 ×4, C2 ×4, U1 ×2, U2 ×2, R-spell, R-enchant,
R-disenchant = **15 cards** + synthetic Retreat. Ratified 2026-07-12
(§12 item 9): every recipe carries exactly **5 body / 5 mind / 5
heart** by `philosophicalAspect` (partition 4+1 / 4+1 / 2+2+1),
borrowing cross-theme utility cards where the theme's own colors
cannot cover it.

| preset id | name | theme |
|---|---|---|
| `erosion` | Erosion | T1 Affliction |
| `oratory` | Oratory | T2 Peroration |
| `foundry` | Foundry | T3 Forge |
| `penitent` | Penitent | T4 Akrasia |
| `standstill` | Standstill | T5 Control |
| `augury` | Augury | T6 Oracle |
| `tithe` | Tithe | T7 Harvest |
| `grace` | Grace | T8 Charm |
| `bastion` | Bastion | T9 Bulwark |
| `refrain` | Refrain | T10 Echo |

Playtest law: the combat-playtest matrix gains a **deck axis** (stage ×
policy × preset), plus a per-theme **engine-ignition gate**: each
preset's theme engine must demonstrably turn on by turn N (N per theme,
sim-pinned) in every seeded run. Win ratio is NOT a constraint (enemies
strengthened separately); rank honesty and deck distinctness ARE.

## 9. Win paths

- **HP to 0** — the main threshold, universal.
- **Befriend** — existing mercy path (ADR-0007, untouched); RAPPORT and
  the Charm deck accelerate it.
- **CAPITULATE** (ratified; corrected by phase 29 to the shipped
  2026-07-08 resolve-threshold rework) — the enemy yields the moment your
  SWAY reaches its resolve: 35% of its max HP (never below 10), or its
  current HP if that is lower. Counts as a merciful resolution for
  morality systems. Charm's identity: it can win without ever touching HP.
- **CONCEDE** (ratified 2026-07-07) — second alt-win: a completed
  8-Premise Aporia-grade Peroration wins the argument outright. Ships
  as a Peroration upgrade path on `the-closing-word`, not a new card
  slot.

## 10. Enemies

**This overhaul:** enemies keep their telegraph AI but gain the
persistent layer — each enemy may open with (or play) an enchantment
(self-side passive) and may attach a disenchant to the player (a
standing curse in the player's persistent zone; CLEANSE-class answers
apply). Enemy passives are authored per-enemy in the bestiary, priced
by the same point table.

**Deferred (logged in `plan/PHASE_CANDIDATES.md`):** enemies drawing
and playing from their own themed decks — the long-term goal; a
follow-up phase after the 10 player decks prove out.

## 11. Engine-change ledger (sized S/M/L)

| # | change | cost |
|---|---|---|
| 1 | **Strike purge at schema level**: delete `basePower`/`chipHp`/strike riders from types; purge "Chip/strike" projection text; regression lint banning direct-HP fields + a data test that no card damages HP outside §1's four sources | **M** |
| 2 | `rank` 1–6 + derived `rarity` + `cardType` + pricing-lint (table module, per-card arithmetic comments) | **M** |
| 3 | Floating dice live tray (save-persisted pool, tray injection, reroll exemption, cap-3 valve, FORGE verb) | **M** |
| 4 | Persistent zone: player enchantments + enemy-attached disenchants + enemy-side passives (both directions), play path, trigger eval | **M/L** |
| 5 | Effect-library reset: rebuild `Effects/*.library.json` to the 30-keyword set; regenerate deprecated-ids ban-list; rewrite mobile `state/combat/keywords.ts` (30 entries) | **M** |
| 6 | Premise tally + PERORATION slot + spend-Premises verb | **M** |
| 7 | STAGGER rungs + BACKFIRE (extends P2 threat-downgrade ladder) | **M** |
| 8 | FORETELL + OMEN (extends Spec 31 Omen) | **M** |
| 9 | SOUL / REAP economy | **S/M** |
| 10 | SWAY / RAPPORT + CAPITULATE alt-win + morality hook | **M** |
| 11 | ECHO / REPRISE + CONJURE (Thoughtforms) | **M** |
| 12 | KINDLE / PIP (wraps existing `create_temporary_die` / `grant_pip`) | **S** |
| 13 | THORNS / RIPOSTE (thorns exists; full-block riposte trigger) | **S** |
| 14 | 10 presets + recipe; playtest matrix deck axis + engine-ignition gates; card-coverage and preset tests re-pinned | **M** |
| 15 | Art: reuse the existing 18 paintings, reassign by theme in mobile `assets/images/cards/index.ts` | **S** |
| 16 | Rewards: per-rank drop weights (generalize gold-weighting) | **S** |

Implementation order: 1+2+5 (purge, schema, keyword reset — the
foundation) → 3+4 (dice + persistent zone) → theme mechanics in deck
pairs (6..13), each landing with its preset + tests → 14 → 15+16.
Every step re-verifies mobile + card-editor (the `@mechanics` barrel
contract).

## 12. Owner decisions — ratified 2026-07-07

1. **Supersede v2 with v3**; keep v2's engine machinery. (yes)
2. **Ladder → 3 rarities** mapping; faces keep rank names. (yes)
3. **Strictly 70 self-contained cards**; only Retreat shared. (yes)
4. **Disenchants attach to the enemy** (standing curse); enemies may
   attach them to the player. (yes)
5. **10 themes as proposed**: Affliction, Peroration, Forge, Akrasia,
   Control, Oracle, Harvest, Charm, Bulwark, Echo. (yes)
6. **Enemies: persistent passives only** this pass; themed enemy decks
   logged as a phase candidate. (yes)
7. **Alt-wins**: Befriend + CAPITULATE ratified; 1 more allowed —
   CONCEDE held as A1. (yes)
8. **Delivery**: spec v3 → owner ratification → implement in ordered
   phases. (yes)

**Assumption-confirms — ALL RATIFIED 2026-07-07 ("keep them all"):**

- **A1** — CONCEDE alt-win included (§9).
- **A2** — SWAY decays 1/turn (the tension knob; `irresistible-grace`
  removes it). Tune via `/deck-tuning`.
- **A3** — MARK as the universal glue affliction (+1 per tick per
  stack; counts for RUPTURE/SOUL/REAP).
- **A4** — fallacy/paradox categories and their ⚖/∞ tokens unchanged;
  new cards keep philosophy-flavored naming.
- **A5** — engine-gated drips (§1 source 3) as a sanctioned HP class:
  BACKFIRE, bone-orchard, stuck-in-their-head. They are the Control /
  Harvest / Echo win routes; without them those decks cannot close.

### Ratified 2026-07-11 — card-library improvement plan owner batch

Provenance: decisions adopted via the owner's full-plan implementation
directive (2026-07-11 session); each item adopts the documented
recommendation of the card-library improvement plan
(`plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md`).

1. **WS0.2 direct-HP exceptions** — classes (a) status-gated payoffs,
   (b) A5 enchant-gated drips, and reflect (THORNS/RIPOSTE) are legal
   because their prerequisite is printed. Class (c) mercy-exploit is
   the alternate-outcome consequence — legal only from the mercy
   screen. Signatures: Conclusion fires only per status stack (kind
   `conclude`); Disarming Plea's flat-magnitude chip (kind `mercy`) is
   KEPT as a signature-only ratified exception. The `strike` signature
   kind and `STRIKE_DAMAGE_MULT` are dead vocabulary — deleted. (yes)
2. **WS0.3 die-cost laws** — deprecate-in-place (recommendation i).
   The Color Law owns play legality/die COST; `resolveCardDieCost` is
   retained as the advantage-read classifier; `@deprecated` on the
   barrel export; mobile migration filed as follow-up; no removal
   (locked-barrel rule). (yes)
3. **WS3.0 DoT clocks** — schema ratified: `DamageOverTime` gains
   `trigger?: 'round-start' | 'round-end' | 'card-played' |
   'damage-instance' | 'payoff'` (absent = legacy `tickPhase`), and
   `dotModifiers` gains `calendarExpiry?: false` and
   `growth?: 'per-enemy-action'`. Calendar-expiry removal for clocked
   effects (bounded windows bound the PAYOFF instead). Doom-shaped
   species (grows when the enemy acts) ratified as a card-local
   effect, explicitly NOT keyword #31. Trigger definition:
   'per-card-played' counts PLAYER-side cards only. (yes)
4. **WS4 bulwark/charm + combat ledgers** — Phase 32's ratified
   "RIPOSTE reflects the prevented blow" WINS over the
   consume-all-defense alternative — Rampart Reckoning's
   `consume_defense` mechanic kind is NOT added; bulwark theme work
   uses the ratified RIPOSTE direction plus Grit Between Stones and
   The Unmoved Mover. Combat ledgers ratified as one schema item:
   `recoilPaidThisTurn`, `enemyDamageThisTurn`, `enemyDamageLastRound`
   (plus `lastThreatFullyBlocked` for WS9). Charm decay-pause
   (Steadfast Regard) and SWAY-on-SWAY scaling (Crescendo of
   Affection) stay CONDITIONAL — build only if post-re-baseline
   (Phase 26/27) telemetry still shows the charm late hole. (yes)
5. **WS7 payoff caps + chooseX** — ALL-spenders (REAP-ALL,
   spend-all-pips) become uncapped — input opportunity cost is the
   balance lever; RUPTURE keeps a pure-fraction cap with the fraction
   chosen by the supervised sweep over F ∈ {0.25, 0.35, 0.45, 0.60}
   (floor removal lowers early caps, so F must rise as the floor
   falls). chooseX plumbing ratified, bounded to `recoil_x` as the
   first chooseX; first card The Open Vein (sandbox-first). (yes)
6. **WS8.3 DISRUPT meter** — the meter counts distinct control
   SURFACES (actionRestriction / roll / threat-damage /
   rider-suppress / stance), not distinct effect ids;
   `DISRUPT_DENY_AT = 3` means three different kinds of grip. (yes)
7. **WS9.1 threat branch nodes** — ratified:
   `AuthoredThreatStep = AuthoredThreatPhase | { branch: { condition;
   then; else } }` with the closed condition union
   `{ kind: 'bearer-afflictions-gte'; n } |
   { kind: 'prior-threat-fully-blocked' }`; zero RNG; branch resolves
   at phase START; the mobile telegraph must show condition + both
   outcomes before commit. (yes)
8. **WS10 atlas** — TICK's death leaves the atlas at 29 rows —
   accepted, no replacement ratified. BARRIER/GUARD merge is deferred
   to KW-2 pending the WS4/WS6 orphan-drilling outcome (whatever still
   sits at one card after those passes goes to the KW-2 merge/retire
   list). (yes)
9. **(2026-07-12) Preset color law — 5/5/5 by aspect** — every 15-card
   preset recipe MUST carry exactly 5 body / 5 mind / 5 heart cards by
   `philosophicalAspect` (`cardStanceColor`). All three die colors are
   always possible in the tray, and the Color Law otherwise strands
   off-color dice: the owner playtest found foundry / standstill /
   tithe at ZERO heart — every purple die dead for card play. Under
   the fixed 4/4/2/2/1/1/1 recipe the only legal partition of 15 into
   5/5/5 is 4+1 / 4+1 / 2+2+1: the two commons in two DIFFERENT
   colors, both uncommons in the THIRD color, and the three rares one
   of each color. Where a theme's own 7 cards cannot satisfy the
   partition, the preset borrows utility-leaning cards of the missing
   color from the library (same rarity slot, same cardType slot) —
   color playability outranks strict theme purity in preset
   composition; the theme's hallmark engine cards stay. The UI
   hard-blocks illegal die drops (Color Law, unchanged). Provenance:
   owner playtest directive, 2026-07-12. (yes)
