# Spec 32 — The No-Strike Library: utility/status card revamp + rank ladder

> **Status:** DESIGN v2 — owner-ratified 2026-07-06 (all §9 v1 questions
> answered in session; remaining open items in §9 are assumption-confirms,
> not blockers). Authored from the owner's directive (Dawncaster card
> revamp session) + a mechanics-expert deep-mine of the Dawncaster KB
> (kb:dawncaster — 1,692 cards / 141 keywords,
> github.com/no-trbl-2-u/game-knowledge-base,
> `KnowledgeBase/DigitalCardGames/dawncaster/`).
>
> **Owner directives (ratified):**
> 1. NO raw HP damage — no strikes, no chips. Cards draw, forge floating
>    dice, provide utility, or cause status effects. Status-payoff verbs
>    (rupture/compound/amplify/execute/react) are the ONLY HP-touching
>    cards (they require statuses first).
> 2. FREE/PAID mixing ("draw 1 / poison 5" vs "poison 2 / draw 3") with an
>    internal exchange rate; some cards are flat-out better ON PURPOSE.
> 3. Rank ladder beyond 3 tiers: **Doxa → Lemma → Thesis → Theorem →
>    Axiom → Aporia** (6 steps; Aporia = rule-rewriters, not bigger
>    numbers). Mechanical `tier` (resist rules) is a separate field.
> 4. **Four themes, each covered at EVERY rank:** DoT (bleed+poison
>    merged), Peroration, Forge, Akrasia. Fewer keywords, more cards
>    interacting with each keyword — focused deckbuilding over
>    hodge-podge. (Cassandra/Syllogism/Dialectic cut as named packages;
>    their best verbs survive as plain condition lines and staples.)
> 5. **Card types:** enchantments (persistent player-side passives, rest
>    of combat), disenchants (persistent effects, rest of combat — §2.1),
>    spells (everything else: play → discard). More types to come.
> 6. Deck exhaustion → reshuffle the discard into a new deck. (Already
>    the engine's behavior — `combat.deck.ts:92-98`; codified here as
>    law: NO combat-fatigue mechanic may be added on top of it.)
> 7. Floating dice: live-tray model (§5). Cap 3. Intent: bigger turns.
> 8. Library ~75 cards while deck types are tested. Win ratio explicitly
>    NOT a constraint (enemies strengthened separately); rank honesty IS.
>
> Builds on Spec 31 (Fate Engine): Resonance thresholds, Reserve
> ripening, Omen, fate/X dice, riders, projection-truth law all stay.
> This spec replaces the card LIBRARY, adds the rank ladder, card types,
> themes, and the floating-die economy; §1.1 lists the two Spec 31
> amendments.

---

## 1. Doctrine change — the strike dies

**Removed from the player's vocabulary entirely:**

- `basePower` flat damage on any card.
- `chipHp` riders AND "chip 2" FREE lines ("tick" — one immediate tick of
  an enemy DoT — is the canonical small line instead).
- `riposte.damage`; riposte survives as pure parry (`reduce` only).
- Conviction/token-fueled raw bursts.

**Enemy HP remains the sole win condition** (`isDefeated(enemy)`). Every
point of enemy HP falls to exactly three sources:

1. **DoT ticks** — poison / bleed / burn / hemorrhage / septic /
   unraveling / despair, plus `tickAllDots` riders.
2. **Status-payoff verbs** — RUPTURE / COMPOUND / AMPLIFY / EXECUTE /
   REACT: HP bursts that exist *only because statuses were built first*.
   (Already on the separate `mechanicDamage` path — they survive the
   purge cleanly.)
3. **Reflect/thorns-class effects.**

This completes the 2026-06 load-bearing doctrine: status play stops being
the *efficient* path and becomes the *only* path.

### 1.1 Spec 31 amendments

- **§4.2 / R7:** surviving strike cards are re-cut (§7); R7's "+3 flat on
  strike/defend" becomes "+2 Guard on defend cards" (status cards keep
  +1 duration). `DIRECT_DAMAGE_WEIGHT` goes dead and is purged.
- **§6 invariants:** the 2-rolled-dice draft and the single-die law are
  PRESERVED; floating dice are additional tray dice governed by §5's cap
  and are exempt from the reroll — the invariant list gains: "floating
  dice never reroll and never exceed cap 3."

