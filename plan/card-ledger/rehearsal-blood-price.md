# Card ledger, Blood Price (the live trial set)

> [!NOTE]
> **These 30 cards are the live trial set.** T recorded the verdicts on
> 2026-10-11 (below) and Phase BT wired the kept cards in as a removable
> trial set (D75, D80; `plan/revamp/cards.md` → "The trial set"):
> `axiomancer-mechanics/src/Cards/library/blood-price.cards.ts`, registered
> by one `TRIAL_SETS` line in `cards.library.ts`, with the Blood Price lane
> and T's test deck. The cards are live content; this ledger is their
> record. The rest of the ballot stays cut, and any change to a card goes
> through a session with T (THE CARD HOLD, D37).

> Run as a paper rehearsal of Plan B (D73) on 2026-09-30 in an attended
> session with T. The ballot, its sandbox sims (branch
> `sandbox/blood-price-sims`) and T's verdicts led to the trial set.

## Session 0 — rulings (T, 2026-09-30)

| Call | Ruling |
|---|---|
| First family | **Blood Price**: "I pay in my own blood for power." |
| Family shape | **One family, three sub-lanes, about 10 cards each**: Payoff (benefits for sacrificing), Engine (helps trigger SACRIFICE), Misc (related utility; replaces the earlier Heal sub-lane) |
| First pool target | **30 cards** (3 × 10) plus grey. This replaces D73's "3 families × 1 lane" (≈36); the D73 amendment is filed in the decisions log |
| Bridges | Bridge cards join sub-lanes within a family (D73), so Blood Price can have them as soon as two sub-lanes exist |
| First slice | ~~Payoff~~ → **all three sub-lanes on one ballot** (T, 2026-09-30): 3 tabs × 10 slots × 3 candidates = 90 candidates, about 30 survivors |
| Other family fantasies (The Vigil, Rot and Omen, Loaded Dice) | Not picked; still open |
| §1 session rules | Not ratified; the rehearsal tests them |
| Scrap floor (T) | Scrapping any card gives 1 Conviction, so every card line must be worth more than that: no line gives only "gain 1 Conviction". Seven ballot candidates were revised to meet it (P-08a, P-08c, E-01a, E-01c, M-05a, M-05b, M-05c) |
| Global text template (T) | The duration is shown as badges (FREE ⏳3, PAID ∞), the text opens with a trigger from a closed set (⟳ turn start, 🩸 SACRIFICE, 📜 Curse played), and a PAID line shows only what changes. Applied to all 12 Global candidates (P-10, E-03, E-09, M-08). Details in `plan/revamp/cards.md` |

## Sub-lane pitches (draft slot roles, plain text)

### Payoff (being balloted)

| Slot | Type | Role |
|---|---|---|
| P-01 | Attack | SACRIFICE small, big DEAL |
| P-02 | Skill | SACRIFICE, big GUARD |
| P-03 | Attack | DEAL more at half VITAE or less |
| P-04 | Attack | A huge hit that only works at low VITAE |
| P-05 | Spell | VULNERABLE that grows with VITAE lost (capped) |
| P-06 | Skill | GUARD that grows with VITAE lost (capped) |
| P-07 | Attack | A finisher fed by what you have paid (capped) |
| P-08 | Skill | SACRIFICE for Conviction |
| P-09 | Spell | SACRIFICE n, the foe loses n (ignores GUARD) |
| P-10 | Global | Each SACRIFICE also hurts the foe |

### Engine (being balloted; ballot slot roles refined)

| Slot | Type | Role |
|---|---|---|
| E-01 | Spell | Add the grey Curse to hand; gain Conviction |
| E-02 | Skill | SACRIFICE 1, twice (counts as 2 sacrifices) |
| E-03 | Global | At the start of your turn, SACRIFICE 2 |
| E-04 | Spell | Your next SACRIFICE this turn costs 0 but still counts |
| E-05 | Skill | Play a Curse from hand at no VITAE cost |
| E-06 | Attack | DEAL, then SACRIFICE 3 |
| E-07 | Spell | Double your next SACRIFICE (and its payoffs) |
| E-08 | Skill | Return a Curse from discard to hand |
| E-09 | Global | When you play a Curse, gain 1 Conviction |
| E-10 | Spell | SACRIFICE any amount you choose (X) |

