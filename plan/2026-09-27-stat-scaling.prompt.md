# Stat scaling (S3, refactor D1 step 3) — phase brief

> T, attended session 2026-09-26/27. Decisions D39–D42 in
> `plan/2026-09-25-refactor-strategy.decisions.md`. Every choice below was
> put to T as a ballot, with worked late-game numbers; do not re-ask it.
> Prior art: Gordian Quest (a stat per card family, different rate per
> effect type), with Slay the Spire, Arkham LCG, Pathfinder ACG, Diablo
> III/IV and FFXIV as the contrasts (research notes in the session record,
> 2026-09-26).

## 1. The model

**Three families, decided by where the effect lands (D40).** Every player
keyword belongs to one:

| Family | Stat | The rule | Examples |
|---|---|---|---|
| Body | `body` | Immediate damage to the foe | DEAL |
| Mind | `mind` | Anything that sits on **you** | GUARD, THORNS, regen, self-buffs |
| Heart | `heart` | Anything that sits on the **foe** | VULNERABLE, BURN, BLEED, STUN |
| Grey | none | Everything else | draw, dice tricks, card handling |

A future keyword needs only a family and a scaling type (§2); the table
decides the rest. After the purge (P1) the player's keywords are DEAL (body),
GUARD (mind) and VULNERABLE (heart).

**Legibility (D40).**
- Keyword text is coloured in its family's colour: the dice palette (the
  body die's colour for body, and so on). Colour alone isn't enough, so
  each keyword also carries a small stat glyph.
- In combat the card face shows the **final** number, stat already applied,
  tinted to show it was raised. The player never has to do the arithmetic.
- Design rule for every future card (guided sessions only, D37): a card's
  colour is the family of its main keyword. A mixed card takes its main
  verb's colour; its second keyword keeps its own colour in the text.

## 2. The formula (D41)

| Scaling type | Formula | Notes |
|---|---|---|
| One-shot amount (DEAL, GUARD, a single hit) | `base × stat ÷ 5` | 5 (the starting value) is neutral; each point is +20% of the base |
| Repeating amount (DoT per tick, THORNS per hit, regen) | `base × (1 + (stat − 5) ÷ 10)` | Half rate, because it fires repeatedly |
| Percentage (VULNERABLE) | `base% × stat ÷ 5` | Same as one-shot |
| On/off effects and every duration (STUN, turns, stacks-as-turns) | never scales | Prevents stun-lock |

- **Nothing is capped.** T: "don't cap anything". Remove
  `VULNERABLE_MAX_MULT` (`Combat/effects.ts:62`) and any other clamp on a
  scaled amount; keep integer rounding (floor for the printed number).
- **Order of stacking:** printed base → stat multiplier → colour match
  (+25%) → the read → VULNERABLE on the target. The card face shows the
  number up to the stat step (and the colour match once a die is staged, as
  today); target-side multipliers apply on hit.
- **Enemies don't use this formula.** Their numbers stay authored.

**VITAE (D41):** `50 + 12 × body + 6 × mind + 6 × heart`. That's 170 at
5/5/5, unchanged from today, so no save's start moves. It replaces
`HEALTH_PER_STAT` in `calculateMaxHealth` (`Utils/index.ts:171`) and
`previewStatAllocation`.

**Enemy VITAE stays linear:** `(30 + 18 × level) × VITAE_MULT[difficulty]`.
Player damage also grows linearly with stat points (3 per level), so
hits-to-kill holds steady.

## 3. Worked numbers (pin these in tests)

Grey cards: A Plain Blow DEAL 5, A Plain Ward GUARD 5, and A Plain Word
(D42, D43): PAID VULNERABLE +25% for 2 turns, FREE VULNERABLE +10% for 1
turn. VULNERABLE adds up on re-application and refreshes its duration.
"Blow on a marked foe" rounds to nearest, as the engine's on-hit damage
does (47 × 1.25 = 58.75 → 59).

| Build | Level | Blow | Ward | Mark | Blow on a marked foe | VITAE |
|---|---|---|---|---|---|---|
| 5/5/5 | 1 | 5 | 5 | +25% | 6 | 170 |
| 32/5/5 | 10 | 32 | 5 | +25% | 40 | 494 |
| 47/5/5 | 15 | 47 | 5 | +25% | 59 | 674 |
| 19/19/19 | 15 | 19 | 19 | +95% | 37 | 506 |
| 26/5/26 | 15 | 26 | 5 | +130% | 60 | 548 |

## 4. Shipping

- Engine: a single `scaleAmount(base, stat, kind)` in `Combat/` (or
  `Character/`), a family and scaling type on every keyword definition, and
  every card-number resolver calling it. A guard test fails any keyword
  without a family.
- Mobile: card faces render the scaled number and the family colour and
  glyph; the level-up modal previews the new VITAE (it already calls
  `previewStatAllocation`).
- Card editor: shows each keyword's family.
- Baselines: this moves the matrix. Re-stamp and say so in the PR.
- Order: S3 ships after T6 (the alignment/GRACE removal and the
  `philosophicalAspect` rename) and before P1 (the purge). Built against the
  full pool, the purge then shrinks it to the three grey cards.
