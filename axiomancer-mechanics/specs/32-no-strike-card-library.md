# Spec 32 — The No-Strike Library: utility/status card revamp + rank ladder

> **Status:** DESIGN DRAFT — awaiting owner answers to §9 open questions before
> any engine work. Authored 2026-07-06 from the owner's directive (Dawncaster
> card revamp session) + a mechanics-expert deep-mine of the Dawncaster KB
> (kb:dawncaster, 1,692 cards / 141 keywords, cloned from
> github.com/no-trbl-2-u/game-knowledge-base).
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
> spec replaces the card LIBRARY and adds the rank ladder + the persistent
> floating-die economy; it does not reopen Spec 31's dice rules.

---

## 1. Doctrine change — the strike dies

**Removed from the player's vocabulary entirely:**

- `basePower` flat damage on any card (the weak baseline strike).
- `chipHp` riders and "chip N" TOP actions.
- Strike-scaling language (`strike ×1.5` read bonuses become status-side only).
- The universal weak basic attack as a fallback plan. Trading blows is no
  longer a plan at all; it is not merely inefficient — it is *absent*.

**Enemy HP remains the sole win condition** (`isDefeated(enemy)`). Every
point of enemy HP now falls to exactly three sources:

1. **DoT ticks** — poison / bleed / burn / hemorrhage / septic / unraveling /
   despair, plus `tickAllDots` riders.
2. **Status-payoff verbs** — RUPTURE / COMPOUND / AMPLIFY / EXECUTE / REACT:
   HP bursts that exist *only because statuses were built first*. These are
   kept (working assumption, §9 Q1) — they are the payoff for the fun part,
   not a replacement for it.
3. **Reflect/thorns-class effects** — the enemy hurting itself on your
   statuses.

