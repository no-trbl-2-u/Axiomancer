# Spec 32 — The No-Strike Library: utility/status card revamp + rank ladder

> **Status:** DESIGN DRAFT — awaiting owner answers to §9 before engine work.
> Authored 2026-07-06 from the owner's directive (Dawncaster card revamp
> session) + a mechanics-expert deep-mine of the Dawncaster KB
> (kb:dawncaster — 1,692 cards / 141 keywords,
> github.com/no-trbl-2-u/game-knowledge-base,
> `KnowledgeBase/DigitalCardGames/dawncaster/`).
>
> **Owner directives (verbatim intent, 2026-07-06):**
> 1. *"No longer will the player be able to 'strike'. No more raw hp dmg
>    cards, that's boring."* Cards draw, forge floating dice (consumed on
>    use, carry over between battles), provide utility, or cause status
>    effects.
> 2. *"Mix and match cards based on 'free' vs 'paid' (ie. draw 1 / poison 5
>    orrrr poison 2 / draw 3)."*
> 3. *"We need a way to organize/rank cards because some will just be flat
>    out better than others. 3 tiers is just not enough."*
> 4. *"Take a look at the Dawncaster card library for ideas. Perform …
>    creates a whole new set of mechanics if you build your deck around it.
>    Same with adapt, darkness, etc."*
> 5. Win ratio is explicitly NOT a constraint right now — enemies will be
>    strengthened separately. Rank honesty IS a constraint.
>
> Builds directly on Spec 31 (Fate Engine): Resonance thresholds, Reserve
> ripening, Omen, fate/X dice, riders, projection-truth law all stay. This
> spec replaces the card LIBRARY, adds the rank ladder + the persistent
> floating-die economy, and AMENDS two Spec 31 items (§1.1). It does not
> otherwise reopen Spec 31's dice rules.

---

## 1. Doctrine change — the strike dies

**Removed from the player's vocabulary entirely:**

