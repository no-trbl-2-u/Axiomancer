# Hazard minigame — playtest follow-up spec (2026-06-10)

Captured from a playtest review + alignment Q&A. Six issues, all confirmed
with the player. This is the authoritative intent for the changes on branch
`claude/hazard-minigame-playtest-tfdm2c`.

## 1. Dice apply to the whole card

Dropping a mana die anywhere on a **staged card frame** powers it — not just
the small mana socket. The drop hit-test uses the full card rect (with a
forgiving pad), and a die released inside the play area when exactly one
staged, un-applied card can accept it applies to that card.

## 2. Apply button under every played card

Every staged card shows an **APPLY** button.

- Flow: stage → (optionally drop a die) → tap **APPLY**.
- **Die first, then Apply.** Utility effects (draw / re-cast / convert) do
  **not** fire on stage or on drop — they fire **once, on Apply**, at the
  powered tier if a die is attached, else the base tier.
- Apply **locks the card permanently**: it can no longer be returned to hand,
  re-powered, or discarded. This applies to *every* card (number and utility).
- The **PLAY** button only unlocks when the play area is non-empty **and every
  staged card has been applied**.
- Number-value cards still update the meter the moment they're **staged**
  (and drop back when un-staged before Apply) — unchanged from before.

## 3. Discard

Drag-to-trash is the discard gesture (tap still opens details). It is fixed so
it reliably registers, and the bin is a larger target. **Discard is hand-only**
— staged/applied cards cannot be binned. Salvage benefit is unchanged.

## 4. Hand arch

The fan is **always** arched (no more occasional flat row), with a **stronger
curve**, and the curve amount is a **tunable** constant.

## 5. Colours (code keeps `gold`; UI label is "YELLOW")

- **Wild gold/"yellow" die** — powers a card of *any* colour. (Gold **cards**
  still require a gold die.)
- **Red / Blue** — single-meter number cards (red = FORCE, blue = ESCAPE),
  numbers considerably higher than purple. Rare red/blue carry a *minor*
  utility.
- **Purple** — low **dual** number (fills both meters) that is always present,
  plus a *minor* utility that becomes *major* when a die is applied (the die
  upgrades the utility, not the number).
- **Gold ("yellow")** — utility-**first**: a *major* utility for free; a high
  **dual** number that appears **only when a die is applied** (≈ red/blue
  magnitude, but on both meters). Rare. Powered by the wild gold die.

So a die does different work per colour: it raises the **number** on red/blue
and gold, and upgrades the **utility** on purple.

## 6. Tuning module

All balance knobs live in `state/hazard/tuning.ts` (`HAZARD_TUNING`) so the
hazard-tuning skill has a single file to edit:

- **Core round** — dice count, hand size, play max, momentum cap, deck weight
  scale (deck size).
- **Difficulty** — per-hazard safe/risk thresholds (still authored in
  `content.ts`) and the die-face bag / hex odds.
- **Card stat bands** — red/blue, purple, gold number bands and utility
  base/powered amounts.
- **Rewards / consequences** — vitae, shillings, HP loss/scar, rarity weights.
- **Hand arch** — fan lift + rotation.
