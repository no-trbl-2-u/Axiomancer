# Phase 81 — Late-campaign difficulty cliff

> Promoted 2026-09-15 via `/oversight` from `plan/PHASE_CANDIDATES.md`
> (score 6.5). Brief generated 2026-09-15 by `/ship-a-phase` §9 (tooling /
> measurement phase — the page-family brief sections don't apply; adapted
> per Phase 79's precedent, the same "verify against a moving baseline
> before picking a design lever" shape).

## Outcome

The phase's own first instruction was: *"verify against current baseline
whether THE PATH already closed the 4%/0%-cells gap; if still open, pick
among the three named design options."* It's closed, and the doctrine
that made it a "gap" in the first place no longer exists. This phase
documents that verification, closes the stale standing HIGH finding it
answers, and ships no design-lever code — there is nothing left to pick
among.

## Why

`plan/2026-09-02-big-numbers-overhaul.decisions.md` measured late-band
4% win rate (4 of 6 cells at 0%) surviving every tuning lever tried that
day, diagnosed as "card power is flat in level while enemy pools are
not," and explicitly declined to pick a fix — naming three structural
options (card level-scaling term, flatten enemy VITAE growth, or a vigil
`reprisal` late-game wall-answer) as design calls, not tuning ones.

Two things happened after that entry was written, both before this
phase started:

1. **THE PATH landed the same day** (commit `515ac4d9`, "THE PATH lands"
   — card upgrades/deck tiers/CONDEMN rescale) and measurably moved the
   late band from 9% to 44% through an entirely different lever than the
   three named options.
2. **THE BIG NUMBERS REWRITE repealed the objective function that made
   a low late win rate a "violation" at all.** `axiomancer-mechanics/CLAUDE.md`
   § Load-bearing doctrine, pillar 3: *"There is no governing objective
   function any more: no win-rate curve, no CQI, no rank bands, no count
   pins, no status-engagement floor. The sims keep bug detectors ... and
   a wide sanity envelope; they do not grade the game against a shape."*

This phase's job, per its own brief text, was to re-measure before
picking a lever — the PHASE_CANDIDATES row itself flagged this exact
risk ("THE PATH may have already narrowed or closed the gap this row
describes; if so the candidate narrows to picking among the three named
options rather than re-proving the gap exists").

### The re-measurement

`npm run baseline:check` at phase start: **STALE by 1 mechanics-source
commit** (`5885f024`, an equipment cleanse-effect split — unrelated to
combat win-rate/enemy-scaling mechanics). Baseline stamp: `b123cdba`,
measured 2026-09-15, confidence `reduced-nightly`. Cited per AGENTS.md's
"NAME the stamp before citing numbers" — flagged here as directionally
reliable but not confirmation-grade, per the baseline's own `note` field.
Given the magnitude of the finding below (an order-of-magnitude move, not
a close call), a full 3-seed regen was judged not worth gating this
phase on; a future tuning pass citing the *exact* late-cell numbers
should regen first.

Reading `axiomancer-mechanics/docs/reports/baselines/deck-matrix-baseline.json`
directly (`report.stageSummaries` + `report.cells`, stage=`late`, 48
cells: 8 enemies x 6 policies + `fire-giant`/`rangda`/etc. against the
`control-lock`/`aggro-brute`/etc. policy set):

- **Late-band aggregate win rate: 82.0%** (was 4% at the row's filing).
- **Zero cells at 0%** (was 4 of 6 at the row's filing — the row's own
  "6 cells" framing predates the current 48-cell late matrix, but the
  qualitative claim — a meaningful fraction of late cells fully
  unwinnable — no longer holds at any granularity).
- Worst cells: `the-abortive` vs `turtle` policy (13.3%), `the-abortive`
  vs `mercy-seeker` (16.7%), `rangda` vs `mercy-seeker` (23.3%) — all
  non-zero, all policy-shaped (turtle/mercy-seeker are the two most
  passive sim policies; the same enemies read 90–100% against
  aggro-oriented policies).
- Best cells: `fire-giant` reads 100% against every policy (a separate,
  pre-existing observation — a trivial late fight — not this phase's
  scope; noted under Follow-ups).

The 4%/0%-cells gap is closed. It closed via THE PATH's card-upgrade/
deck-tier/CONDEMN lever, not any of the three options the original entry
declined to pick — so this phase does not need to choose among them.

## Decisions made upfront — DO NOT ASK

- **No design lever is shipped.** The brief's own conditional ("if still
  open, pick among the three named options") did not trigger — the
  antecedent is false. Shipping a lever anyway against an already-closed
  gap, under a doctrine that no longer grades win-rate shape at all,
  would be solving a problem that no longer exists against a target that
  no longer exists. Rejected.
- **The standing `[HIGH] late-stage global collapse` row in
  `plan/CRITIQUE.md` is closed, not left PARKED.** Its own 2026-08-08
  `/oversight` ruling named two conditions for reopening it for
  assessment: the card redesign landing, and Phase 43 (objective
  function v2) defining a live objective function. Both happened —
  the redesign (THE BIG NUMBERS REWRITE, 2026-09-02) landed, and Phase
  43 shipped (`01_build_plan.md`, marked `[x]`) — but Phase 43's
  "objective function v2" turned out to be *the repeal of having one*.
  The row's original target band (80/50/25-35/0) is dead; the row's
  original measurement (0.00 late) is superseded by fresh evidence
  (82.0% late). Marking RESOLVED with the fresh numbers and the
  doctrine citation, rather than leaving a three-generations-stale
  PARKED row for the next reader to re-derive this chain from scratch.
- **The three worst late cells (13–23%, all passive-policy shaped) are
  not this phase's fix.** They're non-zero, so no bug-detector fires;
  the current doctrine explicitly declines to grade win-rate shape. Filed
  as a Follow-up candidate rather than scope-crept into this phase.
- **No `baseline:regen` run.** The staleness is one unrelated equipment
  commit against reduced-nightly confidence, and the finding here is not
  a close call. Regen is the right call for any *future* pass that needs
  the exact late-cell numbers for a tuning decision.

## Surface (no routes — this is a measurement + doc-closure phase)

| File | Change |
|---|---|
| `plan/CRITIQUE.md` | `[HIGH] late-stage global collapse` row marked `[x]` RESOLVED with the fresh baseline reading and doctrine citation |
| `plan/steps/01_build_plan.md` | Phase 81 row ticked `[x]` with commit hash |

## Verify gate

No code changed; `npm run verify` still run to confirm the doc-only
change doesn't trip any content/data validators (`lexicon.json` doctrine
scan, etc.).

## DoD

- [ ] `plan/CRITIQUE.md`'s late-stage global collapse row closed with
      the fresh reading + doctrine-repeal citation.
- [ ] `npm run verify` green.
- [ ] Build-plan row ticked.

## Follow-ups (out of scope)

- The three weakest late cells (`the-abortive`/`rangda` vs
  `turtle`/`mercy-seeker`, 13–23%) are a legitimate but small residual
  worth a future `/iterate` or tuning-pass look — not a design-level
  cliff, just the passive sim policies underperforming against the
  slowest enemies. Not filed as a new HIGH; the current doctrine has no
  target for them to violate.
- `fire-giant` reading 100% across every late policy is a separate,
  pre-existing "trivial fight" observation, out of this phase's scope.
- A future pass that needs exact late-cell numbers for a tuning decision
  should run `npm run baseline:regen` (full 3-seed) first — this phase's
  reduced-nightly reading is directional only.
