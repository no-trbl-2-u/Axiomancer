# Revamp — the Labyrinth (The Aporia)

> Part plan of [THE REVAMP](README.md). Door sealed in **R3**; re-theme is
> **B9** (owner). Decision D54. Status: PROPOSED.

## Where things stand

- ~2.4k engine LOC (`World/Labyrinth/`), ~550 CLI, ~2.5k mobile, 884 KB art.
- Entered at the Lantern Deep's vault door `ld-15` (D24, Phase M4 —
  `LabyrinthGate`, `returnWorld`).
- Built on retired doctrine: fallacy-themed realms, the Sophist's naming
  rite finale, and **Borrowed Premise** debt — settled at the Fourth Ledger
  for 30 per point (`labyrinth.engine.ts:32`); `borrowedPremiseStacks` is
  read only by the presenter and CLI, so the debt buys nothing, though the
  finale claims "your purchased certainty fights for the house"
  (mobile `labyrinth.engine.ts:93`).
- R2 retires every labyrinth foe (the Doorwarden survives as the Act 1 boss
  stand-in; the Sophist and the rest go).

## R3 — Seal the door (loop)

T, 2026-09-28: close the door, keep the code parked.

1. `ld-15` shows the vault door as **sealed** (existing event copy reused or
   a one-line status, no new prose); `LabyrinthGate` never opens.
2. The Labyrinth module, CLI and mobile screens stay in the tree untouched;
   the dev-menu entry is removed or hidden behind the dev build flag.
3. Its tests keep running unless they depend on retired foes; those are
   skipped with a `parked (D54)` reason, not deleted.
4. Save migration: a save inside the Labyrinth returns to `ld-15`.

## B9 — Re-theme (owner, later)

Re-theme without fallacies or premise debt; decide whether the Borrowed
Premise economy returns with a real effect or goes. Needs B2's roster.
