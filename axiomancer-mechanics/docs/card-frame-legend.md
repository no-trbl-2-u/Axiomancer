# Card frame legend — the structure every card shares

The [keyword atlas](./keyword-atlas.md) defines the *verbs* (STAGGER, POISON, …).
This legend defines the *frame* they sit in — the die economy, the two-line
FREE/PAID split, the conditional die-line glyphs, and the status notation. It is
stated once here so no card face or keyword row has to repeat it. A card is
"resolvable" when its face + the atlas + this legend leave nothing unstated.

## The two lines

Every card prints two lines:

- **FREE —** the top line. Fires automatically, **costs no die**.
- **PAID —** the bottom line. The card's main effect. **Costs 1 die** (any
  colour) to fire. Every PAID line costs exactly one die, so the cards no longer
  print it.

Enchantments split by *duration* instead: **FREE (N rounds) —** grants the
passive for N rounds; **PAID (rest of combat) —** makes it permanent. A
disenchant's passive **attaches to the enemy**.

## Die-line glyphs (conditional riders)

Riders print after the PAID line, each led by a glyph naming its trigger:

| Glyph | Trigger | Reading |
|-------|---------|---------|
| `⬡ COLOR ×N spent` | **Threshold** — you have spent N dice of COLOR this turn (across all cards) | rider fires once the count is met |
| `⬢ COLOR die` | **Powering-die bonus** — the die you commit to *this* card is COLOR | `MIND/WILD` = the card's own colour or a wild; `off-colour` = any other |
| `✕ an X die may power this` | **Fate** — an X (**dead**, normally unspendable) die may pay the die cost | rider fires; may cost `recoil N HP` |
| `◆ <condition>` | **Synergy** — a combat-state condition holds | rider fires while true |

The text after the colon is the rider's full payload, in the same units the
atlas uses (`SWAY 4`, `draw 1`, `+1 intensity · STAGGER 1`).

## Status notation

- `name iN dM` — a status at **intensity N**, **duration M**.
- `(K over its run)` — total damage a damage-over-time effect deals across its
  life.
- `(K/play)` / `(K/hit)` / `(K/payoff)` — an event DoT's bite **per clock
  event** at its printed intensity: POISON bites per **card you play**, BLEED
  per **damage instance** (then decays 1 intensity per trigger), payoff-clock
  DoTs per **payoff verb fired**. See the atlas rows for the clocks.
- `RIPOSTE N (parry K)` — the counter deals N on a full block; the **parry**
  additionally shaves K off the first incoming hit each phase (that shave
  counts as prevented damage).

## Rank tag

`Doxa · Lemma · Thesis · Theorem · Axiom · Aporia` is the rarity ladder. It
shows as a chip, not on the face — it never affects resolution.
