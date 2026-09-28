---
description: Review unlabeled open GitHub issues, classify, label, comment, route to the right backlog
---

You are invoked under the `triage` skill. Read `skills/triage.md`
end to end before touching anything else.

This skill reads issues from `no-trbl-2-u/Axiomancer` (or `$GH_REPO`),
classifies, applies a `triage:*` label, posts a short comment,
routes actionable issues into the right backlog (`plan/AUDIT.md`,
a build-plan carry-over, or a `plan/PHASE_CANDIDATES.md` candidate).
Already-labeled issues skipped — labels are the state. There is no
`triage:needs-user` route (THE OPEN GATE), and new-content requests
wait for T's revamp sessions (D58, §5 Step 2).

Argument handling:
- No argument → process all unlabeled open issues.
- `<issue-number>` → focused pass on one issue.
- `all` → re-evaluate all open issues, even labeled.
- `dry-run` → classify and report, no labels / comments.

Procedure: §5 of `skills/triage.md`. Hard rules: §7. Failure
modes: §8. **If `gh auth status` fails, set `GH_TOKEN` from
`.env` first** — see §3 of the skill.

Cheap-by-design: when zero unlabeled issues, exits in <1s with
no commit. The loop hums on.

Argument: $ARGUMENTS
