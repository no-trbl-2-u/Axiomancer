# Documentation — Axiomancer Mobile

> This directory contains design notes, architectural decisions, and
> technical guidance for Axiomancer Mobile development.

## Quick reference

| File | Purpose | Priority |
|------|---------|----------|
| [`testing.md`](./testing.md) | Hermetic E2E testing standard | **ESSENTIAL** |
| [`presenters.md`](./presenters.md) | Presenter layer contract and patterns | **ESSENTIAL** |
| [`state.md`](./state.md) | State management and store architecture | **HELPFUL** |
| [`adr/`](./adr/) | Architectural Decision Records | **REFERENCE** |

## Core testing documentation

| File | Coverage | Priority |
|------|----------|----------|
| [`testing.md`](./testing.md) | Hermetic E2E testing standard | **ESSENTIAL** |
| [`testing-guide.md`](./testing-guide.md) | Extended testing guidance and patterns | **HELPFUL** |
| [`E2E_INVENTORY.md`](./E2E_INVENTORY.md) | Complete E2E test suite catalog | **REFERENCE** |

## Engine integration and upgrades

| File | Coverage | Priority |
|------|----------|----------|
| [`engine-upgrade-0.15.1-to-0.16.0.md`](./engine-upgrade-0.15.1-to-0.16.0.md) | Latest upgrade to 0.16.0 | **HELPFUL** |
| [`engine-team-handoff-2026-05-16.md`](./engine-team-handoff-2026-05-16.md) | Engine team transition documentation | **HELPFUL** |
| [`engine-map-reconciliation-2026-05-24.md`](./engine-map-reconciliation-2026-05-24.md) | Map system reconciliation notes | **HELPFUL** |
| [`engine-upgrade-0.7.0-to-0.10.0.md`](./engine-upgrade-0.7.0-to-0.10.0.md) | Early major upgrade guide | **REFERENCE** |
| [`engine-upgrade-0.10.0-to-0.10.2.md`](./engine-upgrade-0.10.0-to-0.10.2.md) | Patch upgrade documentation | **REFERENCE** |
| [`engine-upgrade-0.14.0-to-0.15.0.md`](./engine-upgrade-0.14.0-to-0.15.0.md) | Major version upgrade guide | **REFERENCE** |
| [`engine-upgrade-0.15.0-to-0.15.1.md`](./engine-upgrade-0.15.0-to-0.15.1.md) | Minor version upgrade guide | **REFERENCE** |
| [`mechanics-upgrade-0.14.0.md`](./mechanics-upgrade-0.14.0.md) | Mechanics engine upgrade notes | **REFERENCE** |

## UI audit documentation

| File | Screen Coverage | Priority |
|------|-----------------|----------|
| [`mechanics-ui-audit-2026-05-21-combat.md`](./mechanics-ui-audit-2026-05-21-combat.md) | Combat screen UI audit | **REFERENCE** |
| [`mechanics-ui-audit-2026-05-22-character.md`](./mechanics-ui-audit-2026-05-22-character.md) | Character screen UI audit | **REFERENCE** |
| [`mechanics-ui-audit-2026-05-22-event.md`](./mechanics-ui-audit-2026-05-22-event.md) | Event handling UI audit | **REFERENCE** |
| [`mechanics-ui-audit-2026-05-22-exploration.md`](./mechanics-ui-audit-2026-05-22-exploration.md) | Exploration screen UI audit | **REFERENCE** |
| [`mechanics-ui-audit-2026-05-22-inventory.md`](./mechanics-ui-audit-2026-05-22-inventory.md) | Inventory screen UI audit | **REFERENCE** |
| [`mechanics-ui-audit-2026-05-22-memoir.md`](./mechanics-ui-audit-2026-05-22-memoir.md) | Memoir screen UI audit | **REFERENCE** |
| [`mechanics-ui-audit-2026-05-25-combat-modal.md`](./mechanics-ui-audit-2026-05-25-combat-modal.md) | Combat modal UI audit | **REFERENCE** |

