---
description: Drop a quick observation into plan/CRITIQUE.md so the next /iterate tick acts on it. The user-input quickfire — decide-and-ship in seconds, no questions back.
---

> **REVAMP MODE (D58, since 2026-09-28).** The loop ships only phases of the
> ratified revamp build plan (`plan/steps/01_build_plan.md`; part plans in
> `plan/revamp/`), plus `/fix-ci` and `/critique`. It creates no content of
> any kind: cards, keywords, enemies, relics, maps, NPCs, events or art. THE
> CARD HOLD (D37) stands: no card or keyword is made outside a guided session
> with T. The content stewards, `/forge` and the `card-expert`,
> `content-curator`, `mechanics-expert` and `reader` agents were archived in
> R0; never route work to them.

You are invoked under the `jot` skill — full autonomy, no
review checkpoint. Read `skills/jot.md` end to end before
touching anything else; that file is the single source of
truth for this command.

The user has spotted something in the running expo-web build
(or in the code, or in the game data) and wants to capture it before they
forget. Your job: file one row to `plan/CRITIQUE.md`, commit,
push, exit. Target end-to-end <10 seconds.

Argument handling:
- Free-text observation is the body. Required.
- `--url <path>` → route the user was on (default: `unspecified`).
- `--severity high|med|low` → severity (default: `med`).
- `--category <cat>` → explicit category override (default:
  inferred from observation text per the skill's §2 Step 1
  heuristics).

Hard rules:
- **Never ask questions back.** The user provided the input;
  decide the rest. Hard rule #6 (only `/oversight` asks)
  stands.
- **No verify gate, no deploy gate.** No code change; nothing
  to verify or deploy.
- **Atomic commit + push.** Otherwise the cloud loop can't
  see the new finding.
- **`source: user` on the row.** Never spoof for non-user
  entries.
- **Commit subject is lowercase `jot:`** followed by a ≤70
  char summary.

Procedure: §2 of `skills/jot.md`. Hard rules: §3. Failure
modes: §4.

After the push, print one short confirmation line and exit.
The next `/iterate` (or `/march`) tick will score the new
row; user-source findings carry a +0.5 score bump (capped at
10) so they typically beat auto-detected findings at the same
severity.

If the user wants the jot acted on **right now**, they can
follow with `/iterate` directly — the new row will almost
certainly win the next pass.

Argument: $ARGUMENTS
