# Phase 162 — Surface the 0.34.0 build-around cards in play

Filed 2026-06-28 (T direct steering).

## Context
mechanics 0.34.0 ships 7 new build-around cards + Pyrrhic Victory (execute), and mobile lights their keywords up honestly (commit `ffc8c8f`). But they live only in `COMBAT_REWARD_POOL`, so a player rarely encounters them — the new mechanical depth is effectively invisible in normal play.

## Scope
- Make the new cards reachable: include the relevant ones in the starter bundles (`state/combat/store-actions.ts` `STARTER_BUNDLES`) and/or weight them in the per-archetype reward skew — bleeder sees Resonance Rupture / Breach, guardian sees Gabriel's Bulwark / Briar Riposte, controller sees Mounting Contradictions, etc.
- Engine stays the source of truth (cards come from `skillLibrary` / the reward pool; mobile is selection/presentation only).
- **Playtest/visual witness:** a hermetic e2e (or `combat-shots`) showing a player drafting + playing Breach then Resonance Rupture and the VULNERABLE / RUPTURE keywords lighting up honestly on the card face.

## Files
`state/combat/store-actions.ts` (bundles + skew), the reward presenter, an e2e under `state/e2e/` or `scripts/`.

## Verification
store-actions + reward-presenter tests + a reachable-cards e2e + `npm run typecheck` + `npm test`.
