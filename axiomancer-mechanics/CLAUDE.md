# CLAUDE.md

Canonical agent guidance lives in **`AGENTS.md`** and **`VISION.md`** (game
doctrine). This file exists so the load-bearing doctrine is always in context.

## Load-bearing doctrine (set 2026-06)

**Status effects are the MAIN fun and the most engaging aspect of combat encounters.**

Every balance decision, tuning run, content addition, and skill/effect design is
judged first by: *does this make applying and exploiting status effects more
central and more satisfying?* If a change makes basic-attack trading more
attractive than status-effect play, it works against the vision. Treat low
status-effect engagement as a balance failure even when win/loss rates look
healthy.

**Hazard-Pattern Combat (the primary combat system)** keeps status central: the
enemy's SOLE bar is HP, and status is the EFFICIENT way to drop it to 0 — DoT
erodes HP far faster than the deliberately weak basic strike, and control hinders
the enemy (it loses its telegraphed turn). **Updated 2026-06-22:** the old
two-Pressure-Track win model (DoT Erosion + Control Saturation as the only win
conditions) was REMOVED; HP is the sole win condition now (`isDefeated(enemy)`),
basic-attack trading is the weak baseline rather than absent. Tuned by
**`/combat-tuning`** (witness: `simulateHazardPatternCombat`). The new combat is LIVE in mobile map encounters;
the legacy turn-based `resolveCombatRound` now backs only the dev-only legacy
combat tab and is tuned by **`/legacy-combat-tuning`** (STRATEGIST witness).
Alongside `/combat-tuning`: **`/deck-tuning`** forges the card pool
(sandbox-first card/deck A/Bs, promotion into the library) and
**`/combat-playtest`** runs the stage matrix plus qualitative `playtester`
agents (report only; see `docs/playtest.md`).

Canonical: `VISION.md` → Combat vision. Echoed in `AGENTS.md`, the
`combat-tuning` + `legacy-combat-tuning` skills, and the `balance-analyst`
agent (legacy loop).

## Pointers

- Package guide: `AGENTS.md`
- Game vision & doctrine: `VISION.md`
- Commands: `package.json` (`npm run verify` is the gate)
- Skills / commands / subagents: repo root `.claude/`
