# Skill: critic-loop

> **Full autonomy.** Capture every screen, review them as a game
> critic, fix the highest-impact visual/UX findings, re-capture, and
> repeat — `capture → critic → fix → verify → capture …` — until a pass
> yields no new actionable findings (or only blocked / out-of-scope ones
> remain). The visual-polish loop.

## 1. Purpose

`/iterate` audits the codebase; `critic-loop` audits the **rendered
product**. It drives the exported web build, screenshots each screen at
phone resolution, hands the images to a fresh game-critic eye, and ships
the resulting fixes in tight rounds. It is how the game's *look and feel*
gets tightened the way a player actually experiences it.

Use it after a visual change lands, or as a standing polish loop.

## 2. Invocation

```
/critic-loop                  # full loop: capture all → critic → fix → verify → repeat
/critic-loop audit            # one pass, no fixes — capture + critic findings only
/critic-loop <screen,screen>  # scope to specific screen ids (see §4 SCREENS)
/loop /critic-loop            # standing autonomous loop
```

## 3. Autonomy contract

- **Scope = visual / layout / copy / legibility / affordance.** This loop
  does **not** change gameplay logic or the `axiomancer-mechanics`
  engine. If the critic flags something that looks like a data/logic bug
  (e.g. a HUD value that disagrees with itself, a `NaN`), only fix it if
  the fix is purely presentational (guard a formatter, fix an alignment).
  Otherwise **log it and move on** — don't guess-patch engine behaviour.
- **Batch several fixes per round.** A web export is the ~3-minute
  bottleneck; never export once per fix. Collect a round of fixes, export
  once, re-capture the affected screens, verify.
- **Verify every round.** Re-capture the screens you touched and *look at
  the PNG* before claiming a fix landed. A fix you didn't eyeball isn't
  done.
- **One commit per round.** Reviewable; subject `polish: critic round N — …`
  or `fix: …` for defects.
- **`tsc --noEmit` clean + full `jest` green before every commit.** Update
  hermetic tests that pin the styles/structure you changed.
- **Respect batch review.** If the user is reviewing on a PR, do **not**
  enable auto-merge. Push; the PR updates.

## 4. The capture rig

Everything routes through the existing audit tooling:

- **Export:** `BUILD_PROFILE=preview npx expo export --platform web --output-dir .audit-dist`
  (`BUILD_PROFILE=preview` enables the dev menu in the export so the debug
  launch buttons exist).
