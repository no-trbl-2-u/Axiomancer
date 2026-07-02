# Phase 164 — Mechanics divergence self-audit

**Source:** T direct steering 2026-06-23.

## Outcome

Produce a repo-root `divergences.md` that audits where `axiomancer-mechanics` is out of line with the current Axiomancer direction and with `axiomancer-mobile`'s consumed behavior. The file is a working reconciliation ledger: concrete divergences, owning repo, severity, evidence, and proposed next action.

This is an audit phase, not a tuning or redesign phase. Do not fix broad divergences inside this phase unless the fix is tiny, obvious, and necessary to make the audit truthful.

## Source / user decision

T asked for a self-audit phase in both mechanics and mobile so each repo outputs a `divergences.md` file we can use to bring the project back into line. Current known pressure points:

- new Hazard-style combat has replaced legacy combat as the player-facing direction;
- The Kid must test first-level traversal and authored encounter triggers, not only legacy `/combat` or direct debug fights;
- mechanics owns core rules, map content, enemy/event definitions, combat resolution, minigame engines, and game CLI witnesses;
- mobile owns presentation/control glue and should not silently simulate engine rules;
- first-level `fishing-village` truth must be consistent across engine map/event content, CLI walkthroughs, mobile WILDS layout, and encounter-trigger UX.

## Decisions made upfront — do not ask

1. **Output path is repo-root `divergences.md`.** Not `plan/divergences.md`, not a dated report. T wants a reusable alignment file.
2. **Use evidence, not vibes.** Every divergence row must cite file paths, commands, or state/log evidence.
3. **Classify ownership.** Each row must name `mechanics`, `mobile`, `both`, or `T decision` as owner.
4. **Legacy combat is suspect by default.** If a witness proves old stance/action `/combat` but not the new Hazard-style combat route, classify it as a divergence or harness gap.
5. **No hidden broad fixes.** This phase creates the audit ledger and may file follow-up phases; sweeping combat/map/mobile changes are out of scope.

## Required audit areas

### 1. Hazard-style combat doctrine vs implementation

Audit:

- `docs/combat.md`, combat specs, and combat-tuning skills;
- `src/Combat/**`, `src/CLI/game.cli.ts`, and combat/hazard e2e witnesses;
- whether current CLI/gameplay witnesses still prove legacy combat instead of Hazard-style combat;
- whether terms remain canonical: `VITAE`, `STANCE`, not `HEALTH`/`GUARD` in player-facing doctrine.

### 2. First-level route truth

Audit:

- `src/World/Continents/Coastal-Village/maps.ts`;
- `src/World/MapEvents/content.ts` and any map-event registries;
- `automation/scripts/walkthroughs/fishing-village-exploration.*` and related CLI scripts;
- whether a committed CLI route can walk the whole intended first level with actual map nodes and encounter triggers;
- whether the CLI can enter the new Hazard-style combat surface, or only legacy round actions.

### 3. Mechanics/mobile contract

Audit:

- published/exported API surface relevant to mobile: combat state, hazard state, map definitions, event payloads, enemy snapshots, reward/scar/deck state;
- docs that mobile likely reads (`docs/world.md`, `docs/hazard*`, `docs/combat.md`, package exports, changelog);
- known mobile divergence docs if referenced from mechanics or package release notes.

### 4. Tuning/readiness witnesses

Audit:

- `skills/combat-tuning.md`, `skills/hazard-tuning.md`, `skills/mechanics-tuning.md`;
- current balance/e2e witnesses that would mislead `/march`, The Kid, or mobile workers;
- any missing measurement that blocks safe tuning under Hazard-style combat.

## `divergences.md` required shape

The output file must include:

```md
# Mechanics divergences

Generated: YYYY-MM-DD
Commit: <short sha>

## Summary
- Total divergences: N
- High: N
- Medium: N
- Low: N

## Divergences

### DIV-MECH-001 — <title>
- Severity: High|Medium|Low
- Owner: mechanics|mobile|both|T decision
- Status: open|proposed|blocked|resolved
- Evidence:
  - <file:line or command output summary>
- Why it matters:
- Proposed next action:
- Follow-up phase/issue candidate:

## Non-divergences checked
- <important surfaces inspected and found aligned>

## Commands run
- `<command>` — pass/fail, short result
```

## Verification gate

Run at minimum:

```bash
git diff --check
npm run type-check
npx vitest run src/CLI/e2e/game.cli.engine.test.ts src/Game/e2e/spec08.engine.test.ts
```

If source/test code changes, run:

```bash
npm run verify
```

If only docs/audit files change, `git diff --check` plus targeted type/test commands are sufficient unless the audit itself exposes a broken command that must be recorded.

## Definition of Done

- [ ] `divergences.md` exists at repo root.
- [ ] File records current commit and generation date.
- [ ] Audit covers Hazard-style combat, first-level route truth, mechanics/mobile contract, and tuning witnesses.
- [ ] Each divergence has severity, owner, evidence, consequence, and next action.
- [ ] CLI first-level capability is explicitly classified: adequate, partial, missing, or blocked.
- [ ] Follow-up phase candidates are proposed for any High divergence.
- [ ] Build-plan row is ticked with commit hash after shipping.

## Follow-ups out of scope

- Implementing a new first-level game CLI route.
- Retuning combat numbers.
- Publishing a new mechanics package.
- Changing mobile presentation code.
