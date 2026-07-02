# /archive — retired nexus harness (DO NOT READ unless explicitly told)

> ⛔ **Agents: do not read anything under `/archive` unless the user explicitly
> asks you to.** This is retired, superseded state kept only as history and as a
> seed for re-onboarding. Reading it will surface stale audit findings, dead
> phase plans, and pre-monorepo assumptions that contradict the live tree.

## What this is

Before the monorepo, `axiomancer-mechanics` and `axiomancer-mobile` were each
onboarded independently with the **nexus** autonomous-build-loop harness. The two
copies diverged heavily (same-named loop verbs, ~200–500 lines different). Rather
than force-merge two forks, the plan is to **retire both and re-onboard the
assembled monorepo once** with a single unified harness.

This directory holds the retired per-package harness so nothing is lost:

```
archive/
  mechanics/ , mobile/
    claude-commands/   loop verbs (march, iterate, critique, expand, oversight,
                       triage, ship-a-phase, plan-a-phase, jot) — .claude command shims
    skills/            the loop-verb skill logic (root skills/*.md)
    agents/            loop-generic agents (scout, reader, generic-specialist)
    plan/              accumulated working memory: AUDIT, CRITIQUE, bearings,
                       steps/, phases/, PHASE_CANDIDATES, CURRENT-STATE, tuning reports
    workflows/         nexus CI automation (march.yml, *-tuning.yml)
    memory/            nexus root memory docs (NEEDS_ATTENTION, Knowledge-Gaps,
                       BRAINDUMP, divergences, phase_136_acceptance)
```

## Seed vs quarantine

During the **nexus re-onboard** this is a **seed corpus**: mine `plan/AUDIT.md`,
`plan/CRITIQUE.md`, the phase history, and the memory docs for findings worth
carrying into the fresh unified `plan/`. That is the one time to read it.

Afterwards it is **quarantine**: history only. The live harness lives at the repo
root (re-onboarded); the live domain skills live in `/carryforward`.

## Not archived here

Domain tuning / playtest / design skills + their agents were **carried forward**
(path-annotated) to `/carryforward` for folding into the re-onboarded harness.
