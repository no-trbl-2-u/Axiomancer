---
description: External-observer pass — play the local expo-web build as a first-time player, file fresh-eyes findings to plan/CRITIQUE.md
---

You are invoked under the `critique` skill — the external-observer
pass. Read `skills/critique.md` end to end first.

This skill produces feedback; it does **not** ship code. Findings
flow into `plan/CRITIQUE.md`, which `/iterate` reads as one of
its audit sources. Together: **critique → iterate → fix**.

Argument handling:
- No argument → full pass (~6 representative screens).
- `<url>` → focused pass on a single screen / route.
- `mobile` → 375×800 viewport only.
- `desktop` → 1280×800 only.

Procedure: §5 of `skills/critique.md`. Hard rules: §6. Failure
modes: §7. Most importantly: **delegate the actual playthrough
to the `playtester` sub-agent** — it drives the local expo-web
build via Playwright with the fresh-eyes mandate. Your job is
orchestration, self-assessment, filtering, committing.

Pre-flight: if `npm run deploy:check` reports no green deploy yet,
defer. Critiquing a build that doesn't pass CI is noise.

Argument: $ARGUMENTS
