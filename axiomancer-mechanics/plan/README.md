# plan/

> Working memory for the autonomous build loop. These files
> survive context loss — the agent reads them on every
> re-spawn to understand what's done, what's next, and why.

## Files

| File | Purpose | Read by |
|---|---|---|
| `bearings.md` | Stack, conventions, standing decisions, hard rules | All skills |
| `steps/01_build_plan.md` | At-a-glance phase status | `march`, `ship-a-phase`, `oversight` |
| `phases/phase_<N>_<topic>.md` | Detailed brief per phase | `ship-a-phase`, `plan-a-phase` |
| `AUDIT.md` | Open audit findings (scored) | `iterate`, `oversight` |
| `CRITIQUE.md` | Code-quality critique findings | `critique`, `iterate`, `march`, `oversight` |
| `PHASE_CANDIDATES.md` | Candidate phases proposed by `/expand` | `expand`, `oversight` |
| `CURRENT-STATE.md` | Baseline assessment written at nexus adoption | `oversight` (historical) |

## The loop's flow

```
/march → triage? → critique? → ship-a-phase → expand? → iterate
                                    ↓             ↓
                           plan/steps/      plan/PHASE_CANDIDATES.md
                           plan/phases/     plan/AUDIT.md
                           plan/AUDIT.md    plan/CRITIQUE.md
```

`/march` walks the dispatch order top-to-bottom (per
`skills/march.md` §3): triage (cheapest — unlabeled GitHub issues),
critique (rate-limited — ≥12 commits or ≥24h since last pass),
ship-a-phase (any `[ ]` row in `01_build_plan.md`), expand
(rate-limited — ≥20 commits or ≥48h + posture bold), iterate (fallthrough
— drains AUDIT / CRITIQUE queues + any derivable finding).

State files are updated in the same commit that ships the work.
Never edit them out-of-band; always via a skill.
