# Phase 1 — Adopt nexus methodology

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body. This phase has already been delivered by the agent that
> ran the `Adopt nexus` prompt — this brief exists so future
> ticks can see the contract that was discharged.

## Scope

Land the nexus overlay on top of an existing, working Expo /
React Native repo **without touching any product code**. The
deliverable is the substrate the rest of the loop runs against.

## Outputs

```
agents.md                                # nexus rule book (companion to existing AGENTS.md)
plan/
├── README.md
├── bearings.md
├── AUDIT.md
├── CRITIQUE.md
├── PHASE_CANDIDATES.md
├── steps/01_build_plan.md
└── phases/phase_1_bootstrap.md          # this file
skills/
├── ship-a-phase.md
├── plan-a-phase.md
├── iterate.md
├── critique.md
├── triage.md
├── expand.md
├── march.md
├── oversight.md
└── jot.md
.claude/
├── commands/<one per skill>.md
└── agents/{scout,reader,generic-specialist}.md
scripts/
└── deploy-check.mjs                     # stub (no-op exit 0) until phase 11
.env.example                             # documents EXPO_TOKEN / GH_TOKEN slots
package.json                             # +verify, +deploy:check scripts
.gitignore                               # +.env
```

`/ship-data` and `/ship-asset` are **omitted** — no structured
data layer, mobile-binary surface (see `agents.md` and
`plan/bearings.md` "Surface" section for rationale).

## Stack pins (versions)

Pulled from `package.json` at time of adoption:

- Expo SDK ~54.0.33
- React 19.1.0 / React Native 0.81.5
- expo-router ~6.0.23
- TypeScript ~5.9.2
- Jest 29.7 / jest-expo ~54.0.0
- ESLint 9 + eslint-config-expo ~10
- axiomancer-mechanics ^0.4.1
- zustand ^5.0.11

If a stable major has shipped at runtime, bump in a follow-up
phase — never as a side effect of phase 1.

## Verify gate

```bash
npm run verify          # = npm run lint && npx tsc --noEmit && npm test
```

The verify script is **added by this phase** to `package.json`.

**Note:** the gate is currently RED on a pre-existing failure
(see `plan/AUDIT.md` `[HIGH]` row): the latest
`axiomancer-mechanics` bump changed `Consumable.effect →
effectId` and added required fields on `Equipment`. **Phase 2
of the build plan is the dedicated unblocker.** Phase 1 ships
the methodology overlay anyway — per the brownfield playbook,
the loop documents the red state in bearings + AUDIT and
restricts itself to L0 (manual `/ship-a-phase`) until Phase 2
lands.

Phase 1 introduces **no product code changes**, so the red
state is unchanged by this commit.

## Deploy gate

```bash
npm run deploy:check
```

Stubbed in this phase: exits `0` with a notice. Phase 11
replaces the stub with a real EAS Build API poll.

## Tests

### Unit / hermetic e2e

None — phase 1 is a docs / config overlay. No product code
touched.

### Verify-gate dry run

Before commit, the agent runs `npm run verify` and confirms
green. If red on a pre-existing failure, document the failure
in `plan/AUDIT.md` as a `[needs-user-call]` row and ship
anyway — the gate enforces no _new_ regressions.

## Decisions made upfront — DO NOT ASK

- **Brownfield, not greenfield.** 44 commits + a 12-spec
  planning surface already existed. Followed
  `nexus/playbooks/existing-project.md`.
- **Existing `AGENTS.md` preserved verbatim.** It documents
  project-specific orientation (screen → presenter → engine
  store contract, hermetic-e2e testing, asset swap rules) that
  is still authoritative. The new lowercase `agents.md` is the
  nexus rule book; both coexist (case-sensitive Linux; macOS
  case-insensitive will alias the two — note this if a
  contributor on macOS reports duplicate files and pick one to
  rename per their preference).
- **Surface = `service`.** Mobile binaries don't fit the
  `site / hybrid` matrix; `service` disables the opt-in
  `/ship-asset` capability cleanly.
- **`/ship-data` and `/ship-asset` are omitted.** No structured
  data layer; no web-asset rendering pipeline. SVG swaps follow
  the pre-existing `.cursor/skills/swap-asset-placeholder/SKILL.md`
  workflow.
- **Verify gate = `lint && tsc --noEmit && jest`.** No separate
  build leg — Metro bundles at runtime; the build leg's role is
  played by EAS Build (deploy gate). If a Metro-only bundle
  bug ever appears, add a `metro:bundle` smoke step then.
- **Deploy gate = stub for now.** Wiring queued as phase 11.
  The stub exits `0` so the shipping skills' Step 12 doesn't
  trip; phase 11 makes it real.
- **Loop pushes directly to `main`.** Brownfield option B
  ("trunk-based for loop work") — the user trusts the verify
  gate + audit trail.
- **`specs/` becomes the de-facto product spec.** The 12
  specs are the v1 surface. Phases 2–9 are 1:1 with specs 02,
  03, 05, 08, 09, 10, 11, 12. Spec 07 already shipped (commit
  `06fc907`) but the spec doc isn't marked `[DONE]` — file as a
  carry-over.
- **Phase 1's commit is `chore: adopt nexus methodology`** per
  the standing rule.

## `[needs-user-call]` rows logged in `plan/AUDIT.md`

See `plan/AUDIT.md` immediately after this commit lands — the
agent that ran the adoption logged any genuinely-unknowable
calls there (e.g., final hosting URL / store listing IDs once
the project reaches TestFlight + Play Internal Track).

## Mobile reflow / responsive considerations

N/A — docs-only overlay.

## Git

The commit is the deliverable. Single atomic commit titled
`chore: adopt nexus methodology` with a body listing every file
added/modified, every placeholder resolved, and every
`[needs-user-call]` logged. Push to `origin/main`.

> **Note:** the adoption work happened on a `feature/adopt-nexus`
> branch. Whether to merge to `main` directly or via PR is the
> user's call once the commit lands — the loop will resume from
> wherever `main` next moves.

## DoD

After commit + push:

1. Flip Phase 1's `[ ]` → `[x]` in
   `plan/steps/01_build_plan.md`, append commit hash, add a line
   to "Phase log".
2. The flip is committed in a follow-up `plan: phase 1 shipped
   — adopt nexus methodology` commit (per the canonical DoD
   pattern). For phase 1 specifically, the user may prefer to
   tick the row in the same commit; either is acceptable.

## Confirm deploy

```bash
npm run deploy:check
```

The stub prints a notice and exits `0`. No further action.

## Follow-ups (out of scope this phase)

- **Phase 11** — replace deploy-check stub with real EAS API
  polling.
- **`setup/00_files.md` + `setup/NN_*.md`** runbooks for each
  external service (GitHub, EAS). Queued as phase candidates;
  not blocking.
- **Audit / fix README references** to `Knowledge-Gaps.md`,
  `BRAINDUMP.md`, `GAME-ROADMAP.md` — those files don't exist
  in the repo today.
- **Spec 07 close-out** — flip `[DONE]` flag + add commit hash
  in the first available tick.
