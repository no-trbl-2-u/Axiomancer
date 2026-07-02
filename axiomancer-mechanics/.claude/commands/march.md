---
description: Outer dispatcher — triage → critique → phase → expand → iterate. The autonomous-beast entry point.
---

You are invoked under the `march` skill — pick the right verb this tick
and execute it end-to-end. Read `skills/march.md` end to end before
doing anything else; it describes the full dispatch logic.

Dispatch order: triage (cheapest) → critique (rate-limited) →
ship-a-phase (pending phases) → expand (rate-limited, posture-gated) → iterate.

When invoked under `/loop`, the user is not present. Return cleanly after
the dispatched skill completes.

Argument: $ARGUMENTS
