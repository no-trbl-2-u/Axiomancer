# Phase 33b — Enemy archetypes + variable-rung telegraphs (engine + content)

> Agent-facing brief. Concise, opinionated, decisive. Ship without asking;
> document judgment calls in the commit body. Written retroactively
> alongside implementation — the design was already fully scoped by Phase
> 33a's brief (`plan/phases/phase_33a_reactive_verb_core.md` § Follow-ups),
> reviewed with `mechanics-expert` in that same pass; this brief records the
> concrete authoring decisions that scope leaves open.

## Outcome

Two things the bestiary and the telegraph UI couldn't do before this phase:

1. **The three counterplay archetypes are actually authorable.** Phase 33a
   shipped the `swayCleanse`/`premiseShed` engine hooks but nothing let a
   plain authored phase set them (only a hardcoded WS9 branch special case
   could ever set `enemyCleanse`, and only at magnitude 1). CAUTERIZE
   (enemy sheds its own afflictions), Premise-shed (enemy sheds the
   player's spendable Premise), and SWAY-cleanse (enemy sheds the player's
   live SWAY) are now plain fields on `AuthoredThreatPhase`, usable on any
   linear or branch phase. 2-3 mid/late enemies per class exercise them.
2. **STAGGER rungs are variable, not a flat 2/boss-3 constant.** A phase
   can author its own `rungs` (1-4), overriding the difficulty-derived flat
   default, so STAGGER reads as a sized answer to a sized threat instead of
   an always-on denial (`plan/tuning/2026-07-10-turn-texture.md` §3). The
   mobile telegraph, which previously showed rung count NOWHERE (confirmed
   via `Explore` sweep — `IntentIcon` rendered only the wall-math
   denied/net-damage chips), now shows it as a filled/hollow pip row.

## Scope decision — touched enemies only, not the full 56-sequence roster

The 2026-07-10 turn-texture doc flags variable rungs as "L-effort: touches
56 authored threat sequences" — that's the cost of giving EVERY authored
phase in the roster its own considered rung count. This phase does not
attempt that. It authors rungs (in both directions — some phases softened
below the flat default, some hardened above it, proving the lever isn't a
one-way escalation dial) only on the same 5-6 enemies already being touched
for the counterplay hooks, where a rung call is a real, motivated authoring
decision alongside the hook. Every other authored phase in the roster keeps
its flat difficulty-derived default, byte-identical to before — the
engine's fallback (`computeRungDenial`, `combat.engine.ts`) guarantees this:
an unauthored `phase.rungs` (`undefined`) falls through to the exact same
`THREAT_RUNGS`/`THREAT_RUNGS_BOSS` constants as before this phase shipped.

**Follow-up, not this phase's job:** a full-roster variable-rung authoring
pass (or a `/deck-tuning` balance sweep of the remaining ~50 sequences) is
explicitly out of scope — see Follow-ups below.

## Enemy selection (2-3 per class, mid/late tier spread)

Picked for thematic fit against existing lore text (no rewritten prose
needed — the hook's mechanical parenthetical, e.g. "sheds 1 affliction",
appends onto the existing `actionText` the same way `enemyCleanse`/
`enemyHeal` already do):

| Class | Enemy | Difficulty | Existing flavor line reused |
|---|---|---|---|
| CAUTERIZE (`enemyCleanse`) | Tri-Eyes *(pre-existing, WS9 branch)* | normal | — |
| CAUTERIZE | Fire Giant | elite | "old fire thinks slowly... like cooling stone" |
| CAUTERIZE | Elder Fire Giant | boss | "outlived its own eruption" |
| Premise-shed (`premiseShed`) | The Sophist | boss (labyrinth) | "strikes your best premise from the record" — the class's flagship literal match |
| Premise-shed | Zoma, Twin-Voiced | elite | "deemed redundant" |
| SWAY-cleanse (`swayCleanse`) | Lady Gabriella | elite | "clinical accuracy" |
| SWAY-cleanse | Rangda | boss | "recites the syllabus of... accusation" |

Magnitudes: `enemyCleanse: 1` (matches the Tri-Eyes precedent — the "fraction,
never the last" guardrail is enforced again at resolution regardless of the
authored number). `premiseShed: 2-3` and `swayCleanse: 2-3`, sized against
`concedeFloorFor`/`capitulateThreshold` (Phase 33a brief §5): a normal/elite
CONCEDE floor is 8-10 Premise, so shedding 2-3 per fire is a meaningful
~20-30% bite without being a single-phase reset. Fine-tuning the exact
numbers against live win-rate data is a `/deck-tuning` concern, not this
hook's — same deferral Phase 33a's brief already made explicit.

## Outputs

