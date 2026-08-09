# CLAUDE.md

<!-- lexicon-ok: base-power, chip-hp, concede, sway, capitulate -->

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
enemy's SOLE bar is HP, and status is the ONLY way to drop it to 0.
**Updated 2026-07-08 (spec 32 v3 — THE STRIKE IS DEAD):** raw HP damage was
purged at the schema level (`basePower`/`chipHp` no longer exist on `Card`).
Every point of enemy HP falls to DoT ticks, affliction-payoff bursts
(RUPTURE / REAP), engine-gated drips (BACKFIRE and persistent-card hooks), or
reflect (THORNS / RIPOSTE). Two merciful alt-wins exist beside HP: Befriend
(signatures) and CAPITULATE (SWAY), plus CONCEDE (an 8-Premise Peroration).
The library is 70 cards across 10 self-contained themes with exactly 30
keywords; presets follow the 4/4/2/2/1/1/1 recipe. HP remains the main win
condition (`isDefeated(enemy)`); Hazard-Pattern Combat is the ONLY combat
engine (witness: `simulateHazardPatternCombat`). The combat is LIVE in mobile
map encounters. Engine constants are tuned manually; **`/deck-tuning`** forges the
card pool (sandbox-first card/deck A/Bs, promotion into the library) and
**`/combat-playtest`** runs the stage matrix plus qualitative `playtester`
agents (report only; see `docs/playtest.md`).

Canonical: `VISION.md` → Combat vision. Echoed in `AGENTS.md` and the
`combat-playtest` + `deck-tuning` skills.

## Load-bearing doctrine (set 2026-07-08)

**Starter preset decks must adhere to this win-rate curve** (blind
policy-pick): early ~80%, mid ~50%, late ~25-35%, impossible 0%. The 10 theme
presets are early/mid-game decks by design — the player trades into a new
mid-game deck after the labyrinth (see the preset-deck-tutorial rethink in
`plan/CRITIQUE.md`), so a starter preset overperforming this curve late is a
dominance finding, not a success. This is the objective function for
`/deck-tuning`'s balance-band work on the starter library.

Canonical: `VISION.md` → Combat vision. Correction history:
`plan/tuning/2026-07-08-win-path-scaling.md`.

## Pointers

- Package guide: `AGENTS.md`
- Game vision & doctrine: `VISION.md`
- Commands: `package.json` (`npm run verify` is the gate)
- Skills / commands / subagents: repo root `.claude/`