This completes the 2026-06 load-bearing doctrine ("status effects are the
MAIN fun"): status play stops being the *efficient* path and becomes the
*only* path.

## 2. Card anatomy — FREE / PAID is the card

Spec 31 already gave every card two lives: a **TOP action** (playable
without a die) and a **BOTTOM action** (powered by exactly one die). This
spec promotes that split into the design grammar the owner described:

```
┌─────────────────────────────┐
│  CARD NAME          [rank]  │
│  FREE  draw 1               │   ← top: dieless, small, always available
│  PAID  poison i2 d4         │   ← bottom: one die, the real payload
│  ⬡ die line (threshold /    │
│    dieBonus / fate / manip) │
└─────────────────────────────┘
```

- **FREE and PAID lines draw from the SAME verb menu (§3).** "draw 1 /
  poison 5" and "poison 2 / draw 3" are both legal cards — same total
  budget, opposite shapes. Which half a verb sits in is an identity choice,
  not a power choice.
- Budget law: **FREE line ≈ 25–35% of the card's total budget** (§4). A
  generous FREE line means a lean PAID line at the same rank, and vice
  versa.
- Every Tier-2+ card still carries exactly ONE die-interaction line
  (Spec 31 P1 law); Tier-1 at most one.

## 3. The verb menu (post-strike vocabulary)

All verbs are engine-real today or already specced in 31-P1. Point costs
in §4. **B** = suits BOTTOM magnitudes, **T** = suits TOP magnitudes,
**BT** = both.

| family | verbs |
|---|---|
| **Status — DoT** (BT) | poison, bleed, burn, hemorrhage, septic, unraveling, despair (intensity/duration per effect library) |
| **Status — control** (B) | confusion, fear, slow, root, silence, charm, stagger, sensory-null |
| **Status — exposure** (BT) | vulnerable, vulnerability(stance), mark, doubt, overextended, novikov (next-DoT-upgrade) |
| **Status — self-buff** (BT) | resolute, regeneration, life-steal, thorns, brazen-thorns, phoenix-vigor, promethean-ember, clarity, negation |
| **Draw / hand** (BT) | draw N; scry-style reveal of next phase stances (`revealStance`) |
| **Dice — in-combat** (B) | create_temporary_die, grant_pip, bank_spent_die, refresh_die, convert_die_color, reroll_spent |
| **Dice — persistent** (B) | **FORGE A PRIORI DIE** (§5, new): a die that outlives this battle, consumed on use |
| **Defense** (BT) | guard, barrier, riposte(reduce-only variant — the counter-damage half is dropped with the strike), cleanse, heal, conviction |
| **Status payoffs** (B) | rupture, compound, amplify, execute, react, tickAllDots, siphon(heals off DoT ticks) |

Riposte note: `riposte.damage` is flat HP and dies with the strike; the
verb survives as pure parry (`reduce`) — or fold it into guard and retire
the verb (§9 Q4).

## 4. The rank ladder + power budget

Two axes, cleanly separated:

- **`tier` (1/2/3) stays** — it is a *mechanical resist field* (Tier 1
  auto-applies, Tier 2 resisted, Tier 3 nat-20-only repel), not a quality
  statement.
- **`rank` (new, 6 steps)** — the quality/rarity axis the owner asked for.
  Cards at higher rank ARE flat-out better; the ladder makes that honest
  instead of accidental.

The ladder, in the game's own voice (ascending):

| rank | name | budget band (pts) | intent |
|---|---|---|---|
| 1 | **Notion** | 1.5 – 2.0 | starter chaff; teaches one verb |
| 2 | **Premise** | 2.0 – 2.75 | solid singles; the draft floor |
| 3 | **Lemma** | 2.75 – 3.5 | two verbs that already cooperate |
| 4 | **Theorem** | 3.5 – 4.5 | package cards; build-around beginnings |
| 5 | **Axiom** | 4.5 – 6.0 | deck-definers; one per deck feels great |
| 6 | **Absolute** | 6.0 – 8.0 | capstones; the reason a run is a story |

**Power-budget point table** (unit: 1.0 pt ≈ "draw 1 card"). Every card's
lines must sum inside its rank band — this is the audit that keeps "flat
out better" a *design* rather than a mistake.

| verb | pts | notes |
|---|---|---|
| draw 1 | 1.0 | the unit |
| +1 Conviction | 0.4 | |
| heal 4 | 1.0 | |
| Guard 6 | 1.0 | ~0.17/Guard |
| Barrier 1 | 0.5 | persistent soak |
| cleanse 1 | 0.8 | |
| reveal next stance | 0.7 | ×2 stances ≈ 1.2 |
| poison i1 (d4) | 1.2 | bleed i1 (d2) 0.7 · burn i1 (d3) 1.0 · hemorrhage 1.0 · septic 1.4 · unraveling 1.3 · despair 1.2 |
| +1 intensity step (any status) | +0.8 | |
| +1 duration turn (any status) | +0.3 | |
| confusion | 1.4 | fear 1.2 · slow 1.2 · root 1.0 · silence 1.6 · charm 1.8 · sensory-null 1.1 · stagger 2.5 |
| vulnerable | 1.3 | stance-vulnerability 1.0 · mark 0.8 · doubt 0.9 · overextended 0.6 · novikov 0.9 |
| resolute i1 | 0.9 | regeneration 1.1 · life-steal 1.2 · thorns 0.8 · clarity 0.5 · negation 1.0 |
| temporary die (this combat) | 1.2 | wild +0.3 |
| **forge a priori die** | **2.0** | wild 2.5 — priced high; it is banked tempo (§5) |
| grant_pip (all Reserve +1) | 0.8 | bank_spent_die 0.9 · refresh_die 1.5 · convert-to-wild 1.0 · reroll_spent 0.8 |
| tickAllDots ×1 | 1.2 | scales with build by construction |
| rupture | 2.2 | compound 1.8 · amplify(×0.5) 1.6 · execute 2.5 · react 2.0 · siphon50 0.9 |
| die-line riders | threshold/dieBonus/fate riders cost their rider verbs ×0.5 | conditional = half price |

The table is a *pricing prior*, not a simulator: `/deck-tuning` remains the
empirical court. But every authored card ships with its budget arithmetic
in a comment, and a lint test asserts the sum lands in the rank band.

## 5. A PRIORI dice — the floating, persistent pouch

The owner's "floating dice": *forged in one battle, spendable in a later
one, gone once used.*

- New character-level pool: `aprioriDice: CombatManaDie[]` (color, no pips)
  — **the Priors**. Persisted on the save alongside deck/HP; distinct from
  the per-encounter Reserve (which keeps its ripening game) and from
  `permanentWildDice` (which stays encounter-scoped).
- **Forging** (card verb, BOTTOM-only): "commit a die to your Priors" —
  the forged die appears in the pouch AFTER combat ends (no same-battle
  loop; *a priori* means known before the experience that uses it).
- **Spending:** at any TURN start you may bring AT MOST ONE a priori die
  into the tray as an extra draftable die. Spending it consumes it forever.
  It feeds Resonance like any die; it cannot be banked to Reserve
  (no pouch→Reserve laundering).
- **Cap:** pouch holds **3** dice. Forging while full converts the forge
  into +1 Conviction (visible, printed on the card face — no silent loss).
- Anti-hoard/anti-snowball: the 1-per-turn valve + cap-3 + high forge price
  (2.0 pts) keep the pouch a *planned spike*, not an accumulating engine.

## 6. Build-around packages

> PLACEHOLDER — being synthesized with the mechanics-expert's Dawncaster
> deep-mine (kb:dawncaster). Target: 5–7 packages, each with an Axiomancer
> name in the philosophy vocabulary, a Dawncaster provenance line, its verb
> needs, and its no-flat-damage compliance note.

## 7. The card catalogue

> PLACEHOLDER — authored after §6 lands and §9 Q1–Q5 are answered.
> Target shape: ~72 cards; every card lists FREE line, PAID line, die line,
> rank, tier, budget arithmetic.

## 8. Engine-change ledger

> PLACEHOLDER — sized after the catalogue; expected: rank field + lint,
> a priori pouch (state, reducer, save shape, tray valve), strike removal
> (basePower/chipHp purge + test re-pins), riposte simplification,
> package mechanics (per §6).

## 9. Open questions for the owner

- **Q1 — HP-payoff line.** Working assumption: flat strikes/chips die, but
  status-PAYOFF verbs (rupture/compound/amplify/execute/react) survive as
  the only HP-touching cards. Confirm, or go further ("no card ever prints
  an HP number — DoT ticks only")?
- **Q2 — A priori pouch shape.** Cap 3, 1/turn, forge-lands-after-combat
  (§5). Comfortable? Alternative: unspent *Reserve* dice carry over instead
  of a new pool (one system, but loses the in-combat bank-vs-VITAE choice).
- **Q3 — Ladder size/names.** 6 ranks: Notion → Premise → Lemma → Theorem →
  Axiom → Absolute. Rename/resize at will — budget bands re-cut trivially.
- **Q4 — Riposte.** Pure-parry variant, or retire the verb into guard?
- **Q5 — Library size.** ~72 cards planned (yesterday's trim locked 48
  keepers as the quality bar). Bigger/smaller?
