# Needs human attention

> Items the autonomous loop cannot resolve on its own and that
> require more than an `/oversight` call to address. `/oversight`
> handles plan adjustments, phase promotion, scope shifts,
> bias rules. This file is for things outside that scope —
> infrastructure decisions, billing-or-auth requirements,
> tooling installs, environment access, real-device testing.
>
> Each entry: title, category, why-the-loop-can't-self-resolve,
> the concrete asks for the human, and any options/tradeoffs.
> Resolved items move to `## Done` with the date + how they
> were resolved.

## Open

### [tooling] Bridge the hermetic-e2e testing gap

**Filed:** 2026-05-21 (during Phase 63 modal-encounter sweep)

**Why the loop can't self-resolve:** The current test harness
(905 hermetic Jest cases at green) doesn't catch multi-screen
integration regressions. Phase 63b shipped with a bug where
the encounter modal unmounted on FIGHT — every existing test
passed because each component renders in isolation. The
unmount only happened in the **interaction** between
`ExplorationScreen` (which gates modal mount on
`selectHasActiveEvent`) and the engine (which flips that
selector false when combat starts). No single-component test
exercises that boundary.

The loop is blind to:

1. Component interactions where one screen's selector
   depends on engine state mutated by another screen's
   action handlers.
2. Tab-navigator behaviors (e.g. "tab bar hidden when
   encounter modal is active").
3. Real React Native runtime concerns: actual touch events,
   layout clipping, SVG hit areas, navigation stack.
4. Visual regressions (PNG diffs) once the layout shifts
   per-platform.

`/oversight` can't fix this — it can only adjust the plan.
Whether to invest in a richer harness, and at what scale,
is a human call.

**Three options, smallest to largest:**

#### Option A — Extend the existing Playwright web smoke harness

`scripts/smoke-screens.mjs` already drives `expo export
--platform web` + Playwright. It currently snapshots single
screens. Extend with **interactive flow scripts** that drive
multi-step journeys:

- `flows/encounter-stays-in-modal.mjs` — load exploration →
  tap encounter node → tap FIGHT → assert (a)
  `[data-testid="encounter-modal-overlay"]` still in DOM,
  (b) tab bar `display: none`, (c) combat UI rendered inside
  the modal panel.
- `flows/stance-advances-phase.mjs` — start combat → tap a
  stance card → assert PhaseStack's
  `phase-stack-row-choosing_action` row is `state="current"`.
- `flows/action-resolves-round.mjs` — pick stance → pick
  ATTACK → assert ResolvePanel mounted + log entry added.

Would have caught every Phase 62/63 bug surfaced this week.

- **Cost:** ~1 phase, mostly script-writing. ~200 LOC.
- **Dependencies:** Playwright already in `package.json`.
- **Asks for human:** authorize a new phase candidate;
  optionally wire to `.github/workflows/verify.yml` so it
  runs on every push to `main`.

#### Option B — Multi-screen integration tests in Jest

Mount the FULL `<ExplorationScreen>` (with all providers:
`AestheticModeProvider`, `CombatModeProvider`,
`GameStoreProvider`, `CombatModeProvider`) via
`@testing-library/react-native`, simulate node taps, assert
the `EncounterModalOverlay` appears in the tree across a
sequence of actions.

Faster than web-smoke, smaller blast radius, zero new
dependencies. Won't catch real-runtime issues (layout, SVG
hit areas, gesture handler quirks) — only logical-tree
regressions.

- **Cost:** iterate-shaped (1–3 tests per shipped tick).
  No oversight needed.
- **Dependencies:** none.
- **Asks for human:** none — say "go" and the loop ships
  them as iterate findings on every march tick until the
  most-important flows are pinned.

#### Option C — Real device / simulator e2e via Detox or EAS preview automation

The gold standard: Detox runs on iOS/Android simulators,
drives real touch events, catches everything including the
SVG-tap and layout-clipping classes of bug.

- **Cost:** several phases. CI runners that support iOS /
  Android simulators (paid or self-hosted). Detox config +
  fixture scaffolding.
- **Dependencies:** Detox install, simulator runners.
- **Asks for human:** budget approval (CI runner cost),
  Detox / simulator scope decision, time allocation (likely
  weeks of work spread across phases).

**Recommendation:** ship Option B as iterate work immediately
(no human ask needed), and promote Option A as a phase via
`/oversight` for the next cron tick. Option C waits until
the project scale justifies it.

**To resolve this row:** human authorizes one of the options
above (or explicitly defers). Resolution moves the row to
`## Done` with the date + the choice made + the resulting
phase / iterate stream.

## Done

_(Empty.)_
