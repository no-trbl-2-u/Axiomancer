# Phase 113 — Stance/Vitae playtest evidence + STRATEGIST witness

## Source

Glanton cleanup after SomberSoft doctrine alignment audit `~/Workspace/reports/audits/2026-06-04-sombersoft-doctrine-alignment.md`.

## Problem

Current playtest evidence does not reliably prove the Stance/Vitae loop. Policies can still over-measure defend/stall behavior and under-measure intentional stance choice, Vitae/resource generation and spending, action affordability, and downstream consequences. STRATEGIST is too close to generic best-affordable-skill fallback.

## Scope

1. Add or update playtest policies/scenarios that explicitly exercise:
   - stance choice;
   - Vitae/resource generation;
   - Vitae/resource spending;
   - downstream consequences where available.
2. Strengthen STRATEGIST so it reads enemy state, status effects, combat resources, available skills, stance position, and opportunity windows rather than only picking best affordable skill.
3. Update playtest reports to separate:
   - victories;
   - defeats;
   - resource-driven outcomes;
   - consequence outcomes;
   - timeouts;
   - Stance/Vitae attempts and failures.
4. Normalize docs/report wording to **65–75% resolution success** where the evidence target is resolution, not raw win rate.
5. Add hermetic tests for new policy/report fields.

## Verification

- `npm run verify`
- `npm run playtest`
- Report before/after aggregate metrics in final commit message or phase closeout.

## Out of scope

- Core Stance/Vitae semantics changes. If Phase 112 has not shipped, this phase must either wait or explicitly note which legacy behavior remains.