```
axiomancer-mechanics/src/Combat/combat.encounter.types.ts
  + CombatThreatBranchOutcome.rungs?: number
  + CombatThreatPhase.rungs?: number
axiomancer-mechanics/src/Combat/combat.threat.ts
  + AuthoredThreatPhase.enemyCleanse? / .swayCleanse? / .premiseShed? / .rungs?
  ~ buildThreatAction: enemyHeal/enemyCleanse/swayCleanse/premiseShed collapsed
    into one `riders` object param (was 2 positional args, growing to 5)
  ~ resolveBranchOutcome: reads p.enemyCleanse ?? implicitCleanse (explicit
    authoring wins over the WS9 afflictions-gte implicit fallback), plus
    p.swayCleanse/p.premiseShed/p.rungs, all newly threaded through
  ~ resolveAuthored: linear-phase branch now passes enemyCleanse/swayCleanse/
    premiseShed/rungs from the authored phase (previously only enemyHeal)
axiomancer-mechanics/src/Combat/combat.engine.ts
  ~ computeRungDenial: naturalRungsTotal reads the current phase's authored
    `rungs` (clamped 1-4) when present, else the original flat default —
    unauthored phases behave byte-identical
  ~ projectIncomingThreat: return type gains rungsTotal/rungsLost (the wall-
    math readout mobile already consumes) — was computed internally but
    never surfaced
axiomancer-mechanics/src/Combat/combat.threat-sequences.ts
  ~ 6 enemies (see table above) gain one hook field + one rungs field each
    on an existing authored phase — no new phases, no new enemies
axiomancer-mechanics/src/Combat/e2e/phase-33b-enemy-archetypes.engine.test.ts
  + new hermetic e2e (pattern: threat-branches.engine.test.ts's real-enemy
    getThreatSequence approach) — authoring assertions per enemy, live-fire
    assertions for one enemy per class, and rung-override engine behavior
    (both directions, plus an unauthored-phase regression check)

axiomancer-mobile/state/presenters/combat-encounter.engine.ts
  ~ CombatIntentVM.wallMath gains rungsTotal/rungsLost, sourced from
    projectIncomingThreat
axiomancer-mobile/components/combat/encounter/IntentIcon.tsx
  + a filled/hollow pip row (testID combat-intent-rungs) under the existing
    wall-math chip, plus an a11y sentence stating the rung magnitude
axiomancer-mobile/components/combat/encounter/__tests__/IntentIcon.test.tsx
  ~ existing wallMath fixtures gain rungsTotal/rungsLost
  + 3 new tests for the pip row + a11y text
```

## Decisions made upfront — DO NOT ASK

- **Explicit authored `enemyCleanse` wins over the WS9 implicit
  afflictions-gte fallback**, not the reverse — an author who wants a
  DIFFERENT magnitude than the legacy branch's hardcoded `1` needs an escape
  hatch; falling back only when nothing explicit is authored preserves
  Tri-Eyes/Tezcatlipoca byte-identical.
- **`buildThreatAction`'s trailing params collapsed into a `riders` object**
  rather than growing to 7 positional args (`enemyHeal, enemyCleanse,
  swayCleanse, premiseShed` — an easy-to-transpose-by-accident shape).
  Touched anyway for the new fields; the alternative (positional) is worse
  ergonomics for the exact call sites this phase adds.
- **`rungs` clamped to [1, 4] inside `computeRungDenial`**, not trusted
  raw from authoring — matches the spec's stated ceiling
  (`plan/tuning/2026-07-10-turn-texture.md` §3: "1-4 rungs instead of flat
  2/3") and keeps a future authoring typo from producing a 0-rung
  always-denied or 50-rung unstrippable phase.
- **Rungs authored in BOTH directions** (Zoma/Sophist opening phases
  softened below their natural default; Elder Fire Giant's finale hardened
  to the ceiling) — a demo that only ever raised rungs would read as a
  stealth difficulty-up, not the "sized answer to a sized threat" the spec
  frames it as.
- **No new `CombatEvent` for rung authoring.** Rungs are a denial-math
  input, not a fired effect — nothing needs to log "this phase had N rungs"
  the way `threat-sway-cleansed` logs an application. The existing
  `rung-regrown` event (boss anti-permalock) is unrelated and untouched.
- **Mobile pip UI renders unconditionally** (every enemy intent, not just
  the 6 touched this phase), not gated behind "only show when non-default."
  The underlying STAGGER-rung mechanic is universal; making its cost
  legible for every enemy — not just the ones authored this tick — is the
  actual "sized answer to a sized threat" payoff and costs nothing extra
  (the flat-default enemies just show their existing 2/3 pips, previously
  invisible).
- **No copy changes to the STAGGER keyword gloss**
  (`axiomancer-mobile/state/combat/keywords.ts`) — it was already corrected
  2026-07-12 to say "removes that many rungs (the steps of the enemy's
  telegraph)" without stating a fixed count, specifically anticipating this
  variability.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
```

Both touched; `CombatThreatPhase`/`CombatIntentVM` are public-surface
changes (additive-only) consumed across both packages.

## Deploy gate

```bash
npm run deploy:check
```

Touches `axiomancer-mechanics/**` and `axiomancer-mobile/**` -> both
path-filtered verify workflows.

## DoD

Flip Phase 33b `[ ]` -> `[x]` in `plan/steps/01_build_plan.md` (both
duplicate rows — a pre-existing data glitch in the build plan, corrected in
the same commit), append the commit hash.

## Follow-ups (out of scope this phase)

- Full-roster variable-rung authoring pass (the remaining ~50 sequences) —
  `plan/tuning/2026-07-10-turn-texture.md`'s own L-effort estimate; a
  `/deck-tuning` or dedicated-phase concern, not a `/ship-a-phase` tick.
- Balance tuning of the specific `enemyCleanse`/`swayCleanse`/`premiseShed`
  magnitudes per enemy against live win-rate data — `/deck-tuning`.
- Extending the counterplay classes to more enemies within the same 3
  archetypes, or to additional archetypes (rung-regrowth is already
  shipped separately; nothing else is currently specced).
- The build-plan row's literal duplicate ("Phase 33b" listed twice,
  byte-identical) predates this phase and is a plan-hygiene nit, not a
  design gap — corrected mechanically alongside the DoD tick, not treated
  as separate scope.
