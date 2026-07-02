# Rest Encounter ("The Night Watch") — Mechanics Source of Truth

> Derived from `src/World/Rest/` as of 2026-06-15.
> Phase 137 — Live.

---

## What it is

A camp rest encounter triggered by Rest map nodes. The player chooses a sleep
posture, then three watches play out through the night. Fire management, dreams,
stirs, and comfort accumulate into a dawn heal. Designed to never be lethal;
it always restores some VITAE.

---

## Core loop

1. Rest node triggers.
2. Player chooses a **posture** (Deep / Doze / Watch).
3. Three watches are drawn from the night bag without replacement and resolve
   in sequence.
4. Dawn arrives: warmth and comfort are tallied into a healing fraction; any
   lingering effects are cleansed if warmth is high enough.
5. Outcome is claimed.

---

## Postures

| Key | Name | Base heal | Character |
|---|---|---|---|
| `deep` | Sleep Deep | 40 % max VITAE | Richest heal. Dark works unwatched. Stirs always cost the full toll. |
| `doze` | Doze Light | 30 % max VITAE | Middle ground. Stirs in the dark are a coin toss — outcome is random. |
| `watch` | Keep Watch | 20 % max VITAE | Thinnest heal. Nothing reaches you in the dark. Watchful eyes find things (treasures / map clues). |

Base heal is the floor. Warmth and comfort add to it per the REST_TUNING multipliers:
- `+healPerWarmth` per point of dawn warmth (default 0.04).
- `+healPerComfort` per point of comfort (default 0.05).

Lingering effects (e.g. curses) are cleansed if dawn warmth reaches `cleanseWarmth` (default 3).

---

## Watch bag

The night's bag of nine slips; three are drawn without replacement:

```
embers  ×3
dream   ×3
stir    ×2
still   ×1
```

---

## Watch kinds

| Kind | What happens |
|---|---|
| **Embers** | The fire wants feeding. Spend firewood for warmth (+1 warmth), or hoard it. Cold nights reduce comfort recovery. |
| **Dream** | An authored dream event. Choice: **Hold** (gain a keepsake) or **Fade** (gain comfort). |
| **Stir** | Posture-dependent event: Deep = always costs; Doze = coin toss; Watch = nothing reaches you (may find something instead). |
| **Still** | A quiet hour. Free comfort gain. |

---

## Fire management

- **Warmth** starts at 2 (range 0–4).
- **Firewood (wood)** starts at 2. Spending 1 wood on an Embers watch raises warmth by 1 (cap 4).
- Not feeding the fire on an Embers watch may lower warmth.
- **Dawn warmth** determines whether lingering effects are cleansed and contributes to the final heal fraction.

---

## Comfort

An accumulated resource during the night:
- **Still** watches grant free comfort.
- **Fade** choice on a Dream watch grants comfort.
- **Stir** (non-Watch posture, bad outcome) may reduce comfort.
- Comfort adds `healPerComfort × comfort` to the dawn heal fraction.

---

## Outcome tiers

| Tier label | Heal fraction threshold |
|---|---|
| **Restored** | ≥ 55 % max VITAE healed |
| **Rested** | ≥ 35 % |
| **Meagre** | < 35 % (anything below Rested) |

---

## Keepsakes

Dreams that are **Held** mint a keepsake (a named object with flavor text). Kept
in the player's inventory as a memento; no mechanical effect in the current
implementation.

---

## Authored dreams

Current catalogue (from `rest.content.ts`):

| ID | Title | Keepsake |
|---|---|---|
| `dream-mother` | A Dream of the Mother | An oar's rhythm, remembered wrong |

(Additional dreams planned but not yet implemented — labeled as such in `rest.content.ts`.)

---

## Tuning

All numeric dials in `rest.content.ts` (`REST_TUNING`):

| Constant | Default | Effect |
|---|---|---|
| `watchesPerNight` | 3 | Watches per session |
| `warmthStart` | 2 | Initial warmth |
| `warmthMax` | 4 | Warmth ceiling |
| `woodStart` | 2 | Firewood on arrival |
| `healPerWarmth` | 0.04 | Heal fraction per warmth point at dawn |
| `healPerComfort` | 0.05 | Heal fraction per comfort point |
| `cleanseWarmth` | 3 | Warmth required to cleanse lingering effects |
| `restoredAt` | 0.55 | Heal fraction floor for "Restored" tier |
| `restedAt` | 0.35 | Heal fraction floor for "Rested" tier |

---

## Session state shape

Key fields on `RestSession` (see `rest.types.ts` for the full type):

```
phase       RestPhase   — posture | watch | outcome | done
posture     'deep' | 'doze' | 'watch' | null
watch       number      — current watch index (1–3)
bag         RestWatchKind[]   — shuffled draw order
warmth      number
wood        number
comfort     number
keepsakes   string[]          — held dream keepsakes
pendingWatch RestPendingState | null
outcome     RestOutcome | null
```

---

## Engine API

Exported from `src/World/Rest/index.ts`. Key transitions:

```typescript
createRestSession(seed)
chooseRestPosture(state, posture)          // 'deep' | 'doze' | 'watch'
chooseRestOption(state, optionId)          // choose within a watch (hold/fade, feed/hoard)
continueRestWatch(state)                   // advance to the next watch
claimRestOutcome(state)                    // → 'done'
abandonRest(state)
```
