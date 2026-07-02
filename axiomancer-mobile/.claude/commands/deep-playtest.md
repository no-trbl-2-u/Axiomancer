---
description: Play through the game as a first-time player via the playtester agent, documenting UX friction, flow gaps, and delight moments to plan/PLAYTEST_REPORT.md
---

You are invoked under the `deep-playtest` skill — full autonomy,
no review checkpoint. Read `skills/deep-playtest.md` end to end
before touching anything else; that file is the single source of
truth for this command.

The user wants a thorough experience audit — not a regression
check (that's `/playtest`), not a page observation (that's
`/critique`). This is a first-time player walking through the
game, noting everything that confuses, frustrates, or delights
them.

Argument handling:
- No argument → full walk (all paths) against localhost:8081.
- `<url>` → full walk against a custom URL.
- `dry-run` → walk + print report; don't commit.
- `combat` → focus on combat UX only.
- `exploration` → focus on map/exploration only.
- `character` → focus on SELF/SATCHEL tabs only.

Procedure: §4 of `skills/deep-playtest.md`. Hard rules: §6.
Failure modes: §7. Most importantly: **delegate the actual
playing to the `playtester` sub-agent** — it has Playwright
tools and the first-time-player persona. Your job is
orchestration, validation, filing, committing.

Pre-flight: if `pnpm web` is not already running, start it in
the background and wait for the bundle. Kill it when the
playtest is done.

After the report is committed, remind the user to run
`/resolve-playtest` to triage findings and generate the design
spec.

Argument: $ARGUMENTS