### Misc (replaces Heal, T 2026-09-30)

Related utility that is neither payoff nor engine.

| Slot | Type | Role |
|---|---|---|
| M-01 | Skill | Plain healing |
| M-02 | Attack | DEAL and heal from it |
| M-03 | Skill | Stronger defence at low VITAE |
| M-04 | Spell | Get rid of a Curse |
| M-05 | Skill | Conviction for being at low VITAE |
| M-06 | Skill | Last stand: cannot drop below 1 |
| M-07 | Spell | Mark the foe; heal when you hurt it |
| M-08 | Global | Heal each turn |
| M-09 | Skill | Healing past max becomes GUARD |
| M-10 | Spell | Return the pain you took (capped) |

## Ballot

- **Ballot sheet:** [`rehearsal-blood-price.ballot.html`](rehearsal-blood-price.ballot.html).
  It has three tabs (Payoff, Engine, Misc) with 10 slots × 3 candidates each,
  90 candidates in all.
- **Format change from T:** on 2026-09-30 T replaced the one-question-per-slot
  ballot with this sheet: a card image per candidate, a checkbox, and a
  Generate button that produces the verdict text.
- **Purple drafts (2026-10-10):** eight heart proposals, option "d" in eight
  blue-only slots (P-06d, P-08d, E-02d, E-03d, E-10d, M-01d, M-03d, M-08d),
  built from TETHER, LEECH, VULNERABLE and the existing keywords, so a deck
  can reach 10 red / 10 blue / 10 purple. Added to the ballot for T.
- **Rulings (T, 2026-10-10):** "the foe loses n" is unscaled and not a DEAL;
  HEAL is a mind-scaled keyword capped at max VITAE, and "heal the damage
  dealt" heals the actual amount; a SACRIFICE triggered n times counts as
  n; WAIVE (next SACRIFICE this turn costs no VITAE, still counts); playing
  a Curse at no VITAE cost is a WAIVED SACRIFICE; TETHER and LEECH as in
  D80. Printed numbers stand (no tuning).

## Verdicts (T, 2026-10-11)

**Kept: 30 cards, one per slot** (11 red / 9 blue / 10 purple), plus the
grey Curse the E-01 cards add:

| Sub-lane | Kept |
|---|---|
| Payoff | P-01a, P-02a, P-03a, P-04c, P-05b, P-06d, P-07b, P-08d, P-09b, P-10c |
| Engine | E-01a, E-02d, E-03d, E-04c, E-05c, E-06b, E-07b, E-08b, E-09c, E-10d |
| Misc | M-01d, M-02b, M-03d, M-04c, M-05b, M-06c, M-07a, M-08d, M-09a, M-10a |

All eight purple "d" drafts are kept. **Cut:** every other option, 68 in
all (the 90 ballot proposals and 8 drafts, less the 30 kept). No merges.

**Test deck (20 cards, T):** E-09c, P-03a, M-04c, M-02b, E-06b, P-02a,
E-04c, E-05c, M-09a, M-06c, P-05b, M-07a, E-03d, M-01d, M-08d, E-08b,
M-05b, E-07b, M-10a, P-10c. It is the lane's test deck in the dev menu
(`/dev` → CARDS → TEST LANE DECK → Blood Price).

Card ids are `bp-<slot><option>` in lower case (`bp-p-01a`); the Curse is
`bp-curse`. Names are the placeholder "Blood Price P-01a" until T names
the cards.

## Outtakes

The 68 cut proposals (`rehearsal-blood-price.ballot.html`).

## Revisions

None yet.
