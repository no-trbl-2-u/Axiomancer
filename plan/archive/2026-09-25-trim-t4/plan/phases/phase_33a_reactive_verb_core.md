# Phase 33a — Reactive-verb core: sway/premise counterplay hooks (engine depth)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document judgment calls in the commit body.

## Design note — the build-plan row's premise is stale; this brief re-scopes

The row reads: "Reactive-verb core: one reactive verb engine-wide +
enemy-side lethality readout (the foundational engine hooks the
archetypes ride on)," citing specs 29/30 and
`plan/tuning/2026-07-10-turn-texture.md` §3, and flags itself:
"Refresh the brief with `/plan-a-phase phase 33a` before pickup —
design may have drifted since 2026-07-10." It has drifted — both
named deliverables are **already shipped**, under different names,
by intervening work:

- **"One reactive verb engine-wide"** = WS9 threat-branch (spec 32
  §12 item 7, ratified 2026-07-11): `CombatThreatPhase.branch?:
  CombatThreatBranch` — a condition + fully-resolved `then`/`else`
  fork, committed at phase START, zero RNG, telegraphed (mobile
  shows condition + both outcomes pre-commit —
  `IntentIcon.tsx`/`combat-encounter.engine.ts` render it generically
  off authored text, no hardcoded verb). Two prototype enemies
  (Tri-Eyes, Tezcatlipoca) already exercise it end-to-end
  (`threat-branches.engine.test.ts`).
- **"Enemy-side lethality readout"** = `projectCombatOutcome`
  (Phase 2: `pendingDot`/`roundsToKill`/`isLethalInFlight`) plus the
  "wall-math" projected-threat-vs-guard readout (Phase 28, "Show the
  Engine": `projectedDamage`/`willDeny`/`netDamage` in
  `combat.engine.ts` ~line 4400). Both are live in mobile today
  (`IntentIcon.tsx` renders wall-math DENIED/→N chips + full a11y).

Spec 29/30 predate the VITAE/HP-funnel architecture (they cite
`pressureTracks`/`dotThreshold`, which no longer exist anywhere in
the codebase — confirmed by grep) — same stale-spec situation Phase
2's brief already documented for spec 30. This brief does the same
for spec 29 and updates both spec status headers (doc-sync, the
recurring CRITIQUE.md "Engine doc-drift is chronic" pattern) instead
of re-shipping work that's already live.