## Hazard minigame documentation

| File | Coverage | Priority |
|------|----------|----------|
| [`hazard-balance-recommendations.md`](./hazard-balance-recommendations.md) | Game balance tuning recommendations | **REFERENCE** |
| [`hazard-card-expansion-2026-06-11-spec.md`](./hazard-card-expansion-2026-06-11-spec.md) | Card expansion specification | **REFERENCE** |
| [`hazard-playtest-2026-06-10-spec.md`](./hazard-playtest-2026-06-10-spec.md) | Playtest specification and results | **REFERENCE** |
| [`hazard-v2-vs-mechanics-divergence.md`](./hazard-v2-vs-mechanics-divergence.md) | Version differences and reconciliation | **REFERENCE** |

## Design and UX documentation

| File | Coverage | Priority |
|------|----------|----------|
| [`combat.md`](./combat.md) | Combat system design documentation | **HELPFUL** |
| [`early-combat-ux.md`](./early-combat-ux.md) | Combat UX evolution and design decisions | **REFERENCE** |
| [`claude-design-prompt-2026-05-16.md`](./claude-design-prompt-2026-05-16.md) | Design handoff documentation and prompts | **REFERENCE** |

## Architecture Decision Records (ADRs)

The [`adr/`](./adr/) folder contains durable mobile architecture and
product decisions. Each ADR documents a significant architectural choice:

| File | Decision Topic | Priority |
|------|---------------|----------|
| [`adr/ADR-0001-engine-truth-and-presenter-boundary.md`](./adr/ADR-0001-engine-truth-and-presenter-boundary.md) | Engine as source of truth, presenter patterns | **ESSENTIAL** |
| [`adr/ADR-0003-mobile-does-not-invent-mechanics.md`](./adr/ADR-0003-mobile-does-not-invent-mechanics.md) | Engine authority over game mechanics | **ESSENTIAL** |
| [`adr/ADR-0002-visual-baselines-are-committed-evidence.md`](./adr/ADR-0002-visual-baselines-are-committed-evidence.md) | Visual regression testing approach | **HELPFUL** |
| [`adr/ADR-0006-nexus-state-reconciliation-precedes-ui-polish.md`](./adr/ADR-0006-nexus-state-reconciliation-precedes-ui-polish.md) | Development priority guidance | **HELPFUL** |
| [`adr/ADR-0004-combat-terminology-prefers-player-language.md`](./adr/ADR-0004-combat-terminology-prefers-player-language.md) | Combat UI terminology decisions | **REFERENCE** |
| [`adr/ADR-0005-reference-screenshots-and-generated-smoke-baselines-are-distinct.md`](./adr/ADR-0005-reference-screenshots-and-generated-smoke-baselines-are-distinct.md) | Testing baseline methodology | **REFERENCE** |
| [`adr/ADR-0007-befriend-mercy-choice-modal.md`](./adr/ADR-0007-befriend-mercy-choice-modal.md) | Combat mercy choice interaction | **REFERENCE** |

See [`adr/README.md`](./adr/README.md) for ADR process and templates.

## Development workflow guides

| File | Coverage | Priority |
|------|----------|----------|
| [`source-of-truth-hierarchy.md`](./source-of-truth-hierarchy.md) | Decision-making authority and conflict resolution | **ESSENTIAL** |
| [`store-submission-checklist.md`](./store-submission-checklist.md) | App store submission process and requirements | **REFERENCE** |

## AI assistance and templates

| File | Coverage | Priority |
|------|----------|----------|
| [`prompts/onboarding-interview.prompt.md`](./prompts/onboarding-interview.prompt.md) | AI-assist onboarding interview template | **REFERENCE** |

## Navigation

For the complete project structure and quick start guide, see the
[main README](../README.md). For planning and build process
documentation, see [`plan/`](../plan/).