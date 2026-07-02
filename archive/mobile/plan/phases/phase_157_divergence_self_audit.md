# Phase 157 — Mobile divergence self-audit

**Source:** T direct steering 2026-06-23.

## Outcome

Produce a repo-root `divergences.md` that audits where `axiomancer-mobile` is out of line with current Axiomancer mechanics truth, Hazard-style combat direction, and the intended first-level player route. The file is a practical reconciliation ledger for bringing mobile and mechanics back into line.

This phase audits and records. It does not perform broad UI rewrites or engine-rule work.

## Source / user decision

T asked for a self-audit phase in both mechanics and mobile so each repo outputs a `divergences.md` file. Current known pressure points:

- new Hazard-style combat should be the tested player-facing combat flow;
- The Kid should walk through the whole first level and test authored map-node encounter triggers;
- mobile must not keep testing or presenting legacy combat as if it were the primary combat experience;
- mobile should consume mechanics truth rather than duplicating map/event/combat/hazard rules locally;
- any mismatch between WILDS layout, encounter triggers, in-place hazard combat, dev tools, and mechanics package truth needs a named row.

## Decisions made upfront — do not ask

1. **Output path is repo-root `divergences.md`.** Not `plan/divergences.md`, not a dated report.
2. **Evidence first.** Every divergence must cite files, tests, screenshots, browser logs, or command output.
3. **Ownership is explicit.** Each row names `mobile`, `mechanics`, `both`, or `T decision`.
4. **Legacy combat is fallback evidence.** Direct `/combat` route or SELF → DEV MENU → COMBAT may remain as regression/dev surfaces, but they must not be mistaken for proof of the new player route.
5. **Do not patch broad drift here.** Produce the ledger, run targeted evidence, and file follow-up phases.

## Required audit areas

### 1. First-level player route

Audit:

- WILDS / Exploration entry from fresh start;
- `state/exploration-maps/fishing-village.layout.ts` and parity tests;
- actual node connectivity and available-node behavior;
- authored node kind glyphs and player feedback;
- whether a player can walk the intended first-level route without hidden dev knowledge.

### 2. Encounter trigger → Hazard-style combat

Audit:

- `components/event/EncounterModalOverlay.tsx`;
- `app/(tabs)/exploration/index.tsx`;
- event/encounter presenter and action wiring;
- whether `FIGHT` opens the in-place Hazard-style combat surface;
- whether any flow still routes to old `/combat` as the primary experience;
- aftermath return/continue behavior after combat resolution.

### 3. Mechanics package alignment

Audit:

- current `axiomancer-mechanics` dependency version and consumed exports;
- local adapters that may simulate engine truth: combat resources, hazard deck/scars/rewards, map-event pools, loot, enemy selection, event payloads;
- docs such as `docs/hazard-v2-vs-mechanics-divergence.md`, `docs/combat.md`, `docs/presenters.md`, and current phase docs;
- whether mobile's dev menu/test fixtures expose the same first-level/combat truth The Kid needs.

### 4. Playtest and visual witness alignment

Audit:

- `skills/playtest.md`, `skills/deep-playtest.md`;
- `scripts/smoke-screens.mjs`, `verify:visual`, browser playtest scripts, and relevant state/e2e tests;
- whether current playtest doctrine still drives legacy combat rather than first-level Hazard-style combat;
- whether dev fixtures represent real player states, not only broad debug dumps.

## `divergences.md` required shape

The output file must include:

```md
# Mobile divergences

Generated: YYYY-MM-DD
Commit: <short sha>
Mechanics package: <version/range and resolved version if available>

## Summary
- Total divergences: N
- High: N
- Medium: N
- Low: N

## Divergences

### DIV-MOB-001 — <title>
- Severity: High|Medium|Low
- Owner: mobile|mechanics|both|T decision
- Status: open|proposed|blocked|resolved
- Evidence:
  - <file:line, test, screenshot, or command output summary>
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
npm run typecheck
npm test -- --runInBand state/e2e/map-encounter-minigames.engine.test.ts state/e2e/new-player-journey.engine.test.tsx components/event/__tests__/EncounterModalOverlay.test.tsx
```

If visible route/combat surfaces are inspected or changed, also run:

```bash
npm run verify:visual
```

If only docs/audit files change and targeted tests are blocked by environment, record the blocker in `divergences.md` and in the commit body.

## Definition of Done

- [ ] `divergences.md` exists at repo root.
- [ ] File records current commit, generation date, and mechanics package version.
- [ ] Audit covers first-level route, encounter trigger → Hazard-style combat, mechanics package alignment, and playtest/visual witnesses.
- [ ] Each divergence has severity, owner, evidence, consequence, and next action.
- [ ] The primary combat witness is classified: Hazard-style first-level route, legacy fallback, partial, missing, or blocked.
- [ ] Follow-up phase candidates are proposed for any High divergence.
- [ ] Build-plan row is ticked with commit hash after shipping.

## Follow-ups out of scope

- Implementing new map traversal UI.
- Rewriting the combat screen.
- Changing mechanics engine rules.
- Publishing or bumping mechanics package versions.
