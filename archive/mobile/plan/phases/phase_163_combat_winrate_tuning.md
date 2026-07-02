# Phase 163 — Combat win-rate saturation tuning (mechanics-owned)

Filed 2026-06-28 (T direct steering). **OWNER: `axiomancer-mechanics` (cross-repo). NOT mobile-loop-actionable.**

## Context
The 0.34.0 sim (`simulateHazardPatternCombat`, 300 runs/seed) shows **100% win rate** across greedy/blind policies. This is PRE-EXISTING saturation — pure-strike is also 100%, and the witness bot grinds via shared Signatures — NOT introduced by the status-depth epic. Long-flagged (memory `card-system-audit-and-npm-gate`: 100%-win / zero failure pressure).

## Scope (engine)
A `/combat-tuning` pass to introduce real failure pressure WITHOUT breaking the status-central doctrine (VISION.md). Root causes: full-hand redraw every phase, unlimited NEW TURN, and the enemy acting only on END PHASE. Tune via the sim witness; keep the suite green; keep status engagement ≥ the basic-attack baseline.

## Verification
mechanics `npm run verify` green; sim shows a real win/loss gap (not 100%); status engagement stays central. Publish a patch/minor when done; mobile picks it up via a dep bump.
