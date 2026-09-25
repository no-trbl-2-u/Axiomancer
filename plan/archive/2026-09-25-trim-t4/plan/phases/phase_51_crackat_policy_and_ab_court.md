# Phase 51 — GLYPHS follow-up 3: sim `crackAt` policy heuristic + the A/B promotion court

> Agent-facing brief. Concise, opinionated, decisive. Ship without asking;
> document judgment calls in the commit body. This phase closes the GLYPHS
> line's last named follow-up (33d → 49 → 50 → 51): give the sim bots a
> `crackAt` charge-threshold heuristic so they can play the "ripening
> dilemma" (crack a Seal now, small, vs. wait, bigger, riskier), then run the
> seeded A/B evidence WI-2's acceptance criterion 2 asks for.

## Re-scope call — the pilot cards no longer exist; re-author 2, lean, before wiring the sim

**Read this before anything else — it changes what "once mobile lets a
playtester observe real cracking behavior" actually means today.**

Phase 33d's 4 sandbox pilot cards (`glyph-of-suppuration`,
`ash-that-remembers`, `glyph-of-the-bulwark`, `ward-that-waits`) do **not**
exist in the current tree. `axiomancer-mechanics/src/Cards/cards.sandbox-sets.ts`
was reset to `{}` by the Profane Canon rework (`84ef85bd`, 2026-08-08 —
*after* 33d shipped but *before* 49/50): its own header comment says so
outright ("PROFANE-CANON RESET ... all cleared with the library rework").
The engine machinery (`Card.glyph`, `CardRider.glyphCharge`/
`glyphChargeFallback`, `crackGlyph`, `state.glyphs`) is untouched and fully
live — only the card *content* that ever puts a glyph into play is gone.
Net effect: today, in real play (mobile included), `state.glyphs` is always
empty. Phase 49/50's Seal chip row has literally never rendered outside a
hand-built test state.

Blocking on this (`[blocked: ...]`) is the wrong call — the fix is small and
squarely inside this phase's own remit (`cards.sandbox-sets.ts`'s header
comment names exactly this: *"the first `/deck-tuning` pass against the
Profane Canon authors the next generation of measurement-seat candidates
here"*). So: **Step 0 of this phase re-authors a lean 2-card sandbox set**,
then the `crackAt` sim work proceeds against it. This is a decisive
re-scope, not scope creep — without it there is nothing for a `crackAt`
policy to ever crack.

**Cut from the re-authored set, on purpose:** no FREE-line "pump" card this
time (33d had 4 cards — 2 inscribers + 2 pumps). The passive +1/round tick in
`processBetweenPhases` already accumulates charge every phase without any
pump card, which is enough to exercise the ripening dilemma (crack early and
small vs. wait N rounds for bigger-but-riskier). Halves the card-authoring
and pricing surface for a phase whose real deliverable is the sim/policy
code, not more content. Pump cards are a legitimate future follow-up, not a
cut-for-time gap.

## Design sources (read in this order)

1. `plan/phases/phase_33d_glyphs_pilot.md` — the engine grammar (inscribe →
   charge → crack), the payload formulas, the exact numbers already vetted
   (charge cap 3, poison `baseIntensity 1 / duration 2`, barrier
   `baseAmount 2`) and the pricing function built for them.
2. `axiomancer-mechanics/src/Cards/cards.pricing.ts:407` `glyphExpectedValue`
   — already implemented, unused since the reset. Prices a glyph at
   `cap / 2` accumulated charges, its own comment calling that "a reasonable
   crack timing... NOT the max/full-cap charges" per the design's ripening
   dilemma. This is the anchor for both the new cards' pricing AND the
   `crackAt` default below — reuse the same assumption, don't re-derive it.
3. `axiomancer-mechanics/src/Cards/card-themes.ts` — current Profane Canon
   themes. `rot` (POISON/BLEED/DOOM/RUPTURE/SIPHON/PROLONG/FESTER) is the
   home for the poison-payload glyph; `vigil` (GUARD/THORNS/RIPOSTE/BLEED/
   DOOM/FORETELL) is the home for the barrier-payload glyph. Both themes
   already carry non-glyph verbs the new cards' printed keywords should stay
   consistent with (use `mcp__axio-query__axio_cards`/`axio_keywords` to
   check current library siblings in each theme before wording).
