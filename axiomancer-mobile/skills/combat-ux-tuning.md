# Skill: combat-ux-tuning

> **Automated combat UX A/B tuner.** Measures input friction on the
> new Hazard-style combat board, tries small Mobile-only UX changes when
> the evidence shows friction, reruns the same automated witness, and
> keeps only changes that improve the metric without regressions.
>
> Primary metric: **input friction**. Primary witness: **automated evidence**.
> This is not a human screenshot review and not combat math tuning.

## 1. Purpose

`/combat-ux-tuning` is the Mobile-side companion to mechanics
`/combat-tuning`. Mechanics tunes the card-and-dice combat numbers with
Monte-Carlo simulation. This skill tunes the **player input surface** for
that combat: how reliably and directly an automated player can enter combat,
stage a card, assign/power with dice, APPLY, END PHASE, and progress the fight.

The skill is allowed to A/B test and ship small UX changes when it finds a
clear friction reduction. It must not rewrite combat rules. Mobile remains
presentation/control glue over `axiomancer-mechanics`.

Canon player-facing combat language remains **VITAE** and **STANCE**. The
engine may expose HP internally, but Mobile player-facing copy must not regress
to HEALTH/GUARD language.

## 2. Invocation

```bash
/combat-ux-tuning
/combat-ux-tuning --focus="card staging"
/combat-ux-tuning --focus="die assignment"
/combat-ux-tuning --focus="apply/end-phase"
/combat-ux-tuning --focus="route-entry"
/combat-ux-tuning dry-run
```

Focus values narrow the probe but do not loosen the evidence requirements.
`dry-run` measures and reports only; it does not edit, commit, or push.

## 3. Autonomy contract

- **Authorized:** small Mobile-only changes to controls, testIDs, accessibility
  labels, hit targets, button affordances, drag/drop fallback controls,
  card-detail copy, compact card glyphs, layout spacing, and presenter-derived
  display metadata when these reduce measured input friction.
- **Not authorized without T:** combat rules, engine package changes, card
  balance, enemy tuning, public release/deploy, destructive cleanup, or major
  redesign of the combat board.
- **A/B required:** baseline first, change second, same witness rerun third.
  Keep the change only if friction improves and gates remain green.
- **Automated witness is law:** screenshots/videos are supporting artifacts only.
  They are not the success metric.
- **No questions.** When invoked manually, by `/march`, or by GitHub Actions,
  decide from evidence and proceed. Do not pause for clarification. Only stop
  for destructive, costly, secret-bearing, public-release, production, or
  major-product-direction actions.
- **PR delivery.** Successful non-dry-run changes must be committed on a fresh
  branch and opened as a GitHub pull request. Do not push directly to `main`.
- **Fail together:** if the harness cannot measure the friction yet, build or
  file the smallest measurement harness gap rather than pretending the UX is
  tuned.

## 4. Input-friction metrics

Capture the narrowest available metrics for the focus. Prefer integer counts
over adjectives.

| Metric | Meaning |
|---|---|
| `actionsToEnterCombat` | Inputs from route/dev preset to active combat board. |
| `attemptsToStageCard` | Attempts needed before a card is staged. |
| `attemptsToAssignDie` | Attempts needed before a die powers/assigns to a staged card. |
| `attemptsToApplyCard` | Attempts needed before APPLY resolves a card. |
| `failedGestures` | Drag/drop or press attempts that do not mutate expected state. |
| `actionsToFirstResolvedCard` | Inputs until the first card actually resolves through engine state. |
| `actionsToEndPhaseAfterCard` | Inputs from first resolved card to a resolved enemy phase. |
| `terminalOutcomeReached` | Whether the automated route reaches victory/mercy/defeat/retreat. |
| `stablePhaseReached` | If terminal is too long, whether a known post-card phase is reached. |
| `consoleErrors` | Runtime errors during the automated witness. |
| `testHarnessPassFail` | Whether the exact witness command passed. |

A successful UX tuning change should reduce at least one primary friction count
without increasing another important count or introducing console/test failures.

## 5. Prereqs and source anchors

Start from current main:

```bash
git pull --ff-only
```

If the worktree is dirty or diverged, stop and report. Do not tune over unknown
state.