- `basePower` flat damage on any card (mob-appeal, straw-giant,
  metaphysical-drain, achilles-gambit's strike halves — all re-cut in §7).
- `chipHp` riders AND "chip 2" FREE lines (owner call pending §9 Q1;
  working assumption: chips die too — they are the *most* boring raw HP).
- `riposte.damage` (the counter-damage half); riposte survives as pure
  parry (`reduce` only).
- Conviction/token-fueled raw bursts (gamblers-ruin, sunk-cost-momentum
  re-cut to intensity-fueling in §7).

**Enemy HP remains the sole win condition** (`isDefeated(enemy)`). Every
point of enemy HP now falls to exactly three sources:

1. **DoT ticks** — poison / bleed / burn / hemorrhage / septic /
   unraveling / despair, plus `tickAllDots` riders.
2. **Status-payoff verbs** — RUPTURE / COMPOUND / AMPLIFY / EXECUTE /
   REACT: HP bursts that exist *only because statuses were built first*.
   Architecturally these already live on the separate `mechanicDamage`
   path, so they survive the purge cleanly.
3. **Reflect/thorns-class effects** — the enemy hurting itself on your
   statuses.

This completes the 2026-06 load-bearing doctrine ("status effects are the
MAIN fun"): status play stops being the *efficient* path and becomes the
*only* path.

### 1.1 Spec 31 amendments

- **§4.2 / R7:** surviving strike cards are re-cut (§7); R7's "+3 flat on
  strike/defend" becomes "+2 Guard on defend cards" (status cards keep
  +1 duration). `DIRECT_DAMAGE_WEIGHT` goes dead and is purged.
- **§6 invariants:** "single-die law" and the 2-dice/6-card turn shape are
  PRESERVED — floating dice enter through the Reserve (§5), never as extra
  roll dice. The invariant list gains: "a priori dice respect the Reserve
  cap and the single-die law."

### 1.2 No-floor mitigations (mechanics-expert D1/D2)

Deleting the damage floor is safe only with these design laws:

- **Turn-2 erosion gate (sim/CI):** every legal starting hand of every
  preset must be able to begin eroding enemy HP by turn 2.
- **Anti-heal reachability:** despair (healing −50%) must always be
  reachable from starter-adjacent ranks (it is: §7, Lemma).
- **Enemy design law:** enemy cleanse/heal per phase < the cheapest Doxa
  DoT's per-turn output (enforced when enemies are strengthened).
- **No-zero-capacity gate (sim/CI):** no seeded fight may reach a state
  where the player's pending damage capacity is 0 with no card that can
  change it.

## 2. Card anatomy — FREE / PAID is the card

Spec 31 already gave every card two lives: a TOP action (playable without
a die) and a BOTTOM action (powered by exactly one die). This spec promotes
that split into the design grammar the owner described:

```
┌─────────────────────────────┐
│  CARD NAME          [rank]  │
│  FREE  draw 1               │   ← dieless, small, always available
│  PAID  poison i2 d4         │   ← one die, the real payload
│  ⬡ condition line           │   ← threshold / dieBonus / fate /
│                             │     sequence / package-state
└─────────────────────────────┘
```

- **FREE and PAID draw from the SAME verb menu (§3).** "draw 1 / poison 5"
  and "poison 2 / draw 3" are both legal — same total budget, opposite
  shapes. Which half a verb sits in is an identity choice, not a power
  choice. (Dawncaster runs this exact trade at Common: Toxicity =
  status-big/engine-small vs Abracardabra = engine-big/status-zero —
  kb:dawncaster/cards/1565, /cards/0002.)
- Budget law: **FREE ≈ 25–35% of the card's total points** (§4).
- **Conditionality is the third pricing lever** (Dawncaster's Chorus:
  the big half sits behind a condition — kb:dawncaster/cards/0364).
  Conditional riders are discounted, never free.
- Every Tier-2+ card carries exactly ONE condition line; Tier-1 at most
  one (Spec 31 P1 law, unchanged).

## 3. The verb menu (post-strike vocabulary)

**B** = suits PAID magnitudes, **T** = suits FREE magnitudes, **BT** = both.

| family | verbs |
|---|---|
| **Status — DoT** (BT) | poison, bleed, burn, hemorrhage, septic, unraveling, despair; "1 tick" (single immediate tick of one enemy DoT) is the canonical small FREE line |
| **Status — control** (B) | confusion, fear, slow, root, silence, charm, stagger, sensory-null |
| **Status — exposure** (BT) | vulnerable, vulnerability(stance), mark, doubt, overextended, novikov (next-DoT-upgrade) |
| **Status — self-buff** (BT) | resolute, regeneration, life-steal, thorns, brazen-thorns, phoenix-vigor, promethean-ember, clarity, negation |
| **Draw / hand** (BT) | draw N; conjure_card (one-use Thoughtform into hand) |
| **Foresight** (BT) | revealStance (1 / 2 / all phases), lock enemy stance, telegraph-downgrade |
| **Dice — in-combat** (B) | create_temporary_die, grant_pip, bank_spent_die, refresh_die, convert_die_color, reroll_spent, spendAllPips (NEW: cash total Reserve pips into a rider) |
| **Dice — persistent** (B) | **forge_floating_die** (§5, NEW): a die that outlives this battle, consumed on use |
| **Defense** (BT) | guard, barrier, riposte (pure parry), cleanse, heal, conviction |
| **Status payoffs** (B) | rupture, compound, amplify, execute, react, tickAllDots, siphon |
| **Package currencies** (BT) | premise +N (A1); Fallen state (A4); dialectic trigger (A6); revealedPhases tally (A7); sequence triggers (A3) |

All conditions are deterministic and evaluable inside `projectCardPlay` —
preview==applied survives every package.

## 4. The rank ladder + power budget

Two axes, cleanly separated:

- **`tier` (1/2/3) stays** — the *mechanical resist field* (Tier 1
  auto-applies, Tier 2 resisted, Tier 3 nat-20-only repel). It is
  load-bearing in the resist path and the barrel contract; do not overload.
- **`rank` (new, 1–6)** — the quality axis. Higher-rank cards ARE flat-out
  better; the ladder makes that honest instead of accidental. Rank drives
  drop weighting / reward rolls (the binary gold-weighting in
  `combat.rewards.ts` generalizes to per-rank weights).

| rank | name | band (pts) | character |
|---|---|---|---|
| 1 | **Doxa** | 2 – 4 | common opinion; starters and filler; one verb + at most one small rider |
| 2 | **Lemma** | 4.5 – 6 | a stepping-stone; the two-verb bundles where free-vs-paid mixing lives |
| 3 | **Thesis** | 6.5 – 9 | a position worth defending; package chassis |
| 4 | **Theorem** | 9.5 – 12 | proven force; package payoffs, big conditionals |
| 5 | **Axiom** | 12.5 – 16 | unarguable; the game's namesake rank — capstones, floating-die forges |
| 6 | **Aporia** | rule-rewriting only | the impasse — persistent engine text that changes the fight's rules ("this combat, whenever…"), NOT bigger integers |

Aporia follows the corpus's sharpest finding: Dawncaster's top rarity is
distinguished by *kind* (persistent Unique engine text; mean rules-segments
2.55 vs ~2.25 elsewhere), not magnitude (Common Lacerate inflicts Bleeding
4 while Rares inflict 2–3). Six *numeric* bands would have weaker prior
art than five-plus-a-kind.

**Power-budget point table** (anchor: **1 pt ≈ 3 HP of expected
neutral-read swing**; calibrates starter slippery-slope — poison i1 d4
ramp, 10 lifetime HP — to ~3.3 pts):

| verb | pts |
|---|---|
| DoT apply / extend | printed lifetime HP ÷ 3 (ramps use the honest printed curve) |
| +1 intensity rider on landed status | ~1.5 (dpr ÷ 3 per remaining turn) |
| +1 duration rider | ~1 for canonical DoTs |
| stagger (phase deny) | 4 |
| fear / confusion / false-dilemma d2 | 2.5 |
| doubt / overextended / sensory-null | 2 |
| slow d2 / mark d2 | 1.5 |
| vulnerable d2 (incl. stance-keyed) | 2 |
| silence d3 | 3 · charm 3.5 · root d2 2 |
| draw 1 | 2 |
| +1 Conviction | 1 |
| Guard | HP ÷ 4 (one-shot, overflow-wasted) |
| Barrier | HP ÷ 3 (persists) |
| Heal | HP ÷ 3 |
| cleanse 1 | 1.5 |
| reveal next stance 1.5 · reveal 2 phases 2.5 · lock stance 2.5 |
| pip grant (all Reserve +1) | 1.5 |
| create_temporary_die | 2.5 |
| **forge_floating_die (persistent)** | **5**, +1 per preloaded pip — deliberately the most expensive verb per unit |
| refresh_die 3 · bank_spent_die 2 · reroll_spent 2 · convert-to-wild 1.5 |
| execute 5 · rupture 4 · react 3.5 · amplify-40% 3 · compound 3 · siphon-50% 2 · tickAllDots 2 |
| persistent "this combat, whenever X: rider" | rider pts × expected triggers (sim-measured), min 4 → Aporia |
| **conditional discounts** | threshold ×0.5 · dieBonus ×0.6 (named-color/off ×0.5) · fate ×0.7 · sequence ×0.6 · package-state (Fallen / Premises / dialectic / revealedPhases) ×0.5 |
| **self-cost credits** | −0.75 × mirrored-effect pts (never full refund — deck construction can dodge the cost; Dawncaster's Blood decks demonstrate the laundering) |

Card score = Σ(unconditional) + Σ(discounted conditionals) − Σ(credits).
Every coefficient lives in one table module; every authored card ships
with its arithmetic in a comment; **a lint test asserts the sum lands in
the printed rank's band** — a card outside its band is a CI failure.
"Secretly great" cards are implemented as low-rank cards whose conditional
discounts undervalue them in a dedicated package — never as high-rank
cards that compute low. The table is a *pricing prior*, not a simulator:
`/deck-tuning` remains the empirical court and recalibrates the ÷3 anchor
when fight length retunes.

## 5. A PRIORI dice — the floating, persistent pouch

The owner's "floating dice": *forged in one battle, spendable in a later
one, gone once used.*

- New character-level pool: `aprioriDice` — **the Priors** (color, pips
  0–2 if forged preloaded). Persisted on the save alongside deck/HP;
  distinct from the per-encounter Reserve and from `permanentWildDice`
  (which stays encounter-scoped).
- **Forging** (PAID-only verb): "commit this die to your Priors" — the
  forged die appears in the pouch AFTER combat ends (*a priori*: known
  before the experience that uses it). Forge rate: max 1 per battle.
- **Spending:** at TURN start you may move AT MOST ONE Prior into an empty
  **Reserve slot** (Reserve cap 2 and the single-die law both bind — the
  Prior then powers a PAID action like any Reserve die). Spending consumes
  it forever. It feeds Resonance; it may ripen further like any Reserve die.
- **Cap:** the pouch holds **3**. Forging while full converts to +1
  Conviction, printed on the card face — no silent loss.
- Anti-hoard/anti-snowball (expert D3/D4): pouch cap 3 + 1-forge/battle +
  1-injection/turn + Reserve-entry (no extra tray dice) + top-of-table
  price (5 pts). NOTE: Dawncaster deliberately REFUSES cross-combat
  persistence for manufactured resources (Conjured/One Use always removed
  — kb:dawncaster/keywords/conjure, /removed; its one persistent pool,
  Souls, is threshold-gated). We are inverting a rule it holds on purpose
  — hence every valve above, and floating-die injection is included in
  the queued combat-tuning pass, not bolted on after. Optional extra valve
  if playtests show hoarding paralysis: a carried Prior dulls 1 pip per
  battle (hoarding decays; spending is live).

## 6. Build-around packages (the Dawncaster goldmine, translated)

Seven packages. Each lists Dawncaster provenance → Axiomancer translation.
All condition logic is deterministic and previewable.

**P1 — PERORATION** (the cumulative case; Perform/Performance/Song —
kb:dawncaster/keywords/perform, /performance; cards/0002, /0364, /1393,
/1233). Cheap chassis cards add **Premises** (a package-scoped tally
beside Resonance); a **Peroration** card (one in play at a time, like
Dawncaster's one-song rule) declares a conclusion that fires FREE at N
Premises. The closing movement of a speech lands only if the premises were
laid. Heart-leaning, fallacy-flavored.

**P2 — ACHILLES' STRIDE** (Momentum — kb:dawncaster/keywords/momentum;
cards/0520, /0521, /0970). Axiomancer already owns the substrate: **pips +
Reserve ripening (R2)**. The package accelerates ripening (`grant_pip`,
`bank_spent_die`) and cashes it with **`spendAllPips`** payoffs (per-pip
intensity / Guard / ticks). Zeno inverted: each half-step accumulates
until the overtake is sudden and total. Body-leaning.

**P3 — SYLLOGISM** (Ambush/Cascade/Continuity/Finale —
kb:dawncaster/keywords/ambush, /cascade, /continuity, /finale; cards/1289).
Turn-sequence conditions, previewable at arm time: **Major Premise** (first
play of the turn), **Minor Premise** (played after a card of the same
stance), **Conclusion** (last card in hand / after the powered play).
A mis-ordered play isn't punished — the rider simply doesn't fire (*non
sequitur*). Third conditional class beside threshold/dieBonus. Mind-leaning.

**P4 — AKRASIA** (Darkness/Blood/Corruption —
kb:dawncaster/keywords/darkness, /blood, /corruption; cards/0482, /0156).
Acting against your own better judgment: pay in `recoilHp` and REAL
self-statuses (credits per §4); the deck-state condition **Fallen** (you
carry ≥2 self-debuffs) turns the debt into a strategy — Fallen-gated
riders go live. Existing proto-members: gamblers-folly, existential-debt,
pyrrhic-victory. Akrasia is where forging Priors is cheapest in points but
paid in HP.

**P5 — EX NIHILO** (Conjure/Charges — kb:dawncaster/keywords/conjure,
/charges; cards/0368, /1580). The manufactured-resources package: temporary
dice, conjured one-use **Thoughtform** cards, and the Priors forge itself.
Bootstrap-paradox naming is exact: the effect funds its own cause.

**P6 — DIALECTIC** (Attune rotation — kb:dawncaster/keywords/attune;
cards/0660, /0335, /0591). R7 color-match is static attunement; the
build-around rewards **rotation**: a Dialectic rider fires when this
play's powering die differs from the previous play's color along the
stance-beats cycle (Heart>Body>Mind>Heart, already in `resolveRead`).
Thesis → antithesis → synthesis. Makes tri-color decks a real archetype
against the mono-color pull of Resonance thresholds — the same healthy
tension Dawncaster runs between Attunement and mono-energy decks.

**P7 — CASSANDRA** (Foretell/Doom — kb:dawncaster/keywords/foretell,
/doom; cards/0321, /1138, /0119, /0885). Axiomancer's deck-to-scry is the
**threat sequence + the Omen (R5)**. Cassandra cards reveal future phase
stances and their payoffs scale off the **revealedPhases tally** — the
curse of true prophecy no one heeds. Adopts the library's loneliest
mechanics (empathetic-understanding, arrow-paradox, mark) into an
archetype that cares about the Omen every turn. Mind/Heart.

Passed over (with reasons): Sinister (subsumed by Peroration), Chain/Tides
(needs an opponent-side tug-of-war we lack), Balance/Chaos deck-parity
(only 2 player cards in the whole corpus — weak even at home), Adapt
(meta-progression card-crafting — better prior art for the rest-encounter
upgrade valve than for combat cards).

## 7. The card catalogue (v1 — 75 cards)

Format: **card (stance, tier)** · FREE | PAID | ⬡ condition · pts→rank.
Arithmetic comments ship in the TS; pts here are the audited sums.
Statuses print intensity/duration (i/d); "tick" = 1 immediate tick of one
enemy DoT. All existing card identities that survive are re-cut here;
everything else in the current library is retired to git history.

### Doxa (12) — 2–4 pts

| card | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|
| slippery-slope (B1) | tick | poison i1 d4 (prints "2,2,3,3 = 10") | — | 3.9 (starter) |
| brace-for-impact (B1) | Guard 2 | Guard 8 | +2 Guard per pip on spent die | 3.6 (starter) |
| straw-mans-jab (B1) | tick | bleed i1 d2 + mark d2 | dieBonus off-color: +1 int | 3.7 |
| opening-statement (H1, P1) | +1 Premise | mark d2 + 2 Premises | sequence first-play: +1 Premise | 3.8 |
| half-step (B1, P2) | +1 Conviction | Guard 4 + bank_spent_die | — | 3.9 |
| glimpse (M1, P7) | reveal next stance | mark d2 + reveal next stance | — | 3.8 |
| against-my-judgment (H1, P4) | +1 Conviction | draw 2 − self doubt (credit) | — | 3.5 |
| sketch-of-a-thought (M1, P5) | +1 Conviction | create_temporary_die (mind) | — | 3.5 |
| wishful-thinking (H1) | heal 2 | heal 6 | threshold Heart 3: heal 12 instead | 3.6 |
| liars-echo (M1) | mark d2 | mark d2 + doubt | — | 3.9 |
| soothing-words (H1) | heal 2 | heal 3 + cleanse 1 | dieBonus heart: cleanse 2 | 3.9 |
| peaceful-gesture (B1) | +1 Conviction | +2 heart tokens (mercy economy unchanged) | dieBonus heart: +1 more | ~3 |

### Lemma (18) — 4.5–6 pts

| card | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|
| hasty-generalization (B2) | tick | bleed i2 d3 | threshold Body 2: +1 int | 5.0 |
| sorites-whisper (M2) | tick unraveling | unraveling i1 d5 | — | 4.6 |
| false-dilemma (M2) | draw 1 | confusion i1 d2 (blocked stance = spent die's color) | dieBonus off: +1 dur | 5.6 |
| appeal-to-pitys-despair (H2) | heal 2 | despair i2 d4 (anti-heal −50%) | — | 5.4 |
| zenos-half-step (B2) | Guard 2 | slow d2 + telegraph-downgrade 1 rung | — | 5.0 |
| suspend-judgment (M2) | Guard 2 | Guard 6 + bank_spent_die | — | 4.5 (epoché: withhold, and it ripens) |
| red-herring (M2) | draw 1, discard 1 | confusion i1 d2 | dieBonus mind: draw 1 | 5.3 |
| rhetorical-flourish (H2, P1) | draw 1 | fear i1 d2 + 2 Premises | — | 5.5 |
| patient-tortoise (B2, P2) | Guard 2 | Guard 6 + grant_pip | — | 4.9 |
| minor-premise (M2, P3) | tick | burn i2 d3 | sequence after-same-stance: +1 int | 5.1 |
| sweet-poison (B2, P4) | tick | poison i2 d4 − self vulnerable d2 (credit) | — | 5.3 |
| bootstrap-loop (M2, P5) | +1 Conviction | create_temporary_die (wild) | sequence first-play: it arrives with 1 pip | 4.9 (the effect funds its own cause) |
| thesis-stroke (B2, P6) | mark d2 | bleed i2 d2 | dialectic: +1 int | 5.2 |
| unheeded-warning (H2, P7) | reveal next stance | fear i1 d2 | +1 dur per revealed phase (cap 2, ×0.5) | 5.4 |
| appeal-to-pity (H2) | heal 2 | heal heart×2 + resolute i1 d2 | dieBonus heart: cleanse 1 | 5.0 |
| tu-quoque (H2) | Guard 2 | thorns i2 d2 | dieBonus match: +1 dur | 4.8 |
| composition-fallacy (B2) | tick | create_temporary_die (wild) + bleed i1 d2 | — | 5.5 (the whole from its parts) |
| heap-of-doubt (M2) | +1 Conviction | doubt + overextended | threshold Mind 4: also stagger 1 | 5.6 |

### Thesis (16) — 6.5–9 pts

| card | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|
| eternal-regress (M2) | tick unraveling | unraveling i2 d5 | dieBonus mind: +1 int | 7.4 |
| poisoned-well (B2) | tick | septic i2 d3 (−10% outgoing/stack) | — | 7.0 (everything downstream is tainted) |
| resonance-bleed (H2) | tick | bleed i1 d2 | synergy: already bleeding → i2, +1 dur | 6.6 |
| undistributed-middle (M2) | confusion i1 d1 | confusion i2 d2 | threshold Mind 3: also doubt | 7.8 |
| breach (M2) | draw 1 | vulnerable i1 d2 | threshold Mind 3: i2 | 6.6 |
| stoic-reserve (H2, P2) | Guard 2 | Guard 6 + grant_pip ×2 | — | 6.5 |
| gathering-stride (B2, P2) | +1 Conviction | poison i1 d4 + grant_pip | threshold Body 3: +1 pip | 6.7 |
| mounting-case (M2, P1) | +1 Premise | unraveling i1 d5 + 2 Premises | threshold Heart 2: +1 Premise | 7.2 |
| therefore (M2, P3) | +1 Conviction | vulnerable i1 d2 + doubt | sequence last-play: also draw 2 | 7.3 |
| the-weak-will (H2, P4) | heal 2 | despair i2 d4 + hemorrhage i1 d3 − self overextended (credit) | — | 7.6 |
| thoughtform-legion (H2, P5) | tick | create_temporary_die (heart) + conjure_card (Bat-Swarm Thoughtform, one-use: fear i1 d2) | — | 7.9 |
| antithesis-turn (M2, P6) | Guard 2 | confusion i2 d2 | dialectic: +1 dur + draw 1 | 7.4 |
| prophecy-of-ruin (M2, P7) | tick unraveling | unraveling i1 d5, +1 int per revealed phase (cap +2, ×0.5) | — | 7.2 |
| equivocation-cascade (M2) | draw 1 | convert_die_color + confusion i2 d2 | synergy: enemy doubted → +1 int | 8.4 (the word slips its meaning) |
| leeching-syllogism (H2) | heal 2 | hemorrhage i2 d3 + siphon 50% | — | 7.4 |
| gabriels-bulwark (H2) | Guard 2 | Barrier 9 | — | 6.5 |

### Theorem (14) — 9.5–12 pts

| card | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|
| empathetic-understanding (M2, P7) | draw 1 | reveal next 2 phases + mark d2 | dieBonus heart: reveal ALL | 9.6 |
| arrow-paradox (B2, P7) | Guard 2 | lock enemy stance + slow d2 | per revealed phase: +1 Guard ×3 (×0.5) | 9.8 (motion frozen mid-flight) |
| the-gallery-nods (H2, P1) | +1 Conviction | despair i1 d4 + 2 Premises + draw 1 | dieBonus heart: +1 Premise | 9.7 |
| the-overtake (B2, P2) | tick | **spendAllPips**: +1 int to one enemy DoT per pip + Guard 2 per pip | — | ~10 (sudden and total) |
| barbara-valid-form (M2, P3) | draw 1 | silence d3 | sequence after-same-stance: refresh_die | 10.1 (the valid form pays) |
| fallen-grace (H2, P4) | draw 1 | hemorrhage i2 d3 | **Fallen**: instead rupture + siphon 50% (×0.5) | 10.4 |
| ex-nihilo (M2, P5) | draw 1 | **forge_floating_die** (color of powering die) | threshold Mind 4: it lands with 1 pip | 9.8 |
| synthesis (H2, P6) | draw 1 | tickAllDots + vulnerable i1 d2 | dialectic: tickAllDots AGAIN | 10.6 |
| mounting-contradictions (M2) | draw 1 | COMPOUND (3/distinct debuff, cap kept) | — | 9.5 |
| crescendo-of-suffering (H2) | tick | AMPLIFY 40% of pending DoT (not consumed) | threshold Heart 4: 55% | 9.6 |
| the-inevitable (M2) | +1 Conviction | AMPLIFY 50% | threshold Mind 5: 75% | 9.9 |
| moving-the-goalposts (M2) | draw 1 | doubt + overextended + sensory-null | — | 10.0 |
| grandfather-paradox (B2) | Guard 2 | cleanse ALL self-debuffs + resolute i2 d2 | threshold Body 4: also refresh_die | 10.2 |
| appeal-to-consequences (B2) | tick | fear i2 d2 + self grantsAdvantageNextRead | — | 9.7 (believe, or else) |

### Axiom (8) — 12.5–16 pts

| card | FREE | PAID | ⬡ | pts |
|---|---|---|---|---|
| resonance-detonation (H3) | tick | RUPTURE (consume all DoTs; burn fuel ×1.5; cap kept) | — | 13.0 |
| achilles-overtake (B3) | tick | EXECUTE (≤25% HP or ≥2 DoTs → 25% max-HP burst) | threshold Body 5: threshold 35% | 13.5 |
| existential-collapse (B3) | tick | REACT fear+confusion → consume both: stagger + burst 8; else bleed i2 d2 | — | 12.8 |
| the-final-word (M3) | draw 1 | poison i3 d5 (honest lifetime curve printed) | if powering die is your LAST available: +2 int | 13.4 |
| peroration-the-closing-word (H3, P1) | +1 Premise | **Peroration** (one in play): at 6 Premises — all enemy DoTs +1 int, draw 2, +2 Conviction | — | ~13 |
| pact-of-akrasia (B3, P4) | Guard 2 | **forge_floating_die (wild)** − recoil 6 HP − self vulnerable d2 (credits) | — | 12.6 |
| cassandras-curse (M3, P7) | draw 1 | reveal ALL phases + doubt; +1 int on next status per revealed phase (×0.5) | — | 13.2 |
| qed (M3, P3) | reveal next stance | COMPOUND | sequence last-play: also draw 2 + stagger 1 | ~14 |

### Aporia (7) — rule-rewriters (persistent engine text; min 4 pts/rider × sim-measured triggers)

| card | FREE | PAID (persistent for this combat) | pts basis |
|---|---|---|---|
| pyrrhic-victory (B3) | tick ×2 | EXECUTE + 10% max-HP self-recoil (the library's best identity, kept) | execute 5 − credit |
| unmoved-mover (H3) | Guard 3 | stagger 1 + Guard 8; all Reserve dice +1 pip | ~15 (what waits, ripens) |
| perpetual-dialectic (M3, P6) | draw 1 | *This combat:* every dialectic rotation you complete grants +1 Conviction and 1 tick | engine text |
| prime-mover (H3, P5) | +1 Conviction | *This combat:* whenever you play a temporary or a priori die, +1 Conviction and 1 tick | engine text (dice from nothing, and the nothing pays) |
| the-fall-foretold (B3, P7) | reveal next stance | *This combat:* revealed phases stay revealed; enemy telegraphs are downgraded 1 rung while ≥3 phases stand revealed | engine text |
| sophists-wager (H3, P4) | +1 Conviction | *This combat, while Fallen:* your self-debuffs also count as enemy debuffs for COMPOUND/REACT/EXECUTE gates | engine text (the debt argues for you) |
| reductio-ad-absurdum (M3, P1) | +1 Premise | **Peroration**: at 8 Premises — stagger 1 + RUPTURE | engine text (the argument completes itself) |

**Retired outright** (identity can't survive no-strike): mob-appeal,
straw-giant, metaphysical-drain, sunk-cost-momentum (token burst),
gamblers-ruin (Conviction burst), briar-riposte (counter-damage),
omnipotence-paradox (telegraph-mirror burst — raw HP with no status
precondition), ship-of-theseus / achilles-gambit / bat-swarm-thoughtform /
appeal-to-authority / raven-paradox / liars-paradox / stoic-bulwark /
eternal-recurrence / apophatic-aegis / regress-ad-infinitum /
transcendent-synthesis / gamblers-folly / existential-debt /
buridans-wager / buridans-impasse / gamblers-fallacy / logical-recursion /
nirvana-fallacy / novikov + others not re-cut above — retire now,
re-enter later through `/deck-tuning` promotion if a package needs them
(several are natural P4/P5 members).

**Mercy line unchanged:** befriend (H1) survives as-is (ADR-0007);
peaceful-gesture carries the token economy.

**Starting deck:** slippery-slope + brace-for-impact + Retreat (both
starters teach a dice mechanic in fight one; unchanged from Spec 31).

**Presets re-cut** (each with ≥1 package identity): *Erosion* (DoT +
detonation staples), *Peroration* (P1), *Stride* (P2), *Syllogism* (P3),
*Akrasia* (P4 + Ex Nihilo forge), *Cassandra* (P7 + control staples).
Dialectic cards salt ALL presets (rotation is a texture, not a silo).

## 8. Engine-change ledger (sized S/M/L)

| # | change | files | cost |
|---|---|---|---|
| 1 | `rank: 1..6` field + budget-lint test (pricing table module + per-card arithmetic comments) | Cards/types.ts, new cards.pricing.ts, e2e lint | **S/M** |
| 2 | Strike purge: basePower/chipHp/riposte.damage/DIRECT_DAMAGE_WEIGHT removal + test re-pins | combat.engine.ts, skill.engine.ts, tests | **M** |
| 3 | A priori pouch: save-shape field, forge verb, turn-start Reserve injection, cap/valve rules | encounter.types, character state, reducer, engine | **M** |
| 4 | `sequence` condition class (first / after-same-stance / last) in projectCardPlay | combat.projection.ts, types | **S/M** |
| 5 | Premises tally + Peroration slot (one-in-play, fire-at-N) | engine, types, presenter | **M** |
| 6 | `spendAllPips` payoff rider | engine (R2 path) | **S** |
| 7 | Fallen state (≥2 self-debuffs) + whileFallen gates | engine condition eval | **S** |
| 8 | dialectic condition (prev-play stance cycle compare) | engine (R9 substrate) | **S** |
| 9 | revealedPhases tally + per-reveal riders + stay-revealed/downgrade (Aporia) | engine (R5 substrate) | **M** |
| 10 | conjure_card (one-use Thoughtforms) | deck/hand path | **S/M** |
| 11 | Aporia persistent engine text (this-combat triggers) | engine trigger bus | **M** |
| 12 | rewards: per-rank drop weights (generalize gold-weighting) | combat.rewards.ts | **S** |
| 13 | R7 amendment (+2 Guard on defend replaces +3 flat) | engine | **S** |

Implementation order: 1–2 (the purge + the ladder are pure wins) → 3
(pouch) → 4/6/7/8 (cheap conditions) → 5/9/10 (package infrastructure) →
11 (Aporia) → 12–13. Every step re-verifies `npm run verify -w
axiomancer-mobile` (barrel contract).

## 9. Open questions for the owner

- **Q1 — chip line.** Working assumption: "chip 2" FREE lines and `chipHp`
  riders die WITH the strikes (the catalogue above assumes yes; "tick"
  replaces chip as the small FREE line). Confirm — or keep chip-2 as a
  vestigial Dawncaster-style basic-attack floor?
- **Q2 — Priors pouch valves.** Cap 3, forge 1/battle, inject 1/turn via
  an empty Reserve slot, forged die lands after combat. Comfortable? And:
  is the optional dulling valve (carried Prior loses 1 pip per battle)
  wanted from day one, or held in reserve?
- **Q3 — ladder names.** Doxa → Lemma → Thesis → Theorem → Axiom → Aporia,
  with Aporia reserved for rule-rewriting engine text (data-supported) vs
  a plain sixth numeric band (weaker prior art). Rename/resize freely —
  bands re-cut trivially.
- **Q4 — status-payoff line.** Catalogue keeps rupture / compound /
  amplify / execute / react as the ONLY HP-touching verbs (they require
  statuses first). Confirm, or go absolutist (no card ever prints an HP
  number — payoffs convert DoT into draw/dice instead)?
- **Q5 — library size.** 75 cards across 12/18/16/14/8/7. Bigger/smaller?
- **Q6 — retired identities.** Any cards on the retired list you want
  saved? Most re-enter naturally as P4/P5 members via `/deck-tuning`
  promotion.
