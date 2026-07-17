# Phase D1 — Upgradeable-Dice spec review-and-land

> Agent-facing brief. **Thinking/review gate — ships NO engine code.**
> Its whole job is to make `specs/33-upgradeable-dice.md` safe to build
> against: a mechanics-expert doctrine review, the spec's own §9 open
> items settled, and the supersession collisions with already-shipped /
> pending phases reconciled. Output is edits to the spec + this brief's
> decision log, not app code. D2 (engine core) does not start until this
> lands. **D1 is safe to run live; D2+ touch the engine — pause the
> `/march` + night crons before them** (collision discipline).

## Inputs (read in this order)

1. `axiomancer-mechanics/specs/33-upgradeable-dice.md` — the CDR under
   review (win over bearings on conflict).
2. `axiomancer-mechanics/braindump/2026-07-17-upgradeable-dice-combat.md`
   — the owner-locked decisions + prior art, for intent.
3. `axiomancer-mechanics/CLAUDE.md` + `VISION.md` — load-bearing doctrine
   (status is the main fun; the strike is dead; the 80/50/25-35/0 starter
   curve; dice honesty 2026-07-09).
4. `plan/phases/phase_31_the_roll_and_the_read.md` +
   `plan/HANDOFF-2026-07-09-dice-law-rework.md` — the surfaces spec 33
   supersedes; read before deciding their fate.
5. `plan/PHASE_CANDIDATES.md` → the Fate Engine P2/P3 candidates +
   Phase 33c/33d rows in `plan/steps/01_build_plan.md` — the overlaps.

## The review (mechanics-expert pass)

Spawn the `mechanics-expert` agent against spec 33. It must return a
structured verdict on:

- **Status-centrality** — does "every usable die may power a paid line"
  (~1.83 plays/round) still make status the fun path, or does it re-open
  a basic-trade attractor? The strike is dead at the schema level — hold
  that line.
- **Win curve** — is the leaner ◆ economy (§5) compatible with
  80/50/25-35/0 on the starter presets, or does it need the D4 repricing
  ratified before D2 can be trusted?
- **Dice honesty** — confirm §4's valves (FREE lines + 1◆ Press Fate +
  one dice-interaction card/theme) carry the 8.3% whiff WITHOUT any
  rigged roll or pity floor.
- **Pool-law integrity** — the fixed-4 + bounded exceptions + 7-object
  ceiling: are the exceptions (KINDLE / surge / Reserve / gold+lead)
  actually bounded, or can they stack past the ceiling?

## Settle the spec's §9 open items

| # | Item | What D1 must produce |
|---|---|---|
| 1 | Momentum rule-3 "reset-and-restart" reading (§3) | Confirm or correct: does a wrong-color paid card immediately restart momentum on its own color, or reset to null? Owner-call if ambiguous. |
| 2 | Color↔stance mapping (§1: R↔Body, B↔Mind, P↔Heart) | Confirm the cosmetic default or record the owner's choice. |
| 3 | HONE / TEMPER final keyword names (§6) | Lock the real keyword strings (or confirm the working names) for the atlas + `state/combat/keywords.ts`. |
| 4 | ◆-sink repricing ownership (§5) | Confirm the exact table is *derived in D3, ratified in D7* — D1 only fixes the targets, does not invent numbers. |
| 5 | Prior-art receipts (Astrea / Dicey Dungeons / Slice & Dice / Quarriors / Elder Sign) | Re-cite from `kb/` if the scout has covered the filed wishes; otherwise note still-remembered and leave the wishes open. |

## Reconcile the supersession collisions (the load-bearing part)

Spec 33 rewrites surfaces other phases already own. For EACH, decide
keep / retire / re-scope and write it into this brief + the superseded
doc, so a D2 worker never builds against a retired surface:

- **2026-07-09 dice-law** (3 dice, draft 1, shared face-bag) — spec 33 §1
  supersedes. Confirm retirement; note the `HANDOFF` doc is historical.
- **Phase 31 — The Roll and the Read** (SHIPPED: momentum wheel
  engine-native, the hidden-stance read). Spec 33 §2–§3 retire the RPS
  read and absorb the wheel into the stance chain. Decide what of Phase
  31's engine survives vs. gets reworked in D2 — this is real shipped
  code, not a candidate.
- **Phase 33c — THE COVETED DIE** (pending) + **33d — GLYPHS pilot**
  (pending). Do they still make sense atop the four-die model, or fold
  into / retire against the D-batch? Decide before they promote.
- **Fate Engine P2/P3** (`PHASE_CANDIDATES.md`) — the candidate note flags
  scope overlap. Reconcile: retire, or re-scope to the non-dice remainder.

## Decisions made upfront — DO NOT ASK

- The nine owner-locked decisions (braindump "Decided" list + spec
  `[owner-locked]` tags) are settled — do NOT re-litigate Gold=wild,
  tokens=Conviction, stance-from-cards, strict persistent momentum,
  fixed-4 pool, miss=0◆, subsystems-reinterpret.
- The "Upgradeable Dice" framing is settled (2026-07-17 follow-up): dice
  are permanent, faces mutate, NO equip/unequip — do not reintroduce
  "equipment/loadout/inventory" language.

## Surface as `[needs-user-call]` (do NOT guess)

- Any §9 item the spec marks owner-cosmetic where the mechanics-expert
  finds a mechanical consequence (esp. #2 mapping if a stance-check
  distribution depends on it).
- The Phase 31 keep/retire boundary if it means discarding shipped engine
  behavior.
- Final HONE/TEMPER names if the owner has a naming preference.

## Prove (DoD)

- Mechanics-expert verdict captured (in this brief or a dated
  `plan/tuning/` note), with any spec edits applied.
- Every §9 item resolved or explicitly deferred to its named later phase.
- Every collision row above has a keep/retire/re-scope decision written
  into this brief AND the superseded doc.
- No engine/app code touched (`git diff` is docs/plan/spec only).
- Flip Phase D1's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append
  the commit hash, add to the Phase log.

## Follow-ups (out of scope this phase)

- D2 engine core (flagged) — blocked on this brief's collision decisions.
- The kb wishes for the five dice-builder games — re-cite when the scout
  lands them; not blocking D2.
