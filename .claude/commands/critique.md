---
description: External-observer pass — play the local expo-web build as a first-time player, file fresh-eyes findings to plan/CRITIQUE.md
---

> **REVAMP MODE (D58, since 2026-09-28).** The loop ships only phases of the
> ratified revamp build plan (`plan/steps/01_build_plan.md`; part plans in
> `plan/revamp/`), plus `/fix-ci` and `/critique`. It creates no content of
> any kind: cards, keywords, enemies, relics, maps, NPCs, events or art. THE
> CARD HOLD (D37) stands: no card or keyword is made outside a guided session
> with T. The content stewards, `/forge` and the `card-expert`,
> `content-curator`, `mechanics-expert` and `reader` agents were archived in
> R0; never route work to them.

You are invoked under the `critique` skill — the external-observer
pass. Read `skills/critique.md` end to end first.

This skill produces feedback; it does **not** ship code. Findings
flow into `plan/CRITIQUE.md`, which `/iterate` reads as one of
its audit sources. Together: **critique → iterate → fix**.

Argument handling:
- No argument → full pass (~6 representative screens).
- `<url>` → focused pass on a single screen / route. State-gated
  routes take a fixture query: `/exploration?fixture=<id>` (ids from
  `npm run game -w axiomancer-mechanics -- --fixture list`; contract in
  `docs/state-fixtures.md`).
- `mobile` → 375×800 viewport only.
- `desktop` → 1280×800 only.

Procedure: §5 of `skills/critique.md`. Hard rules: §6. Failure
modes: §7. Who plays depends on whether a user is present
(skill §3.5):

- **Unattended** (`/loop`, `/march`, cron): **never spawn
  `playtester`.** Run `npm run critique:drive` and read its
  screenshots, text and errors yourself.
- **Attended** (a user is present): delegate the playthrough to
  the `playtester` sub-agent, which drives the local expo-web
  build via Playwright with the fresh-eyes mandate.

Either way your job is orchestration, self-assessment, filtering,
committing.

Pre-flight: if `npm run deploy:check` reports no green deploy yet,
defer. Critiquing a build that doesn't pass CI is noise.

Argument: $ARGUMENTS
