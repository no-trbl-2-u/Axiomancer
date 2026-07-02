# archive/mobile/skill-tests

Structural/contract tests for the mobile **playtest skills** (`playtest`,
`hermes-playtest`). They `readFileSync('skills/playtest.md')` etc. — asserting the
*old* per-package skill-file layout, which no longer exists: those skills were
restructured into the monorepo root `.claude/commands`, and the loop lives in
`/archive`.

Kept for reference only. Not run (outside the app's jest rootDir). If the playtest
skills are folded back into a live harness at nexus re-onboard, re-derive these
against the new layout.
