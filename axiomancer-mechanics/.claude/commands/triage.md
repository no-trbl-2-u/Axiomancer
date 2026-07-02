---
description: Review unlabeled GitHub issues, classify, and route to plan files.
---

You are invoked under the `triage` skill — read unlabeled open GitHub issues
for axiomancer-mechanics, label them, and route them to plan state files.
Read `skills/triage.md` end to end before starting.

Procedure: §4 of `skills/triage.md`. Hard rules: §5.

Does NOT modify code. Labels issues and updates AUDIT.md only.
Returns after commit + push (or immediately if no unlabeled issues).

Argument: $ARGUMENTS
