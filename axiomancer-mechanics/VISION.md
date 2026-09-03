# Miserere Mei, Deus — Mechanics Vision

This file preserves T's fundamental wants for Miserere Mei, Deus as they affect the mechanics engine. Read it before major mechanics proposals, balance tuning, combat work, skill/status work, mercy/friendship work, or alignment work.

## Game identity

Miserere Mei, Deus is a dark fantasy deckbuilding RPG campaign where mechanics make what you owe, and to whom, consequential.

The engine should support strange, legible, consequential systems over safe RPG imitation.

## Combat vision

Combat must make its interacting systems legible and consequential, and it must
do it **loudly**. THE BIG NUMBERS REWRITE (2026-09-02,
`plan/2026-09-02-big-numbers-overhaul.prompt.md`) is the current charter; it
repealed the accumulated design laws and left three pillars.

**Bigger numbers are the point.** A starter hit is 6–9, a mid-rank hit 20–30, a
Saint-rank finisher 45–70 flat or past 100 when a scaler is fed; bosses carry
hundreds of VITAE and the impossible fight carries thousands. Payoffs are
uncapped. Every card play should visibly *move* something. The scale ladder in
§5 of the overhaul prompt is the reference for any new number.

**Hazard-Pattern Combat win model:** the enemy has ONE bar — VITAE — and
dropping it to 0 is the main win condition, alongside the authored alt-wins
(Befriend, RELENT, CONDEMN). Direct damage is a first-class verb: DEAL scales
with the read, the colour match, and the combat-long scalers exactly as the
status verbs do. Damage-over-time, walls-and-reprisal, control, harvest, and
mercy are **competing** lines, not a hierarchy — none of them is the intended
path and none is protected. This model REPLACES the two-Pressure-Track design
(removed 2026-06-22) and the status-primacy doctrine that followed it
(repealed 2026-09-02).

The intended mastery path is:

1. read the enemy;
2. generate and manage resources;
3. use skills;
4. commit to a line and make it land big;
5. resolve through victory, mercy, or other consequence.

**Every card has a FREE line.** A card must be playable without a die. That is
the whole rule: the earlier sub-rules about currency deposits, budget shares,
and which verbs a FREE line was allowed to use are repealed. A FREE line
nobody would ever choose is still a design failure — dead cards are bugs — but
it is a failure to be fixed by making the line better, not by a lint.

**Enemies escalate and telegraph big.** An enemy is a creature with keywords
(HIDE, SWIFT, BRUTAL, VENOM, UNSHAKEN, ELUSIVE, REGROW, RAVENOUS, WOUNDING),
its own VITAE pool, a tiered deck that never reshuffles backwards, and — for
bosses and uniques — stages that change the fight mid-fight. A telegraph prints
a digit, not an adjective.

**Nothing grades combat from above.** There is no win-rate curve, no Combat
Quality Index, no rank band, no status-engagement floor, and no count pin.
Balance work keeps bug detectors (printed number ≠ applied number; a keyword
with no popup; a card that can never be played) and a wide sanity envelope, and
answers a dominance finding by buffing the neighbours rather than shrinking the
card. Balance should still prove AGGRESSIVE, DEFENSIVE, MIXED, and STRATEGIST
play styles — that is a coverage question, not a target curve.

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