- **Serve:** `node scripts/audit-serve.mjs` → `http://127.0.0.1:4173`.
- **Capture:** `node scripts/audit-capture.mjs` (Playwright, 390×844,
  `reducedMotion`). Env:
  - `ONLY=id,id` — capture a subset (ids in the script's `SCREENS`).
  - `CAPTURE_DIR=...` — output dir (default `screenshots/audit-2026-06/after`).
  - `THEME=<id>` — force a colour theme (showcase the theming system).
- **Reaching every screen:**
  - Tabs by route: `/`, `/exploration`, `/character`, `/inventory`, `/memoir`.
  - Combat sub-phases: drive the round via testIDs `combat-stance-*`,
    `combat-action-*`, `combat-resolve-continue`.
  - Minigames: their **dedicated** dev-menu buttons — `debug-gathering-button`,
    `debug-hazard-button`, `debug-quest-button`, `debug-rest-button`,
    `debug-cache-button` — **not** the `debug-trigger-encounter-*` buttons
    (those set a pending event and land on an empty `NO EVENT` fallback).
    Seed minigames for determinism: `__AXM_HAZARD_SEED__`/`__AXM_HAZARD_ID__`,
    `__AXM_GATHER_SEED__`/`__AXM_GATHER_SITE__` (see `scripts/*-e2e.mjs`).
  - Prelude/boss: `debug-trigger-encounter-encounter` / `-boss` then wait for
    `encounter-modal-overlay`; click `encounter-modal-fight` to enter combat.
  - **Known gaps:** `village` and `cutscene` have no dev launch hook — note
    them as un-capturable rather than faking coverage.

If a new screen has no capture path, add it to `SCREENS` in
`scripts/audit-capture.mjs` (and a dev launch hook if needed) rather than
skipping it silently.

## 5. The critic pass

Delegate the review to a sub-agent with a fresh, adversarial eye — do not
self-review (you're biased toward your own changes).

- Spawn a `general-purpose` (or `playtester`) sub-agent. It **Reads the
  PNG files** (Read renders images) under the capture dir.
- Prompt it as a **seasoned game UI/UX critic** for a dark-gothic mobile
  RPG. For each screen assess: visual hierarchy, legibility (assume a
  **low-vision** player), use of space (dead space / overcrowding),
  affordance clarity (can a new player tell what to do?), aesthetic
  cohesion, engagement/juice. Flag outright bugs (mis-rendered text,
  overlap, `NaN`/placeholder values, clipped/illegible content).
- Require a **prioritized, concrete** list: `[screen] severity — problem —
  specific fix`, highest-impact first. "Don't praise; feed the fix loop."
- It may `WebSearch` genre conventions, but the images come first.

## 6. Procedure

### Step 0 — Sync + baseline
`git pull --ff-only`. Confirm a branch (never commit straight to `main`).

### Step 1 — Capture
Export (§4) → serve → `audit-capture.mjs`. Honour `ONLY`/scope arg. Spot-
check that minigame/prelude captures reached the *real* screen (not the
`NO EVENT` fallback or an intro you meant to dismiss).

### Step 2 — Critic
Run §5. Collect findings.

If invoked as `/critic-loop audit`: write the findings to
`plan/CRITIQUE.md` (the source `/iterate` drains) and **stop** — no fixes.

### Step 3 — Triage
Keep findings that are **in-scope** (§3) and **high/med** impact. Drop or
log (don't fix) gameplay-logic and blocked items. Order by impact.

### Step 4 — Fix (batched)
Apply the round's fixes. Prefer routing colour/spacing through the theme
tokens (`theme/axm.ts` / `theme/palette.ts`) over hardcoded values. Keep
each screen's hermetic test in sync (counts, labels, structure). `tsc` +
`jest` green.

### Step 5 — Verify
One export → re-capture **only the touched screens** (`ONLY=`) → **open
the PNGs** and confirm each fix landed. If a fix didn't take (e.g. a
nested-scroll `flexGrow` that needs a fixed-height parent), iterate within
the round before committing.

### Step 6 — Commit + push
One commit for the round. Push; the PR updates. Do not enable auto-merge
under batch review.

### Step 7 — Loop or stop
Re-run from Step 1 (a fresh critic pass on the new captures). **Stop when**
a pass returns no new in-scope high/med findings, i.e. only blocked
(no dev hook), out-of-scope (gameplay), or low-priority items remain.
Report the residual backlog as the continuation queue.

## 7. Hard rules

1. **No gameplay/engine changes.** Visual / layout / copy only.
2. **Batch fixes per export.** Exports are the bottleneck.
3. **Eyeball every fix** in a re-captured screenshot before committing.
4. **`tsc` clean + `jest` green before every commit;** update pinned tests.
5. **One reviewable commit per round.** No multi-round mega-commits.
6. **Don't fake coverage.** A screen with no capture path is logged as a
   gap, not skipped silently.
7. **Don't enable auto-merge** when the user is reviewing a batch.
8. **No emojis. No `Co-Authored-By:`** in commits authored by this loop
   (match repo convention for skills).

## 8. When critic-loop is NOT the right tool

- **Logic/data bugs.** That's a code fix, not a visual pass — the loop
  only guards the *presentation* of such a value.
- **A single known tweak.** Just make it; don't spin up the whole rig.
- **No green export possible** (build broken). Fix the build first.

## 9. Failure modes

1. **Capture lands on `NO EVENT` / wrong screen.** You used a
   `trigger-encounter` button instead of the dedicated `debug-<minigame>-button`,
   or didn't dismiss an intro / inject a seed. Fix the drive in
   `audit-capture.mjs`.
2. **Export has no dev menu.** You forgot `BUILD_PROFILE=preview`.
3. **A fix doesn't render.** Re-export caching, or a layout assumption
   (e.g. `flexGrow` with no bounded parent; a `TooltipTarget` wrapper not
   carrying the cell `flex`). Re-capture before trusting it.
4. **`EADDRINUSE` on 4173.** A stale `audit-serve` is running; reuse it
   (it reads files per-request) or kill it first.
5. **Critic loops forever.** Enforce the §6 Step 7 stop condition; a pass
   with only blocked/out-of-scope/low items is a "break" — report and exit.

## 10. Quick reference

```bash
# Export with dev menu, serve, capture
BUILD_PROFILE=preview npx expo export --platform web --output-dir .audit-dist
node scripts/audit-serve.mjs                       # http://127.0.0.1:4173
node scripts/audit-capture.mjs                     # all screens, 390x844
ONLY=character-top,dialogue node scripts/audit-capture.mjs   # subset
THEME=ember-depths ONLY=exploration node scripts/audit-capture.mjs

# Gates
npx tsc --noEmit
npx jest

# Critic: spawn general-purpose sub-agent → Reads screenshots/audit-2026-06/after/*.png
#   → returns prioritized [screen] severity — problem — fix

# Minigame launch testIDs (dedicated, real beginX() — NOT trigger-encounter):
#   debug-gathering-button  debug-hazard-button  debug-quest-button
#   debug-rest-button       debug-cache-button
# Combat drive testIDs: combat-stance-*  combat-action-*  combat-resolve-continue
# Known capture gaps: village, cutscene (no dev hook)
```
