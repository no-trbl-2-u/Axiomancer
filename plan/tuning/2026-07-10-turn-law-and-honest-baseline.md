# Gate 0 — the round-turn law and an honest baseline (2026-07-10)

> Blocks every numeric tuning decision. Evidence:
> `2026-07-10-audit-evidence/cross-puzzle.md` (P1, P5, P6, P8),
> `.../baseline.md` (harness gaps), independently re-verified in-session
> against combat.engine.ts:411-416, combat.encounter.sim.ts:199-252,
> combat.cli.ts:270-326, CombatEncounterPanel.tsx:416-425.

## 1. Enforce the round-turn law in the engine  [CONFIRMED · M · engine]

**Problem.** Nothing in the engine ties dice-turns to enemy phases.
`startTurn` re-rolls a fresh 3-die tray any time the draft slot is empty
and the phase is `phase-play`. The mobile UI and interactive CLI happen to
play one turn per enemy phase; the sim policies and auto CLI farm
`endTurn → startTurn` loops (up to 60 per phase, ~4.7 dice-turns per enemy
action) — earning Conviction per unpicked die each cycle under the
2026-07-09 dice law (colored +1 / wild +2). The rule the player experiences
lives only in UI wiring; the engine permits a different, much richer game.

**Fix.** One dice-turn per threat phase becomes an engine invariant:
- `startTurn` refuses (returns `{state, events:[]}` with a
  `turn-law-blocked` event) when a turn has already been taken this phase;
  `resolveThreatPhase` resets the flag.
- New state field (e.g. `turnTakenThisPhase: boolean`) on
  `CombatEncounterState`; migration default false.
- Sim policies + auto CLI rewritten to play within the law (draft once,
  play out the hand legally, END). Their play-out loops keep the guard
  counters but the guard should never bind.
- e2e pin: a test that calls `startTurn` twice inside one phase and
  asserts the second is a no-op.

**Files.** `src/Combat/combat.engine.ts` (startTurn, resolveThreatPhase),
`src/Combat/combat.encounter.types.ts`, `src/Combat/combat.encounter.sim.ts`,
`src/CLI/combat.cli.ts` (autoPlayPhase), tests in `src/Combat/e2e/`.

**Watch.** Reserve dice and floating dice legitimately power extra card
plays within the one turn — the law caps TRAY ROLLS per phase, not card
plays. Do not break the multi-float turn (owner-locked: ALL floats may be
spent in one round).

## 2. Fix the auditor tooling  [CONFIRMED · S · tooling]

Three gaps that made this audit harder than it should have been and will
make the re-baseline untrustworthy if unfixed:

- **Auto mode emits no turn-by-turn transcript** even with
  `--json-events` (only `--state-log` JSONL). Add per-play events to auto
  mode so qualitative audits don't need bespoke harnesses (an auditor had
  to write `transcript-harness.charm-audit.ts` — now in the evidence dir —
  to get honest transcripts).
- **Per-card DoT attribution doesn't clamp overkill**: 740 DoT attributed
  against a 40-max-HP enemy. Clamp attribution at damage actually applied.
- **`npm run combat -- --stage X` scales only the PLAYER** (enemy stays
  the default `little-belle`, combat.cli.ts:164) — a 255-HP-vs-40-HP stomp
  that reads as engagement. Either require `--enemy` with `--stage`, or
  default the enemy to the stage roster.

**Files.** `src/CLI/combat.cli.ts`, `src/Combat/combat.attribution.ts`.

## 3. Re-derive the baseline  [DONE 2026-07-11 · S · measurement]

> Satisfied by `2026-07-11-phase27-rebaseline.md` (Phase 27). Honest
> stage curve: early 75% / mid 3% / late 0% / impossible 0% — mid/late
> were almost entirely farm-propped, not merely farm-inflated.
> `KNOWN_CURVE_VIOLATORS` confirmed empty. Repricing (#4 below) is now
> unblocked but must account for a much larger mid/late gap than the
> farmed numbers ever suggested.

Re-run the full matrix (`--stage=all --policy=all`, ≥60 runs/cell, plus
per-card tables) under the law. Re-derive:
- the stage curve vs the locked 80/50/25-35/0 doctrine (the current
  99/94/3/17 reading is farm-inflated at early/mid and possibly
  farm-DISTORTED at late — 4 of 6 late enemies killing in exactly 3.0
  rounds with zero variance over 30 runs is a scripted loss, not a fight);
- `KNOWN_CURVE_VIOLATORS` and the balance-band pins
  (`combat-playtest.balance-bands.sim.test.ts`);
- statusEngagement by stage (the doctrine witness collapsed 66→34→22→16%
  across stages in the farmed data — if that shape survives the law, it is
  the single loudest doctrine failure);
- signature damage share and dead-card rate (69% of the library never
  played across blind+greedy; 48% even with all eight policies).

Every plan/tuning number dated before 2026-07-10 gets an asterisk until
this lands. That includes `2026-07-08-win-path-scaling.md` — its
structural findings (flat alt-win thresholds) almost certainly survive,
its magnitudes do not.

## 4. Reprice the Conviction/signature economy  [CONFIRMED · M · tuning]

**Only after #3.** Under farmed income, `sig-conviction-strike` (7◆,
combat.signature.ts:50-53) dealt 90-95% of ALL damage in transcripts — the
70-card library was garnish around a token battery. The 2026-07-09 dice
law roughly doubled legal token income (2 unused dice/turn), so some
monoculture likely survives the law. Levers, in preference order:
1. Signature costs / effects priced against honest income (watch
   `convictionThreshold` in sim policies — re-pin decision sequences).
2. Signatures made theme-flavored rather than generic (the deck's rare
   finisher should outshine a generic poison bolt) — couples to Gate 2.
3. Conviction sinks that are DECISIONS, not upkeep (THE STAKE, Gate 4,
   is designed as exactly this).

## 5. Fold the near-unconditional color-match bonuses  [CONFIRMED · S · tuning]

`COLOR_MATCH_DAMAGE_BONUS = 3` (combat.engine.ts:90) and the R7
+1-duration match bonus fire on virtually every legal play under the color
law (only fate-X plays don't match). A bonus that always fires is a
printed number wearing a costume — fold both into authored card numbers
and delete the constants. Flagged in the 2026-07-09 handoff; confirmed by
the audit; zero design risk, pure legibility.

**Files.** `src/Combat/combat.engine.ts`, card numbers in
`src/Cards/cards.library.ts`, pricing comments, affected pins.

## Order

1 → 2 → 3 (one PR each; #3 is a measurement pass, not code) → 4 and 5
in either order. Nothing in Gates 1-4 that is numeric merges before #3
reports.
