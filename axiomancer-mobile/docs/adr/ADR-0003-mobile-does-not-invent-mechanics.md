# ADR-0003 — Mobile does not invent mechanics

Status: Accepted  
Date: 2026-06-01  
Scope: axiomancer-mobile

## Decision

Mobile must not invent or approximate mechanics when engine truth is required. If the engine lacks an API, mobile should wait for or request engine support rather than fabricate gameplay math.

## Context

The level-up derived-stat preview exposed the danger of local approximation. T wants cross-stat effects to be real but engine-authoritative.

## Consequences

- Derived stat previews must use engine APIs such as `previewStatAllocation`.
- Event minigame mechanics should land in mechanics/CLI before final mobile UI.
- Mobile may build temporary scaffolding only when clearly marked as scaffolding.
- Any local approximation must be explicitly temporary and removed when engine truth arrives.

## Links

- Mechanics Phase 97 — `previewStatAllocation`
- Mobile candidate — Cross-stat effects on level-up
