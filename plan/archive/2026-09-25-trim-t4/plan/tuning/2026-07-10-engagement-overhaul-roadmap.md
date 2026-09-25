# Engagement overhaul — the roadmap (2026-07-10 audit)

> **Source:** 33-agent fan-out audit (10 theme auditors playing their own
> preset decks + 5 cross-cutting lenses + adversarial skeptics per report +
> completeness critic; ~3.8M tokens, 1,279 tool calls). Raw reports with
> transcripts, matrix tables, and KB receipts:
> `plan/tuning/2026-07-10-audit-evidence/`. Every proposal below survived
> an adversarial refutation pass (verdicts CONFIRMED/PLAUSIBLE); 10
> proposals were REFUTED and are recorded in the evidence files, not here.
>
> **Owner brief this answers:** do the 10 themes feel different and
> engaging? What are they missing? What out-of-flow mechanics (floating-die
> class) could exist? Should "momentum" be theme-scoped? How does
> "less-than-mediocre" deck combat become an exhilarating, intuitive puzzle
> where the player is excited for the NEXT fight?

## 0. The one finding that gates everything else

**The engine has no round↔turn law, and every number we have was measured
on the wrong game.** `startTurn` (combat.engine.ts:411-416) gates only on
`phase === 'phase-play'` + an empty draft slot — nothing ties dice-turns to
enemy phases. The mobile panel plays the intended game (END PHASE →
`resolveThreatPhase` → one fresh tray per enemy action;
CombatEncounterPanel.tsx:416-425), and so does the interactive CLI. But the
sim policies (combat.encounter.sim.ts:199-252) and the auto CLI
(combat.cli.ts:270-326) loop `endTurn → startTurn` up to 60 times **inside
one enemy phase**, re-rolling trays and farming Conviction (~4.7 dice-turns
per enemy action measured). Verified independently in this session — this
is not one auditor's opinion.

Consequences, in order of pain:

- The measured curve (early 99% / mid 94% / late 3% / impossible 17%
  against the locked 80/50/25-35/0 doctrine), the `KNOWN_CURVE_VIOLATORS`
  pins, the 2026-07-08 win-path-scaling numbers, and the balance-band
  tests were all calibrated against a resource-farm the real player
  doesn't have.
- The Conviction-signature monoculture (sig-conviction-strike dealing
  90-95% of all transcript damage; dead-card rate 69%) is measured under
  farmed token income — real severity unknown until re-measured.
- Qualitative findings SURVIVE the bug (autopilot shapes, identity
  collapse, dead decisions are about decision texture, not win rates).
  Quantitative claims in every evidence file carry this asterisk.

**Nothing numeric gets tuned until the turn law lands and the baseline is
re-derived.** Work: `2026-07-10-turn-law-and-honest-baseline.md`.

## 1. Diagnosis — why it feels less than mediocre

Five compounding pathologies, each independently verified:

