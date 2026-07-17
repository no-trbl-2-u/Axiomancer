# Upgradeable Dice — 2026-07-17

## Surface question

Owner: instead of rolling n dice where each SIDE is a different color, what if
we rolled 4 six-sided dice where each DIE is a single color — Red, Blue,
Purple (1 special / 2 mana / 3 miss) and Gold (1 special / 1 mana / 4 miss) —
where a mana face powers a card, a miss is a dead die, and a special powers a
card AND grants 2 tokens? And then: the dice can be swapped out and upgraded
(more hit faces, different special payloads).

## Better question surfaced

The probabilities are the small delta. The real question the proposal forces:

> **What happens to the action economy and the stance read?** "Every mana die
> powers a card" replaces today's 1-drafted-die-plus-earned-refreshes with
> ~1.83 automatic paid plays/round — which silently deletes the single-die
> law, the draft decision, the hidden-stance RPS read, and everything hanging
> off it (OMEN, STAKE, read-win ◆, momentum wheel, Resonance, bank-or-burn).

Owner's verdict on the read: *"I don't really think we need the rock/paper/
scissors mechanic anymore. There's WAY more to pay attention to now."* Which
surfaced the third question: where does stance live instead — build-time
label, or a live per-round verb?

## Prior art consulted

- **kb:the-quacks-of-quedlinburg/reception/reviews (src-005, src-006)** —
  failure-as-spectacle works with a catch-up valve; luck-averse friction.
- **kb:oathsworn-into-the-deepwood/reception/better-if (src-005)** —
  dice-vs-cards praised; transparent risk communication is the opportunity.
  An inspectable, upgradeable face table is exactly this.
- **Remembered (not yet in kb/ — wishes filed)**: Astrea: Six-Sided Oracles
  (no pure-blank faces), Slice & Dice (miss faces tolerated because of the
  reroll ritual + visible upgrades), Dicey Dungeons (randomness = what, not
  whether), Quarriors (dead-pool churn patches), Elder Sign (uncompensated
  misses = the cautionary tale). Consensus: miss-heavy faces are accepted
  when (a) a reroll ritual exists, (b) misses feed a currency, or (c)
  upgrades visibly delete misses over the run — (c) is this proposal's core
  fantasy.
- **Slay the Spire — Watcher** (remembered): stance as an *output of card
  play* is the genre's best-received stance system → adopted (Option C).

## Directions on the table (stance layer, RPS retired)

- **A — Stance-from-committed-die**: first hit die spent declares stance;
  open telegraphs. Risk: with open info and free declaration the layer feels
  vestigial.
- **B — Stance-as-build**: between-fight keystone die sets a fight-long
  stance. The owner's first instinct — but stance stops being a per-round
  verb; weakest for "status play is the fun."
- **C — Stance-from-cards, wheel-merged** *(chosen)*: stance = last PAID
  card's stance; enemies openly telegraph per-phase stance checks
  ("punishes X" / "yields to X"); the momentum wheel is absorbed into the
  stance layer; dice upgrades determine which stances you can reliably end
  in — build-around emerges, steering stays live every round.
- **D — Wager-layer, stance retired**: rejected — guts Heart/Body/Mind
  identity, retires two systems against the reinterpret-first preference.

## Decided (owner, this session)

1. **Gold = wild mana** (keeps per-color access ≈67% vs today's ~70%; a 4th
   color would collapse access to 50%/round against 5/5/5 presets).
2. **Tokens = Conviction (◆)**; sinks reprice for ~1.33◆/round income
   (today ~1.7–2.0).
3. **Die subsystems reinterpret, never cut** (Reserve/OVERHEAT, floating/
   FORGE, KINDLE, permanent wild+dead, Fate Tap→superseded; Forge's 7 cards
   keep their identity).
4. **Stance = Option C** (stance-from-cards + open stance checks).
5. **Momentum (owner reframe, stricter than proposed)**: paid card starts
   momentum on its color; only the NEXT chain color is a safe paid play
   (same-color paid also resets); persists across rounds; FREE cards never
   touch it; surge (3-chain) grants the temp gold die then resets. No
   cycling, no escalating surges.
6. **Whiff valve**: FREE lines + Press Fate (1◆, reroll all misses,
   once/round) + card-driven rerolls/conversion. No miss-face Fate Tap.
   Each theme/preset gains ONE dice-interaction card (far below FORGE's
   saturation).
7. **Upgrades**: dice are persistent and upgradeable *(framing corrected in
   2026-07-17 follow-up: NOT "equipment" — there is no equip/unequip and no
   die inventory; the four dice are permanent, only their faces mutate)*;
   FORGE = between-fight face-swap economy; caps ≤2 special / ≥1 miss per
   colored die, Gold ≤1 special; **in-combat temporary face upgrades are
   part of the FORGE preset's identity** (owner addition).
8. **Miss = 0◆** — fuel only, never income.
9. **Pool law: exactly 4 rolled dice; growth is face quality, not count**;
   bounded exceptions (KINDLE, surge, Reserve, one gold+lead pair), hard
   ceiling 7 die objects.

## Open questions

- Color↔stance naming (R/B/P ↔ body/mind/heart assumed) — cosmetic, pin in
  spec review.
- Reset-and-restart reading (a resetting paid card immediately starts a new
  chain on its own color) — natural reading, confirm at spec review.
- ◆ sink repricing table (signatures, STAKE 2/4/6, antes) — derive in sim
  phase against the measured income.

## Where it landed

Formalized as **spec 33** (`specs/33-upgradeable-dice.md`); phase candidates
filed to `plan/PHASE_CANDIDATES.md` (Upgradeable-Dice D1–D7). Session run
with two mechanics-expert passes (delta/balance analysis, then stance-layer
design); all constraining questions owner-decided 2026-07-17.
