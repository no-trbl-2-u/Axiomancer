# Axiomancer Mechanics Vision

This file preserves T's fundamental wants for Axiomancer as they affect the mechanics engine. Read it before major mechanics proposals, balance tuning, combat work, skill/status work, mercy/friendship work, or alignment work.

## Game identity

Axiomancer is a dark fantasy deckbuilding RPG campaign where mechanics make what you owe, and to whom, consequential.

The engine should support strange, legible, consequential systems over safe RPG imitation.

## Combat vision

Combat must make its interacting systems legible and consequential. Status
effects remain a major authored tool, but T's 2026-08-08 unshackling retired
status dominance as the governing combat objective and restored ordinary direct
damage. Cards may use direct damage, statuses, Conviction, Surge, and Dice in any
combination that preserves the three locked systems rather than making them
ornamental.

**Hazard-Pattern Combat win model (updated 2026-06-22):** the enemy has ONE bar —
HP — and dropping it to 0 is the only win condition. Status is the EFFICIENT path
there: damage-over-time erodes the enemy's HP far faster than the deliberately
weak immediate "basic" strike, and control status genuinely HINDERS the enemy (a
stun/skip robs it of its telegraphed turn) instead of filling a separate meter.
Befriend at low HP opens the spare/exploit mercy choice. This REPLACES the earlier
two-Pressure-Track model (DoT Erosion + Control Saturation as the only win
conditions), which has been removed. Status effects remain available and should be satisfying,
but they are not required to dominate direct-damage paths.

The intended mastery path is:

1. read the enemy;
2. generate and manage resources;
3. use skills;
4. apply and exploit status effects;
5. resolve through victory, mercy, or other consequence.

The player may win through direct damage, statuses, mercy, or another authored
consequence. No one path is doctrine-mandated as the dominant combat route.

**Doctrine (load-bearing, set 2026-07-09; refined 2026-07-10): the FREE line
builds the engine.** A card's free (dieless) line must never be a dead play or
a weaker copy of the paid line. Refined by owner ratification 2026-07-10
(engagement-audit session): the FREE line must deposit THEME currency
(Premises, Souls, pips, DoT seeds, rapport, loop advancement) — a
weak-enough deposit may additionally carry a `DRAW 1`-class utility kicker,
but generic utility ALONE no longer qualifies, and FREE damage (incl. TICK,
now retired registry-wide) never does. Small is fine; filler is not.
Test: after a free play, is the player closer to their deck's win condition?
(Owner directives 2026-07-09 + 2026-07-10; enforcement = the EA-5 library
pass + FREE-currency lint, `plan/tuning/2026-07-10-turn-texture.md` §1.)

Balance should prove AGGRESSIVE, DEFENSIVE, MIXED, and STRATEGIST play styles. STRATEGIST — skill/status/resource planning — is the witness for the intended mastery path.

**Historical calibration charter (2026-07-08; superseded 2026-08-08):** the
former ten theme presets used this blind-policy-pick target curve:

| Stage | Target win rate |
|---|---|
| Early | ~80% |
| Mid | ~50% |
| Late | ~25-35% |
| Impossible | 0% (a hard wall, not a rare fluke win) |

The Profane Canon retired those ten presets and replaced them with three campaign
snapshots. Preserve this curve as historical evidence only; do not grade the
current snapshots against it. Spec 35's Combat Quality Index grades how a fight
played, not campaign viability. A replacement viability/calibration charter for
the three snapshots remains an explicit design decision rather than something
workers may infer from the old bands.

## Defend vision

The player should use defend only when:

- they fear a large attack is coming;
- they want to generate resource;
- they want to befriend an enemy.

Defend should not be an always-correct bunker action.

## Friendship / mercy vision

Befriending should be difficult. It should come with consequences.

Befriending should:

- heavily influence philosophical alignment;
- unlock content that can only occur when befriending certain boss encounters;
- change future world, faction, boss, or region state where appropriate.

Current mechanics doctrine:

- keep the HP gate;
- Befriend is a heart-based skill;
- every player starts with Befriend;
- Befriend requires 5 heart tokens to attempt;
- successful Befriend opens a choice:
  - spare / befriend / preserve the enemy;
  - exploit the opening for a free guaranteed critical hit.

Anti-exploit doctrine:

- If the player uses Befriend to exploit/crit an elite or miniboss, that region's boss will not gather friendship counters at all.
- If the player befriends and spares the elite or miniboss, that region's boss starts battle with `open-minded`.
- `open-minded` may be a status effect that does nothing except count as a qualifying status for befriending enemies.
- Befriending a boss in one region should cost reputation with one faction and gain reputation with another.

Possible later rules to note, not implement by default:

- status effects modifying Befriend cost or success;
- alignment changing Befriend copy, cost, or consequences;
- boss-specific Befriend rites;
- failed Befriend attempts consuming or refunding heart;
- exploit/free-critical choice closing future mercy paths;
- different rewards for spare versus exploit outcomes.

## Worker law

If a mechanics change makes brute attacking, pure turtling, or consequence-free mercy the dominant path, it is suspect. If a local phase conflicts with this file, stop and reconcile before implementation.