**What's actually missing**, and what this phase ships: Phase 33b
("Enemy archetypes... CAUTERIZE / Premise-shed / SWAY-cleanse
enemies," deps: 33a) needs enemy counterplay hooks against the two
alt-win tracks (SWAY→CAPITULATE, Premise→CONCEDE) that the existing
WS9 payload vocabulary doesn't cover. CAUTERIZE (purge/stanch DoT)
already works via the shipped `enemyCleanse` field — no new hook
needed. Premise-shed and SWAY-cleanse have no hook at all: only
`CombatThreatEffect.enemyCleanse` (shed the enemy's OWN afflictions)
exists; nothing lets an authored threat action touch the player's
`premises` tally or the enemy's own `sway` value. This phase adds
those two hooks, mirroring `enemyCleanse`'s shape and guardrails, so
33b can author enemies against them without also inventing engine
plumbing mid-content-pass. **Hook only — no bestiary authoring**
(that's explicitly 33b's "teach 2-3 mid/late enemies per class" job)
and **no variable-rung telegraphs** (also 33b, per the build-plan row
text; unrelated to this hook).

Reviewed with `mechanics-expert` before implementation (in lieu of a
separate `/plan-a-phase` pass — noted here per that review's process
flag): go, with two corrections folded in below — `deriveIntentType`
must classify these as `debuff` (not fall through to `pass`), and the
sway hook must never touch the milestone-fired flags, only the raw
counter.

## Current state (verified in code)

- `CombatThreatEffect` (`combat.encounter.types.ts` ~line 224): the
  effect payload on any threat action, branch or linear. Existing
  optional fields: `damage`, `effectId`/`intensity`/`duration`,
  `enemyHeal`, `enemyCleanse`. Applied inline in `resolveThreatPhase`
  (`combat.engine.ts` ~line 3230-3330), one `if` block per field, all
  guarded by `!doubtId` (DOUBT strips riders for the phase it bends).
- `enemyCleanse` guardrails (the precedent to mirror): telegraphed
  (branch UI, or just visible in the linear timeline like any other
  phase), sheds a **fraction, never the last** (`Math.min(n,
  cleansable.length - 1)`), and its "cooldown" is structural — it
  only fires as often as the authored phase carrying it recurs in the
  enemy's threat-sequence loop. No separate cooldown counter exists
  or is needed.
- `state.sway` (live SWAY value, decays 1/turn, capitulate triggers
  at `capitulateThreshold(enemy)`) plus
  `swayMilestoneWaveringFired`/`swayMilestoneFalteringFired` (one-way
  milestone flags, paid a dividend once each, never reset mid-combat
  — `combat.engine.ts` ~1143-1181). The milestone flags must stay
  untouched by a cleanse; only the raw `sway` number moves.
- `state.premises` (live, spendable tally; resets on Peroration
  payoff or CONCEDE) vs `premisesThisCombat` (lifetime counter for
  milestone drip, never resets) — separate fields
  (`combat.encounter.types.ts` ~696-700). CONCEDE fires at
  `concedeFloorFor(enemy.difficulty)` (8/10/12). Shed only the
  spendable `premises`; never touch `premisesThisCombat`.
- `deriveIntentType` (`combat.threat.ts` line 171): classifies a
  phase's telegraph icon. `enemyCleanse` currently reads as a
  self-serving `buff` (via `hasBuff`); a debuff on the PLAYER's
  win-progress is the opposite category and must route through
  `effectIsDebuff`/`hasDebuff` instead, or an unrecognized-field phase
  silently derives `pass` — telling the player a stripping phase does
  nothing.
- `let sway = state.sway ?? 0` is currently declared AFTER the
  effect-application loop (line ~3394, for the unrelated
  `mirror-of-longing` SWAY-on-block card interaction); the loop
  itself starts around line 3230. `premises` has no local inside this
  function today.

## Outputs

```
axiomancer-mechanics/src/Combat/combat.encounter.types.ts
  + CombatThreatEffect.swayCleanse?: number
  + CombatThreatEffect.premiseShed?: number
  + CombatEvent 'threat-sway-cleansed' | 'threat-premise-shed'
axiomancer-mechanics/src/Combat/combat.engine.ts
  ~ resolveThreatPhase: hoist `sway`/milestone-flag locals above the
    effect loop (was declared after it, for mirror-of-longing only);
    add premises local; two new effect-application blocks mirroring
    enemyCleanse's shape and site
axiomancer-mechanics/src/Combat/combat.threat.ts
  ~ effectIsDebuff: also true when swayCleanse or premiseShed > 0
  ~ deriveIntentType: drop enemyCleanse from hasBuff (it now correctly
    routes through hasDebuff via effectIsDebuff — a self-cleanse of
    the enemy's OWN afflictions is still, per this correction, telegraphed
    as harming the PLAYER's progress since it erases their invested
    DoT work; the "buff" framing was the pre-existing bug the review
    surfaced, fixed in the same pass since deriveIntentType is touched
    anyway and shipping a known-wrong classification alongside two new
    correct ones would be worse, not neutral)
axiomancer-mechanics/src/Combat/index.ts, src/index.ts
  ~ no new public functions; CombatThreatEffect/CombatEvent already
    exported wholesale, fields are additive-only
axiomancer-mechanics/src/Combat/e2e/reactive-counterplay-hooks.engine.test.ts
  + new hermetic e2e (pattern: turnabout-ledger.engine.test.ts's direct
    resolveThreatPhase harness — a single custom CombatThreatPhase on a
    hand-built state, no bestiary authoring)
axiomancer-mechanics/specs/29-reactive-enemies-telegraphed-intent.md
  ~ status header: point at WS9 (shipped) instead of "Draft - handoff"
axiomancer-mechanics/specs/30-projected-lethality-readout.md
  ~ status header: point at projectCombatOutcome + wall-math (shipped)
```

## Decisions made upfront — DO NOT ASK

- **`deriveIntentType`'s existing `enemyCleanse` -> `buff` mapping is
  corrected to `debuff` in the same pass.** It was already wrong
  before this phase (a phase that erases the player's invested DoT
  stacks is not "self-serving" from the player's read — spec 29's own
  framing calls it counterplay the player must "race or answer," not
  a benign enemy action); fixing it is in-scope because
  `deriveIntentType` is touched anyway for the two new fields, and
  the alternative (three field-checks with two different, arbitrary
  category rules) is worse. `enemyHeal` alone still correctly reads
  as `buff` — untouched.
- **No new cooldown field.** `enemyCleanse`'s only rate-limit is
  "however often the authored phase recurs" — `swayCleanse` and
  `premiseShed` inherit the identical mechanism for free by using the
  same `CombatThreatEffect` payload site. A 33b author who wants a
  gentler cadence authors the hook on a less-frequent phase; that's a
  content decision, not an engine one.
- **Flat "subtract N, floor 0" for both, not a fraction-of-current
  formula.** `enemyCleanse`'s "fraction, never the last" guardrail
  exists because afflictions are a *list* (removing all of them ends
  the DoT engine outright — an unrecoverable table-flip). `sway` and
  `premises` are scalars racing toward a fixed threshold
  (`capitulateThreshold`/`concedeFloorFor`); flooring at 0 is already
  the maximum possible bite (never negative, never "more gone than
  exists"), and a flat authored amount is the same shape as every
  other authored magnitude on `CombatThreatEffect` (`damage`,
  `intensity`, `enemyHeal`). The *size* of that amount for any given
  enemy is a balance call 33b's authoring pass and `/deck-tuning`
  make per-instance, not a value this hook prescribes.
- **`swayCleanse` never touches
  `swayMilestoneWaveringFired`/`swayMilestoneFalteringFired`.** Those
  flags gate one-time dividends already paid out; un-firing them would
  let a single cleanse claw back a reward the player already banked,
  which is a strictly worse (and un-telegraphed) hit than losing SWAY
  progress itself. Only the raw `sway` number moves.
- **`premiseShed` never touches `premisesThisCombat`.** That counter
  feeds Oratory's milestone drip (Phase 32 part 4b) and is documented
  as lifetime/non-resetting; shedding it would silently invalidate a
  different theme's already-paid milestones. Only the spendable
  `premises` tally moves.
- **No bestiary authoring, no `ThreatBranchCondition` changes.** Both
  new fields live on the existing (non-closed) `CombatThreatEffect`
  type, usable on any threat phase, branch or linear — no need to
  extend the WS9.1-ratified closed condition union at all. Authoring
  concrete enemies (CAUTERIZE/Premise-shed/SWAY-cleanse) is Phase
  33b's explicit scope.
- **Spec 29/30 status headers get a corrective note, not a full
  rewrite.** Same treatment Phase 2's brief already gave spec 30 —
  point future readers at the shipping code and the superseding
  architecture change, don't re-litigate every open question against
  a doc that's importing a combat model the codebase no longer has.

## Application logic (locked)

In `resolveThreatPhase`, hoist the sway locals above the effect loop
(next to the existing `let player = state.player; let enemy =
state.enemy;` block ~line 3174) and add `let premises = state.premises
?? 0;` alongside. Inside the per-effect loop, immediately after the
existing `enemyCleanse` block (~line 3314-3329), add:

```ts
if (eff.swayCleanse && eff.swayCleanse > 0 && !doubtId) {
    const before = sway;
    sway = Math.max(0, sway - eff.swayCleanse);
    if (sway < before) {
        events.push({ kind: 'threat-sway-cleansed', phaseIndex: phase.index, amount: before - sway });
    }
}
if (eff.premiseShed && eff.premiseShed > 0 && !doubtId) {
    const before = premises;
    premises = Math.max(0, premises - eff.premiseShed);
    if (premises < before) {
        events.push({ kind: 'threat-premise-shed', phaseIndex: phase.index, amount: before - premises });
    }
}
```

Remove the now-duplicate `let sway = state.sway ?? 0;` /
`swayMilestoneWaveringFired`/`swayMilestoneFalteringFired`
declarations at ~line 3394 (keep the `mirror-of-longing` block
unchanged — it now mutates the hoisted `sway`, same as before, just
declared earlier). Add `premises` to the `next: CombatEncounterState =
{ ...state, ... }` object build (~line 3447) alongside the existing
`sway` field.

`CombatEvent` additions (`combat.encounter.types.ts`, next to
`'threat-cleansed'`):

```ts
| { kind: 'threat-sway-cleansed'; phaseIndex: number; amount: number }
| { kind: 'threat-premise-shed'; phaseIndex: number; amount: number }
```

`combat.threat.ts`:

```ts
function effectIsDebuff(eff: CombatThreatEffect): boolean {
    return !!eff.effectId || (eff.swayCleanse ?? 0) > 0 || (eff.premiseShed ?? 0) > 0;
}

export function deriveIntentType(effects: readonly CombatThreatEffect[]): CombatIntentType {
    const hasDamage = effects.some(e => (e.damage ?? 0) > 0);
    const hasDebuff = effects.some(effectIsDebuff);
    const hasBuff = effects.some(e => (e.enemyHeal ?? 0) > 0);
    // (enemyCleanse dropped from hasBuff — see brief's deriveIntentType decision)
    const active = [hasDamage, hasDebuff, hasBuff].filter(Boolean).length;
    if (active === 0) return 'pass';
    if (active >= 2) return 'combo';
    if (hasDamage) return 'damage';
    if (hasDebuff) return 'debuff';
    return 'buff';
}
```

No mobile changes: `IntentIcon.tsx`/`combat-encounter.engine.ts`
already render intent purely off `intentType` + the generic branch
`description` text — an authored `threatAction.description` like
"shakes off your resolve" carries the new hooks' flavor without any
new component code.

## Tests

New file `reactive-counterplay-hooks.engine.test.ts`, following
`turnabout-ledger.engine.test.ts`'s direct-`resolveThreatPhase`
pattern (hand-built `CombatThreatPhase`, no bestiary authoring):

- `swayCleanse` on a fired phase reduces `state.sway` by the
  authored amount, floored at 0 (test both: enough sway that it
  floors above 0, and less sway than the authored amount so it floors
  at exactly 0).
- `swayCleanse` does NOT reset `swayMilestoneWaveringFired` /
  `swayMilestoneFalteringFired` when they were already true going in.
- `premiseShed` on a fired phase reduces `state.premises` by the
  authored amount, floored at 0 (same two cases).
- `premiseShed` does NOT reduce `premisesThisCombat`.
- A phase hindered (denied/DOUBT) does NOT apply either hook (mirrors
  `enemyCleanse`'s existing `!doubtId` guard — assert via a DOUBT-
  carrying enemy state).
- `deriveIntentType` returns `'debuff'` for an effects array carrying
  only `swayCleanse`, only `premiseShed`, and (regression) confirms
  `enemyCleanse`-only now also returns `'debuff'` (was `'buff'` before
  this phase — the corrected mapping).
- `threat-sway-cleansed` / `threat-premise-shed` events land in
  `state.log` with the correct `amount` when either hook fires, and
  are absent when the authored amount is 0 or the field is undefined.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

type-check + type-check:tests + lint + vitest + build. `CombatThreatEffect`
and `CombatEvent` are both re-exported wholesale from `src/index.ts` —
additive fields can't break either downstream consumer, but per hard
rule 7 (public-surface change) run the sanity check anyway:

```bash
npm run type-check --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
```

## Deploy gate

```bash
npm run deploy:check
```

CI-green. Touches `axiomancer-mechanics/**` only (plus two spec doc
files) -> `verify-mechanics.yml` (+ path-filtered gates).

## Git

```bash
git add axiomancer-mechanics/src/Combat/combat.encounter.types.ts \
        axiomancer-mechanics/src/Combat/combat.engine.ts \
        axiomancer-mechanics/src/Combat/combat.threat.ts \
        axiomancer-mechanics/src/Combat/e2e/reactive-counterplay-hooks.engine.test.ts \
        axiomancer-mechanics/specs/29-reactive-enemies-telegraphed-intent.md \
        axiomancer-mechanics/specs/30-projected-lethality-readout.md
git commit -m "$(cat <<'EOF'
feat(mechanics): sway/premise counterplay hooks — phase 33a

- add CombatThreatEffect.swayCleanse / .premiseShed: authored threat
  phases can now shed the player's live SWAY or spendable Premise
  tally, mirroring enemyCleanse's shape (flat amount, floored at 0,
  gated by the existing !doubtId rider check)
- neither hook touches SWAY milestone-fired flags or premisesThisCombat
  (both are one-way/lifetime; only the live counters move)
- correct deriveIntentType: enemyCleanse (and the two new hooks) now
  telegraph as 'debuff', not 'buff' — erasing the player's invested
  DoT/SWAY/Premise progress is not a self-serving enemy action
- doc-sync: specs 29/30 status headers point at the shipping code
  (WS9 threat-branch, projectCombatOutcome/wall-math) instead of a
  stale pre-VITAE-funnel draft

Decisions:
- build-plan Phase 33a's literal scope ("one reactive verb
  engine-wide + lethality readout") is already shipped via WS9
  (spec 32 §12 item 7) and Phase 2/28 — re-scoped to the actual gap
  Phase 33b needs: engine hooks for premise-shed/sway-cleanse enemy
  counterplay (CAUTERIZE already works via the existing enemyCleanse)
- hook-only, no bestiary authoring or variable-rung telegraph work —
  both explicitly Phase 33b's job
- reviewed the re-scope + guardrails with mechanics-expert before
  implementation in lieu of a standalone /plan-a-phase pass (noted
  per that review's process flag); go with two corrections folded
  in (debuff classification, milestone-flag isolation)
EOF
)"
git push origin main
```

## DoD

Flip Phase 33a `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append
the commit hash. Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 33a shipped — sway/premise counterplay hooks"
git push origin main
```

## Confirm deploy

```bash
npm run deploy:check
```

Iterate to green per the skill failure-mode rules.

## Follow-ups (out of scope this phase)

- Phase 33b: author 2-3 mid/late enemies each for CAUTERIZE (existing
  `enemyCleanse`), Premise-shed (`premiseShed`), and SWAY-cleanse
  (`swayCleanse`) into `combat.threat-sequences.ts`, plus the
  variable-rung telegraph work (`THREAT_RUNGS` is still a flat
  2/boss-3 constant — 1-4 authored rungs per phase is unbuilt).
- Balance tuning of the specific `swayCleanse`/`premiseShed` magnitude
  per enemy — a `/deck-tuning` / 33b-authoring concern, not this
  hook's.
- Spec 29 Q1/Q2/Q5/Q6 (Harden/Enrage/Adapt-stance abilities, telegraph
  timing beyond what WS9 already does) — unaddressed; WS9 ships a
  strict subset (spec 29's own §4 Q1 candidate set) and nothing here
  expands that set.