Read the current combat UX surface before measuring:

- `components/combat/encounter/CombatEncounterPanel.tsx`
- `components/combat/encounter/CombatBoard.tsx`
- `state/presenters/combat-encounter.engine.ts`
- `state/e2e/combat-encounter.screen.test.tsx`
- `components/combat/encounter/__tests__/CombatBoard.multistage.test.tsx`
- `components/event/EncounterModalOverlay.tsx`
- `app/(tabs)/exploration/index.tsx`
- `package.json` scripts for current e2e/visual commands
- `plan/bearings.md` and this repo's `AGENTS.md` for doctrine

Existing automation to prefer:

- Jest/component/e2e tests around `CombatEncounterPanel` and `CombatBoard`.
- `npm run e2e:combat` if present and current.
- Expo web + browser/Playwright-style automation when available.
- `npm run verify:visual` only as supporting evidence, not as the friction metric.

## 6. Procedure

### Step 0 — Sync and inspect

```bash
git pull --ff-only
git status --short --branch
npm ls axiomancer-mechanics --depth=0
```

If package truth is invalid or stale, run the repo-standard install repair before
judging the UI.

### Step 1 — Select the witness

Pick the highest-confidence automated witness available for the focus:

1. **Hermetic first:** component/e2e tests that can assert state transitions and
   interaction counts without a live browser.
2. **Browser second:** exported web/dev-server route driven by Playwright/MCP or
   equivalent browser automation.
3. **Visual smoke last:** useful for layout/regression context, not primary
   friction evidence.

If no witness can measure the focus, the first valid change is to add a witness
or file the harness gap. Do not tune by vibes.

### Step 2 — Baseline

Run the witness before editing. Record:

- command;
- seed / route / preset;
- focus;
- friction metrics;
- console errors;
- pass/fail;
- current commit.

Example command set:

```bash
npm test -- --runTestsByPath \
  state/e2e/combat-encounter.screen.test.tsx \
  components/combat/encounter/__tests__/CombatBoard.multistage.test.tsx \
  --runInBand

npm run e2e:combat || true
```

For a browser witness, start or reuse the web build per existing repo practice,
then drive a deterministic combat route. Prefer dev-menu combat presets or a
known encounter route. Count inputs to stage, assign, apply, and end phase.

### Step 3 — Identify one friction point

Choose exactly one friction point per A/B iteration:

- card cannot be staged reliably;
- die assignment requires fragile drag precision;
- APPLY is hard to discover or hit;
- END PHASE is reachable before a meaningful card play and encourages no-op play;
- selected card details fail to explain the action and cause wrong input;
- testIDs/accessibility labels are too unstable for automated playthrough;
- player-facing copy says HEALTH/GUARD where it should say VITAE/STANCE.

Do not mix multiple unrelated UI changes in one A/B cell.

### Step 4 — Apply the smallest candidate change

Examples of authorized candidate changes:

- add a tap fallback for drag-only card staging;
- add a tap/select fallback for die assignment when browser automation cannot
  perform drag reliably;
- enlarge APPLY / END PHASE hit targets;
- add stable `testID`s and accessibility labels for hand cards, staged cards,
  dice, APPLY, and END PHASE;
- clarify button copy where the automation repeatedly chooses the wrong control;
- normalize player-facing copy to VITAE/STANCE;
- expose presenter metadata needed for stable labels, without simulating rules.

Do not change mechanics outputs or invent local combat state to make the UI pass.

### Step 5 — Rerun the same witness

Use the same command, seed, route, preset, viewport, and max-step budget. Compare
before/after metrics.

Keep the change only if:

- the primary friction metric improves;
- no important secondary metric worsens materially;
- no console/runtime errors are introduced;
- relevant tests pass;
- canon language remains VITAE/STANCE.

If the candidate fails, revert it and record the failed hypothesis in the report
or commit notes for the next worker.

### Step 6 — Verification gate

For any kept code change, run at least:

```bash
npm run typecheck
npm test -- --runInBand
```

When visible surfaces changed, also run:

```bash
npm run verify:visual
```

Classify `verify:visual` precisely:

