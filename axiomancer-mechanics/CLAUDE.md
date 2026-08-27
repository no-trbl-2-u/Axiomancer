# CLAUDE.md

<!-- lexicon-ok: base-power, chip-hp, concede, sway, capitulate -->

Canonical agent guidance lives in **`AGENTS.md`** and **`VISION.md`** (game
doctrine). This file exists so the load-bearing doctrine is always in context.

## Load-bearing doctrine (set 2026-06; unshackled 2026-08-08)

**Status effects remain a major authored tool — they are no longer the
governing combat objective.**

T's 2026-08-08 unshackling retired status dominance and restored ordinary
direct damage. Every balance decision, tuning run, content addition, and
card/effect design is judged first by CQI (`specs/35-objective-function-v2.md`):
*does the deck's own engine run — assembling across turns (ARC), leaving more
than one live line at each powering die (WIDTH), with a lead card that carries
the kill without becoming the whole deck (IDENTITY), all of it flowing through
Conviction, the Surge meter and the Dice (SPINE)?* Status play should stay
satisfying and central to what the library offers, but a low status-engagement
reading is a diagnosis to explain, not a balance failure by itself.

**Hazard-Pattern Combat (the primary combat system):** the enemy's SOLE
bar is HP. **Updated 2026-08-08 (THE UNSHACKLING + the Profane Canon)
and 2026-08-22 (THE PIPELINE LIBERATION):** direct damage is LEGAL —
status play, damage, and the alt-wins (Befriend, CAPITULATE via SWAY,
CONCEDE) compete on CQI merit (`specs/35-objective-function-v2.md`).
The historical `basePower`/`chipHp` fields stay deleted; a card needing
raw HP damage authors its own field/verb through the full wiring
checklist. The library is the 57-card Profane Canon
(`docs/profane-canon.md`: 8 starters, 3 relics, 4 curses, six 7-card
archetype packages) with a GROWABLE keyword registry (atlas row + full
wiring per addition); presets are the threadbare/pilgrim/apostate stage
ladder. HP remains the main win condition (`isDefeated(enemy)`);
Hazard-Pattern Combat is the ONLY combat engine (witness:
`simulateHazardPatternCombat`), LIVE in mobile map encounters. Engine
constants are tuned manually; **`/deck-tuning`** forges the card pool
(full card authority; sandbox A/Bs recommended) and
**`/combat-playtest`** runs the stage matrix plus qualitative
`playtester` agents (report only; see `docs/playtest.md`).

Canonical: `VISION.md` → Combat vision. Echoed in `AGENTS.md` and the
`combat-playtest` + `deck-tuning` skills.

## Load-bearing doctrine (set 2026-07-08)

**Starter preset decks must adhere to this win-rate curve** (blind
policy-pick): early ~80%, mid ~50%, late ~25-35%, impossible 0%. Authored
for the retired ten-theme presets; it maps onto the Profane Canon's
stage ladder (threadbare early / pilgrim mid / apostate late) as each
rung hitting its own stage's band — a rung overperforming far above its
stage is a dominance finding, not a success. CQI (spec 35) is the
overall objective function; this curve is the win-rate leg of
`/deck-tuning`'s balance-band work on the starter library.

Canonical: `VISION.md` → Combat vision. Correction history:
`plan/tuning/2026-07-08-win-path-scaling.md`.

## Pointers

- Package guide: `AGENTS.md`
- Game vision & doctrine: `VISION.md`
- Commands: `package.json` (`npm run verify` is the gate)
- Skills / commands / subagents: repo root `.claude/`
