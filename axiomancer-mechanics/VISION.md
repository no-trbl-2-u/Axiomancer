# Axiomancer Mechanics Vision

This file preserves T's fundamental wants for Axiomancer as they affect the mechanics engine. Read it before major mechanics proposals, balance tuning, combat work, skill/status work, mercy/friendship work, alignment work, or `/march` phase execution.

## Game identity

Axiomancer is an experimental philosophy RPG where mechanics make worldview consequential.

The engine should support strange, legible, consequential systems over safe RPG imitation.

## Combat vision

Combat is fundamentally status-effect-centered.

**Doctrine (load-bearing, set 2026-06):** Status effects are the MAIN fun and
the most engaging aspect of combat encounters. Every balance decision, tuning run, content
addition, and skill/effect design is judged first by "does this make applying
and exploiting status effects more central and more satisfying?" If a change
makes basic-attack trading more attractive than status-effect play, it works
against the vision. Both balance loops must treat low status-effect engagement
as a balance failure even when win/loss rates look healthy: the
`legacy-combat-tuning` loop + the `balance-analyst` for the turn-based combat,
and the `combat-tuning` loop for the Hazard-Pattern Combat.

**Hazard-Pattern Combat win model (updated 2026-06-22):** the enemy has ONE bar —
HP — and dropping it to 0 is the only win condition. Status is the EFFICIENT path
there: damage-over-time erodes the enemy's HP far faster than the deliberately
weak immediate "basic" strike, and control status genuinely HINDERS the enemy (a
stun/skip robs it of its telegraphed turn) instead of filling a separate meter.
Befriend at low HP opens the spare/exploit mercy choice. This REPLACES the earlier
two-Pressure-Track model (DoT Erosion + Control Saturation as the only win
conditions), which has been removed — but status effects remain the main fun and
the intended efficient win path; a player who leans on basic strikes should
struggle, especially against bosses.

The intended mastery path is:

1. read the enemy;
2. generate and manage resources;
3. use skills;
4. apply and exploit status effects;
5. resolve through victory, mercy, or other consequence.

The player may sometimes win by attacking over and over. The player may sometimes win through friendliness. But if the player is not utilizing skills and planning status effects, the game should be more difficult for them.

Balance should prove AGGRESSIVE, DEFENSIVE, MIXED, and STRATEGIST play styles. STRATEGIST — skill/status/resource planning — is the witness for the intended mastery path.

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
