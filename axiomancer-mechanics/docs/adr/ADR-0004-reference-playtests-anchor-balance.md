# ADR-0004 — Reference playtests anchor balance

Status: Accepted  
Date: 2026-06-01  
Scope: axiomancer-mechanics

## Decision

Balance judgment should be anchored by reproducible early-game and endgame reference playtests, not ad-hoc manual impressions alone.

## Context

Manual playthrough evidence found difficulty all over the place and late-game Coastal Tyrant evidence showed severe timeout. Without reference witnesses, balance work drifts into opinion.

## Consequences

- Maintain canonical early-game and endgame playtest fixtures.
- Reports should include outcome rates, survivability, rounds-to-resolve, and damage dealt/taken bands.
- Tuning phases should cite reference playtest evidence.
- Manual playthroughs remain valuable field evidence but should feed reproducible harnesses when possible.
- Phase candidates that assert a balance or scaling problem must be checked against the reference playtests before promotion. At oversight 2026-06-06, expand-33 filed three combat-scaling candidates on an intermediate "level 15+ uncalibrateable / ~2300 HP / 0% win" impression that the Phase 121 closeout ledger and a live anchor re-run both contradicted (Normal L15 92% wins, Difficult L18 32% wins, in-band); all three were rejected. Verify against the witnesses, do not promote from impression.

## Links

- Phase 104 — Reference playtests: early-game + endgame
- Phase 121 — Three-anchor playtest balance scaffold (Easy/Normal/Difficult anchors)
