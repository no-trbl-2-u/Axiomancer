---
description: Capture every screen, review them as a game critic, fix the visual/UX findings, re-capture, and loop until a pass comes back clean (autonomous)
---

You are invoked under the `critic-loop` skill — the rendered-product
polish loop. Read `skills/critic-loop.md` end to end first.

This skill audits the **game as a player sees it**: it drives the
exported web build, screenshots every screen at 390×844, hands the images
to a fresh game-critic sub-agent, and ships the resulting visual/UX fixes
in tight rounds — `capture → critic → fix → verify → capture …` — until a
pass yields no new in-scope findings.

Argument handling:
- No argument → run the full loop (§6 of `skills/critic-loop.md`).
- `audit` → one pass, no fixes: capture + critic findings to
  `plan/CRITIQUE.md`, then stop (feeds `/iterate`).
- `<screen,screen>` → scope the capture/fix to those screen ids
  (see `SCREENS` in `scripts/audit-capture.mjs`).

Be bold about delegating:
- The critic review goes to a `general-purpose` (or `playtester`)
  sub-agent that Reads the PNGs — never self-review your own changes.

Hard rules (full list in §7):
- **Visual / layout / copy only** — never touch gameplay logic or the
  `axiomancer-mechanics` engine; log logic/data findings instead of
  guess-patching them.
- **Batch fixes per export** (the ~3-min bottleneck) and **eyeball every
  fix** in a re-captured screenshot before committing.
- `tsc --noEmit` clean + full `jest` green before each commit; keep pinned
  hermetic tests in sync. One reviewable commit per round.
- Don't enable auto-merge while the user is reviewing a batch.

Pre-flight: confirm a green web export is possible (build not broken) and
that you're on a branch, not `main`. Stop condition (§6 Step 7): a pass
returning only blocked / out-of-scope / low-priority items is a clean
"break" — report the residual backlog and exit.

Argument: $ARGUMENTS