- missing baselines = baseline debt;
- pixel diffs with clean console = regression/baseline judgment;
- console/runtime errors = product failure until reproduced or fixed;
- browser policy noise such as blocked `navigator.vibrate` is not a product
  failure unless paired with visible breakage.

### Step 7 — Report, commit, push branch, open PR

If a change is kept, create a fresh branch and open a pull request:

```bash
BRANCH="combat-ux-tuning/<focus-slug>-$(date -u +%Y%m%d%H%M%S)"
git checkout -b "$BRANCH"
git add <files>
git commit -m "$(cat <<'EOF'
combat-ux-tuning: <focus> friction improvement

Baseline:
- command: <command>
- metric: <before>

After:
- command: <same command>
- metric: <after>

Decision:
- kept because <metric> improved without regressions.

Verification:
- <commands>
EOF
)"
git push -u origin "$BRANCH"
cat > /tmp/combat-ux-tuning-pr.md <<'EOF'
## Summary
- <one-line change>

## Baseline
- command: `<command>`
- metric: <before>

## After
- command: `<same command>`
- metric: <after>

## Verification
- <commands>

## Notes
- VITAE/STANCE copy checked.
EOF
gh pr create --base main --head "$BRANCH" --title "combat-ux-tuning: <focus>" --body-file /tmp/combat-ux-tuning-pr.md
```

Never ask whether to open the PR. Opening the PR is part of the skill contract.
Do not push directly to `main`. If no code change is kept but a durable finding
is filed, open a PR for that evidence/documentation change too unless running
`dry-run`.

If no change is kept and no durable finding is warranted, leave no branch and
print the measured result. If `dry-run`, print only.

## 7. Report format

Use this compact block in commit bodies or durable findings:

```markdown
## combat-ux-tuning — <focus> — <date>

- commit: `<sha>`
- route/preset/seed: <value>
- witness command: `<command>`
- baseline: actionsToFirstResolvedCard=<n>, failedGestures=<n>, consoleErrors=<n>
- candidate: <one-line UI change>
- after: actionsToFirstResolvedCard=<n>, failedGestures=<n>, consoleErrors=<n>
- verdict: kept | reverted | harness-gap
- notes: <VITAE/STANCE copy check, visual-smoke classification if run>
```

## 8. Hard rules

1. **Input friction first.** Do not judge combat UX by beauty, screenshots, or
   preference when the task is tuning.
2. **Automated evidence first.** Human review artifacts are optional context only.
3. **No mechanics changes.** If the issue is a rule/package gap, file a mechanics
   follow-up instead of simulating it locally.
4. **No HEALTH/GUARD regressions.** Player-facing combat copy is VITAE/STANCE.
5. **One A/B axis at a time.** If the diff changes card copy, drag behavior, and
   layout all at once, it is no longer a clean A/B test.
6. **Same witness before and after.** Changing the route/seed/harness between
   baseline and after makes the comparison inadmissible.
7. **Do not bless a broken harness.** If `e2e:combat` expects dead pressure-track
   UI, update or file the harness drift before treating failure as product truth.
8. **Commit only verified changes.** Failed candidates are reverted or left as
   documented findings, not shipped quietly.

## 9. Failure modes

- **Dev server/export will not boot:** stop, report the exact command and error;
  do not infer combat UX from code alone.
- **Browser cannot perform required drag:** add or propose a tap/select fallback
  if that is a player-valid improvement; otherwise file a harness gap.
- **Hermetic tests pass but browser route fails:** prioritize the browser failure
  for input friction; hermetic tests may not model gesture reality.
- **Browser route passes but tests are stale:** update the stale test if it asserts
  removed doctrine, especially dead pressure-track elements.
- **Metric improves but copy regresses to HEALTH/GUARD:** reject or patch the copy
  before keeping the candidate.
- **Visual smoke red with only pixel diffs:** classify honestly; do not call it a
  runtime failure, but do not auto-approve baselines inside this skill.

## 10. Done statement

End every run with:

```text
combat-ux-tuning <focus> complete.
Witness: <command/route>.
Verdict: kept <change> | reverted <candidate> | filed <finding> | harness-gap.
Metric: <before> -> <after>.
Verification: <commands>.
```