### 1.2 No-floor mitigations (mechanics-expert D1/D2)

- **Turn-2 erosion gate (sim/CI):** every legal starting hand of every
  preset must be able to begin eroding enemy HP by turn 2.
- **Anti-heal reachability:** despair must stay reachable from
  starter-adjacent ranks (it is: §7, Lemma).
- **Enemy design law:** enemy cleanse/heal per phase < the cheapest Doxa
  DoT's per-turn output (enforced when enemies are strengthened).
- **No-zero-capacity gate (sim/CI):** no seeded fight may reach a state
  where the player's pending damage capacity is 0 with no card that can
  change it.

## 2. Card anatomy — types + FREE/PAID

### 2.1 Card types (new field: `cardType`)

| type | lifecycle | anatomy |
|---|---|---|
| **spell** | play → discard pile; recycled by the reshuffle law | FREE line + PAID line (§2.2) |
| **enchantment** | play → **persistent zone** for the rest of the combat; leaves the deck cycle; fires its passive continuously/on-trigger | PAID-only (a die is the commitment; no FREE line) |
| **disenchant** | play → persistent zone for the rest of the combat, **attached to the enemy** — a standing curse/aura working against the foe | PAID-only |

- Enchantments are the owner's "passive bonus that strengthens poison"
  card; disenchants are their enemy-facing mirror (working assumption
  §9 A1: *enchant = passive on you, disenchant = passive on the enemy*).
- The persistent zone already exists in the Hazard shape
  (`persistentZone`, spec 25 §"Enchantment zone"); this wires it for
  real.
- More types to come (owner note); `cardType` is an open enum.
- Spec 25's open Q1 (hand persistence) is unchanged — hands still draw
  fresh each phase; the reshuffle law (§ header, directive 6) governs
  the deck/discard cycle underneath it.

### 2.2 FREE / PAID (spells)

```
┌─────────────────────────────┐
│  CARD NAME          [rank]  │
│  FREE  draw 1               │   ← dieless, small, always available
│  PAID  poison i2 d4         │   ← one die, the real payload
│  ⬡ condition line           │   ← threshold / dieBonus / fate /
│                             │     theme-state (Premises / Fallen)
└─────────────────────────────┘
```

- FREE and PAID draw from the SAME verb menu (§3): "draw 1 / poison 5"
  and "poison 2 / draw 3" are both legal — same budget, opposite shapes.
  (Dawncaster runs this exact trade at Common: kb:dawncaster/cards/1565
  vs /cards/0002.)
- Budget law: **FREE ≈ 25–35% of the card's total points** (§4).
- **Conditionality is the third pricing lever** (kb:dawncaster/cards/0364)
  — conditional riders are discounted, never free.
- Every Tier-2+ card carries at most ONE condition line (Spec 31 P1 law).

## 3. The verb menu (post-strike vocabulary)

**B** = suits PAID magnitudes, **T** = suits FREE magnitudes.

| family | verbs |
|---|---|
| **Status — DoT** (BT) | poison, bleed, burn, hemorrhage, septic, unraveling, despair; "tick" (single immediate tick of one enemy DoT) is the canonical small FREE line |
| **Status — control** (B) | confusion, fear, slow, root, silence, charm, stagger, sensory-null |
| **Status — exposure** (BT) | vulnerable, vulnerability(stance), mark, doubt, overextended, novikov (next-DoT-upgrade) |
| **Status — self-buff** (BT) | resolute, regeneration, life-steal, thorns, clarity, negation |
| **Draw / hand** (BT) | draw N; conjure_card (one-use Thoughtform into hand) |
| **Foresight** (BT) | revealStance (1 / 2 / all phases), lock enemy stance, telegraph-downgrade — plain verbs now, no tally |
| **Dice — in-combat** (B) | create_temporary_die, grant_pip, bank_spent_die, refresh_die, convert_die_color, reroll_spent, spendAllPips (cash total Reserve pips into a rider) |
| **Dice — persistent** (B) | **forge_floating_die** (§5): joins the tray NOW, never rerolls, carries across rounds AND combats until spent |
| **Defense** (BT) | guard, barrier, riposte (pure parry), cleanse, heal, conviction |
| **Status payoffs** (B) | rupture, compound, amplify, execute, react, tickAllDots, siphon |
| **Theme currencies** (BT) | premise +N / Peroration slot (§6 T2); Fallen state (§6 T4); DoT cross-keyword verbs — extend/convert/boost bleed AND poison (§6 T1) |
| **Persistent passives** | enchant/disenchant payloads: "(rest of combat) whenever/while X: rider" |

