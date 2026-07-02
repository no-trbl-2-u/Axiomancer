# plan

The build plan for Axiomancer Mobile. Read by every shipping
skill (`/ship-a-phase`, `/iterate`, `/march`, `/plan-a-phase`,
`/critique`, `/triage`, `/oversight`, `/expand`) to keep the
autonomous loop coherent.

## Layout

```
plan/
├── README.md                            # this file
├── bearings.md                          # standing context: stack, contracts, defaults, posture
├── AUDIT.md                             # latest /iterate audit (rewritten each pass)
├── CRITIQUE.md                          # external-observer findings (append-only via /critique)
├── PHASE_CANDIDATES.md                  # phase candidates from /expand, gated by /oversight
├── steps/
│   └── 01_build_plan.md                 # at-a-glance status block + per-phase scope
└── phases/
    └── phase_<N>_<topic>.md             # detailed brief per phase
```

## How the loop reads this folder

1. **Status check** — read the "Status (at-a-glance)" block at
   the top of `steps/01_build_plan.md`. The first `[ ]` row is
   the next phase.
2. **Brief** — load `phases/phase_<N>_<topic>.md`. If absent,
   `/ship-a-phase` calls `/plan-a-phase` inline to generate one
   + commit separately.
3. **Bearings** — `bearings.md` holds stack pins, contracts,
   visual defaults, sub-agent registry, standing decisions.
   Read once per session.

## How the audit works

`/iterate` writes findings to `plan/AUDIT.md` with this format:

```markdown
# Site audit — <ISO date>

## Top 5 findings (scored)

### [8.1] <one-line description>
- category: <content-gaps | tests | perf | a11y | refactor | external-issue | engine-bridge>
- impact: <0-10>
- ease: <0-10>
- next: <action — invocation, sub-agent, or follow-up>
```

Entries are flipped `[ ]` → `[x]` (with commit hash) as
addressed.

A line `> Bias: <category> (set via oversight <date>)` at the
top of `AUDIT.md` weights that category 1.5x in `/iterate`'s
scoring. Set / cleared via `/oversight reset`.

## Manually ticking phases

If a phase ships outside the loop, update `steps/01_build_plan.md`
by hand: flip `[ ]` → `[x]`, append the commit hash, add a line to
"Phase log". The loop relies on these markers.

## Related skills

- `skills/ship-a-phase.md` — ship one phase end-to-end.
- `skills/plan-a-phase.md` — refine a phase brief without
  shipping code.
- `skills/iterate.md` — audit + ship one improvement.
- `skills/critique.md` — external-observer pass.
- `skills/triage.md` — GitHub issue review.
- `skills/expand.md` — phase-candidate generator.
- `skills/march.md` — outer dispatcher.
- `skills/oversight.md` — user-in-the-loop adjustment.
- `skills/jot.md` — user-quickfire append to `CRITIQUE.md`.

`/ship-data` and `/ship-asset` are not adopted (see
`agents.md`).
