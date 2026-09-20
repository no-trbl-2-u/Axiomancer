# CLAUDE.md

Canonical agent guidance lives in **`AGENTS.md`** and **`VISION.md`** (game
doctrine). This file exists so the load-bearing doctrine is always in context.

## THE STORY IS THE ROAD (THE BLANK PAGE ¶1 lifted, 2026-09-18)

**The story is `content/story/story-overview.md` and nothing else.**
T cleared every prior story law first — *"Remove ALLL law about what the
story is. We're starting from square one with an unidentifieable 'x'
as the first/main character."* — and the overview was then built from
nothing, one event per turn, with T choosing each one.

- **Read the overview before writing anything narrative.** It is the
  ordered list of what happens to the player. It is short and still being
  walked: a beat it does not cover **does not exist yet**.
- **The player is X** — no name, no figure, no identifiers (age,
  gender, body, station, trade, family). `X` is brainstorming
  scaffolding, never shipped text, never a stand-in for a name to be
  picked later.
- **Shipped narrative is not canon.** ~186 dialogue nodes and the 21
  `boy-*` flags are legacy text kept because deleting them would break
  a working build. They are evidence of an old draft's assumptions, not
  of what the story is.
- **Do not invent canon beyond the road.** Need a story fact the overview
  does not carry? Say it does not exist and stop. Do not reconstruct an arc from shipped text,
  restore a removed document, or write a replacement unprompted. This is
  an explicit carve-out from the loop's content-growth mandate; growth in
  cards, enemies, keywords, maps and art is unaffected.
- `docs/narrative/` (style, voice, lexicon) is *craft* law and survives
  untouched. Mechanics are untouched.

Full ruling: `plan/bearings.md` → THE BLANK PAGE (¶1 lifted; ¶2–¶5 stand).
`content/story/README.md` is the superseded record of the clearing — history,
not law. The road is walked further in attended sessions per
`plan/2026-09-17-story-outline.prompt.md`.

## Load-bearing doctrine (THE BIG NUMBERS REWRITE, 2026-09-02)

Source of truth: `plan/2026-09-02-big-numbers-overhaul.prompt.md`. It repealed
roughly thirty-five accumulated design laws and replaced them with three
pillars and three constraints. Nothing older than 2026-09-02 governs combat.

**1. Bigger numbers are a design pillar, not a drift.** T's direction: *"I want
to see bigger numbers."* A starter hit is 6–9; a mid-rank hit is 20–30; a
Saint-rank finisher is 45–70 flat, or past 100 when a scaler is fed; a boss has
hundreds of VITAE and the impossible fight has thousands. Payoffs (RUPTURE,
REAP, CONDEMN, ◆-dumps, Soul-dumps) are uncapped and should reach 100–300 in a
fed deck. The full ladder — per-rank damage/GUARD/BARRIER/DoT/HEAL bands, the
VITAE formulas, the threat budget — is §5 of the overhaul prompt and is the
reference for every new number. This is not about difficulty. It is about every
play visibly moving something. When a tuning run says the numbers are too big,
the answer is to buff the neighbours, not to shrink the card.

**2. Only three constraints survive.**

- **The 5/5/5 aspect thirds.** Every preset deck splits into exact thirds by
  `philosophicalAspect` (body/mind/heart). Deck sizes are open; the thirds are
  not. Enforced at `src/Combat/combat.starter-deck-presets.ts` and
  `src/Combat/e2e/deck-presets.engine.test.ts`.
- **Every card has a FREE line.** A card must be playable without a die
  (`Card.free`, `playTopAction`). Existence only — the old sub-rules (budget
  percentage, theme-currency deposit, the draw-kicker clause, the generic-draw
  ban) are released. A FREE line nobody would choose is a design failure, not
  a law violation.
- **One tray roll per threat phase.** `turnTakenThisPhase` closes the
  endTurn→startTurn Conviction farm. It is a bug fix, not a design law, and it
  keeps its test (`src/Combat/e2e/turn-law.engine.test.ts`).

Everything else is open design space.

**3. Direct damage is a first-class verb; nothing governs balance from above.**
DEAL is a real `CardSpecialMechanic` that scales with the read, the colour
match, WRATH and CHAIN like every other verb. Status play, direct damage, the
walls, and the alt-wins (Befriend, RELENT via PLEA, CONDEMN via CHARGE) compete
on merit — none of them is the intended path and none is protected. There is
**no governing objective function any more**: no win-rate curve, no CQI, no
rank bands, no count pins, no status-engagement floor. The sims keep bug
detectors (a printed number that isn't the applied number, a keyword with no
popup, a card that can never be played) and a wide sanity envelope; they do not
grade the game against a shape. A test that fails when the game is *wrong* is
a guard; a test that fails when the game is *different* is a repealed law.

Hazard-Pattern Combat remains the ONLY combat engine (witness:
`simulateHazardPatternCombat`), LIVE in mobile map encounters, with the enemy's
sole bar VITAE and `isDefeated(enemy)` the main win condition. Engine constants
are tuned manually; **`/deck-tuning`** forges the card pool and
**`/combat-playtest`** runs the stage matrix plus qualitative `playtester`
agents (report only; see `docs/playtest.md`).

Canonical: `VISION.md` → Combat vision. Echoed in `AGENTS.md` and the
`combat-playtest` + `deck-tuning` skills.

## Pointers

- Package guide: `AGENTS.md`
- Game vision & doctrine: `VISION.md`
- Commands: `package.json` (`npm run verify` is the gate)
- Skills / commands / subagents: repo root `.claude/`