4. `axiomancer-mechanics/src/Combat/combat.sim-policies.ts` — the
   `CombatSimPolicy` contract and the 8-policy roster. `stakesWhenInformed`
   (Phase 31/EA-7, "THE STAKE") is the closest precedent for this phase's
   shape: an optional decision-seam field that deliberately makes named
   policies diverge from their un-flagged siblings, and that divergence
   (not identical output) is the acceptance criterion.
5. `axiomancer-mechanics/src/Combat/combat.encounter.sim.ts` — the sim
   driver. `upgradeablePlayPhase` (starts line 375) is the **only** function
   to touch. `policyPlayPhase` (line ~498) explicitly delegates to it when
   the Upgradeable Dice flag is on, and Phase D-FLIP made that flag the
   default player/balance-witness model — legacy dice is now the frozen
   comparison mode. `policyPlayPhase`'s own body comment says it stays
   "byte-identical to the pre-spec-33 driver" because pinned sim e2e depend
   on it — **do not touch it**.
6. `plan/tuning/2026-07-10-audit-evidence/cross-new-mechanics.md` §WI-2 —
   acceptance criterion 2 is this phase's success bar: late-stage
   `statusEngagement` +10pp on the pilot cards' presence, mean rounds on a
   glyph-carrying line shifting 2.0-2.2 → 3-4 "by player choice", and the
   line *"bots should learn a `crackAt` threshold in the status policy"*
   verbatim.
7. `axiomancer-mechanics/docs/reports/deck-tuning-2026-07-19-promotions.md`
   — the evidence-table format to mirror for this phase's report (control →
   treatment (Δ) cells, Band status, Considered-but-not-applied, Follow-ups
   sections). This phase's "promotion" is a **policy heuristic**, not a
   card — see Decisions below for why full library promotion is explicitly
   out of scope.

## Decisions made upfront — DO NOT ASK

- **New sandbox set id: `GLYPHS_51_PILOT`** (distinct from the wiped 33d-era
  set — this is a fresh registration, not a restore). Registered in
  `cards.sandbox-sets.ts` per its own documented pattern
  (`registerSandboxCards`/`SandboxCardSet`).