All conditions are deterministic and evaluable inside `projectCardPlay` —
preview==applied survives everything here.

## 4. The rank ladder + power budget

- **`tier` (1/2/3) stays** — the mechanical resist field (Tier 1
  auto-applies, Tier 2 resisted, Tier 3 nat-20-only). Load-bearing;
  untouched.
- **`rank` (new, 1–6)** — the quality axis; drives drop weighting /
  reward rolls (`combat.rewards.ts` gold-weighting generalizes to
  per-rank weights).

| rank | name | band (pts) | character |
|---|---|---|---|
| 1 | **Doxa** | 2 – 4 | common opinion; starters, filler; one verb + one small rider max |
| 2 | **Lemma** | 4.5 – 6 | stepping-stones; the two-verb free/paid mixing zone |
| 3 | **Thesis** | 6.5 – 9 | a position worth defending; theme chassis |
| 4 | **Theorem** | 9.5 – 12 | proven force; theme payoffs, big conditionals, most enchant/disenchants |
| 5 | **Axiom** | 12.5 – 16 | unarguable; the namesake rank — capstones, floating-die forges |
| 6 | **Aporia** | rule-rewriting only | the impasse — persistent engine text that changes the fight's rules, NOT bigger integers |

Aporia follows the corpus's sharpest finding: Dawncaster's top rarity is
distinguished by *kind* (persistent Unique engine text; 2.55 mean rules
segments vs ~2.25 below), not magnitude. Enchant/disenchant cards are the
natural residents of Theorem+; Aporia enchantments are the biggest
rule-rewriters.

**Power-budget point table** (anchor: **1 pt ≈ 3 HP of expected
neutral-read swing**; calibrates starter slippery-slope — poison i1 d4
ramp, 10 lifetime HP — to ~3.3 pts):

| verb | pts |
|---|---|
| DoT apply / extend | printed lifetime HP ÷ 3 (ramps use the honest printed curve) |
| +1 intensity rider on landed status | ~1.5 |
| +1 duration rider | ~1 for canonical DoTs |
| stagger (phase deny) | 4 |
| fear / confusion d2 | 2.5 · doubt / overextended / sensory-null 2 · slow / mark d2 1.5 · vulnerable d2 2 · silence d3 3 · charm 3.5 · root d2 2 |
| draw 1 | 2 |
| +1 Conviction | 1 |
| Guard | HP ÷ 4 · Barrier HP ÷ 3 · Heal HP ÷ 3 · cleanse 1.5 |
| reveal next stance 1.5 · reveal 2 phases 2.5 · lock stance 2.5 |
| pip grant (Reserve +1) 1.5 · create_temporary_die 2.5 · refresh_die 3 · bank_spent_die 2 · reroll_spent 2 · convert-to-wild 1.5 |
| **forge_floating_die** | **5**, +1 per preloaded pip — the most expensive verb per unit, by design |
| execute 5 · rupture 4 · react 3.5 · amplify-40% 3 · compound 3 · siphon-50% 2 · tickAllDots 2 |
| enchant/disenchant persistent text | rider pts × expected triggers (sim-measured), min 4 |
| **conditional discounts** | threshold ×0.5 · dieBonus ×0.6 (named/off ×0.5) · fate ×0.7 · theme-state (Premises / Fallen) ×0.5 |
| **self-cost credits** | −0.75 × mirrored-effect pts (never full refund) |

Card score = Σ(unconditional) + Σ(discounted conditionals) − Σ(credits).
Coefficients live in one table module; every card ships its arithmetic in
a comment; **a lint test asserts the sum lands in the printed rank's
band**. "Secretly great" = low-rank cards whose conditional discounts
undervalue them inside a dedicated theme — never high-rank cards that
compute low. `/deck-tuning` remains the empirical court.

