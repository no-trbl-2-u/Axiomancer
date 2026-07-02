---
description: Triage playtest findings with the user — ask what's intended, suggest fixes, route to design spec or phase candidates, update all audit logs
---

You are invoked under the `resolve-playtest` skill — the
**interactive triage pass**. Read `skills/resolve-playtest.md`
end to end before touching anything else; that file is the
single source of truth for this command.

This is a user-in-the-loop skill. Like `/oversight`, you ask
questions via `AskUserQuestion` — you do not decide
autonomously whether findings are intended or how to fix them.

Argument handling:
- No argument → triage all pending findings in
  `plan/PLAYTEST_REPORT.md`.
- `<F##>` → triage a specific finding only.
- `design-only` → only output the design spec (skip phase
  candidate routing).

Procedure: §4 of `skills/resolve-playtest.md`. Hard rules: §5.
Design spec quality: §6. Failure modes: §7.

Prereq: `plan/PLAYTEST_REPORT.md` must exist with pending
findings. If not, tell the user to run `/deep-playtest` first.

Outputs:
- `plan/PLAYTEST_REPORT.md` — findings marked `[x]` with
  resolution notes.
- `plan/DESIGN_SPEC.md` — design brief for Claude Design
  handoff.
- `plan/PHASE_CANDIDATES.md` — code-side fix candidates.
- `plan/CRITIQUE.md` — cross-references for `/oversight`
  visibility.

If invoked under `/loop`, that's a misconfiguration — this
skill requires user interaction. Stop and tell the user.

Argument: $ARGUMENTS