- **2 cards, PAID inscribe only, reusing 33d's exact numbers.** Poison glyph:
  `glyph: { payload: { kind: 'poison', baseIntensity: 1, duration: 2 },
  cap: 3 }`, theme `rot`. Barrier glyph: `glyph: { payload: { kind:
  'barrier', baseAmount: 2 }, cap: 3 }`, theme `vigil`. Cost: 1 die (mirrors
  33d's inscribe grammar — PAID, dieless charge/crack come after). Price via
  `glyphExpectedValue` + the standard `scoreCard` verb-point path (same
  pattern every other card in `cards.library.ts`/sandbox sets uses); rarity
  follows whatever band the resulting points land in against current
  library siblings in `rot`/`vigil` — no rarity invented ad hoc.
- **`CombatSimPolicy.crackAt?: number`** — an optional charge-count
  threshold. Contract: once a glyph the player controls has
  `charges >= crackAt`, the policy cracks it (dieless, no source/die
  consumed). Absent = never cracks (the strict default — every existing
  policy's behavior is unchanged unless explicitly opted in below).
  Multiple eligible glyphs: pick the highest-charge one; ties resolve to
  `state.glyphs` array order (mirrors `glyphsOfKind`'s own "deterministic,
  no RNG" doctrine in `combat.engine.ts`).
- **Seam placement: `upgradeablePlayPhase`, alongside the existing
  signature-cast check** (`combat.encounter.sim.ts` ~line 422, `if
  (working.conviction >= policy.convictionThreshold) { ... }`). Add the
  crack check in the same `while (working.phase === 'phase-play' ...)`
  loop, same `continue`-on-state-change shape. Ordering: check signature
  cast first (existing), then crack-eligibility (new), then fall through to
  the powered-play die loop (existing) — a crack never blocks a signature
  or a die play in the same iteration, it just takes one guard-counted loop
  pass when it fires, same as a signature cast does today.
- **`crackAt` default = `ceil(cap / 2)` = 2** (cap is 3 for both payloads
  this phase), assigned to the policies whose doctrine already reasons
  about payoff timing rather than instant-value: `greedy`, `blind`
  (payoffs-on-time is literally in `greedy`'s description),  `dot-weaver`
  (erosion/poison-first witness — the poison glyph is its natural line),
  `turtle` (outlast/barrier witness — the barrier glyph is its natural
  line), `control-lock` (denial witness; barrier synergizes with holding a
  lock game). This is the SAME `cap / 2` assumption `glyphExpectedValue`
  already prices against — one number, reused, not re-derived per policy.
  Left `undefined` (never cracks): `aggro-brute` (the deliberately weak
  no-timing baseline — its underperformance is the design, per its own
  description), `chaos` (the random floor), `mercy-seeker` (befriend/spare
  focus, off-doctrine for this measurement). This is a first-pass,
  doctrine-consistent assignment, not an exhaustively tuned one — if the A/B
  evidence says a specific policy's threshold is wrong, that's `/iterate`
  follow-up work, not a blocker here.
- **"A/B promotion court" here means: does the crackAt-equipped roster
  measurably improve status engagement over the current shipped baseline
  (no glyph interaction possible at all, since no card exists to trigger
  it) — not a card-library promotion decision.** Gate-4's "register → A/B →
  promote" note (33d's own binding decision) still applies to the CARDS:
  they stay sandbox-only this phase. Only the `crackAt` policy field is a
  permanent, non-flagged engine change (same durability as
  `stakesWhenInformed`).
- **Evidence stages: pick 2, not the full ladder** — one early
  (`threadbare`) and one late (`apostate`), since WI-2's own acceptance
  criterion is specifically about the *late-stage* statusEngagement delta;
  early is the baseline/no-regression check. `npm run combat-playtest`'s
  full stage x policy matrix is available if the two-stage pass surfaces
  something worth widening, but isn't required to close this phase.

## Outputs

```
axiomancer-mechanics/src/Cards/cards.sandbox-sets.ts
  + GLYPHS_51_PILOT: SandboxCardSet — 2 cards (poison-glyph 'rot', barrier-glyph 'vigil')

axiomancer-mechanics/src/Combat/combat.sim-policies.ts
  ~ CombatSimPolicy: + crackAt?: number (JSDoc mirrors stakesWhenInformed's shape)
  ~ greedy, blind, dot-weaver, turtle, control-lock: + crackAt: 2
  (aggro-brute, chaos, mercy-seeker: no change — field left absent)

axiomancer-mechanics/src/Combat/combat.encounter.sim.ts
  ~ upgradeablePlayPhase: + crack-eligibility check in the phase-play loop,
    same position/shape as the existing conviction/signature check
    (policyPlayPhase — the flag-off legacy body — NOT touched)

axiomancer-mechanics/docs/reports/glyphs-crackat-promotion-<ship-date>.md
  (new) — the A/B evidence table + verdict, mirrors the deck-tuning
  promotions report format
```

## Tests

- `axiomancer-mechanics/src/Cards/e2e/cards-sandbox.engine.test.ts` (extend,
  existing pattern): `GLYPHS_51_PILOT`'s 2 cards resolve through
  `getCardById`/`toCombatCard` with no id collisions against the library or
  other sandbox sets.
- `axiomancer-mechanics/src/Combat/e2e/combat-sim-policies.engine.test.ts`
  (extend): a policy with `crackAt` set cracks its highest-charge eligible
  glyph once charges meet the threshold (build state with `glyphs` set
  directly + a policy stub carrying `crackAt`, drive one `phase-play` pass,
  assert a `glyph-cracked` event and `state.glyphs` shrinks by one); a
  policy with `crackAt` absent never cracks even with a glyph sitting at
  `cap`. Two-glyph tie-break case: highest charge wins; equal charges pick
  array order.
- `npm run verify --workspace axiomancer-mechanics` green (type-check +
  type-check:tests + lint + vitest + build).

## A/B promotion court (evidence pass, not a unit test)

```bash
# Baseline — today's shipped behavior, no glyphs ever in play.
npm run combat-playtest -- --stage=threadbare --policy=all --deck=policy-pick --runs=200 --seed=51001 --cards --json > /tmp/glyphs51-baseline-threadbare.json
npm run combat-playtest -- --stage=apostate   --policy=all --deck=policy-pick --runs=200 --seed=51002 --cards --json > /tmp/glyphs51-baseline-apostate.json

# Treatment — GLYPHS_51_PILOT live + crackAt-equipped roster.
npm run combat-playtest -- --stage=threadbare --policy=all --sandbox=GLYPHS_51_PILOT --deck=policy-pick --runs=200 --seed=51001 --cards --json > /tmp/glyphs51-treatment-threadbare.json
npm run combat-playtest -- --stage=apostate   --policy=all --sandbox=GLYPHS_51_PILOT --deck=policy-pick --runs=200 --seed=51002 --cards --json > /tmp/glyphs51-treatment-apostate.json
```

Same seed per stage across control/treatment (matches this repo's existing
A/B convention). Write the delta table into the new report: per-policy
`statusEngagement` and mean-rounds shift, apostate-stage delta is the
headline (WI-2 AC2), threadbare is the no-regression check. If a
`crackAt`-equipped policy's win rate drifts outside its stage's authored
band (CLAUDE.md's 80/50/25-35/0 curve), note it as a finding — do not
re-tune the roster's non-glyph `rankCard` logic to compensate; that's
`/deck-tuning` territory, log it as a follow-up instead.

## Cross-link retrofit

None — no new route/screen, no new mobile surface (Phase 50 already built
the Seal chip UI; it starts rendering for real the moment any deck can draw
these 2 sandbox cards in a `--sandbox`-flagged run).

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

## Commit body template

```
feat(mechanics): sim crackAt policy heuristic + GLYPHS A/B evidence (phase 51)

- re-authored GLYPHS_51_PILOT sandbox set (2 cards: rot-theme poison glyph,
  vigil-theme barrier glyph) — the 33d-era pilot set was wiped by the
  Profane Canon reset (84ef85bd); state.glyphs has been unreachable in real
  play since, so this is a prerequisite, not scope creep
- CombatSimPolicy gains crackAt?: number (charge threshold); greedy, blind,
  dot-weaver, turtle, control-lock crack at cap/2 (glyphExpectedValue's own
  "reasonable crack timing" assumption, reused not re-derived); aggro-brute,
  chaos, mercy-seeker left never-cracking, doctrine-consistent
- decision seam wired into upgradeablePlayPhase only — the flag-off legacy
  policyPlayPhase body stays byte-identical per its own pinned-e2e comment
- A/B evidence (threadbare + apostate, seeded, control=no-sandbox vs.
  treatment=GLYPHS_51_PILOT live): see
  axiomancer-mechanics/docs/reports/glyphs-crackat-promotion-<date>.md

Decisions:
- cut the FREE-line "pump" cards from the re-authored set (33d had 4 cards,
  this phase ships 2) — the existing +1/round passive charge tick alone
  exercises the ripening dilemma; pump cards are a content follow-up, not a
  cut-for-time gap
- "A/B promotion court" scoped to the crackAt HEURISTIC, not the CARDS —
  Gate-4's register->A/B->promote rule (33d, still binding) keeps the 2
  cards sandbox-only; only the policy field is a permanent engine change
- crackAt thresholds assigned by doctrine-fit (which policies already
  reason about payoff timing), not per-policy tuned — a first pass,
  documented as such, follow-up work if the evidence contradicts it

Closes #<phase-issue-number>
```

## DoD

Flip Phase 51 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append the
commit hash, separate commit (`plan: phase 51 shipped — sim crackAt policy
heuristic + GLYPHS A/B evidence`).

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- FREE-line "pump" cards for the GLYPHS_51_PILOT set (cut above).
- Per-policy `crackAt` tuning beyond the doctrine-fit first pass, if the A/B
  evidence shows a specific assignment underperforms its policy's intent.
- A real preset/library promotion decision for the 2 sandbox cards — stays
  gated on Gate-4's register→A/B→promote sequence; this phase only produces
  the A/B evidence for the crackAt heuristic, not a promotion verdict for
  the cards themselves.
- SOUL/Harvest parity for glyph expiry/consumption (33d follow-up, still
  open, still only relevant once/if Harvest gets its own glyph card).