## 5. Floating dice — the live-tray model (owner-ratified)

*You start battle with your 2 rolled dice. A card grants an extra,
floating die — it joins the tray immediately. If you don't spend it, it
carries over between rounds (it does NOT reroll). If you never spend it
that combat, it carries over to the next combat. Once spent, it is gone
forever.*

- **Grant:** `forge_floating_die` (PAID-only verb) puts the die in the
  tray NOW — usable this very battle. Colors: the powering die's color,
  or wild on premium cards.
- **Persistence:** floating dice are exempt from the round reroll and are
  written to the character save at combat end. They arrive in the next
  battle's opening tray.
- **Spend:** powers a PAID action under the unchanged single-die law;
  feeds Resonance like any die (§9 A3). Consumed forever on use.
- **Cap: 3 floating dice** at once (owner-ratified). Forging at cap
  converts to +1 Conviction, printed on the card face — no silent loss.
- **Intent (owner-ratified): bigger turns**, not insurance — 2 rolled +
  3 floating = up to a 4-play turn if you drafted well. This is pure
  player-side power; enemy strengthening (owner's separate lever) and
  the top-of-table price (5 pts) are the counterweights. NOTE:
  Dawncaster deliberately refuses cross-combat persistence for
  manufactured resources (kb:dawncaster/keywords/conjure, /removed;
  Souls is threshold-gated) — we are knowingly inverting that rule;
  floating-die injection is included in the queued combat-tuning pass.

## 6. The four themes (owner-ratified)

Fewer keywords, more cards per keyword — every theme has cards at EVERY
rank, including ≥1 enchantment and ≥1 disenchant. Cassandra, Syllogism,
and Dialectic are cut as named packages; reveal/lock verbs and the odd
sequence-flavored rider survive as unnamed staple texture.

**T1 — DoT** (bleed + poison merged as a theme; each keeps its own
keyword identity, and the theme's glue is CROSS-KEYWORD cards: extend
both, boost both, convert one into the other). Provenance: Dawncaster's
Affliction support web (kb:dawncaster/keywords/affliction, /bleeding,
/poison). Burn/hemorrhage/septic/unraveling/despair remain spice on
staples, not theme pillars.

**T2 — PERORATION** (the cumulative case; Perform/Performance —
kb:dawncaster/keywords/perform, /performance; cards/0002, /0364, /1393,
/1233). Chassis cards add **Premises** (package tally beside Resonance);
a **Peroration** card (one in play at a time, like Dawncaster's one-song
rule) declares a conclusion that fires FREE at N Premises. Heart-leaning.

**T3 — FORGE** (Ex Nihilo + the pip/Reserve game; Conjure/Charges +
Momentum — kb:dawncaster/keywords/conjure, /charges, /momentum;
cards/0368, /1580, /0520). Temporary dice, pips, banking, conjured
one-use **Thoughtforms**, and the floating-die forge itself. The effect
funds its own cause. Mind/Body.

**T4 — AKRASIA** (Darkness/Blood/Corruption —
kb:dawncaster/keywords/darkness, /blood, /corruption; cards/0482, /0156).
Acting against your own better judgment: pay in `recoilHp` and REAL
self-statuses (credits per §4); the **Fallen** state (you carry ≥2
self-debuffs) turns the debt into a strategy — Fallen-gated riders go
live. Akrasia is where forging floating dice is cheapest in points but
paid in HP.

## 7. The card catalogue (v2 — 75 cards)

Format: **card (stance, tier, type)** · FREE | PAID | ⬡ condition ·
pts→rank. Types: S=spell, E=enchantment, D=disenchant. Enchant/disenchant
have no FREE line (PAID-only). "tick" = 1 immediate tick of one enemy
DoT. Arithmetic comments ship in the TS; pts here are audited sums.

### T1 — DoT (14)

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| slippery-slope (B2, S) | Doxa | tick | poison i1 d4 (prints "2,2,3,3 = 10") | — | 3.9 (starter) |
| straw-mans-jab (B1, S) | Doxa | tick | bleed i1 d2 + mark d2 | dieBonus off-color: +1 int | 3.7 |
| hasty-generalization (B2, S) | Lemma | tick | bleed i2 d3 | threshold Body 2: +1 int | 5.0 |
| festering-argument (M2, S) | Lemma | tick | +1 duration to ALL your bleeds AND poisons | — | 5.2 (cross-keyword glue) |
| appeal-to-pitys-despair (H2, S) | Lemma | heal 2 | despair i2 d4 (anti-heal −50%) | — | 5.4 |
| currys-conversion (M2, S) | Thesis | draw 1 | convert all enemy bleed → poison at equal intensity, +1 int | — | 7.0 (the wound becomes the argument) |
| poisoned-well (B2, S) | Thesis | tick | septic i2 d3 (−10% outgoing/stack) | — | 7.0 |
| resonance-bleed (H2, S) | Thesis | tick | bleed i1 d2 | synergy: already bleeding → i2, +1 dur | 6.6 |
| venom-and-vein (B2, E) | Theorem | — | *(rest of combat)* your bleed AND poison applications land +1 intensity | — | ~10 |
| suppurating-curse (M2, D) | Theorem | — | *(rest of combat)* enemy takes +1 HP per DoT tick | — | ~10 |
| the-final-word (M3, S) | Axiom | draw 1 | poison i3 d5 (honest lifetime curve printed) | powering die is your LAST available: +2 int | 13.4 |
| hemophilia-hex (B3, D) | Axiom | — | *(rest of combat)* enemy bleed no longer decays when it triggers | — | ~13 |
| resonance-detonation (H3, S) | Axiom | tick | RUPTURE (consume all DoTs; burn fuel ×1.5; cap kept) | — | 13.0 |
| sorites-plague (M3, E) | Aporia | — | *(rest of combat)* whenever you apply bleed or poison, it ticks once immediately | — | engine text |

### T2 — Peroration (12)

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| exordium (H1, S) | Doxa | +1 Premise | draw 1 + 1 Premise | — | 3.6 |
| opening-statement (H1, S) | Doxa | +1 Premise | mark d2 + 2 Premises | — | 3.8 |
| rhetorical-flourish (H2, S) | Lemma | draw 1 | fear i1 d2 + 2 Premises | — | 5.5 |
| mounting-case (M2, S) | Lemma | +1 Premise | unraveling i1 d5 + 1 Premise | threshold Heart 2: +1 Premise | 5.8 |
| the-gallery-nods (H2, S) | Thesis | +1 Conviction | despair i1 d4 + 2 Premises + draw 1 | dieBonus heart: +1 Premise | 8.7 |
| filibuster (M2, S) | Thesis | +1 Premise | silence d3 + 1 Premise | — | 7.0 |
| captive-audience (H2, D) | Theorem | — | *(rest of combat)* while you hold 4+ Premises, enemy is vulnerable i1 | — | ~10 |
| practiced-cadence (H2, E) | Theorem | — | *(rest of combat)* your first card each turn grants +1 Premise | — | ~10 |
| peroratio-interrupta (M2, S) | Theorem | draw 1 | spend ALL Premises: +1 int to one enemy status per 2 spent + draw 1 per 3 spent | — | ~10 (cash out early — tempo vs the big conclusion) |
| the-closing-word (H3, S) | Axiom | +1 Premise | **Peroration** (one in play): at 6 Premises — all enemy DoTs +1 int, draw 2, +2 Conviction | — | ~13 |
| standing-ovation (H3, E) | Axiom | — | *(rest of combat)* whenever a Peroration fires, gain +2 Conviction and refresh your drafted die | — | ~13 |
| reductio-ad-absurdum (M3, S) | Aporia | +1 Premise | **Peroration**: at 8 Premises — stagger 1 + RUPTURE | — | engine text |

### T3 — Forge (13)

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| sketch-of-a-thought (M1, S) | Doxa | +1 Conviction | create_temporary_die (mind) | — | 3.5 |
| half-step (B1, S) | Doxa | +1 Conviction | Guard 4 + bank_spent_die | — | 3.9 |
| suspend-judgment (M2, S) | Lemma | Guard 2 | Guard 6 + bank_spent_die | — | 4.5 (epoché: withhold, and it ripens) |
| bootstrap-loop (M2, S) | Lemma | +1 Conviction | create_temporary_die (wild) | threshold Mind 2: it arrives with 1 pip | 4.9 |
| patient-tortoise (B2, S) | Lemma | Guard 2 | Guard 6 + grant_pip | — | 4.9 |
| stoic-reserve (H2, S) | Thesis | Guard 2 | Guard 6 + grant_pip ×2 | — | 6.5 |
| thoughtform-legion (H2, S) | Thesis | tick | create_temporary_die (heart) + conjure_card (Bat-Swarm Thoughtform, one-use: fear i1 d2) | — | 7.9 |
| anvil-of-form (M2, E) | Theorem | — | *(rest of combat)* your temporary AND floating dice arrive with +1 pip | — | ~10 |
| entropy-tax (M2, D) | Theorem | — | *(rest of combat)* whenever you spend a temporary or floating die, enemy gains vulnerable i1 d1 | — | ~10 |
| ex-nihilo (M2, S) | Theorem | draw 1 | **forge_floating_die** (color of the powering die) | threshold Mind 4: it lands with 1 pip | 9.8 |
| the-overtake (B2, S) | Axiom | tick | **spendAllPips**: +1 int to one enemy DoT per pip + Guard 2 per pip | — | ~13 (sudden and total) |
| unmoved-mover (H3, S) | Axiom | Guard 3 | stagger 1 + Guard 8; all Reserve dice +1 pip | — | ~15 (what waits, ripens) |
| prime-mover (H3, E) | Aporia | — | *(rest of combat)* whenever you play a temporary or floating die: +1 Conviction and tick | — | engine text (dice from nothing, and the nothing pays) |

### T4 — Akrasia (11)

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| against-my-judgment (H1, S) | Doxa | +1 Conviction | draw 2 − self doubt (credit) | — | 3.5 |
| willing-wound (B1, S) | Doxa | +1 Conviction | Guard 6 − recoil 2 (credit) | — | 3.4 |
| sweet-poison (B2, S) | Lemma | tick | poison i2 d4 − self vulnerable d2 (credit) | — | 5.3 |
| borrowed-resolve (M2, S) | Lemma | +1 Conviction | draw 3 − self overextended (credit) | — | 5.4 |
| the-weak-will (H2, S) | Thesis | heal 2 | despair i2 d4 + hemorrhage i1 d3 − self overextended (credit) | — | 7.6 |
| self-flagellant (B2, S) | Thesis | tick | recoil 4 → +1 intensity to ALL enemy DoTs (credit) | — | 7.2 |
| fallen-grace (H2, S) | Theorem | draw 1 | hemorrhage i2 d3 | **Fallen**: instead RUPTURE + siphon 50% (×0.5) | 10.4 |
| crown-of-thorns (H2, E) | Theorem | — | *(rest of combat)* while Fallen, your status applications land +1 intensity | — | ~11 |
| mirror-of-guilt (M2, D) | Theorem | — | *(rest of combat)* whenever you gain a self-debuff, enemy gains 1 stack of it too | — | ~11 |
| pact-of-akrasia (B3, S) | Axiom | Guard 2 | **forge_floating_die (wild)** − recoil 6 − self vulnerable d2 (credits) | — | 12.6 (cheapest forge in points, paid in blood) |
| sophists-wager (H3, E) | Aporia | — | *(rest of combat)* while Fallen, your self-debuffs count as enemy debuffs for COMPOUND / REACT / EXECUTE gates | — | engine text (the debt argues for you) |

### Neutral staples (25) — defense, control, utility, payoffs, mercy

| card | rank | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|---|
| brace-for-impact (B1, S) | Doxa | Guard 2 | Guard 8 | +2 Guard per pip on spent die | 3.6 (starter) |
| glimpse (M1, S) | Doxa | reveal next stance | mark d2 + reveal next stance | — | 3.8 |
| wishful-thinking (H1, S) | Doxa | heal 2 | heal 6 | threshold Heart 3: heal 12 instead | 3.6 |
| liars-echo (M1, S) | Doxa | mark d2 | mark d2 + doubt | — | 3.9 |
| soothing-words (H1, S) | Doxa | heal 2 | heal 3 + cleanse 1 | dieBonus heart: cleanse 2 | 3.9 |
| peaceful-gesture (B1, S) | Doxa | +1 Conviction | +2 heart tokens (mercy economy unchanged) | dieBonus heart: +1 more | ~3 |
| befriend (H1, S) | Doxa | heal 1 | Befriend attempt (ADR-0007 intact) | — | ~3 |
| false-dilemma (M2, S) | Lemma | draw 1 | confusion i1 d2 (blocked stance = spent die's color) | dieBonus off: +1 dur | 5.6 |
| zenos-half-step (B2, S) | Lemma | Guard 2 | slow d2 + telegraph-downgrade 1 rung | — | 5.0 |
| red-herring (M2, S) | Lemma | draw 1, discard 1 | confusion i1 d2 | dieBonus mind: draw 1 | 5.3 |
| appeal-to-pity (H2, S) | Lemma | heal 2 | heal heart×2 + resolute i1 d2 | dieBonus heart: cleanse 1 | 5.0 |
| tu-quoque (H2, S) | Lemma | Guard 2 | thorns i2 d2 | dieBonus match: +1 dur | 4.8 |
| heap-of-doubt (M2, S) | Lemma | +1 Conviction | doubt + overextended | threshold Mind 4: also stagger 1 | 5.6 |
| sorites-whisper (M2, S) | Lemma | tick unraveling | unraveling i1 d5 | — | 4.6 |
| undistributed-middle (M2, S) | Thesis | confusion i1 d1 | confusion i2 d2 | threshold Mind 3: also doubt | 7.8 |
| breach (M2, S) | Thesis | draw 1 | vulnerable i1 d2 | threshold Mind 3: i2 | 6.6 |
| eternal-regress (M2, S) | Thesis | tick unraveling | unraveling i2 d5 | dieBonus mind: +1 int | 7.4 |
| gabriels-bulwark (H2, S) | Thesis | Guard 2 | Barrier 9 | — | 6.5 |
| leeching-syllogism (H2, S) | Thesis | heal 2 | hemorrhage i2 d3 + siphon 50% | — | 7.4 |
| empathetic-understanding (M2, S) | Theorem | draw 1 | reveal next 2 phases + mark d2 | dieBonus heart: reveal ALL | 9.6 |
| arrow-paradox (B2, S) | Theorem | Guard 2 | lock enemy stance + slow d2 | — | 9.8 (motion frozen mid-flight) |
| grandfather-paradox (B2, S) | Theorem | Guard 2 | cleanse ALL self-debuffs + resolute i2 d2 | threshold Body 4: also refresh_die | 10.2 |
| mounting-contradictions (M2, S) | Theorem | draw 1 | COMPOUND (3/distinct debuff, cap kept) | — | 9.5 |
| the-inevitable (M2, S) | Theorem | +1 Conviction | AMPLIFY 50% | threshold Mind 5: 75% | 9.9 |
| achilles-overtake (B3, S) | Axiom | tick | EXECUTE (≤25% HP or ≥2 DoTs → 25% max-HP burst) | threshold Body 5: threshold 35% | 13.5 |
| existential-collapse (B3, S) | Axiom | tick | REACT fear+confusion → consume both: stagger + burst 8; else bleed i2 d2 | — | 12.8 |
| pyrrhic-victory (B3, S) | Aporia | tick ×2 | EXECUTE + 10% max-HP self-recoil (the library's best identity, kept) | — | execute − credit |

Counts: 14 + 12 + 13 + 11 + 25 = **75**. Rank spread: Doxa 13 · Lemma 17
· Thesis 15 · Theorem 17 · Axiom 9 · Aporia 4. Each theme covers all six
ranks with ≥1 enchantment and ≥1 disenchant.

**Retired outright** (identity can't survive no-strike; owner: no
rescues): mob-appeal, straw-giant, metaphysical-drain,
sunk-cost-momentum, gamblers-ruin, briar-riposte, omnipotence-paradox,
ship-of-theseus, achilles-gambit, bat-swarm-thoughtform (name survives as
the Thoughtform conjure), appeal-to-authority, raven-paradox,
liars-paradox, stoic-bulwark, eternal-recurrence, apophatic-aegis,
regress-ad-infinitum, transcendent-synthesis, gamblers-folly,
existential-debt, buridans-wager, buridans-impasse, gamblers-fallacy,
logical-recursion, nirvana-fallacy, moving-the-goalposts,
appeal-to-consequences, equivocation-cascade, crescendo-of-suffering,
composition-fallacy — retire to git history; several are natural theme
members later via `/deck-tuning` promotion.

**Starting deck:** slippery-slope + brace-for-impact + Retreat (both
starters teach a dice mechanic in fight one; unchanged).

**Presets re-cut (4 themes + 1):** *Erosion* (T1), *Oratory* (T2),
*Foundry* (T3), *Penitent* (T4), *Bulwark* (staple defense/control mix —
the control-and-guard deck for players who want tempo without a theme).
Every themed preset carries its theme's enchantment by Theorem depth.

## 8. Engine-change ledger (sized S/M/L)

| # | change | files | cost |
|---|---|---|---|
| 1 | `rank: 1..6` + `cardType` fields + budget-lint test (pricing table module + per-card arithmetic comments) | Cards/types.ts, new cards.pricing.ts, e2e lint | **M** |
| 2 | Strike purge: basePower/chipHp/riposte.damage/DIRECT_DAMAGE_WEIGHT removal + test re-pins | combat.engine.ts, skill.engine.ts, tests | **M** |
| 3 | Floating dice: character-save pool, tray injection at combat start, reroll exemption, cap-3 valve, forge verb | encounter.types, character state, dice roll path, reducer | **M** |
| 4 | Persistent zone wiring: enchant (player-side) + disenchant (enemy-side) lists, play path (persistent zone instead of discard), trigger evaluation between phases + on-apply hooks | engine, types, presenter | **M/L** |
| 5 | Premises tally + Peroration slot (one-in-play, fire-at-N) + spend-Premises verb | engine, types, presenter | **M** |
| 6 | `spendAllPips` payoff rider | engine (R2 path) | **S** |
| 7 | Fallen state (≥2 self-debuffs) + whileFallen gates | engine condition eval | **S** |
| 8 | DoT cross-keyword verbs: extend-both, boost-both, convert bleed↔poison | engine status ops | **S/M** |
| 9 | conjure_card (one-use Thoughtforms) | deck/hand path | **S/M** |
| 10 | rewards: per-rank drop weights (generalize gold-weighting) | combat.rewards.ts | **S** |
| 11 | R7 amendment (+2 Guard on defend replaces +3 flat) | engine | **S** |

CUT from v1 ledger (keywords lessened, per owner): sequence condition
class, dialectic condition, revealedPhases tally + stay-revealed
machinery. Reveal/lock stay as plain riders (already engine-real).
Reshuffle law: no change needed (`combat.deck.ts:92-98` already does it);
add a pinning test that no fatigue penalty exists.

Implementation order: 1–2 (ladder + purge, pure wins) → 3 (floating
dice) → 4 (persistent zone — the biggest single lift) → 5/7/8 (theme
mechanics) → 6/9 → 10–11. Every step re-verifies
`npm run verify -w axiomancer-mobile` (barrel contract).

## 9. Owner decisions — ratified + remaining assumption-confirms

**Ratified 2026-07-06:** chip removal (yes) · floating dice live-tray
model, cap 3, bigger-turns intent (yes) · ladder names (yes) ·
status-payoffs-only HP line (yes) · 75 cards, 4 themes × all ranks,
fewer keywords (yes) · no retired-card rescues (yes) · card types:
enchantment / disenchant / spell, more to come (yes) · reshuffle law
(yes).

**Assumption-confirms (non-blocking; flag if wrong):**

- **A1 — disenchant scope.** Interpreted as *persistent effect attached
  to the ENEMY* (a standing curse: suppurating-curse, entropy-tax,
  mirror-of-guilt, captive-audience) vs enchant = persistent benefit on
  YOU. If disenchant instead means e.g. "removes enchantments" or
  self-side negative passives, §7's D-cards re-home easily.
- **A2 — enchant/disenchant cost.** PAID-only (a die is the commitment;
  no FREE line). They leave the deck cycle once played (not reshuffled).
- **A3 — floating dice feed Resonance** when spent, like any die, and
  may NOT be banked to Reserve (no pip-laundering; Reserve keeps its own
  ripening game).