1. **The hidden-information layer is worth zero.** Greedy (sees hidden
   stances) equals blind cell-by-cell across 1,020 fights — 0pp gap at
   every stage. At mid, uniform-random play (chaos) beats every informed
   policy (100% vs greedy's 94%). Card choice is currently texture, not
   puzzle. (Farm-inflated in magnitude, but a 0pp read value survives any
   rescaling — the read pays a +1 Conviction trickle vs the color law's
   binary veto.)
2. **One turn presents at most one live decision.** The color law makes
   the hand pick the die; the stance reveals only AFTER the draft commits;
   FREE lines are mostly `tickOne`/`draw 1` chips played on autopilot.
   Transcript smoking gun: affliction seed 3 rolls [wild, wild, wild] on
   turn 54 and plays exactly as it played [x, x, x] on turn 49.
3. **Nine of ten themes are affliction wearing different robes.** Every
   theme auditor independently named their nearest neighbor, and 8/10
   named affliction/erosion (harvest, akrasia, control, oracle, bulwark,
   echo, charm-as-played, peroration-as-played). Median distinctiveness
   4/10, median engagement 3/10. Only charm occupies a genuinely unique
   mechanical axis (SWAY → CAPITULATE), and its threshold math is broken
   at late. The engines-of-record are: plant DoT → detonate → let
   sig-conviction-strike finish.
4. **Setup→payoff arcs are amputated.** RUPTURE's flat cap makes
   detonate-ASAP strictly dominant (the ramping poison curve is
   decoration); REAP's bank never ripens before the fight ends; The
   Overtake fires for 18 on turn 1 with zero pips; fights end in 2-3
   rounds so nothing ever "builds." The anticipation the owner wants
   ("excited for the next fight") has no in-fight rehearsal.
5. **The engine is invisible.** Premises have zero UI rendering; the
   BACKFIRE drip is unattributed; rupture fuel/cap previews exist
   engine-side (projectRupture, combat.engine.ts:2009) but never reach a
   surface; CONCEDE wins arrive "with zero fanfare against enemies at ~70%
   HP." Players can't love an engine they can't see.

## 2. The dream, restated as testable properties

An exhilarating, intuitive puzzle means, concretely:

- **P-READ:** knowing the enemy's next move changes your best line
  (greedy-vs-blind gap > 0 and growing by stage).
- **P-TURN:** ≥2 genuinely live options on a typical turn; the tray roll
  changes your plan (a triple-wild turn should feel like a jackpot).
- **P-ARC:** every theme has a felt setup→spike arc ≥2 turns long, with a
  visible gauge filling toward it.
- **P-IDENT:** a blindfolded player can name the theme from the shape of
  three turns (not from card names).
- **P-NEXT:** at fight end, something persists or beckons (a float, a
  charged glyph, a bottled DoT, a wheel state) that makes the next fight
  a plan, not a reset.

Every work item below cites which property it serves.

## 3. Sequencing — five gates

### Gate 0 — honesty (do first, everything else re-measures after)
`2026-07-10-turn-law-and-honest-baseline.md`
- Enforce the round-turn law in the engine (not just the UI).
- Fix auditor tooling (auto-mode transcripts, overkill-clamped
  attribution, `--stage` scaling the enemy roster).
- Re-derive the baseline + curve bands; THEN reprice the signature
  economy and fold the near-unconditional color-match bonuses into
  printed numbers.

### Gate 1 — the turn becomes a puzzle (P-READ, P-TURN)
`2026-07-10-turn-texture.md`
- The FREE-line rework — the owner's parked design signal, now the
  fulcrum. Two shapes on the table (constrain-the-fork vs
  replace-the-fork); **owner session required**.
- Make the read worth money: THE STAKE (wager Conviction on the hidden
  stance, paid in floats) — the cheapest intervention that creates a
  greedy-vs-blind gap without touching the locked color law.
- Ship the minimum spec 29/30 slice: one reactive verb + the lethality
  readout, so the telegraph asks "race it or answer it?" every turn.

### Gate 2 — themes earn their names (P-IDENT, P-ARC)
`2026-07-10-theme-identity.md`
- Per-theme confirmed work items (all 10, from the theme auditors).
- Three deep reworks (harvest, echo, bulwark — the themes with no
  functioning axis), DoT-clock differentiation, enemy counterplay
  (CAUTERIZE-class), alt-win repairs (charm resolve milestones,
  peroration visibility + closing-word fix).

### Gate 3 — the language reads at a glance (supports all P-*)
`2026-07-10-keyword-registry.md`
- The "30-keyword" registry is really ~45 player-facing terms; fold the 6
  unmapped debuff ids, merge/retire ghosts, single-source the registry
  with parity lints, glossary for system nouns.

### Gate 4 — out-of-flow mechanics + momentum (P-NEXT)
`2026-07-10-out-of-flow-mechanics.md`,
`2026-07-10-momentum-scoping.md`
- The floating die stops being a monopoly: THE STAKE → THE COVETED DIE →
  GLYPHS as one coupled batch sharing the float currency.
- Momentum: the audit found FOUR things named momentum (see the scoping
  doc — including the mobile momentum WHEEL the fan-out itself missed).
  Ratified 2026-07-10: wheel goes engine-native and stays GLOBAL, keeps
  the name MOMENTUM; themes get wheel-bending cards; the other claimants
  rename.

## 4. Owner-call queue — RESOLVED 2026-07-10 (decisions of record)

All four blocking calls were ratified by the owner on 2026-07-10:

1. **FREE-line shape → Option A, constrain the fork, with amendment:**
   every FREE line deposits theme currency; a weak-enough deposit may
   ALSO carry a `DRAW 1`-class utility kicker (generic draw alone stays
   banned). Lint enforces both halves. Option B not ratified; GLYPHS may
   pilot its grammar in sandbox. (`2026-07-10-turn-texture.md` §1.)
2. **Momentum → wheel global, engine-native, keeps the name MOMENTUM;**
   hazard's carry system renames (replacement word picked at spec time);
   `buff_grace_momentum` renames. (`2026-07-10-momentum-scoping.md`.)
3. **TICK → killed entirely** (the strong form): out of the registry;
   PAID tick effects re-author as theme verbs; no new TICK lines
   anywhere. (`2026-07-10-keyword-registry.md` KW-4.)
4. **DoT clocks → distinct triggers** per family (e.g. BLEED per damage
   instance, POISON per card played, MARK amplifies on payoff — exact
   triggers specced in EA-7). (`2026-07-10-theme-identity.md` §1.)

Standing arbitrations (not owner calls, recorded for the loop):
- **Hidden-stance read stays hidden** — reveal-before-draft proposals
  REJECTED; they delete the read the locked dice law defines. The read
  gets monetized (STAKE) instead of removed.
- **Case-by-case card audit** from the 2026-07-09 handoff (tu-quoque's
  dead line et al.) — folded into Gate 2 per-theme items.

## 5. What this audit did NOT cover (flagged by the completeness critic)

Honest gaps, each a candidate follow-up audit:

- **Enemy-side design** as designed objects: the 56 authored threat
  sequences, boss identity, the escalation clock, and why four late
  enemies kill in a zero-variance 3.0 rounds.
- **The inter-fight meta loop** — card acquisition, rewards, deck growth;
  the literal "excited for the NEXT fight" psychology. The audit ran on
  frozen 15-card presets. P-NEXT items are a down payment, not the loop.
- **Tutorialization** of the vocabulary (~12 terms per preset is fine;
  the order and fights that teach them are undesigned) — couples to the
  preset-deck-tutorial rethink already in plan/CRITIQUE.md.
- **Mobile touch-UX feasibility** for the ~40 surviving proposals (only
  the new-mechanics lens screened for drag grammar).
- **Difficulty-curve repair ownership** — the late-stage wall and
  the-incompleteness winning 17% (locked identity: 0%) have findings but
  no owning work item until the Gate 0 re-baseline says what's real.
- **Befriend/mercy** — zero fires in ~1,290 fights, even from the
  mercy-seeker policy. CAPITULATE and CONCEDE have repairs in Gate 2;
  Befriend has none anywhere. Needs its own pass.

## 6. Reading order for the evidence

- `2026-07-10-audit-evidence/dossier.md` — rules-as-of-today, one page.
- `.../baseline.md` — the matrix + transcript pathologies (asterisked by
  Gate 0).
- `.../theme-<name>.md` ×10 — per-theme play evidence; §identity and
  §autopilot are the parts to read first.
- `.../cross-puzzle.md` — turn anatomy; the round-turn-law finding.
- `.../cross-prior-art.md` — the differentiation matrix; KB receipts.
- `.../cross-keywords.md`, `.../cross-momentum.md`,
  `.../cross-new-mechanics.md` — feed Gates 3-4.
- Skeptic verdicts + fact errors are appended per report; ~50 factual
  errors were caught and the corrected claims are what appear in these
  plan docs.
