# Phase D7 — Tuning, economy ratification + honest re-baseline

> Agent-facing brief. The D-batch closes here: ratify the economy D3
> derived and D4 applied, prove the doctrine win-curve on the new model,
> re-baseline honestly, and decide the flag flip. Report-heavy; numeric
> changes only where ratification demands them.

## Inputs

1. Spec 33 §7 **D7 gates** (win curve, statusEngagement) + §5 (economy
   ratification mandate).
2. D3's derived-constants report; D4's pricing; D5/D6 shipped surfaces.
3. `axiomancer-mechanics/CLAUDE.md` doctrine blocks (status is the main
   fun; 80/50/25-35/0 starter curve) + the statusEngagement blind-spot
   memory (enemy-side-only, volume, arc-blind — STATE them in the report).

## Scope

- **Full matrix**: `/combat-playtest` stage-profile × policy matrix,
  flag-on, seeds ≥ 5, all 10 starter presets × 4 stages, against
  early ~80 / mid ~50 / late 25–35 / impossible 0.
- **Economy ratification**: adopt-or-adjust D3's signature/ante table +
  blacksmith pricing (D5's placeholders die here); Press Fate 1◆ and
  payload 2◆ are owner-locked — if the data says they're wrong, that is
  a `[needs-user-call]`, not a tweak.
- **Dice-valve promotion** (assigned 2026-07-18 drift check — this was
  falling through the cracks): the 9 per-theme dice-interaction cards D4
  sandbox-staged (`dice-valves-33`, `cards.sandbox-sets.ts`) fulfill
  spec 33 §4 valve 3 ("every theme gains exactly ONE dice-interaction
  card") only once promoted into the curated library. Route through
  `/deck-tuning` sandbox-first conventions; promotion evidence goes in
  this phase's report. D4 deferred this to D5; D5 shipped without it —
  the deferral chain ends here.
- **Qualitative pass**: playtester agents on seeded encounters — is
  momentum steering fun, does whiff feel survivable, do stance checks
  read, does the blacksmith fantasy land (visible miss-deletion is the
  genre's core promise — check it FEELS that way).
- **Honest re-baseline**: `npm run baseline:regen` on the final state;
  statusEngagement re-baselined with blind spots stated; doctrine-curve
  deltas vs the flag-off baseline reported side-by-side.
- **Flag decision**: recommend flip-on-by-default (with evidence) —
  the flip itself is an owner call.
- **PROVISIONAL check-in**: report what special-on-use felt like in
  playtests so the owner can keep or flip to fires-on-roll.

## Decisions made upfront — DO NOT ASK

- The curve bands are the objective function — tune candidates route
  through `/deck-tuning` conventions (sandbox-first) when cards move.
- Starter presets overperforming late = dominance finding, not success.

## Surface as `[needs-user-call]`

- The flag-default flip.
- Any owner-locked number (1◆ Press Fate, 2◆ payload, face tables) the
  data indicts.
- The PROVISIONAL special-on-use keep/flip.

## Prove (DoD)

- Report PR: matrix vs bands, ratified constants table, STAKE-gap final
  word, re-baseline stamp, playtester findings, flag recommendation.
- Band assertions promoted to hard sim tests where ratified.
- Flip D7 `[x]` + Phase log + hash; file follow-up residue to
  `plan/PHASE_CANDIDATES.md` / `plan/AUDIT.md`.

## Follow-ups

- Owner flag flip; scripted-first-fight candidate (extracted from Fate
  Engine P3) sequences after this; 33c unblocks post-D2 but plays best
  against the tuned model.
